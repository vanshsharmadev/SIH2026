package com.example.Tender.bidder.dto;

import com.example.Tender.bidder.entity.BidSubmission;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BidSubmissionDTO {
    private Long id;
    private String formattedId;
    private Long bidderId;
    private String bidder;
    private String bidderName;
    private String companyName;
    private String tenderId;
    private String tenderTitle;
    private String department;
    private Integer complianceScore;
    private Integer score;
    private String complianceStatus;
    private String status;
    private String quotedAmount;
    private Integer docCount;
    private String evaluationStatus;
    private String officerVerdict;
    private String officerRemarks;
    private List<Map<String, Object>> documents;
    private List<Map<String, Object>> vaultDocuments;
    private List<Map<String, Object>> requirementsBreakdown;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String submittedOn;
    private String submittedTime;
    private String relativeTime;
    private Boolean isToday;
    private Boolean isLiveUploaded;

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("hh:mm a");

    public static BidSubmissionDTO fromEntity(BidSubmission entity) {
        if (entity == null) return null;

        List<Map<String, Object>> docs = parseJsonList(entity.getDocumentsJson());
        List<Map<String, Object>> vaultDocs = parseJsonList(entity.getVaultDocumentsJson());
        List<Map<String, Object>> reqs = parseJsonList(entity.getRequirementsJson());

        String dateStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATE_FMT) : "Today";
        String timeStr = entity.getCreatedAt() != null ? entity.getCreatedAt().format(TIME_FMT) : "Just now";

        String displayName = entity.getCompanyName() != null && !entity.getCompanyName().isEmpty()
                ? (entity.getBidderName() != null ? entity.getBidderName() + " (" + entity.getCompanyName() + ")" : entity.getCompanyName())
                : (entity.getBidderName() != null ? entity.getBidderName() : "Commercial Bidder");

        return BidSubmissionDTO.builder()
                .id(entity.getId())
                .formattedId("APP-2026-" + String.format("%06d", entity.getId()))
                .bidderId(entity.getBidderId())
                .bidder(displayName)
                .bidderName(entity.getBidderName())
                .companyName(entity.getCompanyName())
                .tenderId(entity.getTenderId())
                .tenderTitle(entity.getTenderTitle())
                .department(entity.getDepartment())
                .complianceScore(entity.getComplianceScore() != null ? entity.getComplianceScore() : 90)
                .score(entity.getComplianceScore() != null ? entity.getComplianceScore() : 90)
                .complianceStatus(entity.getComplianceStatus() != null ? entity.getComplianceStatus() : "Compliant")
                .status(entity.getComplianceStatus() != null ? entity.getComplianceStatus() : "Compliant")
                .quotedAmount(entity.getQuotedAmount() != null ? entity.getQuotedAmount() : "₹ 48,50,000")
                .docCount(entity.getDocCount() != null ? entity.getDocCount() : (docs != null ? docs.size() : 0))
                .evaluationStatus(entity.getEvaluationStatus() != null ? entity.getEvaluationStatus() : "Pending")
                .officerVerdict(entity.getOfficerVerdict())
                .officerRemarks(entity.getOfficerRemarks())
                .documents(docs)
                .vaultDocuments(vaultDocs)
                .requirementsBreakdown(reqs)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .submittedOn(dateStr)
                .submittedTime(timeStr)
                .relativeTime("Just now")
                .isToday(true)
                .isLiveUploaded(true)
                .build();
    }

    private static List<Map<String, Object>> parseJsonList(String json) {
        if (json == null || json.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
