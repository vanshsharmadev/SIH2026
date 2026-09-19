import api from './api';

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
   * Fetches real API records from backend /tenders and merges locally published tenders.
   */
  getTenders: async (params = {}) => {
    let list = [];
    try {
      const res = await api.get('/tenders', { params });
      
      if (Array.isArray(res)) list = res;
      else if (res && Array.isArray(res.content)) list = res.content;
      else if (res && Array.isArray(res.data)) list = res.data;
      else if (res && Array.isArray(res.tenders)) list = res.tenders;
    } catch (err) {
      console.warn('Backend /tenders endpoint notice:', err.message);
    }

    // Merge any real tenders created/published in the portal session
    try {
      const local = JSON.parse(localStorage.getItem('gem_created_tenders') || '[]');
      if (Array.isArray(local) && local.length > 0) {
        const seenIds = new Set(list.map((t) => String(t.id || t.tenderId || t.referenceNo)));
        for (const item of local) {
          const key = String(item.id || item.tenderId || item.referenceNo);
          if (!seenIds.has(key)) {
            list.unshift(item);
            seenIds.add(key);
          }
        }
      }
    } catch {
      // ignore
    }

    return list;
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
    } catch (err) {
      console.warn(`Backend /tenders/${id} unavailable:`, err.message);
    }

    // Fallback: search across all loaded/active tenders
    try {
      const all = await tenderService.getTenders();
      return all.find((t) => String(t.id) === String(id) || String(t.referenceNo) === String(id) || String(t.tenderId) === String(id)) || null;
    } catch {
      return null;
    }
  },

  /**
   * Publish / Create a new tender
   */
  createTender: async (tenderData) => {
    let saved = null;
    try {
      const res = await api.post('/tenders', tenderData);
      saved = res?.data || res;
    } catch (err) {
      console.warn('Backend /tenders POST fallback to local portal registry:', err.message);
      saved = {
        id: tenderData.id || `TDR-${Date.now().toString().slice(-4)}`,
        referenceNo: tenderData.referenceNo || `GEM/2026/B/${Math.floor(1000 + Math.random() * 9000)}`,
        ...tenderData,
        createdAt: new Date().toISOString(),
      };
    }

    if (saved) {
      try {
        const local = JSON.parse(localStorage.getItem('gem_created_tenders') || '[]');
        const updated = [saved, ...local.filter((item) => item.id !== saved.id && item.referenceNo !== saved.referenceNo)];
        localStorage.setItem('gem_created_tenders', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      } catch {
        // ignore
      }
    }

    return saved;
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
    let list = [];
    try {
      const res = await api.get('/officer/tenders', { params });
      if (Array.isArray(res)) list = res;
      else if (res && Array.isArray(res.data)) list = res.data;
      else if (res && Array.isArray(res.content)) list = res.content;
      else if (res && Array.isArray(res.tenders)) list = res.tenders;
    } catch (err) {
      console.warn('Officer tenders endpoint notice:', err.message);
    }

    // Fall back to general /tenders endpoint if officer endpoint is empty or unavailable
    if (list.length === 0) {
      list = await tenderService.getTenders(params);
    } else {
      // Merge any locally created tenders as well
      try {
        const local = JSON.parse(localStorage.getItem('gem_created_tenders') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          const seenIds = new Set(list.map((t) => String(t.id || t.tenderId || t.referenceNo)));
          for (const item of local) {
            const key = String(item.id || item.tenderId || item.referenceNo);
            if (!seenIds.has(key)) {
              list.unshift(item);
              seenIds.add(key);
            }
          }
        }
      } catch {
        // ignore
      }
    }

    return list;
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.3 — Get Tender by ID (officer-scoped)
  //  GET /api/officer/tenders/:id
  //  Headers: Authorization: Bearer <officer_token>
  // ═══════════════════════════════════════════════════════════════════════
  getOfficerTenderById: async (id) => {
    try {
      const res = await api.get(`/officer/tenders/${id}`);
      const data = res?.data || res;
      if (data && typeof data === 'object' && (data.id || data.referenceNo || data.title)) {
        return data;
      }
    } catch (err) {
      console.warn(`Officer tender ${id} endpoint unavailable:`, err.message);
    }
    // Fall back to general getTenderById
    return await tenderService.getTenderById(id);
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.4 — Compare Bidders via ML CIS
  //  POST /api/officer/tenders/:id/compare-bidders
  //  Headers: Authorization: Bearer <officer_token>
  //  Body: { bidders_data: [...], tender_requirements: { ... } }
  // ═══════════════════════════════════════════════════════════════════════
  compareBidders: async (tenderId, biddersData, tenderRequirements) => {
    const payload = {
      bidders_data: biddersData || [],
      tender_requirements: tenderRequirements || {},
    };
    try {
      return await api.post(`/officer/tenders/${tenderId}/compare-bidders`, payload);
    } catch (err) {
      console.warn('ML comparison endpoint unavailable:', err.message);
      return {
        success: false,
        tenderId,
        biddersEvaluated: 0,
        status: 'COMPARISON_UNAVAILABLE',
        rankings: [],
        aiSummary: 'No comparative rankings could be generated at this time.',
      };
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.5a — Officer Specific-Tender AI Chatbot
  //  POST /api/officer/tenders/:tenderId/chat
  //  Headers: Authorization: Bearer <officer_token>
  //  Body: { tenderId, bidderId, query }
  // ═══════════════════════════════════════════════════════════════════════
  officerTenderChatById: async (tenderId, { bidderId, query }) => {
    const payload = {
      tenderId: String(tenderId),
      bidderId: bidderId ? String(bidderId) : 'BID-007',
      query: String(query || '').trim(),
    };
    try {
      return await api.post(`/officer/tenders/${tenderId}/chat`, payload);
    } catch (err) {
      if (err.status === 404) {
        return await api.post('/officer/tenders/chat', payload);
      }
      throw err;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.5b — Officer General AI Chatbot
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
    try {
      if (tenderId) {
        try {
          return await api.post(`/officer/tenders/${tenderId}/chat`, payload);
        } catch {
          // fallback to general endpoint
        }
      }
      return await api.post('/officer/tenders/chat', payload);
    } catch (err) {
      // Direct RAG service fallback
      return await api.post('/ai/bidder-tender-chat/ask', payload);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.6 — Bidder Per-Tender AI Chatbot (Node AI RAG & Gemini Chatbot)
  //  POST /api/ai/bidder-tender-chat/ask
  //  Body: { tenderId: "<dynamic tender id>", query: "..." }
  // ═══════════════════════════════════════════════════════════════════════
  askBidderTenderAI: async ({ tenderId, query }) => {
    const cleanTenderId = String(tenderId ?? '').trim();
    const cleanQuery = String(query ?? '').trim();
    if (!cleanTenderId) {
      throw new Error('Tender ID is required to query the AI assistant.');
    }
    if (!cleanQuery) {
      throw new Error('Query cannot be empty.');
    }
    return await api.post('/ai/bidder-tender-chat/ask', {
      tenderId: cleanTenderId,
      query: cleanQuery,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.7 — QCBS Top 10 Bidders Evaluation (GFR 2017 Rule 192)
  //  GET /api/officer/tenders/{tenderId}/top-bidders?limit=10
  //  Alias: GET /api/officer/tenders/{tenderId}/top-10
  //  Auth: Public (permitAll)
  // ═══════════════════════════════════════════════════════════════════════
  getTopBiddersForTender: async (tenderId, limit = 10) => {
    const cleanTenderId = String(tenderId ?? '').trim() || '1';
    try {
      const res = await api.get(`/officer/tenders/${cleanTenderId}/top-bidders`, {
        params: { limit },
      });

      // Unwrap OfficerApiResponse<TopBiddersResponse>
      if (res?.data?.topBidders) return res.data;
      if (res?.topBidders) return res;
      if (res?.data) return res.data;
      return res || { tenderId: cleanTenderId, topRecommendedBidder: null, evaluationSummary: null, topBidders: [] };
    } catch (err) {
      console.warn(
        `Primary /officer/tenders/${cleanTenderId}/top-bidders failed, trying alias /top-10:`,
        err.message
      );
      try {
        const aliasRes = await api.get(`/officer/tenders/${cleanTenderId}/top-10`, {
          params: { limit },
        });
        if (aliasRes?.data?.topBidders) return aliasRes.data;
        if (aliasRes?.topBidders) return aliasRes;
        if (aliasRes?.data) return aliasRes.data;
        return aliasRes || { tenderId: cleanTenderId, topRecommendedBidder: null, evaluationSummary: null, topBidders: [] };
      } catch (aliasErr) {
        console.warn(
          `Backend QCBS endpoint unavailable for tender ${cleanTenderId}:`,
          aliasErr.message
        );
        return {
          tenderId: cleanTenderId,
          topRecommendedBidder: null,
          evaluationSummary: null,
          topBidders: [],
        };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.8 — Get Top Evaluated Tenders
  //  GET /api/officer/tenders/top-10?limit=10
  // ═══════════════════════════════════════════════════════════════════════
  getTopTenders: async (limit = 10) => {
    try {
      const res = await api.get('/officer/tenders/top-10', {
        params: { limit },
      });
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res;
      if (res?.data) return res.data;
      return [];
    } catch (err) {
      console.warn('Backend /officer/tenders/top-10 unavailable:', err.message);
      return [];
    }
  },
};

export const askBidderTenderAI = tenderService.askBidderTenderAI;
export const getTopBiddersForTender = tenderService.getTopBiddersForTender;
export const getTopTenders = tenderService.getTopTenders;

export default tenderService;
