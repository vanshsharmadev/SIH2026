import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  FileText,
  Download,
  CheckCircle2,
  Award,
  Sparkles,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { tenderService } from '../../services';
import TenderChatbot from '../../components/tender/TenderChatbot';

const TenderDetails = () => {
  const { tenderId } = useParams();
  const navigate = useNavigate();

  const [tender, setTender] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState('details'); // 'details' | 'ai-chat'

  useEffect(() => {
    let isMounted = true;
    const fetchTender = async () => {
      setIsLoading(true);
      try {
        let found = null;
        const role = localStorage.getItem('role');
        const token = localStorage.getItem('token');

        // If officer session, try GET /api/officer/tenders/{id}
        if (role === 'OFFICER' || token) {
          try {
            found = await tenderService.getOfficerTenderById(tenderId);
          } catch (e) {
            console.warn('getOfficerTenderById fallback notice:', e);
          }
        }

        if (!found) {
          found = await tenderService.getTenderById(tenderId);
        }

        if (isMounted) {
          setTender(found || null);
        }
      } catch (err) {
        console.warn('Could not fetch tender:', err);
        if (isMounted) setTender(null);
      }
    };

    fetchTender();
    return () => {
      isMounted = false;
    };
  }, [tenderId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Sparkles className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold">Loading tender details...</p>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Tender Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested tender identifier "#{tenderId}" could not be retrieved.
        </p>
        <Link
          to="/tenders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#073567] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Tenders List</span>
        </Link>
      </div>
    );
  }

  const effectiveTenderId = String(tenderId || tender.id || tender.referenceNo);

  return (
    <div className="w-full space-y-5 py-5 animate-in fade-in duration-200 select-none">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Tender ID: <code className="font-mono font-bold text-blue-600 dark:text-blue-400">{effectiveTenderId}</code>
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AI Verified</span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveMobileTab('details')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'details'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Tender Specifications</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('ai-chat')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'ai-chat'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-emerald-500" />
          <span>🤖 Ask AI Assistant</span>
        </button>
      </div>

      {/* Main 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tender Details (7 cols) */}
        <div
          className={`space-y-5 lg:col-span-7 ${
            activeMobileTab !== 'details' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Header Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md">
                {tender.referenceNo}
              </span>
              <div className="flex items-center gap-2">
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
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Ends in {tender.daysLeft}</span>
                </span>
              </div>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {tender.title}
            </h1>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{tender.ministry}</p>
                  <p className="text-[11px] text-slate-500">{tender.department}</p>
                </div>
              </div>
              {tender.location && (
                <div className="flex items-center gap-2 pt-1">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Location: {tender.location}</span>
                </div>
              )}
            </div>

            {/* Metric Strips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Est. Value
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {tender.value}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  EMD Amount
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {tender.emdAmount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Published
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {tender.published}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Deadline
                </span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                  {tender.closes}
                </span>
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scope of Work & Requirements
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
              {tender.description}
            </p>
          </div>

          {/* Statutory Criteria & Policies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Tender Compliance Criteria</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {Array.isArray(tender.eligibilityCriteria) ? tender.eligibilityCriteria.length : 5} Mandatory Rules
              </p>
              <p className="text-[11px] text-slate-500">
                Source of requirements for bidder eligibility under GFR 2017 &amp; GeM GTC.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-400">
                <Award className="w-4 h-4" />
                <span>Make In India Local Content</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {tender.minLocalContent}
              </p>
              <p className="text-[11px] text-slate-500">
                Preference policy for Class-I suppliers.
              </p>
            </div>
          </div>

          {/* Bidder Eligibility Criteria */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Bidder Eligibility Requirements
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                SOURCE: TENDER
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{tender.eligibility}</span>
            </div>
          </div>

          {/* Official Tender Documents */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Tender Documents &amp; BOQ
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                SOURCE: TENDER
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              These documents are uploaded by the Procurement Officer and define what a bidder needs to satisfy.
            </p>
            <div className="space-y-2">
              {tender.documents?.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-400 transition"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {doc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">({doc.size})</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                      Tender Doc
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Downloading verified document: ${doc.name}`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#073567] to-indigo-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <h3 className="text-sm font-bold">Ready to apply for this tender?</h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Run pre-screening verification and submit your bid package.
              </p>
            </div>
            <Link
              to={`/tenders?tenderId=${effectiveTenderId}&tab=compliance`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition hover:scale-105 shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Compliance &amp; Apply</span>
            </Link>
          </div>
        </div>

        {/* Right Column: AI Tender Assistant (5 cols) */}
        <div
          className={`lg:col-span-5 sticky top-6 ${
            activeMobileTab !== 'ai-chat' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="h-[680px] max-h-[88vh] rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <TenderChatbot
              tenderId={effectiveTenderId}
              tenderTitle={tender.title}
              tenderRef={tender.referenceNo}
              isEmbedded={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderDetails;
