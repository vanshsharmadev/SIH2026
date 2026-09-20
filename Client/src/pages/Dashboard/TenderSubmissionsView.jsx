import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  X,
  FileText,
  FileSpreadsheet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Play,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ClipboardCheck,
  Trophy,
} from 'lucide-react';
import BidderChatBot from '../../components/common/BidderChatBot';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import { AiEvaluationDrawer, ProcurementClearanceModal, TenderDetailModal } from '../../components/tender';
import { mlService, tenderService, aiService, recordAuditLog } from '../../services';
export const INITIAL_SUBMISSIONS = [];

const TenderSubmissionsView = ({ onBackToDashboard, onOpenCompliance }) => {
  // Load dynamic submissions from localStorage (strictly actual submissions only)
  const [submissionsList, setSubmissionsList] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('gem_officer_submissions') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        return stored.map((s) => ({
          id: s.id,
          tenderId: s.tenderId || s.tenderReferenceNo,
          tenderTitle: s.tenderTitle,
          department: s.department || s.ministry || 'Government Ministry',
          bidder: s.bidder || s.bidderName || 'Registered Bidder',
          submittedOn: s.submittedOn?.split(',')[0] || 'Today',
          submittedTime: s.submittedTime || 'Just now',
          relativeTime: s.relativeTime || 'Just now',
          isToday: s.isToday ?? true,
          docCount: s.docCount || s.documents?.length || 0,
          complianceScore: s.complianceScore !== undefined ? s.complianceScore : (s.score ?? 0),
          score: s.score !== undefined ? s.score : (s.complianceScore ?? 0),
          complianceStatus: s.complianceStatus || s.status || 'Compliant',
          status: s.status || s.complianceStatus || 'Compliant',
          evaluationStatus: s.evaluationStatus || 'Pending',
          quotedAmount: s.quotedAmount || '₹ 48,50,000',
          documents: s.documents || [],
          vaultDocuments: s.vaultDocuments || [],
          submissionDocuments: s.submissionDocuments || [],
          requirementsBreakdown: s.requirementsBreakdown || [],
          mlDossier: s.mlDossier || null,
          isLiveUploaded: Boolean(s.isLiveUploaded || s.documents?.[0]?.cloudinaryUrl),
          officerVerdict: s.officerVerdict || null,
          officerRemarks: s.officerRemarks || null,
        }));
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('gem_officer_submissions') || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
          const formatted = stored.map((s) => ({
            id: s.id,
            tenderId: s.tenderId || s.tenderReferenceNo,
            tenderTitle: s.tenderTitle,
            department: s.department || s.ministry || 'Government Ministry',
            bidder: s.bidder || s.bidderName || 'Registered Bidder',
            submittedOn: s.submittedOn?.split(',')[0] || 'Today',
            submittedTime: s.submittedTime || 'Just now',
            relativeTime: s.relativeTime || 'Just now',
            isToday: s.isToday ?? true,
            docCount: s.docCount || s.documents?.length || 0,
            complianceScore: s.complianceScore !== undefined ? s.complianceScore : (s.score ?? 0),
            score: s.score !== undefined ? s.score : (s.complianceScore ?? 0),
            complianceStatus: s.complianceStatus || s.status || 'Compliant',
            status: s.status || s.complianceStatus || 'Compliant',
            evaluationStatus: s.evaluationStatus || 'Pending',
            quotedAmount: s.quotedAmount || '₹ 48,50,000',
            documents: s.documents || [],
            vaultDocuments: s.vaultDocuments || [],
            submissionDocuments: s.submissionDocuments || [],
            requirementsBreakdown: s.requirementsBreakdown || [],
            mlDossier: s.mlDossier || null,
            isLiveUploaded: Boolean(s.isLiveUploaded || s.documents?.[0]?.cloudinaryUrl),
            officerVerdict: s.officerVerdict || null,
            officerRemarks: s.officerRemarks || null,
          }));
          setSubmissionsList(formatted);
        } else {
          setSubmissionsList([]);
        }
      } catch {
        setSubmissionsList([]);
      }
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);
    window.addEventListener('gem_officer_submissions_updated', handleStorageUpdate);
    window.addEventListener('gem_submission_created', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
      window.removeEventListener('gem_officer_submissions_updated', handleStorageUpdate);
      window.removeEventListener('gem_submission_created', handleStorageUpdate);
    };
  }, []);

  // Filters & State (Closed by default per user request)
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // all | pending | review | compliant | non_compliant
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTenderId, setFilterTenderId] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterCompliance, setFilterCompliance] = useState('');
  const [filterEval, setFilterEval] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected submission for side drawer
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('overview'); // 'overview' | 'dossier'
  const [viewAllDocs, setViewAllDocs] = useState(false);

  // Officer Evaluation & Clearance Engine Modal state
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [evalVerdict, setEvalVerdict] = useState('CLEARED');
  const [evalRemarks, setEvalRemarks] = useState('');
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evalError, setEvalError] = useState(null);
  const [actionToast, setActionToast] = useState(null);

  // Bidder chatbot state
  const [chatBotOpen, setChatBotOpen] = useState(false);
  const [qcbsModalTender, setQcbsModalTender] = useState(null);

  // Contextual AI Evaluation Drawer State (POST /api/officer/tenders/{id}/compare-bidders & POST /api/ai/compare/chat)
  const [selectedBidderIds, setSelectedBidderIds] = useState([]);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiDrawerBidder, setAiDrawerBidder] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  // Close submission details drawer on Escape key & manage scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && detailsDrawerOpen) {
        setDetailsDrawerOpen(false);
      }
    };
    if (detailsDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [detailsDrawerOpen]);

  const handleToggleSelectBidder = (e, subId) => {
    e?.stopPropagation();
    setSelectedBidderIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleOpenAiEvaluation = (sub) => {
    setAiDrawerBidder(sub);
    setAiDrawerOpen(true);

    if (!comparisonResult) {
      const targetTenderId = sub?.tenderId || filterTenderId || 'GEM/2024/B/5123981';
      setCompareLoading(true);

      const mlComparePromise = tenderService.compareBidders(
        targetTenderId,
        [
          {
            bidder_id: sub.bidderId || sub.id,
            bidder_name: sub.bidder,
            compliance_score: sub.complianceScore,
            documents_count: sub.docCount,
          },
        ],
        {
          min_local_content: '50%',
          gfr_rule_144_required: true,
          minimum_turnover: 'INR 10 Cr',
        }
      );

      const aiComparePromise = aiService.compareBiddersAI({
        tenderId: targetTenderId,
        bidderIds: [sub.bidderId || sub.id],
        query: `Evaluate ${sub.bidder} on statutory GST, GFR 144, PyHanko DSC credentials, and technical compliance.`,
      });

      Promise.allSettled([mlComparePromise, aiComparePromise])
        .then(([mlRes, aiRes]) => {
          setComparisonResult({
            ml: mlRes.status === 'fulfilled' ? mlRes.value : null,
            ai: aiRes.status === 'fulfilled' ? aiRes.value : null,
            bidders: [sub],
          });
        })
        .catch((err) => {
          console.warn('AI evaluation error:', err);
        })
        .finally(() => {
          setCompareLoading(false);
        });
    }
  };

  const handleRunComparison = async () => {
    if (selectedBidderIds.length < 2) {
      alert('Please select at least 2 bidders using the checkboxes to run a comparative analysis.');
      return;
    }
    setCompareLoading(true);

    const targetTenderId = filterTenderId || 'GEM/2024/B/5123981';
    const selectedSubs = submissionsList.filter((s) => selectedBidderIds.includes(s.id));

    // Open drawer directly for the first selected bidder
    setAiDrawerBidder(selectedSubs[0]);
    setAiDrawerOpen(true);

    try {
      // 1. Invoke ML CIS comparison (POST /api/officer/tenders/{id}/compare-bidders)
      const mlComparePromise = tenderService.compareBidders(
        targetTenderId,
        selectedSubs.map((s) => ({
          bidder_id: s.bidderId || s.id,
          bidder_name: s.bidder,
          compliance_score: s.complianceScore,
          documents_count: s.docCount,
        })),
        {
          min_local_content: '50%',
          gfr_rule_144_required: true,
          minimum_turnover: 'INR 10 Cr',
        }
      );

      // 2. Invoke Node AI RAG Comparative Analysis (POST /api/ai/compare/chat)
      const aiComparePromise = aiService.compareBiddersAI({
        tenderId: targetTenderId,
        bidderIds: selectedSubs.map((s) => s.bidderId || s.id),
        query: `Compare ${selectedSubs.map((s) => s.bidder).join(' vs ')} on eligibility, GFR 144, PyHanko DSC, and statutory GST credentials.`,
      });

      const [mlRes, aiRes] = await Promise.allSettled([mlComparePromise, aiComparePromise]);

      setComparisonResult({
        ml: mlRes.status === 'fulfilled' ? mlRes.value : null,
        ai: aiRes.status === 'fulfilled' ? aiRes.value : null,
        bidders: selectedSubs,
      });

      recordAuditLog({
        activity: 'Bidder Comparison Completed',
        module: 'Tender Submissions',
        details: `Comparative analysis completed for ${selectedSubs.length} bidders on Tender #${targetTenderId}`,
        status: 'Success',
      });
    } catch (err) {
      console.warn('Comparison error:', err);
    } finally {
      setCompareLoading(false);
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterTenderId('');
    setFilterDept('');
    setFilterOrg('');
    setFilterCompliance('');
    setFilterEval('');
    setStartDate('');
    setEndDate('');
    setSelectedTab('all');
  };

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return submissionsList.filter((item) => {
      // Tab filter
      if (selectedTab === 'pending' && item.evaluationStatus !== 'Pending') return false;
      if (selectedTab === 'review' && item.evaluationStatus !== 'Under Review') return false;
      if (selectedTab === 'compliant' && item.complianceStatus !== 'Compliant') return false;
      if (selectedTab === 'non_compliant' && item.complianceStatus === 'Compliant') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.tenderTitle || '').toLowerCase().includes(q);
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchTender = (item.tenderId || '').toLowerCase().includes(q);
        const matchBidder = (item.bidder || '').toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchTender && !matchBidder) return false;
      }

      // Tender ID specific filter
      if (filterTenderId.trim()) {
        if (!(item.tenderId || '').toLowerCase().includes(filterTenderId.toLowerCase())) return false;
      }

      // Compliance status dropdown
      if (filterCompliance && item.complianceStatus !== filterCompliance) return false;

      // Evaluation status dropdown
      if (filterEval && item.evaluationStatus !== filterEval) return false;

      return true;
    });
  }, [submissionsList, selectedTab, searchQuery, filterTenderId, filterCompliance, filterEval]);

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / rowsPerPage));
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredSubmissions.slice(start, start + rowsPerPage);
  }, [filteredSubmissions, currentPage, rowsPerPage]);

  const handleSelectRow = (sub) => {
    setSelectedSubmission(sub);
    setDetailsDrawerOpen(true);
  };

  const handleConfirmEvaluation = async () => {
    if (!selectedSubmission) return;
    setEvalSubmitting(true);
    try {
      // 1. Attempt call to ML Decision Engine
      await mlService.processClearance(
        {
          bidder_id: selectedSubmission.id,
          composite_cis_score: selectedSubmission.complianceScore,
          verdict: evalVerdict,
          notes: evalRemarks || 'Officer clearance verified via submitted documentation & DSC signature',
        },
        'OFF-101'
      ).catch(() => null);

      // 2. Map verdict to human-readable evaluation status
      const newEvalStatus =
        evalVerdict === 'CLEARED'
          ? 'Cleared'
          : evalVerdict === 'CONDITIONALLY_CLEARED'
          ? 'Under Review'
          : 'Rejected';

      // 3. Update local submissions state
      const updatedList = submissionsList.map((item) => {
        if (item.id === selectedSubmission.id) {
          return {
            ...item,
            evaluationStatus: newEvalStatus,
            officerVerdict: evalVerdict,
            officerRemarks: evalRemarks,
          };
        }
        return item;
      });
      setSubmissionsList(updatedList);
      setSelectedSubmission((prev) => ({
        ...prev,
        evaluationStatus: newEvalStatus,
        officerVerdict: evalVerdict,
        officerRemarks: evalRemarks,
      }));

      // 4. Persist in localStorage officer submissions
      try {
        const stored = JSON.parse(localStorage.getItem('gem_officer_submissions') || '[]');
        const updatedStored = stored.map((s) => {
          if (s.id === selectedSubmission.id) {
            return {
              ...s,
              evaluationStatus: newEvalStatus,
              officerVerdict: evalVerdict,
              officerRemarks: evalRemarks,
            };
          }
          return s;
        });
        localStorage.setItem('gem_officer_submissions', JSON.stringify(updatedStored));
      } catch {
        // Ignore storage write error
      }

      // 5. Update Bidder Applications so bidder sees evaluation result
      try {
        const bidderApps = JSON.parse(localStorage.getItem('gem_bidder_applications') || '[]');
        const updatedBidderApps = bidderApps.map((app) => {
          if (app.id === selectedSubmission.id || app.tenderId === selectedSubmission.tenderId) {
            return {
              ...app,
              status:
                evalVerdict === 'CLEARED'
                  ? 'Evaluation Passed'
                  : evalVerdict === 'CONDITIONALLY_CLEARED'
                  ? 'Under Review'
                  : 'Disqualified',
              statusCategory:
                evalVerdict === 'CLEARED'
                  ? 'approved'
                  : evalVerdict === 'CONDITIONALLY_CLEARED'
                  ? 'under_eval'
                  : 'rejected',
              statusBadgeColor:
                evalVerdict === 'CLEARED'
                  ? 'border-emerald-300 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                  : evalVerdict === 'CONDITIONALLY_CLEARED'
                  ? 'border-amber-300 bg-amber-50/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                  : 'border-rose-300 bg-rose-50/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700',
            };
          }
          return app;
        });
        localStorage.setItem('gem_bidder_applications', JSON.stringify(updatedBidderApps));
      } catch {
        // Ignore storage write error
      }

      // 6. Record Audit Log
      recordAuditLog({
        activity: 'Clearance Decision',
        module: 'Clearance Engine',
        details: `Official clearance [${evalVerdict}] recorded for ${selectedSubmission.bidder} (${selectedSubmission.id})`,
        status: 'Success',
        user: { name: 'Evaluating Officer', role: 'Officer' },
      });

      setEvaluationModalOpen(false);
      setEvalError(null);
      setActionToast({
        title: 'Clearance Decision Recorded',
        message: `Official clearance verdict [${evalVerdict}] successfully recorded for ${selectedSubmission.bidder}.`,
        verdict: evalVerdict,
      });
      setTimeout(() => setActionToast(null), 5000);
    } catch (err) {
      console.error('Procurement clearance error:', err);
      setEvalError(err?.message || 'Failed to record clearance decision. Please retry.');
    } finally {
      setEvalSubmitting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const totalSubmissionsCount = submissionsList.length;
  const activeTendersCount = useMemo(() => new Set(submissionsList.map((s) => s.tenderId).filter(Boolean)).size, [submissionsList]);
  const pendingEvaluationCount = useMemo(() => submissionsList.filter((s) => s.evaluationStatus === 'Pending').length, [submissionsList]);
  const underReviewCount = useMemo(() => submissionsList.filter((s) => s.evaluationStatus === 'Under Review').length, [submissionsList]);
  const nonCompliantCount = useMemo(() => submissionsList.filter((s) => s.complianceStatus !== 'Compliant').length, [submissionsList]);
  const compliantCount = useMemo(() => submissionsList.filter((s) => s.complianceStatus === 'Compliant').length, [submissionsList]);
  const availableDepts = useMemo(() => Array.from(new Set(submissionsList.map((s) => s.department).filter(Boolean))), [submissionsList]);
  const availableOrgs = useMemo(() => Array.from(new Set(submissionsList.map((s) => s.bidder).filter(Boolean))), [submissionsList]);

  return (
    <div className="space-y-5 select-none animate-in fade-in duration-200">
      {onBackToDashboard && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <span>&larr; Back to Dashboard</span>
          </button>
        </div>
      )}

      {/* -------------------- 1. TOP 5 STAT CARDS -------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Submissions */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Submissions</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {totalSubmissionsCount}
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">All time</p>
            </div>
          </div>
        </div>

        {/* Card 2: Active Tenders */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Tenders</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {activeTendersCount}
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">With submissions</p>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Evaluation */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Evaluation</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {pendingEvaluationCount}
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Awaiting evaluation</p>
            </div>
          </div>
        </div>

        {/* Card 4: Non-Compliant */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Non-Compliant</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {nonCompliantCount}
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Require attention</p>
            </div>
          </div>
        </div>

        {/* Card 5: Compliant */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Compliant</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {compliantCount}
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Passed compliance</p>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- 3. FILTER PANEL -------------------- */}
      <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-all ${
        showFilters ? 'p-4 space-y-3.5' : 'py-2.5 px-4'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Search & Filter Criteria</span>
          </span>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150">
            {/* Row 1: Search, Tender ID, Dept, Org, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Tender ID / Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tender ID / Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Tender ID or Title..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Tender ID with clear X */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tender ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterTenderId}
                    onChange={(e) => setFilterTenderId(e.target.value)}
                    placeholder="e.g. GEM/2024/B/5123981"
                    className="w-full pl-3 pr-8 py-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {filterTenderId && (
                    <button
                      type="button"
                      onClick={() => setFilterTenderId('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {availableDepts.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Organization / Bidder */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Organization / Bidder
                </label>
                <select
                  value={filterOrg}
                  onChange={(e) => setFilterOrg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Organizations / Bidders</option>
                  {availableOrgs.map((org) => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>

              {/* Submission Status */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Submission Status
                </label>
                <select
                  value={filterEval}
                  onChange={(e) => setFilterEval(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Row 2: Compliance Status, Date Range, Evaluation Status, Reset, Apply */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs items-end">
              {/* Compliance Status */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Compliance Status
                </label>
                <select
                  value={filterCompliance}
                  onChange={(e) => setFilterCompliance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Compliance</option>
                  <option value="Compliant">🟢 Compliant</option>
                  <option value="Needs Review">🟡 Needs Review</option>
                  <option value="Non-Compliant">🔴 Non-Compliant</option>
                  <option value="Not Applicable">⚪ Not Applicable</option>
                </select>
              </div>

              {/* Submitted Date Range */}
              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Submitted Date
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Start Date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-3 pr-7 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-xs text-slate-400">to</span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="End Date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-3 pr-7 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Evaluation Status */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Evaluation Status
                </label>
                <select
                  value={filterEval}
                  onChange={(e) => setFilterEval(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Evaluation Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>

              {/* Buttons: Reset & Apply Filters */}
              <div className="lg:col-span-3 flex items-center justify-end gap-2 pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer shadow-xs"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Apply Filters</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- 4. TABS & EXPORT BUTTON -------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
        {/* Navigation Tabs */}
        <div data-lenis-prevent="true" className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSelectedTab('all')}
            className={`pb-2.5 px-2 font-bold flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
              selectedTab === 'all'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>All Submissions</span>
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold">
              {totalSubmissionsCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('pending')}
            className={`pb-2.5 px-2 font-bold flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
              selectedTab === 'pending'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Pending Evaluation</span>
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {pendingEvaluationCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('review')}
            className={`pb-2.5 px-2 font-bold flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
              selectedTab === 'review'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Under Review</span>
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {underReviewCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('compliant')}
            className={`pb-2.5 px-2 font-bold flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
              selectedTab === 'compliant'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Compliant</span>
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold">
              {compliantCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('non_compliant')}
            className={`pb-2.5 px-2 font-bold flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
              selectedTab === 'non_compliant'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Non-Compliant</span>
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-semibold">
              {nonCompliantCount}
            </span>
          </button>
        </div>

        {/* Export Button & QCBS Rankings Button */}
        <div className="pb-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setQcbsModalTender({
                id: selectedSubmission?.tenderId || filterTenderId || '1',
                referenceNo: selectedSubmission?.tenderId || filterTenderId || 'GEM/2024/B/5123981',
                title: selectedSubmission?.tenderTitle || 'Solar Power Installation & Infrastructure Project',
                value: '₹ 18.50 Cr',
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700/80 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer shadow-2xs"
            title="Inspect Top 10 Bidders ranked by GFR 192 QCBS (70% Technical / 30% Price)"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Top 10 QCBS Bidders</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Exporting submissions table to CSV / Excel...')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Table (CSV)</span>
          </button>
        </div>
      </div>

      {/* -------------------- 5. MAIN CONTENT: FULL-WIDTH TABLE & DETAILS DRAWER -------------------- */}
      <div className="w-full space-y-5">

        {/* Submissions Data Table */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-all duration-200">
          {/* Multi-Bidder Comparison Selection Action Bar */}
          {selectedBidderIds.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b border-blue-200 dark:border-blue-900/60 px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {selectedBidderIds.length}
                </span>
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  bidders selected for comparative evaluation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBidderIds([])}
                  className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-1 rounded cursor-pointer"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={handleRunComparison}
                  disabled={selectedBidderIds.length < 2 || compareLoading}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {compareLoading ? 'Analyzing Bidders...' : 'Run Comparative Evaluation'}
                </button>
              </div>
            </div>
          )}

          <div data-lenis-prevent="true" className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-2.5 px-3 min-w-[120px]">Submission ID</th>
                  <th className="py-2.5 px-3 min-w-[160px] max-w-[200px]">Tender ID / Title</th>
                  <th className="py-2.5 px-3 min-w-[140px] max-w-[180px]">Bidder / Organization</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Submitted On</th>
                  <th className="py-2.5 px-3 text-center min-w-[85px]">Documents</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Compliance Score</th>
                  <th className="py-2.5 px-3 text-center min-w-[115px]">Compliance Status</th>
                  <th className="py-2.5 px-3 text-center min-w-[100px]">Evaluation Status</th>
                  <th className="py-2.5 px-3 text-center min-w-[165px] sticky right-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.3)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-200">
                {paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No tender submissions found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((sub) => {
                    const isSelected = selectedSubmission?.id === sub.id && detailsDrawerOpen;
                    const isChecked = selectedBidderIds.includes(sub.id);
                    return (
                      <tr
                        key={sub.id}
                        onClick={() => handleSelectRow(sub)}
                        className={`group hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                          isSelected ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''
                        }`}
                      >
                        {/* Multi-Selection Checkbox */}
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleSelectBidder(e, sub.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                            aria-label={`Select ${sub.bidder}`}
                          />
                        </td>

                        {/* Submission ID */}
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            {sub.id}
                          </span>
                        </td>

                        {/* Tender ID / Title */}
                        <td className="py-2.5 px-3 max-w-[200px]">
                          <code className="font-mono text-xs font-semibold text-slate-900 dark:text-white tracking-wide bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                            {sub.tenderId}
                          </code>
                          <p
                            className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2"
                            title={sub.tenderTitle}
                          >
                            {sub.tenderTitle}
                          </p>
                        </td>

                        {/* Bidder / Organization */}
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white break-words max-w-[180px]" title={sub.bidder}>
                          {sub.bidder}
                        </td>

                        {/* Submitted On */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <p className="text-slate-900 dark:text-white leading-tight">{sub.submittedOn}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{sub.submittedTime}</p>
                        </td>

                        {/* Documents Pill */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium text-xs">
                            <FileText className="w-3 h-3" />
                            <span>{sub.docCount} Docs</span>
                          </span>
                        </td>

                        {/* Compliance Score + Progress Bar */}
                        <td className="py-2.5 px-3 min-w-[110px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white text-xs w-7">
                              {sub.complianceScore}%
                            </span>
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getScoreColor(sub.complianceScore)}`}
                                style={{ width: `${sub.complianceScore}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Compliance Status Badge */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {sub.complianceStatus === 'Compliant' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Compliant</span>
                            </span>
                          )}
                          {sub.complianceStatus === 'Needs Review' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Needs Review</span>
                            </span>
                          )}
                          {sub.complianceStatus === 'Non-Compliant' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>Non-Compliant</span>
                            </span>
                          )}
                          {sub.complianceStatus === 'Not Applicable' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Not Applicable</span>
                            </span>
                          )}
                        </td>

                        {/* Evaluation Status */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {sub.evaluationStatus === 'Pending' ? (
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Pending
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                              Under Review
                            </span>
                          )}
                        </td>

                        {/* Actions - Sticky Right to always stay in viewport (Issue 20), accessible buttons (Issue 4, 23) */}
                        <td className={`py-2.5 px-3 text-center sticky right-0 z-10 ${isSelected ? 'bg-blue-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-900 group-hover:bg-blue-50/50 dark:group-hover:bg-slate-800/60'} shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.3)] transition-colors`}>
                          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenAiEvaluation(sub)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80 transition cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              title={`View AI Evaluation for ${sub.bidder}`}
                              aria-label={`View AI Evaluation for ${sub.bidder}`}
                            >
                              <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="whitespace-nowrap">AI Evaluation</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleSelectRow(sub);
                                setChatBotOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              title="Ask Tender AI about this Bidder"
                              aria-label={`Ask Tender AI about ${sub.bidder}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectRow(sub)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              title="View Details"
                              aria-label={`View details for ${sub.bidder}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenCompliance && onOpenCompliance(sub)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              title="Evaluate Compliance Check"
                              aria-label={`Evaluate compliance check for ${sub.bidder}`}
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Pagination & Rows per page */}
          <div className="p-3.5 border-t border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span>
                Showing {filteredSubmissions.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
                {Math.min(currentPage * rowsPerPage, filteredSubmissions.length)} of {filteredSubmissions.length} submissions
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Pagination numbers */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous Page"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 cursor-pointer transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Next Page"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 cursor-pointer transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rows Per Page Selector */}
              <div className="flex items-center gap-1.5">
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------- 6. RIGHT SIDE DETAILS DRAWER (Slide-Over Panel) -------------------- */}
        {detailsDrawerOpen && selectedSubmission && (
          <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={() => setDetailsDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Container */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <aside
                role="dialog"
                aria-modal="true"
                data-lenis-prevent="true"
                aria-label="Submission Details"
                className="w-screen max-w-md md:max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right p-4 sm:p-5 space-y-4 overflow-y-auto"
              >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Submission Details
              </h3>
              <button
                type="button"
                onClick={() => setDetailsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close details drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Submission ID & Badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                {selectedSubmission.id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedSubmission.complianceStatus === 'Compliant'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60'
                    : selectedSubmission.complianceStatus === 'Needs Review'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedSubmission.complianceStatus === 'Compliant'
                      ? 'bg-emerald-500'
                      : selectedSubmission.complianceStatus === 'Needs Review'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span>{selectedSubmission.complianceStatus}</span>
              </span>
            </div>

            {/* Segmented Tab Controls to reduce density */}
            <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDetailTab('overview')}
                className={`flex-1 py-1 rounded-md transition cursor-pointer ${
                  detailTab === 'overview'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('dossier')}
                className={`flex-1 py-1 rounded-md transition cursor-pointer ${
                  detailTab === 'dossier'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                AI Dossier &amp; Docs ({selectedSubmission.docCount})
              </button>
            </div>

            {detailTab === 'overview' ? (
              <div className="space-y-3.5">
                {/* Tender Info */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tender</p>
                  <code className="font-mono text-xs font-bold text-slate-900 dark:text-white block bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit">
                    {selectedSubmission.tenderId}
                  </code>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    {selectedSubmission.tenderTitle}
                  </p>
                </div>

                {/* Bidder */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bidder</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedSubmission.bidder}
                  </p>
                </div>

                {/* Submitted On */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Submitted On</p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {selectedSubmission.submittedOn}, {selectedSubmission.submittedTime}
                  </p>
                </div>

                {/* Compliance Score Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Compliance Score</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedSubmission.complianceScore}% Compliant
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreColor(selectedSubmission.complianceScore)}`}
                      style={{ width: `${selectedSubmission.complianceScore}%` }}
                    />
                  </div>
                </div>

                {/* Quick Document Summary */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedSubmission.docCount} Attached Documents</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetailTab('dossier')}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                {/* Direct Open AI Evaluation Action in Details Drawer */}
                <button
                  type="button"
                  onClick={() => handleOpenAiEvaluation(selectedSubmission)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>View AI Evaluation</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Evaluation Dossier */}
                {selectedSubmission.mlDossier && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Compliance Evaluation Dossier</span>
                      </span>
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        {selectedSubmission.mlDossier.forensicAuthenticity}% Authenticity
                      </span>
                    </div>
                    <MarkdownRenderer
                      content={selectedSubmission.mlDossier.executiveSummary}
                      className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
                    />
                    <div className="text-xs space-y-1 pt-1 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{selectedSubmission.mlDossier.digitalSignature}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{selectedSubmission.mlDossier.taxpayerVerification}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Attached Files ({selectedSubmission.docCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewAllDocs(!viewAllDocs)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {viewAllDocs ? 'Show Less' : 'View All'}
                    </button>
                  </div>

                  <div
                    data-lenis-prevent="true"
                    className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 max-h-60 overflow-y-auto pr-1"
                  >
                    {(viewAllDocs ? selectedSubmission.documents : selectedSubmission.documents.slice(0, 4)).map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 transition gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate text-xs font-medium">{doc.name || doc.fileName}</span>
                          {(doc.sourceType === 'VENDOR_VAULT' || doc.source === 'VENDOR_VAULT') ? (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                              Vault
                            </span>
                          ) : (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                              Tender Upload
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          <span className="text-xs text-slate-400">{doc.size}</span>
                          {(doc.cloudinaryUrl || doc.url) && (
                            <a
                              href={doc.cloudinaryUrl || doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-semibold hover:underline"
                              title="View Document PDF"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>PDF</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    {!viewAllDocs && selectedSubmission.docCount > 4 && (
                      <p className="text-xs text-slate-400 italic pt-0.5 text-center">
                        ...and {selectedSubmission.docCount - 4} more files
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* Primary Action: Evaluate Proposal / ML Clearance */}
              <button
                type="button"
                onClick={() => setEvaluationModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Evaluate Bidder &amp; Issue Clearance</span>
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChatBotOpen(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chat with AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenCompliance && onOpenCompliance(selectedSubmission)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-semibold transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-slate-500" />
                  <span>Detailed Audit</span>
                </button>
              </div>
            </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- 6.5 OFFICER PROCUREMENT CLEARANCE MODAL -------------------- */}
      <ProcurementClearanceModal
        isOpen={evaluationModalOpen}
        onClose={() => {
          setEvaluationModalOpen(false);
          setEvalError(null);
        }}
        submission={selectedSubmission}
        verdict={evalVerdict}
        setVerdict={setEvalVerdict}
        remarks={evalRemarks}
        setRemarks={setEvalRemarks}
        isSubmitting={evalSubmitting}
        onConfirm={handleConfirmEvaluation}
        errorMessage={evalError}
      />

      {/* Action Notification Toast */}
      {actionToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-200 animate-in slide-in-from-bottom-4 duration-300 max-w-md"
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              actionToast.verdict === 'CLEARED'
                ? 'bg-emerald-500/20 text-emerald-400 dark:text-emerald-600'
                : actionToast.verdict === 'CONDITIONALLY_CLEARED'
                ? 'bg-amber-500/20 text-amber-400 dark:text-amber-600'
                : 'bg-rose-500/20 text-rose-400 dark:text-rose-600'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold">{actionToast.title}</p>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5 leading-relaxed">
              {actionToast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActionToast(null)}
            className="text-slate-400 hover:text-white dark:hover:text-slate-900 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Contextual Right-Side AI Evaluation Drawer */}
      <AiEvaluationDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        bidder={aiDrawerBidder || selectedSubmission}
        tenderId={filterTenderId || 'GEM/2024/B/5123981'}
        comparisonResult={comparisonResult}
        contextBidders={submissionsList}
        loading={compareLoading}
        onSelectBidder={(selected) => setAiDrawerBidder(selected)}
      />

      {/* Bidder Contextual Chatbot — Bound to POST /api/officer/tenders/chat */}
      <BidderChatBot
        isOpen={chatBotOpen}
        onClose={() => setChatBotOpen(false)}
        bidderData={selectedSubmission}
        tenderId={selectedSubmission?.tenderId || filterTenderId || '1'}
        bidderId={selectedSubmission?.bidderId || selectedSubmission?.id || 'BID-007'}
      />

      {/* QCBS Top 10 Bidders Evaluation Modal */}
      {qcbsModalTender && (
        <TenderDetailModal
          tender={qcbsModalTender}
          initialTab="qcbs"
          onClose={() => setQcbsModalTender(null)}
        />
      )}
    </div>
  );
};

export default TenderSubmissionsView;
