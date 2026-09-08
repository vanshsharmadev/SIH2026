package com.example.Tender.officer.service.ml;

import com.example.Tender.officer.dto.ml.DocumentProcessResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
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

/**
 * GeM ML Microservice Client (API Version 2.0.0)
 * Base URL: http://20.40.44.184
 * Total Consolidated Production Endpoints: 13
 */
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
        log.info("Initialized MlServiceClient (v2.0.0) with Base URL: {}", mlBaseUrl);
    }

    // ==========================================
    // 1. System & Health Endpoints
    // ==========================================

    /**
     * Endpoint 2: GET /health
     * Returns operational health of the microservice and live latency check against Government GST Portal.
     */
    public Map<String, Object> checkHealth() {
        try {
            return restClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.warn("ML Service health check failed: {}", ex.getMessage());
            Map<String, Object> health = new HashMap<>();
            health.put("status", "unhealthy");
            health.put("error", ex.getMessage());
            health.put("url", baseUrl);
            return health;
        }
    }

    // ==========================================
    // 2. Taxonomy & Document Schema
    // ==========================================

    /**
     * Endpoint 3: GET /api/ml/document-types
     * Master taxonomy of all 18 Indian procurement document categories and dynamic CIS scoring weights.
     */
    public Map<String, Object> getDocumentTypes() {
        try {
            return restClient.get()
                    .uri("/api/ml/document-types")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to retrieve document types: {}", ex.getMessage(), ex);
            throw new RuntimeException("Could not retrieve document types: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 3. Document Processing & Intake
    // ==========================================

    /**
     * Endpoint 4: POST /api/ml/process-document
     * Consolidated single-call intake (OCR + Layout + Classification + NER + Forgery).
     */
    public DocumentProcessResponse processDocument(MultipartFile file, String documentType, boolean fullAnalysis) {
        log.info("Sending document to ML Service (/api/ml/process-document): fileName={}, size={}, documentType={}, fullAnalysis={}",
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

            return parseDocumentProcessResponse(rawResponse, documentType);

        } catch (Exception ex) {
            log.error("Failed to process document with ML Service: {}", ex.getMessage(), ex);
            throw new RuntimeException("ML Service processing failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 4. Master Autonomous Tender Audits
    // ==========================================

    /**
     * Endpoint 5: POST /api/ml/automate-all
     * Autonomous tender audit with GFR 173(i) exemptions & ML verdict (JSON body).
     */
    public Map<String, Object> automateAll(Map<String, Object> request) {
        try {
            return restClient.post()
                    .uri("/api/ml/automate-all")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request != null ? request : Collections.emptyMap())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to execute master audit (/api/ml/automate-all): {}", ex.getMessage(), ex);
            throw new RuntimeException("Master audit failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Endpoint 6: POST /api/ml/automate-all-files
     * Autonomous tender audit with batch multipart file upload.
     */
    public Map<String, Object> automateAllFiles(List<MultipartFile> files, MultipartFile tenderFile, Boolean isMsme, Boolean isStartup) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            if (files != null) {
                for (MultipartFile f : files) {
                    if (f != null && !f.isEmpty()) {
                        body.add("files", toByteArrayResource(f));
                    }
                }
            }
            if (tenderFile != null && !tenderFile.isEmpty()) {
                body.add("tender_file", toByteArrayResource(tenderFile));
            }
            if (isMsme != null) {
                body.add("is_msme", String.valueOf(isMsme));
            }
            if (isStartup != null) {
                body.add("is_startup", String.valueOf(isStartup));
            }

            return restClient.post()
                    .uri("/api/ml/automate-all-files")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to execute batch file audit (/api/ml/automate-all-files): {}", ex.getMessage(), ex);
            throw new RuntimeException("Batch file audit failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 5. Comprehensive Dossier & RAG Synthesis
    // ==========================================

    /**
     * Endpoint 7: GET /api/ml/overall-summary
     * Single merged JSON dossier combining ML, statutory, forensic, & RAG data with pre-synthesized markdown chunks.
     */
    public Map<String, Object> getOverallSummary(String bidId, String identifier, String tenderType, Boolean useLivePortal, Boolean includeRagContext) {
        try {
            StringBuilder uriBuilder = new StringBuilder("/api/ml/overall-summary?");
            if (bidId != null && !bidId.isBlank()) {
                uriBuilder.append("bid_id=").append(bidId).append("&");
            }
            if (identifier != null && !identifier.isBlank()) {
                uriBuilder.append("identifier=").append(identifier).append("&");
            }
            if (tenderType != null && !tenderType.isBlank()) {
                uriBuilder.append("tender_type=").append(tenderType).append("&");
            }
            if (useLivePortal != null) {
                uriBuilder.append("use_live_portal=").append(useLivePortal).append("&");
            }
            if (includeRagContext != null) {
                uriBuilder.append("include_rag_context=").append(includeRagContext).append("&");
            }

            String uri = uriBuilder.toString();
            if (uri.endsWith("&") || uri.endsWith("?")) {
                uri = uri.substring(0, uri.length() - 1);
            }

            return restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to retrieve overall summary (/api/ml/overall-summary): {}", ex.getMessage(), ex);
            throw new RuntimeException("Overall summary retrieval failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 6. Forensics & Anti-Forgery
    // ==========================================

    /**
     * Endpoint 8: POST /api/ml/verify-document (Multipart File Upload Mode)
     * pyHanko CCA digital signatures, QR codes, rubber stamps, & card tampering.
     */
    public Map<String, Object> verifyDocumentFile(MultipartFile file, String docType, String ocrText, boolean autoOcr) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", toByteArrayResource(file));
            body.add("doc_type", (docType != null && !docType.isBlank()) ? docType : "generic");
            if (ocrText != null && !ocrText.isBlank()) {
                body.add("ocr_text", ocrText);
            }
            body.add("auto_ocr", String.valueOf(autoOcr));

            return restClient.post()
                    .uri("/api/ml/verify-document")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to verify document file (/api/ml/verify-document): {}", ex.getMessage(), ex);
            throw new RuntimeException("Document verification failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Endpoint 8: POST /api/ml/verify-document (JSON Mode: Card Tampering)
     */
    public Map<String, Object> verifyDocumentJson(Map<String, Object> request) {
        try {
            return restClient.post()
                    .uri("/api/ml/verify-document")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request != null ? request : Collections.emptyMap())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to verify document JSON (/api/ml/verify-document): {}", ex.getMessage(), ex);
            throw new RuntimeException("Document JSON verification failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 7. Statutory Taxpayer Verification
    // ==========================================

    /**
     * Endpoint 9: POST /api/ml/verify-taxpayer
     * Unified GSTIN, PAN, and UIN verification with live portal lookup & Mod-36.
     */
    public Map<String, Object> verifyTaxpayer(String identifier, String identifierType, String stateCode, Boolean useLivePortal) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("identifier", identifier);
            req.put("identifier_type", identifierType != null ? identifierType : "auto");
            if (stateCode != null) {
                req.put("state_code", stateCode);
            }
            if (useLivePortal != null) {
                req.put("use_live_portal", useLivePortal);
            }

            return restClient.post()
                    .uri("/api/ml/verify-taxpayer")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to verify taxpayer (/api/ml/verify-taxpayer): {}", ex.getMessage(), ex);
            throw new RuntimeException("Taxpayer verification failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 8. Dynamic Tender Requirements Engine
    // ==========================================

    /**
     * Endpoint 10: POST /api/ml/tender-requirements
     * Dynamic tender clause parsing, MSME waivers, and 6-pillar checklist.
     */
    public Map<String, Object> getTenderRequirements(Map<String, Object> request) {
        try {
            return restClient.post()
                    .uri("/api/ml/tender-requirements")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request != null ? request : Collections.emptyMap())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to parse tender requirements (/api/ml/tender-requirements): {}", ex.getMessage(), ex);
            throw new RuntimeException("Tender requirements parsing failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 9. Clearance Decision Engine
    // ==========================================

    /**
     * Endpoint 11: POST /api/ml/process-clearance
     * Single-click executive clearance decision based on CIS score & ML verdict.
     */
    public Map<String, Object> processClearance(String officerId, Map<String, Object> complianceRequest) {
        try {
            String uri = "/api/ml/process-clearance" + (officerId != null ? "?officer_id=" + officerId : "");
            return restClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(complianceRequest != null ? complianceRequest : Collections.emptyMap())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to process clearance (/api/ml/process-clearance): {}", ex.getMessage(), ex);
            throw new RuntimeException("Clearance processing failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 10. Machine Learning Models & Training
    // ==========================================

    /**
     * Endpoint 12: POST /api/ml/compliance/predict
     * Direct ML inference using trained AutomatedComplianceScorer model (Random Forest Classifier + Regressor).
     */
    public Map<String, Object> predictComplianceVerdict(Map<String, Object> request) {
        try {
            return restClient.post()
                    .uri("/api/ml/compliance/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request != null ? request : Collections.emptyMap())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to predict compliance verdict (/api/ml/compliance/predict): {}", ex.getMessage(), ex);
            throw new RuntimeException("Compliance prediction failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Endpoint 13: POST /api/ml/train/all
     * Master retraining pipeline for all ML models with hot reloading.
     */
    public Map<String, Object> trainAllModels(Map<String, Object> request) {
        try {
            return restClient.post()
                    .uri("/api/ml/train/all")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request != null ? request : Collections.emptyMap())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to trigger ML retraining (/api/ml/train/all): {}", ex.getMessage(), ex);
            throw new RuntimeException("ML retraining failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // Helpers
    // ==========================================

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
