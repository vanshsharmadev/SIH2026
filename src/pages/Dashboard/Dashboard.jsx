import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  FileEdit,
  CheckSquare,
  Archive,
  UploadCloud,
  FolderArchive,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet,
  BarChart3,
  Clock,
  Users,
  Building2,
  Settings as SettingsIcon,
  HelpCircle,
  Menu,
  X,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  FileText,
  ClipboardCheck,
  Brain,
  ShieldCheck,
  Send,
  ExternalLink,
  ArrowLeft,
  XCircle,
  Bot,
  MessageSquare,
  Download,
  Eye,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectDashboardMetrics,
  selectComplianceOverview,
  selectRecentSubmissions,
  selectDashboardActivities,
  setTimeFilter as setReduxTimeFilter,
} from '../../store/slices/dashboardSlice';
import { selectAllTenders } from '../../store/slices/tenderSlice';
import { useAuth } from '../../context';
import { ChatBox } from '../../components/common';
import { isOfficerUser } from '../../utils/roleUtils';
import ComplianceCheckView from './ComplianceCheckView';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, logout } = useAuth();

  const reduxMetrics = useSelector(selectDashboardMetrics);
  const reduxCompliance = useSelector(selectComplianceOverview);
  const reduxSubmissions = useSelector(selectRecentSubmissions);
  const reduxActivities = useSelector(selectDashboardActivities);
  const reduxTenders = useSelector(selectAllTenders);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('gem_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gem_sidebar_collapsed', next.toString());
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeMenu, setActiveMenu] = useState(() => (tabParam === 'compliance' ? 'compliance' : 'dashboard'));

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'compliance') {
      setActiveMenu('compliance');
    } else if (!tab && activeMenu === 'compliance') {
      setActiveMenu('dashboard');
    }
  }, [searchParams]);

  const handleOpenCompliance = () => {
    setActiveMenu('compliance');
    setSearchParams({ tab: 'compliance' });
    setSidebarOpen(false);
  };

  const handleOpenDashboard = () => {
    setActiveMenu('dashboard');
    setSearchParams({});
    setSidebarOpen(false);
  };

  const [timeFilter, setTimeFilter] = useState('This Month');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [chatBoxOpen, setChatBoxOpen] = useState(false);

  // RAG AI Query State
  const [ragQuery, setRagQuery] = useState('');
  const [ragResponse, setRagResponse] = useState(null);
  const [isAskingRag, setIsAskingRag] = useState(false);

  // Quick Action Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedDocSubmission, setSelectedDocSubmission] = useState(null);

  // Local storage synced officer submissions & activities (immediate cross-tab / refresh sync)
  const [localOfficerSubmissions, setLocalOfficerSubmissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gem_officer_submissions') || '[]');
    } catch {
      return [];
    }
  });

  const [localOfficerActivities, setLocalOfficerActivities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gem_officer_activities') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const subs = JSON.parse(localStorage.getItem('gem_officer_submissions') || '[]');
        setLocalOfficerSubmissions(subs);
        const acts = JSON.parse(localStorage.getItem('gem_officer_activities') || '[]');
        setLocalOfficerActivities(acts);
      } catch (err) {}
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
    };
  }, []);

  const officerName =
    user?.name && user.name.length > 1 && user.name !== 'OFFICIAL USER'
      ? user.name
      : 'Arjun Verma';

  const officerRole =
    user?.designation ||
    user?.role ||
    'Evaluating Officer';

  const getInitials = (name) => {
    if (!name) return 'VA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(officerName);

  const handleAskRag = (e) => {
    e?.preventDefault();
    if (!ragQuery.trim()) return;
    setIsAskingRag(true);
    setRagResponse(null);

    setTimeout(() => {
      setIsAskingRag(false);
      const queryLower = ragQuery.toLowerCase();
      if (queryLower.includes('144') || queryLower.includes('land border')) {
        setRagResponse({
          title: 'GFR 2017 Rule 144(xi) Land Border Requirement',
          text: 'Under Department of Expenditure order F.No.6/18/2019-PPD, any bidder sharing a land border with India must be registered with DPIIT (Competent Authority) and possess political clearance from MEA & MHA before technical bid qualification.',
          confidence: '98.4% Confidence &bull; CVC Policy Verified',
        });
      } else if (queryLower.includes('mii') || queryLower.includes('local content') || queryLower.includes('make in india')) {
        setRagResponse({
          title: 'Public Procurement (Preference to Make in India) Order 2017',
          text: 'Class-I Local Suppliers (>=50% local content) receive statutory purchase preference in all tenders. For tenders above ₹10 Crores, local content percentage must be certified by a statutory auditor or cost accountant.',
          confidence: '99.1% Confidence &bull; DPIIT PPP-MII Manual',
        });
      } else {
        setRagResponse({
          title: `GeM Regulatory Search: "${ragQuery}"`,
          text: 'Bid parameters analyzed across Central Public Procurement Portal (CPPP) & GeM SPV standard operating guidelines. No debarment violations detected in current active repository.',
          confidence: '95.2% Confidence &bull; Autonomous Engine',
        });
      }
    }, 600);
  };

  // Dynamic activity icons
  const activityIconMap = {
    completed: { icon: CheckCircle2, iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50' },
    warning: { icon: AlertTriangle, iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50' },
    danger: { icon: AlertCircle, iconColor: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50' },
  };

  const metrics = reduxMetrics || {
    totalTenders: 128,
    totalTendersTrend: '+12%',
    submissionsReceived: 346,
    submissionsReceivedTrend: '+18%',
    evaluationsCompleted: 89,
    evaluationsCompletedTrend: '+15%',
    complianceIssues: 23,
    complianceIssuesTrend: '-5%',
  };

  const compliance = reduxCompliance || {
    totalChecks: 346,
    compliant: 253,
    compliantPercentage: 73,
    minorIssues: 61,
    minorIssuesPercentage: 18,
    majorIssues: 32,
    majorIssuesPercentage: 9,
    complianceRate: 73,
    complianceRateTrend: '+8%',
    timeFilter: 'This Month',
  };

  // Recent Tenders Data (Exact match with screenshot & connected to Redux)
  const recentTenders = reduxTenders?.length
    ? reduxTenders.slice(0, 5).map((t) => ({
        id: t.id,
        title: t.title,
        department: t.department,
        lastDate: t.lastDate,
        submissions: t.submissions,
        status: t.status,
      }))
    : [
        {
          id: 'GEM/2024/B/5123981',
          title: 'Supply of Office Stationery...',
          department: 'Ministry of Education',
          lastDate: '25 May 2024',
          submissions: 8,
          status: 'Open',
        },
        {
          id: 'GEM/2024/B/5123982',
          title: 'IT Hardware Procurement...',
          department: 'Ministry of Railways',
          lastDate: '28 May 2024',
          submissions: 12,
          status: 'Open',
        },
        {
          id: 'GEM/2024/B/5123983',
          title: 'Road Construction Work...',
          department: 'PWD Department',
          lastDate: '30 May 2024',
          submissions: 5,
          status: 'Open',
        },
        {
          id: 'GEM/2024/B/5123984',
          title: 'Medical Equipment Supply...',
          department: 'Health Department',
          lastDate: '20 May 2024',
          submissions: 14,
          status: 'Closed',
        },
        {
          id: 'GEM/2024/B/5123985',
          title: 'Smart Classroom Setup...',
          department: 'Ministry of Education',
          lastDate: '18 May 2024',
          submissions: 9,
          status: 'Closed',
        },
      ];

  // Default base submissions if Redux is initial
  const defaultSubmissions = [
    {
      id: 'APP-2024-5123',
      tenderId: 'GEM/2024/B/5123981',
      tenderTitle: 'Supply of Office Stationery & Administrative Items',
      bidder: 'ABC Enterprises Pvt. Ltd.',
      submittedOn: '19 May 2024',
      score: 92,
      status: 'Compliant',
      statusColor: 'emerald',
      quotedAmount: '₹ 42,50,000',
      ministry: 'Ministry of Education',
      documents: [
        { name: 'Technical_Proposal_Compliance.pdf', size: '2.8 MB', status: 'Verified', date: '19 May 2024' },
        { name: 'BOQ_Price_Schedule.xlsx', size: '480 KB', status: 'Verified', date: '19 May 2024' },
        { name: 'Land_Border_GFR144xi_Certificate.pdf', size: '360 KB', status: 'Compliant', date: '19 May 2024' },
      ],
    },
    {
      id: 'APP-2024-5124',
      tenderId: 'GEM/2024/B/5123981',
      tenderTitle: 'Supply of Office Stationery & Administrative Items',
      bidder: 'XYZ Solutions',
      submittedOn: '18 May 2024',
      score: 68,
      status: 'Minor Issues',
      statusColor: 'amber',
      quotedAmount: '₹ 45,00,000',
      ministry: 'Ministry of Education',
      documents: [
        { name: 'Stationery_Tender_Proposal.pdf', size: '3.1 MB', status: 'Verified', date: '18 May 2024' },
        { name: 'Audited_Turnover_BOM.pdf', size: '1.2 MB', status: 'Flagged (Local Content 45%)', date: '18 May 2024' },
      ],
    },
    {
      id: 'APP-2024-5125',
      tenderId: 'GEM/2024/B/5123981',
      tenderTitle: 'Supply of Office Stationery & Administrative Items',
      bidder: 'Global Traders',
      submittedOn: '17 May 2024',
      score: 45,
      status: 'Major Issues',
      statusColor: 'rose',
      quotedAmount: '₹ 39,20,000',
      ministry: 'Ministry of Education',
      documents: [
        { name: 'Global_Bid_Form_A.pdf', size: '1.5 MB', status: 'Verified', date: '17 May 2024' },
        { name: 'Banned_Subcontractor_List.pdf', size: '890 KB', status: 'Violates GFR Rule 144(xi)', date: '17 May 2024' },
      ],
    },
    {
      id: 'APP-2024-5126',
      tenderId: 'GEM/2024/B/5123982',
      tenderTitle: 'IT Hardware Procurement & Networking',
      bidder: 'TechCorp India Pvt. Ltd.',
      submittedOn: '19 May 2024',
      score: 85,
      status: 'Compliant',
      statusColor: 'emerald',
      quotedAmount: '₹ 8,40,00,000',
      ministry: 'Ministry of Railways',
      documents: [
        { name: 'IT_Hardware_Tech_Specs.pdf', size: '4.2 MB', status: 'Verified', date: '19 May 2024' },
        { name: 'Make_In_India_Auditor_Cert.pdf', size: '650 KB', status: 'Verified (68%)', date: '19 May 2024' },
      ],
    },
    {
      id: 'APP-2024-5127',
      tenderId: 'GEM/2024/B/5123982',
      tenderTitle: 'IT Hardware Procurement & Networking',
      bidder: 'Innovative Supplies',
      submittedOn: '18 May 2024',
      score: 72,
      status: 'Minor Issues',
      statusColor: 'amber',
      quotedAmount: '₹ 8,90,00,000',
      ministry: 'Ministry of Railways',
      documents: [
        { name: 'Hardware_Bidding_Dossier.pdf', size: '2.9 MB', status: 'Verified', date: '18 May 2024' },
        { name: 'DSC_Timestamp_Declaration.pdf', size: '320 KB', status: 'Clarification Needed', date: '18 May 2024' },
      ],
    },
  ];

  // Combined Recent Submissions (Redux + localStorage proposals from bidders)
  const recentSubmissions = useMemo(() => {
    const base = (reduxSubmissions && reduxSubmissions.length > 0) ? reduxSubmissions : defaultSubmissions;
    const seen = new Set();
    const list = [];
    // Prioritize newly uploaded proposals from bidders
    for (const item of localOfficerSubmissions) {
      const key = item.id || `${item.tenderId}-${item.bidder}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    }
    for (const item of base) {
      const key = item.id || `${item.tenderId}-${item.bidder}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    }
    return list;
  }, [reduxSubmissions, localOfficerSubmissions]);

  // Combined AI Verification Activity (Redux + localStorage activities)
  const activities = useMemo(() => {
    const base = reduxActivities || [
      {
        id: 1,
        type: 'completed',
        title: 'Compliance check completed',
        subtext: 'Tender ID: GEM/2024/B/5123981 | Bidder: ABC Enterprises Pvt. Ltd.',
        time: '10:30 AM',
      },
      {
        id: 2,
        type: 'warning',
        title: 'Minor issues detected',
        subtext: 'Tender ID: GEM/2024/B/5123981 | Bidder: XYZ Solutions',
        time: '09:45 AM',
      },
      {
        id: 3,
        type: 'danger',
        title: 'Major compliance issues detected',
        subtext: 'Tender ID: GEM/2024/B/5123981 | Bidder: Global Traders',
        time: '09:15 AM',
      },
      {
        id: 4,
        type: 'completed',
        title: 'Document verification completed',
        subtext: 'Tender ID: GEM/2024/B/5123982 | Bidder: TechCorp India Pvt. Ltd.',
        time: 'Yesterday',
      },
    ];

    const seen = new Set();
    const list = [];
    for (const act of localOfficerActivities) {
      const key = act.id || `${act.title}-${act.time}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(act);
      }
    }
    for (const act of base) {
      const key = act.id || `${act.title}-${act.time}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(act);
      }
    }

    return list.map((act) => ({
      ...act,
      icon: (activityIconMap[act.type] || activityIconMap.completed).icon,
      iconColor: (activityIconMap[act.type] || activityIconMap.completed).iconColor,
    }));
  }, [reduxActivities, localOfficerActivities]);

  // Strict Authentication Guard: Unauthenticated visitors must log in
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/dashboard" state={{ redirectTo: '/dashboard' }} replace />;
  }

  // Strict Role Guard: Commercial Bidders must NEVER see the internal Officer Evaluation Portal
  if (!isOfficerUser(user)) {
    return <Navigate to="/my-applications" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fa] dark:bg-[#0b1329] text-slate-800 dark:text-slate-100 font-sans antialiased">

      {/* -------------------- 1. LEFT SIDEBAR -------------------- */}
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-[#0d1527] text-white flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center ${
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          } py-4 border-b border-slate-800/80 transition-all duration-300`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold tracking-tight text-white leading-tight truncate">
                  GemCompliance
                </h1>
                <p className="text-[10px] font-medium text-slate-400 truncate">
                  AI Tender Compliance Platform
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop header toggle button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ${
              sidebarCollapsed ? 'hidden' : ''
            }`}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div
          className={`flex-1 overflow-y-auto ${
            sidebarCollapsed ? 'px-2' : 'px-3.5'
          } py-4 space-y-5 text-xs select-none`}
        >
          {/* Main Dashboard Link */}
          <div>
            <button
              onClick={handleOpenDashboard}
              title="Dashboard"
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                activeMenu === 'dashboard'
                  ? 'bg-blue-600/90 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="text-xs truncate">Dashboard</span>}
            </button>
          </div>

          {/* Group 1: TENDER MANAGEMENT */}
          <div className="space-y-1">
            {!sidebarCollapsed ? (
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
                Tender Management
              </p>
            ) : (
              <div className="border-t border-slate-800/80 my-2 mx-1" />
            )}
            <Link
              to="/tenders"
              onClick={() => setSidebarOpen(false)}
              title="Search Tenders"
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer`}
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Search Tenders</span>}
            </Link>
            <Link
              to="/tenders"
              onClick={() => setSidebarOpen(false)}
              title="Tender Submissions"
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer`}
            >
              <FileEdit className="w-4 h-4 text-slate-400 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Tender Submissions</span>}
            </Link>
            <button
              type="button"
              onClick={() => {
                setEvalModalOpen(true);
                setSidebarOpen(false);
              }}
              title="My Evaluations"
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer text-left`}
            >
              <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">My Evaluations</span>}
            </button>
          </div>

          {/* Group 2: DOCUMENT VERIFICATION */}
          <div className="space-y-1">
            {!sidebarCollapsed ? (
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
                Document Verification
              </p>
            ) : (
              <div className="border-t border-slate-800/80 my-2 mx-1" />
            )}
            <button
              type="button"
              onClick={() => {
                setUploadModalOpen(true);
                setSidebarOpen(false);
              }}
              title="Upload & Extract"
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer text-left`}
            >
              <UploadCloud className="w-4 h-4 text-slate-400 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Upload & Extract</span>}
            </button>
            <button
              type="button"
              onClick={handleOpenCompliance}
              title="Compliance Check"
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2 rounded-xl transition-all cursor-pointer text-left ${
                activeMenu === 'compliance'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Compliance Check</span>}
            </button>
          </div>

          {/* Group 3: REPORTS & AUDIT */}
          <div className="space-y-1">
            {!sidebarCollapsed ? (
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
                Reports & Audit
              </p>
            ) : (
              <div className="border-t border-slate-800/80 my-2 mx-1" />
            )}
            <Link
              to="/reports"
              onClick={() => setSidebarOpen(false)}
              title="Compliance Reports"
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer`}
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Compliance Reports</span>}
            </Link>
            <Link
              to="/reports"
              onClick={() => setSidebarOpen(false)}
              title="Audit Trail"
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer`}
            >
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Audit Trail</span>}
            </Link>
          </div>

          {/* Group 4: AI COMPLIANCE ASSISTANT (CHATBOX) */}
          <div className="space-y-1">
            {!sidebarCollapsed ? (
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
                AI Assistant
              </p>
            ) : (
              <div className="border-t border-slate-800/80 my-2 mx-1" />
            )}
            <button
              type="button"
              onClick={() => {
                setActiveMenu('chatbox');
                setChatBoxOpen(true);
                setSidebarOpen(false);
              }}
              title="AI Chatbox (GFR 2017 & GeM Guidelines)"
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
              } py-2 rounded-xl transition-all cursor-pointer text-left relative ${
                chatBoxOpen
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
                {!sidebarCollapsed && <span className="font-semibold truncate">AI Chatbox</span>}
              </div>
              {!sidebarCollapsed ? (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 uppercase tracking-wide">
                  Live
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0d1527]" />
              )}
            </button>
          </div>

          {/* Group 5: ADMINISTRATION */}
          <div className="space-y-1">
            {!sidebarCollapsed ? (
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
                Administration
              </p>
            ) : (
              <div className="border-t border-slate-800/80 my-2 mx-1" />
            )}
            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              title="Settings"
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer`}
            >
              <SettingsIcon className="w-4 h-4 text-slate-400 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Settings</span>}
            </Link>
          </div>
        </div>

        {/* Sidebar Footer Buttons */}
        <div className={`p-3 border-t border-slate-800/80 space-y-1.5 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <Link
            to="/#footer"
            title="Help & Support"
            className={`flex items-center ${
              sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
            } py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/80 rounded-xl transition cursor-pointer`}
          >
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Help & Support</span>}
          </Link>
          <Link
            to="/"
            title="Back to GeM Portal"
            className={`flex items-center ${
              sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
            } py-2 text-xs font-semibold text-blue-400 hover:bg-slate-800/80 rounded-xl transition cursor-pointer`}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Back to GeM Portal</span>}
          </Link>

          {/* Bottom collapse / expand toggle button */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden lg:flex items-center ${
              sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
            } w-full py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition cursor-pointer border-t border-slate-800/40 mt-1`}
          >
            {!sidebarCollapsed && <span>Collapse Sidebar</span>}
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronLeft className="w-4 h-4 shrink-0" />
            )}
          </button>
        </div>
      </aside>

      {/* -------------------- 2. MAIN CONTENT AREA -------------------- */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-x-hidden transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >

        {/* Top Header Bar - FIXED/STICKY */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop collapse/expand toggle button in Navbar */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-200 dark:border-slate-700/60"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            <div>
              {activeMenu === 'compliance' ? (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                    Compliance Check
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    <button
                      type="button"
                      onClick={handleOpenDashboard}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                    >
                      Dashboard
                    </button>
                    <span>&gt;</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Compliance Check</span>
                    <span>&gt;</span>
                    <span className="text-slate-400">Overview</span>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                    Dashboard
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    AI-Powered Tender Compliance &amp; Verification
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Top Header Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Search Input matching screenshot */}
            <div className="relative hidden md:block w-56 lg:w-72">
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Notification Bell with Badge 6 */}
            <button
              onClick={() => alert('6 Notifications: 2 new bids submitted, 1 high-risk anomaly flagged, 3 compliance checks ready.')}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white dark:border-slate-900">
                6
              </span>
            </button>

            {/* Officer Profile Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs ring-2 ring-white dark:ring-slate-800">
                  {initials}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-none">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {officerName}
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {officerRole}
                  </span>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 sm:hidden">
                    <p className="font-bold text-slate-900 dark:text-white">{officerName}</p>
                    <p className="text-[11px] text-slate-500">{officerRole}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-semibold"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="p-4 sm:p-6 space-y-6 flex-1">
          {activeMenu === 'compliance' ? (
            <ComplianceCheckView onBackToDashboard={handleOpenDashboard} />
          ) : (
            <>

          {/* -------------------- 3. TOP STATS CARDS -------------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* Card 1: Total Tenders */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tenders</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {metrics.totalTenders}
                  </h3>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                    <span>↑ {metrics.totalTendersTrend?.replace('+', '')}</span>
                    <span className="text-slate-400 font-normal">from last month</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Submissions Received */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Submissions Received</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {metrics.submissionsReceived}
                  </h3>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                    <span>↑ {metrics.submissionsReceivedTrend?.replace('+', '')}</span>
                    <span className="text-slate-400 font-normal">from last month</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Evaluations Completed */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Evaluations Completed</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {metrics.evaluationsCompleted}
                  </h3>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                    <span>↑ {metrics.evaluationsCompletedTrend?.replace('+', '')}</span>
                    <span className="text-slate-400 font-normal">from last month</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4: Compliance Issues */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Compliance Issues</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {metrics.complianceIssues}
                  </h3>
                  <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-0.5">
                    <span>↓ {metrics.complianceIssuesTrend?.replace('-', '')}</span>
                    <span className="text-slate-400 font-normal">from last month</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------- 4. MIDDLE ROW: RECENT TENDERS & COMPLIANCE OVERVIEW -------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Recent Tenders Table (~62%) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Tenders
                </h3>
                <Link
                  to="/tenders"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase tracking-wider text-[10.5px] border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3 font-semibold">Tender ID</th>
                      <th className="py-3 font-semibold">Title</th>
                      <th className="py-3 font-semibold">Department</th>
                      <th className="py-3 font-semibold">Last Date</th>
                      <th className="py-3 font-semibold text-center">Submissions</th>
                      <th className="py-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {recentTenders.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 font-semibold text-blue-600 dark:text-blue-400">
                          <Link to="/tenders" className="hover:underline">
                            {item.id}
                          </Link>
                        </td>
                        <td className="py-3 text-slate-900 dark:text-slate-200 max-w-[190px] truncate">
                          {item.title}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-400">
                          {item.department}
                        </td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">
                          {item.lastDate}
                        </td>
                        <td className="py-3 text-center text-slate-700 dark:text-slate-200 font-bold">
                          {item.submissions}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${item.status === 'Open'
                                ? 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Compliance Overview Donut Chart (~38%) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Compliance Overview
                  </h3>
                  <div className="relative">
                    <select
                      value={compliance.timeFilter || timeFilter}
                      onChange={(e) => {
                        setTimeFilter(e.target.value);
                        dispatch(setReduxTimeFilter(e.target.value));
                      }}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="This Month">This Month</option>
                      <option value="Last Month">Last Month</option>
                      <option value="This Quarter">This Quarter</option>
                    </select>
                  </div>
                </div>

                {/* Donut Chart & Legend */}
                <div className="flex items-center justify-between gap-4 my-4">
                  {/* SVG Donut */}
                  <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      {/* Background circle */}
                      <path
                        className="text-slate-100 dark:text-slate-800"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Compliant: 73% (stroke-dasharray="73, 100") */}
                      <path
                        className="text-emerald-500"
                        strokeDasharray={`${compliance.compliantPercentage || 73}, 100`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Minor Issues: 18% (offset 73) */}
                      <path
                        className="text-amber-500"
                        strokeDasharray={`${compliance.minorIssuesPercentage || 18}, 100`}
                        strokeDashoffset={`-${compliance.compliantPercentage || 73}`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Major Issues: 9% (offset 91) */}
                      <path
                        className="text-rose-500"
                        strokeDasharray={`${compliance.majorIssuesPercentage || 9}, 100`}
                        strokeDashoffset={`-${(compliance.compliantPercentage || 73) + (compliance.minorIssuesPercentage || 18)}`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>

                    {/* Donut Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {compliance.totalChecks}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
                        Total Checks
                      </span>
                    </div>
                  </div>

                  {/* Legend Counts */}
                  <div className="space-y-2.5 text-xs flex-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Compliant
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {compliance.compliant} <span className="text-slate-400 font-normal">({compliance.compliantPercentage}%)</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Minor Issues
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {compliance.minorIssues} <span className="text-slate-400 font-normal">({compliance.minorIssuesPercentage}%)</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        Major Issues
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {compliance.majorIssues} <span className="text-slate-400 font-normal">({compliance.majorIssuesPercentage}%)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Compliance Rate Progress Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">Compliance Rate</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span>{compliance.complianceRate}%</span>
                    <span className="text-[11px] font-bold">↑ {compliance.complianceRateTrend?.replace('+', '')} from last month</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${compliance.complianceRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* -------------------- 5. LOWER ROW: RECENT SUBMISSIONS & AI ACTIVITY -------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Recent Submissions Table (~62%) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Submissions
                </h3>
                <Link
                  to="/tenders"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase tracking-wider text-[10.5px] border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3 font-semibold">Tender ID</th>
                      <th className="py-3 font-semibold">Bidder Name</th>
                      <th className="py-3 font-semibold">Submitted On</th>
                      <th className="py-3 font-semibold">Compliance Score</th>
                      <th className="py-3 font-semibold text-center">Bidder Docs</th>
                      <th className="py-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {recentSubmissions.map((sub, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 font-semibold text-blue-600 dark:text-blue-400">
                          <button
                            type="button"
                            onClick={handleOpenCompliance}
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                            title="Open Compliance Check"
                          >
                            {sub.tenderId}
                          </button>
                        </td>
                        <td className="py-3 text-slate-900 dark:text-slate-200">
                          {sub.bidder}
                        </td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">
                          {sub.submittedOn}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 w-8">
                              {sub.score}%
                            </span>
                            <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${sub.score >= 80
                                    ? 'bg-emerald-500'
                                    : sub.score >= 60
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                style={{ width: `${sub.score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedDocSubmission(sub)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] transition border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs group"
                            title="Click to view bidder's uploaded documents"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span>{sub.documents?.length || 3} Files</span>
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${sub.statusColor === 'emerald'
                                ? 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : sub.statusColor === 'amber'
                                  ? 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                  : 'bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: AI Verification Activity (~38%) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  AI Verification Activity
                </h3>
                <Link
                  to="/reports"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {activities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="py-3 flex items-start gap-3">
                      <div className={`p-1.5 rounded-full shrink-0 ${act.iconColor}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {act.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {act.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {act.subtext}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* -------------------- 6. BOTTOM ROW: QUICK ACTIONS & AI ASSISTANT -------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Quick Actions (~60%) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">

                <Link
                  to="/tenders"
                  className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                >
                  <Search className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Search Tenders</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Upload Documents</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCompliance}
                  className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                >
                  <Brain className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">AI Compliance Check</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEvalModalOpen(true)}
                  className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                >
                  <ClipboardCheck className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">View My Evaluations</span>
                </button>

                <Link
                  to="/reports"
                  className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                >
                  <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Generate Report</span>
                </Link>
              </div>
            </div>

            {/* Right: AI Assistant (RAG) (~40%) */}
            <div
              id="rag-section"
              className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>AI Assistant (RAG)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setChatBoxOpen(true)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Open Live Chatbox</span>
                </button>
              </div>

              <form onSubmit={handleAskRag} className="flex items-center gap-2">
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  placeholder="Ask any question about tender documents, compliance rules, or GeM guidelines..."
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isAskingRag || !ragQuery.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>{isAskingRag ? 'Analyzing...' : 'Ask AI Assistant'}</span>
                </button>
              </form>

              {/* RAG Response display */}
              {ragResponse && (
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      {ragResponse.title}
                    </p>
                    <button
                      onClick={() => setRagResponse(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {ragResponse.text}
                  </p>
                  <p
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold pt-1"
                    dangerouslySetInnerHTML={{ __html: ragResponse.confidence }}
                  />
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </main>

        {/* -------------------- 7. FOOTER -------------------- */}
        <footer className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2024 GemCompliance Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11.5px]">
            <span>Version 1.0.0</span>
            <span>&bull;</span>
            <Link to="/#footer" className="hover:underline">Privacy Policy</Link>
            <span>&bull;</span>
            <Link to="/#footer" className="hover:underline">Terms of Service</Link>
          </div>
        </footer>
      </div>

      {/* -------------------- MODAL: UPLOAD & EXTRACT -------------------- */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Upload Tender Document for AI Extraction
                </h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center space-y-2 hover:border-blue-500 transition cursor-pointer">
              <UploadCloud className="w-10 h-10 text-blue-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Drag and drop RFP / Bid documents (PDF, DOCX)
              </p>
              <p className="text-[11px] text-slate-400">
                Max file size: 50MB &bull; Automated OCR & GFR clause parsing
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Document uploaded! AI parsing initiated.');
                  setUploadModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Start Extraction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: MY EVALUATIONS -------------------- */}
      {evalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Assigned Tender Evaluations
                </h3>
              </div>
              <button
                onClick={() => setEvalModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">GEM/2024/B/5123981 - Office Stationery</p>
                  <p className="text-[11px] text-slate-500">8 Bids received &bull; 6 Compliant, 2 Flags</p>
                </div>
                <Link to="/verification" onClick={() => setEvalModalOpen(false)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold">
                  Evaluate
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">GEM/2024/B/5123982 - IT Hardware Procurement</p>
                  <p className="text-[11px] text-slate-500">12 Bids received &bull; 10 Compliant, 1 Major Issue</p>
                </div>
                <Link to="/verification" onClick={() => setEvalModalOpen(false)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold">
                  Evaluate
                </Link>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setEvalModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: INSPECT BIDDER UPLOADED DOCUMENTS -------------------- */}
      {selectedDocSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                    {selectedDocSubmission.tenderId}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Bidder Proposal Dossier
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedDocSubmission.bidder}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDocSubmission.tenderTitle || 'Turnkey EPC / Procurement Proposal'}
                </p>
              </div>
              <button
                onClick={() => setSelectedDocSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metadata Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Quoted Amount</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDocSubmission.quotedAmount || '₹ 42.80 Cr'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Compliance Score</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedDocSubmission.score}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted On</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{selectedDocSubmission.submittedOn}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Officer Status</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{selectedDocSubmission.status}</span>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Bidder Uploaded Documents ({selectedDocSubmission.documents?.length || 0})</span>
                </h4>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Verified by Autonomous AI
                </span>
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {(selectedDocSubmission.documents || [
                  { name: 'Technical_Proposal.pdf', size: '3.4 MB', status: 'Verified' },
                  { name: 'BOQ_Price_Schedule.xlsx', size: '512 KB', status: 'Verified' },
                  { name: 'GFR_144xi_Land_Border_Declaration.pdf', size: '420 KB', status: 'Compliant' },
                ]).map((doc, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-600 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {doc.name}
                        </p>
                        <p className="text-[10.5px] text-slate-400">
                          Size: {doc.size} &bull; <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{doc.status || 'Verified'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => alert(`Opening preview for ${doc.name}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => alert(`Downloading verified copy of ${doc.name}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Officer Action Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Verified against GFR Rule 144(xi) &amp; CVC Guidelines
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    alert(`Clarification request dispatched to bidder: ${selectedDocSubmission.bidder}`);
                    setSelectedDocSubmission(null);
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                >
                  Request Clarification
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Bidder ${selectedDocSubmission.bidder} approved and qualified for technical stage!`);
                    setSelectedDocSubmission(null);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer"
                >
                  Approve Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- AI CHATBOX (INTERACTIVE MODAL / DRAWER) -------------------- */}
      <ChatBox
        isOpen={chatBoxOpen}
        onClose={() => setChatBoxOpen(false)}
      />

      {/* Floating Chat Launcher Button (When chatbox is closed) */}
      {!chatBoxOpen && (
        <button
          type="button"
          onClick={() => setChatBoxOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white font-bold text-xs shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all cursor-pointer border border-white/20 group"
          title="Open GeM AI Compliance Assistant"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-emerald-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span>Ask AI Assistant</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
        </button>
      )}

    </div>
  );
};

export default Dashboard;
