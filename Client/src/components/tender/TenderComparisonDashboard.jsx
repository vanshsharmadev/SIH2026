import { useState, useMemo } from 'react';
import {
  Sparkles,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Scale,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { normalizeComparisonResponse } from '../../utils/tenderComparisonAdapter';

/**
 * Clean, professional procurement evaluation dashboard for government officers.
 * Transforms raw ML microservice and Gemini/pgvector JSON into human-readable UI.
 */
const TenderComparisonDashboard = ({
  comparisonResult = null,
  contextBidders = [],
  loading = false,
  error = null,
  onRetry = null,
}) => {
  // Normalize raw API responses into a clean view model
  const data = useMemo(() => {
    return normalizeComparisonResponse(comparisonResult, contextBidders);
  }, [comparisonResult, contextBidders]);

  const [copiedTenderId, setCopiedTenderId] = useState(false);

  // Copy helper
  const handleCopy = (text, type = 'tender') => {
    if (!text) return;
    navigator.clipboard?.writeText(typeof text === 'string' ? text : String(text));
    if (type === 'tender') {
      setCopiedTenderId(true);
      setTimeout(() => setCopiedTenderId(false), 2000);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center px-4">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Synthesizing Multi-Bidder Algorithmic Evaluation
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1.5 leading-relaxed">
          Evaluating submissions against GeM GFR Rule 144(xi), CCA Root Class-3 DSC signatures, and Live MCA/GSTIN taxpayer records...
        </p>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-full border border-blue-200/60 dark:border-blue-900/40">
          <Scale className="w-3.5 h-3.5 animate-pulse" />
          <span>Evaluating Compliance &amp; Eligibility Parameters</span>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error || (!data.isValid && data.errorMessage)) {
    return (
      <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-slate-800 dark:text-slate-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">
              Comparative Analysis Could Not Be Completed
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
              {error || data.errorMessage || 'An error occurred while evaluating candidate bidder submissions.'}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Analysis
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (data.isEmpty) {
    return (
      <div className="py-16 text-center px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-70" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Bidders Evaluated
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No bidder matrix or rankings were returned by the evaluation service. Select candidate submissions and rerun comparison.
        </p>
      </div>
    );
  }

  const {
    tenderId,
    biddersEvaluated,
    verdictLabel,
    statusLabel,
    generatedAt,
    recommendedBidder,
    analysis,
    bidders,
    complianceOverview,
  } = data;

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      {/* ========================================================================= */}
      {/* 1. TENDER SUMMARY HEADER CARD                                             */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                Tender Evaluation Summary
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {statusLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Tender: {tenderId}
              </h3>
              <button
                type="button"
                onClick={() => handleCopy(tenderId, 'tender')}
                title="Copy Tender ID"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition cursor-pointer"
              >
                {copiedTenderId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Automated Compliance &amp; Verification Engine</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {generatedAt}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                Bidders Evaluated
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                {biddersEvaluated} Submissions
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                Comparison Verdict
              </span>
              <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                {verdictLabel}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                Audit Trail
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Secured & Logged
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SYSTEM-IDENTIFIED / RECOMMENDED BIDDER HIGHLIGHT                       */}
      {/* ========================================================================= */}
      {recommendedBidder && (
        <div className="rounded-2xl border-2 border-blue-500/30 dark:border-blue-500/40 bg-linear-to-r from-blue-50/80 via-indigo-50/40 to-emerald-50/50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-emerald-950/30 p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Trophy className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                    AI Comparison Result • System-Identified Bidder
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    Highest Composite Score
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <span>{recommendedBidder.bidderName}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    ({recommendedBidder.bidderId})
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                  {recommendedBidder.technicalComplianceMeta.label === 'Fully Compliant'
                    ? 'Evaluated as top-ranked submission satisfying all technical, financial turnover, and statutory compliance benchmarks without critical discrepancies.'
                    : 'System-identified candidate leading comparative scoring matrix across evaluated criteria.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                  Composite Score
                </span>
                <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                  {recommendedBidder.scoreDisplay}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs text-center min-w-[90px]">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Risk Tier</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                  <span>{recommendedBidder.riskTierMeta.icon}</span>
                  <span>{recommendedBidder.riskTierMeta.label}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COMPLIANCE OVERVIEW (STATUTORY CHECKS)                                  */}
      {/* ========================================================================= */}
      {complianceOverview.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Statutory & Regulatory Compliance Checks
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {complianceOverview.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.title}
                    </span>
                    <span className="text-sm shrink-0">{item.icon}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {item.note}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Status</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.badgeClass}`}
                  >
                    {item.statusLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BIDDER COMPARISON CARDS                                                */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            Candidate Bidder Comparison Cards ({bidders.length})
          </h4>
          <span className="text-[11px] text-slate-500">
            Ranked by Algorithmic Composite Performance
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bidders.map((b, idx) => {
            const isTop = b.isRecommended || idx === 0;
            const scoreNum = typeof b.compositeScore === 'number' ? b.compositeScore : null;

            return (
              <div
                key={b.bidderId || idx}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-2xs ${
                  isTop
                    ? 'border-blue-300 dark:border-blue-800 bg-linear-to-b from-blue-50/40 via-white to-slate-50/50 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  {/* Card Top Header */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isTop
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Rank #{b.rank}
                      </span>
                      {b.isRecommended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5" />
                          Recommended
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {b.scoreDisplay}
                      </span>
                    </div>
                  </div>

                  {/* Score Progress Bar */}
                  {scoreNum !== null && (
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          scoreNum >= 80
                            ? 'bg-emerald-500'
                            : scoreNum >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, scoreNum))}%` }}
                      />
                    </div>
                  )}

                  {/* Bidder Identity */}
                  <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                    {b.bidderName}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    ID: <span className="font-mono">{b.bidderId}</span>
                    {b.docCount !== 'N/A' && ` • ${b.docCount} Documents`}
                  </p>

                  {/* Metric Badges Grid */}
                  <div className="mt-3.5 space-y-2 text-xs">
                    {/* Technical Compliance */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Technical Compliance
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md text-[10px] border flex items-center gap-1 ${b.technicalComplianceMeta.badgeClass}`}
                      >
                        <span>{b.technicalComplianceMeta.icon}</span>
                        <span>{b.technicalComplianceMeta.label}</span>
                      </span>
                    </div>

                    {/* Financial Turnover */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Financial Turnover
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {b.financialTurnover}
                      </span>
                    </div>

                    {/* GFR 144 Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        GFR Rule 144(xi)
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md text-[10px] border flex items-center gap-1 ${b.gfr144Meta.badgeClass}`}
                      >
                        <span>{b.gfr144Meta.icon}</span>
                        <span>{b.gfr144Meta.label}</span>
                      </span>
                    </div>

                    {/* Risk Tier */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Risk Tier
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md text-[10px] border flex items-center gap-1 ${b.riskTierMeta.badgeClass}`}
                      >
                        <span>{b.riskTierMeta.icon}</span>
                        <span>{b.riskTierMeta.label}</span>
                      </span>
                    </div>

                    {/* Digital Signature (DSC) status if present */}
                    {b.pyhankoAuthentic !== null && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Digital Signature (DSC)
                        </span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md text-[10px] border flex items-center gap-1 ${
                            b.pyhankoAuthentic
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <span>{b.pyhankoAuthentic ? '✅' : '❌'}</span>
                          <span>{b.pyhankoAuthentic ? 'Authentic' : 'Invalid'}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clarification Requirement / Bottom note */}
                {b.clarificationRequirement !== 'N/A' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <span>{b.clarificationRequirement}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. COMPARISON TABLE (RESPONSIVE)                                          */}
      {/* ========================================================================= */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-600" />
          Comparative Bidder Evaluation Matrix Table
        </h4>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5 text-center w-12">Rank</th>
                <th className="py-3 px-4">Bidder</th>
                <th className="py-3 px-4">Composite Score</th>
                <th className="py-3 px-4">Technical Compliance</th>
                <th className="py-3 px-4">Financial Turnover</th>
                <th className="py-3 px-3 text-center">GFR 144</th>
                <th className="py-3 px-4 text-center">Risk Tier</th>
                <th className="py-3 px-4">Clarification / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {bidders.map((b, idx) => (
                <tr
                  key={b.bidderId || idx}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    b.isRecommended ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-3.5 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                        b.isRecommended
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {b.rank}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {b.bidderName}
                          </span>
                          {b.isRecommended && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200">
                              L1 Recommended
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {b.bidderId}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {b.scoreDisplay}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${b.technicalComplianceMeta.badgeClass}`}
                    >
                      <span>{b.technicalComplianceMeta.icon}</span>
                      <span>{b.technicalComplianceMeta.label}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {b.financialTurnover}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${b.gfr144Meta.badgeClass}`}
                    >
                      <span>{b.gfr144Meta.icon}</span>
                      <span>{b.gfr144Meta.label}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${b.riskTierMeta.badgeClass}`}
                    >
                      <span>{b.riskTierMeta.icon}</span>
                      <span>{b.riskTierMeta.label}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                    {b.clarificationRequirement !== 'N/A' ? (
                      <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {b.clarificationRequirement}
                      </span>
                    ) : (
                      <span className="text-slate-400">No action required</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. AI ANALYSIS & GROUNDED SYNTHESIS                                       */}
      {/* ========================================================================= */}
      {analysis.hasContent && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-linear-to-b from-blue-50/40 via-white to-slate-50/30 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-blue-100 dark:border-blue-900/40">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Comparative Compliance Analysis
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Synthesized evaluation based on statutory compliance clauses, financial capabilities, and technical merits.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {/* Executive Summary */}
            {analysis.summary && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800">
                <MarkdownRenderer content={analysis.summary} />
              </div>
            )}

            {/* Observations / Key Findings */}
            {analysis.observations.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1.5">
                  Key Algorithmic Observations
                </span>
                <div className="space-y-1.5">
                  {analysis.observations.map((obs, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2 text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clarification Points if found */}
            {analysis.clarifications.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1.5">
                  Officer Clarification Action Items
                </span>
                <div className="space-y-1.5">
                  {analysis.clarifications.map((cl, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 flex items-start gap-2 text-xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>{cl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenderComparisonDashboard;
