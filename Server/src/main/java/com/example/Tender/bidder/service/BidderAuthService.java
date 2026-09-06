package com.example.Tender.bidder.service;

import com.example.Tender.bidder.dto.*;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.entity.BidderEmailOtp;
import com.example.Tender.bidder.entity.BidderTempRegistration;
import com.example.Tender.bidder.entity.BidderVerification;
import com.example.Tender.bidder.exception.*;
import com.example.Tender.bidder.provider.MockBusinessVerificationProvider;
import com.example.Tender.bidder.repository.BidderEmailOtpRepository;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.repository.BidderTempRegistrationRepository;
import com.example.Tender.bidder.repository.BidderVerificationRepository;
import com.example.Tender.bidder.security.BidderPrincipal;
import com.example.Tender.bidder.security.service.jwt.BidderJwtUtils;
import com.example.Tender.officer.service.BrevoEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BidderAuthService {

    private final BidderRepository bidderRepository;
    private final BidderTempRegistrationRepository tempRegistrationRepository;
    private final BidderEmailOtpRepository otpRepository;
    private final BidderVerificationRepository bidderVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final BidderJwtUtils bidderJwtUtils;
    private final BrevoEmailService brevoEmailService;
    private final MockBusinessVerificationProvider businessVerificationProvider;

    @Value("${app.otp.expiration-minutes:10}")
    private int otpExpirationMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * STEP 1: INITIATE SIGNUP & VERIFY AGAINST DATABASE
     * Checks bidder_verification table for legalName, email, and gstNumber.
     * On match: saves in BidderTempRegistration, marks verified, and dispatches Brevo Email OTP.
     * On mismatch: rejects with invalid credentials error.
     */
    @Transactional
    public BidderInitiateResponse signup(BidderSignupRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedGst = request.getGstNumber().trim().toUpperCase();
        String normalizedName = request.getLegalName().trim();
        String derivedPan = (normalizedGst.length() >= 12) ? normalizedGst.substring(2, 12) : normalizedGst;

        // 1. Verify against pre-verified government bidder_verification table
        Optional<BidderVerification> verificationRecord = bidderVerificationRepository.findByNameAndEmailAndGstNumberIgnoreCase(
                normalizedName,
                normalizedEmail,
                normalizedGst
        );

        if (verificationRecord.isEmpty()) {
            Optional<BidderVerification> byGst = bidderVerificationRepository.findByGstNumberIgnoreCase(normalizedGst);
            Optional<BidderVerification> byEmail = bidderVerificationRepository.findByEmailIgnoreCase(normalizedEmail);

            if (byGst.isEmpty() && byEmail.isEmpty()) {
                throw new BidderVerificationException("Invalid credentials: No verified bidder record found for GST '" + normalizedGst + "' or Email '" + normalizedEmail + "'.");
            } else if (byGst.isPresent() && !byGst.get().getEmail().equalsIgnoreCase(normalizedEmail)) {
                throw new BidderVerificationException("Invalid credentials: Email does not match the registered GST record.");
            } else {
                throw new BidderVerificationException("Invalid credentials: Legal name '" + normalizedName + "' does not match the registered bidder name for this GST/Email.");
            }
        }

        // 2. Check for duplicates in permanent repository
        if (bidderRepository.existsByEmail(normalizedEmail)) {
            throw new BidderAlreadyExistsException("Error: Email is already registered and verified!");
        }
        if (bidderRepository.existsByGstNumber(normalizedGst)) {
            throw new BidderAlreadyExistsException("Error: GSTIN is already registered!");
        }

        // 3. Clear any previous unverified temp registration for this email
        tempRegistrationRepository.deleteByEmail(normalizedEmail);

        // 4. Generate unique temporary token
        String tempToken = UUID.randomUUID().toString().replace("-", "");

        // 5. Save in BidderTempRegistration (Verified via government bidder_verification database)
        BidderTempRegistration tempRegistration = BidderTempRegistration.builder()
                .tempToken(tempToken)
                .legalName(verificationRecord.get().getName())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .panNumber(derivedPan)
                .gstNumber(normalizedGst)
                .panVerified(true)
                .gstVerified(true)
                .udyamVerified(true)
                .panVerifiedAt(LocalDateTime.now())
                .gstVerifiedAt(LocalDateTime.now())
                .expiryTime(LocalDateTime.now().plusMinutes(30))
                .build();

        tempRegistrationRepository.save(tempRegistration);

        // 6. Automatically dispatch Brevo Email OTP to verified email
        generateAndSendEmailOtp(normalizedEmail, tempRegistration.getLegalName());

        return BidderInitiateResponse.builder()
                .tempToken(tempToken)
                .email(normalizedEmail)
                .legalName(tempRegistration.getLegalName())
                .gstNumber(normalizedGst)
                .message("Bidder verified successfully against government records! Verification OTP sent to " + normalizedEmail)
                .build();
    }

    /**
     * STEP 2a: VERIFY PAN
     */
    @Transactional
    public BidderVerificationStatusResponse verifyPan(BidderVerifyPanRequest request) {
        BidderTempRegistration temp = getValidTempRegistration(request.getTempToken());

        String panToVerify = StringUtils.hasText(request.getPanNumber()) ? request.getPanNumber().trim().toUpperCase() : temp.getPanNumber();

        MockBusinessVerificationProvider.PanVerificationResult result = businessVerificationProvider.verifyPan(
                panToVerify,
                temp.getLegalName(),
                request.getSimulatedName(),
                request.getSimulateFailure()
        );

        if (!"VALID".equalsIgnoreCase(result.getStatus()) || !result.isNameMatched()) {
            temp.setPanVerified(false);
            temp.setPanVerifiedAt(null);
            tempRegistrationRepository.save(temp);
            throw new BidderVerificationException("PAN verification failed: " + result.getMessage());
        }

        temp.setPanNumber(panToVerify);
        temp.setPanVerified(true);
        temp.setPanVerifiedAt(LocalDateTime.now());
        tempRegistrationRepository.save(temp);

        checkAndTriggerEmailOtp(temp);

        return buildStatusResponse(temp, "PAN verified successfully.");
    }

    /**
     * STEP 2b: VERIFY GSTIN
     */
    @Transactional
    public BidderVerificationStatusResponse verifyGst(BidderVerifyGstRequest request) {
        BidderTempRegistration temp = getValidTempRegistration(request.getTempToken());

        String gstToVerify = StringUtils.hasText(request.getGstNumber()) ? request.getGstNumber().trim().toUpperCase() : temp.getGstNumber();

        MockBusinessVerificationProvider.GstVerificationResult result = businessVerificationProvider.verifyGst(
                gstToVerify,
                temp.getPanNumber(),
                temp.getLegalName(),
                request.getSimulatedName(),
                request.getSimulateFailure()
        );

        if (!"ACTIVE".equalsIgnoreCase(result.getStatus()) || !result.isNameMatched() || !result.isPanConsistent()) {
            temp.setGstVerified(false);
            temp.setGstVerifiedAt(null);
            tempRegistrationRepository.save(temp);
            throw new BidderVerificationException("GSTIN verification failed: " + result.getMessage());
        }

        temp.setGstNumber(gstToVerify);
        temp.setGstVerified(true);
        temp.setGstVerifiedAt(LocalDateTime.now());
        tempRegistrationRepository.save(temp);

        checkAndTriggerEmailOtp(temp);

        return buildStatusResponse(temp, "GSTIN verified successfully.");
    }

    /**
     * STEP 2c: VERIFY UDYAM
     */
    @Transactional
    public BidderVerificationStatusResponse verifyUdyam(BidderVerifyUdyamRequest request) {
        BidderTempRegistration temp = getValidTempRegistration(request.getTempToken());

        String udyamToVerify = StringUtils.hasText(request.getUdyamNumber()) ? request.getUdyamNumber().trim().toUpperCase() : temp.getUdyamNumber();

        if (!StringUtils.hasText(udyamToVerify)) {
            throw new IllegalArgumentException("Error: No Udyam registration number provided to verify.");
        }

        MockBusinessVerificationProvider.UdyamVerificationResult result = businessVerificationProvider.verifyUdyam(
                udyamToVerify,
                temp.getLegalName(),
                request.getSimulatedName(),
                request.getSimulateFailure()
        );

        if (!"VERIFIED".equalsIgnoreCase(result.getStatus()) || !result.isNameMatched()) {
            temp.setUdyamVerified(false);
            temp.setUdyamVerifiedAt(null);
            tempRegistrationRepository.save(temp);
            throw new BidderVerificationException("Udyam verification failed: " + result.getMessage());
        }

        temp.setUdyamNumber(udyamToVerify);
        temp.setUdyamVerified(true);
        temp.setUdyamVerifiedAt(LocalDateTime.now());
        tempRegistrationRepository.save(temp);

        checkAndTriggerEmailOtp(temp);

        return buildStatusResponse(temp, "Udyam registration verified successfully.");
    }

    /**
     * STEP 2 (Unified): VERIFY ALL BUSINESS CREDENTIALS
     * Validates PAN, GST, and Udyam (if present) simultaneously and triggers Email OTP.
     */
    @Transactional
    public BidderVerificationStatusResponse verifyBusiness(BidderVerifyBusinessRequest request) {
        BidderTempRegistration temp = getValidTempRegistration(request.getTempToken());

        // 1. Verify PAN
        MockBusinessVerificationProvider.PanVerificationResult panResult = businessVerificationProvider.verifyPan(
                temp.getPanNumber(),
                temp.getLegalName(),
                request.getSimulatedName(),
                request.getSimulateFailure()
        );
        if (!"VALID".equalsIgnoreCase(panResult.getStatus()) || !panResult.isNameMatched()) {
            throw new BidderVerificationException("PAN verification failed: " + panResult.getMessage());
        }

        // 2. Verify GSTIN
        MockBusinessVerificationProvider.GstVerificationResult gstResult = businessVerificationProvider.verifyGst(
                temp.getGstNumber(),
                temp.getPanNumber(),
                temp.getLegalName(),
                request.getSimulatedName(),
                request.getSimulateFailure()
        );
        if (!"ACTIVE".equalsIgnoreCase(gstResult.getStatus()) || !gstResult.isNameMatched() || !gstResult.isPanConsistent()) {
            throw new BidderVerificationException("GSTIN verification failed: " + gstResult.getMessage());
        }

        // 3. Verify Udyam (if provided)
        if (StringUtils.hasText(temp.getUdyamNumber())) {
            MockBusinessVerificationProvider.UdyamVerificationResult udyamResult = businessVerificationProvider.verifyUdyam(
                    temp.getUdyamNumber(),
                    temp.getLegalName(),
                    request.getSimulatedName(),
                    request.getSimulateFailure()
            );
            if (!"VERIFIED".equalsIgnoreCase(udyamResult.getStatus()) || !udyamResult.isNameMatched()) {
                throw new BidderVerificationException("Udyam verification failed: " + udyamResult.getMessage());
            }
            temp.setUdyamVerified(true);
            temp.setUdyamVerifiedAt(LocalDateTime.now());
        }

        LocalDateTime now = LocalDateTime.now();
        temp.setPanVerified(true);
        temp.setPanVerifiedAt(now);
        temp.setGstVerified(true);
        temp.setGstVerifiedAt(now);
        tempRegistrationRepository.save(temp);

        // Send Email OTP
        generateAndSendEmailOtp(temp.getEmail(), temp.getLegalName());

        return buildStatusResponse(temp, "Business credentials verified successfully. OTP sent to your registered email.");
    }

    /**
     * STEP 3: VERIFY EMAIL OTP & CREATE PERMANENT BIDDER
     */
    @Transactional
    public BidderAuthResponse verifyOtp(BidderVerifyOtpRequest request) {
        final String normalizedEmail;
        if (StringUtils.hasText(request.getEmail())) {
            normalizedEmail = request.getEmail().trim().toLowerCase();
        } else if (StringUtils.hasText(request.getTempToken())) {
            BidderTempRegistration tempReg = tempRegistrationRepository.findByTempToken(request.getTempToken().trim())
                    .orElseThrow(() -> new InvalidTokenException("Error: Invalid or expired temporary token."));
            normalizedEmail = tempReg.getEmail().toLowerCase();
        } else {
            throw new IllegalArgumentException("Error: Email or tempToken is required to verify OTP.");
        }

        String enteredOtp = request.getOtp().trim();

        if (bidderRepository.existsByEmail(normalizedEmail)) {
            throw new BidderAlreadyExistsException("Error: Email is already registered and verified.");
        }

        BidderTempRegistration temp = tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No pending signup found for " + normalizedEmail + ". Please initiate signup first."));

        if (temp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Error: Temporary registration session has expired. Please restart signup.");
        }

        boolean udyamPending = StringUtils.hasText(temp.getUdyamNumber()) && !temp.isUdyamVerified();
        if (!temp.isPanVerified() || !temp.isGstVerified() || udyamPending) {
            throw new IllegalArgumentException("Error: All required business verifications (PAN, GST, and Udyam if provided) must be completed before verifying Email OTP!");
        }

        BidderEmailOtp activeOtp = otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new InvalidOtpException("Error: No active OTP found for this email. Please request a new OTP."));

        if (activeOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new OtpExpiredException("Error: OTP has expired. Please request a new OTP.");
        }

        if (!activeOtp.getOtp().equals(enteredOtp)) {
            throw new InvalidOtpException("Error: Invalid OTP entered!");
        }

        activeOtp.setVerified(true);
        otpRepository.save(activeOtp);

        LocalDateTime now = LocalDateTime.now();

        // Create Permanent Bidder Record
        Bidder bidder = Bidder.builder()
                .legalName(temp.getLegalName())
                .email(temp.getEmail())
                .password(temp.getPassword()) // already hashed
                .phone(temp.getPhone())
                .address(temp.getAddress())
                .panNumber(temp.getPanNumber())
                .gstNumber(temp.getGstNumber())
                .udyamNumber(temp.getUdyamNumber())
                .registrationNumber(temp.getRegistrationNumber())
                .isVerified(true)
                .panVerified(true)
                .gstVerified(true)
                .udyamVerified(temp.isUdyamVerified())
                .emailVerified(true)
                .panVerifiedAt(temp.getPanVerifiedAt())
                .gstVerifiedAt(temp.getGstVerifiedAt())
                .udyamVerifiedAt(temp.getUdyamVerifiedAt())
                .emailVerifiedAt(now)
                .build();

        Bidder savedBidder = bidderRepository.save(bidder);

        // Clean up temporary records
        tempRegistrationRepository.delete(temp);
        otpRepository.deleteByEmail(normalizedEmail);

        // Generate JWT Token
        BidderPrincipal bidderPrincipal = new BidderPrincipal(savedBidder);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                bidderPrincipal,
                null,
                bidderPrincipal.getAuthorities()
        );
        String token = bidderJwtUtils.generateJwtToken(authentication);

        return BidderAuthResponse.builder()
                .token(token)
                .type("Bearer")
                .bidderId(savedBidder.getId())
                .email(savedBidder.getEmail())
                .legalName(savedBidder.getLegalName())
                .phone(savedBidder.getPhone())
                .gstNumber(savedBidder.getGstNumber())
                .isVerified(savedBidder.isVerified())
                .message("Registration completed successfully! Bidder account created and verified.")
                .build();
    }

    /**
     * Resends email OTP if business credentials are verified.
     */
    @Transactional
    public String resendOtp(BidderResendOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (bidderRepository.existsByEmail(normalizedEmail)) {
            throw new BidderAlreadyExistsException("Error: Account is already verified and registered in the main database!");
        }

        BidderTempRegistration temp = tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No pending signup found for " + normalizedEmail + ". Please initiate signup first."));

        boolean udyamPending = StringUtils.hasText(temp.getUdyamNumber()) && !temp.isUdyamVerified();
        if (!temp.isPanVerified() || !temp.isGstVerified() || udyamPending) {
            throw new IllegalStateException("Error: Cannot send email OTP. Please complete all required business verifications (PAN, GST, and Udyam if provided) first.");
        }

        generateAndSendEmailOtp(temp.getEmail(), temp.getLegalName());
        return "A fresh OTP has been sent to " + normalizedEmail;
    }

    /**
     * Bidder Login with verification check.
     */
    public BidderAuthResponse login(BidderLoginRequest request) {
        Bidder bidder = bidderRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), bidder.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!bidder.isVerified()) {
            throw new BidderNotVerifiedException("Account is not verified. Please complete verification.");
        }

        BidderPrincipal bidderPrincipal = new BidderPrincipal(bidder);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                bidderPrincipal,
                null,
                bidderPrincipal.getAuthorities()
        );

        String token = bidderJwtUtils.generateJwtToken(authentication);

        return BidderAuthResponse.builder()
                .token(token)
                .type("Bearer")
                .bidderId(bidder.getId())
                .email(bidder.getEmail())
                .legalName(bidder.getLegalName())
                .phone(bidder.getPhone())
                .gstNumber(bidder.getGstNumber())
                .isVerified(bidder.isVerified())
                .message("Bidder logged in successfully!")
                .build();
    }

    private BidderTempRegistration getValidTempRegistration(String tempToken) {
        BidderTempRegistration temp = tempRegistrationRepository.findByTempToken(tempToken)
                .orElseThrow(() -> new InvalidTokenException("Error: Invalid or expired temporary token."));

        if (temp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Error: Temporary registration session has expired. Please restart signup.");
        }
        return temp;
    }

    private void checkAndTriggerEmailOtp(BidderTempRegistration temp) {
        boolean udyamCheck = !StringUtils.hasText(temp.getUdyamNumber()) || temp.isUdyamVerified();
        if (temp.isPanVerified() && temp.isGstVerified() && udyamCheck) {
            generateAndSendEmailOtp(temp.getEmail(), temp.getLegalName());
        }
    }

    private void generateAndSendEmailOtp(String email, String legalName) {
        String otp = String.format("%06d", secureRandom.nextInt(1000000));

        BidderEmailOtp emailOtp = BidderEmailOtp.builder()
                .email(email)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(otpExpirationMinutes))
                .verified(false)
                .build();

        otpRepository.save(emailOtp);

        brevoEmailService.sendOtpEmail(email, legalName, otp, otpExpirationMinutes);
    }

    private BidderVerificationStatusResponse buildStatusResponse(BidderTempRegistration temp, String message) {
        return BidderVerificationStatusResponse.builder()
                .tempToken(temp.getTempToken())
                .legalName(temp.getLegalName())
                .email(temp.getEmail())
                .gstNumber(temp.getGstNumber())
                .gstVerified(temp.isGstVerified())
                .gstVerifiedAt(temp.getGstVerifiedAt())
                .message(message)
                .build();
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        Bidder bidder = bidderRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BidderNotFoundException(
                        "Error: No bidder account found with this email."
                ));

        otpRepository.deleteByEmail(normalizedEmail);

        generateAndSendEmailOtp(normalizedEmail, bidder.getLegalName());

        return "Password reset OTP has been sent to " + normalizedEmail;
    }

    @Transactional
    public String verifyForgotPasswordOtp(VerifyForgotPasswordOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String enteredOtp = request.getOtp().trim();

        Bidder bidder = bidderRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BidderNotFoundException(
                        "Error: No bidder account found with this email."
                ));

        BidderEmailOtp activeOtp = otpRepository
                .findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new InvalidOtpException(
                        "Error: No active OTP found. Please request a new OTP."
                ));

        if (activeOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new OtpExpiredException(
                    "Error: OTP has expired. Please request a new OTP."
            );
        }

        if (!activeOtp.getOtp().equals(enteredOtp)) {
            throw new InvalidOtpException("Error: Invalid OTP entered!");
        }

        String resetToken = UUID.randomUUID().toString().replace("-", "");

        activeOtp.setVerified(true);
        activeOtp.setResetToken(resetToken);
        activeOtp.setResetTokenExpiry(LocalDateTime.now().plusMinutes(10));

        otpRepository.save(activeOtp);

        return resetToken;
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {

        BidderEmailOtp resetOtp = otpRepository
                .findByResetToken(request.getResetToken())
                .orElseThrow(() -> new InvalidTokenException(
                        "Error: Invalid reset token."
                ));

        if (!resetOtp.isVerified()) {
            throw new IllegalArgumentException(
                    "Error: Reset token has not been verified."
            );
        }

        if (resetOtp.getResetTokenExpiry() == null ||
                resetOtp.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException(
                    "Error: Reset token has expired. Please restart the password reset process."
            );
        }

        Bidder bidder = bidderRepository.findByEmail(resetOtp.getEmail())
                .orElseThrow(() -> new BidderNotFoundException(
                        "Error: Bidder account not found."
                ));

        bidder.setPassword(passwordEncoder.encode(request.getNewPassword()));

        bidderRepository.save(bidder);

        otpRepository.delete(resetOtp);

        return "Password reset successfully. You can now login with your new password.";
    }

    /**
     * Verifies a JWT token or temporary session token.
     */
    public BidderTokenVerifyResponse verifyToken(String tokenHeader, String bodyToken, String tempToken, String queryToken) {
        String token = null;

        if (StringUtils.hasText(tokenHeader) && tokenHeader.startsWith("Bearer ")) {
            token = tokenHeader.substring(7).trim();
        } else if (StringUtils.hasText(bodyToken)) {
            token = bodyToken.trim();
        } else if (StringUtils.hasText(queryToken)) {
            token = queryToken.trim();
        }

        // 1. Check if token is a valid JWT
        if (StringUtils.hasText(token)) {
            if (bidderJwtUtils.validateJwtToken(token)) {
                try {
                    String username = bidderJwtUtils.getUsernameFromJwtToken(token);
                    Optional<Bidder> bidderOpt = bidderRepository.findByEmail(username);
                    if (bidderOpt.isPresent()) {
                        Bidder bidder = bidderOpt.get();
                        return BidderTokenVerifyResponse.builder()
                                .valid(true)
                                .tokenType("JWT")
                                .bidderId(bidder.getId())
                                .email(bidder.getEmail())
                                .legalName(bidder.getLegalName())
                                .gstNumber(bidder.getGstNumber())
                                .phone(bidder.getPhone())
                                .isVerified(bidder.isVerified())
                                .message("JWT token is valid and active.")
                                .build();
                    }
                } catch (Exception e) {
                    log.error("Error reading claims from valid JWT: {}", e.getMessage());
                }
            }

            // Check if token string happens to be a tempToken
            Optional<BidderTempRegistration> tempOpt = tempRegistrationRepository.findByTempToken(token);
            if (tempOpt.isPresent()) {
                BidderTempRegistration temp = tempOpt.get();
                if (temp.getExpiryTime().isAfter(LocalDateTime.now())) {
                    generateAndSendEmailOtp(temp.getEmail(), temp.getLegalName());
                    return BidderTokenVerifyResponse.builder()
                            .valid(true)
                            .tokenType("TEMP_TOKEN")
                            .email(temp.getEmail())
                            .legalName(temp.getLegalName())
                            .gstNumber(temp.getGstNumber())
                            .phone(temp.getPhone())
                            .isVerified(true)
                            .message("Temporary token verified successfully! Verification OTP sent to " + temp.getEmail())
                            .build();
                } else {
                    return BidderTokenVerifyResponse.builder()
                            .valid(false)
                            .tokenType("TEMP_TOKEN")
                            .message("Temporary registration token has expired.")
                            .build();
                }
            }

            return BidderTokenVerifyResponse.builder()
                    .valid(false)
                    .tokenType("JWT")
                    .message("Invalid or expired JWT token.")
                    .build();
        }

        // 2. Check explicit tempToken parameter
        if (StringUtils.hasText(tempToken)) {
            Optional<BidderTempRegistration> tempOpt = tempRegistrationRepository.findByTempToken(tempToken.trim());
            if (tempOpt.isPresent()) {
                BidderTempRegistration temp = tempOpt.get();
                if (temp.getExpiryTime().isAfter(LocalDateTime.now())) {
                    generateAndSendEmailOtp(temp.getEmail(), temp.getLegalName());
                    return BidderTokenVerifyResponse.builder()
                            .valid(true)
                            .tokenType("TEMP_TOKEN")
                            .email(temp.getEmail())
                            .legalName(temp.getLegalName())
                            .gstNumber(temp.getGstNumber())
                            .phone(temp.getPhone())
                            .isVerified(true)
                            .message("Temporary token verified successfully! Verification OTP sent to " + temp.getEmail())
                            .build();
                } else {
                    return BidderTokenVerifyResponse.builder()
                            .valid(false)
                            .tokenType("TEMP_TOKEN")
                            .message("Temporary registration token has expired.")
                            .build();
                }
            }
            return BidderTokenVerifyResponse.builder()
                    .valid(false)
                    .tokenType("TEMP_TOKEN")
                    .message("Invalid temporary token.")
                    .build();
        }

        return BidderTokenVerifyResponse.builder()
                .valid(false)
                .message("No token provided.")
                .build();
    }
}