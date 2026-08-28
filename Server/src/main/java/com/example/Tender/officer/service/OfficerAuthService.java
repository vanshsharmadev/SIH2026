package com.example.Tender.officer.service;

import com.example.Tender.officer.dto.OfficerAuthResponse;
import com.example.Tender.officer.dto.OfficerLoginRequest;
import com.example.Tender.officer.dto.OfficerResendOtpRequest;
import com.example.Tender.officer.dto.OfficerSignupRequest;
import com.example.Tender.officer.dto.OfficerVerifyOtpRequest;
import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerEmailOtp;
import com.example.Tender.officer.model.OfficerRole;
import com.example.Tender.officer.model.OfficerVerificationStatus;
import com.example.Tender.officer.repository.OfficerEmailOtpRepository;
import com.example.Tender.officer.repository.OfficerRepository;
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
    private final OfficerEmailOtpRepository otpRepository;
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

        if (officerRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Error: Email is already registered!");
        }

        if (officerRepository.existsByMobile(normalizedMobile)) {
            throw new IllegalArgumentException("Error: Mobile number is already registered!");
        }

        Officer officer = Officer.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .mobile(normalizedMobile)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.NOT_VERIFIED)
                .build();

        Officer savedOfficer = officerRepository.save(officer);

        // Generate and send email OTP
        generateAndSendOtp(savedOfficer.getEmail(), savedOfficer.getName());

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
                .message("Officer registered successfully! An OTP has been sent to your email for verification.")
                .build();
    }

    @Transactional
    public OfficerAuthResponse verifyOtp(OfficerVerifyOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        Officer officer = officerRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No officer found with email " + normalizedEmail));

        OfficerEmailOtp latestOtp = otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No active OTP found for this email. Please request a new OTP."));

        if (latestOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Error: OTP has expired. Please request a new OTP.");
        }

        if (!latestOtp.getOtp().equals(request.getOtp().trim())) {
            throw new IllegalArgumentException("Error: Invalid OTP entered!");
        }

        // Mark OTP as verified
        latestOtp.setVerified(true);
        otpRepository.save(latestOtp);

        // Update officer status to VERIFIED
        officer.setVerificationStatus(OfficerVerificationStatus.VERIFIED);
        Officer updatedOfficer = officerRepository.save(officer);

        String token = officerJwtUtils.generateTokenFromUsername(updatedOfficer.getEmail());

        return OfficerAuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(updatedOfficer.getId())
                .name(updatedOfficer.getName())
                .email(updatedOfficer.getEmail())
                .mobile(updatedOfficer.getMobile())
                .role(updatedOfficer.getRole())
                .verificationStatus(updatedOfficer.getVerificationStatus())
                .message("Email verified successfully! Officer account is now VERIFIED.")
                .build();
    }

    @Transactional
    public String resendOtp(OfficerResendOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        Officer officer = officerRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Error: No officer found with email " + normalizedEmail));

        if (officer.getVerificationStatus() == OfficerVerificationStatus.VERIFIED) {
            throw new IllegalArgumentException("Error: Email is already verified!");
        }

        generateAndSendOtp(officer.getEmail(), officer.getName());
        return "A new OTP has been sent to " + normalizedEmail;
    }

    public OfficerAuthResponse login(OfficerLoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmailOrMobile().trim(),
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = officerJwtUtils.generateJwtToken(authentication);

            OfficerPrincipal officerPrincipal = (OfficerPrincipal) authentication.getPrincipal();

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

    private void generateAndSendOtp(String email, String name) {
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
