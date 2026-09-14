package com.example.Tender.bidder.dto.ml;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderTaxpayerVerifyRequest {

    @NotBlank(message = "Identifier (GSTIN or PAN) is required")
    private String identifier;

    @Builder.Default
    private String identifierType = "gstin"; // "gstin" or "pan"

    private String expectedLegalName;

    private String stateCode;

    @Builder.Default
    private Boolean useLivePortal = false;
}
