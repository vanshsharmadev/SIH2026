import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import {
  Search,
  X,
  Filter,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  FileText,
  MessageSquare,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Users,
  IndianRupee,
  Paperclip,
  Send,
  Check,
  RotateCcw,
  Info,
  Copy,
  CheckCheck,
  FileSpreadsheet,
  Eye,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  SlidersHorizontal,
  Briefcase,
  Shield,
  FileCheck,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../context';
import { getUserDisplayName, isOfficerUser } from '../../utils/roleUtils';

// Dynamic applications dataset (empty baseline; loaded from real user bids)
const APPLICATIONS_DATA = [];

const MyApplications = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Strict Guards: Commercial Bidders only; Officers must NEVER see bidder applications
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/my-applications" replace />;
  }
  if (isOfficerUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  const displayName = getUserDisplayName(user);

  // Modals state
  const [activeFeedbackModal, setActiveFeedbackModal] = useState(null);
  const [activeDocModal, setActiveDocModal] = useState(null);
  const [activeChatModal, setActiveChatModal] = useState(null);
  const [withdrawModalApp, setWithdrawModalApp] = useState(null);
  const [kebabMenuOpenId, setKebabMenuOpenId] = useState(null);
  const [copiedBidId, setCopiedBidId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'under_eval' | 'qualified' | 'clarification' | 'awarded'
  const [ministryFilter, setMinistryFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all'); // 'all' | '90+' | '75-89' | 'under75'
  const [actionRequiredOnly, setActionRequiredOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'score' | 'status' | 'deadline'
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewArchived, setViewArchived] = useState(false);

  // Chat message state
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);

  // Load dynamically submitted bidder applications from localStorage
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

  // Merge static applications with any locally created submissions
  const allApplications = useMemo(() => {
    const localTenderIds = new Set(localApplications.map((a) => a.tenderId));
    const remainingBase = APPLICATIONS_DATA.filter((a) => !localTenderIds.has(a.tenderId));
    return [...localApplications, ...remainingBase];
  }, [localApplications]);

  // Compute status summary metrics
  const metrics = useMemo(() => {
    const total = allApplications.length;
    const underEval = allApplications.filter((a) => a.statusCategory === 'under_eval').length;
    const qualified = allApplications.filter((a) => a.statusCategory === 'qualified').length;
    const clarification = allApplications.filter((a) => a.statusCategory === 'clarification' || a.hasClarification).length;
    const awarded = allApplications.filter((a) => a.statusCategory === 'awarded').length;
    return { total, underEval, qualified, clarification, awarded };
  }, [allApplications]);

  // Check if any application requires immediate bidder clarification
  const pendingClarificationApp = useMemo(() => {
    return allApplications.find((a) => a.hasClarification || a.statusCategory === 'clarification');
  }, [allApplications]);

  // Available ministries for filter dropdown
  const availableMinistries = useMemo(() => {
    const list = Array.from(new Set(allApplications.map((a) => a.company)));
    return list.sort();
  }, [allApplications]);

  // Count active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (ministryFilter !== 'all') count++;
    if (scoreFilter !== 'all') count++;
    if (actionRequiredOnly) count++;
    return count;
  }, [ministryFilter, scoreFilter, actionRequiredOnly]);

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    return allApplications
      .filter((app) => {
        // Search filter
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          app.title.toLowerCase().includes(q) ||
          app.tenderId.toLowerCase().includes(q) ||
          app.company.toLowerCase().includes(q);

        // Status tab filter
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'under_eval' && app.statusCategory === 'under_eval') ||
          (statusFilter === 'qualified' && app.statusCategory === 'qualified') ||
          (statusFilter === 'clarification' && (app.statusCategory === 'clarification' || app.hasClarification)) ||
          (statusFilter === 'awarded' && app.statusCategory === 'awarded');

        // Ministry filter
        const matchesMinistry = ministryFilter === 'all' || app.company === ministryFilter;

        // Score filter
        let matchesScore = true;
        if (scoreFilter === '90+') matchesScore = app.matchScore >= 90;
        else if (scoreFilter === '75-89') matchesScore = app.matchScore >= 75 && app.matchScore < 90;
        else if (scoreFilter === 'under75') matchesScore = app.matchScore < 75;

        // Action required toggle
        const matchesAction = !actionRequiredOnly || app.hasClarification || app.statusCategory === 'clarification';

        return matchesSearch && matchesStatus && matchesMinistry && matchesScore && matchesAction;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.matchScore - a.matchScore;
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        if (sortBy === 'deadline') return new Date(a.deadline || 0) - new Date(b.deadline || 0);
        // Default 'recent': clarification first, then tender ID reverse
        if (a.hasClarification && !b.hasClarification) return -1;
        if (!a.hasClarification && b.hasClarification) return 1;
        return b.id.localeCompare(a.id);
      });
  }, [allApplications, searchQuery, statusFilter, ministryFilter, scoreFilter, actionRequiredOnly, sortBy]);

  // Pagination slice
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(start, start + itemsPerPage);
  }, [filteredApplications, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage));

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, ministryFilter, scoreFilter, actionRequiredOnly, sortBy]);

  // Lock background scroll when any modal is open
  useEffect(() => {
    const isModalOpen =
      activeFeedbackModal || activeDocModal || activeChatModal || withdrawModalApp || isFilterDrawerOpen;
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveFeedbackModal(null);
        setActiveDocModal(null);
        setActiveChatModal(null);
        setWithdrawModalApp(null);
        setIsFilterDrawerOpen(false);
        setKebabMenuOpenId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFeedbackModal, activeDocModal, activeChatModal, withdrawModalApp, isFilterDrawerOpen]);

  // Close kebab menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setKebabMenuOpenId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyBidId = (tenderId) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tenderId);
      setCopiedBidId(tenderId);
      showToast(`Copied ${tenderId} to clipboard`);
      setTimeout(() => setCopiedBidId(null), 2000);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const newMsg = {
      sender: 'bidder',
      name: displayName || 'Authorized Signatory',
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
          text: 'Acknowledged. Your clarification and annexures have been logged into the tamper-evident audit record.',
          time: 'Just now',
        },
      ]);
    }, 900);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setMinistryFilter('all');
    setScoreFilter('all');
    setActionRequiredOnly(false);
    setSortBy('recent');
    setIsFilterDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#181818] text-[#1E293B] dark:text-[#eeeeee] font-sans pb-20 select-none">
      
      {/* ─────────────────────────────────────────────────────────────
          1. BREADCRUMB & CONTEXT BANNER
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#181818] border-b border-slate-200/80 dark:border-[#303030]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Home
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <Link to="/bidder-dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Bidder Workspace
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-semibold text-slate-900 dark:text-white" aria-current="page">
              My Applications
            </span>
          </nav>

          {/* User Organization & Trust Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Class-I Local Supplier (MII &ge; 50%)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
              <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span>GeM SPV Verified</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">

        {/* ─────────────────────────────────────────────────────────────
            2. HERO: APPLICATION TOOLS SECTION (Compact, purposeful)
        ───────────────────────────────────────────────────────────── */}
        <section aria-labelledby="tools-heading" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tool 1: AI Bid Pre-Screening */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200/90 dark:border-[#303030] bg-white dark:bg-[#181818] p-5 shadow-xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 id="tools-heading" className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        AI Bid Pre-Screening
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        ✦ Instant Pre-Check
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Pre-screen your bids as many times as you want and receive automated compliance feedback before submitting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#303030]/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Quota: <strong className="text-slate-800 dark:text-slate-200">5/5 Free checks remaining</strong></span>
                </div>
                <Link
                  to="/tenders"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-[#008BDC] text-[#008BDC] hover:bg-[#008BDC] hover:text-white dark:text-[#38BDF8] dark:border-[#38BDF8] dark:hover:bg-[#008BDC] dark:hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  <span>Explore Tenders &amp; Pre-Check</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Tool 2: Compliance & Document Audit */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200/90 dark:border-[#303030] bg-white dark:bg-[#181818] p-5 shadow-xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        Compliance &amp; Document Audit
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        GFR 2017 &amp; MII
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Upload your tender proposal documents and get detailed AI audit reports to ensure GFR 2017 &amp; MII compliance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#303030]/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Vault status: <strong className="text-slate-800 dark:text-slate-200">100% Cryptographically Verified</strong></span>
                </div>
                <Link
                  to="/verification"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-[#008BDC] text-[#008BDC] hover:bg-[#008BDC] hover:text-white dark:text-[#38BDF8] dark:border-[#38BDF8] dark:hover:bg-[#008BDC] dark:hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  <span>Get Compliance Feedback</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            3. PAGE HEADING & STATUS METRICS SUMMARY MODULE
        ───────────────────────────────────────────────────────────── */}
        <section aria-labelledby="applications-heading" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div>
              <h1 id="applications-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                My Applications
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Track your tender applications, review feedback, and respond to clarifications.
              </p>
            </div>

            {/* Quick Link to Apply to More Tenders */}
            <Link
              to="/tenders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-[#008BDC] dark:text-blue-400 text-xs font-bold transition self-start md:self-auto"
            >
              <span>✦ Apply to More Tenders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 5-Card Metric Dashboard Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Metric 1: Total */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-[#181818] border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white dark:bg-[#181818] border-slate-200 dark:border-[#303030] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Applications</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                {metrics.total}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across all departments</div>
            </button>

            {/* Metric 2: Under Evaluation */}
            <button
              type="button"
              onClick={() => setStatusFilter('under_eval')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                statusFilter === 'under_eval'
                  ? 'bg-white dark:bg-[#181818] border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white dark:bg-[#181818] border-slate-200 dark:border-[#303030] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Under Evaluation</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-300 mt-1.5">
                {metrics.underEval}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Technical scrutiny active</div>
            </button>

            {/* Metric 3: Qualified */}
            <button
              type="button"
              onClick={() => setStatusFilter('qualified')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                statusFilter === 'qualified'
                  ? 'bg-white dark:bg-[#181818] border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white dark:bg-[#181818] border-slate-200 dark:border-[#303030] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Qualified</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-300 mt-1.5">
                {metrics.qualified}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Stage 1 &amp; 2 cleared</div>
            </button>

            {/* Metric 4: Clarifications Required */}
            <button
              type="button"
              onClick={() => setStatusFilter('clarification')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
                statusFilter === 'clarification'
                  ? 'bg-white dark:bg-[#181818] border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                  : 'bg-white dark:bg-[#181818] border-slate-200 dark:border-[#303030] hover:border-slate-300'
              }`}
            >
              {metrics.clarification > 0 && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-bl" />
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                  <span>Clarifications</span>
                  {metrics.clarification > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  )}
                </span>
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-orange-900 dark:text-orange-300 mt-1.5">
                {metrics.clarification}
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                {metrics.clarification > 0 ? 'Action required (48h)' : 'None pending'}
              </div>
            </button>

            {/* Metric 5: Awarded & Finalized */}
            <button
              type="button"
              onClick={() => setStatusFilter('awarded')}
              className={`col-span-2 sm:col-span-1 p-3.5 rounded-xl border text-left transition cursor-pointer ${
                statusFilter === 'awarded'
                  ? 'bg-white dark:bg-[#181818] border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-white dark:bg-[#181818] border-slate-200 dark:border-[#303030] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Awarded</span>
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-300 mt-1.5">
                {metrics.awarded}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Purchase order issued</div>
            </button>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            4. ACTION REQUIRED CALLOUT BANNER (Only if pending item)
        ───────────────────────────────────────────────────────────── */}
        {pendingClarificationApp && (
          <div className="mb-5 rounded-xl border border-orange-300/90 dark:border-orange-900/60 bg-gradient-to-r from-orange-50 via-amber-50 to-white dark:from-orange-950/40 dark:via-amber-950/30 dark:to-[#0B192C] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300 bg-orange-200/60 dark:bg-orange-900/60 px-2 py-0.5 rounded">
                    Action Required
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                    {pendingClarificationApp.tenderId}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {pendingClarificationApp.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {pendingClarificationApp.clarificationMsg ||
                    'Evaluating Committee requested signed Annexure-B with DSC timestamping within 48 hours.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveChatModal(pendingClarificationApp)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Clarification Desk</span>
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            5. SEARCH, FILTER CHIPS & TOOLBAR
        ───────────────────────────────────────────────────────────── */}
        <section aria-label="Search and filter applications" className="mb-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tender title, GEM Bid ID, or ministry..."
                aria-label="Search applications"
                className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#181818] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008BDC]/50 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  aria-label="Clear search text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs / Segmented Controls */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {[
                { id: 'all', label: `All (${metrics.total})` },
                { id: 'under_eval', label: `Under Evaluation (${metrics.underEval})` },
                { id: 'qualified', label: `Qualified (${metrics.qualified})` },
                { id: 'clarification', label: `Clarifications (${metrics.clarification})`, alert: metrics.clarification > 0 },
                { id: 'awarded', label: `Awarded (${metrics.awarded})` },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#008BDC] text-white font-semibold shadow-xs'
                        : 'bg-white dark:bg-[#181818] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#303030] hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.alert && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filter Drawer Toggle & Sort Controls */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  activeFilterCount > 0
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-[#181818] border-slate-200 dark:border-[#303030] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
                aria-label="Open advanced filters"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#008BDC] text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Selector */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-2.5 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#181818] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#008BDC]/40 cursor-pointer appearance-none"
                  aria-label="Sort applications"
                >
                  <option value="recent">Sort: Recently Applied</option>
                  <option value="score">Sort: Match Score</option>
                  <option value="status">Sort: Application Status</option>
                  <option value="deadline">Sort: Deadline</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Collapsible Filter Panel */}
          {isFilterDrawerOpen && (
            <div className="mt-3 p-4 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#303030] shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-[#303030]">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Advanced Procurement Filters</span>
                </div>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset all filters</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Ministry Filter */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Ministry / Department
                  </label>
                  <select
                    value={ministryFilter}
                    onChange={(e) => setMinistryFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#303030] bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Ministries</option>
                    {availableMinistries.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Match Score Filter */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    AI Match Score
                  </label>
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#303030] bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Match Scores</option>
                    <option value="90+">&ge; 90% (Strong Match)</option>
                    <option value="75-89">75% - 89% (Moderate Match)</option>
                    <option value="under75">&lt; 75% (Action Recommended)</option>
                  </select>
                </div>

                {/* Quick Toggles */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Action Status
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionRequiredOnly}
                      onChange={(e) => setActionRequiredOnly(e.target.checked)}
                      className="rounded text-[#008BDC] focus:ring-[#008BDC] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Show only applications requiring clarification
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Result Count Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 px-1">
            <div>
              Showing <strong className="text-slate-800 dark:text-slate-200">{filteredApplications.length}</strong> of{' '}
              {allApplications.length} applications
              {searchQuery && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Clear all active filters
              </button>
            )}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            6. MAIN APPLICATIONS TABLE (Desktop) & CARDS (Mobile)
        ───────────────────────────────────────────────────────────── */}
        <section aria-label="Applications table" className="application-list bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] rounded-xl overflow-hidden shadow-xs">
          
          {/* DESKTOP / TABLET DATA TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              {/* Header */}
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#303030] bg-[#F8FAFC] dark:bg-[#181818] text-[11px] font-bold text-slate-600 dark:text-[#b8b8b8] uppercase tracking-wider">
                  <th className="py-3.5 px-6 min-w-[320px]">Tender Opportunity</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Match Score</th>
                  <th className="py-3.5 px-3 min-w-[90px] text-center">Applicants</th>
                  <th className="py-3.5 px-4 min-w-[170px] text-center">Status</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Last Activity</th>
                  <th className="py-3.5 px-6 min-w-[210px] text-center">Actions</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white">
                          No matching applications found
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                          Try refining your search keyword, adjusting the ministry filter, or resetting all criteria.
                        </p>
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="mt-4 px-4 py-1.5 bg-[#008BDC] text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition cursor-pointer shadow-xs"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedApplications.map((app) => {
                    const isClarification = app.hasClarification || app.statusCategory === 'clarification';
                    return (
                      <tr
                        key={app.id}
                        className={`application-item transition-colors group ${
                          isClarification
                            ? 'bg-amber-50/40 dark:bg-[#202020] border-l-4 border-l-orange-500 hover:bg-amber-50/70 dark:hover:bg-[#282828]'
                            : 'hover:bg-slate-50/80 dark:bg-[#181818] dark:hover:bg-[#282828]'
                        }`}
                      >
                        {/* Col 1: Opportunity info block */}
                        <td className="py-4 px-6 align-middle">
                          <div className="flex items-start gap-1.5">
                            <Link
                              to={`/verification?tenderId=${app.rawTenderId}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-[#008BDC] dark:hover:text-blue-400 transition leading-snug"
                            >
                              {app.title}
                            </Link>
                            <ExternalLink className="w-3.5 h-3.5 text-[#008BDC] shrink-0 mt-0.5 opacity-80 group-hover:opacity-100" />
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{app.company}</span>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {app.appliedDate}
                            </span>
                            <span>•</span>
                            <div className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              <span>{app.tenderId}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyBidId(app.tenderId)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                title="Copy GeM BID ID"
                                aria-label={`Copy ${app.tenderId}`}
                              >
                                {copiedBidId === app.tenderId ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Col 2: Match Score with visual bar & AI indicator */}
                        <td className="py-4 px-4 align-middle">
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`badge text-xs font-bold px-2 py-0.5 rounded-full ${
                                  app.matchScore >= 90
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                                    : app.matchScore >= 75
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {app.matchScore}% Match
                              </span>
                            </div>

                            {/* Score progress bar */}
                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
                              <div
                                className={`h-full rounded-full ${
                                  app.matchScore >= 90 ? 'bg-emerald-500' : app.matchScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${app.matchScore}%` }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => setActiveFeedbackModal(app)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#008BDC] dark:text-blue-400 hover:underline mt-0.5 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>AI feedback available</span>
                            </button>
                          </div>
                        </td>

                        {/* Col 3: Applicants count */}
                        <td className="py-4 px-3 text-center align-middle">
                          <div className="badge inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-[#d0d0d0] bg-slate-100 dark:bg-[#242424] px-2 py-1 rounded-md">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{app.applicantsCount}</span>
                          </div>
                        </td>

                        {/* Col 4: Status badge */}
                        <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                          {app.statusCategory === 'under_eval' && (
                            <span className="status badge inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-amber-300 bg-amber-50/80 text-amber-800 dark:bg-[#242424] dark:text-[#f0a429] dark:border-amber-800/60">
                              <Clock className="w-3 h-3" />
                              <span>Under Evaluation</span>
                            </span>
                          )}
                          {app.statusCategory === 'clarification' && (
                            <span className="status badge inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-blue-400 bg-blue-50 text-blue-800 dark:bg-[#242424] dark:text-[#4da3ff] dark:border-blue-800/60 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              <span>Clarification Requested</span>
                            </span>
                          )}
                          {app.statusCategory === 'qualified' && (
                            <span className="status badge inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-[#242424] dark:text-[#38d39f] dark:border-emerald-800/60">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Technically Qualified</span>
                            </span>
                          )}
                          {app.statusCategory === 'awarded' && (
                            <span className="status badge inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400 bg-emerald-100/70 text-emerald-900 dark:bg-[#242424] dark:text-[#38d39f] dark:border-emerald-800/60">
                              <Award className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                              <span>Awarded &amp; Finalized</span>
                            </span>
                          )}
                        </td>

                        {/* Col 5: Last Activity */}
                        <td className="py-4 px-4 align-middle">
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {app.lastActivity}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Quoted: <span className="font-semibold text-slate-600 dark:text-slate-300">{app.quotedAmount}</span>
                          </div>
                        </td>

                        {/* Col 6: Row Actions & Kebab Menu */}
                        <td className="py-4 px-6 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* Primary Action: View Application */}
                            <button
                              type="button"
                              onClick={() => setActiveDocModal(app)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
                              title="View submitted proposal &amp; attachments"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>View Application</span>
                            </button>

                            {/* Action 2: Clarification Desk / Start Chat */}
                            <button
                              type="button"
                              onClick={() => setActiveChatModal(app)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs ${
                                isClarification
                                  ? 'bg-orange-600 hover:bg-orange-700 text-white font-bold'
                                  : 'border border-[#008BDC] text-[#008BDC] hover:bg-blue-50 dark:hover:bg-blue-950/40'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{isClarification ? 'Respond' : 'Start Chat'}</span>
                              {isClarification && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              )}
                            </button>

                            {/* Kebab Menu Button */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKebabMenuOpenId(kebabMenuOpenId === app.id ? null : app.id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                                aria-label="More actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {kebabMenuOpenId === app.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#303030] shadow-lg py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDocModal(app);
                                      setKebabMenuOpenId(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Download Submission Dossier</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveFeedbackModal(app);
                                      setKebabMenuOpenId(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                    <span>View AI Compliance Audit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleCopyBidId(app.tenderId);
                                      setKebabMenuOpenId(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copy GeM Bid ID</span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-[#303030]" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWithdrawModalApp(app);
                                      setKebabMenuOpenId(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Withdraw Application</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE CARDS (< 768px) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredApplications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-800 dark:text-white text-sm">No applications found</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting search filters.</p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-3 px-3 py-1.5 bg-[#008BDC] text-white text-xs font-semibold rounded-lg"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              paginatedApplications.map((app) => {
                const isClarification = app.hasClarification || app.statusCategory === 'clarification';
                return (
                  <article
                    key={app.id}
                    className={`application-item p-4 transition border-b dark:border-[#303030] dark:bg-[#202020] hover:dark:bg-[#282828] ${
                      isClarification ? 'bg-amber-50/50 dark:bg-[#242018] border-l-4 border-l-orange-500' : ''
                    }`}
                  >
                    {/* Header: Title & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/verification?tenderId=${app.rawTenderId}`}
                        className="font-bold text-sm text-slate-900 dark:text-white leading-snug"
                      >
                        {app.title}
                      </Link>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          app.matchScore >= 90
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {app.matchScore}%
                      </span>
                    </div>

                    {/* Ministry */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{app.company}</span>
                    </div>

                    {/* Status & Applied date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-[#303030]">
                      <div>
                        {app.statusCategory === 'under_eval' && (
                          <span className="status badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 dark:bg-[#242424] dark:text-[#f0a429] dark:border-amber-800/60">
                            <Clock className="w-3 h-3" />
                            <span>Under Evaluation</span>
                          </span>
                        )}
                        {app.statusCategory === 'clarification' && (
                          <span className="status badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-400 dark:bg-[#242424] dark:text-[#4da3ff] dark:border-blue-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span>Clarification Requested</span>
                          </span>
                        )}
                        {app.statusCategory === 'qualified' && (
                          <span className="status badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-[#242424] dark:text-[#38d39f] dark:border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Qualified</span>
                          </span>
                        )}
                        {app.statusCategory === 'awarded' && (
                          <span className="status badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-400 dark:bg-[#242424] dark:text-[#38d39f] dark:border-emerald-800/60">
                            <Award className="w-3 h-3" />
                            <span>Awarded</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {app.tenderId}
                      </div>
                    </div>

                    {/* Secondary metadata */}
                    <div className="metadata grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-[#d0d0d0] mt-2 bg-slate-50 dark:bg-[#242424] p-2 rounded-lg">
                      <div>
                        <span>Applied: </span>
                        <strong className="text-slate-700 dark:text-slate-300">{app.appliedDate}</strong>
                      </div>
                      <div>
                        <span>Quoted: </span>
                        <strong className="text-slate-700 dark:text-slate-300">{app.quotedAmount}</strong>
                      </div>
                      <div className="col-span-2">
                        <span>Milestone: </span>
                        <strong className="text-slate-700 dark:text-slate-300">{app.lastActivity}</strong>
                      </div>
                    </div>

                    {/* Action buttons (>= 44px touch targets) */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setActiveDocModal(app)}
                        className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>View Application</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveChatModal(app)}
                        className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${
                          isClarification
                            ? 'bg-orange-600 text-white'
                            : 'border border-[#008BDC] text-[#008BDC] bg-sky-50/50'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{isClarification ? 'Respond' : 'Officer Chat'}</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            7. PAGINATION & FOOTER CONTROLS
        ───────────────────────────────────────────────────────────── */}
        <section aria-label="Pagination controls" className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          {/* Results per page */}
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 rounded border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#181818] text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#181818] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  currentPage === p
                    ? 'bg-[#008BDC] text-white shadow-xs'
                    : 'border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#181818] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
                aria-current={currentPage === p ? 'page' : undefined}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#181818] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Secondary Link */}
          <button
            type="button"
            onClick={() => {
              setViewArchived((prev) => !prev);
              showToast(viewArchived ? 'Showing active tender cycle' : 'Archived 2024-2025 tenders loaded');
            }}
            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#008BDC] hover:underline cursor-pointer"
          >
            <span>{viewArchived ? '← View Active Applications' : 'View old applications →'}</span>
          </button>
        </section>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          8. INTERACTIVE MODAL DIALOGS
      ───────────────────────────────────────────────────────────── */}

      {/* MODAL 1: VIEW APPLICATION DOSSIER & DOCUMENTS */}
      {activeDocModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm select-none animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="doc-modal-title"
          onClick={() => setActiveDocModal(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#303030] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#303030] bg-[#F8FAFC] dark:bg-[#181818] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="doc-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Application Dossier &amp; Submitted Documents
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-mono font-semibold">{activeDocModal.tenderId}</span>
                    <span>•</span>
                    <span>{activeDocModal.company}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-[#303030] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Quoted Bid Value:</span>
                  <div className="font-bold text-slate-900 dark:text-white text-base">
                    {activeDocModal.quotedAmount}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Application Status:</span>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {activeDocModal.status}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Submission Timestamp:</span>
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    {activeDocModal.appliedDate}
                  </div>
                </div>
              </div>

              {/* Document list */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Uploaded Verification Credentials ({activeDocModal.documents?.length || 0})
                </h4>
                <div className="space-y-2">
                  {activeDocModal.documents?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#202020] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {doc.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span>{doc.date}</span>
                            {doc.hash && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-400">{doc.hash}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                          {doc.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => showToast(`Downloading ${doc.name}...`)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Download document copy"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-[#303030] bg-[#F8FAFC] dark:bg-[#181818] flex items-center justify-between text-xs">
              <span className="text-slate-500">Government of India • GeM Cryptographic Vault</span>
              <button
                type="button"
                onClick={() => setActiveDocModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 font-semibold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AI COMPLIANCE FEEDBACK MODAL */}
      {activeFeedbackModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm select-none animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
          onClick={() => setActiveFeedbackModal(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#303030] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#303030] bg-[#F8FAFC] dark:bg-[#181818] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="feedback-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    AI Bid Compliance &amp; Eligibility Audit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeFeedbackModal.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveFeedbackModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Score card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Autonomous Match Rating
                  </span>
                  <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {activeFeedbackModal.matchScore}% High Alignment
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 max-w-sm">
                    Evaluated against General Financial Rules (GFR 2017) and tender specific BOQ clauses.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-white dark:bg-slate-900 font-bold text-emerald-600 text-lg shadow-xs">
                  {activeFeedbackModal.matchScore}%
                </div>
              </div>

              {/* Summary note */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-[#303030]">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Executive Evaluation Summary
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {activeFeedbackModal.feedbackDetails?.summary}
                </p>
              </div>

              {/* Criteria list */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Statutory Rule Checklist
                </h4>
                <div className="space-y-2">
                  {activeFeedbackModal.feedbackDetails?.criteria?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-[#303030] bg-white dark:bg-[#202020] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {item.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {item.name}
                        </span>
                      </div>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          item.passed
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official disclaimer */}
              <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                <strong>Statutory Notice: </strong>
                AI pre-screening scoring is an automated evaluative aid. Formal technical qualification and commercial opening remain under the jurisdiction of the designated Tender Committee.
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-[#303030] bg-[#F8FAFC] dark:bg-[#181818] flex items-center justify-end text-xs">
              <button
                type="button"
                onClick={() => setActiveFeedbackModal(null)}
                className="px-4 py-1.5 rounded-lg bg-[#008BDC] text-white hover:bg-blue-600 font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: OFFICER CLARIFICATION DESK (Two-Way Chat) */}
      {activeChatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm select-none animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-modal-title"
          onClick={() => setActiveChatModal(null)}
        >
          <div
            className="relative w-full max-w-2xl h-[640px] max-h-[92vh] flex flex-col rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#303030] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#303030] bg-[#F8FAFC] dark:bg-[#181818] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="chat-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Officer Clarification Channel
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeChatModal.company} • {activeChatModal.tenderId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveChatModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                aria-label="Close clarification desk"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clarification Alert Header inside Chat */}
            {activeChatModal.hasClarification && (
              <div className="px-4 py-2.5 bg-orange-50 dark:bg-orange-950/40 border-b border-orange-200 dark:border-orange-800/60 text-xs text-orange-800 dark:text-orange-300 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="font-semibold">Notice: Signed Annexure-B requested within 48 hours.</span>
                </div>
                <span className="text-[11px] font-mono text-orange-600">SLA: 48h</span>
              </div>
            )}

            {/* Message Thread */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/50">
              {chatLog.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'bidder' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{msg.name}</span>
                    <span>•</span>
                    <span>{msg.time}</span>
                  </div>
                  <div
                    className={`max-w-md p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.sender === 'bidder'
                        ? 'bg-[#008BDC] text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick response chips */}
            <div className="px-4 py-2 bg-white dark:bg-[#202020] border-t border-slate-100 dark:border-[#303030] flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 text-xs">
              <span className="text-[11px] text-slate-400 font-semibold shrink-0">Quick reply:</span>
              <button
                type="button"
                onClick={() => setChatMessage('Signed Annexure-B with DSC timestamping is attached for verification.')}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap cursor-pointer"
              >
                Upload Annexure-B
              </button>
              <button
                type="button"
                onClick={() => setChatMessage('We confirm our Class-I local content meets 68% threshold.')}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap cursor-pointer"
              >
                Confirm Local Content
              </button>
              <button
                type="button"
                onClick={() => setChatMessage('Requesting 24 hours extension for OEM authorization renewal.')}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap cursor-pointer"
              >
                Request 24h Extension
              </button>
            </div>

            {/* Input form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 bg-white dark:bg-[#181818] border-t border-slate-200 dark:border-[#303030] flex items-center gap-2 shrink-0"
            >
              <button
                type="button"
                onClick={() => showToast('Simulating file attachment for Annexure-B...')}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Attach Document or Signed Certificate"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your official clarification message to evaluating officers..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-[#303030] bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008BDC]/40"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="px-4 py-2 rounded-lg bg-[#008BDC] hover:bg-blue-600 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: WITHDRAW BID CONFIRMATION */}
      {withdrawModalApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm select-none animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={() => setWithdrawModalApp(null)}
        >
          <div
            className="relative w-full max-w-md rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#303030] shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Withdraw Bid Application?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Are you sure you want to withdraw your application for <strong className="text-slate-700 dark:text-slate-300">{withdrawModalApp.title}</strong> ({withdrawModalApp.tenderId})? This action will formally retract your proposal and cancel your DSC timestamp.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setWithdrawModalApp(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Withdrew ${withdrawModalApp.tenderId}`);
                  setWithdrawModalApp(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-150 border border-slate-700"
          role="status"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export default MyApplications;
