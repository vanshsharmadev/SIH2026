import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  ShieldCheck,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Award,
  Lock,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { isTenderClosed } from '../../utils';

const TenderDetailModal = ({ tender, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isClosed = isTenderClosed(tender);

  useEffect(() => {
    if (!tender) return;

    // Prevent body background scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Explicitly pause Lenis smooth scroll so background window never scrolls
    if (window.lenis) {
      window.lenis.stop();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);

      // Resume Lenis smooth scroll when modal closes
      if (window.lenis) {
        window.lenis.start();
      }
    };
  }, [tender, onClose]);

  if (!tender) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150 overscroll-contain"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
    >
      <div
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[88vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
      >
        {/* Header */}
        <div className="shrink-0 bg-[#073567] dark:bg-slate-950 px-5 sm:px-6 py-4 text-white flex items-start justify-between gap-4 border-b border-blue-900/30 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-md bg-white/15 text-blue-100 font-mono text-xs font-bold tracking-wider">
                {tender.referenceNo}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                  tender.status === 'Closing Soon'
                    ? 'bg-amber-500'
                    : tender.status === 'Under Evaluation'
                    ? 'bg-purple-600'
                    : 'bg-emerald-600'
                }`}
              >
                {tender.status}
              </span>
              <span className="text-[11px] text-blue-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Ends in {tender.daysLeft}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold leading-snug text-white">
              {tender.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          className="flex-1 min-h-0 p-5 sm:p-6 space-y-5 overflow-y-auto overscroll-contain text-xs sm:text-sm"
          data-lenis-prevent="true"
        >
          
          {/* Key Facts Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">
                Estimated Value
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {tender.value}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">
                EMD Amount
              </span>
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200">
                {tender.emdAmount?.split(' ')[0]} {tender.emdAmount?.split(' ')[1] || ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">
                Published Date
              </span>
              <span className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                {tender.published}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">
                Closing Deadline
              </span>
              <span className="text-xs sm:text-[13px] font-semibold text-rose-600 dark:text-rose-400">
                {tender.closes}
              </span>
            </div>
          </div>

          {/* Ministry & Location Information */}
          <div className="space-y-2 p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  {tender.ministry}
                </span>
                <span className="text-slate-600 dark:text-slate-300 text-xs">
                  {tender.department}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-blue-100/80 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Location: {tender.location}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Scope of Work & Description
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
              {tender.description}
            </p>
          </div>

          {/* Compliance & Eligibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>AI Compliance Rating</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {tender.complianceScore}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Verified against GFR 2017 & GeM Norms
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${tender.complianceScore}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-400 mb-1">
                <Award className="w-4 h-4" />
                <span>Make In India Local Content</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                {tender.minLocalContent}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Bid Type: {tender.bidType}
              </span>
            </div>
          </div>

          {/* Quick AI Verification Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#073567] dark:bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Verify Bid Qualification for {tender.referenceNo}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  Pre-screen your bidder documents against this tender's GFR 2017 & MII local content rules.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (!isAuthenticated) {
                  navigate('/login', {
                    state: { redirectTo: `/verification?tenderId=${tender.id}` },
                  });
                } else {
                  navigate(`/verification?tenderId=${tender.id}`);
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#073567] hover:bg-[#05284f] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition shrink-0 cursor-pointer"
            >
              <span>Verify This Tender</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Eligibility Criteria */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Bidder Eligibility Criteria
            </h4>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span>{tender.eligibility}</span>
              </div>
            </div>
          </div>

          {/* Official Tender Documents */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Tender Documents & BOQ
            </h4>
            <div className="space-y-1.5">
              {tender.documents?.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-blue-400 transition group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {doc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({doc.size})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Downloading verified document: ${doc.name}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {!isClosed ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (!isAuthenticated) {
                    navigate('/login', {
                      state: { redirectTo: `/verification?tenderId=${tender.id}` },
                    });
                  } else {
                    navigate(`/verification?tenderId=${tender.id}`);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#073567] hover:bg-[#05284f] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition hover:scale-[1.02] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Apply for this tender</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 select-none">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Tender Closed &bull; Verification Unavailable</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TenderDetailModal;
