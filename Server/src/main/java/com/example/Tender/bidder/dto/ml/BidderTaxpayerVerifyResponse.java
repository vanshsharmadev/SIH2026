package com.example.Tender.bidder.dto.ml;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BidderTaxpayerVerifyResponse {

    private boolean valid;
    private String identifier;
    private String identifierType;
    private String legalName;
    private String tradeName;
    private boolean nameMatched;
    private String status;
    private String state;
    private Double complianceScore;
    private String riskLevel;
    private Double filingRatePercent;
    private String gstr3bFilingStatus;
    private List<Map<String, Object>> errorsDetected;
    private String message;
    @com.fasterxml.jackson.annotation.JsonProperty("isMlVerified")
    private boolean isMlVerified;
    private String verificationSource; // "ML_MICROSERVICE_LIVE" or "FALLBACK_DATABASE"
}
