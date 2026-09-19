package com.example.Tender.bidder.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderVerifyBusinessRequest {

    @NotBlank(message = "Temporary token is required")
    private String tempToken;

    /**
     * Optional simulation override for testing
     */
    private String simulatedName;

    /**
     * Optional flag to simulate verification failure
     */
    private Boolean simulateFailure;
}
