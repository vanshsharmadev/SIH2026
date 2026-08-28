package com.example.Tender.officer.service;

import com.example.Tender.officer.dto.OfficerAuthResponse;
import com.example.Tender.officer.dto.OfficerLoginRequest;
import com.example.Tender.officer.dto.OfficerResendOtpRequest;
import com.example.Tender.officer.dto.OfficerSignupRequest;
import com.example.Tender.officer.dto.OfficerVerifyOtpRequest;
import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerRole;
import com.example.Tender.officer.model.OfficerTempRegistration;
import com.example.Tender.officer.model.OfficerVerificationStatus;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class OfficerAuthService {

    private final OfficerRepository officerRepository;
    private final OfficerTempRegistrationRepository tempRegistrationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final OfficerJwtUtils officerJwtUtils;
    private final BrevoEmailService brevoEmailService;

    @Value("${app.otp.expiration-minutes:10}")
    private int otpExpirationMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public OfficerAuthResponse signup(OfficerSignupRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedMobile = request.getMobile().trim();

        // 1. Check if officer already exists in the main database
        if (officerRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Error: Email is already registered and verified!");
        }

        if (officerRepository.existsByMobile(normalizedMobile)) {
            throw new IllegalArgumentException("Error: Mobile number is already registered!");
        }

        // 2. Generate 6-digit OTP
        String otp = String.format("%06d", secureRandom.nextInt(1000000));

        // 3. Clear any previous unverified temp registration for this email
        tempRegistrationRepository.deleteByEmail(normalizedEmail);

        // 4. Save details in TEMPORARY repository ONLY (not main Officer table)
        OfficerTempRegistration tempRegistration = OfficerTempRegistration.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .mobile(normalizedMobile)
                .password(passwordEncoder.encode(request.getPassword()))
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(otpExpirationMinutes))
                .build();

        tempRegistrationRepository.save(tempRegistration);

        // 5. Send OTP to email via Brevo
        brevoEmailService.sendOtpEmail(normalizedEmail, request.getName().trim(), otp, otpExpirationMinutes);

        return OfficerAuthResponse.builder()
                .name(tempRegistration.getName())
                .email(tempRegistration.getEmail())
                .mobile(tempRegistration.getMobile())
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.PENDING)
                .message("Signup initiated! A verification OTP has been sent to " + normalizedEmail + ". Your account will be created in the main database upon OTP verification.")
                .build();
    }

    @Transactional
    public OfficerAuthResponse verifyOtp(OfficerVerifyOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String enteredOtp = request.getOtp().trim();

        // 1. Check if officer is already verified in the main database
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
                    .message("Officer is already verified in the main database.")
                    .build();
        }

        // 2. Fetch pending registration from TEMPORARY repository
        OfficerTempRegistration temp = tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No pending signup found for email " + normalizedEmail + ". Please signup first."));

        // 3. Check OTP expiry
        if (temp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: OTP has expired. Please request a new OTP using the resend endpoint.");
        }

        // 4. Validate OTP match
        if (!temp.getOtp().equals(enteredOtp)) {
            throw new IllegalArgumentException("Error: Invalid OTP entered!");
        }

        // 5. Save the officer in the MAIN Officer database now
        Officer officer = Officer.builder()
                .name(temp.getName())
                .email(temp.getEmail())
                .mobile(temp.getMobile())
                .password(temp.getPassword()) // already hashed
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.VERIFIED)
                .build();

        Officer savedOfficer = officerRepository.save(officer);

        // 6. Delete temporary registration record after successful verification
        tempRegistrationRepository.delete(temp);

        // 7. Generate JWT token for authenticated officer
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
                .message("Email verified successfully! Officer account has been created in the main database.")
                .build();
    }

    @Transactional
    public String resendOtp(OfficerResendOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // 1. Check if already in main database
        if (officerRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Error: Account is already verified and registered in the main database!");
        }

        // 2. Find pending temporary registration
        OfficerTempRegistration temp = tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No pending signup found for " + normalizedEmail + ". Please initiate signup first."));

        // 3. Generate new OTP and refresh expiry
        String newOtp = String.format("%06d", secureRandom.nextInt(1000000));
        temp.setOtp(newOtp);
        temp.setExpiryTime(LocalDateTime.now().plusMinutes(otpExpirationMinutes));
        tempRegistrationRepository.save(temp);

        // 4. Send new OTP email via Brevo
        brevoEmailService.sendOtpEmail(temp.getEmail(), temp.getName(), newOtp, otpExpirationMinutes);

        return "A fresh OTP has been sent to " + normalizedEmail;
    }

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
}
