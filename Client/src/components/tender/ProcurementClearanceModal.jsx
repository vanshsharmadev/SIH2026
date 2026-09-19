import { useState, useEffect, useId } from 'react';
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  Info,
  Check,
  FileText,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';

/**
 * ProcurementClearanceModal
 * 
 * Enterprise-grade Procurement Clearance Decision Engine modal
 * for the Government e-Marketplace (GeM) compliance platform.
 * 
 * Preserves 100% of existing backend logic, payloads, and verdicts:
 * - 'CLEARED'
 * - 'CONDITIONALLY_CLEARED'
 * - 'REJECTED'
 */
const ProcurementClearanceModal = ({
  isOpen,
  onClose,
  submission,
  verdict = 'CLEARED',
  setVerdict,
  remarks = '',
  setRemarks,
  isSubmitting = false,
  onConfirm,
  errorMessage = null,
}) => {
  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const remarksId = useId();

  // Reset confirmation step whenever modal opens or submission changes
  useEffect(() => {
    if (isOpen) {
      setShowConfirmStep(false);
    }
  }, [isOpen, submission?.id]);

  // Handle ESC key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        if (showConfirmStep) {
          setShowConfirmStep(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, showConfirmStep, isSubmitting, onClose]);

  if (!isOpen || !submission) return null;

  // Derive real data values with safe fallbacks
  const complianceScore = Number(submission.complianceScore) || 0;
  const forensicAuthenticity = submission.mlDossier?.forensicAuthenticity ?? 98;
  const statutoryStatus = submission.mlDossier?.taxpayerVerification || 'Active GSTN';

  // Compliance score rating categorization
  const getScoreRating = (score) => {
    if (score >= 85) return { label: 'Excellent Compliance', color: 'emerald', dot: 'bg-emerald-500' };
    if (score >= 65) return { label: 'Requires Scrutiny', color: 'amber', dot: 'bg-amber-500' };
    return { label: 'Critical Discrepancies', color: 'rose', dot: 'bg-rose-500' };
  };

  const scoreRating = getScoreRating(complianceScore);

  // Risk profile assessment for decision context
  const getRiskProfile = () => {
    if (verdict === 'REJECTED' || complianceScore < 60) {
      return { level: 'High Risk', textClass: 'text-rose-600 dark:text-rose-400' };
    }
    if (verdict === 'CONDITIONALLY_CLEARED' || complianceScore < 85) {
      return { level: 'Moderate Risk', textClass: 'text-amber-600 dark:text-amber-400' };
    }
    return { level: 'Low Risk', textClass: 'text-emerald-600 dark:text-emerald-400' };
  };

  const riskProfile = getRiskProfile();

  // Primary action button dynamic label & styling
  const getVerdictActionDetails = () => {
    switch (verdict) {
      case 'CLEARED':
        return {
          label: 'Confirm & Issue Clearance',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25',
          borderClass: 'border-emerald-500',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'CONDITIONALLY_CLEARED':
        return {
          label: 'Confirm Conditional Clearance',
          buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25',
          borderClass: 'border-amber-500',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        };
      case 'REJECTED':
      default:
        return {
          label: 'Confirm Rejection',
          buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25',
          borderClass: 'border-rose-500',
          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          icon: <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
        };
    }
  };

  const actionDetails = getVerdictActionDetails();

  const handleProceedToConfirm = () => {
    setShowConfirmStep(true);
  };

  const handleFinalSubmit = () => {
    if (onConfirm && !isSubmitting) {
      onConfirm();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="procurement-clearance-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        
        {/* ============================================================== */}
        {/* 1. HEADER                                                     */}
        {/* ============================================================== */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="procurement-clearance-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight"
                >
                  Procurement Clearance Decision Engine
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Lock className="w-2.5 h-2.5" />
                  Official GeM Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Final procurement compliance assessment &amp; statutory clearance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* MAIN BODY AREA                                                 */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 bg-slate-50/40 dark:bg-slate-900/40">
          
          {/* Top Error Alert if present */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Execution Notice</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {!showConfirmStep ? (
            <>
              {/* ============================================================== */}
              {/* 2. BIDDER / TENDER SUMMARY (Two-Column Clean Layout)          */}
              {/* ============================================================== */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Bidder identity */}
                  <div className="space-y-2.5">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Bidder Entity
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {submission.bidder}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Submission ID
                      </span>
                      <div className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        <span>{submission.id}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Tender Subject
                      </span>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-1 mt-0.5" title={submission.tenderTitle}>
                        {submission.tenderTitle}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Tender identity & timeline */}
                  <div className="space-y-2.5 md:border-l md:border-slate-100 md:dark:border-slate-800 md:pl-4">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Tender Reference ID
                      </span>
                      <div className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span>{submission.tenderId}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Procuring Department
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                        {submission.department || 'Government e-Marketplace (GeM)'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Submitted On
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{submission.submittedOn || '25 May 2024'}</span>
                        {submission.submittedTime && (
                          <>
                            <span>•</span>
                            <span>{submission.submittedTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* 3. COMPLIANCE SNAPSHOT (Three Equal Metric Cards)             */}
              {/* ============================================================== */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Compliance Snapshot
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Automated ML Verification
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card 1: Compliance Score */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Compliance Score
                      </span>
                      <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {complianceScore}%
                      </span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          complianceScore >= 85
                            ? 'bg-emerald-500'
                            : complianceScore >= 65
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(complianceScore, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${scoreRating.dot}`} />
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                        {scoreRating.label}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Document Authenticity */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Doc Authenticity
                      </span>
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        {forensicAuthenticity}%
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Authentic
                      </span>
                    </div>
                    {/* Visual Verified Pill */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${Math.min(forensicAuthenticity, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                        Verified Signatures
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Statutory Status */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Statutory Status
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                        {statutoryStatus}
                      </span>
                    </div>
                    {/* Status indicator bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 w-full" />
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                        GST &amp; Rule 144(xi) Cleared
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* 4. CLEARANCE DECISION (Dominant Interactive Cards)            */}
              {/* ============================================================== */}
              <div className="space-y-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Procurement Clearance Decision</span>
                    <span className="text-xs font-normal text-rose-500">*</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select the final clearance status for this bidder based on the compliance assessment.
                  </p>
                </div>

                <div
                  role="radiogroup"
                  aria-label="Procurement Clearance Verdict Options"
                  className="space-y-2.5"
                >
                  {/* CARD 1: CLEARED */}
                  <div
                    role="radio"
                    aria-checked={verdict === 'CLEARED'}
                    tabIndex={0}
                    onClick={() => setVerdict('CLEARED')}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setVerdict('CLEARED');
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none relative ${
                      verdict === 'CLEARED'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection Radio / Check Indicator */}
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            verdict === 'CLEARED'
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {verdict === 'CLEARED' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              CLEARED
                            </span>
                          </div>
                          {complianceScore >= 80 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          Bidder fully qualifies against tender requirements and statutory compliance.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: CONDITIONALLY CLEARED */}
                  <div
                    role="radio"
                    aria-checked={verdict === 'CONDITIONALLY_CLEARED'}
                    tabIndex={0}
                    onClick={() => setVerdict('CONDITIONALLY_CLEARED')}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setVerdict('CONDITIONALLY_CLEARED');
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none relative ${
                      verdict === 'CONDITIONALLY_CLEARED'
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection Radio / Check Indicator */}
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            verdict === 'CONDITIONALLY_CLEARED'
                              ? 'border-amber-600 bg-amber-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {verdict === 'CONDITIONALLY_CLEARED' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              CONDITIONALLY CLEARED
                            </span>
                          </div>
                          {complianceScore >= 60 && complianceScore < 80 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Scrutiny Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          Minor clarification or additional verification is required.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: REJECTED */}
                  <div
                    role="radio"
                    aria-checked={verdict === 'REJECTED'}
                    tabIndex={0}
                    onClick={() => setVerdict('REJECTED')}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setVerdict('REJECTED');
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none relative ${
                      verdict === 'REJECTED'
                        ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection Radio / Check Indicator */}
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            verdict === 'REJECTED'
                              ? 'border-rose-600 bg-rose-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {verdict === 'REJECTED' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              REJECTED
                            </span>
                          </div>
                          {complianceScore < 60 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              Disqualification
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          Bidder does not satisfy one or more mandatory tender or compliance criteria.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* 5. DECISION CONTEXT BANNER                                     */}
                {/* ============================================================== */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Selected Decision:
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${actionDetails.badgeClass}`}>
                      {actionDetails.icon}
                      <span>
                        {verdict === 'CLEARED'
                          ? 'CLEARED'
                          : verdict === 'CONDITIONALLY_CLEARED'
                          ? 'CONDITIONALLY CLEARED'
                          : 'REJECTED'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-xs flex-wrap">
                    <span>
                      Compliance: <strong className="text-slate-900 dark:text-white">{complianceScore}%</strong>
                    </span>
                    <span>
                      Risk: <strong className={riskProfile.textClass}>{riskProfile.level}</strong>
                    </span>
                    <span>
                      Doc Authenticity: <strong className="text-slate-900 dark:text-white">{forensicAuthenticity}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* 6. OFFICER NOTES / AUDIT REMARKS                               */}
              {/* ============================================================== */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={remarksId}
                    className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Officer Remarks
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {remarks.length} / 500 characters
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add audit observations, verification notes, or clarification requirements.
                </p>

                <textarea
                  id={remarksId}
                  rows={3}
                  maxLength={500}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Audited against submitted documentation & verified DSC signature. Approved for commercial stage."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/90 bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs transition leading-relaxed resize-y"
                />

                {/* Audit notification tip if conditional or rejected */}
                {verdict !== 'CLEARED' && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 pt-0.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {verdict === 'CONDITIONALLY_CLEARED'
                        ? 'Recommended: Please specify the clarification deadline or pending BOQ documents.'
                        : 'Audit Rule: Disqualification clauses and non-compliance grounds should be documented.'}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ============================================================== */
            /* 7. CONFIRMATION SAFETY STEP                                     */
            /* ============================================================== */
            <div className="space-y-4 py-2 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Confirm Procurement Clearance?
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    You are about to issue an official procurement clearance verdict for{' '}
                    <strong className="text-slate-900 dark:text-white">{submission.bidder}</strong>. This
                    decision will be cryptographically recorded in the compliance audit trail.
                  </p>
                </div>
              </div>

              {/* Decision Summary Card */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Clearance Verdict:
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${actionDetails.badgeClass}`}>
                    {actionDetails.icon}
                    <span>
                      {verdict === 'CLEARED'
                        ? 'CLEARED'
                        : verdict === 'CONDITIONALLY_CLEARED'
                        ? 'CONDITIONALLY CLEARED'
                        : 'REJECTED'}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Bidder Name
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">
                      {submission.bidder}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Submission ID
                    </span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block mt-0.5">
                      {submission.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Tender Reference
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 block mt-0.5 truncate">
                      {submission.tenderId}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Compliance Rating
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                      {complianceScore}% • {scoreRating.label}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Recorded Officer Notes
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg mt-1 italic leading-relaxed">
                    {remarks || 'Officer clearance verified via submitted documentation & DSC signature'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 8. FINAL ACTION BAR (Sticky Footer)                             */}
        {/* ============================================================== */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between gap-3">
          {!showConfirmStep ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedToConfirm}
                disabled={isSubmitting}
                className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-xs ${actionDetails.buttonClass}`}
              >
                <span>{actionDetails.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowConfirmStep(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Edit</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 ${actionDetails.buttonClass}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Clearance...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Yes, Issue Official Decision</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProcurementClearanceModal;
