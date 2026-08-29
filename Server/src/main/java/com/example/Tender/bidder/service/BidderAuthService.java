package com.example.Tender.bidder.service;

import com.example.Tender.bidder.dto.*;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.entity.BidderEmailOtp;
import com.example.Tender.bidder.entity.BidderTempRegistration;
import com.example.Tender.bidder.provider.MockBusinessVerificationProvider;
import com.example.Tender.bidder.repository.BidderEmailOtpRepository;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.repository.BidderTempRegistrationRepository;
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
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BidderAuthService {

    private final BidderRepository bidderRepository;
    private final BidderTempRegistrationRepository tempRegistrationRepository;
    private final BidderEmailOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final BidderJwtUtils bidderJwtUtils;
    private final BrevoEmailService brevoEmailService;
    private final MockBusinessVerificationProvider businessVerificationProvider;

    @Value("${app.otp.expiration-minutes:10}")
    private int otpExpirationMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * STEP 1: INITIATE SIGNUP
     * Validates input, saves pending details in BidderTempRegistration, and returns temporary token.
     */
    @Transactional
    public BidderInitiateResponse signup(BidderSignupRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedPan = request.getPanNumber().trim().toUpperCase();
        String normalizedGst = request.getGstNumber().trim().toUpperCase();
        String normalizedUdyam = StringUtils.hasText(request.getUdyamNumber()) ? request.getUdyamNumber().trim().toUpperCase() : null;

        // 1. Check for duplicates in permanent repository
        if (bidderRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Error: Email is already registered and verified!");
        }
        if (bidderRepository.existsByPanNumber(normalizedPan)) {
            throw new IllegalArgumentException("Error: PAN number is already registered!");
        }
        if (bidderRepository.existsByGstNumber(normalizedGst)) {
            throw new IllegalArgumentException("Error: GSTIN is already registered!");
        }

        // 2. Clear any previous unverified temp registration for this email
        tempRegistrationRepository.deleteByEmail(normalizedEmail);

        // 3. Generate unique temporary token
        String tempToken = UUID.randomUUID().toString().replace("-", "");

        // 4. Save in BidderTempRegistration
        BidderTempRegistration tempRegistration = BidderTempRegistration.builder()
                .tempToken(tempToken)
                .legalName(request.getLegalName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .panNumber(normalizedPan)
                .gstNumber(normalizedGst)
                .udyamNumber(normalizedUdyam)
                .registrationNumber(request.getRegistrationNumber() != null ? request.getRegistrationNumber().trim() : null)
                .panVerified(false)
                .gstVerified(false)
                .udyamVerified(false)
                .expiryTime(LocalDateTime.now().plusMinutes(30))
                .build();

        tempRegistrationRepository.save(tempRegistration);

        return BidderInitiateResponse.builder()
                .tempToken(tempToken)
                .email(normalizedEmail)
                .legalName(tempRegistration.getLegalName())
                .panNumber(normalizedPan)
                .gstNumber(normalizedGst)
                .udyamNumber(normalizedUdyam)
                .message("Signup initiated. Please complete business verification (PAN, GSTIN, Udyam) to receive Email OTP.")
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
            throw new IllegalArgumentException("PAN verification failed: " + result.getMessage());
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
            throw new IllegalArgumentException("GSTIN verification failed: " + result.getMessage());
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
            throw new IllegalArgumentException("Udyam verification failed: " + result.getMessage());
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
            throw new IllegalArgumentException("PAN verification failed: " + panResult.getMessage());
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
            throw new IllegalArgumentException("GSTIN verification failed: " + gstResult.getMessage());
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
                throw new IllegalArgumentException("Udyam verification failed: " + udyamResult.getMessage());
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
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String enteredOtp = request.getOtp().trim();

        if (bidderRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Error: Email is already registered and verified.");
        }

        BidderTempRegistration temp = tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No pending signup found for " + normalizedEmail + ". Please initiate signup first."));

        if (temp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: Temporary registration session has expired. Please restart signup.");
        }

        boolean udyamPending = StringUtils.hasText(temp.getUdyamNumber()) && !temp.isUdyamVerified();
        if (!temp.isPanVerified() || !temp.isGstVerified() || udyamPending) {
            throw new IllegalArgumentException("Error: All required business verifications (PAN, GST, and Udyam if provided) must be completed before verifying Email OTP!");
        }

        BidderEmailOtp activeOtp = otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No active OTP found for this email. Please request a new OTP."));

        if (activeOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: OTP has expired. Please request a new OTP.");
        }

        if (!activeOtp.getOtp().equals(enteredOtp)) {
            throw new IllegalArgumentException("Error: Invalid OTP entered!");
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
                .panNumber(savedBidder.getPanNumber())
                .gstNumber(savedBidder.getGstNumber())
                .udyamNumber(savedBidder.getUdyamNumber())
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
            throw new IllegalArgumentException("Error: Account is already verified and registered in the main database!");
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
            throw new IllegalArgumentException("Account is not verified. Please complete verification.");
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
                .panNumber(bidder.getPanNumber())
                .gstNumber(bidder.getGstNumber())
                .udyamNumber(bidder.getUdyamNumber())
                .isVerified(bidder.isVerified())
                .message("Bidder logged in successfully!")
                .build();
    }

    private BidderTempRegistration getValidTempRegistration(String tempToken) {
        BidderTempRegistration temp = tempRegistrationRepository.findByTempToken(tempToken)
                .orElseThrow(() -> new IllegalArgumentException("Error: Invalid or expired temporary token."));

        if (temp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: Temporary registration session has expired. Please restart signup.");
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
        boolean udyamCheck = !StringUtils.hasText(temp.getUdyamNumber()) || temp.isUdyamVerified();
        boolean allVerified = temp.isPanVerified() && temp.isGstVerified() && udyamCheck;

        return BidderVerificationStatusResponse.builder()
                .tempToken(temp.getTempToken())
                .legalName(temp.getLegalName())
                .email(temp.getEmail())
                .panNumber(temp.getPanNumber())
                .gstNumber(temp.getGstNumber())
                .udyamNumber(temp.getUdyamNumber())
                .panVerified(temp.isPanVerified())
                .gstVerified(temp.isGstVerified())
                .udyamVerified(temp.isUdyamVerified())
                .allBusinessVerified(allVerified)
                .panVerifiedAt(temp.getPanVerifiedAt())
                .gstVerifiedAt(temp.getGstVerifiedAt())
                .udyamVerifiedAt(temp.getUdyamVerifiedAt())
                .message(message)
                .build();
    }
}