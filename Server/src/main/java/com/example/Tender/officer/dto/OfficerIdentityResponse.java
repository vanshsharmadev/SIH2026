package com.example.Tender.officer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficerIdentityResponse {

    private String tempToken;
    private String digilockerId;
    private String identityProvider;
    private String verifiedName;
    private String status;
    private String message;
    private boolean otpSent;
    private LocalDateTime verifiedAt;
}
