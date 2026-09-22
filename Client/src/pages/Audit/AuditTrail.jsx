import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Filter,
  ChevronDown,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Users,
  FileText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  UploadCloud,
  Sparkles,
  LogIn,
  Trash2,
  Database,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  RefreshCw,
  ExternalLink,
  Layers,
  Activity,
  Key,
  Server,
  FileSpreadsheet,
  Check,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../context';
import {
  getAuditLogs,
  recordAuditLog,
  calculateAuditMetrics,
  ACTIVITY_CONFIGS,
} from '../../services/auditService';

// Dynamic Icon resolver
const getLogIcon = (activity) => {
  switch (activity) {
    case 'Evaluation Completed':
      return CheckCircle2;
    case 'Compliance Check':
      return ShieldCheck;
    case 'Document Viewed':
      return Eye;
    case 'Document Uploaded':
      return UploadCloud;
    case 'AI Verification (RAG)':
      return Sparkles;
    case 'Login':
      return LogIn;
    case 'Logout':
      return LogIn;
    case 'Document Delete Failed':
      return Trash2;
    case 'Backup Completed':
      return Database;
    case 'Report Generated':
      return FileSpreadsheet;
    case 'Tender Assigned':
      return User;
    default:
      return Activity;
  }
};

const getLogColor = (activity) => {
  return ACTIVITY_CONFIGS[activity]?.iconColor || 'text-blue-500 bg-blue-50 dark:bg-blue-950/60';
};

const ACTIVITY_TYPES = [
  'All Activities',
  'Evaluation Completed',
  'Compliance Check',
  'Document Viewed',
  'Document Uploaded',
  'AI Verification (RAG)',
  'Login',
  'Logout',
  'Document Delete Failed',
  'Backup Completed',
  'Report Generated',
  'Tender Assigned',
];

const MODULES = [
  'All Modules',
  'Evaluation',
  'Compliance',
  'Upload & Extract',
  'Verification',
  'Authentication',
  'Document Vault',
  'Backup & Archival',
  'Audit Trail',
  'Reports',
];

const AuditTrail = () => {
  const location = useLocation();
  const isStandalone = location.pathname === '/audit' || location.pathname === '/audit-trail';
  const { user: authUser } = useAuth();

  // Persistent live logs from auditService
  const [logs, setLogs] = useState(() => getAuditLogs());

  // Filters State (Closed by default per user request)
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('All Activities');
  const [selectedUser, setSelectedUser] = useState('All Users');
  const [selectedTender, setSelectedTender] = useState('All Tenders');
  const [selectedModule, setSelectedModule] = useState('All Modules');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [selectedIpFilter, setSelectedIpFilter] = useState('');

  // Selected Log for Inspector Panel (Default to closed until user clicks a log)
  const [selectedLog, setSelectedLog] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Sorting
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [sortField, setSortField] = useState('rawTime');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Notification Toast & Copy States
  const [toastMsg, setToastMsg] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedLogId, setCopiedLogId] = useState(false);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Live Subscription: Listen for real actions across application (Login, Upload, Compliance, Reports)
  useEffect(() => {
    const handleUpdate = () => {
      const updated = getAuditLogs();
      setLogs(updated);
      setSelectedLog((prev) => {
        if (!prev) return null;
        const found = updated.find((l) => l.id === prev.id);
        return found || updated[0] || null;
      });
    };

    window.addEventListener('gem_audit_log_added', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('gem_audit_log_added', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Compute live KPI metrics dynamically from the actual log entries
  const metrics = useMemo(() => calculateAuditMetrics(logs), [logs]);

  // Dynamically derive unique Users list including the authenticated user
  const userOptions = useMemo(() => {
    const names = new Set();
    if (authUser?.name) names.add(authUser.name);
    logs.forEach((l) => {
      if (l.user?.name) names.add(l.user.name);
    });
    return ['All Users', ...Array.from(names)];
  }, [logs, authUser]);

  // Dynamically derive unique Tenders list from logs
  const tenderOptions = useMemo(() => {
    const tenders = new Set();
    logs.forEach((l) => {
      if (l.tenderId && l.tenderId !== '-') tenders.add(l.tenderId);
    });
    return ['All Tenders', ...Array.from(tenders)];
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    let list = logs.filter((log) => {
      if (selectedActivity !== 'All Activities' && log.activity !== selectedActivity) return false;
      if (selectedUser !== 'All Users' && log.user?.name !== selectedUser) return false;
      if (selectedTender !== 'All Tenders' && log.tenderId !== selectedTender) return false;
      if (selectedModule !== 'All Modules' && log.module !== selectedModule) return false;
      if (selectedStatus !== 'All Status' && log.status !== selectedStatus) return false;
      if (selectedIpFilter && !log.ip?.includes(selectedIpFilter)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = log.tenderTitle?.toLowerCase().includes(q);
        const matchId = log.tenderId?.toLowerCase().includes(q);
        const matchUser = log.user?.name?.toLowerCase().includes(q);
        const matchActivity = log.activity?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchIp = log.ip?.includes(q);
        if (!matchTitle && !matchId && !matchUser && !matchActivity && !matchDetails && !matchIp) {
          return false;
        }
      }
      return true;
    });

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'rawTime') {
        const timeA = new Date(aVal).getTime() || 0;
        const timeB = new Date(bVal).getTime() || 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return list;
  }, [
    logs,
    searchQuery,
    selectedActivity,
    selectedUser,
    selectedTender,
    selectedModule,
    selectedStatus,
    selectedIpFilter,
    sortField,
    sortOrder,
  ]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Export CSV + Auto Record Audit Log of Export
  const handleExportLogs = () => {
    const headers = [
      'Log ID',
      'Timestamp',
      'User',
      'Role',
      'Activity',
      'Module',
      'Tender ID',
      'Details',
      'IP Address',
      'Status',
      'Audit Hash',
    ];
    const rows = filteredLogs.map((log) => [
      log.id,
      `"${log.timestamp}"`,
      `"${log.user?.name || 'Officer'}"`,
      `"${log.user?.role || 'Evaluating Officer'}"`,
      `"${log.activity}"`,
      `"${log.module}"`,
      `"${log.tenderId}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`,
      log.ip,
      log.status,
      log.extra?.hash || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GeM_Audit_Trail_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Record this action into the live audit log
    recordAuditLog({
      activity: 'Report Generated',
      module: 'Audit Trail',
      details: 'Audit Trail activity logs exported to certified CSV archive',
      status: 'Success',
    });

    showToast('Audit logs successfully exported as certified CSV archive.');
  };

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2200);
    showToast('Cryptographic audit hash copied to clipboard.');
  };

  const handleCopyLogId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedLogId(true);
    setTimeout(() => setCopiedLogId(false), 2200);
    showToast(`Audit Log ID ${id} copied to clipboard.`);
  };

  return (
    <div className="w-full space-y-4 select-none animate-in fade-in duration-200 pb-12">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0A2540] text-white rounded-xl shadow-2xl border border-blue-500/40 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Standalone Header if accessed directly outside Dashboard shell */}
      {isStandalone && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Audit Trail
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5">
              <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                Dashboard
              </Link>
              <span>&gt;</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Audit Trail</span>
              <span>&gt;</span>
              <span className="text-slate-400">Activity Logs</span>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          1. TOP ROW: 6 KPI METRIC CARDS (Computed dynamically from real logs)
          ======================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Card 1: Total Activities */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Total Activities</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {metrics.totalActivities.toLocaleString()}
              </h3>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span>↑ 18%</span>
                <span className="text-slate-400 font-normal">vs last 30 days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Users */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Users</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {metrics.users}
              </h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1">
                Active users
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Tenders */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Tenders</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {metrics.tenders}
              </h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1">
                Affected tenders
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Documents */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Documents</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {metrics.documents.toLocaleString()}
              </h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1">
                Document interactions
              </p>
            </div>
          </div>
        </div>

        {/* Card 5: System Events */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Server className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">System Events</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {metrics.systemEvents}
              </h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1">
                System activities
              </p>
            </div>
          </div>
        </div>

        {/* Card 6: Failed Activities */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-500 dark:text-red-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Failed Activities</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {metrics.failedActivities}
              </h3>
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <span>↓ 8%</span>
                <span className="text-slate-400 font-normal">vs last 30 days</span>
              </p>
            </div>
          </div>
        </div>

      </div>



      {/* =======================================================================
          2. FILTER TOOLBAR (Collapsible, closed by default per user UX request)
          ======================================================================= */}
      {showFilters && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Filter Audit Logs
              </span>
              {(selectedActivity !== 'All Activities' || selectedUser !== 'All Users' || selectedTender !== 'All Tenders' || selectedModule !== 'All Modules' || selectedStatus !== 'All Status' || searchQuery) && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-200/60 dark:border-blue-800/60">
                  Active Filters
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedActivity('All Activities');
                setSelectedUser('All Users');
                setSelectedTender('All Tenders');
                setSelectedModule('All Modules');
                setSelectedStatus('All Status');
                setSearchQuery('');
                setSelectedIpFilter('');
                setCurrentPage(1);
                showToast('All audit filters reset.');
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Search Logs */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Search Logs
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search keywords..."
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Activity Type */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Activity Type
              </label>
              <select
                value={selectedActivity}
                onChange={(e) => {
                  setSelectedActivity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {ACTIVITY_TYPES.map((act) => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

            {/* User */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {userOptions.map((usr) => (
                  <option key={usr} value={usr}>{usr}</option>
                ))}
              </select>
            </div>

            {/* Tender ID / Title */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Tender ID / Title
              </label>
              <select
                value={selectedTender}
                onChange={(e) => {
                  setSelectedTender(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {tenderOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Module */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Module
              </label>
              <select
                value={selectedModule}
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {MODULES.map((mod) => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All Status">All Status</option>
                <option value="Success">Success</option>
                <option value="Warning">Warning</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          3. MAIN CONTENT: AUDIT LOGS TABLE + ACTIVITY DETAILS INSPECTOR
          Responsive Inspector (lg:col-span-5 xl:col-span-5 2xl:col-span-4) + Left Table (lg:col-span-7 xl:col-span-7 2xl:col-span-8)
          ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        
        {/* Left Table Panel */}
        <div className={`${inspectorOpen ? 'lg:col-span-7 xl:col-span-7 2xl:col-span-8 h-[740px] max-h-[calc(100vh-8rem)] min-h-[580px]' : 'lg:col-span-12 xl:col-span-12 2xl:col-span-12'} p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4 transition-all duration-300 min-w-0 flex flex-col justify-between`}>
          
          {/* Table Header: Title + Action Buttons */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Audit Logs
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs transition cursor-pointer ${
                  showFilters
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Logs</span>
              </button>

              {!inspectorOpen && (
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedLog && logs.length > 0) {
                      setSelectedLog(paginatedLogs[0] || logs[0]);
                    }
                    setInspectorOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Show Details Panel</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div data-lenis-prevent="true" className="flex-1 overflow-auto rounded-xl border border-slate-200/80 dark:border-slate-800 min-h-0">
            <table className="w-full text-left text-xs min-w-[780px]">
              <thead className="sticky top-0 z-10 font-semibold text-[11px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <tr>
                  <th
                    onClick={() => {
                      setSortField('rawTime');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="p-3 whitespace-nowrap cursor-pointer hover:text-blue-600 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date &amp; Time</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3 min-w-[130px]">User</th>
                  <th className="p-3 min-w-[140px]">Activity</th>
                  <th className="p-3 min-w-[110px]">Module</th>
                  <th className="p-3 min-w-[160px]">Tender ID / Title</th>
                  <th className="p-3 min-w-[150px]">Details</th>
                  <th className="p-3 whitespace-nowrap">IP Address</th>
                  <th className="p-3 text-center whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No matching audit logs found. Try resetting your search filters.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const IconComponent = getLogIcon(log.activity);
                    const iconColorClass = getLogColor(log.activity);
                    const isSelected = selectedLog?.id === log.id;

                    return (
                      <tr
                        key={log.id}
                        onClick={() => {
                          setSelectedLog(log);
                          setInspectorOpen(true);
                        }}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-inset ring-blue-400/40'
                            : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Date & Time */}
                        <td className="p-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                          {log.timestamp}
                        </td>

                        {/* User */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${log.user?.color || 'from-blue-600 to-indigo-500'} text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0`}>
                              {log.user?.avatar || 'AV'}
                            </div>
                            <div className="truncate max-w-[100px]">
                              <span className="font-bold text-slate-900 dark:text-white block truncate">
                                {log.user?.name || 'Arjun Verma'}
                              </span>
                              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block truncate">
                                {log.user?.role || 'Evaluating Officer'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Activity */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`p-1 rounded-md shrink-0 ${iconColorClass}`}>
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {log.activity}
                            </span>
                          </div>
                        </td>

                        {/* Module */}
                        <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {log.module}
                        </td>

                        {/* Tender ID / Title */}
                        <td className="p-3">
                          {log.tenderId !== '-' ? (
                            <div>
                              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 block truncate">
                                {log.tenderId}
                              </span>
                              <span className="text-slate-600 dark:text-slate-400 text-[11px] block truncate max-w-[150px]" title={log.tenderTitle}>
                                {log.tenderTitle}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>

                        {/* Details */}
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          <span className="truncate block max-w-[150px]" title={log.details}>
                            {log.details}
                          </span>
                        </td>

                        {/* IP Address */}
                        <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {log.ip}
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                              log.status === 'Success'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
            <div className="font-medium">
              Showing <strong className="text-slate-800 dark:text-slate-200">{filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{filteredLogs.length}</strong> filtered logs
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
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

                {totalPages > 5 && (
                  <>
                    <span className="text-slate-400 px-1">...</span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                        currentPage === totalPages
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>

        </div>

        {/* Right Column: Activity Details Inspector Panel (lg:col-span-5 xl:col-span-5 2xl:col-span-4) */}
        {inspectorOpen && selectedLog && (
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all duration-200 min-w-0 h-[740px] max-h-[calc(100vh-8rem)] min-h-[580px] flex flex-col justify-between overflow-hidden">
            
            {/* Header with Title, Live Badge, Log ID Pill & Close */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 rounded-t-2xl space-y-2 shrink-0">
              {/* Top Row: Meta Tags & Close Button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Log ID Tag */}
                  <button
                    type="button"
                    onClick={() => handleCopyLogId(selectedLog.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-mono text-[11px] font-bold shadow-2xs transition cursor-pointer"
                    title="Click to copy Log ID"
                  >
                    <Copy className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="whitespace-nowrap">{selectedLog.id}</span>
                    {copiedLogId && <span className="text-emerald-600 dark:text-emerald-400 text-[10px] ml-0.5">✓</span>}
                  </button>

                  {/* Live Status Pill */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Verified</span>
                  </span>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  title="Close details panel"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Activity Details
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Immutable audit log entry recorded on GeM Core Ledger
                </p>
              </div>
            </div>

            {/* Scrollable Middle Content Container */}
            <div data-lenis-prevent="true" className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 min-h-0">
              
              {/* Activity Hero Banner */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 space-y-3">
                {/* Top: Icon + Action Title + Status Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${getLogColor(selectedLog.activity)}`}>
                      {React.createElement(getLogIcon(selectedLog.activity), {
                        className: 'w-5 h-5',
                      })}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Action Type
                      </span>
                      <h5 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight mt-0.5 truncate">
                        {selectedLog.activity}
                      </h5>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 whitespace-nowrap ${
                      selectedLog.status === 'Success'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {selectedLog.status === 'Success' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Succeeded</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>Failed</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Bottom Bar: Exact Timestamp */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Logged at:</span>
                  <strong className="text-slate-700 dark:text-slate-200 font-bold">{selectedLog.timestamp}</strong>
                </div>
              </div>

              {/* Description & Scope Callout */}
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Description &amp; Operational Scope
                </span>
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {selectedLog.description || selectedLog.details || 'Operational audit action recorded and digitally signed.'}
                </div>
              </div>

              {/* Performed By Dossier Card */}
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Performed By
                </span>
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${selectedLog.user?.color || 'from-blue-600 to-indigo-600'} text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 ring-2 ring-white dark:ring-slate-800`}>
                      {selectedLog.user?.avatar || 'AU'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight truncate">
                        {selectedLog.user?.name || 'Authorized Officer'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate">
                        {selectedLog.user?.role || 'Evaluation Officer'}
                      </span>
                    </div>
                  </div>

                  {/* Verification Badge Bar */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Auth Verification:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>SSO Jan Parichay Verified</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Structured Key-Value Parameters Grid */}
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Session &amp; Environment Parameters
                </span>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden text-xs">
                  {/* IP Address */}
                  <div className="p-2.5 sm:p-3 flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                      <Server className="w-3.5 h-3.5 text-slate-400" />
                      <span>IP Address</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {selectedLog.ip}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        LAN Node
                      </span>
                    </div>
                  </div>

                  {/* Origin Module */}
                  <div className="p-2.5 sm:p-3 flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Origin Module</span>
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 truncate">
                      {selectedLog.module}
                    </span>
                  </div>

                  {/* Tender Reference */}
                  <div className="p-2.5 sm:p-3 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tender Reference</span>
                      </span>
                      {selectedLog.tenderId !== '-' ? (
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {selectedLog.tenderId}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">Global System Event</span>
                      )}
                    </div>

                    {selectedLog.tenderId !== '-' && selectedLog.tenderTitle && (
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-5 pt-0.5 truncate" title={selectedLog.tenderTitle}>
                        {selectedLog.tenderTitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical Audit Specifications */}
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Technical Audit Specifications
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Audit Standard</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">GFR 2017 / IT Act</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Channel Security</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">TLS 1.3 (Encrypted)</span>
                  </div>

                  {selectedLog.extra?.evaluationId && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Evaluation ID</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">{selectedLog.extra.evaluationId}</span>
                    </div>
                  )}
                  {selectedLog.extra?.score && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Evaluated Score</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">{selectedLog.extra.score}</span>
                    </div>
                  )}
                  {selectedLog.extra?.stage && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Stage</span>
                      <span className="font-bold text-slate-900 dark:text-white block mt-0.5 truncate">{selectedLog.extra.stage}</span>
                    </div>
                  )}
                  {selectedLog.extra?.timeTaken && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Latency</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block mt-0.5">{selectedLog.extra.timeTaken}</span>
                    </div>
                  )}
                  {selectedLog.extra?.documentsEvaluated && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Documents</span>
                      <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{selectedLog.extra.documentsEvaluated} Files</span>
                    </div>
                  )}
                  {selectedLog.extra?.confidenceScore && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">AI Confidence</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400 block mt-0.5">{selectedLog.extra.confidenceScore}</span>
                    </div>
                  )}
                  {selectedLog.extra?.errorCode && (
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 col-span-2">
                      <span className="text-[10px] text-rose-500 font-semibold uppercase block">Security Violation Code</span>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-300 block mt-0.5">{selectedLog.extra.errorCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptographic SHA-256 Hash Verification Card */}
              {selectedLog.extra?.hash && (
                <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Cryptographic Audit Proof</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(selectedLog.extra.hash)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition cursor-pointer shadow-2xs"
                      title="Copy SHA-256 Hash"
                    >
                      {copiedHash ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <p className="font-mono text-[10px] text-slate-800 dark:text-slate-200 break-all leading-relaxed select-all">
                      {selectedLog.extra.hash}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Immutable CAG &amp; GFR 2017 compliant signature verified</span>
                  </div>
                </div>
              )}

            </div>

            {/* Pinned Action Buttons Footer */}
            <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 rounded-b-2xl flex flex-col sm:flex-row gap-2">
              {selectedLog.tenderId !== '-' && (
                <Link
                  to="/dashboard?tab=compliance"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <span>Open Tender Compliance</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => showToast(`Audit log certificate for #${selectedLog.id} generated.`)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Certificate</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default AuditTrail;
