package com.example.Tender.officer.service;

import com.example.Tender.officer.dto.*;
import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerEmailOtp;
import com.example.Tender.officer.model.OfficerRole;
import com.example.Tender.officer.model.OfficerTempRegistration;
import com.example.Tender.officer.model.OfficerVerificationStatus;
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
    private final DigiLockerService digiLockerService;

    @Value("${app.otp.expiration-minutes:10}")
    private int otpExpirationMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * PHASE 1: TEMPORARY REGISTRATION
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

        // 4. Generate unique state token for DigiLocker OAuth binding
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

        // 6. Build DigiLocker authorization URL
        String authUrl = digiLockerService.generateAuthorizationUrl(tempToken);

        return DigiLockerInitiateResponse.builder()
                .tempToken(tempToken)
                .authorizationUrl(authUrl)
                .message("Signup details stored. Please proceed with DigiLocker identity verification to continue registration.")
                .build();
    }

    /**
     * PHASE 2: DIGILOCKER IDENTITY VERIFICATION & PHASE 3: TRIGGER EMAIL OTP
     * Validates authorization code with DigiLocker, updates temp registration, and sends email OTP.
     */
    @Transactional
    public OfficerAuthResponse processDigiLockerCallback(String code, String state) {
        // 1. Locate temporary registration using secure state token
        OfficerTempRegistration temp = tempRegistrationRepository.findByTempToken(state)
                .orElseThrow(() -> new IllegalArgumentException("Error: Invalid or expired DigiLocker verification session."));

        if (temp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: Temporary registration session has expired. Please restart signup.");
        }

        // 2. Validate authorization code and extract verified identity from DigiLocker
        DigiLockerService.DigiLockerIdentity identity = digiLockerService.processAuthorizationCallback(code, state);

        // 3. Update OfficerTempRegistration with verified identity metadata
        temp.setIdentityVerified(true);
        temp.setDigilockerId(identity.digilockerId());
        temp.setIdentityProvider(identity.identityProvider());
        temp.setIdentityVerifiedAt(identity.verifiedAt());
        tempRegistrationRepository.save(temp);

        // 4. PHASE 3: Send Email OTP ONLY after successful DigiLocker verification
        generateAndSendEmailOtp(temp.getEmail(), temp.getName());

        return OfficerAuthResponse.builder()
                .name(temp.getName())
                .email(temp.getEmail())
                .mobile(temp.getMobile())
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.PENDING)
                .message("DigiLocker identity verified successfully! An OTP has been sent to " + temp.getEmail() + " for final email verification.")
                .build();
    }

    /**
     * PHASE 4: VERIFY EMAIL OTP & PHASE 5: CREATE FINAL OFFICER & PHASE 6: SAFE CLEANUP
     * Validates OTP, creates permanent Officer account, and safely deletes temporary/OTP data.
     */
    @Transactional
    public OfficerAuthResponse verifyOtp(OfficerVerifyOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String enteredOtp = request.getOtp().trim();

        // 1. Check if already permanent & verified
        if (officerRepository.existsByEmail(normalizedEmail)) {
            Officer existing = officerRepository.findByEmail(normalizedEmail).orElseThrow();
            String token = officerJwtUtils.generateTokenFromUsername(existing.getEmail());
            return OfficerAuthResponse.builder()
                    .token(token)
                    .type("Bearer")
                    .id(existing.getId())
                    .name(existing.getName())
                    .email(existing.getEmail())
                    .mobile(existing.getMobile())
                    .role(existing.getRole())
                    .verificationStatus(existing.getVerificationStatus())
                    .message("Officer is already verified and registered.")
                    .build();
        }

        // 2. Fetch pending temporary registration
        OfficerTempRegistration temp = tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No pending signup found for " + normalizedEmail + ". Please signup first."));

        // 3. Guard: Ensure DigiLocker identity verification was completed
        if (!temp.isIdentityVerified()) {
            throw new IllegalStateException("Error: DigiLocker identity verification must be completed before email OTP can be verified!");
        }

        // 4. Find latest unverified OTP
        OfficerEmailOtp activeOtp = otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No active OTP found for this email. Please request a new OTP."));

        // 5. Check OTP expiration
        if (activeOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: OTP has expired. Please request a new OTP.");
        }

        // 6. Check OTP match
        if (!activeOtp.getOtp().equals(enteredOtp)) {
            throw new IllegalArgumentException("Error: Invalid OTP entered!");
        }

        // 7. Mark OTP as verified
        activeOtp.setVerified(true);
        otpRepository.save(activeOtp);

        // 8. PHASE 5: Create Permanent Officer Entity
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

        Officer savedOfficer = officerRepository.save(officer);

        // 9. PHASE 6: Atomic safe cleanup of temporary records
        tempRegistrationRepository.delete(temp);
        otpRepository.deleteByEmail(normalizedEmail);

        // 10. Generate JWT authentication token
        String token = officerJwtUtils.generateTokenFromUsername(savedOfficer.getEmail());

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
