package com.example.Tender.officer.service;

import com.example.Tender.officer.dto.*;
import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerEmailOtp;
import com.example.Tender.officer.model.OfficerRole;
import com.example.Tender.officer.model.OfficerTempRegistration;
import com.example.Tender.officer.model.OfficerVerificationStatus;
import com.example.Tender.officer.provider.DigiLockerProvider;
import com.example.Tender.officer.repository.OfficerEmailOtpRepository;
import com.example.Tender.officer.repository.OfficerRepository;
import com.example.Tender.officer.repository.OfficerTempRegistrationRepository;
import com.example.Tender.officer.security.jwt.OfficerJwtUtils;
import com.example.Tender.officer.security.service.OfficerPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OfficerAuthService {

    private final OfficerRepository officerRepository;
    private final OfficerTempRegistrationRepository tempRegistrationRepository;
    private final OfficerEmailOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final OfficerJwtUtils officerJwtUtils;
    private final BrevoEmailService brevoEmailService;
    private final DigiLockerProvider digiLockerProvider;

    @Value("${app.otp.expiration-minutes:10}")
    private int otpExpirationMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * STEP 1: TEMPORARY REGISTRATION
     * Validates input, saves pending details in OfficerTempRegistration with hashed password.
     * Does NOT create permanent Officer and does NOT send email OTP yet.
     */
    @Transactional
    public DigiLockerInitiateResponse signup(OfficerSignupRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedMobile = request.getMobile().trim();

        // 1. Check for duplicate email in permanent repository
        if (officerRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Error: Email is already registered and verified!");
        }

        // 2. Check for duplicate mobile in permanent repository
        if (officerRepository.existsByMobile(normalizedMobile)) {
            throw new IllegalArgumentException("Error: Mobile number is already registered!");
        }

        // 3. Clear any previous unverified temp registration for this email
        tempRegistrationRepository.deleteByEmail(normalizedEmail);

        // 4. Generate unique state token for DigiLocker verification binding
        String tempToken = UUID.randomUUID().toString().replace("-", "");

        // 5. Store pending signup in OfficerTempRegistration (without role/verificationStatus from client)
        OfficerTempRegistration tempRegistration = OfficerTempRegistration.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .mobile(normalizedMobile)
                .password(passwordEncoder.encode(request.getPassword()))
                .tempToken(tempToken)
                .identityVerified(false)
                .expiryTime(LocalDateTime.now().plusMinutes(30))
                .build();

        tempRegistrationRepository.save(tempRegistration);

        // 6. Build DigiLocker verification URL from the DigiLocker provider
        String authUrl = digiLockerProvider.generateVerificationUrl(tempToken);

        return DigiLockerInitiateResponse.builder()
                .tempToken(tempToken)
                .authorizationUrl(authUrl)
                .message("Signup details saved. Please complete DigiLocker identity verification to proceed.")
                .build();
    }

    /**
     * STEP 3 (Initiate): INITIATE DIGILOCKER VERIFICATION
     */
    public DigiLockerInitiateResponse initiateIdentityVerification(OfficerIdentityInitiateRequest request) {
        OfficerTempRegistration temp = tempRegistrationRepository.findByTempToken(request.getTempToken())
                .orElseThrow(() -> new IllegalArgumentException("Error: Invalid or expired temporary token"));

        if (temp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: Temporary registration session has expired. Please signup again.");
        }

        if (temp.isIdentityVerified()) {
            throw new IllegalStateException("Error: Identity for this temporary registration has already been verified.");
        }

        String authUrl = digiLockerProvider.generateVerificationUrl(request.getTempToken());

        return DigiLockerInitiateResponse.builder()
                .tempToken(request.getTempToken())
                .authorizationUrl(authUrl)
                .message("DigiLocker verification initiated. Navigate to authorization URL.")
                .build();
    }

    /**
     * STEP 4: MOCK DIGILOCKER IDENTITY RESPONSE & MATCHING
     * Compares the name in OfficerTempRegistration with the DigiLocker identity.
     * On match: marks identityVerified = true in OfficerTempRegistration.
     * Does NOT send Email OTP yet.
     */
    @Transactional
    public OfficerIdentityResponse verifyMockIdentity(OfficerMockVerifyRequest request) {
        OfficerTempRegistration temp = tempRegistrationRepository.findByTempToken(request.getTempToken())
                .orElseThrow(() -> new IllegalArgumentException("Error: Invalid or expired temporary token."));

        if (temp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: Temporary registration session has expired. Please restart signup.");
        }

        if (temp.isIdentityVerified()) {
            throw new IllegalStateException("Error: Identity for this registration has already been verified.");
        }

        // Check for simulated failure flag for SIH testing
        if (Boolean.TRUE.equals(request.getSimulateFailure())) {
            throw new IllegalStateException("DigiLocker identity verification failed: Identity provider rejected verification.");
        }

        // Fetch identity from Provider
        DigiLockerProvider.DigiLockerIdentity providerIdentity = digiLockerProvider.fetchIdentity(
                request.getTempToken(),
                request.getAuthCode()
        );

        // Allow tester override for simulation if provided
        String verifiedName = StringUtils.hasText(request.getSimulatedName())
                ? request.getSimulatedName().trim()
                : providerIdentity.fullName();

        String digilockerId = StringUtils.hasText(request.getSimulatedDigilockerId())
                ? request.getSimulatedDigilockerId().trim()
                : providerIdentity.digilockerId();

        // Identity Matching (Case-insensitive, trimmed name comparison)
        String signupNameNormalized = temp.getName().trim().replaceAll("\\s+", " ").toLowerCase();
        String verifiedNameNormalized = verifiedName.trim().replaceAll("\\s+", " ").toLowerCase();

        boolean isNameMatched = signupNameNormalized.equals(verifiedNameNormalized);

        if (!isNameMatched) {
            log.warn("Identity mismatch: Signup name '{}' does not match DigiLocker verified name '{}'",
                    temp.getName(), verifiedName);
            temp.setIdentityVerified(false);
            temp.setIdentityVerifiedAt(null);
            tempRegistrationRepository.save(temp);
            throw new IllegalArgumentException("Identity verification failed: DigiLocker name ('"
                    + verifiedName + "') does not match signup name ('" + temp.getName() + "').");
        }

        // Set verified attributes on OfficerTempRegistration
        temp.setIdentityVerified(true);
        temp.setDigilockerId(digilockerId);
        temp.setIdentityProvider(providerIdentity.identityProvider());
        temp.setIdentityVerifiedAt(LocalDateTime.now());
        tempRegistrationRepository.save(temp);

        // FIX 1: Automatically generate and send Email OTP upon successful identity verification
        generateAndSendEmailOtp(temp.getEmail(), temp.getName());

        return OfficerIdentityResponse.builder()
                .identityVerified(true)
                .identityProvider(temp.getIdentityProvider())
                .digilockerId(temp.getDigilockerId())
                .verifiedName(verifiedName)
                .tempToken(temp.getTempToken())
                .identityVerifiedAt(temp.getIdentityVerifiedAt())
                .build();
    }

    /**
     * STEP 6: Verify OTP and create final permanent Officer
     */
    @Transactional
    public OfficerAuthResponse verifyOtp(OfficerVerifyOtpRequest request) {
        // 1. Normalize email
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String enteredOtp = request.getOtp().trim();

        // Guard: Reject if email is already registered in permanent Officer database (Fix 2 - no JWT bypass)
        if (officerRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Error: Email is already registered.");
        }

        // 2 & 3. Fetch pending temporary registration and check existence
        OfficerTempRegistration temp = tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No pending signup found for " + normalizedEmail + ". Please signup first."));

        // 4. Check if temporary registration session has expired
        if (temp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: Temporary registration session has expired. Please restart signup.");
        }

        // 5. Guard: Ensure DigiLocker identity verification was completed
        if (!temp.isIdentityVerified()) {
            throw new IllegalArgumentException("Error: DigiLocker identity verification must be completed before email OTP can be verified!");
        }

        // 6 & 7. Find latest unverified OTP and check existence
        OfficerEmailOtp activeOtp = otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No active OTP found for this email. Please request a new OTP."));

        // 8. Check OTP expiration
        if (activeOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: OTP has expired. Please request a new OTP.");
        }

        // 9 & 10. Compare submitted OTP and reject if incorrect
        if (!activeOtp.getOtp().equals(enteredOtp)) {
            throw new IllegalArgumentException("Error: Invalid OTP entered!");
        }

        // 11. Mark OTP as verified
        activeOtp.setVerified(true);
        otpRepository.save(activeOtp);

        // 12. Create Permanent Officer Entity
        Officer officer = Officer.builder()
                .name(temp.getName())
                .email(temp.getEmail())
                .mobile(temp.getMobile())
                .password(temp.getPassword()) // already hashed
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.VERIFIED)
                .digilockerId(temp.getDigilockerId())
                .identityProvider(temp.getIdentityProvider())
                .identityVerifiedAt(temp.getIdentityVerifiedAt())
                .build();

        // 13. Save Officer
        Officer savedOfficer = officerRepository.save(officer);

        // 14 & 15. Safe cleanup of temporary records
        tempRegistrationRepository.delete(temp);
        otpRepository.deleteByEmail(normalizedEmail);

        // 16. Generate JWT authentication token
        String token = officerJwtUtils.generateTokenFromUsername(savedOfficer.getEmail());

        // 17. Return successful OfficerAuthResponse
        return OfficerAuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(savedOfficer.getId())
                .name(savedOfficer.getName())
                .email(savedOfficer.getEmail())
                .mobile(savedOfficer.getMobile())
                .role(savedOfficer.getRole())
                .verificationStatus(savedOfficer.getVerificationStatus())
                .message("Registration completed successfully! Officer account created and verified.")
                .build();
    }

    /**
     * Resends email OTP ONLY IF DigiLocker identity verification is completed.
     */
    @Transactional
    public String resendOtp(OfficerResendOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (officerRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Error: Account is already verified and registered in the main database!");
        }

        OfficerTempRegistration temp = tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No pending signup found for " + normalizedEmail + ". Please initiate signup first."));

        if (!temp.isIdentityVerified()) {
            throw new IllegalStateException("Error: Cannot send email OTP. Please complete DigiLocker identity verification first.");
        }

        generateAndSendEmailOtp(temp.getEmail(), temp.getName());
        return "A fresh OTP has been sent to " + normalizedEmail;
    }

    /**
     * Authenticates an existing officer via Email/Mobile and Password.
     */
    public OfficerAuthResponse login(OfficerLoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmailOrMobile().trim(),
                            request.getPassword()
                    )
                    );

            OfficerPrincipal officerPrincipal = (OfficerPrincipal) authentication.getPrincipal();

            if (officerPrincipal.getVerificationStatus() == OfficerVerificationStatus.REJECTED) {
                throw new IllegalArgumentException("Account verification was rejected. Please contact administrator.");
            }

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = officerJwtUtils.generateJwtToken(authentication);

            return OfficerAuthResponse.builder()
                    .token(jwt)
                    .type("Bearer")
                    .id(officerPrincipal.getId())
                    .name(officerPrincipal.getName())
                    .email(officerPrincipal.getEmail())
                    .mobile(officerPrincipal.getMobile())
                    .role(officerPrincipal.getRole())
                    .verificationStatus(officerPrincipal.getVerificationStatus())
                    .message("Officer logged in successfully!")
                    .build();
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid email/mobile or password");
        }
    }

    private void generateAndSendEmailOtp(String email, String name) {
        String otp = String.format("%06d", secureRandom.nextInt(1000000));

        OfficerEmailOtp emailOtp = OfficerEmailOtp.builder()
                .email(email)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(otpExpirationMinutes))
                .verified(false)
                .build();

        otpRepository.save(emailOtp);

        brevoEmailService.sendOtpEmail(email, name, otp, otpExpirationMinutes);
    }
}
