import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { isTenderClosed } from '../../utils';
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  Tag,
  ShieldCheck,
  ArrowRight,
  FileText,
  Lock,
} from 'lucide-react';

const TenderCard = ({ tender, onViewDetails }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isClosed = isTenderClosed(tender);
  const isClosingSoon = tender.status === 'Closing Soon';
  const isEvaluation = tender.status === 'Under Evaluation';

  const handleVerify = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', {
        state: { redirectTo: `/verification?tenderId=${tender.id}` },
      });
    } else {
      navigate(`/verification?tenderId=${tender.id}`);
    }
  };

  return (
    <div
      onClick={() => onViewDetails && onViewDetails(tender)}
      className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top Header Row: Ref No + Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
            {tender.referenceNo}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs ${
                isClosingSoon
                  ? 'bg-amber-500'
                  : isEvaluation
                  ? 'bg-purple-600'
                  : 'bg-emerald-600'
              }`}
            >
              {tender.status}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm sm:text-base leading-snug text-slate-900 dark:text-white group-hover:text-[#073567] dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2.5">
          {tender.title}
        </h3>

        {/* Ministry & Location */}
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
          <div className="flex items-start gap-1.5">
            <Building2 className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
            <span className="truncate">{tender.ministry}</span>
          </div>
          {tender.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{tender.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Metadata + Value + Action */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Ends in {tender.daysLeft}</span>
          </div>
          {tender.complianceScore && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{tender.complianceScore}% Compliant</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase tracking-wider font-semibold">
              Tender Value
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {tender.value}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isClosed && (
              <button
                type="button"
                onClick={handleVerify}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-[#073567] dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-xs font-semibold transition cursor-pointer"
                title="Run AI Bid Verification for this Tender"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Verify</span>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails && onViewDetails(tender);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#073567] hover:bg-[#05284f] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs group-hover:shadow-sm transition-all"
            >
              <span>Details</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderCard;

