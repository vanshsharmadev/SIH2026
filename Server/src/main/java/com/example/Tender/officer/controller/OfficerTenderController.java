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

    /**
     * Upload Tender Document (PDF/Image), forward to Python ML Service for OCR & Authenticity analysis,
     * and persist extracted intelligence into PostgreSQL.
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
}
