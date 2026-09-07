package com.example.Tender.officer.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tender_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenderDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "cloudinary_public_id")
    private String cloudinaryPublicId;

    @Column(name = "document_type")
    private String documentType;

    @Column(name = "uploaded_by_officer_id", nullable = false)
    private Long uploadedByOfficerId;

    @Column(name = "uploaded_by_officer_name")
    private String uploadedByOfficerName;

    @Column(name = "uploaded_by_email", nullable = false)
    private String uploadedByEmail;

    @Column(name = "department_name")
    private String departmentName;

    @Column(name = "raw_ocr_text", columnDefinition = "TEXT")
    private String rawOcrText;

    @Column(name = "structured_data_json", columnDefinition = "TEXT")
    private String structuredDataJson;

    @Column(name = "authenticity_details_json", columnDefinition = "TEXT")
    private String authenticityDetailsJson;

    @Column(name = "ml_raw_response_json", columnDefinition = "TEXT")
    private String mlRawResponseJson;

    @Column(name = "authenticity_score")
    private Double authenticityScore;

    @Column(name = "is_authentic")
    private Boolean isAuthentic;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "PROCESSED";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
