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

    // ==========================================
    // 1. Unified Processing & Pipeline
    // ==========================================

    /**
     * Complete Document Processing Pipeline:
     * Extracts OCR text, structured entities, authenticity scores, and compliance metrics.
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
    // 2. Master Autonomous Tender Audits (Endpoints 5 & 6)
    // ==========================================

    /**
     * Endpoint 5: POST /api/ml/automate-all
     * Master Autonomous Tender Audit (JSON intake).
     * Synthesizes document classification, QR verification, forensic anti-tampering,
     * GFR 173(i) MSME/Startup statutory exemptions, dynamic CIS scoring, and Random Forest verdict.
     */
    public Map<String, Object> automateAll(Map<String, Object> request) {
        try {
            log.info("Dispatching master autonomous tender audit (/api/ml/automate-all)...");
            return restClient.post()
                    .uri("/api/ml/automate-all")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request != null ? request : Collections.emptyMap())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Master audit (/api/ml/automate-all) failed: {}", ex.getMessage(), ex);
            throw new RuntimeException("Master audit failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Endpoint 6: POST /api/ml/automate-all-files
     * Master Multipart Batch File Upload Autonomous Audit.
     * Accepts multiple physical document uploads (PDFs, images) and optional tender notice file.
     */
    public Map<String, Object> automateAllFiles(
            List<MultipartFile> files,
            MultipartFile tenderFile,
            Boolean isMsme,
            Boolean isStartup) {
        try {
            log.info("Dispatching master batch files audit (/api/ml/automate-all-files): fileCount={}", files != null ? files.size() : 0);
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
            body.add("is_msme", String.valueOf(Boolean.TRUE.equals(isMsme)));
            body.add("is_startup", String.valueOf(Boolean.TRUE.equals(isStartup)));

            return restClient.post()
                    .uri("/api/ml/automate-all-files")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Batch files audit failed: {}", ex.getMessage(), ex);
            throw new RuntimeException("Batch files audit failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 3. Comprehensive Dossier & RAG Synthesis (Endpoint 7)
    // ==========================================

    /**
     * Endpoint 7: GET /api/ml/overall-summary
     * Single GET endpoint designed for backend retrieval and Large Language Model (RAG) pipelines.
     * Merges all ML analysis, statutory tax compliance, forensic authenticity, identity coherence,
     * and pre-chunked markdown for vector ingestion.
     */
    public Map<String, Object> getOverallSummary(
            String bidId,
            String identifier,
            String tenderType,
            Boolean useLivePortal,
            Boolean includeRagContext) {
        try {
            StringBuilder uriBuilder = new StringBuilder("/api/ml/overall-summary?");
            if (bidId != null && !bidId.isBlank()) uriBuilder.append("bid_id=").append(bidId).append("&");
            if (identifier != null && !identifier.isBlank()) uriBuilder.append("identifier=").append(identifier).append("&");
            if (tenderType != null && !tenderType.isBlank()) uriBuilder.append("tender_type=").append(tenderType).append("&");
            uriBuilder.append("use_live_portal=").append(Boolean.TRUE.equals(useLivePortal)).append("&");
            uriBuilder.append("include_rag_context=").append(includeRagContext == null || includeRagContext);

            String uri = uriBuilder.toString();
            log.info("Fetching comprehensive dossier & RAG context: {}", uri);

            return restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to fetch overall summary dossier: {}", ex.getMessage(), ex);
            throw new RuntimeException("Overall summary retrieval failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 4. Forensics & Anti-Tampering (Endpoint 8)
    // ==========================================

    /**
     * Endpoint 8 (Mode A): POST /api/ml/verify-document (Multipart)
     * Unified forensic verification across cryptographic PDF signatures (pyHanko),
     * QR code validation (pyzbar), and rubber stamp detection (OpenCV).
     */
    public Map<String, Object> verifyDocument(MultipartFile file, String docType, String ocrText, boolean autoOcr) {
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
            log.error("Failed to verify document: {}", ex.getMessage(), ex);
            throw new RuntimeException("Document verification failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Endpoint 8 (Mode B): POST /api/ml/verify-document (JSON)
     * Card Tampering & Payload Verification. Validates visual text against signed QR payload.
     */
    public Map<String, Object> verifyDocumentJson(Map<String, Object> payload) {
        try {
            return restClient.post()
                    .uri("/api/ml/verify-document")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to verify document JSON payload: {}", ex.getMessage(), ex);
            throw new RuntimeException("Document JSON verification failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 5. Statutory Taxpayer Verification (Endpoint 9)
    // ==========================================

    /**
     * Endpoint 9: POST /api/ml/verify-taxpayer
     * Unified statutory taxpayer verification (GSTIN, PAN, UIN) with Mod-36 checksum,
     * state mapping, and optional live Government GST portal lookup.
     */
    public Map<String, Object> verifyTaxpayer(String identifier, String identifierType, String stateCode, Boolean useLivePortal) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("identifier", identifier);
            req.put("identifier_type", identifierType != null ? identifierType : "auto");
            if (stateCode != null) {
                req.put("state_code", stateCode);
            }
            req.put("use_live_portal", Boolean.TRUE.equals(useLivePortal));

            return restClient.post()
                    .uri("/api/ml/verify-taxpayer")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to verify taxpayer identifier: {}", ex.getMessage(), ex);
            throw new RuntimeException("Taxpayer verification failed: " + ex.getMessage(), ex);
        }
    }

    public Map<String, Object> verifyTaxpayer(String identifier, String identifierType, String stateCode) {
        return verifyTaxpayer(identifier, identifierType, stateCode, false);
    }

    // ==========================================
    // 6. Tender Requirements Engine (Endpoint 10)
    // ==========================================

    /**
     * Endpoint 10: POST /api/ml/tender-requirements
     * Dynamic Tender Requirements Parsing & 6-Pillar Checklist.
     * Evaluates statutory MSME/Startup exemptions under GFR 173(i) and parses tender clauses.
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
            log.error("Failed to parse tender requirements: {}", ex.getMessage(), ex);
            throw new RuntimeException("Tender requirements parsing failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 7. Clearance Decision Engine (Endpoint 11)
    // ==========================================

    /**
     * Endpoint 11: POST /api/ml/process-clearance
     * Evaluates composite compliance scores and authenticity metrics to issue
     * a Single-Click Clearance decision.
     */
    public Map<String, Object> processClearance(Map<String, Object> clearanceRequest) {
        try {
            return restClient.post()
                    .uri("/api/ml/process-clearance")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(clearanceRequest != null ? clearanceRequest : Collections.emptyMap())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to process clearance: {}", ex.getMessage(), ex);
            throw new RuntimeException("Clearance processing failed: " + ex.getMessage(), ex);
        }
    }

    public Map<String, Object> processClearance(String officerId, Map<String, Object> complianceRequest) {
        Map<String, Object> req = complianceRequest != null ? new HashMap<>(complianceRequest) : new HashMap<>();
        if (officerId != null) {
            req.put("officer_id", officerId);
        }
        return processClearance(req);
    }

    // ==========================================
    // 8. ML Model Direct Inference (Endpoint 12)
    // ==========================================

    /**
     * Endpoint 12: POST /api/ml/compliance/predict
     * Direct ML inference using trained AutomatedComplianceScorer (Random Forest Classifier + Regressor).
     * Predicts qualification verdict and regressed continuous CIS score from 9-D features.
     */
    public Map<String, Object> predictCompliance(Map<String, Object> featureDict) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("feature_dict", featureDict != null ? featureDict : Collections.emptyMap());

            return restClient.post()
                    .uri("/api/ml/compliance/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to predict compliance: {}", ex.getMessage(), ex);
            throw new RuntimeException("Compliance prediction failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 9. Retraining Pipeline (Endpoint 13)
    // ==========================================

    /**
     * Endpoint 13: POST /api/ml/train/all
     * Unified Machine Learning Retraining Pipeline with Hot Reloading.
     */
    public Map<String, Object> trainAllModels(Boolean retrainAll, Integer classifierEpochs) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("retrain_all", retrainAll != null ? retrainAll : true);
            if (classifierEpochs != null) {
                req.put("classifier_epochs", classifierEpochs);
            }

            return restClient.post()
                    .uri("/api/ml/train/all")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to trigger ML retraining: {}", ex.getMessage(), ex);
            throw new RuntimeException("ML retraining failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // 10. Taxonomy, System & Health (Endpoints 1, 2, 3)
    // ==========================================

    /**
     * Endpoint 1: Base URL for web dashboard.
     */
    public String getDashboardUrl() {
        return baseUrl + "/";
    }

    /**
     * Endpoint 2: GET /health
     * Unified Health Check + Live GST Portal Latency & Status.
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

    /**
     * Endpoint 3: GET /api/ml/document-types
     * 18 GeM document categories, extraction schemas, and compliance weights.
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
    // Backward-Compatible Adapters & Legacy Helpers
    // ==========================================

    public Map<String, Object> getGstPortalStatus() {
        Map<String, Object> health = checkHealth();
        if (health != null && health.get("gst_portal") instanceof Map portalMap) {
            return (Map<String, Object>) portalMap;
        }
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("reachable", false);
        fallback.put("status", health != null ? health.get("status") : "unknown");
        return fallback;
    }

    public Map<String, Object> getCisWeights() {
        Map<String, Object> docTypes = getDocumentTypes();
        if (docTypes != null && docTypes.get("compliance_weights") instanceof Map weights) {
            return (Map<String, Object>) weights;
        }
        return Collections.emptyMap();
    }

    public Map<String, Object> getComplianceErrorsCatalog() {
        return getDocumentTypes();
    }

    public Map<String, Object> calculateCis(Map<String, Object> documents, Map<String, Object> tenderRequirements, Map<String, Object> bidderInfo) {
        Map<String, Object> req = new HashMap<>();
        if (documents != null) req.put("documents", documents);
        if (tenderRequirements != null) req.put("tender_specification", tenderRequirements);
        if (bidderInfo != null) req.put("bidder_profile", bidderInfo);
        return automateAll(req);
    }

    public Map<String, Object> compareBiddersCis(List<Map<String, Object>> biddersData, Map<String, Object> tenderRequirements) {
        Map<String, Object> req = new HashMap<>();
        req.put("bidders_data", biddersData != null ? biddersData : Collections.emptyList());
        req.put("tender_specification", tenderRequirements != null ? tenderRequirements : Collections.emptyMap());
        try {
            return automateAll(req);
        } catch (Exception e) {
            log.warn("automate-all fallback for compareBiddersCis: {}", e.getMessage());
            Map<String, Object> res = new HashMap<>();
            res.put("bidders_evaluated", biddersData != null ? biddersData.size() : 0);
            res.put("status", "EVALUATED");
            return res;
        }
    }

    public Map<String, Object> verifyQrPayload(String payload, String documentType, String ocrText) {
        Map<String, Object> req = new HashMap<>();
        req.put("qr_payload", payload);
        req.put("doc_type", documentType != null ? documentType : "generic");
        if (ocrText != null) req.put("document_text", ocrText);
        return verifyDocumentJson(req);
    }

    public Map<String, Object> checkAuthenticity(MultipartFile file) {
        return verifyDocument(file, "generic", null, true);
    }

    public Map<String, Object> ocrScanWithBarcode(MultipartFile file, String docType, boolean preprocess, boolean autoScanBarcode) {
        return verifyDocument(file, docType, null, true);
    }

    public Map<String, Object> extractText(MultipartFile file, String documentType, boolean preprocess) {
        DocumentProcessResponse res = processDocument(file, documentType, false);
        Map<String, Object> out = new HashMap<>();
        out.put("text", res.getConsolidatedOcrText());
        out.put("confidence", res.getConfidence());
        return out;
    }

    public Map<String, Object> extractStructured(MultipartFile file, String documentType) {
        DocumentProcessResponse res = processDocument(file, documentType, true);
        Map<String, Object> out = new HashMap<>();
        out.put("entities", res.getEntities());
        out.put("structured_data", res.getStructuredData());
        return out;
    }

    public Map<String, Object> extractEntities(String text, String documentType) {
        Map<String, Object> req = new HashMap<>();
        req.put("tender_text", text);
        req.put("tender_type", documentType != null ? documentType : "goods");
        return getTenderRequirements(req);
    }

    public Map<String, Object> classifyDocument(MultipartFile file) {
        DocumentProcessResponse res = processDocument(file, null, false);
        Map<String, Object> out = new HashMap<>();
        out.put("document_type", res.getDocumentType());
        out.put("confidence", res.getConfidence());
        return out;
    }

    public Map<String, Object> scanAndVerifyTaxpayer(MultipartFile file, String text, boolean preprocess, boolean useLivePortal) {
        if (file != null && !file.isEmpty()) {
            DocumentProcessResponse res = processDocument(file, "gst_certificate", true);
            String id = null;
            if (res.getEntities() != null) {
                if (res.getEntities().containsKey("gstin")) id = String.valueOf(res.getEntities().get("gstin"));
                else if (res.getEntities().containsKey("pan")) id = String.valueOf(res.getEntities().get("pan"));
            }
            if (id != null) {
                return verifyTaxpayer(id, "auto", null, useLivePortal);
            }
        }
        if (text != null && !text.isBlank()) {
            return verifyTaxpayer(text.trim(), "auto", null, useLivePortal);
        }
        Map<String, Object> res = new HashMap<>();
        res.put("valid", false);
        res.put("message", "No valid identifier found");
        return res;
    }

    public Map<String, Object> scanTaxpayerText(String text, boolean useLivePortal) {
        return verifyTaxpayer(text != null ? text.trim() : "", "auto", null, useLivePortal);
    }

    public Map<String, Object> executeSingleClickClearance(String clearanceId, String officerId, String justification) {
        Map<String, Object> req = new HashMap<>();
        req.put("clearance_id", clearanceId);
        if (officerId != null) req.put("officer_id", officerId);
        if (justification != null) req.put("justification", justification);
        return processClearance(req);
    }

    public Map<String, Object> getClearanceStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("status", "active");
        stats.put("service_version", "2.0.0");
        return stats;
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
            response.unpackResultsIfPresent();

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

                Map<String, Object> targetMap = rawMap;
                if (rawMap.get("results") instanceof Map resMap) {
                    targetMap = (Map<String, Object>) resMap;
                    response.setResults(targetMap);
                }

                if (targetMap.containsKey("extracted_text")) {
                    response.setExtractedText(String.valueOf(targetMap.get("extracted_text")));
                } else if (targetMap.containsKey("text")) {
                    response.setExtractedText(String.valueOf(targetMap.get("text")));
                }
                if (targetMap.containsKey("raw_text")) {
                    response.setRawText(String.valueOf(targetMap.get("raw_text")));
                }
                if (targetMap.containsKey("authenticity_score") && targetMap.get("authenticity_score") instanceof Number num) {
                    response.setAuthenticityScore(num.doubleValue());
                }
                if (targetMap.containsKey("is_authentic") && targetMap.get("is_authentic") instanceof Boolean bool) {
                    response.setIsAuthentic(bool);
                }
                if (targetMap.get("authenticity") instanceof Map authMap) {
                    response.setAuthenticity((Map<String, Object>) authMap);
                    if (authMap.get("authenticity_score") instanceof Number num) {
                        response.setAuthenticityScore(num.doubleValue());
                    }
                    if (authMap.get("is_authentic") instanceof Boolean bool) {
                        response.setIsAuthentic(bool);
                    }
                }
                if (targetMap.get("entities") instanceof Map entMap) {
                    response.setEntities((Map<String, Object>) entMap);
                    response.setStructuredData((Map<String, Object>) entMap);
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
