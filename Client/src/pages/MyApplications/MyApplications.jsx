import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  UploadCloud,
  Send,
  Building2,
  MessageSquare,
  ShieldCheck,
  Award,
  Search,
  Filter,
  Paperclip,
  Check,
  Briefcase,
  Layers,
  ArrowRight,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context';
import { getUserDisplayName } from '../../utils/roleUtils';

const APPLICATIONS_DATA = [
  {
    id: 'APP-2026-9401',
    tenderId: 'GEM/2026/B/9401',
    rawTenderId: '1',
    title: 'Supply, Installation of AI Edge Computing Servers',
    company: 'Ministry of Electronics & Information Technology (MeitY)',
    appliedDate: "Applied on 2 Aug' 26",
    matchStatus: 'Strong',
    matchScore: 96,
    matchColor: 'text-emerald-600 dark:text-emerald-400',
    applicantsCount: 14,
    status: 'Under Evaluation',
    statusCategory: 'under_eval',
    statusBadgeColor: 'border-amber-300 bg-amber-50/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
    quotedAmount: '₹ 17,80,00,000',
    hasClarification: false,
    chatEnabled: true,
    documents: [
      { name: 'Technical_Proposal_AI_Edge.pdf', size: '3.4 MB', status: 'Verified', date: '02 Aug 2026' },
      { name: 'BOQ_Price_Schedule.xlsx', size: '512 KB', status: 'Verified', date: '02 Aug 2026' },
      { name: 'GFR_144xi_Land_Border_Declaration.pdf', size: '420 KB', status: 'Compliant', date: '02 Aug 2026' },
      { name: 'Make_In_India_Class_I_Local_Content.pdf', size: '680 KB', status: 'Verified (62%)', date: '02 Aug 2026' },
      { name: 'MSME_Udyam_Registration.pdf', size: '1.1 MB', status: 'EMD Exempted', date: '02 Aug 2026' },
    ],
    feedbackDetails: {
      summary: 'Your technical specifications exceed the minimum tier-3 datacenter requirement. Land Border Rule 144(xi) and Make in India local content thresholds have been 100% verified by autonomous evaluation.',
      criteria: [
        { name: 'Rule 144(xi) Land Border Requirement', passed: true, score: '100% Passed' },
        { name: 'PPP-MII 2017 Local Content (>=50%)', passed: true, score: '62% (Class-I Supplier)' },
        { name: 'MSME EMD Benefit', passed: true, score: 'Exempted (Udyam Verified)' },
        { name: 'DSC Class 3 Digital Certificate', passed: true, score: 'Valid & Timestamped' },
      ],
    },
  },
  {
    id: 'APP-2026-9385',
    tenderId: 'GEM/2026/B/9385',
    rawTenderId: '2',
    title: 'Turnkey EPC for 50MW Grid-Connected Rooftop Solar PV Systems',
    company: 'Solar Energy Corporation of India (SECI)',
    appliedDate: "Applied on 28 Aug' 26",
    matchStatus: 'Strong',
    matchScore: 92,
    matchColor: 'text-emerald-600 dark:text-emerald-400',
    applicantsCount: 8,
    status: 'Technically Qualified',
    statusCategory: 'qualified',
    statusBadgeColor: 'border-emerald-300 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700',
    quotedAmount: '₹ 41,20,00,000',
    hasClarification: false,
    chatEnabled: true,
    documents: [
      { name: 'Solar_EPC_Engineering_Plan.pdf', size: '4.8 MB', status: 'Verified', date: '28 Aug 2026' },
      { name: 'Financial_Bid_BOQ_Seci.xlsx', size: '620 KB', status: 'Verified', date: '28 Aug 2026' },
      { name: 'Land_Border_Rule144_Affidavit.pdf', size: '390 KB', status: 'Compliant', date: '28 Aug 2026' },
      { name: 'MII_Auditor_Local_Content_Audit.pdf', size: '890 KB', status: 'Verified (74%)', date: '28 Aug 2026' },
    ],
    feedbackDetails: {
      summary: 'Shortlisted for financial bid opening. High technical score awarded for Tier-1 solar cell sourcing and indigenous inverter compliance.',
      criteria: [
        { name: 'Rule 144(xi) Land Border Requirement', passed: true, score: 'Compliant' },
        { name: 'PPP-MII 2017 Local Content', passed: true, score: '74% Local Content' },
        { name: 'Turnover Criteria (Rule 173)', passed: true, score: 'Audited Balance Sheets Verified' },
      ],
    },
  },
  {
    id: 'APP-2026-5123',
    tenderId: 'GEM/2024/B/5123982',
    rawTenderId: '1',
    title: 'IT Hardware Procurement & Network Infrastructure Setup',
    company: 'Ministry of Railways (CRIS)',
    appliedDate: "Applied on 15 Aug' 26",
    matchStatus: 'Action Needed',
    matchScore: 84,
    matchColor: 'text-amber-600 dark:text-amber-400',
    applicantsCount: 22,
    status: 'Clarification Requested',
    statusCategory: 'clarification',
    statusBadgeColor: 'border-blue-400 bg-blue-50/70 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-600',
    quotedAmount: '₹ 8,40,00,000',
    hasClarification: true,
    clarificationMsg: 'Tender committee requested signed Annexure-B for DSC timestamping within 48 hours.',
    chatEnabled: true,
    documents: [
      { name: 'Network_Hardware_Specs.pdf', size: '2.4 MB', status: 'Verified', date: '15 Aug 2026' },
      { name: 'Financial_Schedule_Railways.xlsx', size: '410 KB', status: 'Verified', date: '15 Aug 2026' },
      { name: 'Annexure_B_Timestamp_Clarification.pdf', size: 'Pending Upload', status: 'Action Needed', date: 'Pending' },
    ],
    feedbackDetails: {
      summary: 'Technical documents are largely compliant, but DSC timestamping verification requires updated Annexure-B confirmation before technical qualification.',
      criteria: [
        { name: 'Rule 144(xi) Land Border Requirement', passed: true, score: 'Compliant' },
        { name: 'Clause 4.2 DSC Verification', passed: false, score: 'Pending Resubmission' },
        { name: 'MSME EMD Benefit', passed: true, score: 'MSE Exempted' },
      ],
    },
  },
  {
    id: 'APP-2026-4412',
    tenderId: 'GEM/2024/B/5123985',
    rawTenderId: '2',
    title: 'Smart Classroom Setup & Interactive Display Boards',
    company: 'Ministry of Education',
    appliedDate: "Applied on 10 Jul' 26",
    matchStatus: 'Strong',
    matchScore: 98,
    matchColor: 'text-emerald-600 dark:text-emerald-400',
    applicantsCount: 18,
    status: 'Awarded & Finalized',
    statusCategory: 'qualified',
    statusBadgeColor: 'border-emerald-400 bg-emerald-100/70 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700',
    quotedAmount: '₹ 5,60,00,000',
    hasClarification: false,
    chatEnabled: true,
    documents: [
      { name: 'Education_Board_Specs.pdf', size: '1.9 MB', status: 'Verified', date: '10 Jul 2026' },
      { name: 'BOQ_SmartClassroom.xlsx', size: '380 KB', status: 'Verified', date: '10 Jul 2026' },
      { name: 'Award_Contract_Confirmation.pdf', size: '1.2 MB', status: 'Contract Signed', date: '18 Jul 2026' },
    ],
    feedbackDetails: {
      summary: 'Contract awarded. Purchase Order generated and dispatched through GeM procurement engine.',
      criteria: [
        { name: 'All GFR Compliance Checks', passed: true, score: '100% Verified' },
        { name: 'L1 Price Matching Verification', passed: true, score: 'L1 Bidder' },
      ],
    },
  },
];

const MyApplications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = getUserDisplayName(user);

  const [activeFeedbackModal, setActiveFeedbackModal] = useState(null);
  const [activeDocModal, setActiveDocModal] = useState(null);
  const [activeChatModal, setActiveChatModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'under_eval' | 'qualified' | 'clarification'
  const [isStuck, setIsStuck] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Detect when user scrolls past header section to activate sticky search bar styling
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setIsStuck(scrollY > 180);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (window.lenis) {
      window.lenis.on('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (window.lenis) {
        window.lenis.off('scroll', handleScroll);
      }
    };
  }, []);
  const [chatLog, setChatLog] = useState([
    {
      sender: 'officer',
      name: 'GeM Procurement Evaluating Committee',
      text: 'Greetings. Your technical bid has been indexed. Please ensure all uploaded DSC certificates remain valid throughout the evaluation cycle.',
      time: '10:30 AM',
    },
  ]);

  // Lock background scroll, pause Lenis, and handle ESC key when any modal is open
  useEffect(() => {
    const isAnyModalOpen = activeFeedbackModal || activeDocModal || activeChatModal;
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    if (window.lenis) {
      window.lenis.stop();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveFeedbackModal(null);
        setActiveDocModal(null);
        setActiveChatModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      if (window.lenis) {
        window.lenis.start();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFeedbackModal, activeDocModal, activeChatModal]);

  // Load locally submitted bidder applications from localStorage (from Verification submission)
  const [localApplications, setLocalApplications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gem_bidder_applications') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const apps = JSON.parse(localStorage.getItem('gem_bidder_applications') || '[]');
        setLocalApplications(apps);
      } catch (err) {}
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
    };
  }, []);

  const allApplications = useMemo(() => {
    const localTenderIds = new Set(localApplications.map((a) => a.tenderId));
    const remainingBase = APPLICATIONS_DATA.filter((a) => !localTenderIds.has(a.tenderId));
    return [...localApplications, ...remainingBase];
  }, [localApplications]);

  const filteredApplications = useMemo(() => {
    return allApplications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.title.toLowerCase().includes(q) ||
        app.tenderId.toLowerCase().includes(q) ||
        app.company.toLowerCase().includes(q);

      const matchesFilter =
        filterCategory === 'all' ||
        (filterCategory === 'under_eval' && app.statusCategory === 'under_eval') ||
        (filterCategory === 'qualified' && app.statusCategory === 'qualified') ||
        (filterCategory === 'clarification' && app.statusCategory === 'clarification');

      return matchesSearch && matchesFilter;
    });
  }, [allApplications, searchQuery, filterCategory]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const newMsg = {
      sender: 'bidder',
      name: displayName || 'Authorized Vendor',
      text: chatMessage.trim(),
      time: 'Just now',
    };
    setChatLog((prev) => [...prev, newMsg]);
    setChatMessage('');

    setTimeout(() => {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'officer',
          name: 'Evaluating Officer (GeM Desk)',
          text: 'Clarification received and linked to your tender submission docket.',
          time: 'Just now',
        },
      ]);
    }, 850);
  };

  const handleQuickChatPrompt = (promptText) => {
    setChatMessage(promptText);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#071322] text-[#1e293b] dark:text-[#f1f5f9] font-sans pb-24">
      <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">

        {/* ---------------- 1. TOP DUAL ACTION CARDS (Clean, proportionate & beautiful) ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Card 1: AI Bid Pre-Screening */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                AI Bid Pre-Screening
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Pre-screen your bids as many times as you want and get automated compliance feedback before submitting.
              </p>
            </div>
            <div className="mt-5">
              <Link
                to="/tenders"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#008bdc] text-[#008bdc] hover:bg-[#008bdc] hover:text-white dark:text-[#38bdf8] dark:border-[#38bdf8] dark:hover:bg-[#008bdc] dark:hover:text-white text-sm font-semibold transition cursor-pointer"
              >
                <span>Explore Tenders &amp; Pre-Check</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Document Compliance Audit */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Compliance &amp; Document Audit
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Upload your tender proposal documents and get detailed AI audit reports to ensure GFR 2017 &amp; MII compliance.
              </p>
            </div>
            <div className="mt-5">
              <Link
                to="/verification"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#008bdc] text-[#008bdc] hover:bg-[#008bdc] hover:text-white dark:text-[#38bdf8] dark:border-[#38bdf8] dark:hover:bg-[#008bdc] dark:hover:text-white text-sm font-semibold transition cursor-pointer"
              >
                <span>Get Compliance Feedback</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ---------------- 2. CENTERED SECTION TITLE ---------------- */}
        <div className="text-center my-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Applications
          </h1>
        </div>

        {/* ---------------- 3. NOTICE STRIP BANNER (Accurate GeM & GFR 2017 context) ---------------- */}
        <div className="bg-[#eaf5ff] dark:bg-blue-950/40 border border-[#b9ddff] dark:border-blue-800/60 rounded-xl px-5 sm:px-6 py-3.5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 font-normal text-center sm:text-left">
            <span>
              Officer Clarification Channel: <strong className="text-[#008bdc] dark:text-blue-400 font-semibold">✦ Active</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span>
              Bid Evaluation Boost: <strong className="text-[#008bdc] dark:text-blue-400 font-semibold">✦ Class-I Local Supplier</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span>
              AI Pre-Screening: <strong className="font-semibold text-slate-900 dark:text-white">5/5 Free</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden md:inline">|</span>
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              GeM SPV Verified Entity
            </span>
          </div>

          <Link
            to="/tenders"
            className="text-xs sm:text-sm font-semibold text-[#008bdc] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1 shrink-0 transition"
          >
            <span>✦ Apply to More Tenders &gt;</span>
          </Link>
        </div>

        {/* ---------------- 4. STICKY SEARCH & FILTER CONTROLS ---------------- */}
        <div
          style={{ top: 'var(--navbar-height, 84px)' }}
          className={`sticky z-30 pt-2.5 pb-3.5 mb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-[#f8fafc]/95 dark:bg-[#071322]/95 backdrop-blur-md transition-all duration-200 ${
            isStuck
              ? 'border-b border-slate-200/90 dark:border-slate-800/90 shadow-md dark:shadow-slate-950/60'
              : ''
          }`}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Quick Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tender name, BID ID, or ministry..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008bdc]/50 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none select-none">
              {[
                { id: 'all', label: `All (${APPLICATIONS_DATA.length})` },
                { id: 'under_eval', label: 'Under Evaluation (1)' },
                { id: 'qualified', label: 'Qualified (2)' },
                { id: 'clarification', label: 'Clarifications (1)' },
              ].map((tab) => {
                const isActive = filterCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#008bdc] text-white font-semibold shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---------------- 5. MAIN APPLICATIONS TABLE ---------------- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[880px]">
              {/* Table Header Row */}
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6 min-w-[300px]">OPPORTUNITIES</th>
                  <th className="py-3.5 px-4 min-w-[120px] text-left">MATCH</th>
                  <th className="py-3.5 px-4 min-w-[100px] text-center">APPLICANTS</th>
                  <th className="py-3.5 px-4 min-w-[180px] text-center">APPLICATION STATUS</th>
                  <th className="py-3.5 px-3 min-w-[120px] text-center">VIEW APPLICATION</th>
                  <th className="py-3.5 px-6 min-w-[140px] text-center whitespace-nowrap">OFFICER CHAT</th>
                </tr>
              </thead>

              {/* Table Body Rows */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No applications match your query</p>
                        <p className="text-xs text-slate-400 mt-1">Try searching with a different tender name or reset the active filter.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterCategory('all');
                          }}
                          className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200 transition cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Opportunities Column */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-start gap-1.5 group">
                          <Link
                            to={`/verification?tenderId=${app.rawTenderId}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-[#008bdc] dark:hover:text-blue-400 transition leading-snug"
                          >
                            {app.title}
                          </Link>
                          <ExternalLink className="w-3.5 h-3.5 text-[#008bdc] shrink-0 mt-0.5 opacity-80 group-hover:opacity-100" />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {app.company}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <span>{app.appliedDate}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            {app.tenderId}
                          </span>
                        </div>
                      </td>

                      {/* 2. Match Column */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex flex-col items-start">
                          <span className={`text-sm font-semibold ${app.matchColor}`}>
                            {app.matchStatus}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveFeedbackModal(app)}
                            className="text-xs font-semibold text-[#008bdc] dark:text-blue-400 hover:underline mt-0.5 inline-block cursor-pointer"
                          >
                            View feedback &gt;
                          </button>
                        </div>
                      </td>

                      {/* 3. Applicants Count Column */}
                      <td className="py-4 px-4 text-center align-middle">
                        <span className="text-sm font-normal text-slate-700 dark:text-slate-300">
                          {app.applicantsCount}
                        </span>
                      </td>

                      {/* 4. Application Status Column (Clean outline pill) */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <span
                          className={`inline-block px-4 py-1 rounded-full text-xs font-medium border ${app.statusBadgeColor}`}
                        >
                          {app.status}
                        </span>
                      </td>

                      {/* 5. View Application Document Icon Column */}
                      <td className="py-4 px-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => setActiveDocModal(app)}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-[#008bdc] hover:bg-sky-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="View Application Details &amp; Submitted Documents"
                          aria-label="View Application"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>

                      {/* 6. Officer Chat Button Column */}
                      <td className="py-4 px-6 text-center align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveChatModal(app)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#008bdc] text-[#008bdc] hover:bg-sky-50 dark:hover:bg-blue-950/40 text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-2xs hover:shadow-xs shrink-0 select-none"
                        >
                          <span className="text-[#008bdc] text-xs leading-none shrink-0">✦</span>
                          <span className="whitespace-nowrap">Start chat</span>
                          {app.hasClarification && (
                            <span className="relative flex h-2 w-2 ml-0.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------------- 6. PAGINATION & FOOTER NAVIGATION ---------------- */}
        <div className="flex items-center justify-center gap-2 mt-7 text-xs font-medium text-slate-500">
          <button
            type="button"
            className="px-2 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer disabled:opacity-40"
            disabled
          >
            &lt; Prev
          </button>

          <button
            type="button"
            className="w-6 h-6 rounded bg-[#008bdc] text-white font-bold flex items-center justify-center shadow-xs"
          >
            1
          </button>

          <button
            type="button"
            className="px-2 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer disabled:opacity-40"
            disabled
          >
            Next &gt;
          </button>
        </div>

        {/* Bottom Link */}
        <div className="text-center mt-3">
          <Link
            to="/tenders"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#008bdc] dark:hover:text-blue-400 transition"
          >
            <span>View old applications &rarr;</span>
          </Link>
        </div>

      </div>

      {/* ======================= MODALS WITH ENHANCED UX & LENIS SCROLL ISOLATION ======================= */}

      {/* 1. VIEW FEEDBACK MODAL */}
      {activeFeedbackModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overscroll-contain select-none animate-in fade-in duration-150"
          onClick={() => setActiveFeedbackModal(null)}
          data-lenis-prevent="true"
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 overscroll-contain"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent="true"
          >
            {/* Header */}
            <div className="shrink-0 bg-[#073567] dark:bg-slate-950 px-5 py-4 text-white flex items-start justify-between gap-3 border-b border-blue-900/30">
              <div>
                <span className="font-mono text-xs font-bold text-blue-200">
                  {activeFeedbackModal.tenderId}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                  AI Compliance Feedback &amp; Evaluation Audit
                </h3>
              </div>
              <button
                onClick={() => setActiveFeedbackModal(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div
              className="flex-1 min-h-0 p-5 space-y-4 overflow-y-auto overscroll-contain text-xs"
              data-lenis-prevent="true"
            >
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    Evaluation Summary
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Compliance Match: {activeFeedbackModal.matchScore}%
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  {activeFeedbackModal.feedbackDetails.summary}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-2 uppercase text-[10px] tracking-wider text-slate-400">
                  Compliance Criteria Checklist
                </h4>
                <div className="space-y-2">
                  {activeFeedbackModal.feedbackDetails.criteria.map((crit, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{crit.name}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          crit.passed
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60'
                        }`}
                      >
                        {crit.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <Link
                to={`/verification?tenderId=${activeFeedbackModal.rawTenderId}`}
                className="text-xs font-bold text-[#008bdc] hover:underline flex items-center gap-1"
              >
                <span>Open Full AI Verification Report</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setActiveFeedbackModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. VIEW APPLICATION & SUBMITTED DOCUMENTS MODAL */}
      {activeDocModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overscroll-contain select-none animate-in fade-in duration-150"
          onClick={() => setActiveDocModal(null)}
          data-lenis-prevent="true"
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 overscroll-contain"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent="true"
          >
            {/* Header */}
            <div className="shrink-0 bg-[#073567] dark:bg-slate-950 px-5 py-4 text-white flex items-start justify-between gap-3 border-b border-blue-900/30">
              <div>
                <span className="font-mono text-xs font-bold text-blue-200">
                  {activeDocModal.tenderId}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                  Submitted Application &amp; BOQ Documents
                </h3>
              </div>
              <button
                onClick={() => setActiveDocModal(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div
              className="flex-1 min-h-0 p-5 space-y-3 overflow-y-auto overscroll-contain text-xs"
              data-lenis-prevent="true"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Quoted Bid Value:</span>
                <strong className="text-slate-900 dark:text-white font-bold text-sm">
                  {activeDocModal.quotedAmount}
                </strong>
              </div>

              <div className="space-y-2 pt-1">
                {activeDocModal.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-[#008bdc] shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">Size: {doc.size} • Status: <span className="font-medium text-slate-600 dark:text-slate-300">{doc.status}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Downloading verified copy of: ${doc.name}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#008bdc] hover:underline shrink-0 cursor-pointer ml-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDocModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. OFFICER CLARIFICATION CHAT MODAL */}
      {activeChatModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overscroll-contain select-none animate-in fade-in duration-150"
          onClick={() => setActiveChatModal(null)}
          data-lenis-prevent="true"
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 overscroll-contain"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent="true"
          >
            {/* Header */}
            <div className="shrink-0 bg-[#073567] dark:bg-slate-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-blue-900/30">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Officer Clarification Chat
                  </h3>
                  <p className="text-[10px] text-blue-200 font-mono truncate max-w-[200px]">
                    {activeChatModal.tenderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveChatModal(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Clarification Prompt Helpers */}
            <div className="px-4 py-2 bg-blue-50/60 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
              <span className="text-slate-400 shrink-0 font-medium">Quick:</span>
              <button
                type="button"
                onClick={() => handleQuickChatPrompt('Uploaded signed Annexure-B DSC confirmation certificate.')}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-[#008bdc] hover:bg-blue-50 text-[10px] font-medium shrink-0 cursor-pointer"
              >
                + Submit Annexure-B
              </button>
              <button
                type="button"
                onClick={() => handleQuickChatPrompt('Request 48 hours extension for technical clarification.')}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-[10px] font-medium shrink-0 cursor-pointer"
              >
                + Request Extension
              </button>
            </div>

            {/* Chat Messages Log */}
            <div
              className="flex-1 min-h-[260px] max-h-[360px] p-4 space-y-3 overflow-y-auto overscroll-contain text-xs bg-slate-50/50 dark:bg-slate-950/40"
              data-lenis-prevent="true"
            >
              {chatLog.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'bidder' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-0.5 px-1">{msg.name}</span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed ${
                      msg.sender === 'bidder'
                        ? 'bg-[#008bdc] text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="shrink-0 p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type clarification message to Officer..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#008bdc] text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="p-2 rounded-xl bg-[#008bdc] text-white hover:bg-blue-600 disabled:opacity-40 cursor-pointer transition"
                aria-label="Send clarification"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyApplications;
