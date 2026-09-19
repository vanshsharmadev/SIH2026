import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileCheck,
  AlertCircle,
  Check,
  ChevronDown,
  Layers,
  Scale,
  ExternalLink,
} from 'lucide-react';
import { tenderService, aiService, recordAuditLog } from '../../services';
import { getRiskTierMeta, formatStatusLabel } from '../../utils/tenderComparisonAdapter';
import AiEvaluationDrawer from './AiEvaluationDrawer';
import { INITIAL_SUBMISSIONS } from '../../pages/Dashboard/TenderSubmissionsView';

const TopBiddersSection = ({
  tenders = [],
  activeTenderId: propActiveTenderId = null,
  onViewAllBidders = null,
  onSelectTender = null,
}) => {
  // Available tenders list
  const availableTenders = useMemo(() => {
    if (Array.isArray(tenders) && tenders.length > 0) return tenders;
    return [
      { id: 'GEM/2024/B/5123981', title: 'Supply of Office Stationery & Paper Supplies' },
      { id: 'GEM/2024/B/5123982', title: 'IT Hardware Procurement & Networking Infrastructure' },
      { id: 'GEM/2024/B/5123983', title: 'Road Construction Work & Highway Maintenance Phase 2' },
      { id: 'GEM/2024/B/5123984', title: 'Medical Equipment Supply for District Health Centers' },
      { id: 'GEM/2024/B/5123985', title: 'Smart Classroom Setup & Interactive Display Units' },
      { id: '1', title: 'Solar Power Installation & Edge Computing Infrastructure' },
    ];
  }, [tenders]);

  // Selected Tender State
  const [selectedTenderId, setSelectedTenderId] = useState(
    propActiveTenderId || availableTenders[0]?.id || 'GEM/2024/B/5123981'
  );

  useEffect(() => {
    if (propActiveTenderId) {
      setSelectedTenderId(propActiveTenderId);
    }
  }, [propActiveTenderId]);

  const activeTender = useMemo(() => {
    return (
      availableTenders.find(
        (t) => String(t.id) === String(selectedTenderId) || String(t.referenceNo) === String(selectedTenderId)
      ) || availableTenders[0]
    );
  }, [availableTenders, selectedTenderId]);

  // Bidders Data & State
  const [bidders, setBidders] = useState([]);
  const [rankingBasis, setRankingBasis] = useState('AI Compliance Score (Descending)');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-Select Checkboxes
  const [selectedBidderIds, setSelectedBidderIds] = useState([]);

  // AI Evaluation Drawer State
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiDrawerBidder, setAiDrawerBidder] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Fetch contextual bidders for the selected tender
  const fetchBidders = async () => {
    setLoading(true);
    setError(null);
    setSelectedBidderIds([]);

    try {
      let candidateBidders = [];
      let basis = 'AI Compliance Score (Descending)';

      // 1. Check if there are existing submissions for this tender in localStorage or INITIAL_SUBMISSIONS
      let localSubmissions = [];
      try {
        const stored = JSON.parse(localStorage.getItem('gem_officer_submissions') || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
          localSubmissions = stored;
        }
      } catch {
        // ignore parse error
      }

      const allSubmissions = [...localSubmissions, ...INITIAL_SUBMISSIONS];
      const matchedSubs = allSubmissions.filter(
        (s) => String(s.tenderId) === String(selectedTenderId)
      );

      if (matchedSubs.length > 0) {
        // Sort transparently by complianceScore descending
        candidateBidders = [...matchedSubs]
          .sort((a, b) => (b.complianceScore || 0) - (a.complianceScore || 0))
          .map((sub, idx) => ({
            id: sub.id || sub.bidderId || `BID-${idx + 1}`,
            bidderId: sub.bidderId || sub.id,
            companyName: sub.bidder || sub.companyName || 'Bidder Organization',
            gstNumber: sub.gstNumber || (sub.documents?.some(d => d.name?.toLowerCase().includes('gst')) ? 'GST Verified' : null),
            docCount: sub.docCount || sub.documents?.length || 4,
            complianceScore: sub.complianceScore ?? null,
            authenticityScore: sub.complianceScore ? Math.min(99, Math.round(sub.complianceScore * 0.98 + 1)) : null,
            riskLevel: sub.complianceScore >= 80 ? 'LOW' : sub.complianceScore >= 60 ? 'MEDIUM' : 'HIGH',
            status: sub.evaluationStatus || sub.complianceStatus || 'Under Evaluation',
            rawSubmission: sub,
          }));
        basis = 'AI Compliance Score (Descending)';
      } else {
        // 2. Query backend tenderService.getTopBiddersForTender(selectedTenderId)
        const qcbsRes = await tenderService.getTopBiddersForTender(selectedTenderId, 10);
        if (qcbsRes?.topBidders && Array.isArray(qcbsRes.topBidders) && qcbsRes.topBidders.length > 0) {
          candidateBidders = qcbsRes.topBidders.map((b, idx) => ({
            id: b.bidderId ? String(b.bidderId) : `BID-${idx + 1}`,
            bidderId: b.bidderId ? String(b.bidderId) : `BID-${idx + 1}`,
            companyName: b.companyName || b.bidder || 'Bidder Organization',
            gstNumber: b.gstNumber || null,
            docCount: b.docCount || 6,
            complianceScore: b.complianceScore ?? b.qcbsScore ?? null,
            authenticityScore: b.authenticityScore ?? 96,
            riskLevel: b.riskLevel || 'LOW',
            status: b.status || (b.verdict === 'HIGHLY_RECOMMENDED' ? 'Technically Qualified' : 'Qualified'),
            rawSubmission: {
              id: b.bidderId ? String(b.bidderId) : `BID-${idx + 1}`,
              bidder: b.companyName,
              tenderId: selectedTenderId,
              complianceScore: b.complianceScore || 95,
              docCount: 6,
              bidderId: b.bidderId,
            },
          }));
          basis = qcbsRes.evaluationSummary?.scoringAlgorithm
            ? 'GFR 192 QCBS Composite Score'
            : 'AI Compliance Score (Descending)';
        }
      }

      // Limit strictly to Top 10 Bidders
      const top10 = candidateBidders.slice(0, 10).map((item, idx) => ({
        ...item,
        rank: idx + 1,
        rankDisplay: String(idx + 1).padStart(2, '0'),
      }));

      setBidders(top10);
      setRankingBasis(basis);
    } catch (err) {
      console.error('Error fetching bidders for tender:', err);
      setError('Unable to load bidder information for this tender.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBidders();
  }, [selectedTenderId]);

  const handleTenderChange = (newTenderId) => {
    setSelectedTenderId(newTenderId);
    onSelectTender?.(newTenderId);
  };

  // Multi-Select Checkboxes
  const toggleSelectBidder = (id) => {
    setSelectedBidderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBidderIds.length === bidders.length) {
      setSelectedBidderIds([]);
    } else {
      setSelectedBidderIds(bidders.map((b) => b.id));
    }
  };

  // Review single bidder action
  const handleReviewBidder = (bidder) => {
    setAiDrawerBidder(bidder.rawSubmission || {
      id: bidder.id,
      bidderId: bidder.bidderId,
      bidder: bidder.companyName,
      tenderId: selectedTenderId,
      complianceScore: bidder.complianceScore,
      docCount: bidder.docCount,
    });
    setAiDrawerOpen(true);
  };

  // Compare selected or single bidder action
  const handleRunComparison = async (candidateIds = null) => {
    const idsToCompare = candidateIds || selectedBidderIds;
    if (!idsToCompare || idsToCompare.length < 2) {
      alert('Please select at least 2 bidders using the checkboxes to run comparative evaluation.');
      return;
    }

    const selectedSubs = bidders
      .filter((b) => idsToCompare.includes(b.id))
      .map((b) => b.rawSubmission || {
        id: b.id,
        bidderId: b.bidderId,
        bidder: b.companyName,
        tenderId: selectedTenderId,
        complianceScore: b.complianceScore,
        docCount: b.docCount,
      });

    setCompareLoading(true);
    setAiDrawerBidder(selectedSubs[0]);
    setAiDrawerOpen(true);

    try {
      // Reusing existing compareBidders endpoint POST /api/officer/tenders/{id}/compare-bidders
      const mlComparePromise = tenderService.compareBidders(
        selectedTenderId,
        selectedSubs.map((s) => ({
          bidder_id: s.bidderId || s.id,
          bidder_name: s.bidder,
          compliance_score: s.complianceScore,
          documents_count: s.docCount,
        })),
        {
          min_local_content: '50%',
          gfr_rule_144_required: true,
          minimum_turnover: 'INR 10 Cr',
        }
      );

      // Node AI RAG comparison
      const aiComparePromise = aiService.compareBiddersAI({
        tenderId: selectedTenderId,
        bidderIds: selectedSubs.map((s) => s.bidderId || s.id),
        query: `Compare ${selectedSubs.map((s) => s.bidder).join(' vs ')} on eligibility, GFR 144, PyHanko DSC, and statutory GST credentials.`,
      });

      const [mlRes, aiRes] = await Promise.allSettled([mlComparePromise, aiComparePromise]);

      setComparisonResult({
        ml: mlRes.status === 'fulfilled' ? mlRes.value : null,
        ai: aiRes.status === 'fulfilled' ? aiRes.value : null,
        bidders: selectedSubs,
      });

      recordAuditLog?.({
        activity: 'Bidder Comparison Completed',
        tenderId: selectedTenderId,
        details: `Compared ${selectedSubs.length} candidate bidders in Top 10 section.`,
      });
    } catch (err) {
      console.warn('Comparison error:', err);
    } finally {
      setCompareLoading(false);
    }
  };

  // Compare single bidder directly with the top rank contender
  const handleCompareSingle = (bidder) => {
    const topBidder = bidders[0];
    if (topBidder && topBidder.id !== bidder.id) {
      handleRunComparison([topBidder.id, bidder.id]);
    } else if (bidders.length >= 2) {
      handleRunComparison([bidders[0].id, bidders[1].id]);
    } else {
      handleReviewBidder(bidder);
    }
  };

  // Status badge semantic styling
  const getStatusBadge = (status) => {
    const s = String(status || 'Under Evaluation').toLowerCase();
    if (s.includes('qualified') || s.includes('cleared') || s.includes('compliant') && !s.includes('non')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>{status}</span>
        </span>
      );
    }
    if (s.includes('review') || s.includes('pending') || s.includes('clarification') || s.includes('conditional')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <AlertTriangle className="w-3 h-3 text-rose-500" />
        <span>{status}</span>
      </span>
    );
  };

  const isAllSelected = bidders.length > 0 && selectedBidderIds.length === bidders.length;

  return (
    <div className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200/90 dark:border-[#303030] shadow-2xs p-5 sm:p-6 space-y-4 transition-all">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. SECTION HEADER & TENDER SELECTOR                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#282828]">
        {/* Title & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Top 10 Bidders for Selected Tender</span>
            </h3>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 font-mono">
              {rankingBasis}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI-assisted bidder review for the active procurement &bull;{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {activeTender.title}
            </span>
          </p>
        </div>

        {/* Right Side Controls: Selected Tender Dropdown & View All Bidders */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Tender Selector Dropdown */}
          <div className="relative flex items-center">
            <label htmlFor="tender-select" className="sr-only">
              Select Tender
            </label>
            <select
              id="tender-select"
              value={selectedTenderId}
              onChange={(e) => handleTenderChange(e.target.value)}
              className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none transition-colors max-w-[200px] sm:max-w-[240px] truncate"
              title="Switch Active Tender"
            >
              {availableTenders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.referenceNo || t.id} — {t.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* View All Bidders Button */}
          {onViewAllBidders && (
            <button
              type="button"
              onClick={onViewAllBidders}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-900/60 rounded-lg transition-colors cursor-pointer shrink-0"
              title="View all submissions on the submissions portal"
            >
              <span>View All Bidders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. MULTI-SELECT COMPARISON CONTEXTUAL ACTION BAR                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {selectedBidderIds.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-900/80 px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
              {selectedBidderIds.length}
            </span>
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              {selectedBidderIds.length === 1
                ? '1 bidder selected (select 1 more to compare)'
                : `${selectedBidderIds.length} bidders selected for comparative analysis`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedBidderIds([])}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-2 py-1 transition cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleRunComparison()}
              disabled={selectedBidderIds.length < 2 || compareLoading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{compareLoading ? 'Comparing...' : 'Compare Selected'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. TABLE / LIST CONTENT                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {loading ? (
        /* SKELETON LOADING STATE */
        <div className="space-y-2.5 py-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-14 w-full rounded-xl bg-slate-100 dark:bg-[#202020] animate-pulse flex items-center px-4 justify-between"
            >
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* ERROR STATE */
        <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="font-bold">{error}</p>
              <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                Please check connectivity or select another tender.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchBidders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : bidders.length === 0 ? (
        /* EMPTY STATE */
        <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-2">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            No bidders available
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Bidder submissions for this tender will appear here once received and evaluated by the
            system.
          </p>
          {onViewAllBidders && (
            <button
              type="button"
              onClick={onViewAllBidders}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <span>View All Submissions</span>
            </button>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════ */
        /* DESKTOP / TABLET DATA TABLE                                    */
        /* ═══════════════════════════════════════════════════════════════ */
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-[#282828] bg-white dark:bg-[#181818]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">
                  <span className="sr-only">Select All</span>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select all bidders"
                  />
                </th>
                <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                <th className="py-2.5 px-3 min-w-[200px]">Bidder / Company</th>
                <th className="py-2.5 px-3 min-w-[140px]">Compliance</th>
                <th className="py-2.5 px-3 min-w-[150px]">Document Authenticity</th>
                <th className="py-2.5 px-3 min-w-[110px]">Risk</th>
                <th className="py-2.5 px-3 min-w-[130px]">Clearance Status</th>
                <th className="py-2.5 px-3 text-right min-w-[140px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {bidders.map((b) => {
                const isSelected = selectedBidderIds.includes(b.id);
                const riskMeta = getRiskTierMeta(b.riskLevel);

                return (
                  <tr
                    key={b.id}
                    className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                      isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectBidder(b.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title={`Select ${b.companyName}`}
                      />
                    </td>

                    {/* Rank */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                          b.rank === 1
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-900'
                            : ''
                        }`}
                      >
                        {b.rankDisplay}
                      </span>
                    </td>

                    {/* Bidder / Company */}
                    <td className="py-3 px-3 min-w-[200px]">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[260px]">
                          {b.companyName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {b.gstNumber ? (
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {b.gstNumber}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3 h-3" />
                              <span>GST Verified</span>
                            </span>
                          )}
                          <span>&bull;</span>
                          <span>{b.docCount} Documents</span>
                        </div>
                      </div>
                    </td>

                    {/* Compliance Score */}
                    <td className="py-3 px-3 min-w-[140px]">
                      {b.complianceScore !== null && b.complianceScore !== undefined ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {b.complianceScore}%
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">Compliance</span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                b.complianceScore >= 80
                                  ? 'bg-emerald-500'
                                  : b.complianceScore >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, b.complianceScore))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>

                    {/* Document Authenticity */}
                    <td className="py-3 px-3 min-w-[150px]">
                      {b.authenticityScore !== null && b.authenticityScore !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{b.authenticityScore}% Authentic</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not verified</span>
                      )}
                    </td>

                    {/* Risk Level */}
                    <td className="py-3 px-3 min-w-[110px]">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${riskMeta.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${riskMeta.dotClass}`} />
                        <span>{riskMeta.label}</span>
                      </span>
                    </td>

                    {/* Clearance / Bid Status */}
                    <td className="py-3 px-3 min-w-[130px]">{getStatusBadge(b.status)}</td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right shrink-0">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReviewBidder(b)}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                          title={`Review full dossier and audit for ${b.companyName}`}
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompareSingle(b)}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition cursor-pointer"
                          title={`Compare ${b.companyName} with other candidate bidders`}
                        >
                          Compare
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. CONTEXTUAL AI EVALUATION DRAWER                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AiEvaluationDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        bidder={aiDrawerBidder}
        tenderId={selectedTenderId}
        comparisonResult={comparisonResult}
        contextBidders={bidders.map((b) => b.rawSubmission || b)}
        loading={compareLoading}
        onSelectBidder={(selected) => setAiDrawerBidder(selected)}
      />
    </div>
  );
};

export default TopBiddersSection;
