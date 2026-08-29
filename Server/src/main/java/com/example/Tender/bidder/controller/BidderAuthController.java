package com.example.Tender.bidder.controller;

import com.example.Tender.bidder.dto.BidderAuthResponse;
import com.example.Tender.bidder.dto.BidderLoginRequest;
import com.example.Tender.bidder.dto.BidderSignupRequest;
import com.example.Tender.bidder.service.BidderAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bidder/auth")
@RequiredArgsConstructor
public class BidderAuthController {

    private final BidderAuthService bidderAuthService;

    @PostMapping("/signup")
    public ResponseEntity<BidderAuthResponse> signup(
            @Valid @RequestBody BidderSignupRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bidderAuthService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<BidderAuthResponse> login(
            @Valid @RequestBody BidderLoginRequest request) {

        return ResponseEntity.ok(
                bidderAuthService.login(request)
        );
    }
}