package com.example.Tender.officer.dto.ml;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TenderUploadResponse {

    private Long id;
    private String title;
    private String description;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String fileUrl;
    private String cloudinaryPublicId;
    private String documentType;

    private Long uploadedByOfficerId;
    private String uploadedByOfficerName;
    private String uploadedByEmail;
    private String departmentName;

    private String status;
    private Double authenticityScore;
    private Boolean isAuthentic;

    private String rawOcrText;
    private Map<String, Object> structuredData;
    private Map<String, Object> authenticityDetails;
    private Map<String, Object> mlRawResponse;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
