package com.example.Tender.bidder.controller;

import com.example.Tender.bidder.dto.ml.BidderCisCheckRequest;
import com.example.Tender.bidder.dto.ml.BidderCisCheckResponse;
import com.example.Tender.bidder.dto.ml.BidderDocumentResponse;
import com.example.Tender.bidder.dto.ml.BidderTaxpayerVerifyRequest;
import com.example.Tender.bidder.dto.ml.BidderTaxpayerVerifyResponse;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.exception.BidderNotFoundException;
import com.example.Tender.bidder.provider.MlBusinessVerificationProvider;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.security.BidderPrincipal;
import com.example.Tender.bidder.security.service.jwt.BidderJwtUtils;
import com.example.Tender.bidder.service.BidderDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/bidder/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class BidderDocumentController {

    private final BidderDocumentService bidderDocumentService;
    private final MlBusinessVerificationProvider mlVerificationProvider;
    private final BidderRepository bidderRepository;
    private final BidderJwtUtils bidderJwtUtils;

    /**
     * Upload and analyze a compliance document (PDF, JPG, PNG) using ML Anti-Forgery Engine.
     * Uploads to Cloudinary and runs pyHanko digital signature check, pyzbar QR verification, and OCR.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BidderDocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "documentType", required = false, defaultValue = "generic") String documentType,
            @AuthenticationPrincipal BidderPrincipal principal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long bidderId = resolveBidderId(principal, authHeader);
        BidderDocumentResponse response = bidderDocumentService.uploadAndAnalyze(file, documentType, bidderId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all compliance documents uploaded by the authenticated bidder.
     */
    @GetMapping
    public ResponseEntity<List<BidderDocumentResponse>> getMyDocuments(
            @AuthenticationPrincipal BidderPrincipal principal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long bidderId = resolveBidderId(principal, authHeader);
        return ResponseEntity.ok(bidderDocumentService.getBidderDocuments(bidderId));
    }

    /**
     * Get specific uploaded document with full ML extraction and authenticity reports.
     */
    @GetMapping("/{id}")
    public ResponseEntity<BidderDocumentResponse> getDocumentById(
            @PathVariable Long id,
            @AuthenticationPrincipal BidderPrincipal principal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long bidderId = resolveBidderId(principal, authHeader);
        return ResponseEntity.ok(bidderDocumentService.getBidderDocument(id, bidderId));
    }

    /**
     * Delete an uploaded document from both Cloudinary and database.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal BidderPrincipal principal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long bidderId = resolveBidderId(principal, authHeader);
        bidderDocumentService.deleteDocument(id, bidderId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Pre-Submission CIS Compliance Self-Check:
     * Calculates the Composite Compliance Index (CIS score 0.0 - 1.0) and deficiency warnings
     * against tender criteria before submitting a bid.
     */
    @PostMapping("/check-cis")
    public ResponseEntity<BidderCisCheckResponse> checkCis(
            @RequestBody(required = false) BidderCisCheckRequest request,
            @AuthenticationPrincipal BidderPrincipal principal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long bidderId = resolveBidderId(principal, authHeader);
        BidderCisCheckRequest req = (request != null) ? request : new BidderCisCheckRequest();
        return ResponseEntity.ok(bidderDocumentService.checkCisCompliance(bidderId, req));
    }

    /**
     * Instant Taxpayer Document Scanner:
     * Directly uploads a PAN/GST document, runs OCR, cross-validates identifiers, and queries live GST portal.
     */
    @PostMapping(value = "/scan-taxpayer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> scanTaxpayerDoc(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "useLivePortal", defaultValue = "false") boolean useLivePortal) {

        return ResponseEntity.ok(mlVerificationProvider.scanAndVerifyTaxpayerDoc(file, useLivePortal));
    }

    /**
     * Live Taxpayer Identifier Verification (GSTIN or PAN):
     * Directly verifies taxpayer registration status, filing rate, and compliance score via ML engine.
     */
    @PostMapping("/verify-taxpayer")
    public ResponseEntity<BidderTaxpayerVerifyResponse> verifyTaxpayer(
            @Valid @RequestBody BidderTaxpayerVerifyRequest request) {

        BidderTaxpayerVerifyResponse response = mlVerificationProvider.verifyTaxpayer(
                request.getIdentifier(),
                request.getIdentifierType(),
                request.getExpectedLegalName(),
                request.getStateCode(),
                request.getUseLivePortal()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Master Autonomous Audit for Bidder (GFR 173(i) MSE Waivers + Dynamic CIS + Random Forest Verdict):
     * Audits all uploaded compliance certificates against tender requirements before official bid submission.
     */
    @PostMapping("/audit-submission")
    public ResponseEntity<Map<String, Object>> auditSubmission(
            @RequestBody(required = false) Map<String, Object> request,
            @AuthenticationPrincipal BidderPrincipal principal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long bidderId = resolveBidderId(principal, authHeader);
        return ResponseEntity.ok(bidderDocumentService.auditSubmission(bidderId, request));
    }

    /**
     * Batch Upload Autonomous Audit for Bidder:
     * Uploads multiple certificates + tender notice simultaneously for full ML forensic audit.
     */
    @PostMapping(value = "/batch-audit-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> batchAuditFiles(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "tender_file", required = false) MultipartFile tenderFile,
            @RequestParam(value = "is_msme", required = false, defaultValue = "false") boolean isMsme,
            @RequestParam(value = "is_startup", required = false, defaultValue = "false") boolean isStartup) {

        return ResponseEntity.ok(bidderDocumentService.batchAuditFiles(files, tenderFile, isMsme, isStartup));
    }

    /**
     * Bidder Dossier & Pre-Chunked RAG Markdown:
     * Returns the comprehensive audit dossier and RAG context for the authenticated bidder.
     */
    @GetMapping("/overall-summary")
    public ResponseEntity<Map<String, Object>> getBidderDossier(
            @RequestParam(value = "tender_type", required = false, defaultValue = "goods") String tenderType,
            @RequestParam(value = "use_live_portal", required = false, defaultValue = "false") boolean useLivePortal,
            @RequestParam(value = "include_rag_context", required = false, defaultValue = "true") boolean includeRagContext,
            @AuthenticationPrincipal BidderPrincipal principal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long bidderId = resolveBidderId(principal, authHeader);
        return ResponseEntity.ok(bidderDocumentService.getBidderDossier(bidderId, tenderType, useLivePortal, includeRagContext));
    }

    /**
     * Dynamic Tender Requirements & 6-Pillar Checklist for Bidder:
     * Parses tender text and returns mandatory items vs GFR 173(i) MSE/Startup exemptions.
     */
    @PostMapping("/tender-requirements")
    public ResponseEntity<Map<String, Object>> parseTenderRequirements(@RequestBody Map<String, Object> req) {
        return ResponseEntity.ok(bidderDocumentService.parseTenderRequirements(req));
    }

    /**
     * Direct Random Forest Compliance Verdict Predictor for Bidder:
     * Evaluates 9-dimensional compliance features to forecast qualification verdict.
     */
    @PostMapping("/predict-compliance")
    public ResponseEntity<Map<String, Object>> predictCompliance(@RequestBody Map<String, Object> req) {
        return ResponseEntity.ok(bidderDocumentService.predictCompliance(req));
    }

    /**
     * Helper to resolve bidder ID from either Spring Security Principal or Bearer Header
     */
    private Long resolveBidderId(BidderPrincipal principal, String authHeader) {
        if (principal != null && principal.getId() != null) {
            return principal.getId();
        }
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (bidderJwtUtils.validateJwtToken(token)) {
                String email = bidderJwtUtils.getUsernameFromJwtToken(token);
                Bidder bidder = bidderRepository.findByEmail(email)
                        .orElseThrow(() -> new BidderNotFoundException("Bidder not found for authenticated token"));
                return bidder.getId();
            }
        }
        throw new BidderNotFoundException("Unauthorized: Valid bidder credentials or Bearer token required.");
    }
}
