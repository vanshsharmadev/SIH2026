package com.example.Tender.controller;

import com.example.Tender.officer.dto.OfficerApiResponse;
import com.example.Tender.officer.dto.ml.TenderUploadResponse;
import com.example.Tender.officer.service.TenderDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public & Bidder-accessible Tender Controller.
 * Base URIs: /tenders and /api/tenders
 * Allows unauthenticated visitors and authenticated commercial bidders
 * to browse active tenders and inspect tender specifications without RBAC restriction.
 */
@RestController
@RequestMapping({"/tenders", "/api/tenders"})
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(
        originPatterns = {"https://gem-compliflix.vercel.app", "https://*.vercel.app", "http://localhost:[*]", "http://127.0.0.1:[*]", "*"},
        allowedHeaders = "*",
        allowCredentials = "true",
        maxAge = 3600
)
public class PublicTenderController {

    private final TenderDocumentService tenderDocumentService;

    /**
     * Retrieve all active tenders on the platform.
     * GET /api/tenders?limit=100
     */
    @GetMapping
    public ResponseEntity<OfficerApiResponse<List<TenderUploadResponse>>> getAllTenders(
            @RequestParam(value = "limit", defaultValue = "100") int limit) {
        log.info("Fetching public tenders with limit={}", limit);
        List<TenderUploadResponse> tenders = tenderDocumentService.getTopTenders(limit);
        return ResponseEntity.ok(
                OfficerApiResponse.success("Tenders retrieved successfully", tenders)
        );
    }

    /**
     * Retrieve single tender by ID.
     * GET /api/tenders/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<OfficerApiResponse<TenderUploadResponse>> getTenderById(
            @PathVariable("id") String id) {
        try {
            Long numericId = Long.parseLong(id);
            TenderUploadResponse tender = tenderDocumentService.getTenderById(numericId, null);
            return ResponseEntity.ok(
                    OfficerApiResponse.success("Tender details retrieved successfully", tender)
            );
        } catch (NumberFormatException nfe) {
            // If ID is reference number format, search in tenders
            List<TenderUploadResponse> all = tenderDocumentService.getTopTenders(100);
            return all.stream()
                    .filter(t -> id.equalsIgnoreCase(String.valueOf(t.getId())) ||
                                 (t.getTitle() != null && t.getTitle().contains(id)))
                    .findFirst()
                    .map(t -> ResponseEntity.ok(OfficerApiResponse.success("Tender details retrieved successfully", t)))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        }
    }
}
