package com.example.Tender.officer.dto.ml;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class DocumentProcessResponse {

    private Boolean success;
    private String message;
    private String status;

    @JsonProperty("document_id")
    private String documentId;

    @JsonProperty("document_type")
    private String documentType;

    @JsonProperty("extracted_text")
    private String extractedText;

    @JsonProperty("raw_text")
    private String rawText;

    @JsonProperty("confidence")
    private Double confidence;

    @JsonProperty("authenticity_score")
    private Double authenticityScore;

    @JsonProperty("is_authentic")
    private Boolean isAuthentic;

    @JsonProperty("authenticity_details")
    private Map<String, Object> authenticityDetails;

    @JsonProperty("authenticity")
    private Map<String, Object> authenticity;

    @JsonProperty("structured_data")
    private Map<String, Object> structuredData;

    @JsonProperty("entities")
    private Map<String, Object> entities;

    @JsonProperty("compliance_score")
    private Double complianceScore;

    @JsonProperty("qr_verification")
    private Map<String, Object> qrVerification;

    @JsonProperty("digital_signature")
    private Map<String, Object> digitalSignature;

    @JsonProperty("taxpayer_verification")
    private Map<String, Object> taxpayerVerification;

    @Builder.Default
    private Map<String, Object> additionalProperties = new HashMap<>();

    @JsonAnySetter
    public void setAdditionalProperty(String key, Object value) {
        if (this.additionalProperties == null) {
            this.additionalProperties = new HashMap<>();
        }
        this.additionalProperties.put(key, value);
    }

    @JsonAnyGetter
    public Map<String, Object> getAdditionalProperties() {
        return additionalProperties;
    }

    /**
     * Helper to get consolidated OCR text.
     */
    public String getConsolidatedOcrText() {
        if (extractedText != null && !extractedText.isBlank()) {
            return extractedText;
        }
        if (rawText != null && !rawText.isBlank()) {
            return rawText;
        }
        return "";
    }
}
