package com.example.Tender.bidder.controller;

import com.example.Tender.bidder.dto.*;
import com.example.Tender.bidder.service.BidderAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bidder/auth")
@RequiredArgsConstructor
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
}