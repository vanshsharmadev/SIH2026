import api from './api';

/**
 * Service for Bidder Compliance Documents & AI Verification Engine
 * Endpoints:
 * - POST   /api/bidder/documents/upload         -> Upload & analyze compliance document (Cloudinary + ML pyHanko + OCR)
 * - GET    /api/bidder/documents                -> Get all uploaded compliance documents for authenticated bidder
 * - GET    /api/bidder/documents/{id}           -> 3.3 Get Document by ID (Cloudinary link, OCR text, authenticity scores)
 * - DELETE /api/bidder/documents/{id}           -> 3.4 Delete Document (Deletes from Cloudinary CDN & PostgreSQL)
 * - POST   /api/bidder/documents/check-cis      -> Pre-Submission CIS Compliance Self-Check (Score 0.0 - 1.0)
 * - POST   /api/bidder/documents/scan-taxpayer  -> Instant Taxpayer Document Scanner (OCR + Live GST)
 * - POST   /api/bidder/documents/verify-taxpayer-> Live Taxpayer Verification (GSTIN/PAN)
 * - GET    /api/bidder/documents/overall-summary-> Comprehensive Bidder Dossier & RAG context
 */
export const documentService = {
  /**
   * Upload compliance document with upload progress tracking
   * @param {File|FormData} fileOrFormData - Either a File object or pre-constructed FormData
   * @param {string} [documentType='generic'] - Category (pan_card, gst_certificate, udyam_msme, gfr_144, mii_declaration, etc.)
   * @param {function} [onUploadProgress] - Axios upload progress callback
   */
  uploadDocument: async (fileOrFormData, documentType = 'generic', onUploadProgress = null) => {
    let payload = fileOrFormData;
    if (fileOrFormData instanceof File || (typeof Blob !== 'undefined' && fileOrFormData instanceof Blob)) {
      payload = new FormData();
      payload.append('file', fileOrFormData);
      if (documentType) {
        payload.append('documentType', documentType);
      }
    } else if (fileOrFormData instanceof FormData) {
      if (documentType && !fileOrFormData.has('documentType')) {
        fileOrFormData.append('documentType', documentType);
      }
    }

    return await api.post('/bidder/documents/upload', payload, {
      onUploadProgress,
    });
  },

  /**
   * Get all compliance documents uploaded by the authenticated bidder
   */
  getDocuments: async () => {
    return await api.get('/bidder/documents');
  },

  /**
   * 3.3 Get Document by ID
   * Retrieves full document details with Cloudinary link, OCR text, and authenticity scores.
   * @param {string|number} docId
   */
  getDocument: async (docId) => {
    return await api.get(`/bidder/documents/${docId}`);
  },

  /**
   * Alias for getDocument
   */
  getDocumentById: async (docId) => {
    return await api.get(`/bidder/documents/${docId}`);
  },

  /**
   * 3.4 Delete Document
   * Deletes the document both from Cloudinary CDN and PostgreSQL database.
   * @param {string|number} docId
   */
  deleteDocument: async (docId) => {
    return await api.delete(`/bidder/documents/${docId}`);
  },

  /**
   * Pre-Submission CIS Compliance Self-Check:
   * Calculates the Composite Compliance Index (CIS score 0.0 - 1.0) and deficiency warnings
   * against tender criteria before submitting a bid.
   */
  checkCisCompliance: async (req = {}) => {
    return await api.post('/bidder/documents/check-cis', req);
  },

  /**
   * Instant Taxpayer Document Scanner:
   * Directly uploads a PAN/GST document, runs OCR, cross-validates identifiers, and queries live GST portal.
   */
  scanTaxpayerDoc: async (file, useLivePortal = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('useLivePortal', String(useLivePortal));
    return await api.post('/bidder/documents/scan-taxpayer', formData);
  },

  /**
   * Live Taxpayer Identifier Verification (GSTIN or PAN):
   */
  verifyTaxpayer: async (data) => {
    return await api.post('/bidder/documents/verify-taxpayer', data);
  },

  /**
   * Bidder Dossier & Pre-Chunked RAG Markdown:
   */
  getBidderDossier: async (params = {}) => {
    return await api.get('/bidder/documents/overall-summary', { params });
  },

  /**
   * Download authenticated document blob
   */
  downloadDocument: async (docId) => {
    return await api.get(`/bidder/documents/${docId}/download`, {
      responseType: 'blob',
    });
  },

  /**
   * Trigger OCR text extraction and clause parsing
   */
  runOcrCheck: async (docId) => {
    return await api.post(`/bidder/documents/${docId}/ocr`);
  },

  /**
   * Verify digital signature (DSC / eSign) authenticity
   */
  verifyDocumentSignature: async (docId) => {
    return await api.post(`/bidder/documents/${docId}/verify-signature`);
  },
};

export default documentService;
