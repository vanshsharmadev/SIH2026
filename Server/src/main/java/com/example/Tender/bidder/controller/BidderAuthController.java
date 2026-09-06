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

@RestController
@RequestMapping("/api/bidder/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class BidderAuthController {

    private final BidderAuthService bidderAuthService;

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
     * STEP 2a: Verify PAN with fake/mock ITD NSDL provider.
     */
    @PostMapping("/verify-pan")
    public ResponseEntity<BidderVerificationStatusResponse> verifyPan(
            @Valid @RequestBody BidderVerifyPanRequest request) {
        return ResponseEntity.ok(bidderAuthService.verifyPan(request));
    }

    /**
     * STEP 2b: Verify GSTIN with fake/mock GSTN provider.
     */
    @PostMapping("/verify-gst")
    public ResponseEntity<BidderVerificationStatusResponse> verifyGst(
            @Valid @RequestBody BidderVerifyGstRequest request) {
        return ResponseEntity.ok(bidderAuthService.verifyGst(request));
    }

    /**
     * STEP 2c: Verify Udyam MSME registration number.
     */
    @PostMapping("/verify-udyam")
    public ResponseEntity<BidderVerificationStatusResponse> verifyUdyam(
            @Valid @RequestBody BidderVerifyUdyamRequest request) {
        return ResponseEntity.ok(bidderAuthService.verifyUdyam(request));
    }

    /**
     * STEP 2 (Unified): Verify all business credentials (PAN, GSTIN, Udyam) in one call & send Email OTP.
     */
    @PostMapping("/verify-business")
    public ResponseEntity<BidderVerificationStatusResponse> verifyBusiness(
            @Valid @RequestBody BidderVerifyBusinessRequest request) {
        return ResponseEntity.ok(bidderAuthService.verifyBusiness(request));
    }

    /**
     * STEP 3: Verify Email OTP and finalize permanent Bidder registration.
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
        if (bidderPrincipal != null) {
            return ResponseEntity.ok(bidderAuthService.verifyToken(null, null, null, bidderPrincipal.getUsername()));
        }
        return ResponseEntity.ok(bidderAuthService.verifyToken(authHeader, null, null, null));
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
}