import api from './api';

export const documentService = {
  /**
   * Upload tender/bid documents with upload progress tracking
   */
  uploadDocument: async (formData, onUploadProgress = null) => {
    return await api.post('/documents/upload', formData, {
      onUploadProgress,
    });
  },

  /**
   * Fetch document metadata and verification status
   */
  getDocument: async (docId) => {
    return await api.get(`/documents/${docId}`);
  },

  /**
   * Download authenticated document blob
   */
  downloadDocument: async (docId) => {
    return await api.get(`/documents/${docId}/download`, {
      responseType: 'blob',
    });
  },

  /**
   * Trigger OCR text extraction and clause parsing
   */
  runOcrCheck: async (docId) => {
    return await api.post(`/documents/${docId}/ocr`);
  },

  /**
   * Verify digital signature (DSC / eSign) authenticity
   */
  verifyDocumentSignature: async (docId) => {
    return await api.post(`/documents/${docId}/verify-signature`);
  },

  /**
   * Remove a document
   */
  deleteDocument: async (docId) => {
    return await api.delete(`/documents/${docId}`);
  },
};

export default documentService;
