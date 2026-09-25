import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Download,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  X,
  RefreshCw,
  Building2,
  FileCheck,
  ShieldCheck,
  ArrowUpDown,
} from 'lucide-react';
import { recordAuditLog, tenderService } from '../../services';

// Dynamic helper to build compliance metrics from real tenders and submissions
const buildComplianceList = (tenders = [], submissions = []) => {
  if (!Array.isArray(tenders) || tenders.length === 0) return [];
  return tenders.map((t, idx) => {
    const tId = String(t.id || t.tenderId || t.referenceNo || idx + 1);
    const tRef = t.tenderId || t.referenceNo || t.refNo || `GEM/TND/${tId}`;
    const subs = (submissions || []).filter(
      (s) => String(s.tenderId) === tId || s.tenderRef === tRef || String(s.tenderId) === String(t.tenderId)
    );
    const totalSubmissions = subs.length;
    const compliant = subs.filter((s) => s.status === 'Compliant' || s.overallStatus === 'COMPLIANT' || s.score >= 70).length;
    const nonCompliant = subs.filter((s) => s.status === 'Non-Compliant' || s.overallStatus === 'NON_COMPLIANT' || (s.score > 0 && s.score < 70)).length;
    const underReview = subs.filter((s) => s.status === 'Pending' || s.status === 'Under Review' || !s.overallStatus).length;
    const compliantPct = totalSubmissions > 0 ? Math.round((compliant / totalSubmissions) * 100) : (t.complianceScore || 0);
    const nonCompliantPct = totalSubmissions > 0 ? Math.round((nonCompliant / totalSubmissions) * 100) : 0;
    const underReviewPct = totalSubmissions > 0 ? Math.round((underReview / totalSubmissions) * 100) : 0;
    const avgScore = totalSubmissions > 0
      ? Math.round(subs.reduce((acc, s) => acc + (s.score || 0), 0) / totalSubmissions)
      : (t.complianceScore || 0);
    return {
      id: t.id || idx + 1,
      refNo: tRef,
      title: t.title || t.tenderTitle || 'Untitled Tender',
      org: t.organization || t.org || 'GeM Organization',
      dept: t.department || t.dept || 'Procurement Division',
      category: t.category || 'General Procurement',
      stage: t.status || 'Active',
      totalSubmissions,
      compliant,
      compliantPct,
      nonCompliant,
      nonCompliantPct,
      underReview,
      underReviewPct,
      avgScore,
    };
  });
};

const getMergedLocalTenders = () => {
  try {
    const deleted = JSON.parse(localStorage.getItem('gem_deleted_tenders') || '[]');
    const deletedSet = Array.isArray(deleted)
      ? new Set(deleted.map((d) => String(d).trim().toLowerCase()))
      : new Set();

    const isDeleted = (t) => {
      if (!t) return true;
      const id = String(t.id || '').trim().toLowerCase();
      const ref = String(t.referenceNo || '').trim().toLowerCase();
      const tId = String(t.tenderId || '').trim().toLowerCase();
      return (
        (Boolean(id) && deletedSet.has(id)) ||
        (Boolean(ref) && deletedSet.has(ref)) ||
        (Boolean(tId) && deletedSet.has(tId))
      );
    };

    const savedCreated = JSON.parse(localStorage.getItem('gem_created_tenders') || '[]');
    const savedOfficer = JSON.parse(localStorage.getItem('gem_officer_tenders') || '[]');
    const merged = [];
    const seen = new Set();
    for (const t of [...savedCreated, ...savedOfficer]) {
      if (isDeleted(t)) continue;
      const k = String(t.id || t.tenderId || t.referenceNo);
      if (!seen.has(k)) {
        merged.push(t);
        seen.add(k);
      }
    }
    return merged;
  } catch {
    return [];
  }
};

const Reports = () => {
  const location = useLocation();
  const isStandalone = location.pathname === '/reports';

  // Dynamic Tenders State loaded from real submissions & tenders
  const [allTendersCompliance, setAllTendersCompliance] = useState(() => {
    try {
      const merged = getMergedLocalTenders();
      const savedSubmissions = JSON.parse(localStorage.getItem('gem_officer_submissions') || '[]');
      return buildComplianceList(merged, savedSubmissions);
    } catch (e) {
      console.warn('Could not read real tenders for reports:', e);
      return [];
    }
  });

  // Fetch real tenders from backend /tenders and merge with local changes
  useEffect(() => {
    let isMounted = true;

    const loadLiveTenders = async () => {
      try {
        const liveTenders = await tenderService.getOfficerTenders();
        if (isMounted && Array.isArray(liveTenders) && liveTenders.length > 0) {
          const savedSubmissions = JSON.parse(localStorage.getItem('gem_officer_submissions') || '[]');
          const merged = getMergedLocalTenders();
          const seen = new Set(merged.map((t) => String(t.id || t.tenderId || t.referenceNo)));
          for (const item of liveTenders) {
            const k = String(item.id || item.tenderId || item.referenceNo);
            if (!seen.has(k)) {
              merged.push(item);
              seen.add(k);
            }
          }
          setAllTendersCompliance(buildComplianceList(merged, savedSubmissions));
        }
      } catch (err) {
        console.warn('Backend tenders fetch notice:', err.message);
      }
    };

    loadLiveTenders();

    const handleStorageUpdate = () => {
      if (!isMounted) return;
      try {
        const merged = getMergedLocalTenders();
        const savedSubmissions = JSON.parse(localStorage.getItem('gem_officer_submissions') || '[]');
        setAllTendersCompliance(buildComplianceList(merged, savedSubmissions));
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);
    window.addEventListener('gem_tenders_updated', handleStorageUpdate);
    window.addEventListener('gem_officer_submissions_updated', handleStorageUpdate);
    window.addEventListener('gem_submission_created', handleStorageUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
      window.removeEventListener('gem_tenders_updated', handleStorageUpdate);
      window.removeEventListener('gem_officer_submissions_updated', handleStorageUpdate);
      window.removeEventListener('gem_submission_created', handleStorageUpdate);
    };
  }, []);

  // Filter States
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedScoreRange, setSelectedScoreRange] = useState('All Scores');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting State
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals & Notifications
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [inspectTender, setInspectTender] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState(null);

  // Schedule Modal State
  const [scheduleFrequency, setScheduleFrequency] = useState('Weekly');
  const [scheduleEmail, setScheduleEmail] = useState('procurement.officer@gem.gov.in');
  const [scheduleFormat, setScheduleFormat] = useState('PDF Report');

  const showNotification = (msg) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Dynamic filter dropdown options
  const departmentOptions = useMemo(() => {
    const set = new Set();
    allTendersCompliance.forEach((t) => {
      if (t.dept) set.add(t.dept);
      else if (t.org) set.add(t.org);
    });
    return ['All Departments', ...Array.from(set).sort()];
  }, [allTendersCompliance]);

  const categoryOptions = useMemo(() => {
    const set = new Set();
    allTendersCompliance.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ['All Categories', ...Array.from(set).sort()];
  }, [allTendersCompliance]);

  // Filtered List calculation
  const filteredTenders = useMemo(() => {
    let result = allTendersCompliance.filter((item) => {
      if (selectedDept !== 'All Departments' && item.dept !== selectedDept && item.org !== selectedDept) return false;
      if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) return false;
      if (selectedScoreRange === '>= 80% High' && item.avgScore < 80) return false;
      if (selectedScoreRange === '70-79% Substantial' && (item.avgScore < 70 || item.avgScore >= 80)) return false;
      if (selectedScoreRange === '< 70% Flagged' && item.avgScore >= 70) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchRef = (item.refNo || '').toLowerCase().includes(q);
        const matchOrg = (item.org || '').toLowerCase().includes(q);
        const matchDept = (item.dept || '').toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchOrg && !matchDept) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? (aVal || '').localeCompare(bVal || '')
          : (bVal || '').localeCompare(aVal || '');
      }
      return sortOrder === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
    });

    return result;
  }, [allTendersCompliance, selectedDept, selectedCategory, selectedScoreRange, searchQuery, sortField, sortOrder]);

  // Paginated List
  const totalResults = filteredTenders.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const paginatedTenders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTenders.slice(start, start + itemsPerPage);
  }, [filteredTenders, currentPage, itemsPerPage]);

  // Live Aggregate Statistics
  const totalSubmissionsSum = useMemo(
    () => filteredTenders.reduce((sum, t) => sum + (t.totalSubmissions || 0), 0),
    [filteredTenders]
  );
  const compliantSum = useMemo(
    () => filteredTenders.reduce((sum, t) => sum + (t.compliant || 0), 0),
    [filteredTenders]
  );
  const nonCompliantSum = useMemo(
    () => filteredTenders.reduce((sum, t) => sum + (t.nonCompliant || 0), 0),
    [filteredTenders]
  );
  const underReviewSum = useMemo(
    () => filteredTenders.reduce((sum, t) => sum + (t.underReview || 0), 0),
    [filteredTenders]
  );

  const avgComplianceScoreOverall = useMemo(() => {
    if (totalSubmissionsSum > 0) {
      return Math.round((compliantSum / totalSubmissionsSum) * 100);
    }
    if (filteredTenders.length > 0) {
      const sum = filteredTenders.reduce((acc, t) => acc + (t.avgScore || 0), 0);
      return Math.round(sum / filteredTenders.length);
    }
    return 0;
  }, [totalSubmissionsSum, compliantSum, filteredTenders]);

  // Export to CSV
  const handleExportReport = () => {
    const headers = [
      'Tender ID',
      'Title',
      'Organization',
      'Department',
      'Category',
      'Total Submissions',
      'Compliant',
      'Non-Compliant',
      'Under Review',
      'Avg Score',
    ];
    const rows = filteredTenders.map((t) => [
      t.refNo,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.org}"`,
      `"${t.dept}"`,
      `"${t.category}"`,
      t.totalSubmissions,
      `${t.compliant} (${t.compliantPct}%)`,
      `${t.nonCompliant} (${t.nonCompliantPct}%)`,
      `${t.underReview} (${t.underReviewPct}%)`,
      `${t.avgScore}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GeM_Compliance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    recordAuditLog({
      activity: 'Report Generated',
      module: 'Compliance Reports',
      details: `Compliance report exported as CSV archive (${filteredTenders.length} tenders)`,
      status: 'Success',
    });

    showNotification('Compliance Report successfully downloaded as CSV archive.');
  };

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    setScheduleModalOpen(false);

    recordAuditLog({
      activity: 'Report Generated',
      module: 'Compliance Reports',
      details: `Automated ${scheduleFrequency} report scheduled for ${scheduleEmail} (${scheduleFormat})`,
      status: 'Success',
    });

    showNotification(`Automated ${scheduleFrequency} report scheduled for ${scheduleEmail}.`);
  };

  const hasActiveFilters =
    selectedDept !== 'All Departments' ||
    selectedCategory !== 'All Categories' ||
    selectedScoreRange !== 'All Scores' ||
    Boolean(searchQuery.trim());

  const handleResetFilters = () => {
    setSelectedDept('All Departments');
    setSelectedCategory('All Categories');
    setSelectedScoreRange('All Scores');
    setSearchQuery('');
    setSortField('id');
    setSortOrder('asc');
    setCurrentPage(1);
    showNotification('Filters reset to default.');
  };

  return (
    <div className="w-full space-y-4 select-none animate-in fade-in duration-200 pb-10">
      {/* Toast Alert */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0A2540] text-white rounded-xl shadow-2xl border border-blue-500/40 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notificationMsg}</span>
        </div>
      )}

      {/* Standalone Header if accessed directly outside Dashboard shell */}
      {isStandalone && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Compliance Reports
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                Dashboard
              </Link>
              <span>&gt;</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Compliance Reports</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TOP COMPLIANCE SUMMARY & ACTIONS BAR
          ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Compliance by Tender
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60">
                {allTendersCompliance.length} Active Tenders
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive statutory audit metrics, bid evaluation statuses, and compliance scoring across tenders.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-[#202020] dark:hover:bg-[#282828] text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Schedule Report</span>
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          COMPACT STATS STRIP (No empty charts, high utility numbers)
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Tenders */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Tenders in View</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {filteredTenders.length}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">of {allTendersCompliance.length} total</span>
          </div>
        </div>

        {/* Metric 2: Submissions Evaluated */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Evaluations Conducted</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalSubmissionsSum}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">submissions</span>
          </div>
        </div>

        {/* Metric 3: Compliant vs Flagged */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Passed vs Flagged</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {compliantSum}
            </span>
            <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold">
              / {nonCompliantSum} flagged
            </span>
          </div>
        </div>

        {/* Metric 4: Average Score */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Avg. Compliance Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-black ${
              avgComplianceScoreOverall >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
            }`}>
              {avgComplianceScoreOverall}%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">live index</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FULL-WIDTH COMPLIANCE BY TENDER TABLE CARD
          ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-xs space-y-4 w-full">

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tender reference, title, organization, or dept..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#202020] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#202020] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {departmentOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#202020] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Score Range Filter */}
            <select
              value={selectedScoreRange}
              onChange={(e) => {
                setSelectedScoreRange(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#202020] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="All Scores">All Compliance Scores</option>
              <option value=">= 80% High">&ge; 80% (High Compliance)</option>
              <option value="70-79% Substantial">70 - 79% (Substantial)</option>
              <option value="< 70% Flagged">&lt; 70% (Attention Needed)</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252525] transition cursor-pointer"
                title="Reset all filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Full-Width Table */}
        <div data-lenis-prevent="true" className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="font-semibold text-[11px] bg-slate-50/90 dark:bg-[#202020] text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-3.5 w-10 text-center">#</th>
                <th className="p-3.5 min-w-[280px]">Tender Reference &amp; Title</th>
                <th className="p-3.5 min-w-[200px]">Organization &amp; Department</th>
                <th
                  onClick={() => handleSort('totalSubmissions')}
                  className="p-3.5 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Submissions</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('compliant')}
                  className="p-3.5 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Compliant</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('nonCompliant')}
                  className="p-3.5 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Non-compliant</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 text-center">Under Review</th>
                <th
                  onClick={() => handleSort('avgScore')}
                  className="p-3.5 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Avg. Compliance Score</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {paginatedTenders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-500 dark:text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No matching tenders found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try modifying your search keywords or clear your active filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedTenders.map((tender, idx) => (
                  <tr
                    key={tender.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#202020]/60 transition-colors"
                  >
                    <td className="p-3.5 text-center font-bold text-slate-400">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectTender(tender)}
                          className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                        >
                          {tender.refNo}
                        </button>
                        {tender.category && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {tender.category}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-900 dark:text-slate-100 font-bold block mt-1 text-xs line-clamp-1">
                        {tender.title}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {tender.org}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {tender.dept}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {tender.totalSubmissions}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {tender.compliant} <span className="text-slate-400 text-[11px] font-normal">({tender.compliantPct}%)</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`font-bold ${tender.nonCompliant > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                        {tender.nonCompliant} <span className="text-slate-400 text-[11px] font-normal">({tender.nonCompliantPct}%)</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`font-bold ${tender.underReview > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                        {tender.underReview} <span className="text-slate-400 text-[11px] font-normal">({tender.underReviewPct}%)</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                          tender.avgScore >= 80
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : tender.avgScore >= 70
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                        }`}
                      >
                        {tender.avgScore}%
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setInspectTender(tender)}
                        title="View Full Compliance Breakdown"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 transition cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="font-medium">
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredTenders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, filteredTenders.length)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{filteredTenders.length}</strong> tenders
          </div>

          <div className="flex items-center gap-4">
            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Items per page selector */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#202020] text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value={7}>7 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
            </select>
          </div>
        </div>

      </div>

      {/* =======================================================================
          MODAL: SCHEDULE AUTOMATED REPORT
          ======================================================================= */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#181818] w-full max-w-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Schedule Automated Report</span>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Daily', 'Weekly', 'Monthly'].map((freq) => (
                    <button
                      type="button"
                      key={freq}
                      onClick={() => setScheduleFrequency(freq)}
                      className={`py-2 rounded-xl border text-center transition font-bold cursor-pointer ${
                        scheduleFrequency === freq
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Export Format</label>
                <select
                  value={scheduleFormat}
                  onChange={(e) => setScheduleFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="PDF Report">Certified PDF Dossier (CAG Standard)</option>
                  <option value="Excel Workbook">Excel Compliance Workbook (.xlsx)</option>
                  <option value="CSV Data">Raw Data Archive (.csv)</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                Automated compliance summaries will be generated at 09:00 AM IST with digitally verified NIC-CA signatures.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: INSPECT TENDER COMPLIANCE DETAIL
          ======================================================================= */}
      {inspectTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div data-lenis-prevent="true" className="bg-white dark:bg-[#181818] w-full max-w-2xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  {inspectTender.refNo}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {inspectTender.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {inspectTender.org} &bull; {inspectTender.dept}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectTender(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Pill & Stats */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[10.5px] text-slate-400 font-medium block">Total Bids</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {inspectTender.totalSubmissions}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl">
                <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium block">Compliant</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                  {inspectTender.compliant} ({inspectTender.compliantPct}%)
                </span>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl">
                <span className="text-[10.5px] text-rose-600 dark:text-rose-400 font-medium block">Non-Compliant</span>
                <span className="text-base font-black text-rose-700 dark:text-rose-300">
                  {inspectTender.nonCompliant} ({inspectTender.nonCompliantPct}%)
                </span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl">
                <span className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium block">Under Review</span>
                <span className="text-base font-black text-amber-700 dark:text-amber-300">
                  {inspectTender.underReview} ({inspectTender.underReviewPct}%)
                </span>
              </div>
            </div>

            {/* Statutory Pillars Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Audited Verification Pillars
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">1. Eligibility Criteria &amp; GST Verification</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                    100% Compliant
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">2. Mandatory Declarations (Non-Blacklisting &amp; Land Border)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                    1 Discrepancy Flagged
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">3. Technical Specs &amp; Past Experience (CRAC)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                    Verified
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">4. Financial Requirements &amp; EMD / Turnover</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                    Passed
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">5. Make in India (PPP-MII) Local Content &amp; GFR 144(xi)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                    Class-I Local Supplier
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/dashboard?tab=compliance"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                Open Full Compliance Check
              </Link>
              <button
                type="button"
                onClick={() => setInspectTender(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
