package com.example.Tender.bidder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bidder_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long bidderId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String documentType; // e.g. "pan_card", "gst_certificate", "udyam_certificate", "financial_statement", "technical_proposal", "other"

    @Column(nullable = false, length = 1000)
    private String fileUrl; // Cloudinary secure URL

    @Column(name = "cloudinary_public_id")
    private String cloudinaryPublicId;

    private Long fileSize;

    private String contentType;

    // ML Engine Outputs
    private Double ocrConfidence;

    private Double authenticityScore;

    @Builder.Default
    private Boolean isAuthentic = false;

    private String authenticityVerdict;

    @Column(columnDefinition = "TEXT")
    private String verificationFlagsJson;

    @Column(columnDefinition = "TEXT")
    private String rawOcrText;

    @Column(columnDefinition = "TEXT")
    private String digitalSignatureJson;

    @Column(columnDefinition = "TEXT")
    private String qrVerificationJson;

    @Column(columnDefinition = "TEXT")
    private String extractedEntitiesJson;

    @Column(columnDefinition = "TEXT")
    private String taxpayerValidationJson;

    @Builder.Default
    private String status = "PROCESSED"; // PENDING, PROCESSED, FLAGGED, REJECTED

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
