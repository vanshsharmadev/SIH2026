package com.example.Tender.officer.controller;

import com.example.Tender.officer.dto.OfficerApiResponse;
import com.example.Tender.officer.dto.ml.DocumentProcessResponse;
import com.example.Tender.officer.dto.ml.TenderComparisonRequest;
import com.example.Tender.officer.dto.ml.TenderComparisonResponse;
import com.example.Tender.officer.dto.ml.TenderUploadResponse;
import com.example.Tender.officer.security.service.OfficerPrincipal;
import com.example.Tender.officer.service.TenderDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Officer Tender Controller & GeM ML Service v2.0.0 Endpoints
 * Base URI: /api/officer/tenders
 */
@RestController
@RequestMapping("/api/officer/tenders")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class OfficerTenderController {

    private final TenderDocumentService tenderDocumentService;

    // ==========================================
    // 1. Primary Tender Document Operations
    // ==========================================

    /**
     * Upload Tender Document (PDF/Image), upload to Cloudinary, forward to Python ML Service
     * for OCR & Authenticity analysis, and persist extracted intelligence into PostgreSQL.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OfficerApiResponse<TenderUploadResponse>> uploadTender(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "documentType", required = false, defaultValue = "other") String documentType,
            @AuthenticationPrincipal OfficerPrincipal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(OfficerApiResponse.error("Authentication required to upload tender documents"));
        }

        log.info("Received tender upload request: title='{}', user='{}'", title, principal.getEmail());
        TenderUploadResponse response = tenderDocumentService.uploadAndProcessTender(
                file, title, description, documentType, principal
        );

        return new ResponseEntity<>(
                OfficerApiResponse.success("Tender document uploaded and analyzed successfully", response),
                HttpStatus.CREATED
        );
    }

    /**
     * Get all tenders uploaded by the currently authenticated officer.
     */
    @GetMapping
    public ResponseEntity<OfficerApiResponse<List<TenderUploadResponse>>> getOfficerTenders(
            @AuthenticationPrincipal OfficerPrincipal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(OfficerApiResponse.error("Authentication required"));
        }

        List<TenderUploadResponse> tenders = tenderDocumentService.getOfficerTenders(principal);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Officer tenders retrieved successfully", tenders)
        );
    }

    /**
     * Get detailed tender document info including ML extraction by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<OfficerApiResponse<TenderUploadResponse>> getTenderById(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal OfficerPrincipal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(OfficerApiResponse.error("Authentication required"));
        }

        TenderUploadResponse response = tenderDocumentService.getTenderById(id, principal);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Tender details retrieved successfully", response)
        );
    }

    /**
     * Compare multiple bidder proposals against the requirements of an uploaded tender using ML analysis.
     */
    @PostMapping("/{id}/compare-bidders")
    public ResponseEntity<OfficerApiResponse<TenderComparisonResponse>> compareBidders(
            @PathVariable("id") Long id,
            @Valid @RequestBody TenderComparisonRequest request,
            @AuthenticationPrincipal OfficerPrincipal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(OfficerApiResponse.error("Authentication required"));
        }

        TenderComparisonResponse response = tenderDocumentService.compareBidders(id, request, principal);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Bidder comparison completed successfully", response)
        );
    }

    // ==========================================
    // 2. Node AI RAG Chatbot & Embeddings Endpoints
    // ==========================================

    /**
     * Ask Bidder-Tender Chatbot (POST /api/officer/tenders/{id}/chat)
     * Retrieves tender + bidder context and generates response via Gemini LLM.
     */
    @PostMapping("/{id}/chat")
    public ResponseEntity<OfficerApiResponse<com.example.Tender.officer.dto.rag.TenderChatResponse>> askTenderChat(
            @PathVariable("id") Long id,
            @Valid @RequestBody com.example.Tender.officer.dto.rag.TenderChatRequest request,
            @AuthenticationPrincipal OfficerPrincipal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(OfficerApiResponse.error("Authentication required"));
        }

        request.setTenderId(String.valueOf(id));
        com.example.Tender.officer.dto.rag.TenderChatResponse response = tenderDocumentService.askTenderChatbot(request, principal);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Chatbot response generated successfully", response)
        );
    }

    /**
     * Ask Bidder-Tender Chatbot General Endpoint (POST /api/officer/tenders/chat)
     */
    @PostMapping("/chat")
    public ResponseEntity<OfficerApiResponse<com.example.Tender.officer.dto.rag.TenderChatResponse>> askGeneralChat(
            @Valid @RequestBody com.example.Tender.officer.dto.rag.TenderChatRequest request,
            @AuthenticationPrincipal OfficerPrincipal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(OfficerApiResponse.error("Authentication required"));
        }

        com.example.Tender.officer.dto.rag.TenderChatResponse response = tenderDocumentService.askTenderChatbot(request, principal);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Chatbot response generated successfully", response)
        );
    }

    /**
     * Check Node AI RAG Service Health (GET /api/officer/tenders/rag-health)
     */
    @GetMapping("/rag-health")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getRagHealth() {
        Map<String, Object> health = tenderDocumentService.getRagHealth();
        return ResponseEntity.ok(
                OfficerApiResponse.success("Node AI RAG Service health status", health)
        );
    }

    // ==========================================
    // 3. GeM ML Microservice v2.0.0 Consolidated Endpoints (13 APIs)
    // ==========================================

    /**
     * Endpoint 2: Unified Health & Statutory Connectivity Check (GET /health)
     */
    @GetMapping("/ml-health")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getMlHealth() {
        Map<String, Object> health = tenderDocumentService.getMlHealth();
        return ResponseEntity.ok(
                OfficerApiResponse.success("ML Service health status", health)
        );
    }

    /**
     * Endpoint 3: Procurement Document Taxonomy & Compliance Weights (GET /api/ml/document-types)
     */
    @GetMapping("/document-types")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getDocumentTypes() {
        Map<String, Object> documentTypes = tenderDocumentService.getDocumentTypes();
        return ResponseEntity.ok(
                OfficerApiResponse.success("Supported document types retrieved", documentTypes)
        );
    }

    /**
     * Endpoint 4: Single-File Consolidated Document Intake (POST /api/ml/process-document)
     */
    @PostMapping(value = "/ml/process-document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OfficerApiResponse<DocumentProcessResponse>> processDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "document_type", required = false) String documentType,
            @RequestParam(value = "full_analysis", required = false, defaultValue = "true") boolean fullAnalysis) {

        DocumentProcessResponse result = tenderDocumentService.processDocument(file, documentType, fullAnalysis);
        return ResponseEntity.ok(OfficerApiResponse.success("Document processed successfully", result));
    }

    /**
     * Endpoint 5: Master Autonomous Tender Audit - JSON Intake (POST /api/ml/automate-all)
     */
    @PostMapping("/ml/automate-all")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> automateAll(@RequestBody Map<String, Object> req) {
        Map<String, Object> result = tenderDocumentService.automateAll(req);
        return ResponseEntity.ok(OfficerApiResponse.success("Master autonomous audit complete", result));
    }

    /**
     * Endpoint 6: Master Multipart Batch File Upload Autonomous Audit (POST /api/ml/automate-all-files)
     */
    @PostMapping(value = "/ml/automate-all-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> automateAllFiles(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "tender_file", required = false) MultipartFile tenderFile,
            @RequestParam(value = "is_msme", required = false, defaultValue = "false") Boolean isMsme,
            @RequestParam(value = "is_startup", required = false, defaultValue = "false") Boolean isStartup) {

        Map<String, Object> result = tenderDocumentService.automateAllFiles(files, tenderFile, isMsme, isStartup);
        return ResponseEntity.ok(OfficerApiResponse.success("Batch file audit complete", result));
    }

    /**
     * Endpoint 7: Consolidated Single-GET Comprehensive Dossier & RAG Synthesis (GET /api/ml/overall-summary)
     */
    @GetMapping("/ml/overall-summary")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getOverallSummary(
            @RequestParam(value = "bid_id", required = false) String bidId,
            @RequestParam(value = "identifier", required = false) String identifier,
            @RequestParam(value = "tender_type", required = false, defaultValue = "goods") String tenderType,
            @RequestParam(value = "use_live_portal", required = false, defaultValue = "false") Boolean useLivePortal,
            @RequestParam(value = "include_rag_context", required = false, defaultValue = "true") Boolean includeRagContext) {

        Map<String, Object> result = tenderDocumentService.getOverallSummary(bidId, identifier, tenderType, useLivePortal, includeRagContext);
        return ResponseEntity.ok(OfficerApiResponse.success("Overall summary dossier retrieved", result));
    }

    /**
     * Endpoint 8: Unified Forensic Verification & Anti-Tampering - File Mode (POST /api/ml/verify-document)
     */
    @PostMapping(value = "/ml/verify-document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> verifyDocumentFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "doc_type", required = false, defaultValue = "generic") String docType,
            @RequestParam(value = "ocr_text", required = false) String ocrText,
            @RequestParam(value = "auto_ocr", required = false, defaultValue = "true") boolean autoOcr) {

        Map<String, Object> result = tenderDocumentService.verifyDocumentFile(file, docType, ocrText, autoOcr);
        return ResponseEntity.ok(OfficerApiResponse.success("Document forensic verification complete", result));
    }

    /**
     * Endpoint 8: Unified Forensic Verification & Anti-Tampering - JSON Mode (POST /api/ml/verify-document)
     */
    @PostMapping(value = "/ml/verify-document", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> verifyDocumentJson(@RequestBody Map<String, Object> req) {
        Map<String, Object> result = tenderDocumentService.verifyDocumentJson(req);
        return ResponseEntity.ok(OfficerApiResponse.success("Document tampering check complete", result));
    }

    /**
     * Endpoint 9: Unified Statutory Taxpayer Verification - GSTIN, PAN, UIN (POST /api/ml/verify-taxpayer)
     */
    @PostMapping("/ml/verify-taxpayer")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> verifyTaxpayer(@RequestBody Map<String, Object> req) {
        String identifier = String.valueOf(req.get("identifier"));
        String identifierType = req.get("identifier_type") != null ? String.valueOf(req.get("identifier_type")) : "auto";
        String stateCode = req.get("state_code") != null ? String.valueOf(req.get("state_code")) : null;
        Boolean useLivePortal = req.get("use_live_portal") != null ? Boolean.parseBoolean(String.valueOf(req.get("use_live_portal"))) : false;

        Map<String, Object> result = tenderDocumentService.verifyTaxpayer(identifier, identifierType, stateCode, useLivePortal);
        return ResponseEntity.ok(OfficerApiResponse.success("Taxpayer verified successfully", result));
    }

    /**
     * Endpoint 10: Dynamic Tender Requirements Parsing & 6-Pillar Checklist (POST /api/ml/tender-requirements)
     */
    @PostMapping("/ml/tender-requirements")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getTenderRequirements(@RequestBody Map<String, Object> req) {
        Map<String, Object> result = tenderDocumentService.getTenderRequirements(req);
        return ResponseEntity.ok(OfficerApiResponse.success("Tender requirements parsed", result));
    }

    /**
     * Endpoint 11: Procurement Clearance Decision Engine (POST /api/ml/process-clearance)
     */
    @PostMapping("/ml/process-clearance")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> processClearance(
            @RequestParam(value = "officer_id", required = false) String officerId,
            @RequestBody Map<String, Object> complianceRequest) {

        Map<String, Object> result = tenderDocumentService.processClearance(officerId, complianceRequest);
        return ResponseEntity.ok(OfficerApiResponse.success("Clearance decision processed", result));
    }

    /**
     * Endpoint 12: Direct ML Compliance Verdict & Score Predictor (POST /api/ml/compliance/predict)
     */
    @PostMapping("/ml/compliance-predict")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> predictComplianceVerdict(@RequestBody Map<String, Object> req) {
        Map<String, Object> result = tenderDocumentService.predictComplianceVerdict(req);
        return ResponseEntity.ok(OfficerApiResponse.success("Compliance prediction completed", result));
    }

    /**
     * Endpoint 13: Unified Machine Learning Retraining Pipeline (POST /api/ml/train/all)
     */
    @PostMapping("/ml/train-all")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> trainAllModels(@RequestBody(required = false) Map<String, Object> req) {
        Map<String, Object> result = tenderDocumentService.trainAllModels(req);
        return ResponseEntity.ok(OfficerApiResponse.success("ML model retraining triggered", result));
    }
}
