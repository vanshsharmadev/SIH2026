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

    @JsonProperty("results")
    private Map<String, Object> results;

    @JsonProperty("validation")
    private Map<String, Object> validation;

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
     * Unpacks nested fields from the v2.0.0 results map if they were not provided at root level.
     */
    @SuppressWarnings("unchecked")
    public void unpackResultsIfPresent() {
        if (results == null || results.isEmpty()) {
            return;
        }

        if (documentType == null && results.containsKey("document_type")) {
            documentType = String.valueOf(results.get("document_type"));
        }

        if (extractedText == null && results.containsKey("text")) {
            extractedText = String.valueOf(results.get("text"));
        }

        if (confidence == null && results.get("ocr_confidence") instanceof Number n) {
            confidence = n.doubleValue();
        }

        if (entities == null && results.get("entities") instanceof Map) {
            entities = (Map<String, Object>) results.get("entities");
            if (structuredData == null) {
                structuredData = entities;
            }
        }

        if (results.get("authenticity") instanceof Map authMap) {
            if (authenticity == null) {
                authenticity = (Map<String, Object>) authMap;
            }
            if (authenticityScore == null && authMap.get("authenticity_score") instanceof Number n) {
                authenticityScore = n.doubleValue();
            }
            if (isAuthentic == null && authMap.get("is_authentic") instanceof Boolean b) {
                isAuthentic = b;
            }
        }

        if (validation == null && results.get("validation") instanceof Map valMap) {
            validation = (Map<String, Object>) valMap;
        }

        if (results.get("classification") instanceof Map classMap) {
            if (documentType == null && classMap.containsKey("document_type")) {
                documentType = String.valueOf(classMap.get("document_type"));
            }
        }
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
        if (results != null && results.containsKey("text")) {
            return String.valueOf(results.get("text"));
        }
        return "";
    }
}
