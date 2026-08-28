package com.example.Tender.officer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigiLockerInitiateResponse {

    private String tempToken;
    private String authorizationUrl;
    private String message;
}
