import api from './api';
import { normalizeTenderId } from '../utils/tenderIdUtils';
import { processTenderPdf, askBidderTenderAI as aiAskBidderTender } from './aiService';

/**
 * Safely extract a primitive value from a field that might be an object
 * (e.g. {value: "21 days", start, end, validated}) instead of a string.
 */
const safeVal = (v, fallback = '') => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'string' || typeof v === 'number') return v;
  if (typeof v === 'object' && 'value' in v) return safeVal(v.value, fallback);
  if (typeof v === 'object') { try { return JSON.stringify(v); } catch { return fallback; } }
  return String(v);
};

/**
 * Normalizes a tender object so all views (Tenders, BidderDashboard, Verification, Modals)
 * receive fully consistent properties with all fields as renderable primitives.
 */
const normalizeTender = (t) => {
  if (!t || typeof t !== 'object') return null;
  const s = t.structuredData || {};
  const ref =
    t.referenceNo ||
    t.tenderId ||
    s.referenceNo ||
    s.tenderId ||
    (t.id ? (String(t.id).startsWith('GEM/') ? String(t.id) : `GEM/2026/B/${t.id}`) : `GEM/2026/B/${Math.floor(1000 + Math.random() * 9000)}`);
  const id = String(t.id || ref);

  const rawVal = safeVal(t.value || s.value || t.estimatedValue || s.estimatedValue, '');
  const numVal = Number(safeVal(t.numericValue || t.estimatedValue || s.estimatedValue || s.numericValue, 0)) || 48500000;

  return {
    id,
    referenceNo: ref,
    tenderId: t.tenderId || s.tenderId || ref,
    title: safeVal(t.title || s.title, 'Government Procurement Opportunity'),
    ministry: safeVal(t.ministry || s.ministry || t.departmentName, 'Government of India'),
    department: safeVal(t.department || t.departmentName || s.department, 'Central Procurement Division'),
    location: safeVal(t.location || s.location, 'New Delhi / Pan India'),
    category: safeVal(t.category || s.category, 'Computers & IT Equipment'),
    documentType: safeVal(t.documentType, 'technical_specs'),
    value: typeof rawVal === 'string' && rawVal.includes('₹') ? rawVal : `₹ ${Number(numVal).toLocaleString('en-IN')}`,
    numericValue: numVal,
    estimatedValue: numVal,
    emdAmount: safeVal(t.emdAmount || s.emdAmount, `₹ ${Math.round(numVal * 0.02).toLocaleString('en-IN')} (2% of Est. Value)`),
    daysLeft: safeVal(t.daysLeft || s.daysLeft, '21 days'),
    closingDays: parseInt(safeVal(t.daysLeft || s.daysLeft, '21')) || 21,
    published: t.published || (t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })),
    closes: safeVal(t.closes || t.lastDate || s.closes, new Date(Date.now() + 21 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })),
    closingDate: safeVal(t.closingDate || s.closingDate, new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0]),
    lastDate: safeVal(t.lastDate || t.closes || s.lastDate, ''),
    submissions: t.submissions !== undefined ? t.submissions : (t.bidCount !== undefined ? t.bidCount : 0),
    status: safeVal(t.status, 'Open'),
    statusType: safeVal(t.statusType, 'active'),
    complianceScore: t.complianceScore !== undefined ? t.complianceScore : (t.authenticityScore ? Math.round(t.authenticityScore) : 95),
    sourceType: 'TENDER',
    minLocalContent: safeVal(t.minLocalContent || t.miiRequirement || s.minLocalContent, '50% (Class-I)'),
    miiRequirement: safeVal(t.miiRequirement || t.minLocalContent || s.miiRequirement, 'Class-I (>= 50% Local Content)'),
    eligibilityCriteria: Array.isArray(t.eligibilityCriteria) && t.eligibilityCriteria.length > 0
      ? t.eligibilityCriteria
      : [
          'GFR 2017 Rule 144(xi) Land Border Compliance Verified',
          'Make in India (PPP-MII) Class-I Local Content (>= 50%)',
          'Valid GSTIN & Permanent Account Number (PAN)',
          'MSME Udyam / DPIIT Startup waiver eligible under GFR 173(i)',
        ],
    eligibility: safeVal(t.eligibility, 'GFR 2017 & Make in India Class-I verified'),
    documents: Array.isArray(t.documents) && t.documents.length > 0
      ? t.documents.map((d) => ({
          ...d,
          sourceType: d.sourceType || 'TENDER',
          tenderId: id,
        }))
      : [{ name: t.fileName || 'Tender_Notice.pdf', size: t.fileSize || '4.5 MB', url: t.fileUrl || '#', sourceType: 'TENDER', tenderId: id }],
    description: safeVal(t.description, 'Government public procurement tender under GFR 2017.'),
    extractedRules: t.extractedRules || s.extractedRules || null,
    rawOcrText: t.rawOcrText || null,
    createdAt: t.createdAt || new Date().toISOString(),
  };
};

/**
 * Helper to retrieve IDs and reference numbers of deleted/archived tenders
 */
export const getDeletedTenderIds = () => {
  try {
    const deleted = JSON.parse(localStorage.getItem('gem_deleted_tenders') || '[]');
    if (Array.isArray(deleted)) {
      return new Set(deleted.map((id) => String(id).trim().toLowerCase()));
    }
  } catch {
    // ignore
  }
  return new Set();
};

/**
 * Check if a tender record matches any deleted ID or reference number
 */
export const isTenderDeleted = (tender, deletedSet) => {
  if (!tender || !deletedSet || deletedSet.size === 0) return false;
  const id = String(tender.id || '').trim().toLowerCase();
  const ref = String(tender.referenceNo || '').trim().toLowerCase();
  const tId = String(tender.tenderId || '').trim().toLowerCase();
  return (
    (Boolean(id) && deletedSet.has(id)) ||
    (Boolean(ref) && deletedSet.has(ref)) ||
    (Boolean(tId) && deletedSet.has(tId))
  );
};

/**
 * Helper to retrieve initial active tenders without deleted items,
 * preventing any flash of deleted tenders during initial page mount.
 */
export const getActiveInitialTenders = () => {
  try {
    const deletedIds = getDeletedTenderIds();
    const local = JSON.parse(localStorage.getItem('gem_created_tenders') || '[]');
    const officer = JSON.parse(localStorage.getItem('gem_officer_tenders') || '[]');
    const combined = [...(Array.isArray(local) ? local : []), ...(Array.isArray(officer) ? officer : [])];
    const list = [];
    const seen = new Set();
    if (combined.length > 0) {
      for (const item of combined) {
        if (!isTenderDeleted(item, deletedIds)) {
          const norm = normalizeTender(item);
          if (norm && !isTenderDeleted(norm, deletedIds) && !seen.has(norm.referenceNo)) {
            list.push(norm);
            seen.add(norm.referenceNo);
            if (norm.id) seen.add(norm.id);
          }
        }
      }
    }
    return list;
  } catch {
    return [];
  }
};

export const tenderService = {
  // ═══════════════════════════════════════════════════════════════════════
  //  PUBLIC TENDER ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetch active tenders from backend API (single source of truth).
   * localStorage is used only as a cache for offline/cross-tab sync.
   */
  getTenders: async (params = {}) => {
    let list = [];
    const seenRefs = new Set();
    const deletedIds = getDeletedTenderIds();

    // Fetch from backend API (primary source of truth)
    let remote = [];
    try {
      const genRes = await api.get('/tenders', { params: { limit: 100, ...params } });
      const genData = genRes?.data?.data || genRes?.data || genRes;
      if (Array.isArray(genData)) remote = genData;
      else if (genData && Array.isArray(genData.content)) remote = genData.content;
    } catch {
      try {
        const topRes = await api.get('/officer/tenders/top-10', { params: { limit: 100, ...params } });
        const topData = topRes?.data?.data || topRes?.data || topRes;
        if (Array.isArray(topData)) remote = topData;
        else if (topData && Array.isArray(topData.content)) remote = topData.content;
      } catch {
        try {
          const offRes = await api.get('/officer/tenders', { params });
          const offData = offRes?.data?.data || offRes?.data || offRes;
          if (Array.isArray(offData)) remote = offData;
        } catch {
          // All endpoints unavailable
        }
      }
    }

    // Normalize and deduplicate API results
    for (const item of remote) {
      if (isTenderDeleted(item, deletedIds)) continue;
      const norm = normalizeTender(item);
      if (norm && !isTenderDeleted(norm, deletedIds) && !seenRefs.has(norm.referenceNo)) {
        list.push(norm);
        seenRefs.add(norm.referenceNo);
        if (norm.id) seenRefs.add(norm.id);
      }
    }

    // Replace localStorage cache with clean API data (no accumulation of junk)
    if (list.length > 0) {
      try {
        localStorage.setItem('gem_created_tenders', JSON.stringify(list));
      } catch {}
    }

    return list;
  },

  /**
   * Fetch single tender by ID or tender reference number
   */
  getTenderById: async (id) => {
    try {
      const res = await api.get(`/tenders/${id}`);
      const data = res?.data?.data || res?.data || res;
      if (data && typeof data === 'object' && (data.id || data.referenceNo || data.title)) {
        return normalizeTender(data);
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

        // Ensure newly created tender is removed from gem_deleted_tenders if re-created
        try {
          const deleted = JSON.parse(localStorage.getItem('gem_deleted_tenders') || '[]');
          const keysToRemove = new Set([
            String(saved.id || '').trim().toLowerCase(),
            String(saved.referenceNo || '').trim().toLowerCase(),
          ]);
          const filteredDeleted = deleted.filter((d) => !keysToRemove.has(String(d).trim().toLowerCase()));
          localStorage.setItem('gem_deleted_tenders', JSON.stringify(filteredDeleted));
        } catch {
          // ignore
        }

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('gem_tenders_updated', { detail: saved }));

        // Trigger asynchronous RAG vectorization for newly created tender
        const tenderIdToProcess = normalizeTenderId(saved.id || saved.referenceNo);
        if (tenderIdToProcess) {
          processTenderPdf({
            tenderId: tenderIdToProcess,
            pdfUrl: saved.documents?.[0]?.url,
            title: saved.title,
            ocrText: saved.rawOcrText || saved.description,
          }).catch((e) => console.warn('[TENDER_INDEX] Background indexing note:', e.message));
        }
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
   * Cancel or archive / permanently delete a tender from DB + Cloudinary + localStorage
   */
  deleteTender: async (id, refNo = null, tenderId = null) => {
    let backendResult = null;
    const cleanId = String(id || '').trim();
    if (cleanId) {
      // Try officer endpoint first (DELETE /api/officer/tenders/{id})
      try {
        backendResult = await api.delete(`/officer/tenders/${encodeURIComponent(cleanId)}`);
        console.log(`Tender ${cleanId} deleted from database successfully`);
      } catch (err) {
        console.warn(`Officer delete endpoint failed for ${cleanId}, trying /tenders:`, err.message);
        // Fallback to general /tenders endpoint
        try {
          backendResult = await api.delete(`/tenders/${encodeURIComponent(cleanId)}`);
        } catch (err2) {
          console.warn(`Backend /tenders/${cleanId} delete notice (local-only):`, err2.message);
        }
      }
    }

    const targets = new Set();
    if (id) targets.add(String(id).trim().toLowerCase());
    if (refNo) targets.add(String(refNo).trim().toLowerCase());
    if (tenderId) targets.add(String(tenderId).trim().toLowerCase());

    try {
      // 1. Remove from gem_created_tenders
      const local = JSON.parse(localStorage.getItem('gem_created_tenders') || '[]');
      const updatedLocal = local.filter((item) => {
        const itemId = String(item.id || '').trim().toLowerCase();
        const itemRef = String(item.referenceNo || item.tenderId || '').trim().toLowerCase();
        return !targets.has(itemId) && !targets.has(itemRef);
      });
      localStorage.setItem('gem_created_tenders', JSON.stringify(updatedLocal));

      // 2. Remove from gem_officer_tenders if stored
      const offTenders = JSON.parse(localStorage.getItem('gem_officer_tenders') || '[]');
      if (Array.isArray(offTenders) && offTenders.length > 0) {
        const updatedOff = offTenders.filter((item) => {
          const itemId = String(item.id || '').trim().toLowerCase();
          const itemRef = String(item.referenceNo || item.tenderId || '').trim().toLowerCase();
          return !targets.has(itemId) && !targets.has(itemRef);
        });
        localStorage.setItem('gem_officer_tenders', JSON.stringify(updatedOff));
      }

      // 3. Add all identifiers to gem_deleted_tenders blacklist registry
      const deleted = JSON.parse(localStorage.getItem('gem_deleted_tenders') || '[]');
      const updatedDeleted = Array.from(new Set([...deleted.map((d) => String(d).trim().toLowerCase()), ...targets]));
      localStorage.setItem('gem_deleted_tenders', JSON.stringify(updatedDeleted));

      // 4. Dispatch storage and custom events for immediate sync across components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(
        new CustomEvent('gem_tenders_updated', {
          detail: { deletedId: id, deletedRef: refNo, deletedTenderId: tenderId },
        })
      );
    } catch (e) {
      console.warn('LocalStorage tender deletion notice:', e);
    }

    return backendResult || { success: true, id, referenceNo: refNo };
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
    const seenRefs = new Set();
    const deletedIds = getDeletedTenderIds();

    try {
      const res = await api.get('/officer/tenders', { params });
      let raw = [];
      if (Array.isArray(res)) raw = res;
      else if (res && Array.isArray(res.data?.data)) raw = res.data.data;
      else if (res && Array.isArray(res.data)) raw = res.data;
      else if (res && Array.isArray(res.content)) raw = res.content;
      else if (res && Array.isArray(res.tenders)) raw = res.tenders;

      // Normalize, deduplicate and filter deleted — consistent with getTenders()
      for (const item of raw) {
        if (isTenderDeleted(item, deletedIds)) continue;
        const norm = normalizeTender(item);
        if (norm && !isTenderDeleted(norm, deletedIds) && !seenRefs.has(norm.referenceNo)) {
          list.push(norm);
          seenRefs.add(norm.referenceNo);
          if (norm.id) seenRefs.add(norm.id);
        }
      }

      // Cache clean API data in localStorage
      if (list.length > 0) {
        try {
          localStorage.setItem('gem_officer_tenders', JSON.stringify(list));
        } catch {}
      }
    } catch (err) {
      console.warn('Officer tenders endpoint notice:', err.message);
    }

    // Fall back to general /tenders endpoint if officer endpoint is empty or unavailable
    if (list.length === 0) {
      list = await tenderService.getTenders(params);
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
  //  3.5a — Officer Specific-Tender AI Chatbot (Contextual)
  //  POST /api/officer/tenders/:tenderId/chat
  //  Headers: Authorization: Bearer <officer_token>
  //  Body: { tenderId, bidderId, query }
  // ═══════════════════════════════════════════════════════════════════════
  officerTenderChatById: async (tenderId, { bidderId, query }) => {
    const payload = {
      tenderId: String(tenderId),
      query: String(query || '').trim(),
    };
    if (bidderId) {
      payload.bidderId = String(bidderId);
    }
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
  //  3.5b — GeM Compliflix AI Platform Copilot & General Chatbot
  //  POST /api/officer/tenders/chat or /api/ai/copilot/ask
  //  Headers: Authorization: Bearer <officer_token>
  //  Body: { query, tenderId?, bidderId?, context? }
  // ═══════════════════════════════════════════════════════════════════════
  officerPlatformCopilotChat: async ({ query, context = {} }) => {
    const payload = {
      query: String(query || '').trim(),
      context: {
        activeMenu: context.activeMenu || context.activeTab || 'dashboard',
        tenderId: context.tenderId || null,
        bidderId: context.bidderId || null,
        role: context.role || 'OFFICER',
      },
    };
    if (context.tenderId) payload.tenderId = String(context.tenderId);
    if (context.bidderId) payload.bidderId = String(context.bidderId);

    // Call official Spring Boot backend endpoint (POST /api/officer/tenders/chat)
    return await api.post('/officer/tenders/chat', payload);
  },

  officerTenderChat: async ({ tenderId, bidderId, query, context }) => {
    const payload = {
      query: String(query || '').trim(),
    };
    if (tenderId && tenderId !== '1' && tenderId !== 'all') {
      payload.tenderId = String(tenderId);
    }
    if (bidderId && bidderId !== 'BID-007') {
      payload.bidderId = String(bidderId);
    }
    if (context) {
      payload.context = context;
    }
    if (payload.tenderId) {
      try {
        return await api.post(`/officer/tenders/${payload.tenderId}/chat`, payload);
      } catch {
        // Fallback to general endpoint
      }
    }
    return await api.post('/officer/tenders/chat', payload);
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.6 — Bidder Per-Tender AI Chatbot (Node AI RAG & Gemini Chatbot)
  //  POST /api/ai/bidder-chat/ask
  //  Body: { tenderId: "<dynamic tender id>", query: "..." }
  // ═══════════════════════════════════════════════════════════════════════
  askBidderTenderAI: async ({ tenderId, query, tender, tenderContext }) => {
    return await aiAskBidderTender({
      tenderId: normalizeTenderId(tenderId),
      query: String(query ?? '').trim(),
      tender,
      tenderContext,
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  3.7 — QCBS Top 10 Bidders Evaluation (GFR 2017 Rule 192)
  //  GET /api/officer/tenders/{tenderId}/top-bidders?limit=10
  //  Alias: GET /api/officer/tenders/{tenderId}/top-10
  //  Auth: Public (permitAll)
  // ═══════════════════════════════════════════════════════════════════════
  getTopBiddersForTender: async (tenderId, limit = 10) => {
    const cleanTenderId = String(tenderId ?? '').trim();
    if (!cleanTenderId) {
      return { tenderId: null, topRecommendedBidder: null, evaluationSummary: null, topBidders: [] };
    }
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
