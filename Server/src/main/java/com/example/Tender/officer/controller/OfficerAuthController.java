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
@RequestMapping({"/api/officer/identity", "/api/officer/auth", "/api/auth"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class OfficerAuthController {

    private final OfficerAuthService officerAuthService;

    /**
     * Step 1: Initial signup. Saves pending data in OfficerTempRegistration and returns DigiLocker verification URL.
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
     * Step 3: Explicit Initiate Identity Verification Endpoint (by tempToken)
     */
    @PostMapping("/initiate")
    public ResponseEntity<OfficerApiResponse<DigiLockerInitiateResponse>> initiateIdentity(@Valid @RequestBody OfficerIdentityInitiateRequest request) {
        DigiLockerInitiateResponse response = officerAuthService.initiateIdentityVerification(request);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Identity verification initiated", response)
        );
    }

    /**
     * Step 4: Mock DigiLocker Authorization & Name Matching (POST)
     */
    @PostMapping({"/mock-login", "/mock-verify"})
    public ResponseEntity<OfficerApiResponse<OfficerIdentityResponse>> verifyMockIdentity(@Valid @RequestBody OfficerMockVerifyRequest request) {
        OfficerIdentityResponse response = officerAuthService.verifyMockIdentity(request);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Identity verified successfully", response)
        );
    }

    /**
     * Step 4 (Alternative): Mock DigiLocker Authorization (GET via browser redirect or Postman query param)
     */
    @GetMapping({"/mock-login", "/mock-verify"})
    public ResponseEntity<OfficerApiResponse<OfficerIdentityResponse>> verifyMockIdentityGet(@RequestParam("token") String token) {
        OfficerMockVerifyRequest request = OfficerMockVerifyRequest.builder()
                .tempToken(token)
                .build();
        OfficerIdentityResponse response = officerAuthService.verifyMockIdentity(request);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Identity verified successfully", response)
        );
    }

    /**
     * Step 6: Verify email OTP.
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
