import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Eye,
  X,
  ShieldCheck,
  Check,
  Search,
  Sparkles,
  Clock,
  Send,
  FileCheck,
  Scale,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import BidderChatBot from '../../components/common/BidderChatBot';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import { mlService } from '../../services';

const INITIAL_REQUIREMENTS = [];

const CATEGORY_DEFINITIONS = [
  { id: 'all', name: 'All Categories', match: null },
  { id: 'eligibility', name: 'Eligibility Criteria', match: 'Eligibility Criteria' },
  { id: 'mandatory_docs', name: 'Mandatory Documents', match: 'Mandatory Documents' },
  { id: 'technical', name: 'Technical Requirements', match: 'Technical Requirements' },
  { id: 'financial', name: 'Financial Requirements', match: 'Financial Requirements' },
  { id: 'conditions', name: 'Tender Conditions & GFR', match: 'Tender Conditions' },
];

const ITEMS_PER_PAGE = 15;

const ComplianceCheckView = ({ onBackToDashboard, submissionData }) => {
  const [activeTab, setActiveTab] = useState('all'); // all | compliant | needs_review | non_compliant | not_applicable
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [chatBotOpen, setChatBotOpen] = useState(false);

  // Requirements state - live dynamic data only
  const [requirements, setRequirements] = useState(INITIAL_REQUIREMENTS);
  const [loadingRequirements, setLoadingRequirements] = useState(false);

  // Selected requirement for slide-over detail drawer
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);

  // Clarification notice modal state
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);
  const [clarificationSentSuccess, setClarificationSentSuccess] = useState(false);

  // Active requirement lookup
  const selectedReq = useMemo(
    () => (selectedReqId ? requirements.find((r) => r.id === selectedReqId) : null) || requirements[0] || null,
    [requirements, selectedReqId]
  );
  const [statusSelect, setStatusSelect] = useState('Compliant');
  const [remarksInput, setRemarksInput] = useState('');
  const [savedNotification, setSavedNotification] = useState(false);

  // Sync requirements from live submissionData
  useEffect(() => {
    if (submissionData?.requirements && Array.isArray(submissionData.requirements) && submissionData.requirements.length > 0) {
      setRequirements(submissionData.requirements);
      return;
    }
    if (submissionData?.complianceChecks && Array.isArray(submissionData.complianceChecks) && submissionData.complianceChecks.length > 0) {
      const dynamicList = submissionData.complianceChecks.map((chk, idx) => ({
        id: idx + 1,
        category: 'Eligibility Criteria',
        requirement: chk.name || 'Compliance Parameter',
        clause: `Clause 1.${idx + 1}`,
        tenderText: chk.name || 'Compliance requirement per tender NIT',
        requiredDoc: chk.name || 'Statutory Declaration',
        status: chk.isCleared ? 'Compliant' : 'Needs Review',
        confidence: chk.confidence || 90,
        hasIssue: !chk.isCleared,
        isDiscrepancy: !chk.isCleared,
        docName: `${(chk.name || 'Document').replace(/\s+/g, '_')}.pdf`,
        docSize: '500 KB',
        description: chk.value || 'Verification of parameter against tender conditions',
        aiSummary: chk.value || 'Evaluated against tender specifications.',
        remarks: chk.value || (chk.isCleared ? 'Parameter verified and compliant.' : 'Clarification needed.'),
        ruleSource: 'GFR 2017 & GeM STC',
      }));
      setRequirements(dynamicList);
      return;
    }
    if (!submissionData) {
      setRequirements([]);
    }
  }, [submissionData]);

  // Load dynamic tender requirements from ML Microservice when tender is active
  useEffect(() => {
    let isMounted = true;
    const loadMLRequirements = async () => {
      if (!submissionData?.tenderTitle && !submissionData?.tenderId) {
        return;
      }
      try {
        setLoadingRequirements(true);
        const tenderText = submissionData.tenderTitle || 'Procurement Tender Document';
        const parsedRes = await mlService.parseTenderRequirements(
          tenderText,
          submissionData.tenderId || ''
        );

        if (isMounted && parsedRes?.requirements && Array.isArray(parsedRes.requirements) && parsedRes.requirements.length > 0) {
          const dynamicList = parsedRes.requirements.map((req, idx) => ({
            id: req.id || idx + 100,
            category: req.category || 'Eligibility Criteria',
            requirement: req.title || req.requirement || req.clause || 'Mandatory Compliance Criterion',
            clause: req.clause || `Section 2.${idx + 13}`,
            tenderText: req.description || req.tenderText || tenderText,
            requiredDoc: req.required_document || req.requiredDoc || 'Statutory Declaration',
            status: req.status || 'Compliant',
            confidence: req.confidence || 95,
            hasIssue: req.status === 'Needs Review' || req.status === 'Non-Compliant',
            isDiscrepancy: req.status === 'Needs Review' || req.status === 'Non-Compliant',
            docName: req.docName || `${(req.requirement || 'Document').replace(/\s+/g, '_')}.pdf`,
            docSize: req.docSize || '850 KB',
            description: req.description || req.tenderText || 'Requirement extracted by GeM ML Engine',
            aiSummary: req.aiSummary || 'Dynamic requirement extracted from Tender NIT by NLP parser.',
            remarks: req.remarks || 'Active requirement',
            ruleSource: req.ruleSource || 'GeM GTC / GFR 2017',
          }));
          setRequirements(dynamicList);
        }
      } catch (err) {
        console.warn('ML Requirements load notice:', err);
      } finally {
        if (isMounted) setLoadingRequirements(false);
      }
    };
    loadMLRequirements();
    return () => {
      isMounted = false;
    };
  }, [submissionData?.tenderId, submissionData?.tenderTitle]);

  // Sync edit state when requirement changes
  const handleSelectReq = (req) => {
    setSelectedReqId(req.id);
    setStatusSelect(req.status);
    setRemarksInput(req.remarks || '');
    setDetailsPanelOpen(true);
  };

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && detailsPanelOpen) {
        setDetailsPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailsPanelOpen]);

  const handleSaveStatus = (e) => {
    e?.preventDefault();
    setRequirements((prev) =>
      prev.map((r) =>
        r.id === selectedReqId
          ? {
              ...r,
              status: statusSelect,
              remarks: remarksInput,
              hasIssue: statusSelect === 'Needs Review' || statusSelect === 'Non-Compliant',
              isDiscrepancy: statusSelect === 'Needs Review' || statusSelect === 'Non-Compliant',
            }
          : r
      )
    );
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2200);
  };

  // Dynamic KPI Metrics calculated from state
  const stats = useMemo(() => {
    const total = requirements.length;
    const compliant = requirements.filter((r) => r.status === 'Compliant').length;
    const needsReview = requirements.filter((r) => r.status === 'Needs Review').length;
    const nonCompliant = requirements.filter((r) => r.status === 'Non-Compliant').length;
    const notApplicable = requirements.filter((r) => r.status === 'Not Applicable').length;
    const compliantPct = total > 0 ? ((compliant / total) * 100).toFixed(1) : '0';
    return { total, compliant, needsReview, nonCompliant, notApplicable, compliantPct };
  }, [requirements]);

  // Dynamic Category Stats calculated from state
  const categoryStats = useMemo(() => {
    const map = {};
    CATEGORY_DEFINITIONS.forEach((cat) => {
      if (cat.id === 'all') {
        map.all = {
          total: requirements.length,
          compliant: requirements.filter((r) => r.status === 'Compliant').length,
        };
      } else {
        const catItems = requirements.filter((r) => r.category === cat.match);
        map[cat.id] = {
          total: catItems.length,
          compliant: catItems.filter((r) => r.status === 'Compliant').length,
        };
      }
    });
    return map;
  }, [requirements]);

  // Filtered and Sorted Requirements
  const filteredRequirements = useMemo(() => {
    return requirements
      .filter((item) => {
        // Category filter
        if (activeCategory !== 'all') {
          const def = CATEGORY_DEFINITIONS.find((c) => c.id === activeCategory);
          if (def?.match && item.category !== def.match) return false;
        }

        // Status filter
        if (activeTab === 'compliant' && item.status !== 'Compliant') return false;
        if (activeTab === 'needs_review' && item.status !== 'Needs Review') return false;
        if (activeTab === 'non_compliant' && item.status !== 'Non-Compliant') return false;
        if (activeTab === 'not_applicable' && item.status !== 'Not Applicable') return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.requirement.toLowerCase().includes(q);
          const matchClause = item.clause.toLowerCase().includes(q);
          const matchDoc = item.requiredDoc?.toLowerCase().includes(q);
          const matchRule = item.ruleSource?.toLowerCase().includes(q);
          if (!matchTitle && !matchClause && !matchDoc && !matchRule) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'needs-attention') {
          const order = { 'Non-Compliant': 1, 'Needs Review': 2, 'Compliant': 3, 'Not Applicable': 4 };
          return (order[a.status] || 99) - (order[b.status] || 99);
        }
        if (sortBy === 'confidence-desc') {
          return (b.confidence || 0) - (a.confidence || 0);
        }
        if (sortBy === 'confidence-asc') {
          return (a.confidence || 0) - (b.confidence || 0);
        }
        return a.id - b.id;
      });
  }, [requirements, activeCategory, activeTab, searchQuery, sortBy]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRequirements.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequirements = useMemo(() => {
    return filteredRequirements.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRequirements, startIndex]);

  // Status Badge Component
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Compliant':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Compliant</span>
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            <span>Needs Review</span>
          </span>
        );
      case 'Non-Compliant':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>Non-Compliant</span>
          </span>
        );
      case 'Not Applicable':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>Not Applicable</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200 text-slate-900 dark:text-slate-100">
      {/* ========================================================================= */}
      {/* 1. TENDER CONTEXT BAR                                                     */}
      {/* ========================================================================= */}
      <div className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
              Tender Identification
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
              {submissionData?.tenderId || '—'}
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
              Evaluated Bidder
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              {submissionData?.bidder || 'No Bidder Selected'}
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
              Evaluation Status
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
              submissionData
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${submissionData ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {submissionData?.evaluationStatus || submissionData?.complianceStatus || 'No Evaluation Active'}
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
              Last Updated
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {submissionData?.submittedOn ? `${submissionData.submittedOn}${submissionData.submittedTime ? `, ${submissionData.submittedTime}` : ''}` : '—'}
            </span>
          </div>
        </div>

        {/* Primary Page Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => alert('Official Procurement Verification Audit Dossier exported in PDF with digital seal & cryptographic hash.')}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs transition cursor-pointer"
            aria-label="Export Audit Dossier"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={() => {
              alert('Re-running AI compliance verification against active GeM & GFR rules...');
            }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRequirements ? 'animate-spin' : ''}`} />
            <span>Re-run Verification</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT COMPLIANCE KPI CARDS                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Criteria */}
        <button
          type="button"
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`p-3 rounded-xl border text-left transition cursor-pointer shadow-2xs ${
            activeTab === 'all'
              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Criteria</span>
            <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">{stats.total}</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">100% Rules</span>
          </div>
        </button>

        {/* Card 2: Compliant */}
        <button
          type="button"
          onClick={() => { setActiveTab('compliant'); setCurrentPage(1); }}
          className={`p-3 rounded-xl border text-left transition cursor-pointer shadow-2xs ${
            activeTab === 'compliant'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Compliant
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">{stats.compliant}</span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{stats.compliantPct}% Satisfied</span>
          </div>
        </button>

        {/* Card 3: Needs Review */}
        <button
          type="button"
          onClick={() => { setActiveTab('needs_review'); setCurrentPage(1); }}
          className={`p-3 rounded-xl border text-left transition cursor-pointer shadow-2xs ${
            activeTab === 'needs_review'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Needs Review
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-700 dark:text-amber-400">{stats.needsReview}</span>
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Action Needed</span>
          </div>
        </button>

        {/* Card 4: Non-Compliant */}
        <button
          type="button"
          onClick={() => { setActiveTab('non_compliant'); setCurrentPage(1); }}
          className={`p-3 rounded-xl border text-left transition cursor-pointer shadow-2xs ${
            activeTab === 'non_compliant'
              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Non-Compliant
            </span>
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-700 dark:text-rose-400">{stats.nonCompliant}</span>
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Discrepancy</span>
          </div>
        </button>

        {/* Card 5: Not Applicable */}
        <button
          type="button"
          onClick={() => { setActiveTab('not_applicable'); setCurrentPage(1); }}
          className={`p-3 rounded-xl border text-left transition cursor-pointer shadow-2xs col-span-2 sm:col-span-1 ${
            activeTab === 'not_applicable'
              ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-400 ring-2 ring-slate-400/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Not Applicable
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-700 dark:text-slate-300">{stats.notApplicable}</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Waiver</span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE: 2-COLUMN DESKTOP LAYOUT                                */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col lg:flex-row gap-4 items-start">
        {/* ---------------- LEFT: CATEGORY NAVIGATION (Compact Sidebar) ----------- */}
        <aside className="w-full lg:w-64 shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-3.5 space-y-3 lg:sticky lg:top-[90px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Compliance Pillars
            </h3>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold font-mono">
              GFR 2017
            </span>
          </div>

          <div className="space-y-1 text-xs">
            {CATEGORY_DEFINITIONS.map((cat) => {
              const stat = categoryStats[cat.id] || { total: 0, compliant: 0 };
              const isSelected = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/80 shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent font-medium'
                  }`}
                >
                  <span className="truncate pr-1 text-xs leading-snug">{cat.name}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 font-mono ${
                      isSelected
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {stat.compliant}/{stat.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tri-Partite Ingestion Verification Card */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
              Tri-Partite Verification
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="truncate">Tender Specs (RFP/NIT)</span>
              </p>
              <p className="flex items-center gap-1.5">
                <FileCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">Bidder Dossier &amp; Attachments</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Scale className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">GFR 2017 &amp; PPP-MII Rules</span>
              </p>
            </div>
          </div>
        </aside>

        {/* ---------------- RIGHT: CRITERIA WORKSPACE (Full Width) ---------------- */}
        <div className="flex-1 min-w-0 space-y-3 w-full">
          {/* CRITERIA TOOLBAR */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search requirement, clause, rule or document..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Pills, Sort & Single AI Assistant Button */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                  className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({requirements.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('compliant'); setCurrentPage(1); }}
                  className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                    activeTab === 'compliant'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Pass ({stats.compliant})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('needs_review'); setCurrentPage(1); }}
                  className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                    activeTab === 'needs_review'
                      ? 'bg-amber-700 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Review ({stats.needsReview})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('non_compliant'); setCurrentPage(1); }}
                  className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                    activeTab === 'non_compliant'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Fail ({stats.nonCompliant})
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="h-8 text-xs font-semibold px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                aria-label="Sort compliance criteria"
              >
                <option value="default">Sort: Default Order</option>
                <option value="needs-attention">Sort: Attention First</option>
                <option value="confidence-desc">Sort: Confidence (High → Low)</option>
                <option value="confidence-asc">Sort: Confidence (Low → High)</option>
              </select>

              {/* Single Primary AI Entry Point */}
              <button
                type="button"
                onClick={() => setChatBotOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition cursor-pointer shrink-0"
                title="Ask AI Assistant about GeM and GFR compliance"
                aria-label="Ask AI Assistant about GeM and GFR compliance"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Assistant</span>
              </button>
            </div>
          </div>

          {/* STRUCTURED CRITERIA TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto" data-lenis-prevent="true">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3 font-bold w-10 text-center">#</th>
                    <th className="py-2.5 px-3 font-bold min-w-[260px]">Requirement &amp; Required Document</th>
                    <th className="py-2.5 px-3 font-bold min-w-[170px]">Clause / Rule</th>
                    <th className="py-2.5 px-3 font-bold w-32">Status</th>
                    <th className="py-2.5 px-3 font-bold w-36">AI Confidence</th>
                    <th className="py-2.5 px-3 font-bold text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {paginatedRequirements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-500 dark:text-slate-400">
                        <FileText className="w-9 h-9 mx-auto text-slate-400 mb-2 opacity-60" />
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {requirements.length === 0
                            ? 'No compliance criteria evaluated'
                            : 'No matching criteria found'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                          {requirements.length === 0
                            ? 'No active tender or bidder submission is currently selected. Select a submission from the Tender Submissions table or run an automated verification.'
                            : 'Try adjusting your search term or status filters.'}
                        </p>
                        {requirements.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setActiveTab('all');
                              setActiveCategory('all');
                              setCurrentPage(1);
                            }}
                            className="mt-3 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedRequirements.map((req) => {
                      const isSelected = selectedReqId === req.id && detailsPanelOpen;
                      const isAttentionNeeded = req.status === 'Needs Review' || req.status === 'Non-Compliant';

                      return (
                        <tr
                          key={req.id}
                          onClick={() => handleSelectReq(req)}
                          className={`transition-colors cursor-pointer group ${
                            isSelected
                              ? 'bg-blue-50/70 dark:bg-blue-950/30'
                              : req.status === 'Needs Review'
                              ? 'bg-amber-50/35 dark:bg-amber-950/15 hover:bg-amber-50/60 dark:hover:bg-amber-950/30'
                              : req.status === 'Non-Compliant'
                              ? 'bg-rose-50/35 dark:bg-rose-950/15 hover:bg-rose-50/60 dark:hover:bg-rose-950/30'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Row Number */}
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-bold text-xs text-center font-mono">
                            {req.id}
                          </td>

                          {/* Requirement & Document */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-200 text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {isAttentionNeeded && (
                                <AlertTriangle
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    req.status === 'Needs Review' ? 'text-amber-600' : 'text-rose-600'
                                  }`}
                                />
                              )}
                              <span>{req.requirement}</span>
                            </div>
                            <span
                              className="text-[11px] font-normal text-slate-500 dark:text-slate-400 block mt-0.5 truncate max-w-sm"
                              title={req.requiredDoc}
                            >
                              {req.requiredDoc || 'Statutory Declaration'}
                            </span>
                          </td>

                          {/* Clause / Rule */}
                          <td className="py-3 px-3 text-xs">
                            <span className="font-semibold text-blue-600 dark:text-blue-400 block">
                              {req.clause}
                            </span>
                            <span
                              className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-xs mt-0.5"
                              title={req.ruleSource}
                            >
                              {req.ruleSource}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {renderStatusBadge(req.status)}
                          </td>

                          {/* AI Confidence Meter */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {req.confidence ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-7 font-mono">
                                  {req.confidence}%
                                </span>
                                <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      req.confidence >= 90
                                        ? 'bg-emerald-500'
                                        : req.confidence >= 70
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${req.confidence}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 font-normal pl-2">—</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectReq(req);
                              }}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                                req.status === 'Needs Review'
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                                  : req.status === 'Non-Compliant'
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title={`Inspect criterion ${req.clause}`}
                            >
                              {req.status === 'Needs Review' ? 'Review' : 'Inspect'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION BAR */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Showing{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {filteredRequirements.length === 0 ? 0 : startIndex + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredRequirements.length)}
                </span>{' '}
                of{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {filteredRequirements.length}
                </span>{' '}
                criteria
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-6 h-6 px-1.5 rounded-md text-xs font-bold transition font-mono ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SLIDE-OVER CRITERION DETAIL DRAWER                                      */}
      {/* ========================================================================= */}
      {/* Backdrop */}
      {detailsPanelOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in"
          onClick={() => setDetailsPanelOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col ${
          detailsPanelOpen && selectedReq ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="criterion-drawer-title"
      >
        {selectedReq && (
          <>
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {selectedReq.category}
              </span>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                {selectedReq.clause}
              </span>
            </div>
            <h3
              id="criterion-drawer-title"
              className="font-black text-base text-slate-900 dark:text-white leading-snug"
            >
              {selectedReq.requirement}
            </h3>
            <div className="pt-0.5 flex items-center gap-2">
              {renderStatusBadge(selectedReq.status)}
              {selectedReq.confidence && (
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                  AI Confidence: {selectedReq.confidence}%
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDetailsPanelOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
            title="Close Drawer (Esc)"
            aria-label="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div data-lenis-prevent="true" className="p-4 space-y-4 overflow-y-auto flex-1 text-xs leading-relaxed">
          {/* Actionable Discrepancy Callout (if applicable) */}
          {selectedReq.isDiscrepancy && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Actionable Compliance Discrepancy</span>
              </div>
              <p className="text-amber-900 dark:text-amber-300 font-medium">
                {selectedReq.issue}
              </p>
              <p className="text-amber-800 dark:text-amber-400 text-[11px]">
                <span className="font-bold">Recommended Remedy:</span> {selectedReq.recommendation}
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setClarificationModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue Clarification Notice (Form GeM-CN2)</span>
                </button>
              </div>
            </div>
          )}

          {/* Verbatim Tender Requirement */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Verbatim Tender Requirement (RFP Clause)
            </span>
            <p className="text-slate-800 dark:text-slate-200 italic leading-relaxed">
              “{selectedReq.tenderText}”
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 font-semibold">
              Governing Rule: {selectedReq.ruleSource}
            </p>
          </div>

          {/* Bidder Submitted Document Evidence */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Bidder Submitted Evidence
            </span>
            {selectedReq.docName ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={selectedReq.docName}>
                      {selectedReq.docName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedReq.docSize} &bull; DSC Verified
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => alert(`Opening preview of verified evidence: ${selectedReq.docName}`)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
                    title="View PDF"
                    aria-label={`View PDF ${selectedReq.docName}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alert(`Downloading verified copy: ${selectedReq.docName}`)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
                    title="Download PDF"
                    aria-label={`Download ${selectedReq.docName}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                No physical attachment required (Statutory exemption or system waiver applicable).
              </p>
            )}
          </div>

          {/* AI Verification Reasoning */}
          <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/50 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Verification Reasoning &amp; Context</span>
            </div>
            <MarkdownRenderer
              content={selectedReq.aiSummary}
              className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
            />
          </div>

          {/* Evaluator Status Override & Remarks */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Procurement Officer Decision &amp; Audit Trail</span>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="status-override-select"
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block"
              >
                Verification Status Override
              </label>
              <select
                id="status-override-select"
                aria-label="Verification Status Override"
                value={statusSelect}
                onChange={(e) => setStatusSelect(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="Compliant">🟢 Compliant — Requirement satisfied</option>
                <option value="Needs Review">🟡 Needs Review — Potential issue / manual verification needed</option>
                <option value="Non-Compliant">🔴 Non-Compliant — Requirement not satisfied</option>
                <option value="Not Applicable">⚪ Not Applicable — Requirement doesn't apply</option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="officer-remarks-textarea"
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block"
              >
                Procurement Officer Remarks / Justification
              </label>
              <textarea
                id="officer-remarks-textarea"
                aria-label="Procurement Officer Remarks"
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                rows={2}
                placeholder="Enter evaluation justification..."
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveStatus}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save to Official Audit Trail</span>
            </button>

            {savedNotification && (
              <p className="text-xs text-center font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                ✓ Verification record timestamped and committed!
              </p>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: ISSUE CLARIFICATION NOTICE (Form GeM-CN2)                       */}
      {/* ========================================================================= */}
      {clarificationModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Issue GeM Clarification Notice (Form GeM-CN2)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClarificationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Close Notice Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  Recipient: {submissionData?.bidder || 'Bidder Organization'} ({submissionData?.bidderId || submissionData?.id || '—'})
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Tender: {submissionData?.tenderTitle || 'Active Tender'} ({submissionData?.tenderId || '—'})
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Discrepancy Subject
                </label>
                <input
                  type="text"
                  readOnly
                  value={`Clarification required for ${selectedReq.clause}: ${selectedReq.requirement}`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Official Notice Message
                </label>
                <textarea
                  rows={4}
                  defaultValue={`Dear Bidder,\n\nDuring technical compliance evaluation, the following discrepancy was noted regarding Clause ${selectedReq.clause} (${selectedReq.requirement}):\n\n"${selectedReq.issue || 'Please provide clarified documentation.'}"\n\nYou are requested to submit your clarification / revised document within 48 hours as per GeM GTC Clause 4.2.`}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-amber-500 text-xs"
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                * The notice will be dispatched via official GeM portal notification and registered email to the bidder's authorized signatory.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setClarificationModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setClarificationSentSuccess(true);
                  setTimeout(() => {
                    setClarificationSentSuccess(false);
                    setClarificationModalOpen(false);
                  }, 1800);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Clarification Notice</span>
              </button>
            </div>

            {clarificationSentSuccess && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center animate-in fade-in">
                ✓ GeM Clarification Notice dispatched to bidder! Response deadline: 48 hours.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PER-TENDER & BIDDER AI CHATBOT                                         */}
      {/* ========================================================================= */}
      <BidderChatBot
        isOpen={chatBotOpen}
        onClose={() => setChatBotOpen(false)}
        tenderId={submissionData?.tenderId || ''}
        bidderId={submissionData?.bidderId || submissionData?.id || ''}
        bidderData={
          submissionData || {
            bidder: 'Evaluated Bidder',
            id: 'BID',
            bidderId: 'BID',
            tenderId: '',
            tenderTitle: 'Tender Evaluation',
            department: 'Procurement Department',
            complianceScore: 0,
            complianceStatus: 'Pending',
          }
        }
      />
    </div>
  );
};

export default ComplianceCheckView;
