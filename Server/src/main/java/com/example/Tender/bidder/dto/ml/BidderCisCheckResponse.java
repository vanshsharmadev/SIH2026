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
public class BidderCisCheckResponse {

    private boolean success;
    private Double cisScore;
    private String riskClassification;
    private Map<String, Object> componentScores;
    private int documentsAnalyzed;
    private List<String> missingDocuments;
    private List<String> recommendations;
    private String clearanceEligibility; // "ELIGIBLE_SINGLE_CLICK", "CONDITIONAL_REVIEW", "DISQUALIFIED"
    private String summary;
}
