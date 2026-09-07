package com.example.Tender.officer.service.ml;

import com.example.Tender.officer.dto.ml.DocumentProcessResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class MlServiceClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;

    public MlServiceClient(
            @Value("${ml.service.base-url:http://20.40.44.184}") String mlBaseUrl,
            ObjectMapper objectMapper) {
        this.baseUrl = mlBaseUrl;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(mlBaseUrl)
                .build();
        log.info("Initialized MlServiceClient with Base URL: {}", mlBaseUrl);
    }

    /**
     * Complete Document Processing Pipeline:
     * Extracts text, OCR confidence, structured entities, authenticity scores, and compliance metrics.
     */
    public DocumentProcessResponse processDocument(MultipartFile file, String documentType, boolean fullAnalysis) {
        log.info("Sending document to ML Service: fileName={}, size={}, documentType={}, fullAnalysis={}",
                file.getOriginalFilename(), file.getSize(), documentType, fullAnalysis);

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", toByteArrayResource(file));
            if (documentType != null && !documentType.isBlank()) {
                body.add("document_type", documentType);
            }
            body.add("full_analysis", String.valueOf(fullAnalysis));

            String rawResponse = restClient.post()
                    .uri("/api/ml/process-document")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            log.info("Received ML service process-document response");
            return parseDocumentProcessResponse(rawResponse, documentType);

        } catch (Exception ex) {
            log.error("Failed to process document with ML Service: {}", ex.getMessage(), ex);
            throw new RuntimeException("ML Service processing failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Extract structured key-value criteria from document.
     */
    public Map<String, Object> extractStructured(MultipartFile file, String documentType) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", toByteArrayResource(file));
            if (documentType != null && !documentType.isBlank()) {
                body.add("document_type", documentType);
            }
            body.add("preprocess", "true");

            return restClient.post()
                    .uri("/api/ml/extract-structured")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to extract structured data: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to extract structured data: " + ex.getMessage(), ex);
        }
    }

    /**
     * Check document authenticity / tamper detection.
     */
    public Map<String, Object> checkAuthenticity(MultipartFile file) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", toByteArrayResource(file));

            return restClient.post()
                    .uri("/api/ml/check-authenticity")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to check document authenticity: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to check authenticity: " + ex.getMessage(), ex);
        }
    }

    /**
     * Advanced Document Verification (Digital Signature, QR Code scanner, Visual Stamp).
     */
    public Map<String, Object> verifyDocument(MultipartFile file, String docType) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", toByteArrayResource(file));
            body.add("doc_type", (docType != null && !docType.isBlank()) ? docType : "generic");
            body.add("auto_ocr", "true");

            return restClient.post()
                    .uri("/api/ml/verify-document")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to verify document: {}", ex.getMessage(), ex);
            throw new RuntimeException("Document verification failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Compare multiple bidders against tender requirements using CIS scores.
     */
    public Map<String, Object> compareBiddersCis(List<Map<String, Object>> biddersData, Map<String, Object> tenderRequirements) {
        try {
            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("bidders_data", biddersData != null ? biddersData : Collections.emptyList());
            requestPayload.put("tender_requirements", tenderRequirements != null ? tenderRequirements : Collections.emptyMap());

            return restClient.post()
                    .uri("/api/ml/compare-bidders-cis")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to compare bidders via ML service: {}", ex.getMessage(), ex);
            throw new RuntimeException("Bidder comparison failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Get list of supported document types and compliance weights.
     */
    public Map<String, Object> getDocumentTypes() {
        try {
            return restClient.get()
                    .uri("/api/ml/document-types")
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to retrieve document types: {}", ex.getMessage(), ex);
            throw new RuntimeException("Could not retrieve document types: " + ex.getMessage(), ex);
        }
    }

    /**
     * Health check of the ML service.
     */
    public Map<String, Object> checkHealth() {
        try {
            return restClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.warn("ML Service health check failed: {}", ex.getMessage());
            Map<String, Object> health = new HashMap<>();
            health.put("status", "unhealthy");
            health.put("error", ex.getMessage());
            health.put("url", baseUrl);
            return health;
        }
    }

    private ByteArrayResource toByteArrayResource(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() != null && !file.getOriginalFilename().isBlank()
                ? file.getOriginalFilename()
                : "document.pdf";

        return new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return filename;
            }
        };
    }

    private DocumentProcessResponse parseDocumentProcessResponse(String rawResponseJson, String fallbackDocType) {
        if (rawResponseJson == null || rawResponseJson.isBlank()) {
            return DocumentProcessResponse.builder()
                    .status("FAILED")
                    .message("Empty response from ML service")
                    .build();
        }

        try {
            DocumentProcessResponse response = objectMapper.readValue(rawResponseJson, DocumentProcessResponse.class);

            // Also keep full raw JSON map in additional properties for fallback inspection
            Map<String, Object> rawMap = objectMapper.readValue(rawResponseJson, new TypeReference<Map<String, Object>>() {});
            if (response.getDocumentType() == null && fallbackDocType != null) {
                response.setDocumentType(fallbackDocType);
            }
            if (response.getStatus() == null) {
                response.setStatus("PROCESSED");
            }
            if (response.getAdditionalProperties() == null) {
                response.setAdditionalProperties(new HashMap<>());
            }
            response.getAdditionalProperties().put("raw_response", rawMap);

            return response;
        } catch (Exception e) {
            log.warn("Could not parse as DocumentProcessResponse directly, parsing as Map: {}", e.getMessage());
            try {
                Map<String, Object> rawMap = objectMapper.readValue(rawResponseJson, new TypeReference<Map<String, Object>>() {});
                DocumentProcessResponse response = DocumentProcessResponse.builder()
                        .status("PROCESSED")
                        .documentType(fallbackDocType)
                        .additionalProperties(rawMap)
                        .build();

                if (rawMap.containsKey("extracted_text")) {
                    response.setExtractedText(String.valueOf(rawMap.get("extracted_text")));
                }
                if (rawMap.containsKey("raw_text")) {
                    response.setRawText(String.valueOf(rawMap.get("raw_text")));
                }
                if (rawMap.containsKey("authenticity_score") && rawMap.get("authenticity_score") instanceof Number num) {
                    response.setAuthenticityScore(num.doubleValue());
                }
                if (rawMap.containsKey("is_authentic") && rawMap.get("is_authentic") instanceof Boolean bool) {
                    response.setIsAuthentic(bool);
                }
                return response;
            } catch (Exception ex) {
                log.error("Fatal error parsing ML response: {}", ex.getMessage());
                return DocumentProcessResponse.builder()
                        .status("FAILED")
                        .message("Invalid response format from ML service")
                        .rawText(rawResponseJson)
                        .build();
            }
        }
    }
}
