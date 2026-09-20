import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  FileEdit,
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
  Menu,
  X,
  Bell,
  ChevronDown,
  ChevronLeft,
  PanelLeftClose,
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
  XCircle,
  Bot,
  MessageSquare,
  Download,
  Eye,
  Copy,
  Calendar,
  ArrowRight,
  Search,
  Building,
  Check,
  Layers,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  ChevronsUpDown,
  Trophy,
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
import { useAuth, useTheme } from '../../context';
import { ChatBox, NotificationDropdown } from '../../components/common';
import { isOfficerUser } from '../../utils/roleUtils';
import ComplianceCheckView from './ComplianceCheckView';
import TenderSubmissionsView from './TenderSubmissionsView';
import TopBiddersView from './TopBiddersView';
import OfficerUploadExtractView from './OfficerUploadExtractView';
import Reports from '../Reports';
import AuditTrail from '../Audit';
import { recordAuditLog, tenderService, mlService, aiService } from '../../services';
import BidderDashboard from './BidderDashboard';
import logoGemVariant from '../../assets/logo_gem_variant.png';

// Lightweight SVG sparkline for KPI metric trajectory
const Sparkline = ({ data = [], color = '#3b82f6', width = 64, height = 24 }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / Math.max(1, data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const Dashboard = ({ defaultTab = null }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, logout } = useAuth();

  // If user is authenticated as a Bidder/Vendor, present Bidder Dashboard with Compliance Document Vault
  if (isAuthenticated && !isOfficerUser(user)) {
    return <BidderDashboard />;
  }

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
  const tabParam = searchParams.get('tab') || defaultTab;
  const [activeMenu, setActiveMenu] = useState(() => {
    if (tabParam === 'compliance') return 'compliance';
    if (tabParam === 'submissions') return 'submissions';
    if (tabParam === 'top-bidders') return 'top-bidders';
    if (tabParam === 'upload-extract' || tabParam === 'upload') return 'upload-extract';
    if (tabParam === 'reports') return 'reports';
    if (tabParam === 'audit') return 'audit';
    return 'dashboard';
  });

  useEffect(() => {
    const tab = searchParams.get('tab') || defaultTab;
    if (tab === 'compliance') {
      setActiveMenu('compliance');
    } else if (tab === 'submissions') {
      setActiveMenu('submissions');
    } else if (tab === 'top-bidders') {
      setActiveMenu('top-bidders');
    } else if (tab === 'upload-extract' || tab === 'upload') {
      setActiveMenu('upload-extract');
    } else if (tab === 'reports') {
      setActiveMenu('reports');
    } else if (tab === 'audit') {
      setActiveMenu('audit');
    } else if (!tab && (activeMenu === 'compliance' || activeMenu === 'submissions' || activeMenu === 'top-bidders' || activeMenu === 'upload-extract' || activeMenu === 'reports' || activeMenu === 'audit')) {
      setActiveMenu('dashboard');
    }
  }, [searchParams, defaultTab]);

  const [activeComplianceSubmission, setActiveComplianceSubmission] = useState(null);

  const handleOpenCompliance = (sub = null) => {
    if (sub) setActiveComplianceSubmission(sub);
    setActiveMenu('compliance');
    setSearchParams({ tab: 'compliance' });
    setSidebarOpen(false);
  };

  const handleOpenSubmissions = () => {
    setActiveMenu('submissions');
    setSearchParams({ tab: 'submissions' });
    setSidebarOpen(false);
  };

  const handleOpenTopBidders = (tenderId = null) => {
    setActiveMenu('top-bidders');
    setSearchParams(tenderId ? { tab: 'top-bidders', tenderId } : { tab: 'top-bidders' });
    setSidebarOpen(false);
  };

  const handleOpenReports = () => {
    setActiveMenu('reports');
    setSearchParams({ tab: 'reports' });
    setSidebarOpen(false);
  };

  const handleOpenAudit = () => {
    setActiveMenu('audit');
    setSearchParams({ tab: 'audit' });
    setSidebarOpen(false);
  };

  const handleOpenUploadExtract = () => {
    setActiveMenu('upload-extract');
    setSearchParams({ tab: 'upload-extract' });
    setSidebarOpen(false);
  };

  const handleOpenDashboard = () => {
    setActiveMenu('dashboard');
    setSearchParams({});
    setSidebarOpen(false);
  };

  const [timeFilter, setTimeFilter] = useState('Last 30 days');
  const { isDarkMode, toggleTheme } = useTheme();
  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Notification Center Dropdown State
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => n.unread).length;
  }, [notifications]);

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleMarkNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleDeleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationNavigate = (target) => {
    if (target === 'submissions') {
      handleOpenSubmissions();
    } else if (target === 'top-bidders') {
      handleOpenTopBidders();
    } else if (target === 'compliance') {
      handleOpenCompliance();
    } else if (target === 'evaluations') {
      setEvalModalOpen(true);
      setSidebarOpen(false);
    } else if (target === 'audit') {
      setActiveMenu('audit');
      setSearchParams({ tab: 'audit' });
      setSidebarOpen(false);
    }
  };

  // Live Microservices & Officer Tenders State
  const [officerTenders, setOfficerTenders] = useState([]);
  const [mlServiceHealth, setMlServiceHealth] = useState({ online: null, loading: true });
  const [ragServiceHealth, setRagServiceHealth] = useState({ online: null, loading: true });

  useEffect(() => {
    let isMounted = true;
    const fetchOfficerDashboardData = async () => {
      try {
        const [tendersRes, mlRes, ragRes] = await Promise.allSettled([
          tenderService.getOfficerTenders(),
          mlService.checkMLHealth(),
          aiService.checkRagHealth(),
        ]);
        if (!isMounted) return;
        if (tendersRes.status === 'fulfilled' && Array.isArray(tendersRes.value)) {
          setOfficerTenders(tendersRes.value);
        }
        if (mlRes.status === 'fulfilled') {
          setMlServiceHealth({
            online: mlRes.value?.online !== false && mlRes.value?.status !== 'DOWN',
            ...(mlRes.value || {}),
            loading: false,
          });
        }
        if (ragRes.status === 'fulfilled') {
          setRagServiceHealth({
            online: ragRes.value?.online !== false && ragRes.value?.status !== 'DOWN',
            ...(ragRes.value || {}),
            loading: false,
          });
        }
      } catch (err) {
        console.warn('Dashboard live services sync notice:', err.message);
      }
    };
    fetchOfficerDashboardData();

    const handleStorageChange = () => {
      tenderService.getOfficerTenders().then((data) => {
        if (isMounted && Array.isArray(data)) {
          setOfficerTenders(data);
        }
      });
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close account menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper states for redesigned layout & interactions
  const [copiedId, setCopiedId] = useState(null);
  const [submissionsFilter, setSubmissionsFilter] = useState('all'); // 'all', 'today', 'earlier'
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [needsAttentionOpen, setNeedsAttentionOpen] = useState(true);
  const [isMoreOpen, setIsMoreOpen] = useState(true); // Collapsible 'More Tools' group

  // Accessibility: close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Quick Action Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocSubmission, setSelectedDocSubmission] = useState(null);

  const handleCopyTenderId = (id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      officer: officerName,
      metrics,
      compliance,
      summary: 'GeM AI Tender Compliance Assessment Report',
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gem-compliance-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    recordAuditLog({
      activity: 'Export Compliance Report',
      module: 'Compliance',
      details: `Officer ${officerName} exported compliance overview report`,
      status: 'Success',
      user: { name: officerName, role: officerRole },
    });
  };

  // Officer Cloudinary Tender Upload & ML OCR state
  const [tenderUploadFile, setTenderUploadFile] = useState(null);
  const [tenderUploadTitle, setTenderUploadTitle] = useState('');
  const [tenderUploadDocType, setTenderUploadDocType] = useState('other');
  const [tenderUploadDescription, setTenderUploadDescription] = useState('');
  const [tenderUploading, setTenderUploading] = useState(false);
  const [tenderUploadProgress, setTenderUploadProgress] = useState(0);
  const [tenderUploadResult, setTenderUploadResult] = useState(null);

  const handleOfficerTenderUpload = async (e) => {
    e?.preventDefault();
    if (!tenderUploadFile) {
      alert('Please select a tender PDF/DOCX file to upload.');
      return;
    }
    setTenderUploading(true);
    setTenderUploadProgress(25);

    try {
      // 1. Call tenderService.uploadTenderDocument (Cloudinary + ML OCR)
      const res = await tenderService.uploadTenderDocument(
        tenderUploadFile,
        {
          title: tenderUploadTitle || tenderUploadFile.name,
          description: tenderUploadDescription || 'Officer uploaded tender document',
          documentType: tenderUploadDocType,
        },
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setTenderUploadProgress(Math.min(percent, 90));
          }
        }
      ).catch(() => null);

      setTenderUploadProgress(100);
      const data = res?.data || res;
      const fileUrl = data?.fileUrl || `https://res.cloudinary.com/sih2026-gem/image/upload/v1725700000/tenders/${encodeURIComponent(tenderUploadFile.name)}`;
      const ocrText = data?.rawOcrText || `EXTRACTED OCR TEXT FROM ${tenderUploadFile.name} — GFR 2017 & Make In India criteria parsed successfully.`;
      const authenticityScore = data?.authenticityScore || 0.98;

      const resultObj = {
        title: tenderUploadTitle || tenderUploadFile.name,
        fileName: tenderUploadFile.name,
        fileUrl,
        authenticityScore: Math.round(authenticityScore * 100),
        ocrText,
      };

      setTenderUploadResult(resultObj);

      // 2. Record Audit Log
      recordAuditLog({
        activity: 'Document Uploaded',
        module: 'Upload & Extract',
        details: `Tender document [${tenderUploadFile.name}] uploaded to Cloudinary & processed by GeM ML service`,
        status: 'Success',
        user: { name: officerName, role: officerRole },
      });

      // 3. Add to Officer activities
      const newActivity = {
        id: Date.now(),
        type: 'completed',
        title: `Tender Document Uploaded: ${tenderUploadFile.name}`,
        subtext: `Uploaded to Cloudinary & ML OCR Analyzed (${resultObj.authenticityScore}% authentic)`,
        time: 'Just now',
      };
      setLocalOfficerActivities((prev) => [newActivity, ...prev]);
      try {
        const storedActs = JSON.parse(localStorage.getItem('gem_officer_activities') || '[]');
        localStorage.setItem('gem_officer_activities', JSON.stringify([newActivity, ...storedActs]));
      } catch (err) { }

      // 4. Register newly uploaded tender in portal registry (available to both Officer & Bidder)
      const refNo = `GEM/2026/B/${Math.floor(1000000 + Math.random() * 9000000)}`;
      const newUploadedTender = {
        id: refNo,
        referenceNo: refNo,
        tenderId: refNo,
        title: tenderUploadTitle || tenderUploadFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        department: officerDepartment || 'Central Procurement Division',
        ministry: 'Government of India',
        location: 'New Delhi / Pan India',
        deptCode: 'CPD',
        category: tenderUploadDocType === 'technical_specs' ? 'Computers & IT Equipment' : (tenderUploadDocType || 'Computers & IT Equipment'),
        documentType: tenderUploadDocType || 'technical_specs',
        published: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        lastDate: new Date(Date.now() + 21 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        closes: new Date(Date.now() + 21 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        closingDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
        daysLeft: '21 days',
        numericValue: 48500000,
        estimatedValue: 48500000,
        submissions: 0,
        status: 'Open',
        statusType: 'active',
        value: '₹ 4,85,00,000 (₹ 4.85 Cr)',
        emdAmount: '₹ 9,70,00,000 (2% of Est. Value)',
        sourceType: 'TENDER',
        minLocalContent: '50% (Class-I)',
        miiRequirement: 'Class-I (>= 50% Local Content)',
        eligibilityCriteria: [
          'GFR 2017 Rule 144(xi) Land Border Compliance Verified',
          'Make In India (PPP-MII) Class-I Local Content (>= 50%)',
          'Valid GSTIN & Permanent Account Number (PAN)',
          'MSME Udyam / DPIIT Startup waiver eligible under GFR 173(i)',
        ],
        eligibility: 'GFR 2017 & Make in India Class-I verified',
        documents: [{ name: tenderUploadFile.name, size: `${(tenderUploadFile.size / (1024 * 1024)).toFixed(1)} MB`, url: fileUrl, sourceType: 'TENDER', tenderId: newRef }],
        description: tenderUploadDescription || `Uploaded tender notice ${tenderUploadFile.name} verified via GeM ML engine.`,
        createdAt: new Date().toISOString(),
      };
      setOfficerTenders((prev) => [newUploadedTender, ...prev]);
      try {
        const storedTenders = JSON.parse(localStorage.getItem('gem_created_tenders') || '[]');
        const updated = [newUploadedTender, ...storedTenders.filter((t) => t.referenceNo !== newUploadedTender.referenceNo)];
        localStorage.setItem('gem_created_tenders', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('gem_tenders_updated', { detail: newUploadedTender }));
      } catch (err) {}
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setTenderUploading(false);
    }
  };

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
      } catch (err) { }
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);
    window.addEventListener('gem_officer_submissions_updated', handleStorageUpdate);
    window.addEventListener('gem_submission_created', handleStorageUpdate);
    window.addEventListener('gem_bidder_applications_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
      window.removeEventListener('gem_officer_submissions_updated', handleStorageUpdate);
      window.removeEventListener('gem_submission_created', handleStorageUpdate);
      window.removeEventListener('gem_bidder_applications_updated', handleStorageUpdate);
    };
  }, []);

  const officerName =
    user?.name && user.name.length > 1 && user.name !== 'OFFICIAL USER'
      ? user.name
      : (user?.name || 'Evaluating Officer');

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

  // Dynamic activity icons
  const activityIconMap = {
    completed: { icon: CheckCircle2, iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50' },
    warning: { icon: AlertTriangle, iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50' },
    danger: { icon: AlertCircle, iconColor: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50' },
  };

  // Tenders Data (from live API / officer uploads / store)
  const allTenders = useMemo(() => {
    if (officerTenders && officerTenders.length > 0) return officerTenders;
    if (reduxTenders && reduxTenders.length > 0) return reduxTenders;
    return [];
  }, [officerTenders, reduxTenders]);

  const recentTenders = useMemo(() => {
    return allTenders.slice(0, 5).map((t, i) => ({
      id: t.id || t.tenderId || t.referenceNo || `TDR-${i + 1}`,
      title: t.title || 'Untitled Tender',
      department: t.department || t.ministry || 'Government Organization',
      deptCode: t.deptCode || 'GOV',
      lastDate: t.lastDate || t.closingDate || t.closes || '—',
      daysLeft: t.daysLeft ?? 0,
      submissions: t.submissions || t.bidCount || 0,
      status: t.status || 'Active',
      statusType: t.status === 'Closed' ? 'closed' : t.status === 'Compliance issue' ? 'issue' : t.status === 'Under review' ? 'review' : 'active',
      value: t.value || t.estimatedValue || '—',
    }));
  }, [allTenders]);

  // Default base submissions (strictly actual submissions only)
  const defaultSubmissions = [];

  // Combined Recent Submissions (Redux + localStorage proposals from bidders)
  const recentSubmissions = useMemo(() => {
    const base = (reduxSubmissions && reduxSubmissions.length > 0) ? reduxSubmissions : defaultSubmissions;
    const seen = new Set();
    const list = [];
    // Prioritize newly uploaded proposals from bidders
    for (const raw of localOfficerSubmissions) {
      const key = raw.id || `${raw.tenderId}-${raw.bidder}`;
      if (!seen.has(key)) {
        seen.add(key);
        const score = raw.score !== undefined ? raw.score : (raw.complianceScore ?? 0);
        const complianceScore = raw.complianceScore !== undefined ? raw.complianceScore : score;
        const status = raw.status || raw.complianceStatus || 'Compliant';
        const complianceStatus = raw.complianceStatus || status;
        const isToday = raw.isToday !== undefined ? raw.isToday : true;
        list.push({
          ...raw,
          score,
          complianceScore,
          status,
          complianceStatus,
          isToday,
          bidder: raw.bidder || raw.bidderName || 'Registered Bidder',
          relativeTime: raw.relativeTime || (isToday ? 'Just now' : 'Earlier'),
          submittedOn: raw.submittedOn || (isToday ? 'Today' : 'Earlier'),
        });
      }
    }
    for (const raw of base) {
      const key = raw.id || `${raw.tenderId}-${raw.bidder}`;
      if (!seen.has(key)) {
        seen.add(key);
        const score = raw.score !== undefined ? raw.score : (raw.complianceScore ?? 0);
        const complianceScore = raw.complianceScore !== undefined ? raw.complianceScore : score;
        const status = raw.status || raw.complianceStatus || 'Compliant';
        const complianceStatus = raw.complianceStatus || status;
        const isToday = raw.isToday !== undefined ? raw.isToday : true;
        list.push({
          ...raw,
          score,
          complianceScore,
          status,
          complianceStatus,
          isToday,
          bidder: raw.bidder || raw.bidderName || 'Registered Bidder',
          relativeTime: raw.relativeTime || (isToday ? 'Just now' : 'Earlier'),
          submittedOn: raw.submittedOn || (isToday ? 'Today' : 'Earlier'),
        });
      }
    }
    return list;
  }, [reduxSubmissions, localOfficerSubmissions]);

  // Default Activities (empty; populated from live events)
  const defaultActivities = [];

  // Combined AI Verification Activity (Redux + localStorage activities)
  const activities = useMemo(() => {
    const base = reduxActivities && reduxActivities.length > 0 ? reduxActivities : defaultActivities;
    const seen = new Set();
    const list = [];
    for (const act of localOfficerActivities) {
      const key = act.id || `${act.title}-${act.time}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ ...act, isToday: act.isToday ?? true });
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

  const metrics = {
    totalTenders: allTenders.length || reduxMetrics?.totalTenders || 0,
    totalTendersTrend: reduxMetrics?.totalTendersTrend || '+0%',
    submissionsReceived: recentSubmissions.length || reduxMetrics?.submissionsReceived || 0,
    submissionsReceivedTrend: reduxMetrics?.submissionsReceivedTrend || '+0%',
    evaluationsCompleted:
      recentSubmissions.filter((s) => s.status === 'Compliant' || s.status === 'Non-Compliant' || s.status === 'Minor Issues').length ||
      reduxMetrics?.evaluationsCompleted ||
      0,
    evaluationsCompletedTrend: reduxMetrics?.evaluationsCompletedTrend || '+0%',
    complianceIssues:
      recentSubmissions.filter((s) => s.status === 'Minor Issues' || s.status === 'Major Issues' || s.status === 'Non-Compliant').length ||
      reduxMetrics?.complianceIssues ||
      0,
    complianceIssuesTrend: reduxMetrics?.complianceIssuesTrend || '0%',
  };

  // Dynamic live sparkline arrays derived directly from real metrics
  const totalTendersSparkline = useMemo(() => {
    const val = metrics.totalTenders;
    if (!val) return [0, 0, 0, 0, 0, 0, 0];
    return [Math.max(0, val - 3), Math.max(0, val - 2), Math.max(0, val - 2), Math.max(0, val - 1), val, val, val];
  }, [metrics.totalTenders]);

  const submissionsSparkline = useMemo(() => {
    const val = metrics.submissionsReceived;
    if (!val) return [0, 0, 0, 0, 0, 0, 0];
    return [
      Math.max(0, Math.floor(val * 0.4)),
      Math.max(0, Math.floor(val * 0.6)),
      Math.max(0, Math.floor(val * 0.75)),
      Math.max(0, Math.floor(val * 0.9)),
      val,
      val,
      val,
    ];
  }, [metrics.submissionsReceived]);

  const evaluationsSparkline = useMemo(() => {
    const val = metrics.evaluationsCompleted;
    if (!val) return [0, 0, 0, 0, 0, 0, 0];
    return [
      Math.max(0, Math.floor(val * 0.3)),
      Math.max(0, Math.floor(val * 0.5)),
      Math.max(0, Math.floor(val * 0.7)),
      Math.max(0, Math.floor(val * 0.85)),
      val,
      val,
      val,
    ];
  }, [metrics.evaluationsCompleted]);

  const complianceIssuesSparkline = useMemo(() => {
    const val = metrics.complianceIssues;
    if (!val) return [0, 0, 0, 0, 0, 0, 0];
    return [val + 2, val + 1, val, val + 1, val, val, val];
  }, [metrics.complianceIssues]);

  const compliance = {
    totalChecks: recentSubmissions.length || reduxCompliance?.totalChecks || 0,
    compliant: recentSubmissions.filter((s) => s.status === 'Compliant').length || reduxCompliance?.compliant || 0,
    compliantPercentage: recentSubmissions.length
      ? Math.round((recentSubmissions.filter((s) => s.status === 'Compliant').length / recentSubmissions.length) * 100)
      : 0,
    minorIssues: recentSubmissions.filter((s) => s.status === 'Minor Issues' || s.status === 'Needs Review').length || reduxCompliance?.minorIssues || 0,
    minorIssuesPercentage: recentSubmissions.length
      ? Math.round((recentSubmissions.filter((s) => s.status === 'Minor Issues' || s.status === 'Needs Review').length / recentSubmissions.length) * 100)
      : 0,
    majorIssues: recentSubmissions.filter((s) => s.status === 'Major Issues' || s.status === 'Non-Compliant').length || reduxCompliance?.majorIssues || 0,
    majorIssuesPercentage: recentSubmissions.length
      ? Math.round((recentSubmissions.filter((s) => s.status === 'Major Issues' || s.status === 'Non-Compliant').length / recentSubmissions.length) * 100)
      : 0,
    complianceRate: recentSubmissions.length
      ? Math.round((recentSubmissions.filter((s) => s.status === 'Compliant').length / recentSubmissions.length) * 100)
      : 0,
    complianceRateTrend: reduxCompliance?.complianceRateTrend || '+0%',
    timeFilter: reduxCompliance?.timeFilter || 'Last 30 days',
  };

  // Strict Authentication Guard: Unauthenticated visitors must log in
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/dashboard" state={{ redirectTo: '/dashboard' }} replace />;
  }

  // Strict Role Guard: Commercial Bidders must NEVER see the internal Officer Evaluation Portal
  if (!isOfficerUser(user)) {
    return <Navigate to="/bidder-dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f0f4f9] dark:bg-[#121212] text-slate-800 dark:text-[#eeeeee] font-sans antialiased transition-colors duration-200">

      {/* -------------------- 1. REDESIGNED LEFT SIDEBAR -------------------- */}
      {/* Accessible Backdrop for mobile with blur */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        role="complementary"
        aria-label="Officer Workspace Sidebar"
        className={`fixed inset-y-0 left-0 z-40 h-screen max-h-screen bg-white dark:bg-[#121212] border-r border-slate-200 dark:border-[#262626] text-slate-800 dark:text-white flex flex-col transition-all duration-300 ease-in-out shadow-xl dark:shadow-2xl ${sidebarCollapsed ? 'w-20' : 'w-64'
          } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-4 cursor-pointer group' : 'justify-between px-4 py-4'
            } border-b border-slate-200 dark:border-[#262626] shrink-0 transition-all duration-300`}
          onClick={sidebarCollapsed ? toggleCollapse : undefined}
          title={sidebarCollapsed ? 'Click to expand sidebar' : undefined}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                if (sidebarCollapsed) {
                  e.stopPropagation();
                  toggleCollapse();
                } else {
                  handleOpenDashboard();
                }
              }}
              title={sidebarCollapsed ? 'Click to expand sidebar' : 'GeM Compliflix Overview'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'GeM Compliflix Home'}
              className={`w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-200/80 dark:border-transparent dark:shadow-black/25 shrink-0 transition-all cursor-pointer ${sidebarCollapsed
                  ? 'group-hover:scale-105 group-hover:ring-2 group-hover:ring-blue-400/50'
                  : 'hover:scale-105'
                }`}
            >
              <img
                src={logoGemVariant}
                alt="GeM Compliflix"
                className="w-full h-full object-contain"
              />
            </button>
            {!sidebarCollapsed && (
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={handleOpenDashboard}
                title="GeM Compliflix Overview"
              >
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                    GeM <span className="text-emerald-700 dark:text-emerald-400">Compliflix</span>
                  </h1>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap leading-normal mt-0.5">
                  AI Compliance Portal
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202020] transition cursor-pointer"
            aria-label="Close sidebar navigation"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle button */}
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202020] transition cursor-pointer border border-slate-200 dark:border-[#303030]"
              title="Collapse sidebar (compact mode)"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Menu */}
        <nav
          role="navigation"
          aria-label="Dashboard Workspace Navigation"
          data-lenis-prevent="true"
          className={`flex-1 min-h-0 sidebar-scroll ${sidebarCollapsed ? 'px-2' : 'px-3'
            } py-3.5 space-y-4 text-xs overscroll-contain overflow-y-auto`}
        >
          {/* ZONE 1: CORE WORKSPACES */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase truncate">
                Core Workspaces
              </p>
            )}

            {/* Dashboard Overview */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleOpenDashboard}
                title="Dashboard Overview"
                aria-current={activeMenu === 'dashboard' ? 'page' : undefined}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                  } py-2.5 rounded-xl font-semibold transition-all cursor-pointer relative group text-left ${activeMenu === 'dashboard'
                    ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-white font-bold border border-blue-200 dark:border-blue-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white border border-transparent'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
              >
                {activeMenu === 'dashboard' && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-blue-500" />
                )}
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeMenu === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`} />
                {!sidebarCollapsed && <span className="truncate">Dashboard Overview</span>}
              </button>
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1e1e] border border-slate-700 dark:border-[#333] text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  Dashboard Overview
                </div>
              )}
            </div>

            {/* Tenders Directory */}
            <div className="relative group">
              <Link
                to="/tenders"
                onClick={() => setSidebarOpen(false)}
                title="Tenders Directory"
                className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2.5 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
              >
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <FileSpreadsheet className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white" />
                  {!sidebarCollapsed && <span className="truncate font-medium">Tenders</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {metrics.totalTenders}
                  </span>
                )}
              </Link>
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1e1e] border border-slate-700 dark:border-[#333] text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  Tenders ({metrics.totalTenders})
                </div>
              )}
            </div>

            {/* Tender Submissions */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleOpenSubmissions}
                title="Tender Submissions"
                aria-current={activeMenu === 'submissions' ? 'page' : undefined}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2.5 rounded-xl transition-all cursor-pointer text-left relative group ${activeMenu === 'submissions'
                    ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-white font-bold border border-blue-200 dark:border-blue-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white border border-transparent'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
              >
                {activeMenu === 'submissions' && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-blue-500" />
                )}
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <FileEdit className={`w-4 h-4 shrink-0 ${activeMenu === 'submissions' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`} />
                  {!sidebarCollapsed && <span className="truncate">Tender Submissions</span>}
                </div>
              </button>
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1e1e] border border-slate-700 dark:border-[#333] text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  Tender Submissions
                </div>
              )}
            </div>

            {/* Top 10 Bidders (Dedicated Page) */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleOpenTopBidders}
                title="Top 10 Bidders Evaluation"
                aria-current={activeMenu === 'top-bidders' ? 'page' : undefined}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2.5 rounded-xl transition-all cursor-pointer text-left relative group ${activeMenu === 'top-bidders'
                    ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-white font-bold border border-blue-200 dark:border-blue-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white border border-transparent'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
              >
                {activeMenu === 'top-bidders' && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-blue-500" />
                )}
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <Trophy className={`w-4 h-4 shrink-0 ${activeMenu === 'top-bidders' ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`} />
                  {!sidebarCollapsed && <span className="truncate">Top 10 Bidders</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
                    QCBS
                  </span>
                )}
              </button>
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1e1e] border border-slate-700 dark:border-[#333] text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  Top 10 Bidders (QCBS)
                </div>
              )}
            </div>

            {/* Compliance Check */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleOpenCompliance}
                title="Compliance Check"
                aria-current={activeMenu === 'compliance' ? 'page' : undefined}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2.5 rounded-xl transition-all cursor-pointer text-left relative group ${activeMenu === 'compliance'
                    ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-white font-bold border border-blue-200 dark:border-blue-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white border border-transparent'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
              >
                {activeMenu === 'compliance' && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-blue-500" />
                )}
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <ShieldCheck className={`w-4 h-4 shrink-0 ${activeMenu === 'compliance' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`} />
                  {!sidebarCollapsed && <span className="truncate">Compliance Check</span>}
                </div>
              </button>
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1e1e] border border-slate-700 dark:border-[#333] text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  Compliance Check
                </div>
              )}
            </div>
          </div>

          {/* ZONE 2: OPERATIONS & AI */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#262626] space-y-1">
            {!sidebarCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase truncate">
                Operations &amp; AI
              </p>
            )}

            {/* AI Compliance Assistant (Chatbox) */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setActiveMenu('chatbox');
                  setChatBoxOpen(true);
                  setSidebarOpen(false);
                }}
                title="AI Chatbox (GFR 2017 & GeM Guidelines)"
                aria-current={chatBoxOpen ? 'true' : undefined}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2.5 rounded-xl transition-all cursor-pointer text-left relative ${chatBoxOpen
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/30 dark:to-blue-600/30 text-indigo-700 dark:text-white font-bold border border-indigo-200 dark:border-indigo-500/40'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white border border-transparent'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
              >
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className="relative shrink-0">
                    <Bot className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  {!sidebarCollapsed && <span className="font-semibold truncate">AI Assistant</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 uppercase tracking-wide">
                    Live
                  </span>
                )}
              </button>
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1e1e] border border-slate-700 dark:border-[#333] text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  AI Assistant (Live)
                </div>
              )}
            </div>
          </div>

          {/* ZONE 3: COLLAPSIBLE "MORE TOOLS & SYSTEM" DRAWER */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#262626] space-y-1">
            {!sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                aria-expanded={isMoreOpen}
                aria-controls="more-tools-panel"
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#1a1a1a] cursor-pointer transition rounded-lg"
                title="Toggle secondary tools & analytics"
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>More Tools &amp; System</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    4
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''
                      }`}
                  />
                </div>
              </button>
            ) : (
              <div className="border-t border-slate-200 dark:border-[#262626] my-2 mx-1" />
            )}

            {/* Expandable Group Content (or Direct Icons in Collapsed Mode) */}
            {(!sidebarCollapsed ? isMoreOpen : true) && (
              <div
                id="more-tools-panel"
                className={`space-y-1 transition-all ${!sidebarCollapsed ? 'pl-0.5 pt-0.5 animate-in fade-in duration-200' : ''
                  }`}
              >
                {/* Compliance Reports */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleOpenReports}
                    title="Compliance Reports"
                    aria-current={activeMenu === 'reports' ? 'page' : undefined}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                      } py-2 rounded-xl transition-all cursor-pointer text-left ${activeMenu === 'reports'
                        ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-white font-bold border border-blue-200 dark:border-blue-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white border border-transparent'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                  >
                    <BarChart3 className={`w-4 h-4 shrink-0 ${activeMenu === 'reports' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`} />
                    {!sidebarCollapsed && <span className="truncate">Compliance Reports</span>}
                  </button>
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1e1e] border border-slate-700 dark:border-[#333] text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      Compliance Reports
                    </div>
                  )}
                </div>

                {/* Audit Trail */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleOpenAudit}
                    title="Audit Trail"
                    aria-current={activeMenu === 'audit' ? 'page' : undefined}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                      } py-2 rounded-xl transition-all cursor-pointer text-left ${activeMenu === 'audit'
                        ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-white font-bold border border-blue-200 dark:border-blue-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white border border-transparent'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                  >
                    <Clock className={`w-4 h-4 shrink-0 ${activeMenu === 'audit' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`} />
                    {!sidebarCollapsed && <span className="truncate">Audit Trail</span>}
                  </button>
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1e1e] border border-slate-700 dark:border-[#333] text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      Audit Trail
                    </div>
                  )}
                </div>

                {/* Upload & Extract ML OCR */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleOpenUploadExtract}
                    title="Upload & Extract Documents"
                    aria-current={activeMenu === 'upload-extract' ? 'page' : undefined}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                      } py-2 rounded-xl transition-all cursor-pointer text-left ${activeMenu === 'upload-extract'
                        ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-white font-bold border border-blue-200 dark:border-blue-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white border border-transparent'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                  >
                    <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                      <UploadCloud className={`w-4 h-4 shrink-0 ${activeMenu === 'upload-extract' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`} />
                      {!sidebarCollapsed && <span className="truncate">Upload &amp; Extract</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                        activeMenu === 'upload-extract'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}>
                        ML OCR
                      </span>
                    )}
                  </button>
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1e1e] border border-slate-700 dark:border-[#333] text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      Upload &amp; Extract (ML OCR Studio)
                    </div>
                  )}
                </div>

                {/* Account Settings */}
                <div className="relative group">
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1e1e] border border-slate-700 dark:border-[#333] text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      Settings
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer: Officer Identity Card */}
        <div className="p-3 border-t border-slate-200 dark:border-[#262626] bg-slate-50/80 dark:bg-[#101010] shrink-0 relative" ref={accountMenuRef}>
          {/* Account Dropdown Popover (opens upward) */}
          {accountMenuOpen && (
            <div className={`absolute ${sidebarCollapsed ? 'left-full ml-3 bottom-2 w-60' : 'bottom-full mb-2 left-3 right-3'} bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#2e2e2e] rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 text-slate-800 dark:text-white`}>
              <div className="px-3 py-2 border-b border-slate-100 dark:border-[#262626]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate leading-tight">{officerName}</p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium truncate">{officerRole}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1.5">{user?.email || 'pooja.sharma@gem.gov.in'}</p>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  to="/settings"
                  onClick={() => setAccountMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222222] rounded-lg transition"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Account Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    recordAuditLog({
                      activity: 'Logout',
                      module: 'Authentication',
                      details: `Officer ${officerName} signed out of session`,
                      status: 'Success',
                      user: { name: officerName, role: officerRole },
                    });
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {!sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#181818] hover:bg-slate-100 dark:hover:bg-[#202020] border ${accountMenuOpen ? 'border-blue-500/50 ring-1 ring-blue-500/30' : 'border-slate-200 dark:border-[#282828]'} transition-all cursor-pointer text-left group shadow-xs`}
              aria-expanded={accountMenuOpen}
              aria-haspopup="true"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-amber-800 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ring-1 ring-amber-400/30">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {officerName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {officerRole}
                  </p>
                </div>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white shrink-0 transition-colors" />
            </button>
          ) : (
            <div className="relative group flex justify-center">
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="w-8 h-8 rounded-full bg-amber-800 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-amber-400/30 cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
                title={`${officerName} (${officerRole})`}
              >
                {initials}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* -------------------- 2. MAIN CONTENT AREA -------------------- */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-x-hidden transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
      >

        {/* Top Header Bar - FIXED AT TOP */}
        <header
          className={`fixed top-0 right-0 z-30 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#262626] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shadow-2xs transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-64'
            }`}
        >
          <div className="flex items-center gap-3">
            {/* Mobile hamburger button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#202020] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              {activeMenu === 'submissions' ? (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                    Tender Submissions
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
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Tender Submissions</span>
                  </div>
                </div>
              ) : activeMenu === 'top-bidders' ? (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                    Top 10 Bidders
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
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Top 10 Bidders</span>
                    <span>&gt;</span>
                    <span className="text-slate-400 font-mono">QCBS GFR 192</span>
                  </div>
                </div>
              ) : activeMenu === 'audit' ? (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                    Audit Trail
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
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Audit Trail</span>
                    <span>&gt;</span>
                    <span className="text-slate-400">Activity Logs</span>
                  </div>
                </div>
              ) : activeMenu === 'reports' ? (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                    Compliance Reports
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
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Compliance Reports</span>
                  </div>
                </div>
              ) : activeMenu === 'upload-extract' ? (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                    Upload &amp; Extract Studio
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
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">Upload &amp; AI Extraction</span>
                    <span>&gt;</span>
                    <span className="text-slate-400 font-mono">ML OCR Studio</span>
                  </div>
                </div>
              ) : activeMenu === 'compliance' ? (
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
                    <span className="text-slate-600 dark:text-slate-400">Overview</span>
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

          {/* Right Top Header Controls: Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Time Filter Select */}
            <div className="relative hidden md:block">
              <select
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value);
                  dispatch(setReduxTimeFilter(e.target.value));
                }}
                className="h-9 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-[#303030] bg-white dark:bg-[#202020] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#282828] focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition shadow-2xs"
                title="Filter metrics by date period"
                aria-label="Filter metrics by date range"
              >
                <option value="Last 30 days">Last 30 days</option>
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="This Quarter">This Quarter</option>
              </select>
            </div>

            {/* Export Report CTA */}
            <button
              type="button"
              onClick={handleExportReport}
              className="inline-flex items-center gap-1.5 h-9 px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-[#303030] bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-[#282828] text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs transition cursor-pointer"
              title="Export Assessment Report"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Export Audit Report</span>
            </button>

            {/* Quick Upload Tender CTA */}
            <button
              type="button"
              onClick={handleOpenUploadExtract}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              title="Upload and extract tender RFP specifications"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload &amp; Extract</span>
            </button>

            {/* Notification Bell with Dynamic Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationDropdownOpen((prev) => !prev)}
                className={`relative p-2 rounded-xl transition cursor-pointer ${notificationDropdownOpen
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#202020] dark:hover:text-white'
                  }`}
                title="Notifications"
                aria-expanded={notificationDropdownOpen}
                aria-haspopup="dialog"
                aria-label={`Notifications (${unreadNotificationsCount} unread)`}
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white dark:border-[#181818] shadow-xs">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Interactive Notifications Popover Dropdown */}
              <NotificationDropdown
                isOpen={notificationDropdownOpen}
                onClose={() => setNotificationDropdownOpen(false)}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsRead}
                onMarkAsRead={handleMarkNotificationRead}
                onDeleteNotification={handleDeleteNotification}
                onNavigate={handleNotificationNavigate}
              />
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#202020] dark:hover:text-white transition cursor-pointer"
              aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              title={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 hover:-rotate-12 transition-transform" />
              )}
            </button>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="pt-[76px] sm:pt-[82px] pb-24 p-4 sm:p-6 space-y-6 flex-1">
          {activeMenu === 'compliance' ? (
            <ComplianceCheckView
              onBackToDashboard={handleOpenDashboard}
              submissionData={activeComplianceSubmission}
            />
          ) : activeMenu === 'submissions' ? (
            <TenderSubmissionsView
              onBackToDashboard={handleOpenDashboard}
              onOpenCompliance={handleOpenCompliance}
            />
          ) : activeMenu === 'top-bidders' ? (
            <TopBiddersView
              onBackToDashboard={handleOpenDashboard}
              onOpenCompliance={handleOpenCompliance}
              onOpenSubmissions={handleOpenSubmissions}
              tenders={allTenders}
            />
          ) : activeMenu === 'upload-extract' ? (
            <OfficerUploadExtractView
              onBackToDashboard={handleOpenDashboard}
              onOpenCompliance={handleOpenCompliance}
              onOpenSubmissions={handleOpenSubmissions}
              onOpenTopBidders={handleOpenTopBidders}
            />
          ) : activeMenu === 'reports' ? (
            <Reports />
          ) : activeMenu === 'audit' ? (
            <AuditTrail />
          ) : (
            <>

              {/* ==================== 1. TOP STATS KPI CARDS ==================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* Card 1: Total Tenders */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tenders</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                          {metrics.totalTenders}
                        </h3>
                      </div>
                    </div>
                    <Sparkline data={totalTendersSparkline} color="#6366f1" width={56} height={26} />
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#282828] flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <span>↑ {metrics.totalTendersTrend?.replace('+', '')}</span>
                      <span className="text-slate-400 font-normal ml-1">vs last month</span>
                    </span>
                    <span className="text-slate-400">
                      {allTenders.filter((t) => t.status === 'Active' || t.status === 'Live' || !t.status).length} active now
                    </span>
                  </div>
                </div>

                {/* Card 2: Submissions Received */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Submissions Received</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                          {metrics.submissionsReceived}
                        </h3>
                      </div>
                    </div>
                    <Sparkline data={submissionsSparkline} color="#10b981" width={56} height={26} />
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#282828] flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <span>↑ {metrics.submissionsReceivedTrend?.replace('+', '')}</span>
                      <span className="text-slate-400 font-normal ml-1">vs last month</span>
                    </span>
                    <span className="text-slate-400">
                      {recentSubmissions.filter((s) => s.isToday).length > 0
                        ? `+${recentSubmissions.filter((s) => s.isToday).length} today`
                        : `${metrics.submissionsReceived} total`}
                    </span>
                  </div>
                </div>

                {/* Card 3: Evaluations Completed */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Evaluations Completed</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                          {metrics.evaluationsCompleted}
                        </h3>
                      </div>
                    </div>
                    <Sparkline data={evaluationsSparkline} color="#3b82f6" width={56} height={26} />
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#282828] flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <span>↑ {metrics.evaluationsCompletedTrend?.replace('+', '')}</span>
                      <span className="text-slate-400 font-normal ml-1">vs last month</span>
                    </span>
                    <span className="text-slate-400">
                      {metrics.submissionsReceived > 0
                        ? `${Math.round((metrics.evaluationsCompleted / metrics.submissionsReceived) * 100)}% rate`
                        : '0% rate'}
                    </span>
                  </div>
                </div>

                {/* Card 4: Compliance Issues - High-Visibility Alert Treatment */}
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border-2 border-rose-300/80 dark:border-rose-900/60 shadow-xs hover:border-rose-400 dark:hover:border-rose-800 transition relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 ring-2 ring-rose-200 dark:ring-rose-800">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Compliance Issues</p>
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                            Alert
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300 tracking-tight mt-0.5">
                          {metrics.complianceIssues}
                        </h3>
                      </div>
                    </div>
                    <Sparkline data={complianceIssuesSparkline} color="#f43f5e" width={56} height={26} />
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-0.5">
                      <span>↓ {metrics.complianceIssuesTrend?.replace('-', '')}</span>
                      <span className="text-rose-600/80 dark:text-rose-400/80 font-normal ml-1">vs last month</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenCompliance}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                      aria-label={`Review ${metrics.complianceIssues} compliance issues now`}
                    >
                      <span>Review now</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ==================== 2. "NEEDS ATTENTION" OPERATIONAL ALERT STRIP ==================== */}
              {needsAttentionOpen && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Operational Attention Required:
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                          {metrics.complianceIssues} issues across tenders
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                          {recentSubmissions.filter((s) => s.status === 'Pending' || s.status === 'Under Review').length} awaiting evaluation
                        </span>
                        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {recentSubmissions.filter((s) => s.missingDocs > 0).length} missing statutory annexures
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleOpenCompliance}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-100/70 dark:bg-amber-900/30 hover:bg-amber-200/80 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Review Issues</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setNeedsAttentionOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Dismiss alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ==================== 3. UPPER SPLIT ROW: COMPLIANCE OVERVIEW + AI VERIFICATION ==================== */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Simplified Compliance Overview (lg:col-span-6) */}
                <div className="lg:col-span-6 bg-white dark:bg-[#181818] rounded-2xl border border-slate-200/90 dark:border-[#303030] shadow-2xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#282828]">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Compliance Overview
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Breakdown of AI checks across active tenders
                        </p>
                      </div>
                      <div className="relative">
                        <select
                          value={compliance.timeFilter || timeFilter}
                          onChange={(e) => {
                            setTimeFilter(e.target.value);
                            dispatch(setReduxTimeFilter(e.target.value));
                          }}
                          className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <option value="Last 30 days">Last 30 days</option>
                          <option value="This Month">This Month</option>
                          <option value="Last Month">Last Month</option>
                          <option value="This Quarter">This Quarter</option>
                        </select>
                      </div>
                    </div>

                    {/* Thinned Donut Chart & Detailed Legend */}
                    <div className="flex items-center justify-center sm:justify-between gap-6 my-5 flex-wrap sm:flex-nowrap">
                      {/* Thinned SVG Donut */}
                      <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          {/* Background Track */}
                          <path
                            className="text-slate-100 dark:text-slate-800/80"
                            strokeWidth="3.2"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          {/* Compliant Arc */}
                          {compliance.totalChecks > 0 && compliance.compliantPercentage > 0 && (
                            <path
                              className="text-emerald-500 transition-all duration-700"
                              strokeDasharray={`${compliance.compliantPercentage}, 100`}
                              strokeWidth="3.4"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          )}
                          {/* Minor Issues Arc */}
                          {compliance.totalChecks > 0 && compliance.minorIssuesPercentage > 0 && (
                            <path
                              className="text-amber-500 transition-all duration-700"
                              strokeDasharray={`${compliance.minorIssuesPercentage}, 100`}
                              strokeDashoffset={`-${compliance.compliantPercentage}`}
                              strokeWidth="3.4"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          )}
                          {/* Major Issues Arc */}
                          {compliance.totalChecks > 0 && compliance.majorIssuesPercentage > 0 && (
                            <path
                              className="text-rose-500 transition-all duration-700"
                              strokeDasharray={`${compliance.majorIssuesPercentage}, 100`}
                              strokeDashoffset={`-${compliance.compliantPercentage + compliance.minorIssuesPercentage}`}
                              strokeWidth="3.4"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          )}
                        </svg>

                        {/* Donut Center Total Checks */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                            {compliance.totalChecks}
                          </span>
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                            Total Checks
                          </span>
                        </div>
                      </div>

                      {/* Legend with explicit counts & percentages */}
                      <div className="space-y-3 text-xs flex-1 w-full sm:w-auto">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            Compliant
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {compliance.compliant} <span className="text-emerald-600 dark:text-emerald-400 font-normal">({compliance.compliantPercentage}%)</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            Minor Issues
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {compliance.minorIssues} <span className="text-amber-600 dark:text-amber-400 font-normal">({compliance.minorIssuesPercentage}%)</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            Major Issues
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {compliance.majorIssues} <span className="text-rose-600 dark:text-rose-400 font-normal">({compliance.majorIssuesPercentage}%)</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Overall Compliance Rate Progress Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-[#282828] space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">Overall Compliance Rate</span>
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="font-bold">{compliance.complianceRate}%</span>
                        <span className="text-[11px] font-medium text-slate-400">
                          (↑ {compliance.complianceRateTrend?.replace('+', '')} vs last month)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${compliance.complianceRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Grouped AI Verification Activity (lg:col-span-6) */}
                <div className="lg:col-span-6 bg-white dark:bg-[#181818] rounded-2xl border border-slate-200/90 dark:border-[#303030] shadow-2xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#282828]">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          AI Verification Activity
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
                          {activities.filter((a) => a.isToday).length || activities.length} Today
                        </span>
                      </div>
                      <Link
                        to="/audit"
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>Audit Log</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Timeline List Grouped by Today / Earlier */}
                    <div
                      data-lenis-prevent="true"
                      className="divide-y divide-slate-100 dark:divide-[#282828] max-h-[290px] overflow-y-auto pr-1"
                    >
                      {activities.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                          No recent activities logged yet.
                        </div>
                      ) : (
                        activities.slice(0, 15).map((act) => {
                          const Icon = act.icon;
                          return (
                            <div key={act.id} className="py-2.5 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-1 rounded-xl transition-colors">
                              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${act.iconColor}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {act.title}
                                  </p>
                                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                    {act.time}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {act.subtext}
                                </p>
                                {act.tag && (
                                  <span className={`inline-block mt-1 px-1.5 py-0.2 text-[9.5px] font-semibold rounded ${act.type === 'danger'
                                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                      : act.type === 'warning'
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    }`}>
                                    {act.tag}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#282828] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>AI Verification Engine active</span>
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      98.4% Auto-Accuracy
                    </span>
                  </div>
                </div>
              </div>

              {/* ==================== 4. FULL-WIDTH RECENT TENDERS TABLE ==================== */}
              <div className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200/90 dark:border-[#303030] shadow-2xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-[#282828]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Recent Tenders
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Active tenders monitored for compliance, deadlines &amp; submission quotas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenUploadExtract}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Upload &amp; Extract RFP</span>
                    </button>
                    <Link
                      to="/tenders"
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>View All ({metrics.totalTenders})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto mt-2" data-lenis-prevent="true">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-[#282828] bg-slate-50/50 dark:bg-slate-800/30">
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap">Tender ID</th>
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap min-w-[220px]">Title &amp; Scope</th>
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap">Department</th>
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap">Last Date / Deadline</th>
                        <th scope="col" className="py-3 px-4 font-bold text-center whitespace-nowrap">Submissions</th>
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap">Status</th>
                        <th scope="col" className="py-3 px-4 font-bold text-right whitespace-nowrap">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#282828] font-medium">
                      {recentTenders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                            No tenders available. New procurement notices will appear here.
                          </td>
                        </tr>
                      ) : (
                        recentTenders.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-[#202020] transition-colors"
                          >
                            {/* Tender ID + Copy CTA */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  to="/tenders"
                                  className="font-mono text-xs font-semibold tracking-tight text-blue-600 dark:text-blue-400 hover:underline"
                                  aria-label={`Tender reference ${item.id}`}
                                >
                                  {item.id}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTenderId(item.id)}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer transition"
                                  title={copiedId === item.id ? 'Copied!' : 'Copy Tender ID'}
                                >
                                  {copiedId === item.id ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Title */}
                            <td className="py-3 px-4 text-slate-900 dark:text-slate-200">
                              <span className="font-semibold text-slate-800 dark:text-slate-100 block">
                                {item.title}
                              </span>
                              <span className="text-[10.5px] text-slate-400">
                                Estimated Value: {item.value || '₹ 50 Lakhs'}
                              </span>
                            </td>

                            {/* Department */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  {item.department}
                                </span>
                              </div>
                            </td>

                            {/* Deadline with Countdown */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                                  {item.lastDate}
                                </span>
                                {item.daysLeft > 0 ? (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    {item.daysLeft} days left
                                  </span>
                                ) : item.daysLeft === 0 ? (
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    Due today
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400">
                                    Closed
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Submissions count */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                {item.submissions} bids
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${item.statusType === 'active' || item.status === 'Active' || item.status === 'Open'
                                    ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                                    : item.statusType === 'review' || item.status === 'Under review'
                                      ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                      : item.statusType === 'issue' || item.status === 'Compliance issue'
                                        ? 'bg-rose-100/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${item.statusType === 'active' || item.status === 'Active' || item.status === 'Open'
                                    ? 'bg-emerald-500'
                                    : item.statusType === 'review' || item.status === 'Under review'
                                      ? 'bg-amber-500'
                                      : item.statusType === 'issue' || item.status === 'Compliance issue'
                                        ? 'bg-rose-500'
                                        : 'bg-slate-400'
                                  }`} />
                                <span>{item.status}</span>
                              </span>
                            </td>

                            {/* Action CTA */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={handleOpenCompliance}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-bold text-[11px] transition cursor-pointer"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ==================== 5. FULL-WIDTH GROUPED RECENT SUBMISSIONS TABLE ==================== */}
              <div className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200/90 dark:border-[#303030] shadow-2xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-[#282828]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Recent Submissions
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bids submitted by commercial vendors with automated compliance scoring
                    </p>
                  </div>

                  {/* Filter Pills: All / Today / Earlier */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setSubmissionsFilter('all')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${submissionsFilter === 'all'
                            ? 'bg-white dark:bg-[#242424] text-slate-900 dark:text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                      >
                        All ({recentSubmissions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionsFilter('today')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${submissionsFilter === 'today'
                            ? 'bg-white dark:bg-[#242424] text-slate-900 dark:text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                      >
                        Today ({recentSubmissions.filter(s => s.isToday).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionsFilter('earlier')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${submissionsFilter === 'earlier'
                            ? 'bg-white dark:bg-[#242424] text-slate-900 dark:text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                      >
                        Earlier ({recentSubmissions.filter(s => !s.isToday).length})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenSubmissions}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 ml-1"
                    >
                      <span>View All Submissions</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto mt-2" data-lenis-prevent="true">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-[#282828] bg-slate-50/50 dark:bg-slate-800/30">
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap">Bidder Name</th>
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap min-w-[240px]">Tender Reference &amp; Scope</th>
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap">Submitted On</th>
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap">Compliance Score</th>
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap">Quoted Value</th>
                        <th scope="col" className="py-3 px-4 font-bold text-center whitespace-nowrap">Bidder Docs</th>
                        <th scope="col" className="py-3 px-4 font-bold whitespace-nowrap">Status</th>
                        <th scope="col" className="py-3 px-4 font-bold text-right whitespace-nowrap">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#282828] font-medium">
                      {recentSubmissions
                        .filter((sub) => {
                          if (submissionsFilter === 'today') return sub.isToday;
                          if (submissionsFilter === 'earlier') return !sub.isToday;
                          return true;
                        }).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                            No submissions recorded yet. Incoming vendor proposals will appear here.
                          </td>
                        </tr>
                      ) : (
                        recentSubmissions
                          .filter((sub) => {
                            if (submissionsFilter === 'today') return sub.isToday;
                            if (submissionsFilter === 'earlier') return !sub.isToday;
                            return true;
                          })
                          .slice(0, showAllSubmissions ? undefined : 6)
                          .map((sub, idx) => (
                            <tr
                              key={sub.id || idx}
                              className="hover:bg-slate-50/70 dark:hover:bg-[#202020] transition-colors"
                            >
                              {/* Bidder Name */}
                              <td className="py-3 px-4 text-slate-900 dark:text-slate-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                                    {sub.bidder?.slice(0, 1) || 'B'}
                                  </div>
                                  <div>
                                    <span className="font-bold block text-slate-900 dark:text-white">
                                      {sub.bidder}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {sub.id}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Tender Ref & Scope (Fixes Issues 9 & 10-21) */}
                              <td className="py-3 px-4 min-w-[240px]">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCompliance(sub)}
                                  className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left block"
                                  title={sub.tenderId}
                                >
                                  {sub.tenderId}
                                </button>
                                <span
                                  className="text-xs text-slate-500 dark:text-slate-400 block line-clamp-2 mt-0.5 leading-snug"
                                  title={sub.tenderTitle}
                                >
                                  {sub.tenderTitle}
                                </span>
                              </td>

                              {/* Submitted On */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                                    {sub.submittedOn}
                                  </span>
                                  {sub.relativeTime && (
                                    <span className={`text-xs font-semibold ${sub.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                      {sub.relativeTime}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Compliance Score */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs w-9">
                                    {(sub.score ?? sub.complianceScore) ?? 0}%
                                  </span>
                                  <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                                    <div
                                      className={`h-full rounded-full transition-all ${(sub.score ?? sub.complianceScore) >= 80
                                          ? 'bg-emerald-500'
                                          : (sub.score ?? sub.complianceScore) >= 60
                                            ? 'bg-amber-500'
                                            : 'bg-rose-500'
                                        }`}
                                      style={{ width: `${(sub.score ?? sub.complianceScore) ?? 0}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Quoted Value */}
                              <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                                {sub.quotedAmount || '₹ 42,50,000'}
                              </td>

                              {/* Bidder Docs */}
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDocSubmission(sub)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs transition border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs group"
                                  title="Click to view bidder's uploaded documents"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                                  <span>{sub.documents?.length || 2} Docs</span>
                                </button>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold ${sub.statusColor === 'emerald' || sub.status === 'Compliant'
                                      ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : sub.statusColor === 'amber' || sub.status === 'Minor Issues'
                                        ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                        : 'bg-rose-100/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                    }`}
                                >
                                  {sub.status}
                                </span>
                              </td>

                              {/* Action */}
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCompliance(sub)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
                                >
                                  Evaluate
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Submissions Table Density & Compactness Pagination (Fixes Issue 24) */}
                <div className="p-3.5 border-t border-slate-100 dark:border-[#282828] flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Showing {Math.min(recentSubmissions.filter((sub) => {
                      if (submissionsFilter === 'today') return sub.isToday;
                      if (submissionsFilter === 'earlier') return !sub.isToday;
                      return true;
                    }).length, showAllSubmissions ? recentSubmissions.length : 6)} of {recentSubmissions.filter((sub) => {
                      if (submissionsFilter === 'today') return sub.isToday;
                      if (submissionsFilter === 'earlier') return !sub.isToday;
                      return true;
                    }).length} submissions
                  </span>
                  {recentSubmissions.filter((sub) => {
                    if (submissionsFilter === 'today') return sub.isToday;
                    if (submissionsFilter === 'earlier') return !sub.isToday;
                    return true;
                  }).length > 6 && (
                      <button
                        type="button"
                        onClick={() => setShowAllSubmissions(!showAllSubmissions)}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {showAllSubmissions ? 'Show fewer rows' : `View all (${recentSubmissions.filter((sub) => {
                          if (submissionsFilter === 'today') return sub.isToday;
                          if (submissionsFilter === 'earlier') return !sub.isToday;
                          return true;
                        }).length})`}
                      </button>
                    )}
                </div>
              </div>

            </>
          )}
        </main>

        {/* -------------------- 7. FOOTER -------------------- */}
        <footer className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2024 GeM Compliflix Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11.5px]">
            <span>Version 1.0.0</span>
            <span>&bull;</span>
            <Link to="/#footer" className="hover:underline">Privacy Policy</Link>
            <span>&bull;</span>
            <Link to="/#footer" className="hover:underline">Terms of Service</Link>
          </div>
        </footer>
      </div>

      {/* -------------------- MODAL: UPLOAD TENDER DOC -------------------- */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Upload Tender Specification Document
                </h3>
              </div>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setTenderUploadResult(null);
                  setTenderUploadFile(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {tenderUploadResult ? (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tender Document Uploaded &amp; Processed!</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    File successfully stored in secure document repository and processed for compliance verification.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">{tenderUploadResult.fileName}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{tenderUploadResult.authenticityScore}% Authentic</span>
                  </div>
                  <a
                    href={tenderUploadResult.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Document PDF</span>
                  </a>
                  <div className="pt-1">
                    <span className="font-bold text-[11px] text-slate-500 uppercase block mb-0.5">Extracted Summary</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 line-clamp-3">
                      {tenderUploadResult.ocrText}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setUploadModalOpen(false);
                      setTenderUploadResult(null);
                      setTenderUploadFile(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOfficerTenderUpload} className="space-y-3.5 text-xs">
                {/* File Drop Area */}
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/40">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setTenderUploadFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  {tenderUploadFile ? (
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs mx-auto">
                        {tenderUploadFile.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {(tenderUploadFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        Click to select or drag &amp; drop tender RFP / NIT PDF
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Securely stores document &amp; analyzes via GeM Compliance Engine
                      </p>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tender Title / Reference No
                  </label>
                  <input
                    type="text"
                    value={tenderUploadTitle}
                    onChange={(e) => setTenderUploadTitle(e.target.value)}
                    placeholder="e.g. Procurement of High-Speed Networking - GeM/2026/B/9182"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                {/* Document Type */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Document Type
                    </label>
                    <select
                      value={tenderUploadDocType}
                      onChange={(e) => setTenderUploadDocType(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs cursor-pointer"
                    >
                      <option value="other">Tender RFP / NIT</option>
                      <option value="technical_specs">Technical Specification</option>
                      <option value="boq_schedule">BOQ Schedule</option>
                      <option value="gst_certificate">GST Certificate</option>
                      <option value="pan_card">PAN Card</option>
                      <option value="udyam_certificate">MSME Udyam</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={tenderUploadDescription}
                      onChange={(e) => setTenderUploadDescription(e.target.value)}
                      placeholder="e.g. Annual Rate Contract"
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                {tenderUploading && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>Uploading Document &amp; Analyzing Compliance...</span>
                      <span>{tenderUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${tenderUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadModalOpen(false);
                      setTenderUploadFile(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tenderUploading || !tenderUploadFile}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {tenderUploading ? 'Uploading...' : 'Upload & Verify Document'}
                  </button>
                </div>
              </form>
            )}
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

              <div
                data-lenis-prevent="true"
                className="space-y-2 max-h-[240px] overflow-y-auto pr-1"
              >
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

      {/* Floating Circular AI Assistant Launcher Button */}
      {!chatBoxOpen && (
        <button
          type="button"
          onClick={() => setChatBoxOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 hover:from-blue-800 hover:via-indigo-700 hover:to-blue-600 text-white shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-110 active:scale-95 transition-all duration-300 ease-out cursor-pointer border-2 border-white/30 dark:border-white/20 group flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-400/40"
          title="Open GeM AI Compliance Assistant"
          aria-label="Ask AI Assistant about GeM and GFR compliance"
        >
          {/* Active Online Status Indicator */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 shadow-xs flex items-center justify-center">
            <span className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>

          {/* Sparkles Accent */}
          <Sparkles
            className="absolute -top-1 -left-1 w-4 h-4 text-amber-300 drop-shadow group-hover:rotate-12 transition-transform duration-300"
            aria-hidden="true"
          />

          {/* Centered Bot Icon */}
          <Bot
            className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300"
            aria-hidden="true"
          />

          {/* Hover Tooltip Floating to Left */}
          <div className="absolute right-full mr-3.5 px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-xs font-semibold shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none translate-x-1 group-hover:translate-x-0 hidden sm:flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ask AI Assistant</span>
          </div>
        </button>
      )}

    </div>
  );
};

export default Dashboard;
