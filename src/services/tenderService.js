import api from './api';
import mockTenders, { getTenderById as getMockTenderById } from '../data/mockTenders';

export const tenderService = {
  /**
   * Fetch active and archived tenders with search, filter, and pagination support.
   * Gracefully handles:
   * - Raw array responses: [ ... ]
   * - Spring Boot Pageable responses: { content: [ ... ] }
   * - Standard API envelope: { success: true, data: [ ... ] }
   * - Fallback to mock data if backend has no tenders or is offline
   */
  getTenders: async (params = {}) => {
    try {
      const res = await api.get('/tenders', { params });
      
      if (Array.isArray(res)) {
        return res.length > 0 ? res : mockTenders;
      }
      if (res && Array.isArray(res.content)) {
        return res.content.length > 0 ? res.content : mockTenders;
      }
      if (res && Array.isArray(res.data)) {
        return res.data.length > 0 ? res.data : mockTenders;
      }
      if (res && Array.isArray(res.tenders)) {
        return res.tenders.length > 0 ? res.tenders : mockTenders;
      }

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
};

export default tenderService;
