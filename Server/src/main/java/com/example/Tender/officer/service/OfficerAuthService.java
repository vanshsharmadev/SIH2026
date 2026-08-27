package com.example.Tender.officer.service;

import com.example.Tender.officer.dto.OfficerAuthResponse;
import com.example.Tender.officer.dto.OfficerLoginRequest;
import com.example.Tender.officer.dto.OfficerSignupRequest;
import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerRole;
import com.example.Tender.officer.model.OfficerVerificationStatus;
import com.example.Tender.officer.repository.OfficerRepository;
import com.example.Tender.officer.security.jwt.OfficerJwtUtils;
import com.example.Tender.officer.security.service.OfficerPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OfficerAuthService {

    private final OfficerRepository officerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final OfficerJwtUtils officerJwtUtils;

    @Transactional
    public OfficerAuthResponse signup(OfficerSignupRequest request) {
        if (officerRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Error: Email is already registered!");
        }

        if (officerRepository.existsByMobile(request.getMobile().trim())) {
            throw new IllegalArgumentException("Error: Mobile number is already registered!");
        }

        OfficerRole officerRole = request.getRole() != null ? request.getRole() : OfficerRole.ROLE_OFFICER;

        Officer officer = Officer.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .mobile(request.getMobile().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(officerRole)
                .verificationStatus(OfficerVerificationStatus.NOT_VERIFIED)
                .build();

        Officer savedOfficer = officerRepository.save(officer);

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
                .message("Officer registered successfully! Verification status: NOT_VERIFIED")
                .build();
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
}
