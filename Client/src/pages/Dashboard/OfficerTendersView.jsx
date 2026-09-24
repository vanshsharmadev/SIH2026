import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  UploadCloud,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Download,
  Calendar,
  Layers,
  Award,
  Trophy,
  FileText,
  X,
  MapPin,
  CheckSquare,
} from 'lucide-react';
import { tenderService, recordAuditLog, processTenderPdf, documentService } from '../../services';
import { formatCurrencyINR, formatIndianLakhCrore, isTenderClosed, formatDate } from '../../utils';
import { useAuth } from '../../context';
import { isOfficerUser, getUserDisplayName } from '../../utils/roleUtils';
import { TenderDetailModal } from '../../components/tender';
import { getUnifiedSubmissions, mapServerSubmissionToView } from './TenderSubmissionsView';



const CATEGORIES = [
  'All',
  'Computers & IT Equipment',
  'Medical Devices',
  'Renewable Energy',
  'Security Systems',
  'Electric Vehicles',
  'Heavy Machinery',
  'Furniture & Furnishings',
  'Drones & Aerospace',
  'Cyber Security Services',
];

const DEPARTMENTS = [
  'All',
  'Ministry of Electronics & Information Technology (MeitY)',
  'Ministry of Health & Family Welfare (MoHFW)',
  'Ministry of New & Renewable Energy (MNRE)',
  'Ministry of Home Affairs (MHA)',
  'Ministry of Heavy Industries (FAME-III)',
  'Ministry of Defence',
  'Ministry of Railways',
];

const OfficerTendersView = ({
  onBackToDashboard,
  onOpenSubmissions,
  onOpenTopBidders,
  onOpenUploadExtract,
  onOpenCompliance,
  tenders: propTenders = [],
  onTendersUpdated,
}) => {
  const { user } = useAuth();
  const officerName = getUserDisplayName(user);
  const officerRole = user?.role || 'Procurement Officer';

  const getTenderSubmissionTargetId = (t) => {
    if (!t) return '';
    const titleMatch = String(t.title || '').match(/(GeM\/\d{4}\/[A-Za-z]\/\w+)/i);
    if (titleMatch) return titleMatch[1];
    return t.referenceNo || t.tenderId || t.id || '';
  };

  // ---------------------------------------------------------------------------
  // 1. DATA STATE & SYNC
  // ---------------------------------------------------------------------------
  const [localCreatedTenders, setLocalCreatedTenders] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('gem_created_tenders') || '[]');
      if (Array.isArray(stored)) return stored;
    } catch {}
    return [];
  });

  const [deletedTenderIds, setDeletedTenderIds] = useState(() => {
    try {
      const deleted = JSON.parse(localStorage.getItem('gem_deleted_tenders') || '[]');
      if (Array.isArray(deleted)) {
        return new Set(deleted.map((id) => String(id).trim().toLowerCase()));
      }
    } catch {}
    return new Set();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Dynamic submissions from unified store (syncing officer submissions & bidder applications)
  const [unifiedSubmissions, setUnifiedSubmissions] = useState(() => {
    try {
      return getUnifiedSubmissions();
    } catch {
      return [];
    }
  });

  // Fetch real-time submissions from backend API & localStorage
  const refreshSubmissions = useCallback(async () => {
    try {
      const localSubs = getUnifiedSubmissions();
      const serverSubs = await documentService.getAllSubmissions().catch(() => null);
      if (Array.isArray(serverSubs) && serverSubs.length > 0) {
        const mapped = serverSubs.map(mapServerSubmissionToView).filter(Boolean);
        const serverKeys = new Set(mapped.map((m) => String(m.id || `${m.tenderId}-${m.bidder}`)));
        const localOnly = (localSubs || []).filter(
          (p) => !serverKeys.has(String(p.id || `${p.tenderId}-${p.bidder}`))
        );
        setUnifiedSubmissions([...mapped, ...localOnly]);
      } else {
        setUnifiedSubmissions(localSubs);
      }
    } catch {
      setUnifiedSubmissions(getUnifiedSubmissions());
    }
  }, []);

  // Sync with localStorage & custom events
  const refreshTenders = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('gem_created_tenders') || '[]');
      if (Array.isArray(stored)) {
        setLocalCreatedTenders(stored);
      }
      const deleted = JSON.parse(localStorage.getItem('gem_deleted_tenders') || '[]');
      if (Array.isArray(deleted)) {
        setDeletedTenderIds(new Set(deleted.map((id) => String(id).trim().toLowerCase())));
      }
    } catch {}
    if (onTendersUpdated) {
      onTendersUpdated();
    }
  }, [onTendersUpdated]);

  useEffect(() => {
    refreshSubmissions();
    const handleSync = () => {
      refreshTenders();
      refreshSubmissions();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('gem_tenders_updated', handleSync);
    window.addEventListener('gem_officer_submissions_updated', handleSync);
    window.addEventListener('gem_submission_created', handleSync);
    window.addEventListener('gem_bidder_applications_updated', handleSync);

    const interval = setInterval(refreshSubmissions, 20000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('gem_tenders_updated', handleSync);
      window.removeEventListener('gem_officer_submissions_updated', handleSync);
      window.removeEventListener('gem_submission_created', handleSync);
      window.removeEventListener('gem_bidder_applications_updated', handleSync);
    };
  }, [refreshTenders, refreshSubmissions]);

  // Strict matcher to calculate how many submissions belong to a tender
  const countSubmissionsForTender = useCallback((tender, submissions) => {
    if (!tender) return 0;
    const explicit = parseInt(tender.submissions, 10) || parseInt(tender.bidCount, 10) || 0;
    if (!Array.isArray(submissions) || submissions.length === 0) return explicit;

    const clean = (val) => String(val || '').trim().toLowerCase();
    const stripGeM = (val) => clean(val).replace(/^gem\/2026\/b\//, '').replace(/^gem\//, '');

    const tId = clean(tender.id);
    const tRef = clean(tender.referenceNo);
    const tTdr = clean(tender.tenderId);
    const tTitle = clean(tender.title);

    const tIds = new Set([tId, tRef, tTdr, stripGeM(tId), stripGeM(tRef), stripGeM(tTdr)].filter(Boolean));

    let liveCount = 0;
    for (const s of submissions) {
      if (!s) continue;
      const sTid = clean(s.tenderId);
      const sRef = clean(s.tenderReferenceNo);
      const sRawTid = clean(s.rawTenderId);
      const sTitle = clean(s.tenderTitle || s.title);

      const sIds = [sTid, sRef, sRawTid, stripGeM(sTid), stripGeM(sRef), stripGeM(sRawTid)].filter(Boolean);

      let isMatch = false;

      // 1. Direct ID / Reference match
      for (const sid of sIds) {
        if (tIds.has(sid)) {
          isMatch = true;
          break;
        }
      }

      // 2. Exact Title match
      if (!isMatch && tTitle && sTitle && tTitle === sTitle) {
        isMatch = true;
      }

      if (isMatch) {
        liveCount += 1;
      }
    }

    return Math.max(liveCount, explicit);
  }, []);

  // Merged Tenders List (Prioritizing local session uploads, then propTenders, excluding deleted)
  const allTenders = useMemo(() => {
    const list = [];
    const seen = new Set();

    const isDeleted = (t) => {
      if (!t) return true;
      const id = String(t.id || '').trim().toLowerCase();
      const ref = String(t.referenceNo || '').trim().toLowerCase();
      const tId = String(t.tenderId || '').trim().toLowerCase();
      return (
        (Boolean(id) && deletedTenderIds.has(id)) ||
        (Boolean(ref) && deletedTenderIds.has(ref)) ||
        (Boolean(tId) && deletedTenderIds.has(tId))
      );
    };

    // 1. Locally created/uploaded tenders first
    for (const t of localCreatedTenders) {
      if (isDeleted(t)) continue;
      const key = String(t.id || t.referenceNo || t.tenderId);
      if (key && !seen.has(key)) {
        list.push({
          ...t,
          id: t.id || t.referenceNo || `TDR-${list.length + 1}`,
          referenceNo: t.referenceNo || t.id,
          submissions: countSubmissionsForTender(t, unifiedSubmissions),
          status: t.status || 'Active',
        });
        seen.add(key);
      }
    }

    // 2. Tenders passed from parent / API
    for (const t of propTenders) {
      if (isDeleted(t)) continue;
      const key = String(t.id || t.referenceNo || t.tenderId);
      if (key && !seen.has(key)) {
        list.push({
          ...t,
          id: t.id || t.referenceNo || `TDR-${list.length + 1}`,
          referenceNo: t.referenceNo || t.id,
          submissions: countSubmissionsForTender(t, unifiedSubmissions),
          status: t.status || 'Active',
        });
        seen.add(key);
      }
    }

    return list;
  }, [localCreatedTenders, propTenders, deletedTenderIds, unifiedSubmissions, countSubmissionsForTender]);

  // ---------------------------------------------------------------------------
  // 2. SEARCH, FILTER & SORT STATE
  // ---------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'EVALUATION' | 'DRAFT' | 'CLOSED'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'closing' | 'value-high' | 'value-low' | 'submissions'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [showFilters, setShowFilters] = useState(false); // Toggle filter dropdown panel
  const [showSearchToolbar, setShowSearchToolbar] = useState(true); // Toggle entire search & filters toolbar
  const filterDropdownRef = useRef(null);

  // Check if any filter or search query is currently active
  const isAnyFilterActive = useMemo(() => {
    return (
      Boolean(searchQuery.trim()) ||
      statusFilter !== 'ALL' ||
      categoryFilter !== 'All' ||
      departmentFilter !== 'All' ||
      sortBy !== 'newest'
    );
  }, [searchQuery, statusFilter, categoryFilter, departmentFilter, sortBy]);

  // Calculate active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== 'All') count += 1;
    if (departmentFilter !== 'All') count += 1;
    if (sortBy !== 'newest') count += 1;
    return count;
  }, [categoryFilter, departmentFilter, sortBy]);

  // Handle click outside & escape key to dismiss filter dropdown
  useEffect(() => {
    if (!showFilters) return;

    function handleClickOutside(event) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFilters]);

  // Selected Tender Details Modal
  const [activeDetailTender, setActiveDetailTender] = useState(null);

  // Delete confirmation modal state
  const [tenderToDelete, setTenderToDelete] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard`);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  // ---------------------------------------------------------------------------
  // 4. DELETE / ARCHIVE TENDER
  // ---------------------------------------------------------------------------
  const handleConfirmDeleteTender = async () => {
    if (!tenderToDelete) return;
    const targetId = tenderToDelete.id;
    const targetRef = tenderToDelete.referenceNo;
    const targetTenderId = tenderToDelete.tenderId;

    try {
      // 1. Call tenderService deleteTender (handles backend API, gem_created_tenders, gem_officer_tenders, and gem_deleted_tenders)
      await tenderService.deleteTender(targetId, targetRef, targetTenderId);

      // 2. Instantly update local component state
      const newDeleted = new Set(deletedTenderIds);
      if (targetId) newDeleted.add(String(targetId).trim().toLowerCase());
      if (targetRef) newDeleted.add(String(targetRef).trim().toLowerCase());
      if (targetTenderId) newDeleted.add(String(targetTenderId).trim().toLowerCase());
      setDeletedTenderIds(newDeleted);

      setLocalCreatedTenders((prev) =>
        prev.filter((t) => {
          const id = String(t.id || '').trim().toLowerCase();
          const ref = String(t.referenceNo || t.tenderId || '').trim().toLowerCase();
          return !newDeleted.has(id) && !newDeleted.has(ref);
        })
      );

      // 3. Record Audit Log
      recordAuditLog({
        activity: 'Tender Deleted & Archived',
        module: 'Tender Management',
        details: `Officer ${officerName} permanently removed tender record [${targetRef || targetId}]`,
        status: 'Warning',
        user: { name: officerName, role: officerRole },
      });

      // 4. Notify parent Dashboard component
      if (onTendersUpdated) {
        onTendersUpdated();
      }

      showToast(`Tender ${targetRef || targetId} successfully deleted.`);
    } catch (err) {
      console.error('Error removing tender:', err);
      showToast(`Failed to delete tender: ${err.message || 'Unknown error'}`);
    } finally {
      setTenderToDelete(null);
    }
  };

  // ---------------------------------------------------------------------------
  // 8. EXPORT TENDERS REGISTRY
  // ---------------------------------------------------------------------------
  const handleExportTendersJSON = () => {
    const dataStr = JSON.stringify(allTenders, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GeM_Tenders_Registry_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Tenders registry exported as JSON successfully.');
  };

  // ---------------------------------------------------------------------------
  // 9. METRICS CALCULATIONS
  // ---------------------------------------------------------------------------
  const metrics = useMemo(() => {
    const total = allTenders.length;
    const active = allTenders.filter((t) => {
      if (isTenderClosed(t)) return false;
      const s = (t.status || '').toLowerCase().trim();
      return (
        s === 'active' ||
        s === 'live' ||
        s === 'processed' ||
        s === 'open' ||
        s === 'published' ||
        !s
      );
    }).length;
    const underReview = allTenders.filter(
      (t) =>
        (t.status || '').toLowerCase().includes('review') ||
        (t.status || '').toLowerCase().includes('evaluation') ||
        (t.status || '').toLowerCase() === 'compliance issue'
    ).length;
    const closed = allTenders.filter((t) => isTenderClosed(t)).length;

    let totalValue = 0;
    allTenders.forEach((t) => {
      const val = parseFloat(t.estimatedValue) || parseFloat(String(t.value).replace(/[^0-9.-]+/g, '')) || 0;
      totalValue += val;
    });

    // Total vendor submissions received across the portal (matches Submissions tab)
    const totalBids = unifiedSubmissions.length;

    return {
      total,
      active,
      underReview,
      closed,
      totalValue: formatIndianLakhCrore(totalValue),
      totalBids,
    };
  }, [allTenders, unifiedSubmissions]);

  // ---------------------------------------------------------------------------
  // 10. FILTERED & SORTED TENDERS LIST
  // ---------------------------------------------------------------------------
  const filteredTenders = useMemo(() => {
    return allTenders
      .filter((t) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (t.title || '').toLowerCase().includes(q);
          const matchRef = (t.referenceNo || t.id || '').toLowerCase().includes(q);
          const matchDept = (t.department || t.ministry || '').toLowerCase().includes(q);
          const matchCat = (t.category || '').toLowerCase().includes(q);
          const matchLoc = (t.location || '').toLowerCase().includes(q);
          if (!matchTitle && !matchRef && !matchDept && !matchCat && !matchLoc) {
            return false;
          }
        }

        // Status Filter
        if (statusFilter !== 'ALL') {
          const s = (t.status || '').toLowerCase().trim();
          if (
            statusFilter === 'ACTIVE' &&
            !(s === 'active' || s === 'live' || s === 'processed' || s === 'open' || s === 'published' || !s)
          )
            return false;
          if (statusFilter === 'EVALUATION' && !(s.includes('review') || s.includes('evaluation'))) return false;
          if (statusFilter === 'DRAFT' && !s.includes('draft')) return false;
          if (statusFilter === 'CLOSED' && !isTenderClosed(t)) return false;
        }

        // Category Filter
        if (categoryFilter !== 'All') {
          if ((t.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
        }

        // Department Filter
        if (departmentFilter !== 'All') {
          const dept = (t.department || t.ministry || '').toLowerCase();
          if (!dept.includes(departmentFilter.toLowerCase())) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'closing') {
          const aDays = parseInt(String(a.daysLeft || 999).replace(/[^0-9]+/g, ''), 10) || 999;
          const bDays = parseInt(String(b.daysLeft || 999).replace(/[^0-9]+/g, ''), 10) || 999;
          return aDays - bDays;
        }
        if (sortBy === 'value-high') {
          const valA = parseFloat(a.estimatedValue) || 0;
          const valB = parseFloat(b.estimatedValue) || 0;
          return valB - valA;
        }
        if (sortBy === 'value-low') {
          const valA = parseFloat(a.estimatedValue) || 0;
          const valB = parseFloat(b.estimatedValue) || 0;
          return valA - valB;
        }
        if (sortBy === 'submissions') {
          const sA = parseInt(a.submissions || 0, 10);
          const sB = parseInt(b.submissions || 0, 10);
          return sB - sA;
        }
        // Default: newest
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [allTenders, searchQuery, statusFilter, categoryFilter, departmentFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-200 text-sm font-medium animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:opacity-75 cursor-pointer ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}



      {/* ===================================================================== */}
      {/* 2. KPI METRICS CARDS                                                  */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tenders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-400">in registry</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>All procurement files under monitoring</span>
          </div>
        </div>

        {/* Active / Published */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Live &amp; Active Tenders</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.active}
            </span>
            <span className="text-xs text-slate-400">open for bidding</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Accepting commercial vendor submissions</span>
          </div>
        </div>

        {/* Total Estimated Value */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Procurement Value</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.totalValue}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Combined contract values across ministries</span>
          </div>
        </div>

        {/* Total Bids Received */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vendor Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {metrics.totalBids}
            </span>
            <span className="text-xs text-slate-400">bids received</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Audited with automated AI scoring</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. TENDERS SECTION HEADER & TOOLBAR TOGGLE                            */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Tender Registry
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                {filteredTenders.length} {filteredTenders.length === 1 ? 'tender' : 'tenders'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Search, filter, monitor and manage official GeM procurement files
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Quick View Mode Toggle (always accessible) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#202020] border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#303030] text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#303030] text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
              title="Data Table View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={refreshTenders}
            title="Refresh Registry"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#202020] text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Toggle Entire Search & Filters Section Button */}
          <button
            type="button"
            onClick={() => setShowSearchToolbar((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shadow-2xs ${
              showSearchToolbar || isAnyFilterActive
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#202020]'
            }`}
            title={showSearchToolbar ? 'Hide search and filters' : 'Show search and filters'}
          >
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{showSearchToolbar ? 'Hide Search & Filters' : 'Show Search & Filters'}</span>
            {isAnyFilterActive && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showSearchToolbar ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. SEARCH, FILTERS & VIEW MODE TOOLBAR (Collapsible)                  */}
      {/* ===================================================================== */}
      {showSearchToolbar && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tender title, GEM ref number, ministry..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#202020] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Dropdown Toggle & Popover Menu */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  showFilters || activeFiltersCount > 0
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#202020]'
                }`}
                title={showFilters ? 'Hide filter dropdown' : 'Show filter dropdown'}
                aria-expanded={showFilters}
                aria-label="Toggle filter dropdown"
              >
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showFilters ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Filter Dropdown Popover */}
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-[320px] sm:w-[380px] p-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 shadow-2xl z-50 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Filter & Sort Tenders
                      </span>
                      {activeFiltersCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                          {activeFiltersCount} Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryFilter('All');
                            setDepartmentFilter('All');
                            setSortBy('newest');
                            showToast('Filters reset to default.');
                          }}
                          className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          Reset All
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowFilters(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] cursor-pointer"
                        title="Close filters"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Options */}
                  <div className="space-y-3.5">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#282828] text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat === 'All' ? 'All Categories' : cat}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Ministry / Department Filter */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Ministry / Department
                      </label>
                      <div className="relative">
                        <select
                          value={departmentFilter}
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                          className="w-full text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#282828] text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                        >
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept === 'All' ? 'All Ministries / Departments' : dept}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Sort Order */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Sort By
                      </label>
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#282828] text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                        >
                          <option value="newest">Newest Published First</option>
                          <option value="closing">Deadline / Closing Soonest</option>
                          <option value="value-high">Estimated Value (High to Low)</option>
                          <option value="value-low">Estimated Value (Low to High)</option>
                          <option value="submissions">Highest Vendor Submissions</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Footer */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Found <strong className="text-slate-800 dark:text-slate-200">{filteredTenders.length}</strong> matching tenders
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition"
                    >
                      Apply & Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#202020] border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-[#303030] text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#303030] text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="Data Table View"
              >
                <ListFilter className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={refreshTenders}
              title="Refresh Registry"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#202020] text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Export */}
            <button
              type="button"
              onClick={handleExportTendersJSON}
              title="Export Registry as JSON"
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#202020] text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Collapse / Hide Toolbar Button */}
            <button
              type="button"
              onClick={() => setShowSearchToolbar(false)}
              title="Hide search & filters toolbar"
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#202020] text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Hide</span>
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
          {[
            { id: 'ALL', label: 'All Tenders', count: allTenders.length },
            { id: 'ACTIVE', label: 'Active / Live', count: metrics.active },
            { id: 'EVALUATION', label: 'Under Review', count: metrics.underReview },
            {
              id: 'DRAFT',
              label: 'Drafts',
              count: allTenders.filter((t) => (t.status || '').toLowerCase() === 'draft').length,
            },
            { id: 'CLOSED', label: 'Closed / Archived', count: metrics.closed },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === pill.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-[#202020] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#282828] border border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  statusFilter === pill.id
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}

          {/* Active Category Tag Chip */}
          {categoryFilter !== 'All' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 whitespace-nowrap">
              <span>Category: {categoryFilter}</span>
              <button
                type="button"
                onClick={() => setCategoryFilter('All')}
                className="hover:text-rose-500 cursor-pointer p-0.5"
                title="Remove category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Active Department Tag Chip */}
          {departmentFilter !== 'All' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 whitespace-nowrap">
              <span className="max-w-[160px] truncate">Ministry: {departmentFilter}</span>
              <button
                type="button"
                onClick={() => setDepartmentFilter('All')}
                className="hover:text-rose-500 cursor-pointer p-0.5"
                title="Remove ministry filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Reset Filters button if active filters */}
          {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'All' || departmentFilter !== 'All' || sortBy !== 'newest') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCategoryFilter('All');
                setDepartmentFilter('All');
                setSortBy('newest');
              }}
              className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
      )}

      {/* Compact strip shown when toolbar is hidden but filters are active */}
      {!showSearchToolbar && isAnyFilterActive && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Active Filters:
            </span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#202020] text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Search: "{searchQuery}"
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#202020] text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Status: {statusFilter}
              </span>
            )}
            {categoryFilter !== 'All' && (
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#202020] text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Category: {categoryFilter}
              </span>
            )}
            {departmentFilter !== 'All' && (
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#202020] text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Ministry: {departmentFilter}
              </span>
            )}
            {sortBy !== 'newest' && (
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#202020] text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Sort: {sortBy}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCategoryFilter('All');
                setDepartmentFilter('All');
                setSortBy('newest');
                showToast('All filters cleared.');
              }}
              className="text-rose-600 dark:text-rose-400 hover:underline font-bold text-[11px] cursor-pointer"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={() => setShowSearchToolbar(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[11px] cursor-pointer"
            >
              Open Filters
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. TENDERS LIST RENDER (CARDS OR TABLE)                               */}
      {/* ===================================================================== */}
      {filteredTenders.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Tenders Found Matching Criteria
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'All'
              ? 'Try resetting your search query or adjusting your filters to view other procurement notices.'
              : 'No tenders are registered yet. Click below to upload and publish your first tender.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setCategoryFilter('All');
                  setDepartmentFilter('All');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#202020] text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
            {onOpenUploadExtract && (
              <button
                type="button"
                onClick={onOpenUploadExtract}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Tender via Studio</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* ================= CARDS VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTenders.map((item) => {
            const isClosed = isTenderClosed(item);
            const daysNum = parseInt(String(item.daysLeft || 0).replace(/[^0-9]+/g, ''), 10);
            const isUrgent = !isClosed && daysNum > 0 && daysNum <= 5;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs hover:border-blue-300 dark:hover:border-blue-700/60 transition-all group overflow-hidden"
              >
                <div className="p-5 space-y-3.5">
                  {/* Card Header: Ref & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200/70 dark:border-blue-800/50">
                        {item.referenceNo || item.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(item.referenceNo || item.id, item.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer transition"
                        title="Copy Reference Number"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                        isClosed
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                          : item.status === 'Draft'
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          : item.status === 'Under review' || item.status === 'Under evaluation'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                      }`}
                    >
                      {item.status || 'Active'}
                    </span>
                  </div>

                  {/* Title & Department */}
                  <div>
                    <h3
                      onClick={() => setActiveDetailTender(item)}
                      className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition"
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{item.department || item.ministry || 'Government Ministry'}</span>
                    </div>
                  </div>

                  {/* Badges / Category / Local Content */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {item.category && (
                      <span className="px-2 py-0.5 text-[10.5px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.category}
                      </span>
                    )}
                    {item.minLocalContent && (
                      <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                        MII: {item.minLocalContent}
                      </span>
                    )}
                    {item.gfr144xi && (
                      <span className="px-2 py-0.5 text-[10.5px] font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                        GFR 144(xi)
                      </span>
                    )}
                  </div>

                  {/* Value & EMD Grid */}
                  <div className="pt-2 border-t border-slate-100 dark:border-[#282828] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">Estimated Value</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.value || formatIndianLakhCrore(item.estimatedValue) || '₹ 50.00 Lakh'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">EMD Amount</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                        {item.emdAmount || 'Exempted (MSME)'}
                      </span>
                    </div>
                  </div>

                  {/* Submission quota & Deadline */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-[#282828]">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span
                        className={`font-semibold ${
                          isClosed
                            ? 'text-rose-600 dark:text-rose-400'
                            : isUrgent
                            ? 'text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isClosed ? 'Closed' : `${item.daysLeft || '21 days'} remaining`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenSubmissions && onOpenSubmissions(getTenderSubmissionTargetId(item))}
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span>{item.submissions || 0} Bids</span>
                    </button>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-[#202020] border-t border-slate-100 dark:border-[#282828] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveDetailTender(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#2c2c2c] border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Details</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTenderToDelete(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    title="Archive / Remove Tender"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-[#282828] bg-slate-50/70 dark:bg-slate-800/40">
                  <th scope="col" className="py-3.5 px-4 font-bold whitespace-nowrap">
                    Reference No
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-bold whitespace-nowrap min-w-[280px]">
                    Title &amp; Ministry
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-bold whitespace-nowrap">
                    Category
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-bold whitespace-nowrap">
                    Estimated Value
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-bold whitespace-nowrap">
                    Deadline
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center whitespace-nowrap">
                    Bids
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-bold whitespace-nowrap">
                    Status
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#282828] font-medium">
                {filteredTenders.map((item) => {
                  const isClosed = isTenderClosed(item);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#202020] transition-colors"
                    >
                      {/* Ref No */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {item.referenceNo || item.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(item.referenceNo || item.id, item.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer transition"
                            title="Copy Ref"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Title & Ministry */}
                      <td className="py-3 px-4 min-w-[280px]">
                        <button
                          type="button"
                          onClick={() => setActiveDetailTender(item)}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left cursor-pointer block line-clamp-1"
                        >
                          {item.title}
                        </button>
                        <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                          {item.department || item.ministry || 'Government Ministry'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700">
                          {item.category || 'General'}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                        {item.value || formatIndianLakhCrore(item.estimatedValue) || '₹ 50.00 Lakh'}
                      </td>

                      {/* Deadline */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className={isClosed ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                            {item.closes || item.closingDate || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Submissions Count */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => onOpenSubmissions && onOpenSubmissions(getTenderSubmissionTargetId(item))}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-100 cursor-pointer"
                        >
                          <span>{item.submissions || 0}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                            isClosed
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                              : item.status === 'Draft'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                          }`}
                        >
                          {item.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveDetailTender(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="View Tender Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTenderToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                            title="Archive Tender"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. DELETE / ARCHIVE CONFIRMATION MODAL                                */}
      {/* ===================================================================== */}
      {tenderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#303030] shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Tender Dossier?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to permanently delete tender{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {tenderToDelete.referenceNo || tenderToDelete.id}
                </strong>
                ? This will remove the tender from all portal records, listings, and vendor dashboards, and record an audit entry.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTenderToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#202020] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTender}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer"
              >
                Delete Tender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. DETAILED TENDER MODAL                                              */}
      {/* ===================================================================== */}
      {activeDetailTender && (
        <TenderDetailModal
          tender={activeDetailTender}
          onClose={() => setActiveDetailTender(null)}
          onOpenSubmissions={onOpenSubmissions}
          initialTab="overview"
        />
      )}
    </div>
  );
};

export default OfficerTendersView;
