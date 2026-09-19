import api from './api';

/**
 * Standard Bidder Schema based on Official API specification:
 * - id: number
 * - legalName: string (e.g. "Arnav Tyagi")
 * - panNumber: string (e.g. "ARNAV9012H")
 * - gstNumber: string (e.g. "09ARNAV9012H3Z7")
 * - udyamNumber: string (e.g. "UDYAM-UP-01-0012345")
 * - registrationNumber: string
 * - email: string (e.g. "arnav24169006@gmail.com")
 * - phone: string (e.g. "9876500103")
 * - address: string (e.g. "Ghaziabad, UP")
 * - profileMetadata: string
 * - createdAt: ISO timestamp
 * - updatedAt: ISO timestamp
 */

export const DEFAULT_BIDDERS = [];

export const normalizeBidder = (raw) => {
  if (!raw) return null;
  const gst = raw.gstNumber || raw.gstin || '';
  const pan = raw.panNumber || (gst && gst.length >= 12 ? gst.substring(2, 12) : '') || '';
  const udyam = raw.udyamNumber || '';
  const isMsme = Boolean(udyam && udyam.toUpperCase().startsWith('UDYAM'));

  return {
    id: raw.id,
    legalName: raw.legalName || raw.companyName || 'Registered Vendor',
    companyName: raw.legalName || raw.companyName || 'Registered Vendor',
    panNumber: pan,
    gstNumber: gst,
    gstin: gst,
    udyamNumber: udyam,
    registrationNumber: raw.registrationNumber || '',
    email: raw.email || '',
    phone: raw.phone || '',
    address: raw.address || raw.location || 'India',
    location: raw.address || raw.location || 'India',
    profileMetadata: raw.profileMetadata || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    isMsme,
    isStartup: Boolean(raw.isStartup || (raw.profileMetadata && raw.profileMetadata.toLowerCase().includes('startup'))),
    status: raw.status || (gst || pan ? 'Verified' : 'Pending Review'),
    category: raw.category || raw.profileMetadata || 'General Procurement',
    localContent: raw.localContent || 'Class-I (>50%)',
  };
};

export const bidderService = {
  /**
   * Get all registered bidders matching the API spec
   * Supports both /bidder and /bidders endpoints
   */
  getBidders: async (params = {}) => {
    let list = [];
    try {
      const res = await api.get('/bidder', { params });
      if (Array.isArray(res)) list = res;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res?.content)) list = res.content;
    } catch {
      try {
        const fallbackRes = await api.get('/bidders', { params });
        if (Array.isArray(fallbackRes)) list = fallbackRes;
        else if (Array.isArray(fallbackRes?.data)) list = fallbackRes.data;
        else if (Array.isArray(fallbackRes?.content)) list = fallbackRes.content;
      } catch (err) {
        console.warn('Backend /bidder endpoint unavailable:', err.message);
      }
    }

    if (list && list.length > 0) {
      return list.map(normalizeBidder);
    }
    return [];
  },

  /**
   * Get specific bidder details by ID
   */
  getBidderById: async (id) => {
    try {
      const res = await api.get(`/bidder/${id}`);
      return normalizeBidder(res?.data || res);
    } catch {
      try {
        const fallbackRes = await api.get(`/bidders/${id}`);
        return normalizeBidder(fallbackRes?.data || fallbackRes);
      } catch {
        return null;
      }
    }
  },

  /**
   * Register a new bidder profile according to API spec
   */
  registerBidder: async (bidderData) => {
    const payload = {
      legalName: bidderData.legalName || bidderData.organizationName || bidderData.fullName,
      panNumber: bidderData.panNumber || (bidderData.gstNumber ? bidderData.gstNumber.substring(2, 12) : ''),
      gstNumber: bidderData.gstNumber || bidderData.gstin || '',
      udyamNumber: bidderData.udyamNumber || '',
      registrationNumber: bidderData.registrationNumber || '',
      email: bidderData.email || '',
      phone: bidderData.phone || '',
      address: bidderData.address || '',
      profileMetadata: bidderData.profileMetadata || '',
    };

    try {
      const res = await api.post('/bidder', payload);
      return res?.data || res;
    } catch {
      const res = await api.post('/bidders', payload);
      return res?.data || res;
    }
  },

  /**
   * Update existing bidder profile
   */
  updateBidder: async (id, updateData) => {
    try {
      return await api.put(`/bidder/${id}`, updateData);
    } catch {
      return await api.put(`/bidders/${id}`, updateData);
    }
  },

  /**
   * Delete bidder profile
   */
  deleteBidder: async (id) => {
    try {
      return await api.delete(`/bidder/${id}`);
    } catch {
      return await api.delete(`/bidders/${id}`);
    }
  },

  /**
   * Verify bidder legal, tax, and technical eligibility
   */
  verifyBidder: async (id, verificationPayload) => {
    return await api.post(`/bidder/${id}/verify`, verificationPayload);
  },

  /**
   * Retrieve AI compliance history for bidder
   */
  getBidderComplianceStatus: async (id) => {
    return await api.get(`/bidder/${id}/compliance`);
  },
};

export default bidderService;
