package com.example.Tender.bidder.dto.ml;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BidderDocumentResponse {

    private Long id;
    private Long bidderId;
    private String fileName;
    private String documentType;
    private String fileUrl;
    private String cloudinaryPublicId;
    private Long fileSize;
    private String contentType;

    // ML Analysis Results
    private Double ocrConfidence;
    private Double authenticityScore;
    @com.fasterxml.jackson.annotation.JsonProperty("isAuthentic")
    private Boolean isAuthentic;
    private String authenticityVerdict;
    private List<String> verificationFlags;
    private String rawOcrText;

    private Map<String, Object> digitalSignatureReport;
    private Map<String, Object> qrVerificationReport;
    private Map<String, Object> extractedEntities;
    private Map<String, Object> taxpayerValidation;

    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
