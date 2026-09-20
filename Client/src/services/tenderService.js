import api from './api';
import { mockTenders } from '../data/mockTenders';

/**
 * Normalizes a tender object so all views (Tenders, BidderDashboard, Verification, Modals)
 * receive fully consistent properties.
 */
const normalizeTender = (t) => {
  if (!t || typeof t !== 'object') return null;
  const ref = t.referenceNo || t.tenderId || t.id || `GEM/2026/B/${Math.floor(1000 + Math.random() * 9000)}`;
  const id = String(t.id || ref);

  return {
    id,
    referenceNo: ref,
    tenderId: t.tenderId || ref,
    title: t.title || 'Government Procurement Opportunity',
    ministry: t.ministry || 'Government of India',
    department: t.department || t.ministry || 'Central Procurement Division',
    location: t.location || 'New Delhi / Pan India',
    category: t.category || 'Computers & IT Equipment',
    documentType: t.documentType || 'technical_specs',
    value: t.value || '₹ 4,85,00,000 (₹ 4.85 Cr)',
    numericValue: Number(t.numericValue || t.estimatedValue) || 48500000,
    estimatedValue: Number(t.estimatedValue || t.numericValue) || 48500000,
    emdAmount: t.emdAmount || '₹ 9,70,000 (2% of Est. Value)',
    daysLeft: t.daysLeft || '21 days',
    closingDays: parseInt(t.daysLeft) || 21,
    published: t.published || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    closes: t.closes || t.lastDate || new Date(Date.now() + 21 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    closingDate: t.closingDate || new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
    lastDate: t.lastDate || t.closes,
    submissions: t.submissions !== undefined ? t.submissions : 0,
    status: t.status || 'Open',
    statusType: t.statusType || 'active',
    complianceScore: t.complianceScore !== undefined ? t.complianceScore : null,
    sourceType: 'TENDER',
    minLocalContent: t.minLocalContent || t.miiRequirement || '50% (Class-I)',
    miiRequirement: t.miiRequirement || t.minLocalContent || 'Class-I (>= 50% Local Content)',
    eligibilityCriteria: Array.isArray(t.eligibilityCriteria) && t.eligibilityCriteria.length > 0
      ? t.eligibilityCriteria
      : [
          'GFR 2017 Rule 144(xi) Land Border Compliance Verified',
          'Make in India (PPP-MII) Class-I Local Content (>= 50%)',
          'Valid GSTIN & Permanent Account Number (PAN)',
          'MSME Udyam / DPIIT Startup waiver eligible under GFR 173(i)',
        ],
    eligibility: t.eligibility || 'GFR 2017 & Make in India Class-I verified',
    documents: Array.isArray(t.documents) && t.documents.length > 0
      ? t.documents.map((d) => ({
          ...d,
          sourceType: d.sourceType || 'TENDER',
          tenderId: id,
        }))
      : [{ name: t.fileName || 'Tender_Notice.pdf', size: t.fileSize || '4.5 MB', url: t.fileUrl || '#', sourceType: 'TENDER', tenderId: id }],
    description: t.description || 'Government public procurement tender under GFR 2017.',
    extractedRules: t.extractedRules || null,
    rawOcrText: t.rawOcrText || null,
    createdAt: t.createdAt || new Date().toISOString(),
  };
};

export const tenderService = {
  // ═══════════════════════════════════════════════════════════════════════
  //  PUBLIC TENDER ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetch active and archived tenders with search, filter, and pagination support.
   * Merges locally officer-created tenders, backend records, and baseline mock tenders.
   */
  getTenders: async (params = {}) => {
    let list = [];
    const seenRefs = new Set();

    // 1. Highest priority: real tenders created / uploaded in the portal session
    try {
      const local = JSON.parse(localStorage.getItem('gem_created_tenders') || '[]');
      if (Array.isArray(local) && local.length > 0) {
        for (const item of local) {
          const norm = normalizeTender(item);
          if (norm && !seenRefs.has(norm.referenceNo)) {
            list.push(norm);
            seenRefs.add(norm.referenceNo);
            if (norm.id) seenRefs.add(norm.id);
          }
        }
      }
    } catch {
      // ignore
    }

    // 2. Fetch remote records from backend API /tenders or /officer/tenders
    try {
      const res = await api.get('/tenders', { params });
      let remote = [];
      if (Array.isArray(res)) remote = res;
      else if (res && Array.isArray(res.content)) remote = res.content;
      else if (res && Array.isArray(res.data)) remote = res.data;
      else if (res && Array.isArray(res.tenders)) remote = res.tenders;

      for (const item of remote) {
        const norm = normalizeTender(item);
        if (norm && !seenRefs.has(norm.referenceNo)) {
          list.push(norm);
          seenRefs.add(norm.referenceNo);
          if (norm.id) seenRefs.add(norm.id);
        }
      }
    } catch (err) {
      console.warn('Backend /tenders endpoint notice:', err.message);
    }

    // 3. Fallback: Merge verified baseline official GeM tenders
    if (Array.isArray(mockTenders)) {
      for (const item of mockTenders) {
        const norm = normalizeTender(item);
        if (norm && !seenRefs.has(norm.referenceNo)) {
          list.push(norm);
          seenRefs.add(norm.referenceNo);
          if (norm.id) seenRefs.add(norm.id);
        }
      }
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

    // Fallback: search across all loaded/active tenders (including gem_created_tenders)
    try {
      const all = await tenderService.getTenders();
      const cleanId = String(id || '').trim().toLowerCase();
      return (
        all.find((t) => {
          const tId = String(t.id || '').trim().toLowerCase();
          const tRef = String(t.referenceNo || '').trim().toLowerCase();
          const tTdrId = String(t.tenderId || '').trim().toLowerCase();
          return (
            tId === cleanId ||
            tRef === cleanId ||
            tTdrId === cleanId ||
            (cleanId.length > 3 && (tRef.includes(cleanId) || cleanId.includes(tRef)))
          );
        }) || null
      );
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
        id: tenderData.id || tenderData.referenceNo || `TDR-${Date.now().toString().slice(-4)}`,
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
        window.dispatchEvent(new CustomEvent('gem_tenders_updated', { detail: saved }));
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
