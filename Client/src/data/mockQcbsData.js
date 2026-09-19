/**
 * QCBS Evaluation Dataset (Empty State)
 * All dummy and mock bidder rankings have been removed.
 * Real QCBS evaluations are retrieved dynamically from the backend endpoint:
 * GET /api/officer/tenders/{tenderId}/top-bidders?limit=10
 */

export const DEFAULT_QCBS_BIDDERS = [];

export const getMockQcbsTopBidders = (tenderId = null, tenderTitle = null) => {
  return {
    tenderId: tenderId || null,
    tenderTitle: tenderTitle || '',
    topRecommendedBidder: null,
    evaluationSummary: null,
    topBidders: [],
  };
};

export default getMockQcbsTopBidders;
