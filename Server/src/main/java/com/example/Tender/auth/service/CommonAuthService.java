package com.example.Tender.auth.service;

import com.example.Tender.auth.dto.AuthUserDto;
import com.example.Tender.auth.dto.LoginRequest;
import com.example.Tender.auth.dto.LoginResponse;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.exception.BidderNotVerifiedException;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.security.BidderPrincipal;
import com.example.Tender.bidder.security.service.jwt.BidderJwtUtils;
import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerVerificationStatus;
import com.example.Tender.officer.repository.OfficerRepository;
import com.example.Tender.officer.security.jwt.OfficerJwtUtils;
import com.example.Tender.officer.security.service.OfficerPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommonAuthService {

    private final OfficerRepository officerRepository;
    private final BidderRepository bidderRepository;
    private final PasswordEncoder passwordEncoder;
    private final OfficerJwtUtils officerJwtUtils;
    private final BidderJwtUtils bidderJwtUtils;

    /**
     * Unified Login:
     * 1. Check if user is an Officer by email and verify password.
     * 2. If not, check if user is a Bidder by email and verify password.
     * 3. Automatically determine role (OFFICER or BIDDER).
     * 4. Generate JWT with userId, role, and email claims.
     * 5. Return success, token, and user info with role.
     */
    public LoginResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String rawPassword = request.getPassword();

        // 1. Attempt Officer authentication
        Optional<Officer> officerOpt = officerRepository.findByEmail(normalizedEmail);
        if (officerOpt.isPresent()) {
            Officer officer = officerOpt.get();
            if (passwordEncoder.matches(rawPassword, officer.getPassword())) {
                if (officer.getVerificationStatus() == OfficerVerificationStatus.REJECTED) {
                    throw new IllegalArgumentException("Account verification was rejected. Please contact administrator.");
                }

                String role = "OFFICER";
                String token = officerJwtUtils.generateTokenWithClaims(
                        officer.getEmail(),
                        officer.getId(),
                        role,
                        officer.getName()
                );

                log.info("Officer login successful for email: {}", normalizedEmail);

                return LoginResponse.builder()
                        .success(true)
                        .message("Login successful")
                        .token(token)
                        .user(AuthUserDto.builder()
                                .id(officer.getId())
                                .name(officer.getName())
                                .email(officer.getEmail())
                                .role(role)
                                .build())
                        .build();
            }
        }

        // 2. Attempt Bidder authentication
        Optional<Bidder> bidderOpt = bidderRepository.findByEmail(normalizedEmail);
        if (bidderOpt.isPresent()) {
            Bidder bidder = bidderOpt.get();
            if (passwordEncoder.matches(rawPassword, bidder.getPassword())) {
                if (!bidder.isVerified()) {
                    throw new BidderNotVerifiedException("Account is not verified. Please complete verification.");
                }

                String role = "BIDDER";
                String token = bidderJwtUtils.generateTokenWithClaims(
                        bidder.getEmail(),
                        bidder.getId(),
                        role,
                        bidder.getLegalName()
                );

                log.info("Bidder login successful for email: {}", normalizedEmail);

                return LoginResponse.builder()
                        .success(true)
                        .message("Login successful")
                        .token(token)
                        .user(AuthUserDto.builder()
                                .id(bidder.getId())
                                .name(bidder.getLegalName())
                                .companyName(bidder.getCompanyName())
                                .email(bidder.getEmail())
                                .role(role)
                                .build())
                        .build();
            }
        }

        // 3. Credentials invalid in both Officer and Bidder accounts
        log.warn("Login failed: invalid credentials for email: {}", normalizedEmail);
        throw new BadCredentialsException("Invalid email or password");
    }

    /**
     * Resolve authenticated user profile and role from Security Context
     */
    public AuthUserDto getCurrentUserProfile(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof OfficerPrincipal officerPrincipal) {
            return AuthUserDto.builder()
                    .id(officerPrincipal.getId())
                    .name(officerPrincipal.getName())
                    .email(officerPrincipal.getEmail())
                    .role("OFFICER")
                    .build();
        }

        if (principal instanceof BidderPrincipal bidderPrincipal) {
            return AuthUserDto.builder()
                    .id(bidderPrincipal.getId())
                    .name(bidderPrincipal.getLegalName())
                    .companyName(bidderPrincipal.getCompanyName())
                    .email(bidderPrincipal.getEmail())
                    .role("BIDDER")
                    .build();
        }

        if (principal instanceof UserDetails userDetails) {
            String username = userDetails.getUsername();
            Optional<Officer> officer = officerRepository.findByEmail(username);
            if (officer.isPresent()) {
                return AuthUserDto.builder()
                        .id(officer.get().getId())
                        .name(officer.get().getName())
                        .email(officer.get().getEmail())
                        .role("OFFICER")
                        .build();
            }

            Optional<Bidder> bidder = bidderRepository.findByEmail(username);
            if (bidder.isPresent()) {
                return AuthUserDto.builder()
                        .id(bidder.get().getId())
                        .name(bidder.get().getLegalName())
                        .companyName(bidder.get().getCompanyName())
                        .email(bidder.get().getEmail())
                        .role("BIDDER")
                        .build();
            }
        }

        return null;
    }
}
