import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

const ComplianceBadge = ({ status }) => {
  switch (status?.toUpperCase()) {
    case 'COMPLIANT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Compliant
        </span>
      );
    case 'NON_COMPLIANT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
          <XCircle className="w-3.5 h-3.5" />
          Non-Compliant
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
          <Clock className="w-3.5 h-3.5" />
          Under Review
        </span>
      );
  }
};

export default ComplianceBadge;
