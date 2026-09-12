package com.example.Tender.auth.controller;

import com.example.Tender.auth.dto.AuthUserDto;
import com.example.Tender.auth.dto.LoginRequest;
import com.example.Tender.auth.dto.LoginResponse;
import com.example.Tender.auth.service.CommonAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import com.example.Tender.officer.dto.*;
import com.example.Tender.officer.service.OfficerAuthService;

@RestController
@RequestMapping({"/auth", "/api/auth"})
@RequiredArgsConstructor
@CrossOrigin(
        originPatterns = {"https://gem-compliflix.vercel.app", "https://*.vercel.app", "http://localhost:[*]", "http://127.0.0.1:[*]", "*"},
        allowedHeaders = "*",
        allowCredentials = "true",
        maxAge = 3600
)
public class CommonAuthController {

    private final CommonAuthService commonAuthService;
    private final OfficerAuthService officerAuthService;

    /**
     * Public Health Check endpoint for keep-alive pingers and uptime monitoring.
     * Accessible at GET /auth, GET /auth/health, GET /api/auth, and GET /api/auth/health.
     *
     * @return ResponseEntity containing health status map with UP status, service descriptor, and timestamp.
     */
    @GetMapping({"", "/", "/health"})
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "SIH2026 Tender Backend",
                "message", "Auth service is running and healthy",
                "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Unified Login endpoint for both Officer and Bidder.
     * Accessible at POST /auth/login and POST /api/auth/login.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = commonAuthService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Common profile endpoint returning authenticated user and detected role.
     * Accessible at GET /auth/me and GET /api/auth/me.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        AuthUserDto userProfile = commonAuthService.getCurrentUserProfile(authentication);
        if (userProfile == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "status", HttpStatus.UNAUTHORIZED.value(),
                            "error", "Unauthorized",
                            "message", "User is not authenticated"
                    ));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Authenticated user profile",
                "user", userProfile
        ));
    }

    /**
     * Backward-compatible Officer Signup under /auth/signup and /api/auth/signup.
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
     * Backward-compatible Officer OTP Verification under /auth/verify-otp and /api/auth/verify-otp.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<OfficerApiResponse<OfficerAuthResponse>> verifyOtp(@Valid @RequestBody OfficerVerifyOtpRequest verifyOtpRequest) {
        OfficerAuthResponse response = officerAuthService.verifyOtp(verifyOtpRequest);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Email verified successfully! Registration complete.", response)
        );
    }

    /**
     * Backward-compatible Officer Resend OTP under /auth/resend-otp and /api/auth/resend-otp.
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<OfficerApiResponse<String>> resendOtp(@Valid @RequestBody OfficerResendOtpRequest resendOtpRequest) {
        String message = officerAuthService.resendOtp(resendOtpRequest);
        return ResponseEntity.ok(
                OfficerApiResponse.success("OTP resent successfully", message)
        );
    }
}
