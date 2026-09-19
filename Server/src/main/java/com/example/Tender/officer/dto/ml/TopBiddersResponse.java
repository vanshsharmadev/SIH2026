package com.example.Tender.officer.dto.ml;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TopBiddersResponse {

    private Long tenderId;
    private String tenderTitle;
    private String departmentName;
    private String documentType;
    private String status;
    private Integer totalBiddersEvaluated;
    private Integer qualifiedCount;
    private Integer disqualifiedCount;
    private String topRecommendedBidder;
    private List<RankedBidderDto> topBidders;
    private Map<String, Object> evaluationSummary;
}
