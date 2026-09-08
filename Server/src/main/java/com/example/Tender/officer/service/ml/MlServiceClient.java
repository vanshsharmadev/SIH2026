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
    // Group A: Document Authenticity & Anti-Forgery
    // ==========================================

    /**
     * Unified anti-forgery orchestration across cryptographic PDF signatures, QR codes, and physical stamps.
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
     * Validates decoded QR strings against OCR text and document type.
     */
    public Map<String, Object> verifyQrPayload(String payload, String documentType, String ocrText) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("payload", payload);
            req.put("document_type", documentType != null ? documentType : "generic");
            if (ocrText != null) {
                req.put("ocr_text", ocrText);
            }

            return restClient.post()
                    .uri("/api/ml/verify-qr-payload")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to verify QR payload: {}", ex.getMessage(), ex);
            throw new RuntimeException("QR payload verification failed: " + ex.getMessage(), ex);
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
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to check document authenticity: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to check authenticity: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // Group B: Automated OCR & Barcode Intelligence
    // ==========================================

    /**
     * Executes full-page OCR and automatically triggers QR/barcode engine when visual codes or keywords are detected.
     */
    public Map<String, Object> ocrScanWithBarcode(MultipartFile file, String docType, boolean preprocess, boolean autoScanBarcode) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", toByteArrayResource(file));
            body.add("doc_type", (docType != null && !docType.isBlank()) ? docType : "auto");
            body.add("preprocess", String.valueOf(preprocess));
            body.add("auto_scan_barcode", String.valueOf(autoScanBarcode));

            return restClient.post()
                    .uri("/api/ml/ocr-scan-with-barcode")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to run OCR scan with barcode trigger: {}", ex.getMessage(), ex);
            throw new RuntimeException("OCR scan with barcode failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Extract raw text with confidence scores.
     */
    public Map<String, Object> extractText(MultipartFile file, String documentType, boolean preprocess) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", toByteArrayResource(file));
            if (documentType != null && !documentType.isBlank()) {
                body.add("document_type", documentType);
            }
            body.add("preprocess", String.valueOf(preprocess));

            return restClient.post()
                    .uri("/api/ml/extract-text")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to extract text: {}", ex.getMessage(), ex);
            throw new RuntimeException("Text extraction failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Extract structured layout, table grids, form fields, and visual barcode boxes.
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
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to extract structured data: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to extract structured data: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // Group C: Taxpayer Intelligence & Live GST Verification
    // ==========================================

    /**
     * End-to-End Taxpayer Scanning & Validation (PDF/Image file upload).
     */
    public Map<String, Object> scanAndVerifyTaxpayer(MultipartFile file, String text, boolean preprocess, boolean useLivePortal) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            if (file != null && !file.isEmpty()) {
                body.add("file", toByteArrayResource(file));
            }
            if (text != null && !text.isBlank()) {
                body.add("text", text);
            }
            body.add("preprocess", String.valueOf(preprocess));
            body.add("use_live_portal", String.valueOf(useLivePortal));

            return restClient.post()
                    .uri("/api/ml/scan-and-verify-taxpayer")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to scan and verify taxpayer: {}", ex.getMessage(), ex);
            throw new RuntimeException("Taxpayer scan failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Scan taxpayer from plain text JSON payload.
     */
    public Map<String, Object> scanTaxpayerText(String text, boolean useLivePortal) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("text", text);
            req.put("use_live_portal", useLivePortal);

            return restClient.post()
                    .uri("/api/ml/scan-taxpayer-text")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to scan taxpayer text: {}", ex.getMessage(), ex);
            throw new RuntimeException("Taxpayer text scan failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Verify specific taxpayer identifier (GSTIN, PAN, or UIN) on Government GST portal.
     */
    public Map<String, Object> verifyTaxpayer(String identifier, String identifierType, String stateCode) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("identifier", identifier);
            req.put("identifier_type", identifierType != null ? identifierType : "auto");
            if (stateCode != null) {
                req.put("state_code", stateCode);
            }

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

    /**
     * Check live connectivity to Government GST portal (services.gst.gov.in/services/searchtp).
     */
    public Map<String, Object> getGstPortalStatus() {
        try {
            return restClient.get()
                    .uri("/api/ml/gst-portal-status")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.warn("GST Portal status check failed: {}", ex.getMessage());
            Map<String, Object> res = new HashMap<>();
            res.put("reachable", false);
            res.put("error", ex.getMessage());
            return res;
        }
    }

    /**
     * Returns the complete repository of errors, categories, and calibrated penalty deductions.
     */
    public Map<String, Object> getComplianceErrorsCatalog() {
        try {
            return restClient.get()
                    .uri("/api/ml/compliance-errors-catalog")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to get compliance errors catalog: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to get compliance errors catalog: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // Group D: CIS Scoring & Automated Clearance
    // ==========================================

    /**
     * Calculate Composite Compliance Index - CIS (0.0 to 1.0) using research formula.
     */
    public Map<String, Object> calculateCis(Map<String, Object> documents, Map<String, Object> tenderRequirements, Map<String, Object> bidderInfo) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("documents", documents != null ? documents : Collections.emptyMap());
            req.put("tender_requirements", tenderRequirements != null ? tenderRequirements : Collections.emptyMap());
            if (bidderInfo != null) {
                req.put("bidder_info", bidderInfo);
            }

            return restClient.post()
                    .uri("/api/ml/calculate-cis")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to calculate CIS: {}", ex.getMessage(), ex);
            throw new RuntimeException("CIS calculation failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Compare multiple competing bidders against tender requirements using CIS scores.
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
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to compare bidders via ML service: {}", ex.getMessage(), ex);
            throw new RuntimeException("Bidder comparison failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Evaluates whether a vendor package qualifies for Single-Click Clearance or requires manual officer review.
     */
    public Map<String, Object> processClearance(String officerId, Map<String, Object> complianceRequest) {
        try {
            String uri = "/api/ml/process-clearance" + (officerId != null ? "?officer_id=" + officerId : "");
            return restClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(complianceRequest)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to process clearance: {}", ex.getMessage(), ex);
            throw new RuntimeException("Clearance processing failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Generates formal clearance certificate and audit trail for an approved bid.
     */
    public Map<String, Object> executeSingleClickClearance(String clearanceId, String officerId, String justification) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("clearance_id", clearanceId);
            if (officerId != null) req.put("officer_id", officerId);
            if (justification != null) req.put("justification", justification);

            return restClient.post()
                    .uri("/api/ml/execute-single-click-clearance")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to execute single-click clearance: {}", ex.getMessage(), ex);
            throw new RuntimeException("Single-click clearance failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Get clearance workflow statistics.
     */
    public Map<String, Object> getClearanceStatistics() {
        try {
            return restClient.get()
                    .uri("/api/ml/clearance-statistics")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to get clearance statistics: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to get clearance statistics: " + ex.getMessage(), ex);
        }
    }

    /**
     * Get CIS weight distribution system.
     */
    public Map<String, Object> getCisWeights() {
        try {
            return restClient.get()
                    .uri("/api/ml/cis-weights")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to get CIS weights: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to get CIS weights: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // Group E: Entity Extraction & Document Classification
    // ==========================================

    /**
     * Extracts 15+ specialized Indian procurement entities from text (PAN, GSTIN, Udyam URN, TAN, CIN, DIN, etc.).
     */
    public Map<String, Object> extractEntities(String text, String documentType) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("text", text);
            if (documentType != null) {
                req.put("document_type", documentType);
            }

            return restClient.post()
                    .uri("/api/ml/extract-entities")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to extract entities: {}", ex.getMessage(), ex);
            throw new RuntimeException("Entity extraction failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Classifies document image or PDF into known Indian procurement categories.
     */
    public Map<String, Object> classifyDocument(MultipartFile file) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", toByteArrayResource(file));

            return restClient.post()
                    .uri("/api/ml/classify-document")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to classify document: {}", ex.getMessage(), ex);
            throw new RuntimeException("Document classification failed: " + ex.getMessage(), ex);
        }
    }

    // ==========================================
    // Group G: GeM ML Service v2.0.0 Master Endpoints
    // ==========================================

    /**
     * Master Autonomous Tender Audit (JSON Intake):
     * Synthesizes document classification, QR verification, forensic anti-tampering,
     * GFR 173(i) MSME/Startup statutory exemptions, dynamic CIS scoring, and Random Forest qualification prediction.
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
            log.error("Failed to execute master autonomous audit (/api/ml/automate-all): {}", ex.getMessage(), ex);
            throw new RuntimeException("Master audit failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Master Multipart Batch File Upload Autonomous Audit:
     * Accepts multiple physical document uploads and optional tender documents.
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

    /**
     * Consolidated Single-GET Comprehensive Dossier & RAG Synthesis:
     * Merges all ML analysis, statutory tax compliance, forensic authenticity, identity coherence,
     * and pre-synthesized markdown chunks for LLM RAG pipelines.
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
            log.error("Failed to retrieve overall summary dossier (/api/ml/overall-summary): {}", ex.getMessage(), ex);
            throw new RuntimeException("Overall summary retrieval failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Dynamic Tender Requirements Parsing & 6-Pillar Checklist:
     * Parses tender documents, Notice Inviting Tenders (NIT), and Bid Qualification Criteria (BQC).
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

    /**
     * Direct Machine Learning Compliance Verdict & Score Predictor:
     * Runs direct inference using trained AutomatedComplianceScorer model (Random Forest Classifier + Regressor).
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
     * Unified Machine Learning Retraining Pipeline:
     * Retrains Document Classifier, Forgery Detector, and Compliance Scorer with hot reloading.
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
    // Group F: System & Infrastructure
    // ==========================================

    /**
     * Get list of supported document types and compliance weights.
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

    /**
     * Health check of the ML service.
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
