import React, { useState, useMemo } from 'react';
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
import { recordAuditLog } from '../../services';

// --- MOCK TENDER COMPLIANCE DATA (Matching reference screenshot + realistic GeM records) ---
const ALL_TENDERS_COMPLIANCE = [
  {
    id: 1,
    refNo: 'GEM/2024/B/5123981',
    title: 'Supply of Office Stationery Items',
    org: 'Ministry of Education',
    dept: 'Department of School Education',
    category: 'Office Stationery',
    stage: 'Final Audit',
    totalSubmissions: 18,
    compliant: 14,
    compliantPct: 78,
    nonCompliant: 3,
    nonCompliantPct: 17,
    underReview: 1,
    underReviewPct: 5,
    avgScore: 86,
  },
  {
    id: 2,
    refNo: 'GEM/2024/B/4987654',
    title: 'IT Hardware Procurement',
    org: 'Ministry of Railways',
    dept: 'Railway Board',
    category: 'IT Hardware',
    stage: 'Technical Bid',
    totalSubmissions: 22,
    compliant: 15,
    compliantPct: 68,
    nonCompliant: 6,
    nonCompliantPct: 27,
    underReview: 1,
    underReviewPct: 5,
    avgScore: 74,
  },
  {
    id: 3,
    refNo: 'GEM/2024/B/4876543',
    title: 'Road Construction Works',
    org: 'PWD Department',
    dept: 'State PWD',
    category: 'Civil Works',
    stage: 'Financial Bid',
    totalSubmissions: 12,
    compliant: 8,
    compliantPct: 67,
    nonCompliant: 3,
    nonCompliantPct: 25,
    underReview: 1,
    underReviewPct: 8,
    avgScore: 71,
  },
  {
    id: 4,
    refNo: 'GEM/2024/B/4765432',
    title: 'Medical Equipment Supply',
    org: 'Health Department',
    dept: 'State Health Mission',
    category: 'Medical Equipment',
    stage: 'PQC Evaluation',
    totalSubmissions: 16,
    compliant: 11,
    compliantPct: 69,
    nonCompliant: 4,
    nonCompliantPct: 25,
    underReview: 1,
    underReviewPct: 6,
    avgScore: 76,
  },
  {
    id: 5,
    refNo: 'GEM/2024/B/4654321',
    title: 'Smart Classroom Setup',
    org: 'Ministry of Education',
    dept: 'Department of School Education',
    category: 'Classroom Infrastructure',
    stage: 'Technical Bid',
    totalSubmissions: 10,
    compliant: 8,
    compliantPct: 80,
    nonCompliant: 1,
    nonCompliantPct: 10,
    underReview: 1,
    underReviewPct: 10,
    avgScore: 88,
  },
  {
    id: 6,
    refNo: 'GEM/2024/B/4543210',
    title: 'Annual Maintenance Contract',
    org: 'CPWD',
    dept: 'CPWD Delhi',
    category: 'AMC Services',
    stage: 'Final Audit',
    totalSubmissions: 8,
    compliant: 6,
    compliantPct: 75,
    nonCompliant: 1,
    nonCompliantPct: 13,
    underReview: 1,
    underReviewPct: 12,
    avgScore: 81,
  },
  {
    id: 7,
    refNo: 'GEM/2024/B/4432109',
    title: 'Supply of Laboratory Chemicals',
    org: 'Higher Education Dept.',
    dept: 'State University',
    category: 'Chemicals',
    stage: 'Technical Bid',
    totalSubmissions: 9,
    compliant: 5,
    compliantPct: 56,
    nonCompliant: 3,
    nonCompliantPct: 33,
    underReview: 1,
    underReviewPct: 11,
    avgScore: 63,
  },
  {
    id: 8,
    refNo: 'GEM/2024/B/4321098',
    title: 'CCTV Surveillance for City Center',
    org: 'Ministry of Home Affairs',
    dept: 'Delhi Police IT Division',
    category: 'IT Hardware',
    stage: 'PQC Evaluation',
    totalSubmissions: 14,
    compliant: 12,
    compliantPct: 86,
    nonCompliant: 1,
    nonCompliantPct: 7,
    underReview: 1,
    underReviewPct: 7,
    avgScore: 89,
  },
  {
    id: 9,
    refNo: 'GEM/2024/B/4210987',
    title: 'Solar Rooftop Power Panels 100KW',
    org: 'Ministry of New & Renewable Energy',
    dept: 'Solar Energy Corporation',
    category: 'Civil Works',
    stage: 'Financial Bid',
    totalSubmissions: 20,
    compliant: 16,
    compliantPct: 80,
    nonCompliant: 3,
    nonCompliantPct: 15,
    underReview: 1,
    underReviewPct: 5,
    avgScore: 84,
  },
  {
    id: 10,
    refNo: 'GEM/2024/B/4109876',
    title: 'Hospital Ward Beds and ICU Furniture',
    org: 'Health Department',
    dept: 'State Health Mission',
    category: 'Medical Equipment',
    stage: 'Final Audit',
    totalSubmissions: 15,
    compliant: 13,
    compliantPct: 87,
    nonCompliant: 1,
    nonCompliantPct: 7,
    underReview: 1,
    underReviewPct: 6,
    avgScore: 91,
  },
  {
    id: 11,
    refNo: 'GEM/2024/B/4098765',
    title: 'High Performance AI Server Cluster',
    org: 'Ministry of Electronics & IT',
    dept: 'C-DAC Supercomputing Cell',
    category: 'IT Hardware',
    stage: 'Technical Bid',
    totalSubmissions: 11,
    compliant: 9,
    compliantPct: 82,
    nonCompliant: 2,
    nonCompliantPct: 18,
    underReview: 0,
    underReviewPct: 0,
    avgScore: 85,
  },
  {
    id: 12,
    refNo: 'GEM/2024/B/3987654',
    title: 'Supply of Electric Vehicles for Field Inspection',
    org: 'Ministry of Heavy Industries',
    dept: 'FAME-II Scheme Office',
    category: 'Civil Works',
    stage: 'Financial Bid',
    totalSubmissions: 17,
    compliant: 12,
    compliantPct: 71,
    nonCompliant: 4,
    nonCompliantPct: 24,
    underReview: 1,
    underReviewPct: 5,
    avgScore: 78,
  },
  {
    id: 13,
    refNo: 'GEM/2024/B/3876543',
    title: 'Fire Safety & Smoke Evacuation Systems',
    org: 'CPWD',
    dept: 'CPWD Delhi',
    category: 'Civil Works',
    stage: 'Technical Bid',
    totalSubmissions: 13,
    compliant: 10,
    compliantPct: 77,
    nonCompliant: 2,
    nonCompliantPct: 15,
    underReview: 1,
    underReviewPct: 8,
    avgScore: 82,
  },
  {
    id: 14,
    refNo: 'GEM/2024/B/3765432',
    title: 'Bio-Medical Waste Incinerators',
    org: 'Health Department',
    dept: 'State Health Mission',
    category: 'Medical Equipment',
    stage: 'Final Audit',
    totalSubmissions: 9,
    compliant: 7,
    compliantPct: 78,
    nonCompliant: 1,
    nonCompliantPct: 11,
    underReview: 1,
    underReviewPct: 11,
    avgScore: 79,
  },
  {
    id: 15,
    refNo: 'GEM/2024/B/3654321',
    title: 'Interactive Digital Whiteboards (75")',
    org: 'Ministry of Education',
    dept: 'Department of School Education',
    category: 'Classroom Infrastructure',
    stage: 'Financial Bid',
    totalSubmissions: 14,
    compliant: 11,
    compliantPct: 79,
    nonCompliant: 2,
    nonCompliantPct: 14,
    underReview: 1,
    underReviewPct: 7,
    avgScore: 87,
  },
];

// --- COMPLIANCE TREND TIME-SERIES DATA ---
const TREND_POINTS = [
  { date: '01 May', comp: 75, nonComp: 28, compCount: 150, nonCompCount: 56 },
  { date: '04 May', comp: 75, nonComp: 25, compCount: 154, nonCompCount: 51 },
  { date: '07 May', comp: 78, nonComp: 22, compCount: 162, nonCompCount: 46 },
  { date: '10 May', comp: 80, nonComp: 20, compCount: 168, nonCompCount: 42 },
  { date: '13 May', comp: 83, nonComp: 17, compCount: 175, nonCompCount: 36 },
  { date: '16 May', comp: 85, nonComp: 15, compCount: 181, nonCompCount: 32 },
  { date: '19 May', comp: 82, nonComp: 18, compCount: 165, nonCompCount: 67 },
];

// --- COMPLIANCE BY CATEGORY BREAKDOWN ---
const CATEGORY_DATA = [
  { name: 'Technical', pct: 42, count: 104, color: '#3B82F6' },
  { name: 'Financial', pct: 22, count: 55, color: '#10B981' },
  { name: 'Legal & Statutory', pct: 14, count: 35, color: '#F59E0B' },
  { name: 'Certificate & Declarations', pct: 12, count: 30, color: '#8B5CF6' },
  { name: 'Others', pct: 10, count: 24, color: '#06B6D4' },
];

// --- COMPLIANCE SCORE DISTRIBUTION ---
const SCORE_DISTRIBUTION = [
  { label: '90 - 100% (High)', count: 82, pct: 33, color: '#10B981' },
  { label: '70 - 89% (Medium)', count: 96, pct: 39, color: '#06B6D4' },
  { label: '50 - 69% (Low)', count: 46, pct: 19, color: '#F59E0B' },
  { label: '0 - 49% (Critical)', count: 24, pct: 9, color: '#EF4444' },
];

// --- TOP NON-COMPLIANCE REASONS ---
const ROOT_CAUSES = [
  { reason: 'Document Missing / Invalid', count: 24, pct: 36, desc: 'Notarized affidavits or mandatory GFR certificates missing.' },
  { reason: 'Certificate Expired', count: 12, pct: 18, desc: 'ISO, GST, or OEM Authorization past validity date.' },
  { reason: 'Technical Specification Mismatch', count: 10, pct: 15, desc: 'Offered specs deviate from tender schedule.' },
  { reason: 'Financial Criteria Not Met', count: 8, pct: 12, desc: 'Annual turnover or net worth below tender threshold.' },
  { reason: 'Other Reasons', count: 13, pct: 19, desc: 'Land border declaration or EMD exemption issues.' },
];

const Reports = () => {
  const location = useLocation();
  const isStandalone = location.pathname === '/reports';

  // Filters State
  const [dateRange, setDateRange] = useState('01 May 2024 - 20 May 2024');
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
    let result = ALL_TENDERS_COMPLIANCE.filter((item) => {
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
  }, [selectedDept, selectedOrg, selectedCategory, selectedStage, minScoreFilter, searchQuery, sortField, sortOrder]);

  // Paginated List
  const totalResults = filteredTenders.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const paginatedTenders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTenders.slice(start, start + itemsPerPage);
  }, [filteredTenders, currentPage, itemsPerPage]);

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
                    82%
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+8% <span className="text-slate-400 font-normal">vs 30d</span></p>
                <div className="w-10 h-3 shrink-0">
                  <svg viewBox="0 0 40 14" className="w-full h-full overflow-visible">
                    <polyline fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="2,12 12,10 22,11 30,5 38,2" />
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
                    248
                  </h3>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+24 <span className="text-slate-400 font-normal">vs 30d</span></p>
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
                    165 <span className="text-xs font-semibold text-slate-400">(67%)</span>
                  </h3>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+18 <span className="text-slate-400 font-normal">vs 30d</span></p>
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
                    67 <span className="text-xs font-semibold text-slate-400">(27%)</span>
                  </h3>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">+5 <span className="text-slate-400 font-normal">vs 30d</span></p>
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
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    moreFiltersOpen
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
                <div className="relative w-full h-[200px]">
                  <svg viewBox="0 0 520 185" className="w-full h-full overflow-visible">
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

                    {/* Smooth Curve: Compliance % (Blue) */}
                    <path
                      d="M 50,56.25 C 85,56.25 90,56.25 125,56.25 C 160,56.25 165,52.5 200,52.5 C 235,52.5 240,50 275,50 C 310,50 315,46.25 350,46.25 C 385,46.25 390,43.75 425,43.75 C 460,43.75 465,47.5 480,47.5"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Smooth Curve: Non-compliance % (Red) */}
                    <path
                      d="M 50,115 C 85,118.75 90,118.75 125,118.75 C 160,118.75 165,122.5 200,122.5 C 235,122.5 240,125 275,125 C 310,125 315,128.75 350,128.75 C 385,128.75 390,131.25 425,131.25 C 460,131.25 465,127.5 480,127.5"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Interactive Points and Labels */}
                    {TREND_POINTS.map((pt, i) => {
                      const x = 50 + i * (430 / (TREND_POINTS.length - 1));
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
              </div>
            </div>

            {/* Right Card: Compliance by Category (lg:col-span-5) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight mb-3">
                  Compliance by Category
                </h3>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-1">
                  {/* Donut Chart SVG */}
                  <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="15" fill="none" className="text-slate-100 dark:text-slate-800" />
                      {/* Technical (42%) */}
                      <circle cx="50" cy="50" r="38" stroke="#3B82F6" strokeWidth="15" strokeDasharray="100.28 238.76" fill="none" />
                      {/* Financial (22%) */}
                      <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="15" strokeDasharray="52.53 238.76" strokeDashoffset="-100.28" fill="none" />
                      {/* Legal (14%) */}
                      <circle cx="50" cy="50" r="38" stroke="#F59E0B" strokeWidth="15" strokeDasharray="33.43 238.76" strokeDashoffset="-152.81" fill="none" />
                      {/* Certificate (12%) */}
                      <circle cx="50" cy="50" r="38" stroke="#8B5CF6" strokeWidth="15" strokeDasharray="28.65 238.76" strokeDashoffset="-186.24" fill="none" />
                      {/* Others (10%) */}
                      <circle cx="50" cy="50" r="38" stroke="#06B6D4" strokeWidth="15" strokeDasharray="23.88 238.76" strokeDashoffset="-214.89" fill="none" />
                    </svg>

                    {/* Center text: 248 Total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                        248
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        Total
                      </span>
                    </div>
                  </div>

                  {/* Legend List */}
                  <div className="space-y-2 flex-1 text-[11px] font-semibold w-full">
                    {CATEGORY_DATA.map((cat, idx) => (
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
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
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
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                              tender.avgScore >= 80
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
                  16 <span className="text-sm font-semibold text-slate-400">(6%)</span>
                </h3>
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <span>+1</span>
                  <span className="text-slate-400 font-normal">vs last 30 days</span>
                </p>
              </div>
            </div>
          </div>

          {/* 3. COMPLIANCE SCORE DISTRIBUTION */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              Score Distribution
            </h4>

            <div className="flex items-start gap-3">
              {/* Mini Donut Chart */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="16" fill="none" className="text-slate-100 dark:text-slate-800" />
                  <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="16" strokeDasharray="78.8 238.76" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#06B6D4" strokeWidth="16" strokeDasharray="93.1 238.76" strokeDashoffset="-78.8" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#F59E0B" strokeWidth="16" strokeDasharray="45.3 238.76" strokeDashoffset="-171.9" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#EF4444" strokeWidth="16" strokeDasharray="21.5 238.76" strokeDashoffset="-217.2" fill="none" />
                </svg>
              </div>

              {/* Distribution Legend */}
              <div className="space-y-1.5 flex-1 min-w-0 text-[10.5px] font-semibold">
                {SCORE_DISTRIBUTION.map((item, i) => (
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
          </div>

          {/* 4. AVERAGE COMPLIANCE SCORE */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Average Compliance Score
                </p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
                  82%
                </h3>
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <span>↑ 8%</span>
                  <span className="text-slate-400 font-normal">vs last 30 days</span>
                </p>
              </div>

              {/* Sparkline curve */}
              <div className="w-24 h-10">
                <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="5,32 20,28 40,30 60,20 80,18 95,8"
                  />
                  <circle cx="95" cy="8" r="3.5" fill="#10B981" stroke="#ffffff" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* 5. TOP NON-COMPLIANCE REASONS */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              Top Non-compliance Reasons
            </h4>

            <div className="space-y-2 text-[10.5px] font-semibold">
              {ROOT_CAUSES.map((item, idx) => (
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
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
              {ROOT_CAUSES.map((rc, i) => (
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
              ))}
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
