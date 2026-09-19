import api from './api';

/**
 * GeM ML Microservice v2.0.0 — All 13 Consolidated Production Endpoints
 *
 * These endpoints are proxied through Spring Boot Gateway at:
 *   /api/officer/tenders/ml/**
 *
 * Mapped exactly to the official Postman collection (Section 4).
 *
 *  4.1  GET  /api/officer/tenders/ml-health                — ML Health & Statutory Connectivity Check
 *  4.2  GET  /api/officer/tenders/document-types            — Document Taxonomy & Compliance Weights
 *  4.3  POST /api/officer/tenders/ml/process-document       — Single-File OCR + Classification
 *  4.4  POST /api/officer/tenders/ml/automate-all           — Master Autonomous Tender Audit (JSON)
 *  4.5  POST /api/officer/tenders/ml/automate-all-files     — Master Batch File Upload Audit
 *  4.6  GET  /api/officer/tenders/ml/overall-summary        — Comprehensive Dossier & RAG Synthesis
 *  4.7  POST /api/officer/tenders/ml/verify-document        — Forensic Verification (File Mode)
 *  4.8  POST /api/officer/tenders/ml/verify-document        — Forensic Verification (JSON Mode)
 *  4.9  POST /api/officer/tenders/ml/verify-taxpayer        — Statutory Taxpayer Verification
 *  4.10 POST /api/officer/tenders/ml/tender-requirements    — Dynamic Tender Requirements Parsing
 *  4.11 POST /api/officer/tenders/ml/process-clearance      — Procurement Clearance Decision Engine
 *  4.12 POST /api/officer/tenders/ml/compliance-predict     — Direct ML Compliance Score Predictor
 *  4.13 POST /api/officer/tenders/ml/train-all              — Unified ML Retraining Pipeline
 */
export const mlService = {
  // ═══════════════════════════════════════════════════════════════════════
  //  4.1 — ML Health & Statutory Connectivity Check
  //  GET /api/officer/tenders/ml-health
  //  Verifies ML microservice health and statutory registry connectivity
  // ═══════════════════════════════════════════════════════════════════════
  checkMLHealth: async () => {
    try {
      const res = await api.get('/officer/tenders/ml-health');
      return { online: true, ...(res?.data || res) };
    } catch (err) {
      console.warn('ML health check failed:', err.message);
      return { online: false, error: err.message };
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.2 — Document Taxonomy & Compliance Weights
  //  GET /api/officer/tenders/document-types
  //  Returns supported document types, field schemas, compliance weights
  // ═══════════════════════════════════════════════════════════════════════
  getDocumentTypes: async () => {
    const res = await api.get('/officer/tenders/document-types');
    return res?.data || res;
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.3 — Single-File Consolidated Intake (OCR + Classification)
  //  POST /api/officer/tenders/ml/process-document
  //  Body: FormData { file, document_type, full_analysis }
  //  Comprehensive: OCR, classification, entity extraction, QR decode,
  //  signature check, tampering detection
  // ═══════════════════════════════════════════════════════════════════════
  processDocument: async (file, documentType = 'auto', fullAnalysis = true, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('full_analysis', String(fullAnalysis));

    return await api.post('/officer/tenders/ml/process-document', formData, {
      onUploadProgress: onProgress,
      timeout: 120000, // 2 min timeout for ML processing
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.4 — Master Autonomous Tender Audit (JSON Intake)
  //  POST /api/officer/tenders/ml/automate-all
  //  Body: { bidder_id, gstin, pan, tender_id, documents[], tender_requirements, use_live_portal }
  //  Master pipeline: forensic verification, statutory check, 6-pillar compliance,
  //  ML score prediction, clear/reject verdict
  // ═══════════════════════════════════════════════════════════════════════
  automateAll: async (payload) => {
    return await api.post('/officer/tenders/ml/automate-all', payload, {
      timeout: 180000, // 3 min for full pipeline
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.5 — Master Multipart Batch File Upload Autonomous Audit
  //  POST /api/officer/tenders/ml/automate-all-files
  //  Body: FormData { files[], tender_file, is_msme, is_startup }
  //  Fully autonomous batch pipeline with auto-classification
  // ═══════════════════════════════════════════════════════════════════════
  automateAllFiles: async (bidderFiles, tenderFile, options = {}, onProgress = null) => {
    const formData = new FormData();

    // Append multiple bidder files
    if (Array.isArray(bidderFiles)) {
      bidderFiles.forEach((file) => formData.append('files', file));
    } else {
      formData.append('files', bidderFiles);
    }

    // Append tender document
    if (tenderFile) {
      formData.append('tender_file', tenderFile);
    }

    formData.append('is_msme', String(options.isMsme || false));
    formData.append('is_startup', String(options.isStartup || false));

    return await api.post('/officer/tenders/ml/automate-all-files', formData, {
      onUploadProgress: onProgress,
      timeout: 300000, // 5 min for batch processing
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.6 — Consolidated Single-GET Comprehensive Dossier & RAG Synthesis
  //  GET /api/officer/tenders/ml/overall-summary
  //  Query: identifier, bid_id, tender_type, use_live_portal, include_rag_context
  //  Returns unified 360° bidder dossier + RAG knowledge context
  // ═══════════════════════════════════════════════════════════════════════
  getOverallSummary: async ({ identifier, bidId, tenderType = 'goods', useLivePortal = false, includeRagContext = true } = {}) => {
    return await api.get('/officer/tenders/ml/overall-summary', {
      params: {
        identifier,
        bid_id: bidId,
        tender_type: tenderType,
        use_live_portal: useLivePortal,
        include_rag_context: includeRagContext,
      },
      timeout: 120000,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.7 — Unified Forensic Verification & Anti-Tampering (File Mode)
  //  POST /api/officer/tenders/ml/verify-document
  //  Body: FormData { file, doc_type, auto_ocr }
  //  Multi-layer: ELA analysis, pyHanko DSC, QR payload, stamp detection
  // ═══════════════════════════════════════════════════════════════════════
  verifyDocument: async (file, docType = 'auto', autoOcr = true, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    formData.append('auto_ocr', String(autoOcr));

    return await api.post('/officer/tenders/ml/verify-document', formData, {
      onUploadProgress: onProgress,
      timeout: 120000,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.8 — Unified Forensic Verification & Anti-Tampering (JSON Mode)
  //  POST /api/officer/tenders/ml/verify-document
  //  Body: { document_type, extracted_fields: { ... } }
  //  Arithmetic and statutory cross-validation for extracted data
  // ═══════════════════════════════════════════════════════════════════════
  verifyDocumentJSON: async (documentType, extractedFields) => {
    return await api.post('/officer/tenders/ml/verify-document', {
      document_type: documentType,
      extracted_fields: extractedFields,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.9 — Unified Statutory Taxpayer Verification (GSTIN, PAN, UIN)
  //  POST /api/officer/tenders/ml/verify-taxpayer
  //  Body: { identifier, identifier_type, use_live_portal }
  //  Checksum validation, status check, filing track record, risk flags
  // ═══════════════════════════════════════════════════════════════════════
  verifyTaxpayer: async (identifier, identifierType = 'gstin', useLivePortal = false) => {
    return await api.post('/officer/tenders/ml/verify-taxpayer', {
      identifier,
      identifier_type: identifierType,
      use_live_portal: useLivePortal,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.10 — Dynamic Tender Requirements Parsing & 6-Pillar Checklist
  //  POST /api/officer/tenders/ml/tender-requirements
  //  Body: { tender_text, tender_type, estimated_value }
  //  NLP extraction: financial criteria, experience, mandatory docs
  // ═══════════════════════════════════════════════════════════════════════
  parseTenderRequirements: async (tenderText, tenderType = 'goods', estimatedValue = 0) => {
    return await api.post('/officer/tenders/ml/tender-requirements', {
      tender_text: tenderText,
      tender_type: tenderType,
      estimated_value: estimatedValue,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.11 — Procurement Clearance Decision Engine
  //  POST /api/officer/tenders/ml/process-clearance?officer_id=OFF-101
  //  Body: { bidder_id, composite_cis_score, forensic_authenticity_score,
  //          taxpayer_verification, tender_requirements }
  //  Returns: CLEARED | CONDITIONALLY_CLEARED | REJECTED | ESCALATED_FOR_MANUAL_AUDIT
  // ═══════════════════════════════════════════════════════════════════════
  processClearance: async (clearanceData, officerId) => {
    return await api.post('/officer/tenders/ml/process-clearance', clearanceData, {
      params: { officer_id: officerId },
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.12 — Direct ML Compliance Verdict & Score Predictor
  //  POST /api/officer/tenders/ml/compliance-predict
  //  Body: { features: { document_completeness, tax_compliance_rate, ... } }
  //  ML classification model predicting compliance probability
  // ═══════════════════════════════════════════════════════════════════════
  predictCompliance: async (features) => {
    return await api.post('/officer/tenders/ml/compliance-predict', { features });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  4.13 — Unified Machine Learning Retraining Pipeline
  //  POST /api/officer/tenders/ml/train-all
  //  Body: { retrain_models: [...], epochs }
  //  Triggers retraining for classifiers, risk scoring, compliance predictors
  // ═══════════════════════════════════════════════════════════════════════
  triggerRetraining: async (models = ['classification', 'compliance_predictor'], epochs = 50) => {
    return await api.post('/officer/tenders/ml/train-all', {
      retrain_models: models,
      epochs,
    });
  },
};

export default mlService;
