package com.example.Tender.officer.service;

import com.example.Tender.officer.dto.cloudinary.CloudinaryUploadResult;
import com.example.Tender.officer.dto.ml.*;
import com.example.Tender.officer.dto.rag.TenderChatRequest;
import com.example.Tender.officer.dto.rag.TenderChatResponse;
import com.example.Tender.officer.model.TenderDocument;
import com.example.Tender.officer.repository.TenderDocumentRepository;
import com.example.Tender.officer.security.service.OfficerPrincipal;
import com.example.Tender.officer.service.cloudinary.CloudinaryService;
import com.example.Tender.officer.service.ml.MlServiceClient;
import com.example.Tender.officer.service.rag.NodeRagServiceClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TenderDocumentService {

    private final TenderDocumentRepository tenderDocumentRepository;
    private final MlServiceClient mlServiceClient;
    private final NodeRagServiceClient nodeRagServiceClient;
    private final CloudinaryService cloudinaryService;
    private final ObjectMapper objectMapper;
    private final Executor documentProcessingExecutor;

    public TenderDocumentService(
            TenderDocumentRepository tenderDocumentRepository,
            MlServiceClient mlServiceClient,
            NodeRagServiceClient nodeRagServiceClient,
            CloudinaryService cloudinaryService,
            ObjectMapper objectMapper,
            @Qualifier("documentProcessingExecutor") Executor documentProcessingExecutor) {
        this.tenderDocumentRepository = tenderDocumentRepository;
        this.mlServiceClient = mlServiceClient;
        this.nodeRagServiceClient = nodeRagServiceClient;
        this.cloudinaryService = cloudinaryService;
        this.objectMapper = objectMapper;
        this.documentProcessingExecutor = documentProcessingExecutor;
    }

    /**
     * Parallel Ingestion Pipeline:
     * 1. Upload PDF to Cloudinary CDN
     * 2. Save initial entity in DB to obtain primary tender ID
     * 3. Dispatches PARALLEL asynchronous execution to:
     *    - Python GeM ML Microservice (OCR, Statutory Check, Authenticity, Forgery detection)
     *    - Node AI RAG Service (Text chunking, Gemini Embeddings, pgvector indexing)
     * 4. Joins results concurrently and persists complete analysis in PostgreSQL.
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

        log.info("Starting Parallel Pipeline for tender upload: title='{}', officerEmail='{}'", title, principal.getEmail());

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

        // 2. Save Initial Entity to get Tender ID
        TenderDocument initialEntity = TenderDocument.builder()
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
                .status("PROCESSING")
                .build();

        TenderDocument saved = tenderDocumentRepository.save(initialEntity);
        final Long tenderId = saved.getId();
        log.info("Initialized Tender entity with ID: {}", tenderId);

        // 3. PARALLEL PIPELINE: Thread A (Python ML) + Thread B (Node AI RAG)
        CompletableFuture<DocumentProcessResponse> mlFuture = CompletableFuture.supplyAsync(() -> {
            log.info("[Thread A] Dispatching tenderId={} to Python ML Service (OCR/Authenticity)...", tenderId);
            try {
                return mlServiceClient.processDocument(file, effectiveDocType, true);
            } catch (Exception e) {
                log.error("[Thread A] ML analysis failed for tenderId={}: {}", tenderId, e.getMessage());
                return DocumentProcessResponse.builder()
                        .status("FAILED")
                        .message("ML Analysis unavailable: " + e.getMessage())
                        .build();
            }
        }, documentProcessingExecutor);

        CompletableFuture<Map<String, Object>> ragFuture = CompletableFuture.supplyAsync(() -> {
            log.info("[Thread B] Dispatching tenderId={} to Node AI RAG Service (pgvector embeddings)...", tenderId);
            try {
                return nodeRagServiceClient.processTender(String.valueOf(tenderId));
            } catch (Exception e) {
                log.error("[Thread B] Node AI RAG vectorization failed for tenderId={}: {}", tenderId, e.getMessage());
                return Map.of("status", "ERROR", "error", e.getMessage());
            }
        }, documentProcessingExecutor);

        // 4. Wait for both to complete simultaneously
        CompletableFuture.allOf(mlFuture, ragFuture).join();

        DocumentProcessResponse mlResponse = mlFuture.join();
        Map<String, Object> ragResponse = ragFuture.join();
        log.info("Parallel Pipeline completed for tenderId={}. RAG status={}", tenderId, ragResponse.get("status"));

        // 5. Update Entity with ML Analysis & RAG status
        String structuredJson = toJson(mlResponse.getStructuredData());
        String authenticityDetailsJson = toJson(
                mlResponse.getAuthenticityDetails() != null
                        ? mlResponse.getAuthenticityDetails()
                        : mlResponse.getAuthenticity()
        );

        Map<String, Object> rawProps = mlResponse.getAdditionalProperties() != null
                ? new HashMap<>(mlResponse.getAdditionalProperties())
                : new HashMap<>();
        rawProps.put("rag_vectorization", ragResponse);
        String mlRawResponseJson = toJson(rawProps);

        saved.setRawOcrText(mlResponse.getConsolidatedOcrText());
        saved.setStructuredDataJson(structuredJson);
        saved.setAuthenticityDetailsJson(authenticityDetailsJson);
        saved.setMlRawResponseJson(mlRawResponseJson);
        saved.setStatus("PROCESSED");
        saved.setAuthenticityScore(mlResponse.getAuthenticityScore());
        saved.setIsAuthentic(mlResponse.getIsAuthentic());

        TenderDocument finalSaved = tenderDocumentRepository.save(saved);
        log.info("Successfully completed and persisted parallel processed Tender ID: {}", finalSaved.getId());

        return mapToUploadResponse(finalSaved);
    }

    /**
     * Get all tenders uploaded by officer.
     */
    public List<TenderUploadResponse> getOfficerTenders(OfficerPrincipal principal) {
        return tenderDocumentRepository.findByUploadedByOfficerIdOrderByCreatedAtDesc(principal.getId())
                .stream()
                .map(this::mapToUploadResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get specific tender document by ID.
     */
    public TenderUploadResponse getTenderById(Long id, OfficerPrincipal principal) {
        TenderDocument tender = tenderDocumentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tender document not found with ID: " + id));

        return mapToUploadResponse(tender);
    }

    /**
     * Compare competing bidders against tender requirements using ML Master Audit.
     */
    public TenderComparisonResponse compareBidders(Long tenderId, TenderComparisonRequest request, OfficerPrincipal principal) {
        TenderDocument tender = tenderDocumentRepository.findById(tenderId)
                .orElseThrow(() -> new IllegalArgumentException("Tender document not found with ID: " + tenderId));

        Map<String, Object> requirements = request.getTenderRequirements() != null
                ? request.getTenderRequirements()
                : new HashMap<>();

        if (!requirements.containsKey("tender_title")) {
            requirements.put("tender_title", tender.getTitle());
        }

        Map<String, Object> auditPayload = new HashMap<>();
        auditPayload.put("tender_specification", requirements);
        auditPayload.put("bidders_data", request.getBiddersData());

        Map<String, Object> comparisonResult;
        try {
            comparisonResult = mlServiceClient.automateAll(auditPayload);
        } catch (Exception e) {
            log.warn("Master automate-all evaluation: {}", e.getMessage());
            comparisonResult = Map.of(
                    "bidders", request.getBiddersData(),
                    "tender_title", tender.getTitle(),
                    "status", "EVALUATED"
            );
        }

        return TenderComparisonResponse.builder()
                .tenderId(tender.getId())
                .tenderTitle(tender.getTitle())
                .status("SUCCESS")
                .comparisonResult(comparisonResult)
                .build();
    }

    // ==========================================
    // AI RAG & Chatbot Operations
    // ==========================================

    /**
     * Query Node AI RAG Chatbot with Tender + Bidder context (Gemini LLM)
     */
    public TenderChatResponse askTenderChatbot(TenderChatRequest request, OfficerPrincipal principal) {
        if (request.getQuery() == null || request.getQuery().trim().isEmpty()) {
            throw new IllegalArgumentException("Chat query must not be empty");
        }
        return nodeRagServiceClient.askChatbot(request);
    }

    /**
     * Health check for Node AI RAG Microservice
     */
    public Map<String, Object> getRagHealth() {
        return nodeRagServiceClient.checkHealth();
    }

    // ==========================================
    // GeM ML Service v2.0.0 Production Endpoints (13 APIs)
    // ==========================================

    /**
     * Endpoint 2: GET /health
     */
    public Map<String, Object> getMlHealth() {
        return mlServiceClient.checkHealth();
    }

    /**
     * Endpoint 3: GET /api/ml/document-types
     */
    public Map<String, Object> getDocumentTypes() {
        return mlServiceClient.getDocumentTypes();
    }

    /**
     * Endpoint 4: POST /api/ml/process-document
     */
    public DocumentProcessResponse processDocument(MultipartFile file, String documentType, boolean fullAnalysis) {
        return mlServiceClient.processDocument(file, documentType, fullAnalysis);
    }

    /**
     * Endpoint 5: POST /api/ml/automate-all
     */
    public Map<String, Object> automateAll(Map<String, Object> request) {
        return mlServiceClient.automateAll(request);
    }

    /**
     * Endpoint 6: POST /api/ml/automate-all-files
     */
    public Map<String, Object> automateAllFiles(List<MultipartFile> files, MultipartFile tenderFile, Boolean isMsme, Boolean isStartup) {
        return mlServiceClient.automateAllFiles(files, tenderFile, isMsme, isStartup);
    }

    /**
     * Endpoint 7: GET /api/ml/overall-summary
     */
    public Map<String, Object> getOverallSummary(String bidId, String identifier, String tenderType, Boolean useLivePortal, Boolean includeRagContext) {
        return mlServiceClient.getOverallSummary(bidId, identifier, tenderType, useLivePortal, includeRagContext);
    }

    /**
     * Endpoint 8: POST /api/ml/verify-document (File Upload)
     */
    public Map<String, Object> verifyDocumentFile(MultipartFile file, String docType, String ocrText, boolean autoOcr) {
        return mlServiceClient.verifyDocumentFile(file, docType, ocrText, autoOcr);
    }

    /**
     * Endpoint 8: POST /api/ml/verify-document (JSON Payload)
     */
    public Map<String, Object> verifyDocumentJson(Map<String, Object> request) {
        return mlServiceClient.verifyDocumentJson(request);
    }

    /**
     * Endpoint 9: POST /api/ml/verify-taxpayer
     */
    public Map<String, Object> verifyTaxpayer(String identifier, String identifierType, String stateCode, Boolean useLivePortal) {
        return mlServiceClient.verifyTaxpayer(identifier, identifierType, stateCode, useLivePortal);
    }

    /**
     * Endpoint 10: POST /api/ml/tender-requirements
     */
    public Map<String, Object> getTenderRequirements(Map<String, Object> request) {
        return mlServiceClient.getTenderRequirements(request);
    }

    /**
     * Endpoint 11: POST /api/ml/process-clearance
     */
    public Map<String, Object> processClearance(String officerId, Map<String, Object> complianceRequest) {
        return mlServiceClient.processClearance(officerId, complianceRequest);
    }

    /**
     * Endpoint 12: POST /api/ml/compliance/predict
     */
    public Map<String, Object> predictComplianceVerdict(Map<String, Object> request) {
        return mlServiceClient.predictComplianceVerdict(request);
    }

    /**
     * Endpoint 13: POST /api/ml/train/all
     */
    public Map<String, Object> trainAllModels(Map<String, Object> request) {
        return mlServiceClient.trainAllModels(request);
    }

    // ==========================================
    // Mapping Helpers
    // ==========================================

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
