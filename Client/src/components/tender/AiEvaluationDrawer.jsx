import { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  X,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Trophy,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { getBidderEvaluation, normalizeComparisonResponse } from '../../utils/tenderComparisonAdapter';

/**
 * Contextual Right-Side AI Evaluation Drawer for individual bidder assessments.
 * Transforms raw ML microservice and Gemini/pgvector JSON into an accessible,
 * human-readable panel inside the Tender Evaluation workflow.
 */
const AiEvaluationDrawer = ({
  isOpen = false,
  onClose,
  bidder = null,
  tenderId = 'N/A',
  comparisonResult = null,
  contextBidders = [],
  loading = false,
  onSelectBidder = null,
}) => {
  // Normalize comparison result
  const normalizedData = useMemo(() => {
    return normalizeComparisonResponse(comparisonResult, contextBidders);
  }, [comparisonResult, contextBidders]);

  // Extract bidder-specific evaluation details
  const bidderEval = useMemo(() => {
    return getBidderEvaluation(normalizedData, bidder);
  }, [normalizedData, bidder]);

  // Tab navigation to reduce density (Issue 21)
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'compliance' | 'analysis' | 'evidence'

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const {
    bidderName,
    bidderId,
    compositeScore,
    scoreDisplay,
    rank,
    isRecommended,
    technicalComplianceMeta,
    financialTurnover,
    gfr144Meta,
    riskTierMeta,
    clarification,
    analysis,
    sourceDocuments,
    docCount,
    complianceChecks,
  } = bidderEval;

  // Evaluated candidate bidders list (for multi-bidder switching)
  const evaluatedBidders = normalizedData?.bidders || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          data-lenis-prevent="true"
          aria-label={`AI Evaluation for ${bidderName}`}
          className="w-screen max-w-xl md:max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right"
        >
          {/* ========================================================================= */}
          {/* DRAWER HEADER                                                             */}
          {/* ========================================================================= */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-blue-50/60 via-indigo-50/30 to-white dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                      AI Evaluation
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Tender #{tenderId || normalizedData?.tenderId || 'N/A'}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight break-words">
                    {bidderName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bidder Reference: {bidderId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Close AI Evaluation Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Bidder Switcher - Semantic Tablist (Issues 16, 17, 22) */}
            {evaluatedBidders.length > 1 && (
              <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                  Evaluated Candidate Pool ({evaluatedBidders.length})
                </span>
                <div
                  role="tablist"
                  aria-label="Evaluated Candidate Selection"
                  className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
                >
                  {evaluatedBidders.map((eb) => {
                    const isCurrent = eb.bidderId === bidderId || eb.bidderName === bidderName;
                    return (
                      <button
                        key={eb.bidderId}
                        type="button"
                        role="tab"
                        aria-selected={isCurrent}
                        onClick={() => onSelectBidder?.(eb)}
                        className={`px-3 py-1.5 rounded-md text-xs transition cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          isCurrent
                            ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold shadow-xs border border-slate-200/80 dark:border-slate-600'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
                        }`}
                      >
                        <span className="break-words font-semibold text-left" title={eb.bidderName}>
                          {eb.bidderName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                            isCurrent
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {eb.scoreDisplay}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* DRAWER BODY (SCROLLABLE & TABBED)                                          */}
          {/* ========================================================================= */}
          <div
            data-lenis-prevent="true"
            className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-800 dark:text-slate-200"
          >
            {/* Loading State */}
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Evaluating Bidder Submission...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Analyzing eligibility against technical specifications, GFR Rule 144, and statutory requirements.
                </p>
              </div>
            ) : (
              <>
                {/* Segmented Category Navigation (Issue 21 - Reduces density) */}
                <div
                  role="tablist"
                  aria-label="AI Evaluation Categories"
                  className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 gap-1 text-xs font-semibold"
                >
                  <button
                    type="button"
                    role="tab"
                    id="tab-overview"
                    aria-controls="panel-overview"
                    aria-selected={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-1.5 px-2 rounded-md transition cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      activeTab === 'overview'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-compliance"
                    aria-controls="panel-compliance"
                    aria-selected={activeTab === 'compliance'}
                    onClick={() => setActiveTab('compliance')}
                    className={`flex-1 py-1.5 px-2 rounded-md transition cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      activeTab === 'compliance'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Compliance
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-analysis"
                    aria-controls="panel-analysis"
                    aria-selected={activeTab === 'analysis'}
                    onClick={() => setActiveTab('analysis')}
                    className={`flex-1 py-1.5 px-2 rounded-md transition cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      activeTab === 'analysis'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    AI Analysis
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-evidence"
                    aria-controls="panel-evidence"
                    aria-selected={activeTab === 'evidence'}
                    onClick={() => setActiveTab('evidence')}
                    className={`flex-1 py-1.5 px-2 rounded-md transition cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      activeTab === 'evidence'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Evidence &amp; Docs ({docCount})
                  </button>
                </div>

                {/* =================================================================== */}
                {/* TAB 1: OVERVIEW PANEL                                              */}
                {/* =================================================================== */}
                {activeTab === 'overview' && (
                  <div
                    id="panel-overview"
                    role="tabpanel"
                    aria-labelledby="tab-overview"
                    className="space-y-4 animate-in fade-in duration-150"
                  >
                    {/* 1. Overall Assessment */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-white to-slate-50/70 dark:from-slate-900 dark:to-slate-800/40 shadow-2xs">
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Overall Assessment
                        </span>
                        <div className="flex items-center gap-1.5">
                          {rank && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Rank #{rank}
                            </span>
                          )}
                          {isRecommended && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              Recommended Bidder
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">
                            Composite Compliance Score
                          </span>
                          <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {scoreDisplay}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                            Algorithm Status
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {compositeScore !== null && compositeScore >= 80
                              ? 'Satisfies Benchmarks'
                              : compositeScore !== null && compositeScore >= 60
                              ? 'Evaluation Conditional'
                              : 'Review Required'}
                          </span>
                        </div>
                      </div>

                      {/* Score Meter Bar */}
                      {compositeScore !== null && !isNaN(compositeScore) && (
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              compositeScore >= 80
                                ? 'bg-emerald-500'
                                : compositeScore >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, compositeScore))}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Financial & Risk Metrics Grid (Issues 18, 19) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Financial Section */}
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Financial Capacity
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">
                          Annual Turnover
                        </span>
                        <span className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                          {financialTurnover}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {financialTurnover !== 'N/A'
                            ? 'Audited turnover certificate cross-checked.'
                            : 'No financial turnover statement in current record.'}
                        </p>
                      </div>

                      {/* Risk Section */}
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Algorithmic Risk Tier
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">
                          Assigned Risk Level
                        </span>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${riskTierMeta.badgeClass}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${riskTierMeta.dotClass}`} />
                            <span>{riskTierMeta.label}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {riskTierMeta.raw === 'LOW'
                            ? 'Low probability of compliance or delivery default.'
                            : riskTierMeta.raw === 'MEDIUM'
                            ? 'Moderate risk requiring standard officer oversight.'
                            : 'Elevated risk requiring scrutiny before award.'}
                        </p>
                      </div>
                    </div>

                    {/* Quick Highlights Box */}
                    <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        Core Compliance Snapshot
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500 dark:text-slate-400">Technical</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {technicalComplianceMeta.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500 dark:text-slate-400">GFR 144(xi)</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {gfr144Meta.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =================================================================== */}
                {/* TAB 2: COMPLIANCE PANEL                                             */}
                {/* =================================================================== */}
                {activeTab === 'compliance' && (
                  <div
                    id="panel-compliance"
                    role="tabpanel"
                    aria-labelledby="tab-compliance"
                    className="space-y-4 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Statutory &amp; Technical Compliance Details
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {complianceChecks.length} parameters evaluated
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Technical Compliance */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Technical Specification Compliance
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${technicalComplianceMeta.badgeClass}`}
                        >
                          <span>{technicalComplianceMeta.label === 'Fully Compliant' ? '✓' : '⚠'}</span>
                          <span>{technicalComplianceMeta.label}</span>
                        </span>
                      </div>

                      {/* GFR 144(xi) Status */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          GFR Rule 144(xi) Land Border Policy
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${gfr144Meta.badgeClass}`}
                        >
                          <span>{gfr144Meta.raw === true ? '✓' : gfr144Meta.raw === false ? '✕' : '⚪'}</span>
                          <span>{gfr144Meta.label}</span>
                        </span>
                      </div>

                      {/* Additional Dynamic Compliance Fields from API */}
                      {complianceChecks
                        .filter((c) => c.id !== 'tech_compliance' && c.id !== 'gfr144')
                        .map((c) => (
                          <div
                            key={c.id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs"
                          >
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                              {c.name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${c.badgeClass}`}
                            >
                              <span>{c.icon}</span>
                              <span>{c.value}</span>
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* =================================================================== */}
                {/* TAB 3: AI ANALYSIS PANEL                                            */}
                {/* =================================================================== */}
                {activeTab === 'analysis' && (
                  <div
                    id="panel-analysis"
                    role="tabpanel"
                    aria-labelledby="tab-analysis"
                    className="space-y-4 animate-in fade-in duration-150"
                  >
                    <div className="p-4 rounded-xl border border-blue-200/90 dark:border-blue-900/50 bg-linear-to-b from-blue-50/40 to-white dark:from-blue-950/20 dark:to-slate-900 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-blue-100 dark:border-blue-900/40">
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Grounded AI Analysis &amp; Key Observations
                        </h4>
                      </div>

                      {analysis.hasContent ? (
                        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                          {analysis.summary && (
                            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                              <MarkdownRenderer content={analysis.summary} />
                            </div>
                          )}

                          {analysis.observations.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                                Key Observations
                              </span>
                              {analysis.observations.map((obs, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs flex items-start gap-2"
                                >
                                  <span className="text-blue-600 shrink-0 mt-0.5 font-bold">•</span>
                                  <span>{obs}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          No automated narrative analysis was returned for this bidder submission.
                        </p>
                      )}
                    </div>

                    {/* Clarifications / Attention Items (Issue 18) */}
                    {clarification && (
                      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 shadow-2xs">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                              Attention Items &amp; Clarifications
                            </h4>
                            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                              {clarification}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =================================================================== */}
                {/* TAB 4: EVIDENCE & SOURCE DOCUMENTS PANEL                           */}
                {/* =================================================================== */}
                {activeTab === 'evidence' && (
                  <div
                    id="panel-evidence"
                    role="tabpanel"
                    aria-labelledby="tab-evidence"
                    className="space-y-4 animate-in fade-in duration-150"
                  >
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-blue-600" />
                          Evidence &amp; Source Documents ({docCount})
                        </h4>
                      </div>

                      {sourceDocuments.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {sourceDocuments.map((doc, idx) => (
                            <div
                              key={doc.name || idx}
                              className="py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {doc.name || `Document #${idx + 1}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                                {doc.type && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                                    {doc.type}
                                  </span>
                                )}
                                {doc.size && <span>{doc.size}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Source documentation details are maintained in the bidder submission dossier.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ========================================================================= */}
          {/* DRAWER FOOTER                                                             */}
          {/* ========================================================================= */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>GeM Automated Compliance &amp; Assessment Engine</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Close
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AiEvaluationDrawer;
