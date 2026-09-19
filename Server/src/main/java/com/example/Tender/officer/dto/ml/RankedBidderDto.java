package com.example.Tender.officer.dto.ml;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RankedBidderDto {

    private Integer rank;                  // 1 to 10
    private String rankLabel;              // e.g. "L1 (Lowest Compliant)", "L2 (Runner Up)"
    private Long bidderId;
    private String companyName;
    private String legalName;
    private String authorizedPersonName;
    private String email;
    private String phone;
    private String gstNumber;
    private BigDecimal bidAmount;          // Proposed tender quote in INR
    private Double compositeScore;         // 0.0 - 100.0 weighted score
    private Double technicalScore;         // Technical criteria match %
    private Double complianceScore;        // Statutory & NIT compliance %
    private Double authenticityScore;      // OCR & pyHanko document authenticity %
    private Double financialScore;         // Financial solvency & turnover rating %
    private String cisStatus;              // "CLEAR", "UNDER_REVIEW", "SANCTIONED"
    private String verdict;                // "HIGHLY_RECOMMENDED", "QUALIFIED", "CONDITIONALLY_QUALIFIED", "DISQUALIFIED"
    private String riskLevel;              // "LOW", "MEDIUM", "HIGH"
    private List<String> highlights;        // Strengths & key audit badges
    private List<String> flaggedIssues;     // Warning flags or missing items
    private LocalDateTime submissionDate;
}
