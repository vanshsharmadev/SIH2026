package com.example.Tender.officer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficerIdentityInitiateRequest {

    @NotBlank(message = "Temporary token cannot be blank")
    private String tempToken;
}
