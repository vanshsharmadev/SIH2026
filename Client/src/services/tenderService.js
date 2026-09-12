import api from './api';
import mockTenders, { getTenderById as getMockTenderById } from '../data/mockTenders';

/**
 * Tender Service
 * Mapped to official Postman collection endpoints:
 *
 * PUBLIC / GENERAL:
 *  GET  /api/tenders              — Fetch all tenders (public listing)
 *  GET  /api/tenders/:id          — Fetch single tender by ID
 *  POST /api/tenders              — Create tender
 *  PUT  /api/tenders/:id          — Update tender
 *  DEL  /api/tenders/:id          — Delete/archive tender
 *
 * OFFICER-SPECIFIC (Postman Section 3):
 *  3.1 POST /api/officer/tenders/upload                 — Upload Tender Doc (Cloudinary + ML OCR)
 *  3.2 GET  /api/officer/tenders                        — Get Officer's Tenders
 *  3.3 GET  /api/officer/tenders/:id                    — Get Tender by ID (officer-scoped)
 *  3.4 POST /api/officer/tenders/:id/compare-bidders    — Compare Bidders via ML CIS
 *
 * BIDS:
 *  GET  /api/tenders/:id/bids     — Fetch bids for tender
 *  POST /api/tenders/:id/bids     — Submit bid
 */
export const tenderService = {
  // ═══════════════════════════════════════════════════════════════════════
  //  PUBLIC TENDER ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetch active and archived tenders with search, filter, and pagination support.
   * Gracefully handles multiple response formats and falls back to mock data.
   */
  getTenders: async (params = {}) => {
    try {
      const res = await api.get('/tenders', { params });
      
      if (Array.isArray(res)) return res.length > 0 ? res : mockTenders;
      if (res && Array.isArray(res.content)) return res.content.length > 0 ? res.content : mockTenders;
      if (res && Array.isArray(res.data)) return res.data.length > 0 ? res.data : mockTenders;
      if (res && Array.isArray(res.tenders)) return res.tenders.length > 0 ? res.tenders : mockTenders;

      return mockTenders;
    } catch (err) {
      console.warn('Backend /tenders unavailable, using mock tenders fallback:', err.message);
      return mockTenders;
    }
  },

  /**
   * Fetch single tender by ID or tender reference number
   */
  getTenderById: async (id) => {
    try {
      const res = await api.get(`/tenders/${id}`);
      const data = res?.data || res;
      if (data && typeof data === 'object' && (data.id || data.referenceNo || data.title)) {
        return data;
      }
      return getMockTenderById(id) || mockTenders[0];
    } catch (err) {
      console.warn(`Backend /tenders/${id} unavailable, using mock tender:`, err.message);
      return getMockTenderById(id) || mockTenders[0];
    }
  },

  /**
   * Publish / Create a new tender
   */
  createTender: async (tenderData) => {
    return await api.post('/tenders', tenderData);
  },

  /**
   * Update tender information or deadlines
   */
  updateTender: async (id, tenderData) => {
    return await api.put(`/tenders/${id}`, tenderData);
  },

  /**
   * Cancel or archive a tender
   */
  deleteTender: async (id) => {
    return await api.delete(`/tenders/${id}`);
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  BIDS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetch all bids submitted for a tender
   */
  getTenderBids: async (tenderId) => {
    try {
      const res = await api.get(`/tenders/${tenderId}/bids`);
      return Array.isArray(res) ? res : res?.data || res?.content || [];
    } catch (err) {
      console.warn(`Backend /tenders/${tenderId}/bids unavailable:`, err.message);
      return [];
    }
  },

  /**
   * Submit a new bid proposal for evaluation
   */
  submitBid: async (tenderId, bidData) => {
    return await api.post(`/tenders/${tenderId}/bids`, bidData);
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.1 — Upload Tender Document (Cloudinary + ML OCR)
  //  POST /api/officer/tenders/upload
  //  Body: FormData { file, title, description, documentType }
  //  Headers: Authorization: Bearer <officer_token>
  // ═══════════════════════════════════════════════════════════════════════
  uploadTenderDocument: async (file, metadata = {}, onUploadProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    formData.append('documentType', metadata.documentType || 'other');

    return await api.post('/officer/tenders/upload', formData, {
      onUploadProgress,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.2 — Get Officer's Tenders
  //  GET /api/officer/tenders
  //  Headers: Authorization: Bearer <officer_token>
  // ═══════════════════════════════════════════════════════════════════════
  getOfficerTenders: async (params = {}) => {
    try {
      const res = await api.get('/officer/tenders', { params });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.content)) return res.content;
      return [];
    } catch (err) {
      console.warn('Officer tenders endpoint unavailable:', err.message);
      return [];
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.3 — Get Tender by ID (officer-scoped)
  //  GET /api/officer/tenders/:id
  //  Headers: Authorization: Bearer <officer_token>
  // ═══════════════════════════════════════════════════════════════════════
  getOfficerTenderById: async (id) => {
    try {
      const res = await api.get(`/officer/tenders/${id}`);
      return res?.data || res;
    } catch (err) {
      console.warn(`Officer tender ${id} endpoint unavailable:`, err.message);
      return null;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.4 — Compare Bidders via ML CIS
  //  POST /api/officer/tenders/:id/compare-bidders
  //  Headers: Authorization: Bearer <officer_token>
  //  Body: { bidders_data: [...], tender_requirements: { ... } }
  // ═══════════════════════════════════════════════════════════════════════
  compareBidders: async (tenderId, biddersData, tenderRequirements) => {
    return await api.post(`/officer/tenders/${tenderId}/compare-bidders`, {
      bidders_data: biddersData,
      tender_requirements: tenderRequirements,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.5 — Officer Per-Tender AI Chatbot (Node AI RAG & Gemini Chatbot)
  //  POST /api/officer/tenders/chat
  //  Headers: Authorization: Bearer <officer_token>
  //  Body: { tenderId: "1" | "TND-001", bidderId: "BID-007", query: "..." }
  // ═══════════════════════════════════════════════════════════════════════
  officerTenderChat: async ({ tenderId, bidderId, query }) => {
    const payload = {
      tenderId: tenderId !== undefined && tenderId !== null ? String(tenderId) : '1',
      bidderId: bidderId !== undefined && bidderId !== null ? String(bidderId) : 'BID-007',
      query: String(query || '').trim(),
    };
    return await api.post('/officer/tenders/chat', payload);
  },
};

export default tenderService;
