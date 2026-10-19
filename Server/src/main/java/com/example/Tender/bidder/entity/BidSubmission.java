package com.example.Tender.bidder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bid_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bidder_id")
    private Long bidderId;

    @Column(name = "bidder_name")
    private String bidderName;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "tender_id", nullable = false)
    private String tenderId;

    @Column(name = "tender_title", columnDefinition = "TEXT")
    private String tenderTitle;

    @Column(name = "department")
    private String department;

    @Column(name = "compliance_score")
    private Integer complianceScore;

    @Column(name = "compliance_status")
    private String complianceStatus;

    @Column(name = "quoted_amount")
    private String quotedAmount;

    @Column(name = "doc_count")
    private Integer docCount;

    @Column(name = "documents_json", columnDefinition = "TEXT")
    private String documentsJson;

    @Column(name = "vault_documents_json", columnDefinition = "TEXT")
    private String vaultDocumentsJson;

    @Column(name = "requirements_json", columnDefinition = "TEXT")
    private String requirementsJson;

    @Column(name = "evaluation_status")
    @Builder.Default
    private String evaluationStatus = "Pending";

    @Column(name = "officer_verdict")
    private String officerVerdict;

    @Column(name = "officer_remarks", columnDefinition = "TEXT")
    private String officerRemarks;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (evaluationStatus == null) {
            evaluationStatus = "Pending";
        }
        if (complianceStatus == null) {
            if (complianceScore != null) {
                complianceStatus = complianceScore >= 80 ? "Compliant" : (complianceScore >= 60 ? "Needs Review" : "Non-Compliant");
            } else {
                complianceStatus = "Compliant";
            }
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
