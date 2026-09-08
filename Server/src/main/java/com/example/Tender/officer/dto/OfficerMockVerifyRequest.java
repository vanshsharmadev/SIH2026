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
public class OfficerMockVerifyRequest {

    @NotBlank(message = "Temporary token cannot be blank")
    private String tempToken;

    private String authCode;

    /**
     * Optional override for SIH testing to simulate name matching (e.g. "Arnav Tyagi" for success or "Different Person" for mismatch)
     */
    private String simulatedName;

    private String simulatedDigilockerId;

    /**
     * Set to true to simulate DigiLocker service/verification failure
     */
    private Boolean simulateFailure;
}
