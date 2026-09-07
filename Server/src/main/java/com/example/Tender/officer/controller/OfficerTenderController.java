package com.example.Tender.officer.controller;

import com.example.Tender.officer.dto.OfficerApiResponse;
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
     * Compare multiple bidder proposals against the requirements of an uploaded tender using ML CIS analysis.
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

    /**
     * Get list of supported ML document types and compliance weights.
     */
    @GetMapping("/document-types")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getDocumentTypes() {
        Map<String, Object> documentTypes = tenderDocumentService.getDocumentTypes();
        return ResponseEntity.ok(
                OfficerApiResponse.success("Supported document types retrieved", documentTypes)
        );
    }

    /**
     * Health check endpoint for ML Service connectivity.
     */
    @GetMapping("/ml-health")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getMlHealth() {
        Map<String, Object> health = tenderDocumentService.getMlHealth();
        return ResponseEntity.ok(
                OfficerApiResponse.success("ML Service health status", health)
        );
    }

    // ==========================================
    // 2. Specialized ML Endpoints
    // ==========================================

    /**
     * Group A: Verify Document Authenticity (pyHanko digital signature, pyzbar QR, OpenCV visual stamp).
     */
    @PostMapping(value = "/ml/verify-document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> verifyDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "doc_type", required = false, defaultValue = "generic") String docType,
            @RequestParam(value = "ocr_text", required = false) String ocrText,
            @RequestParam(value = "auto_ocr", required = false, defaultValue = "true") boolean autoOcr) {

        Map<String, Object> result = tenderDocumentService.verifyDocument(file, docType, ocrText, autoOcr);
        return ResponseEntity.ok(OfficerApiResponse.success("Document verified successfully", result));
    }

    /**
     * Group A: Verify Raw QR Payload against document type and OCR text.
     */
    @PostMapping("/ml/verify-qr-payload")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> verifyQrPayload(@RequestBody Map<String, Object> req) {
        String payload = String.valueOf(req.get("payload"));
        String documentType = req.get("document_type") != null ? String.valueOf(req.get("document_type")) : "generic";
        String ocrText = req.get("ocr_text") != null ? String.valueOf(req.get("ocr_text")) : null;

        Map<String, Object> result = tenderDocumentService.verifyQrPayload(payload, documentType, ocrText);
        return ResponseEntity.ok(OfficerApiResponse.success("QR payload verified", result));
    }

    /**
     * Group B: Automated OCR Scan with Barcode Trigger.
     */
    @PostMapping(value = "/ml/ocr-scan-with-barcode", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> ocrScanWithBarcode(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "doc_type", required = false, defaultValue = "auto") String docType,
            @RequestParam(value = "preprocess", required = false, defaultValue = "true") boolean preprocess,
            @RequestParam(value = "auto_scan_barcode", required = false, defaultValue = "true") boolean autoScanBarcode) {

        Map<String, Object> result = tenderDocumentService.ocrScanWithBarcode(file, docType, preprocess, autoScanBarcode);
        return ResponseEntity.ok(OfficerApiResponse.success("OCR and barcode scan complete", result));
    }

    /**
     * Group B: Extract Raw Text from file.
     */
    @PostMapping(value = "/ml/extract-text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> extractText(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "document_type", required = false) String documentType,
            @RequestParam(value = "preprocess", required = false, defaultValue = "true") boolean preprocess) {

        Map<String, Object> result = tenderDocumentService.extractText(file, documentType, preprocess);
        return ResponseEntity.ok(OfficerApiResponse.success("Text extracted successfully", result));
    }

    /**
     * Group B: Extract Structured Layout (tables, form fields, grids).
     */
    @PostMapping(value = "/ml/extract-structured", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> extractStructured(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "document_type", required = false) String documentType) {

        Map<String, Object> result = tenderDocumentService.extractStructured(file, documentType);
        return ResponseEntity.ok(OfficerApiResponse.success("Structured layout extracted", result));
    }

    /**
     * Group C: End-to-End Taxpayer Scanning & Live GST Validation.
     */
    @PostMapping(value = "/ml/scan-and-verify-taxpayer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> scanAndVerifyTaxpayer(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text,
            @RequestParam(value = "preprocess", required = false, defaultValue = "true") boolean preprocess,
            @RequestParam(value = "use_live_portal", required = false, defaultValue = "false") boolean useLivePortal) {

        Map<String, Object> result = tenderDocumentService.scanAndVerifyTaxpayer(file, text, preprocess, useLivePortal);
        return ResponseEntity.ok(OfficerApiResponse.success("Taxpayer scan and validation complete", result));
    }

    /**
     * Group C: Scan Taxpayer from Plain Text JSON payload.
     */
    @PostMapping("/ml/scan-taxpayer-text")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> scanTaxpayerText(@RequestBody Map<String, Object> req) {
        String text = String.valueOf(req.get("text"));
        boolean useLivePortal = req.containsKey("use_live_portal") && Boolean.parseBoolean(String.valueOf(req.get("use_live_portal")));

        Map<String, Object> result = tenderDocumentService.scanTaxpayerText(text, useLivePortal);
        return ResponseEntity.ok(OfficerApiResponse.success("Taxpayer text scan complete", result));
    }

    /**
     * Group C: Verify Specific Taxpayer Identifier (GSTIN, PAN, or UIN).
     */
    @PostMapping("/ml/verify-taxpayer")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> verifyTaxpayer(@RequestBody Map<String, Object> req) {
        String identifier = String.valueOf(req.get("identifier"));
        String identifierType = req.get("identifier_type") != null ? String.valueOf(req.get("identifier_type")) : "auto";
        String stateCode = req.get("state_code") != null ? String.valueOf(req.get("state_code")) : null;

        Map<String, Object> result = tenderDocumentService.verifyTaxpayer(identifier, identifierType, stateCode);
        return ResponseEntity.ok(OfficerApiResponse.success("Taxpayer verified", result));
    }

    /**
     * Group C: GST Portal Connectivity Status.
     */
    @GetMapping("/ml/gst-portal-status")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getGstPortalStatus() {
        Map<String, Object> status = tenderDocumentService.getGstPortalStatus();
        return ResponseEntity.ok(OfficerApiResponse.success("GST Portal status", status));
    }

    /**
     * Group C: Compliance Errors & Calibrated Penalty Catalog.
     */
    @GetMapping("/ml/compliance-errors-catalog")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getComplianceErrorsCatalog() {
        Map<String, Object> catalog = tenderDocumentService.getComplianceErrorsCatalog();
        return ResponseEntity.ok(OfficerApiResponse.success("Compliance errors catalog", catalog));
    }

    /**
     * Group D: Calculate Composite Compliance Index (CIS).
     */
    @PostMapping("/ml/calculate-cis")
    @SuppressWarnings("unchecked")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> calculateCis(@RequestBody Map<String, Object> req) {
        Map<String, Object> documents = (Map<String, Object>) req.get("documents");
        Map<String, Object> tenderRequirements = (Map<String, Object>) req.get("tender_requirements");
        Map<String, Object> bidderInfo = (Map<String, Object>) req.get("bidder_info");

        Map<String, Object> result = tenderDocumentService.calculateCis(documents, tenderRequirements, bidderInfo);
        return ResponseEntity.ok(OfficerApiResponse.success("CIS calculated successfully", result));
    }

    /**
     * Group D: Process Clearance Decision (Single-Click vs Conditional Review).
     */
    @PostMapping("/ml/process-clearance")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> processClearance(
            @RequestParam(value = "officer_id", required = false) String officerId,
            @RequestBody Map<String, Object> complianceRequest) {

        Map<String, Object> result = tenderDocumentService.processClearance(officerId, complianceRequest);
        return ResponseEntity.ok(OfficerApiResponse.success("Clearance decision processed", result));
    }

    /**
     * Group D: Execute Single-Click Clearance.
     */
    @PostMapping("/ml/execute-single-click-clearance")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> executeSingleClickClearance(@RequestBody Map<String, Object> req) {
        String clearanceId = String.valueOf(req.get("clearance_id"));
        String officerId = req.get("officer_id") != null ? String.valueOf(req.get("officer_id")) : null;
        String justification = req.get("justification") != null ? String.valueOf(req.get("justification")) : null;

        Map<String, Object> result = tenderDocumentService.executeSingleClickClearance(clearanceId, officerId, justification);
        return ResponseEntity.ok(OfficerApiResponse.success("Single-click clearance executed", result));
    }

    /**
     * Group D: Clearance Statistics.
     */
    @GetMapping("/ml/clearance-statistics")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getClearanceStatistics() {
        Map<String, Object> stats = tenderDocumentService.getClearanceStatistics();
        return ResponseEntity.ok(OfficerApiResponse.success("Clearance statistics", stats));
    }

    /**
     * Group D: CIS Weight Distribution System.
     */
    @GetMapping("/ml/cis-weights")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> getCisWeights() {
        Map<String, Object> weights = tenderDocumentService.getCisWeights();
        return ResponseEntity.ok(OfficerApiResponse.success("CIS weights retrieved", weights));
    }

    /**
     * Group E: Extract Named Entities from text.
     */
    @PostMapping("/ml/extract-entities")
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> extractEntities(@RequestBody Map<String, Object> req) {
        String text = String.valueOf(req.get("text"));
        String documentType = req.get("document_type") != null ? String.valueOf(req.get("document_type")) : null;

        Map<String, Object> result = tenderDocumentService.extractEntities(text, documentType);
        return ResponseEntity.ok(OfficerApiResponse.success("Entities extracted successfully", result));
    }

    /**
     * Group E: Classify Document Type.
     */
    @PostMapping(value = "/ml/classify-document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OfficerApiResponse<Map<String, Object>>> classifyDocument(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = tenderDocumentService.classifyDocument(file);
        return ResponseEntity.ok(OfficerApiResponse.success("Document classified successfully", result));
    }
}
