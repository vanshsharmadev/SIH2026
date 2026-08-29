package com.example.Tender.bidder.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderVerifyPanRequest {

    @NotBlank(message = "Temporary token is required")
    private String tempToken;

    private String panNumber;

    /**
     * Optional simulation override for testing (e.g. custom name or mismatch)
     */
    private String simulatedName;

    /**
     * Optional flag to simulate verification failure
     */
    private Boolean simulateFailure;
}
