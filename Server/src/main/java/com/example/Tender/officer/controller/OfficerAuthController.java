package com.example.Tender.officer.controller;

import com.example.Tender.officer.dto.*;
import com.example.Tender.officer.security.service.OfficerPrincipal;
import com.example.Tender.officer.service.OfficerAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/officer/auth", "/api/auth"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class OfficerAuthController {

    private final OfficerAuthService officerAuthService;

    /**
     * Step 1: Initial signup. Saves data in temp registration and returns DigiLocker verification URL.
     */
    @PostMapping("/signup")
    public ResponseEntity<OfficerApiResponse<DigiLockerInitiateResponse>> registerOfficer(@Valid @RequestBody OfficerSignupRequest signupRequest) {
        DigiLockerInitiateResponse response = officerAuthService.signup(signupRequest);
        return new ResponseEntity<>(
                OfficerApiResponse.success("Signup initiated. Please verify identity via DigiLocker.", response),
                HttpStatus.CREATED
        );
    }

    /**
     * Step 2: DigiLocker OAuth Callback.
     * Validates code from DigiLocker, updates temp registration, and sends email OTP.
     */
    @GetMapping("/digilocker/callback")
    public ResponseEntity<OfficerApiResponse<OfficerAuthResponse>> handleDigiLockerCallback(
            @RequestParam("code") String code,
            @RequestParam("state") String state
    ) {
        OfficerAuthResponse response = officerAuthService.processDigiLockerCallback(code, state);
        return ResponseEntity.ok(
                OfficerApiResponse.success("DigiLocker identity verified. Email OTP has been sent.", response)
        );
    }

    /**
     * Step 3: Verify email OTP.
     * Creates permanent Officer record in main table and cleans up temp records.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<OfficerApiResponse<OfficerAuthResponse>> verifyOtp(@Valid @RequestBody OfficerVerifyOtpRequest verifyOtpRequest) {
        OfficerAuthResponse response = officerAuthService.verifyOtp(verifyOtpRequest);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Email verified successfully! Registration complete.", response)
        );
    }

    /**
     * Resend email OTP (only available after DigiLocker verification).
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<OfficerApiResponse<String>> resendOtp(@Valid @RequestBody OfficerResendOtpRequest resendOtpRequest) {
        String message = officerAuthService.resendOtp(resendOtpRequest);
        return ResponseEntity.ok(
                OfficerApiResponse.success("OTP resent successfully", message)
        );
    }

    /**
     * Officer Login.
     */
    @PostMapping("/login")
    public ResponseEntity<OfficerApiResponse<OfficerAuthResponse>> authenticateOfficer(@Valid @RequestBody OfficerLoginRequest loginRequest) {
        OfficerAuthResponse response = officerAuthService.login(loginRequest);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Officer authenticated successfully", response)
        );
    }

    /**
     * Get Current Authenticated Officer Profile.
     */
    @GetMapping("/me")
    public ResponseEntity<OfficerApiResponse<OfficerPrincipal>> getCurrentOfficer(@AuthenticationPrincipal OfficerPrincipal officerPrincipal) {
        if (officerPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(OfficerApiResponse.error("Not authenticated"));
        }
        return ResponseEntity.ok(
                OfficerApiResponse.success("Current officer profile", officerPrincipal)
        );
    }
}
