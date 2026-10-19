package com.example.Tender.bidder.dto;

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
public class SubmitBidRequest {
    private String tenderId;
    private String tenderTitle;
    private String department;
    private Long bidderId;
    private String bidderName;
    private String companyName;
    private Integer complianceScore;
    private String complianceStatus;
    private String quotedAmount;
    private Integer docCount;
    private List<Map<String, Object>> documents;
    private List<Map<String, Object>> vaultDocuments;
    private List<Map<String, Object>> requirementsBreakdown;
    private String officerRemarks;
}
