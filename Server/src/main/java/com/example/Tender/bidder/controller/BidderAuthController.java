package com.example.Tender.bidder.controller;

import com.example.Tender.bidder.dto.*;
import com.example.Tender.bidder.service.BidderAuthService;
import com.example.Tender.bidder.security.BidderPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import com.example.Tender.bidder.dto.ml.BidderTaxpayerVerifyRequest;
import com.example.Tender.bidder.dto.ml.BidderTaxpayerVerifyResponse;
import com.example.Tender.bidder.provider.MlBusinessVerificationProvider;

@RestController
@RequestMapping("/api/bidder/auth")
@CrossOrigin(
        originPatterns = {"https://gem-compliflix.vercel.app", "https://*.vercel.app", "http://localhost:[*]", "http://127.0.0.1:[*]", "*"},
        allowedHeaders = "*",
        allowCredentials = "true",
        maxAge = 3600
)
public class BidderAuthController {

    private final BidderAuthService bidderAuthService;
    private final MlBusinessVerificationProvider mlBusinessVerificationProvider;

    public BidderAuthController(BidderAuthService bidderAuthService) {
        this.bidderAuthService = bidderAuthService;
        this.mlBusinessVerificationProvider = null;
    }

    @org.springframework.beans.factory.annotation.Autowired
    public BidderAuthController(BidderAuthService bidderAuthService, MlBusinessVerificationProvider mlBusinessVerificationProvider) {
        this.bidderAuthService = bidderAuthService;
        this.mlBusinessVerificationProvider = mlBusinessVerificationProvider;
    }

    /**
     * STEP 1: Initiate signup, creates pending registration, returns temporary token.
     */
    @PostMapping("/signup")
    public ResponseEntity<BidderInitiateResponse> signup(
            @Valid @RequestBody BidderSignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bidderAuthService.signup(request));
    }

    /**
     * STEP 2: Verify Email OTP and finalize permanent Bidder registration.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<BidderAuthResponse> verifyOtp(
            @Valid @RequestBody BidderVerifyOtpRequest request) {
        return ResponseEntity.ok(bidderAuthService.verifyOtp(request));
    }

    /**
     * Resend verification OTP to bidder email.
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(
            @Valid @RequestBody BidderResendOtpRequest request) {
        String message = bidderAuthService.resendOtp(request);
        return ResponseEntity.ok(Map.of("message", message));
    }

    /**
     * Login for verified bidders.
     */
    @PostMapping("/login")
    public ResponseEntity<BidderAuthResponse> login(
            @Valid @RequestBody BidderLoginRequest request) {
        return ResponseEntity.ok(bidderAuthService.login(request));
    }

    /**
     * Verify JWT or temporary registration token (POST).
     * Accepts token in Authorization header (Bearer <token>), request body ({"token": "..."} / {"tempToken": "..."}), or ?token= query param.
     */
    @PostMapping("/verify-token")
    public ResponseEntity<BidderTokenVerifyResponse> verifyToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) BidderTokenVerifyRequest request,
            @RequestParam(value = "token", required = false) String queryToken) {
        String bodyToken = request != null ? request.getToken() : null;
        String tempToken = request != null ? request.getTempToken() : null;
        return ResponseEntity.ok(bidderAuthService.verifyToken(authHeader, bodyToken, tempToken, queryToken));
    }

    /**
     * Verify JWT or temporary registration token (GET).
     */
    @GetMapping("/verify-token")
    public ResponseEntity<BidderTokenVerifyResponse> verifyTokenGet(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "token", required = false) String queryToken,
            @RequestParam(value = "tempToken", required = false) String tempToken) {
        return ResponseEntity.ok(bidderAuthService.verifyToken(authHeader, null, tempToken, queryToken));
    }

    /**
     * Get Current Authenticated Bidder Profile (Requires Bearer token).
     */
    @GetMapping("/me")
    public ResponseEntity<BidderTokenVerifyResponse> getCurrentBidder(
            @AuthenticationPrincipal BidderPrincipal bidderPrincipal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (org.springframework.util.StringUtils.hasText(authHeader)) {
            return ResponseEntity.ok(bidderAuthService.verifyToken(authHeader, null, null, null));
        }
        return ResponseEntity.ok(bidderAuthService.verifyToken(null, null, null, null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        String message = bidderAuthService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/verify-forgot-password-otp")
    public ResponseEntity<Map<String, String>> verifyForgotPasswordOtp(
            @Valid @RequestBody VerifyForgotPasswordOtpRequest request) {
        String resetToken = bidderAuthService.verifyForgotPasswordOtp(request);
        return ResponseEntity.ok(Map.of(
                "message", "OTP verified successfully.",
                "resetToken", resetToken
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        String message = bidderAuthService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", message));
    }

    /**
     * Public Taxpayer Intelligence Pre-Verification:
     * Verifies GSTIN or PAN against ML engine & live portal before registration.
     */
    @PostMapping("/verify-taxpayer-ml")
    public ResponseEntity<BidderTaxpayerVerifyResponse> verifyTaxpayerMl(
            @Valid @RequestBody BidderTaxpayerVerifyRequest request) {
        BidderTaxpayerVerifyResponse response = mlBusinessVerificationProvider.verifyTaxpayer(
                request.getIdentifier(),
                request.getIdentifierType(),
                request.getExpectedLegalName(),
                request.getStateCode(),
                request.getUseLivePortal()
        );
        return ResponseEntity.ok(response);
    }
}