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

    private Boolean identityVerified;
    private String identityProvider;
    private String digilockerId;
    private String verifiedName;
    private String tempToken;
    private LocalDateTime identityVerifiedAt;
}
