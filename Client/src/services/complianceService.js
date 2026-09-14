import api from './api';

export const complianceService = {
  // Trigger automated AI compliance check for a bid proposal
  runComplianceCheck: async (bidId, options = {}) => {
    return await api.post(`/compliance/evaluate/${bidId}`, options);
  },

  // Retrieve comprehensive compliance evaluation report
  getComplianceReport: async (reportId) => {
    return await api.get(`/compliance/reports/${reportId}`);
  },

  // Get active compliance evaluation rules for a tender
  getComplianceRules: async (tenderId) => {
    return await api.get(`/compliance/rules/${tenderId}`);
  },

  // Configure or update compliance rules
  updateComplianceRules: async (tenderId, rulesData) => {
    return await api.put(`/compliance/rules/${tenderId}`, rulesData);
  },

  // Retrieve immutable audit trail logs for tender/bid evaluation
  getComplianceAuditLogs: async (bidId) => {
    return await api.get(`/compliance/audit/${bidId}`);
  },

  // Generate aggregate compliance summary
  generateComplianceSummary: async (tenderId) => {
    return await api.get(`/compliance/summary/${tenderId}`);
  },
};

export default complianceService;
