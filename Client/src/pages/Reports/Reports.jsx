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
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  Search,
  Check,
  X,
  Share2,
  Printer,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Building2,
  ShieldCheck,
  FileCheck,
  BarChart3,
  ExternalLink,
  HelpCircle,
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

  // Filters State
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30);
    const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${fmt(past)} - ${fmt(now)}`;
  });
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedOrg, setSelectedOrg] = useState('All Organizations');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStage, setSelectedStage] = useState('All Stages');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false); // Closed by default per user UX request
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [minScoreFilter, setMinScoreFilter] = useState(0);

  // Sorting State
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);

  // Modals & Drawers
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [reasonsModalOpen, setReasonsModalOpen] = useState(false);
  const [inspectTender, setInspectTender] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState(null);

  // Schedule Modal State
  const [scheduleFrequency, setScheduleFrequency] = useState('Weekly');
  const [scheduleEmail, setScheduleEmail] = useState('procurement.officer@gem.gov.in');
  const [scheduleFormat, setScheduleFormat] = useState('PDF Report');

  // Trend Chart Hover
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null);

  // Notification Banner
  const showNotification = (msg) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Handle Sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered List calculation
  const filteredTenders = useMemo(() => {
    let result = allTendersCompliance.filter((item) => {
      if (selectedDept !== 'All Departments' && item.org !== selectedDept) return false;
      if (selectedOrg !== 'All Organizations' && item.dept !== selectedOrg) return false;
      if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) return false;
      if (selectedStage !== 'All Stages' && item.stage !== selectedStage) return false;
      if (item.avgScore < minScoreFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchRef = item.refNo.toLowerCase().includes(q);
        const matchOrg = item.org.toLowerCase().includes(q);
        const matchDept = item.dept.toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchOrg && !matchDept) return false;
      }
      return true;
    });

    // Apply Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [allTendersCompliance, selectedDept, selectedOrg, selectedCategory, selectedStage, minScoreFilter, searchQuery, sortField, sortOrder]);

  // Paginated List
  const totalResults = filteredTenders.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const paginatedTenders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTenders.slice(start, start + itemsPerPage);
  }, [filteredTenders, currentPage, itemsPerPage]);

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
  const complianceRate = totalSubmissionsSum > 0 ? Math.round((compliantSum / totalSubmissionsSum) * 100) : 0;
  const nonComplianceRate = totalSubmissionsSum > 0 ? Math.round((nonCompliantSum / totalSubmissionsSum) * 100) : 0;
  const underReviewPct = totalSubmissionsSum > 0 ? Math.round((underReviewSum / totalSubmissionsSum) * 100) : 0;

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

  // 1. Dynamic Category Breakdown for Donut Chart
  const categoryData = useMemo(() => {
    const list = filteredTenders.length > 0 ? filteredTenders : allTendersCompliance;
    if (!list || list.length === 0) return [];
    const counts = {};
    for (const t of list) {
      const cat = t.category || 'General Procurement';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const total = list.length;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
      color: colors[idx % colors.length],
    }));
  }, [filteredTenders, allTendersCompliance]);

  // 2. Dynamic Compliance Trend Points for Interactive Curved Line Chart
  const trendPoints = useMemo(() => {
    const list = filteredTenders.length > 0 ? filteredTenders : allTendersCompliance;
    if (!list || list.length === 0) return [];

    const points = list.slice(0, 8).map((t, idx) => {
      const rawRef = String(t.refNo || t.id || `T-${idx + 1}`);
      const shortRef = rawRef.length > 8 ? rawRef.slice(-6) : rawRef;
      const comp = t.totalSubmissions > 0 ? t.compliantPct : (t.avgScore || 0);
      const nonComp = t.totalSubmissions > 0 ? t.nonCompliantPct : (comp > 0 ? Math.max(0, 100 - comp) : 0);
      return {
        date: shortRef,
        comp: Math.min(100, Math.max(0, comp)),
        nonComp: Math.min(100, Math.max(0, nonComp)),
        label: t.title,
      };
    });

    if (points.length === 1) {
      return [
        { date: 'Initial', comp: points[0].comp, nonComp: points[0].nonComp, label: `${points[0].label} (Baseline)` },
        points[0],
      ];
    }
    return points;
  }, [filteredTenders, allTendersCompliance]);

  // Dynamic live sparkline for KPI Card 1 (Overall Compliance)
  const kpiSparklinePoints = useMemo(() => {
    if (!trendPoints || trendPoints.length === 0) return '2,7 20,7 38,7';
    const pts = trendPoints.slice(-5);
    const min = Math.min(...pts.map((p) => p.comp));
    const max = Math.max(...pts.map((p) => p.comp));
    const range = max - min || 1;
    return pts
      .map((p, idx) => {
        const x = 2 + (idx / Math.max(1, pts.length - 1)) * 36;
        const y = 12 - ((p.comp - min) / range) * 9;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [trendPoints]);

  // Dynamic live sparkline for Average Compliance Score card
  const avgScoreSparklinePoints = useMemo(() => {
    if (!trendPoints || trendPoints.length === 0) return null;
    const pts = trendPoints.slice(-6);
    if (pts.length < 2) return null;
    const min = Math.min(...pts.map((p) => p.comp));
    const max = Math.max(...pts.map((p) => p.comp));
    const range = max - min || 1;
    const coords = pts.map((p, idx) => {
      const x = 5 + (idx / (pts.length - 1)) * 90;
      const y = 32 - ((p.comp - min) / range) * 24;
      return { x, y, str: `${x.toFixed(1)},${y.toFixed(1)}` };
    });
    return {
      pointsStr: coords.map((c) => c.str).join(' '),
      lastX: coords[coords.length - 1].x,
      lastY: coords[coords.length - 1].y,
    };
  }, [trendPoints]);

  // 3. Dynamic Score Distribution for Side Panel Mini Donut
  const scoreDistribution = useMemo(() => {
    const list = filteredTenders.length > 0 ? filteredTenders : allTendersCompliance;
    if (!list || list.length === 0) return [];
    const brackets = [
      { label: '90-100% (High)', count: 0, color: '#10B981' },
      { label: '70-89% (Substantial)', count: 0, color: '#3B82F6' },
      { label: '50-69% (Needs Review)', count: 0, color: '#F59E0B' },
      { label: '< 50% (Non-compliant)', count: 0, color: '#EF4444' },
    ];
    let total = 0;
    for (const t of list) {
      const score = t.avgScore !== undefined && t.avgScore > 0 ? t.avgScore : (t.compliantPct || 0);
      total += 1;
      if (score >= 90) brackets[0].count += 1;
      else if (score >= 70) brackets[1].count += 1;
      else if (score >= 50) brackets[2].count += 1;
      else brackets[3].count += 1;
    }
    return brackets.map((b) => ({
      ...b,
      pct: total > 0 ? Math.round((b.count / total) * 100) : 0,
    }));
  }, [filteredTenders, allTendersCompliance]);

  // 4. Dynamic Root Causes from real non-compliant submissions
  const rootCauses = useMemo(() => {
    const causesMap = {};
    let totalViolations = 0;

    try {
      const savedSubmissions = JSON.parse(localStorage.getItem('gem_officer_submissions') || '[]');
      for (const sub of savedSubmissions) {
        if (Array.isArray(sub.discrepancies) && sub.discrepancies.length > 0) {
          for (const disc of sub.discrepancies) {
            const reason = typeof disc === 'string' ? disc : (disc.clause || disc.title || disc.issue || 'Clause Discrepancy');
            causesMap[reason] = (causesMap[reason] || 0) + 1;
            totalViolations += 1;
          }
        } else if (sub.status === 'Non-Compliant' || sub.status === 'Minor Issues') {
          const reason = sub.remarks || sub.reason || 'Technical Parameter Discrepancy';
          causesMap[reason] = (causesMap[reason] || 0) + 1;
          totalViolations += 1;
        }
      }
    } catch (e) {
      console.warn('Error reading root causes:', e);
    }

    if (totalViolations === 0) {
      for (const t of allTendersCompliance) {
        if (t.nonCompliant > 0) {
          const reason = 'Eligibility & Scrutiny Discrepancy';
          causesMap[reason] = (causesMap[reason] || 0) + t.nonCompliant;
          totalViolations += t.nonCompliant;
        }
      }
    }

    if (totalViolations === 0) return [];

    return Object.entries(causesMap)
      .map(([reason, count]) => ({
        reason,
        desc: 'Identified by AI automated compliance scrutiny',
        count,
        pct: Math.round((count / totalViolations) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allTendersCompliance]);

  // Working CSV Download
  const handleExportReport = () => {
    const headers = [
      'Tender ID',
      'Title',
      'Organization',
      'Department',
      'Total Submissions',
      'Compliant',
      'Non-Compliant',
      'Under Review',
      'Avg Score',
    ];
    const rows = filteredTenders.map((t) => [
      t.refNo,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.org}"`,
      `"${t.dept}"`,
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

    // Auto record in real audit trail
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

    // Auto record in real audit trail
    recordAuditLog({
      activity: 'Report Generated',
      module: 'Compliance Reports',
      details: `Automated ${scheduleFrequency} report scheduled for ${scheduleEmail} (${scheduleFormat})`,
      status: 'Success',
    });

    showNotification(`Automated ${scheduleFrequency} report scheduled for ${scheduleEmail}.`);
  };

  // Dropdown options
  const departmentOptions = [
    'All Departments',
    'Ministry of Education',
    'Ministry of Railways',
    'Health Department',
    'PWD Department',
    'CPWD',
    'Higher Education Dept.',
    'Ministry of Home Affairs',
    'Ministry of New & Renewable Energy',
  ];
  const categoryOptions = [
    'All Categories',
    'Office Stationery',
    'IT Hardware',
    'Civil Works',
    'Medical Equipment',
    'Classroom Infrastructure',
    'AMC Services',
    'Chemicals',
  ];

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
          MAIN 2-COLUMN STRUCTURE
          Column 1 (Left 8 cols): 4 KPIs -> Filter Bar -> 2 Charts -> Table
          Column 2 (Right 4 cols): Buttons -> Under Review -> Score Dist -> Avg Score -> Top Reasons
          ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">

        {/* =======================================================================
            LEFT PRIMARY WORKSPACE (xl:col-span-8)
            ======================================================================= */}
        <div className="xl:col-span-8 space-y-4">

          {/* 1. TOP 4 KPI METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Overall Compliance */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Compliance</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {complianceRate}%
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Live platform status</p>
                <div className="w-10 h-3 shrink-0">
                  <svg viewBox="0 0 40 14" className="w-full h-full overflow-visible">
                    <polyline fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={kpiSparklinePoints} />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 2: Total Evaluations */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Evaluations</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {totalSubmissionsSum}
                  </h3>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+{totalSubmissionsSum} <span className="text-slate-400 font-normal">total</span></p>
              </div>
            </div>

            {/* Card 3: Compliant */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Compliant</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {compliantSum} <span className="text-xs font-semibold text-slate-400">({complianceRate}%)</span>
                  </h3>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{compliantSum} <span className="text-slate-400 font-normal">passed</span></p>
              </div>
            </div>

            {/* Card 4: Non-compliant */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <XCircle className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Non-compliant</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {nonCompliantSum} <span className="text-xs font-semibold text-slate-400">({nonComplianceRate}%)</span>
                  </h3>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{nonCompliantSum} <span className="text-slate-400 font-normal">flagged</span></p>
              </div>
            </div>
          </div>

          {/* 2. FILTER TOOLBAR (Collapsible, closed by default per user UX request) */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Search &amp; Filter Criteria
                </span>
                {(selectedDept !== 'All Departments' || selectedOrg !== 'All Organizations' || selectedCategory !== 'All Categories' || selectedStage !== 'All Stages' || minScoreFilter > 0) && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-200/60 dark:border-blue-800/60">
                    Active Filters
                  </span>
                )}
              </div>
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
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Date Range Picker */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Date Range
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={dateRange}
                        className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white pr-8 cursor-pointer focus:outline-none focus:border-blue-500"
                        onClick={() => {
                          setDateRange(
                            dateRange === '01 May 2024 - 20 May 2024'
                              ? '01 Apr 2024 - 30 Apr 2024'
                              : '01 May 2024 - 20 May 2024'
                          );
                        }}
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Department
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => {
                        setSelectedDept(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {departmentOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Organization / Buyer Filter */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Organization / Buyer
                    </label>
                    <select
                      value={selectedOrg}
                      onChange={(e) => {
                        setSelectedOrg(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="All Organizations">All Organizations</option>
                      <option value="Department of School Education">Department of School Education</option>
                      <option value="Railway Board">Railway Board</option>
                      <option value="State PWD">State PWD</option>
                      <option value="State Health Mission">State Health Mission</option>
                      <option value="CPWD Delhi">CPWD Delhi</option>
                      <option value="State University">State University</option>
                    </select>
                  </div>

                  {/* Tender Category */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Tender Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {categoryOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Evaluation Stage */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Evaluation Stage
                    </label>
                    <select
                      value={selectedStage}
                      onChange={(e) => {
                        setSelectedStage(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="All Stages">All Stages</option>
                      <option value="Technical Bid">Technical Bid</option>
                      <option value="Financial Bid">Financial Bid</option>
                      <option value="Final Audit">Final Audit</option>
                      <option value="PQC Evaluation">PQC Evaluation</option>
                    </select>
                  </div>

                  {/* More Filters Toggle */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
                      className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${moreFiltersOpen
                          ? 'border-blue-500 bg-blue-50/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>More Filters</span>
                    </button>
                  </div>
                </div>

                {/* Expandable Advanced Filters Drawer */}
                {moreFiltersOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center animate-in fade-in">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        <span>Minimum Score Filter</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{minScoreFilter}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="5"
                        value={minScoreFilter}
                        onChange={(e) => {
                          setMinScoreFilter(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Sort Order
                      </label>
                      <select
                        value={`${sortField}-${sortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split('-');
                          setSortField(field);
                          setSortOrder(order);
                        }}
                        className="w-full text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white"
                      >
                        <option value="id-asc">Default Order</option>
                        <option value="avgScore-desc">Highest Score First</option>
                        <option value="avgScore-asc">Lowest Score First</option>
                        <option value="totalSubmissions-desc">Most Submissions</option>
                        <option value="nonCompliant-desc">Highest Non-compliant</option>
                      </select>
                    </div>

                    <div className="flex items-end justify-end gap-2 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDept('All Departments');
                          setSelectedOrg('All Organizations');
                          setSelectedCategory('All Categories');
                          setSelectedStage('All Stages');
                          setMinScoreFilter(0);
                          setSearchQuery('');
                          setSortField('id');
                          setSortOrder('asc');
                          setCurrentPage(1);
                          showNotification('All filters reset.');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset All</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. VISUAL ANALYTICS: 2 CARDS SIDE-BY-SIDE (Compliance Trend + Compliance by Category) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">

            {/* Left Card: Compliance Trend (lg:col-span-7) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Compliance Trend
                  </h3>

                  {/* Chart Legend */}
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-slate-700 dark:text-slate-300">Compliance %</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-slate-700 dark:text-slate-300">Non-compliance %</span>
                    </div>
                  </div>
                </div>

                {/* Interactive SVG Trend Chart with Exact Curved Path */}
                {trendPoints.length > 0 ? (
                  <div className="relative w-full h-[200px]">
                    <svg viewBox="0 0 520 185" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="compAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="nonCompAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      {[0, 25, 50, 75, 100].map((val) => {
                        const y = 150 - (val / 100) * 125;
                        return (
                          <g key={val}>
                            <line
                              x1="35"
                              y1={y}
                              x2="500"
                              y2={y}
                              stroke="currentColor"
                              strokeDasharray="2 3"
                              className="text-slate-100 dark:text-slate-800"
                              strokeWidth="1"
                            />
                            <text
                              x="28"
                              y={y + 3.5}
                              textAnchor="end"
                              className="fill-slate-400 text-[9.5px] font-medium"
                            >
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Y-axis title */}
                      <text
                        x="10"
                        y="90"
                        textAnchor="middle"
                        transform="rotate(-90 10 90)"
                        className="fill-slate-400 text-[9px] font-medium"
                      >
                        Percentage (%)
                      </text>

                      {/* Connecting Paths: Area & Stroke */}
                      {trendPoints.length > 1 && (
                        <>
                          {/* Compliance Area Fill */}
                          <path
                            d={`M 50 ${150 - (trendPoints[0].comp / 100) * 125} ${trendPoints
                              .map((pt, i) => {
                                const x = 50 + i * (430 / (trendPoints.length - 1));
                                const y = 150 - (pt.comp / 100) * 125;
                                return `L ${x} ${y}`;
                              })
                              .join(' ')} L 480 150 L 50 150 Z`}
                            fill="url(#compAreaGradient)"
                          />
                          {/* Compliance Line */}
                          <path
                            d={`M 50 ${150 - (trendPoints[0].comp / 100) * 125} ${trendPoints
                              .map((pt, i) => {
                                const x = 50 + i * (430 / (trendPoints.length - 1));
                                const y = 150 - (pt.comp / 100) * 125;
                                return `L ${x} ${y}`;
                              })
                              .join(' ')}`}
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Non-compliance Line */}
                          <path
                            d={`M 50 ${150 - (trendPoints[0].nonComp / 100) * 125} ${trendPoints
                              .map((pt, i) => {
                                const x = 50 + i * (430 / (trendPoints.length - 1));
                                const y = 150 - (pt.nonComp / 100) * 125;
                                return `L ${x} ${y}`;
                              })
                              .join(' ')}`}
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="4 2"
                          />
                        </>
                      )}

                      {/* Interactive Points and Labels */}
                      {trendPoints.map((pt, i) => {
                        const x = 50 + i * (430 / Math.max(1, trendPoints.length - 1));
                        const yComp = 150 - (pt.comp / 100) * 125;
                        const yNonComp = 150 - (pt.nonComp / 100) * 125;

                        return (
                          <g
                            key={i}
                            className="cursor-pointer group"
                            onMouseEnter={() => setHoveredTrendIdx(i)}
                            onMouseLeave={() => setHoveredTrendIdx(null)}
                          >
                            {/* Vertical Hover Guide */}
                            {hoveredTrendIdx === i && (
                              <line
                                x1={x}
                                y1="20"
                                x2={x}
                                y2="155"
                                stroke="#94A3B8"
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                                opacity="0.6"
                              />
                            )}

                            {/* Blue Dot (Compliance) */}
                            <circle
                              cx={x}
                              cy={yComp}
                              r={hoveredTrendIdx === i ? 5.5 : 3.5}
                              fill="#3B82F6"
                              stroke="#ffffff"
                              strokeWidth="1.8"
                              className="transition-all"
                            />
                            <text
                              x={x}
                              y={yComp - 6}
                              textAnchor="middle"
                              className="fill-slate-800 dark:fill-slate-200 text-[9px] font-bold"
                            >
                              {pt.comp}%
                            </text>

                            {/* Red Dot (Non-compliance) */}
                            <circle
                              cx={x}
                              cy={yNonComp}
                              r={hoveredTrendIdx === i ? 5.5 : 3.5}
                              fill="#EF4444"
                              stroke="#ffffff"
                              strokeWidth="1.8"
                              className="transition-all"
                            />
                            <text
                              x={x}
                              y={yNonComp - 6}
                              textAnchor="middle"
                              className="fill-rose-600 dark:fill-rose-400 text-[9px] font-bold"
                            >
                              {pt.nonComp}%
                            </text>

                            {/* X-axis Date */}
                            <text
                              x={x}
                              y="170"
                              textAnchor="middle"
                              className="fill-slate-500 dark:fill-slate-400 text-[9.5px] font-medium"
                            >
                              {pt.date}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  <div className="relative w-full h-[200px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No trend history available</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Compliance trends will appear as bid evaluations progress over time</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Card: Compliance by Category (lg:col-span-5) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight mb-3">
                  Compliance by Category
                </h3>

                {categoryData.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-1">
                    {/* Donut Chart SVG */}
                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="15" fill="none" className="text-slate-100 dark:text-slate-800" />
                        {categoryData.map((cat, idx) => (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="38"
                            stroke={cat.color}
                            strokeWidth="15"
                            strokeDasharray={`${(cat.pct / 100) * 238.76} 238.76`}
                            strokeDashoffset={`-${categoryData.slice(0, idx).reduce((acc, c) => acc + (c.pct / 100) * 238.76, 0)}`}
                            fill="none"
                          />
                        ))}
                      </svg>

                      {/* Center text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                          {totalSubmissionsSum > 0 ? totalSubmissionsSum : categoryData.reduce((acc, c) => acc + c.count, 0)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {totalSubmissionsSum > 0 ? 'Submissions' : 'Tenders'}
                        </span>
                      </div>
                    </div>

                    {/* Legend List */}
                    <div className="space-y-2 flex-1 text-[11px] font-semibold w-full">
                      {categoryData.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="text-slate-600 dark:text-slate-400 truncate">{cat.name}</span>
                          </div>
                          <span className="text-slate-900 dark:text-white font-bold shrink-0">
                            {cat.pct}% <span className="text-slate-400 font-normal">({cat.count})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8 px-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No category breakdown</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Categories will be calculated once tenders are evaluated</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 4. COMPLIANCE BY TENDER TABLE */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">

            {/* Table Header: Title + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Compliance by Tender
                </h3>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tender ID or title..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full text-xs pl-8 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Table */}
            <div data-lenis-prevent="true" className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="font-semibold text-[11px] bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-8 text-center">#</th>
                    <th className="p-3 min-w-[190px]">Tender ID / Title</th>
                    <th className="p-3 min-w-[180px]">Organization / Department</th>
                    <th
                      onClick={() => handleSort('totalSubmissions')}
                      className="p-3 text-center cursor-pointer hover:text-blue-600 transition"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Total Submissions</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('compliant')}
                      className="p-3 text-center cursor-pointer hover:text-blue-600 transition"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Compliant</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('nonCompliant')}
                      className="p-3 text-center cursor-pointer hover:text-blue-600 transition"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Non-compliant</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3 text-center">Under Review</th>
                    <th
                      onClick={() => handleSort('avgScore')}
                      className="p-3 text-center cursor-pointer hover:text-blue-600 transition"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Avg. Compliance Score</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3 text-center w-14">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {paginatedTenders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No matching tenders found. Try adjusting your filters or search query.
                      </td>
                    </tr>
                  ) : (
                    paginatedTenders.map((tender, idx) => (
                      <tr
                        key={tender.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-3 text-center font-bold text-slate-400">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => setInspectTender(tender)}
                            className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 block hover:underline cursor-pointer text-left"
                          >
                            {tender.refNo}
                          </button>
                          <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5 text-xs">
                            {tender.title}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {tender.org}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {tender.dept}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {tender.totalSubmissions}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {tender.compliant} ({tender.compliantPct}%)
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {tender.nonCompliant} ({tender.nonCompliantPct}%)
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {tender.underReview} ({tender.underReviewPct}%)
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${tender.avgScore >= 80
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : tender.avgScore >= 70
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                          >
                            {tender.avgScore}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="font-medium">
                Showing <strong className="text-slate-800 dark:text-slate-200">{filteredTenders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {Math.min(currentPage * itemsPerPage, filteredTenders.length)}
                </strong>{' '}
                of <strong className="text-slate-800 dark:text-slate-200">{filteredTenders.length}</strong> results
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
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${currentPage === page
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
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value={7}>7 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={15}>15 / page</option>
                </select>
              </div>
            </div>

          </div>

        </div>

        {/* =======================================================================
            RIGHT SIDEBAR WORKSPACE (xl:col-span-4)
            Contains: Buttons -> Under Review -> Score Dist -> Avg Score -> Top Reasons
            ======================================================================= */}
        <div className="xl:col-span-4 space-y-3.5">

          {/* 1. TOP ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Report</span>
            </button>

            <button
              type="button"
              onClick={handleExportReport}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-600 text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Export Report</span>
            </button>
          </div>

          {/* 2. UNDER REVIEW CARD */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Under Review</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {underReviewSum} <span className="text-sm font-semibold text-slate-400">({underReviewPct}%)</span>
                </h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                  <span>{underReviewSum > 0 ? `${underReviewSum} pending clearance` : 'No pending reviews'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 3. COMPLIANCE SCORE DISTRIBUTION */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              Score Distribution
            </h4>

            {scoreDistribution.length > 0 ? (
              <div className="flex items-start gap-3">
                {/* Mini Donut Chart */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="16" fill="none" className="text-slate-100 dark:text-slate-800" />
                    {scoreDistribution.map((item, idx) => (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        stroke={item.color}
                        strokeWidth="16"
                        strokeDasharray={`${(item.pct / 100) * 238.76} 238.76`}
                        strokeDashoffset={`-${scoreDistribution.slice(0, idx).reduce((acc, it) => acc + (it.pct / 100) * 238.76, 0)}`}
                        fill="none"
                      />
                    ))}
                  </svg>
                </div>

                {/* Distribution Legend */}
                <div className="space-y-1.5 flex-1 min-w-0 text-[10.5px] font-semibold">
                  {scoreDistribution.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 dark:text-slate-400 truncate text-[10px]">{item.label}</span>
                      </div>
                      <span className="text-slate-900 dark:text-white font-bold whitespace-nowrap text-[10.5px]">
                        {item.count} <span className="text-slate-400 font-normal">({item.pct}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                No score distribution data yet
              </div>
            )}
          </div>

          {/* 4. AVERAGE COMPLIANCE SCORE */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Average Compliance Score
                </p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
                  {avgComplianceScoreOverall}%
                </h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                  <span>{totalSubmissionsSum > 0 ? `Based on ${totalSubmissionsSum} submissions` : 'Live evaluated average'}</span>
                </p>
              </div>

              {/* Dynamic Sparkline curve */}
              {avgScoreSparklinePoints && (
                <div className="w-24 h-10">
                  <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={avgScoreSparklinePoints.pointsStr}
                    />
                    <circle cx={avgScoreSparklinePoints.lastX} cy={avgScoreSparklinePoints.lastY} r="3.5" fill="#10B981" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* 5. TOP NON-COMPLIANCE REASONS */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              Top Non-compliance Reasons
            </h4>

            {rootCauses.length > 0 ? (
              <div className="space-y-2 text-[10.5px] font-semibold">
                {rootCauses.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 py-0.5">
                    <span className="text-slate-700 dark:text-slate-300 truncate font-medium min-w-0">
                      {item.reason}
                    </span>
                    <span className="text-slate-900 dark:text-white font-bold shrink-0 whitespace-nowrap">
                      {item.count} <span className="text-slate-400 font-normal">({item.pct}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                No non-compliance violations recorded
              </div>
            )}

            <button
              type="button"
              onClick={() => setReasonsModalOpen(true)}
              className="w-full py-2 text-center text-xs font-bold text-blue-600 dark:text-blue-400 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
            >
              View All Reasons
            </button>
          </div>

        </div>

      </div>

      {/* =======================================================================
          MODAL: SCHEDULE REPORT
          ======================================================================= */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Schedule Automated Report</span>
              </div>
              <button
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
                      className={`py-2 rounded-xl border text-center transition font-bold cursor-pointer ${scheduleFrequency === freq
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
          <div data-lenis-prevent="true" className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
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

            {/* Clause Breakdown List */}
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
                  <span className="font-semibold text-slate-800 dark:text-slate-200">4. Make in India (PPP-MII) Local Content (65%)</span>
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

      {/* =======================================================================
          MODAL: VIEW ALL REASONS
          ======================================================================= */}
      {reasonsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                All Non-Compliance Reasons
              </h3>
              <button onClick={() => setReasonsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              {rootCauses.length > 0 ? (
                rootCauses.map((rc, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{rc.reason}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {rc.desc}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm block">
                        {rc.pct}%
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-medium">
                        ({rc.count} bids)
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                  No non-compliance violations recorded across evaluated tenders.
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setReasonsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
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
