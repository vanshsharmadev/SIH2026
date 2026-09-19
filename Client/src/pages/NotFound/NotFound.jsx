import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileQuestion,
  Home,
  FileSpreadsheet,
  ShieldCheck,
  ArrowLeft,
  Headphones,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context';
import { isOfficerUser } from '../../utils/roleUtils';

const NotFound = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isOfficer = isAuthenticated && isOfficerUser(user);

  const homeDestination = isAuthenticated
    ? isOfficer
      ? '/dashboard'
      : '/bidder-dashboard'
    : '/';

  return (
    <main
      className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300"
      aria-labelledby="not-found-title"
    >
      <div className="w-full max-w-xl text-center space-y-6">
        {/* Tricolor Accent Bar */}
        <div className="flex justify-center mb-2">
          <div className="flex h-1.5 w-24 rounded-full overflow-hidden shadow-xs">
            <span className="w-1/3 bg-[#FF9933]" />
            <span className="w-1/3 bg-white border-y border-slate-200" />
            <span className="w-1/3 bg-[#138808]" />
          </div>
        </div>

        {/* Icon & 404 Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-[#073567] dark:text-[#4da3ff] shadow-lg shadow-blue-500/10">
            <FileQuestion className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <span className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-[#073567] dark:bg-[#4da3ff] text-white dark:text-slate-950 text-xs font-black tracking-wider uppercase shadow-sm">
            404
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 pt-2">
          <h1
            id="not-found-title"
            className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Page Not Found
          </h1>
          <p className="text-sm font-semibold text-[#073567] dark:text-[#4da3ff]">
            पृष्ठ नहीं मिला • GeM Procurement Record Not Located
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed pt-1">
            The procurement docket, compliance form, or portal page you requested does not exist or has been relocated to an archived registry.
          </p>
        </div>

        {/* Primary Recovery Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to={homeDestination}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#073567] hover:bg-[#05284f] dark:bg-[#4da3ff] dark:hover:bg-blue-600 text-white dark:text-slate-950 text-xs font-bold transition shadow-md shadow-blue-900/20 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{isAuthenticated ? 'Return to Safe Dashboard' : 'Return to Home'}</span>
          </Link>

          <Link
            to="/tenders"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-[#073567] dark:text-[#4da3ff] hover:bg-blue-100 dark:hover:bg-blue-950 text-xs font-bold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Browse Tenders</span>
          </Link>
        </div>

        {/* Helpdesk Notice */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Headphones className="w-4 h-4 text-slate-400" />
            <span>Need assistance? Contact GeM Helpdesk:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">1800-419-3436</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Government e-Marketplace &bull; Compliflix AI Compliance Suite
          </p>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
