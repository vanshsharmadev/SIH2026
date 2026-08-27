package com.example.Tender.officer.controller;

import com.example.Tender.officer.dto.OfficerApiResponse;
import com.example.Tender.officer.dto.OfficerAuthResponse;
import com.example.Tender.officer.dto.OfficerLoginRequest;
import com.example.Tender.officer.dto.OfficerSignupRequest;
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

    @PostMapping("/signup")
    public ResponseEntity<OfficerApiResponse<OfficerAuthResponse>> registerOfficer(@Valid @RequestBody OfficerSignupRequest signupRequest) {
        OfficerAuthResponse response = officerAuthService.signup(signupRequest);
        return new ResponseEntity<>(
                OfficerApiResponse.success("Officer registered successfully", response),
                HttpStatus.CREATED
        );
    }

    @PostMapping("/login")
    public ResponseEntity<OfficerApiResponse<OfficerAuthResponse>> authenticateOfficer(@Valid @RequestBody OfficerLoginRequest loginRequest) {
        OfficerAuthResponse response = officerAuthService.login(loginRequest);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Officer authenticated successfully", response)
        );
    }

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
