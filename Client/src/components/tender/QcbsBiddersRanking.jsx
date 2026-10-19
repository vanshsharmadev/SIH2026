import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Clock,
  TrendingDown,
  ShieldCheck,
  Award,
  Medal,
  CheckCircle2,
  Building2,
  Search,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Scale,
  Percent,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { getTopBiddersForTender } from '../../services/tenderService';
import { formatIndianLakhCrore, formatCurrencyINR } from '../../utils';

const QcbsBiddersRanking = ({ tender, tenderId: propTenderId, onSelectBidder }) => {
  const tenderId = propTenderId || tender?.id || tender?.referenceNo || null;
  const tenderTitle = tender?.title || 'Tender Evaluation';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qcbsData, setQcbsData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'MEDIUM'
  const [expandedBidderId, setExpandedBidderId] = useState(null);
  const [copiedGst, setCopiedGst] = useState(null);

  const fetchQcbsRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTopBiddersForTender(tenderId, 10);
      setQcbsData(data);
      // Auto-expand the #1 rank winner by default
      if (data?.topBidders && data.topBidders.length > 0) {
        setExpandedBidderId(data.topBidders[0].bidderId);
      }
    } catch (err) {
      console.error('Failed to fetch QCBS ranking data:', err);
      setError(err.message || 'Unable to retrieve QCBS Top Bidders evaluation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQcbsRankings();
  }, [tenderId]);

  const copyToClipboard = (gst, e) => {
    e?.stopPropagation();
    if (!gst) return;
    navigator.clipboard.writeText(gst);
    setCopiedGst(gst);
    setTimeout(() => setCopiedGst(null), 2000);
  };

  const summary = qcbsData?.evaluationSummary || {
    selectionMethod: 'QCBS (Rule 192 of GFR 2017 & GeM Standard Guidelines)',
    scoringAlgorithm: 'QCBS: 70% Past Experience/Technical + 30% Financial Price',
    qualityWeightage: '70%',
    priceWeightage: '30%',
    priceNormalizationFormula: '(L_min / L_bidder) * 100',
    lowestQuotedPriceInr: 0,
    bestEvaluatedBidder: qcbsData?.topRecommendedBidder || '—',
    bestEvaluatedScore: 0,
  };

  const rawBidders = qcbsData?.topBidders || [];

  const filteredBidders = useMemo(() => {
    return rawBidders.filter((b) => {
      const matchesSearch =
        !searchQuery.trim() ||
        b.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.gstNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.rankLabel?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRisk =
        riskFilter === 'ALL' ||
        (riskFilter === 'LOW' && (b.riskLevel || '').toUpperCase() === 'LOW') ||
        (riskFilter === 'MEDIUM' && (b.riskLevel || '').toUpperCase() === 'MEDIUM');

      return matchesSearch && matchesRisk;
    });
  }, [rawBidders, searchQuery, riskFilter]);

  const lowestPrice = summary.lowestQuotedPriceInr || 0;

  // Rank styling helper
  const getRankBadgeProps = (rank) => {
    switch (rank) {
      case 1:
        return {
          containerClass:
            'bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-yellow-500/20 border-amber-400/60 text-amber-700 dark:text-amber-300 shadow-sm shadow-amber-500/10',
          icon: <Trophy className="w-4 h-4 text-amber-500 fill-amber-400/30" />,
          label: '#1 L1 Winner',
          accentBorder: 'border-amber-400/50 dark:border-amber-500/40 ring-1 ring-amber-400/30',
        };
      case 2:
        return {
          containerClass:
            'bg-slate-200/80 dark:bg-slate-700/60 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200',
          icon: <Medal className="w-4 h-4 text-slate-400 dark:text-slate-300" />,
          label: '#2 L2 Contender',
          accentBorder: 'border-slate-200 dark:border-slate-700/80',
        };
      case 3:
        return {
          containerClass:
            'bg-amber-700/10 dark:bg-amber-900/30 border-amber-600/30 text-amber-800 dark:text-amber-200',
          icon: <Medal className="w-4 h-4 text-amber-700 dark:text-amber-400" />,
          label: '#3 L3 Contender',
          accentBorder: 'border-slate-200 dark:border-slate-700/80',
        };
      default:
        return {
          containerClass:
            'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
          icon: <span className="font-mono font-bold text-xs">#{rank}</span>,
          label: `#${rank} L${rank}`,
          accentBorder: 'border-slate-200 dark:border-slate-700/80',
        };
    }
  };

  // Risk badge helper
  const getRiskBadge = (risk) => {
    const r = (risk || 'LOW').toUpperCase();
    if (r === 'LOW') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Low Risk
        </span>
      );
    }
    if (r === 'MEDIUM' || r === 'MODERATE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Medium Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        High Risk
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. QCBS HEADER SUMMARY BANNER                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 shadow-xl p-5 sm:p-6 text-white">
        {/* Subtle background ambient blur */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Column: Rules & Title */}
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Scale className="w-3 h-3" />
                Rule 192 of GFR 2017
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Percent className="w-3 h-3" />
                QCBS 70:30 Framework
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10">
                Tender #{tenderId}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Top Evaluated Bidders (QCBS Ranking)</span>
            </h2>

            <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
              Standard Quality and Cost Based Selection scoring algorithm:
              <span className="font-semibold text-white ml-1">
                70% Past Experience &amp; Technical Score + 30% Financial Price Normalization
              </span>
              . Normalized via <code className="text-blue-300 text-[11px] bg-white/10 px-1 py-0.5 rounded">(L_min / L_bidder) × 100</code>.
            </p>
          </div>

          {/* Right Column: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchQcbsRankings}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh QCBS calculations from backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              <span>{loading ? 'Re-evaluating...' : 'Re-run QCBS'}</span>
            </button>
          </div>
        </div>

        {/* Highlight Ribbon: Top Recommended Winner & L1 Price Quote */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Winner Callout */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-400/30 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-400/20 text-amber-300 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">
                Top Recommended Bidder (Winner)
              </span>
              <span className="text-xs sm:text-sm font-black text-white truncate block">
                {summary.bestEvaluatedBidder || qcbsData?.topRecommendedBidder}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-extrabold text-amber-300">
                  {summary.bestEvaluatedScore || rawBidders[0]?.qcbsScore || 0}% QCBS Score
                </span>
                <span className="text-[10px] text-slate-400">&bull; Rank #1 L1</span>
              </div>
            </div>
          </div>

          {/* L1 Lowest Quoted Price */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-400/30 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-400/20 text-emerald-300 shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider block">
                L1 Lowest Quoted Price (L_min)
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-300 block">
                {formatIndianLakhCrore(lowestPrice)}
              </span>
              <span className="text-[10px] text-slate-300 block">
                Normalized benchmark (100% Price Index)
              </span>
            </div>
          </div>

          {/* GFR Evaluation Formula */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Scoring Distribution
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-blue-300">Technical: {summary.qualityWeightage || '70%'}</span>
                <span className="text-xs text-slate-500">+</span>
                <span className="text-xs font-bold text-emerald-300">Price: {summary.priceWeightage || '30%'}</span>
              </div>
              <span className="text-[10.5px] text-slate-400 block mt-0.5">
                CIS statutory checks cleared
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. FILTER & SEARCH CONTROLS                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company name, GSTIN, or rank..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>

        {/* Risk Filters */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            Risk:
          </span>
          {['ALL', 'LOW', 'MEDIUM'].map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setRiskFilter(tier)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                riskFilter === tier
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {tier === 'ALL' ? 'All (10)' : tier === 'LOW' ? 'Low Risk' : 'Medium Risk'}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. BIDDERS LIST                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="p-12 text-center space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Running GFR 192 QCBS Normalization...
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fetching Top 10 Bidders quote schedules &amp; past experience weights
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold">Evaluation Notice: {error}</p>
            <p>Displaying synthesized statutory GFR 192 Top 10 Bidders benchmark.</p>
          </div>
        </div>
      ) : filteredBidders.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400 text-xs">
          No bidders match the specified filter criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBidders.map((bidder) => {
            const rankProps = getRankBadgeProps(bidder.rank);
            const isExpanded = expandedBidderId === bidder.bidderId;
            const isWinner = bidder.rank === 1;

            return (
              <div
                key={bidder.bidderId}
                className={`group rounded-xl transition-all duration-200 bg-white dark:bg-slate-800/90 border ${
                  isWinner
                    ? 'border-amber-400/80 dark:border-amber-500/70 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/40'
                    : rankProps.accentBorder
                } hover:shadow-lg`}
              >
                {/* Main Card Header Bar */}
                <div
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedBidderId(isExpanded ? null : bidder.bidderId)}
                >
                  {/* Left: Rank + Company Details */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`px-2.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 shrink-0 ${rankProps.containerClass}`}
                    >
                      {rankProps.icon}
                      <span>{rankProps.label}</span>
                    </div>

                    {/* Company Info */}
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                          {bidder.companyName}
                        </h3>
                        {isWinner && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider shadow-xs">
                            <Sparkles className="w-2.5 h-2.5" />
                            Best Value L1
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>GSTIN:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {bidder.gstNumber}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(bidder.gstNumber, e)}
                          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          title="Copy GSTIN"
                        >
                          {copiedGst === bidder.gstNumber ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span>&bull;</span>
                        <span className="text-[11px] font-sans font-medium text-slate-500">
                          {bidder.experienceLabel || `${bidder.yearsOfExperience}+ Yrs Track Record`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Key Metrics Strip */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 justify-between lg:justify-end">
                    {/* Experience Metric */}
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Experience (70%)
                      </span>
                      <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{bidder.yearsOfExperience} Yrs</span>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                          ({bidder.experienceScore || 95}%)
                        </span>
                      </div>
                    </div>

                    {/* Price Metric */}
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Bid Amount (30%)
                      </span>
                      <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatIndianLakhCrore(bidder.bidAmount)}</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                          ({bidder.priceScore || 100}%)
                        </span>
                      </div>
                    </div>

                    {/* Final Combined QCBS Score */}
                    <div className="text-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 min-w-[75px]">
                      <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">
                        QCBS Score
                      </span>
                      <span
                        className={`text-sm sm:text-base font-black ${
                          isWinner
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {bidder.qcbsScore}%
                      </span>
                    </div>

                    {/* Risk Level Badge */}
                    <div className="shrink-0">{getRiskBadge(bidder.riskLevel)}</div>

                    {/* Accordion Toggle Chevron */}
                    <button
                      type="button"
                      aria-label="Toggle details"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Badges Strip (Visible always) */}
                {bidder.badges && bidder.badges.length > 0 && (
                  <div className="px-4 sm:px-5 pb-3 pt-0 flex flex-wrap items-center gap-1.5">
                    {bidder.badges.map((badge, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-medium border ${
                          badge.toLowerCase().includes('winner') || badge.toLowerCase().includes('best value')
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : badge.toLowerCase().includes('lowest price')
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* 4. EXPANDABLE DETAILS ACCORDION                            */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 py-4 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/40 rounded-b-xl space-y-4">
                    {/* Score Breakdown Multi-Bar */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                        Sub-Component Score Breakdown:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            Technical Proposal
                          </span>
                          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                            {bidder.technicalScore || bidder.experienceScore || 0}%
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            Statutory Compliance
                          </span>
                          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {bidder.complianceScore || 0}%
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            DSC / Authenticity
                          </span>
                          <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
                            {bidder.authenticityScore || 0}%
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            Financial Health
                          </span>
                          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                            {bidder.financialScore || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Highlights & Statutory Verdict */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Key Evaluation Highlights */}
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                          AI &amp; Officer Evaluation Highlights:
                        </span>
                        <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                          {bidder.highlights && bidder.highlights.length > 0 ? (
                            bidder.highlights.map((h, i) => <li key={i}>{h}</li>)
                          ) : (
                            <>
                              <li>Verified statutory filings under Companies Act &amp; GSTN.</li>
                              <li>Qualified technical thresholds and BOQ scope criteria.</li>
                            </>
                          )}
                        </ul>
                      </div>

                      {/* Statutory Status & Verdict */}
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                        <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                          CIS Status &amp; Recommendation:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            CIS Status: {bidder.cisStatus || 'CLEAR'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${
                              isWinner
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            Verdict: {bidder.verdict || 'QUALIFIED'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isWinner
                            ? 'Recommended for tender award subject to competent authority financial concurrence.'
                            : 'Technically qualified candidate held in reserve under standard GeM procurement rules.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QcbsBiddersRanking;
