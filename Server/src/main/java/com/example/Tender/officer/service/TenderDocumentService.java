package com.example.Tender.officer.service;

import com.example.Tender.officer.dto.cloudinary.CloudinaryUploadResult;
import com.example.Tender.officer.dto.ml.*;
import com.example.Tender.officer.model.TenderDocument;
import com.example.Tender.officer.repository.TenderDocumentRepository;
import com.example.Tender.officer.security.service.OfficerPrincipal;
import com.example.Tender.officer.service.cloudinary.CloudinaryService;
import com.example.Tender.officer.service.ml.MlServiceClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenderDocumentService {

    private final TenderDocumentRepository tenderDocumentRepository;
    private final MlServiceClient mlServiceClient;
    private final CloudinaryService cloudinaryService;
    private final ObjectMapper objectMapper;

    /**
     * Upload tender PDF, forward to ML service for OCR/Authenticity/Structure analysis, and save in PostgreSQL.
     */
    @Transactional
    public TenderUploadResponse uploadAndProcessTender(
            MultipartFile file,
            String title,
            String description,
            String documentType,
            OfficerPrincipal principal) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Document file must not be empty");
        }

        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Tender title is required");
        }

        log.info("Processing tender document upload: title='{}', officerEmail='{}'", title, principal.getEmail());

        String effectiveDocType = (documentType != null && !documentType.isBlank()) ? documentType : "other";

        // 1. Upload to Cloudinary
        CloudinaryUploadResult cloudinaryResult = null;
        try {
            cloudinaryResult = cloudinaryService.uploadFile(file, "tenders");
            log.info("Uploaded tender document to Cloudinary: publicId={}, secureUrl={}",
                    cloudinaryResult.getPublicId(), cloudinaryResult.getSecureUrl());
        } catch (Exception e) {
            log.warn("Cloudinary upload failed for tender '{}': {}", title, e.getMessage());
        }

        // 2. Call ML Service
        DocumentProcessResponse mlResponse;
        try {
            mlResponse = mlServiceClient.processDocument(file, effectiveDocType, true);
        } catch (Exception e) {
            log.error("ML analysis failed for tender '{}': {}", title, e.getMessage());
            // Create fallback response so upload does not completely break if ML service has temporary glitch
            mlResponse = DocumentProcessResponse.builder()
                    .status("FAILED")
                    .message("ML Analysis unavailable: " + e.getMessage())
                    .build();
        }

        // 3. Prepare JSON strings for database persistence
        String structuredJson = toJson(mlResponse.getStructuredData());
        String authenticityDetailsJson = toJson(
                mlResponse.getAuthenticityDetails() != null
                        ? mlResponse.getAuthenticityDetails()
                        : mlResponse.getAuthenticity()
        );
        String mlRawResponseJson = toJson(mlResponse.getAdditionalProperties());

        // 4. Build TenderDocument Entity
        TenderDocument entity = TenderDocument.builder()
                .title(title)
                .description(description)
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .fileUrl(cloudinaryResult != null ? cloudinaryResult.getSecureUrl() : null)
                .cloudinaryPublicId(cloudinaryResult != null ? cloudinaryResult.getPublicId() : null)
                .documentType(effectiveDocType)
                .uploadedByOfficerId(principal.getId())
                .uploadedByOfficerName(principal.getName())
                .uploadedByEmail(principal.getEmail())
                .departmentName(principal.getDepartmentName())
                .rawOcrText(mlResponse.getConsolidatedOcrText())
                .structuredDataJson(structuredJson)
                .authenticityDetailsJson(authenticityDetailsJson)
                .mlRawResponseJson(mlRawResponseJson)
                .authenticityScore(mlResponse.getAuthenticityScore())
                .isAuthentic(mlResponse.getIsAuthentic())
                .status("FAILED".equalsIgnoreCase(mlResponse.getStatus()) ? "FAILED" : "PROCESSED")
                .build();

        TenderDocument saved = tenderDocumentRepository.save(entity);
        log.info("Saved TenderDocument with ID: {}", saved.getId());

        return mapToUploadResponse(saved);
    }

    /**
     * Retrieve all tenders uploaded by the currently authenticated officer.
     */
    @Transactional(readOnly = true)
    public List<TenderUploadResponse> getOfficerTenders(OfficerPrincipal principal) {
        return tenderDocumentRepository.findByUploadedByOfficerIdOrderByCreatedAtDesc(principal.getId())
                .stream()
                .map(this::mapToUploadResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve a specific tender document by ID.
     */
    @Transactional(readOnly = true)
    public TenderUploadResponse getTenderById(Long id, OfficerPrincipal principal) {
        TenderDocument tender = tenderDocumentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Tender document not found with ID: " + id));

        return mapToUploadResponse(tender);
    }

    /**
     * Compare bidders against the requirements of a specific uploaded tender using ML CIS analysis.
     */
    public TenderComparisonResponse compareBidders(Long id, TenderComparisonRequest request, OfficerPrincipal principal) {
        TenderDocument tender = tenderDocumentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Tender document not found with ID: " + id));

        Map<String, Object> requirements = request.getTenderRequirements();
        if ((requirements == null || requirements.isEmpty()) && tender.getStructuredDataJson() != null) {
            requirements = parseJsonToMap(tender.getStructuredDataJson());
        }

        Map<String, Object> comparisonResult = mlServiceClient.compareBiddersCis(
                request.getBiddersData(),
                requirements
        );

        return TenderComparisonResponse.builder()
                .tenderId(tender.getId())
                .tenderTitle(tender.getTitle())
                .status("SUCCESS")
                .comparisonResult(comparisonResult)
                .build();
    }

    /**
     * Retrieve supported ML document types and compliance weights.
     */
    public Map<String, Object> getDocumentTypes() {
        return mlServiceClient.getDocumentTypes();
    }

    /**
     * Health check of the ML service.
     */
    public Map<String, Object> getMlHealth() {
        return mlServiceClient.checkHealth();
    }

    // ==========================================
    // Advanced ML Endpoints Delegations
    // ==========================================

    public Map<String, Object> verifyDocument(MultipartFile file, String docType, String ocrText, boolean autoOcr) {
        return mlServiceClient.verifyDocument(file, docType, ocrText, autoOcr);
    }

    public Map<String, Object> verifyQrPayload(String payload, String documentType, String ocrText) {
        return mlServiceClient.verifyQrPayload(payload, documentType, ocrText);
    }

    public Map<String, Object> ocrScanWithBarcode(MultipartFile file, String docType, boolean preprocess, boolean autoScanBarcode) {
        return mlServiceClient.ocrScanWithBarcode(file, docType, preprocess, autoScanBarcode);
    }

    public Map<String, Object> extractText(MultipartFile file, String documentType, boolean preprocess) {
        return mlServiceClient.extractText(file, documentType, preprocess);
    }

    public Map<String, Object> extractStructured(MultipartFile file, String documentType) {
        return mlServiceClient.extractStructured(file, documentType);
    }

    public Map<String, Object> scanAndVerifyTaxpayer(MultipartFile file, String text, boolean preprocess, boolean useLivePortal) {
        return mlServiceClient.scanAndVerifyTaxpayer(file, text, preprocess, useLivePortal);
    }

    public Map<String, Object> scanTaxpayerText(String text, boolean useLivePortal) {
        return mlServiceClient.scanTaxpayerText(text, useLivePortal);
    }

    public Map<String, Object> verifyTaxpayer(String identifier, String identifierType, String stateCode) {
        return mlServiceClient.verifyTaxpayer(identifier, identifierType, stateCode);
    }

    public Map<String, Object> getGstPortalStatus() {
        return mlServiceClient.getGstPortalStatus();
    }

    public Map<String, Object> getComplianceErrorsCatalog() {
        return mlServiceClient.getComplianceErrorsCatalog();
    }

    public Map<String, Object> calculateCis(Map<String, Object> documents, Map<String, Object> tenderRequirements, Map<String, Object> bidderInfo) {
        return mlServiceClient.calculateCis(documents, tenderRequirements, bidderInfo);
    }

    public Map<String, Object> processClearance(String officerId, Map<String, Object> complianceRequest) {
        return mlServiceClient.processClearance(officerId, complianceRequest);
    }

    public Map<String, Object> executeSingleClickClearance(String clearanceId, String officerId, String justification) {
        return mlServiceClient.executeSingleClickClearance(clearanceId, officerId, justification);
    }

    public Map<String, Object> getClearanceStatistics() {
        return mlServiceClient.getClearanceStatistics();
    }

    public Map<String, Object> getCisWeights() {
        return mlServiceClient.getCisWeights();
    }

    public Map<String, Object> extractEntities(String text, String documentType) {
        return mlServiceClient.extractEntities(text, documentType);
    }

    public Map<String, Object> classifyDocument(MultipartFile file) {
        return mlServiceClient.classifyDocument(file);
    }

    public Map<String, Object> automateAll(Map<String, Object> request) {
        return mlServiceClient.automateAll(request);
    }

    public Map<String, Object> automateAllFiles(List<MultipartFile> files, MultipartFile tenderFile, Boolean isMsme, Boolean isStartup) {
        return mlServiceClient.automateAllFiles(files, tenderFile, isMsme, isStartup);
    }

    public Map<String, Object> getOverallSummary(String bidId, String identifier, String tenderType, Boolean useLivePortal, Boolean includeRagContext) {
        return mlServiceClient.getOverallSummary(bidId, identifier, tenderType, useLivePortal, includeRagContext);
    }

    public Map<String, Object> getTenderRequirements(Map<String, Object> request) {
        return mlServiceClient.getTenderRequirements(request);
    }

    public Map<String, Object> predictComplianceVerdict(Map<String, Object> request) {
        return mlServiceClient.predictComplianceVerdict(request);
    }

    public Map<String, Object> trainAllModels(Map<String, Object> request) {
        return mlServiceClient.trainAllModels(request);
    }


    private TenderUploadResponse mapToUploadResponse(TenderDocument entity) {
        return TenderUploadResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .fileName(entity.getFileName())
                .fileType(entity.getFileType())
                .fileSize(entity.getFileSize())
                .fileUrl(entity.getFileUrl())
                .cloudinaryPublicId(entity.getCloudinaryPublicId())
                .documentType(entity.getDocumentType())
                .uploadedByOfficerId(entity.getUploadedByOfficerId())
                .uploadedByOfficerName(entity.getUploadedByOfficerName())
                .uploadedByEmail(entity.getUploadedByEmail())
                .departmentName(entity.getDepartmentName())
                .status(entity.getStatus())
                .authenticityScore(entity.getAuthenticityScore())
                .isAuthentic(entity.getIsAuthentic())
                .rawOcrText(entity.getRawOcrText())
                .structuredData(parseJsonToMap(entity.getStructuredDataJson()))
                .authenticityDetails(parseJsonToMap(entity.getAuthenticityDetailsJson()))
                .mlRawResponse(parseJsonToMap(entity.getMlRawResponseJson()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.warn("Could not serialize object to JSON: {}", e.getMessage());
            return null;
        }
    }

    private Map<String, Object> parseJsonToMap(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
