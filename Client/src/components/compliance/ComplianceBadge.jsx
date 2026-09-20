import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

const ComplianceBadge = ({ status }) => {
  const norm = String(status || '').toUpperCase().trim().replace(/\s+/g, '_');
  switch (norm) {
    case 'COMPLIANT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/80">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Compliant
        </span>
      );
    case 'PARTIALLY_COMPLIANT':
    case 'PARTIALLY-COMPLIANT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/80">
          <AlertTriangle className="w-3.5 h-3.5" />
          Partially Compliant
        </span>
      );
    case 'NON_COMPLIANT':
    case 'NON-COMPLIANT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 dark:border dark:border-rose-800/80">
          <XCircle className="w-3.5 h-3.5" />
          Non-Compliant
        </span>
      );
    case 'MISSING':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
          <XCircle className="w-3.5 h-3.5" />
          Missing
        </span>
      );
    case 'FLAGGED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5" />
          Flagged
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5" />
          Under Review
        </span>
      );
  }
};

export default ComplianceBadge;
