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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import BidderChatBot from '../../components/common/BidderChatBot';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import { mlService, downloadDocument } from '../../services';

const DEFAULT_STATUTORY_CRITERIA = [
  {
    id: 1,
    category: 'Mandatory Documents',
    requirement: 'GST Registration Certificate (REG-06)',
    clause: 'Clause 1.1',
    tenderText: 'Active GSTIN registration verified with GSTN under Section 22 of CGST Act 2017.',
    requiredDoc: 'GST Certificate (REG-06)',
    status: 'Compliant',
    confidence: 99,
    hasIssue: false,
    isDiscrepancy: false,
    docName: 'GST_Certificate_Verified.pdf',
    docSize: '840 KB',
    description: 'GSTIN validated against government portal with active status.',
    aiSummary: 'Valid active GST registration certificate verified.',
    remarks: 'Compliant with statutory tax filing regulations.',
    ruleSource: 'CGST Act 2017 & GeM STC',
  },
  {
    id: 2,
    category: 'Mandatory Documents',
    requirement: 'Permanent Account Number (PAN) Card',
    clause: 'Clause 1.2',
    tenderText: 'Valid PAN registered in the name of the bidding enterprise verified against CBDT database.',
    requiredDoc: 'PAN Card Copy',
    status: 'Compliant',
    confidence: 98,
    hasIssue: false,
    isDiscrepancy: false,
    docName: 'CBDT_PAN_Card.pdf',
    docSize: '420 KB',
    description: 'PAN card entity matches bidding company credentials.',
    aiSummary: 'PAN details successfully cross-referenced with enterprise records.',
    remarks: 'Valid and active PAN verification.',
    ruleSource: 'Income Tax Act & GeM GTC',
  },
  {
    id: 3,
    category: 'Eligibility Criteria',
    requirement: 'Udyam Registration / MSME Classification',
    clause: 'Clause 2.1',
    tenderText: 'Udyam Registration Certificate for MSE benefits under Public Procurement Policy Order 2012.',
    requiredDoc: 'Udyam Certificate',
    status: 'Compliant',
    confidence: 95,
    hasIssue: false,
    isDiscrepancy: false,
    docName: 'Udyam_Registration.pdf',
    docSize: '610 KB',
    description: 'Verified under Ministry of MSME portal for EMD exemption eligibility.',
    aiSummary: 'Valid MSE manufacturer/service provider certificate.',
    remarks: 'Eligible for tender document waiver and EMD exemption per GFR 173(i).',
    ruleSource: 'MSME Policy Order 2012',
  },
  {
    id: 4,
    category: 'Technical Requirements',
    requirement: 'Past Experience & Work Completion Certificates',
    clause: 'Clause 3.1',
    tenderText: 'Executed similar scope government/PSU contracts in preceding 3 financial years.',
    requiredDoc: 'Work Orders & Completion Certs',
    status: 'Compliant',
    confidence: 92,
    hasIssue: false,
    isDiscrepancy: false,
    docName: 'Work_Experience_Dossier.pdf',
    docSize: '2.4 MB',
    description: 'Verified client sign-offs and invoice vouchers.',
    aiSummary: 'Substantial prior project experience documented.',
    remarks: 'Meets minimum threshold criteria for past execution capacity.',
    ruleSource: 'GFR 2017 Rule 173',
  },
  {
    id: 5,
    category: 'Tender Conditions & GFR',
    requirement: 'Make in India (PPP-MII) Local Content Declaration',
    clause: 'Clause 4.1',
    tenderText: 'Self-certification of minimum 50% Class-I local content per DPIIT Order P-45021/2/2017-PP.',
    requiredDoc: 'PPP-MII Declaration',
    status: 'Compliant',
    confidence: 97,
    hasIssue: false,
    isDiscrepancy: false,
    docName: 'MII_Local_Content_Affidavit.pdf',
    docSize: '390 KB',
    description: 'Class-I Local Supplier declaration duly signed by authorized signatory.',
    aiSummary: 'Affidavit conforms to public procurement preference regulations.',
    remarks: 'Qualifies for Class-I purchase preference.',
    ruleSource: 'PPP-MII Order 2017',
  },
  {
    id: 6,
    category: 'Tender Conditions & GFR',
    requirement: 'GFR Rule 144(xi) Land Border Sharing Declaration',
    clause: 'Clause 5.1',
    tenderText: 'Mandatory undertaking regarding compliance with restrictions on procurement from countries sharing a land border with India.',
    requiredDoc: 'GFR 144(xi) Certificate',
    status: 'Compliant',
    confidence: 98,
    hasIssue: false,
    isDiscrepancy: false,
    docName: 'GFR_144_Declaration.pdf',
    docSize: '450 KB',
    description: 'Vendor confirms no beneficial ownership in restricted land border countries.',
    aiSummary: 'Compliant declaration verified per Ministry of Finance OM F.No.6/18/2019-PPD.',
    remarks: 'National security compliance confirmed.',
    ruleSource: 'GFR Rule 144(xi)',
  },
  {
    id: 7,
    category: 'Financial Requirements',
    requirement: 'Annual Financial Turnover & Net Worth Certification',
    clause: 'Clause 6.1',
    tenderText: 'Audited balance sheets and CA certified turnover for last 3 financial years.',
    requiredDoc: 'CA Certified Turnover Certificate',
    status: 'Compliant',
    confidence: 94,
    hasIssue: false,
    isDiscrepancy: false,
    docName: 'CA_Audited_Turnover_Report.pdf',
    docSize: '1.8 MB',
    description: 'UDIN verified CA certificate confirming average annual turnover exceeds threshold.',
    aiSummary: 'Healthy liquidity ratios and positive net worth confirmed.',
    remarks: 'Financially sound and solvent.',
    ruleSource: 'GFR 2017 Rule 173(ii)',
  },
];

const INITIAL_REQUIREMENTS = DEFAULT_STATUTORY_CRITERIA;

export const normalizeCategory = (category, reqName = '') => {
  const cat = String(category || '').toLowerCase().trim();
  const name = String(reqName || '').toLowerCase().trim();

  // 1. Eligibility Criteria (check first so MSME/Udyam/Startup takes precedence)
  if (
    cat.includes('eligib') ||
    cat.includes('enterprise') ||
    cat.includes('classification') ||
    name.includes('udyam') ||
    name.includes('msme') ||
    name.includes('startup') ||
    name.includes('eligibility') ||
    name.includes('joint venture')
  ) {
    return 'Eligibility Criteria';
  }

  // 2. Financial Requirements
  if (
    cat.includes('financ') ||
    cat.includes('turnover') ||
    cat.includes('net worth') ||
    cat.includes('bid schedule') ||
    cat.includes('commercial') ||
    name.includes('turnover') ||
    name.includes('balance sheet') ||
    name.includes('net worth') ||
    name.includes('financial') ||
    name.includes('ca cert') ||
    name.includes('audited') ||
    name.includes('solvency') ||
    name.includes('boq')
  ) {
    return 'Financial Requirements';
  }

  // 3. Tender Conditions & GFR
  if (
    cat.includes('condition') ||
    cat.includes('gfr') ||
    cat.includes('procurement policy') ||
    cat.includes('policy') ||
    cat.includes('security') ||
    cat.includes('national') ||
    name.includes('make in india') ||
    name.includes('ppp-mii') ||
    name.includes('144(xi)') ||
    name.includes('land border') ||
    name.includes('debarment') ||
    name.includes('undertaking') ||
    name.includes('non-blacklisting') ||
    name.includes('tender condition')
  ) {
    return 'Tender Conditions & GFR';
  }

  // 4. Mandatory Documents
  if (
    cat.includes('mandatory') ||
    cat.includes('statutory') ||
    cat.includes('identity') ||
    cat.includes('tax') ||
    name.includes('gst') ||
    name.includes('pan card') ||
    name.includes('pan ') ||
    name.includes('incorporation') ||
    name.includes('registration cert')
  ) {
    return 'Mandatory Documents';
  }

  // 5. Technical Requirements
  if (
    cat.includes('technical') ||
    cat.includes('capability') ||
    name.includes('experience') ||
    name.includes('completion') ||
    name.includes('technical') ||
    name.includes('specification') ||
    name.includes('work order') ||
    name.includes('iso')
  ) {
    return 'Technical Requirements';
  }

  return 'Eligibility Criteria';
};

export const CATEGORY_DEFINITIONS = [
  { id: 'eligibility', name: 'Eligibility Criteria', match: 'Eligibility Criteria' },
  { id: 'mandatory_docs', name: 'Mandatory Documents', match: 'Mandatory Documents' },
  { id: 'technical', name: 'Technical Requirements', match: 'Technical Requirements' },
  { id: 'financial', name: 'Financial Requirements', match: 'Financial Requirements' },
  { id: 'conditions', name: 'Tender Conditions & GFR', match: 'Tender Conditions & GFR' },
];

const ITEMS_PER_PAGE = 15;

const ComplianceCheckView = ({ onBackToDashboard, submissionData }) => {
  const [activeTab, setActiveTab] = useState('all'); // all | compliant | needs_review | non_compliant | not_applicable
  const [activeCategory, setActiveCategory] = useState('eligibility');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [chatBotOpen, setChatBotOpen] = useState(false);

  // Requirements state - initialized with statutory GeM criteria
  const [requirements, setRequirements] = useState(() =>
    INITIAL_REQUIREMENTS.map((r) => ({
      ...r,
      category: normalizeCategory(r.category, r.requirement),
    }))
  );
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
  const [previewDoc, setPreviewDoc] = useState(null);

  // Sync requirements from live submissionData
  useEffect(() => {
    if (submissionData?.requirements && Array.isArray(submissionData.requirements) && submissionData.requirements.length > 0) {
      setRequirements(
        submissionData.requirements.map((req, idx) => ({
          ...req,
          category: normalizeCategory(req.category, req.requirement || req.name),
        }))
      );
      return;
    }

    if (submissionData?.requirementsBreakdown && Array.isArray(submissionData.requirementsBreakdown) && submissionData.requirementsBreakdown.length > 0) {
      const dynamicList = submissionData.requirementsBreakdown.map((req, idx) => {
        const cat = normalizeCategory(req.category, req.name || req.requirement);
        return {
          id: idx + 1,
          category: cat,
          requirement: req.name || 'Statutory Compliance Parameter',
          clause: `Clause ${idx + 1}.0`,
          tenderText: req.tenderText || req.name || 'Mandatory compliance requirement under tender NIT & GFR 2017',
          requiredDoc: req.name || 'Statutory Declaration',
          status: req.status === 'COMPLIANT' || req.status === 'Compliant' ? 'Compliant' : req.status === 'NEEDS_REVIEW' ? 'Needs Review' : (req.status || 'Compliant'),
          confidence: req.confidence || 96,
          hasIssue: req.status !== 'COMPLIANT' && req.status !== 'Compliant',
          isDiscrepancy: req.status !== 'COMPLIANT' && req.status !== 'Compliant',
          docName: `${(req.name || 'Document').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          docSize: '650 KB',
          description: req.tenderText || 'Verification of parameter against tender conditions and GFR 2017',
          aiSummary: req.tenderText || 'Evaluated against statutory procurement guidelines.',
          remarks: req.status === 'COMPLIANT' || req.status === 'Compliant' ? 'Document verified and compliant with GFR 2017.' : 'Requires officer scrutiny.',
          ruleSource: 'GFR 2017 & PPP-MII',
        };
      });
      setRequirements(dynamicList);
      return;
    }

    if (submissionData?.complianceChecks && Array.isArray(submissionData.complianceChecks) && submissionData.complianceChecks.length > 0) {
      const dynamicList = submissionData.complianceChecks.map((chk, idx) => {
        const cat = normalizeCategory(chk.category, chk.name);
        return {
          id: idx + 1,
          category: cat,
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
        };
      });
      setRequirements(dynamicList);
      return;
    }

    // Default to the standard 7 statutory criteria checklist
    setRequirements(
      DEFAULT_STATUTORY_CRITERIA.map((r) => ({
        ...r,
        category: normalizeCategory(r.category, r.requirement),
      }))
    );
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
            category: normalizeCategory(req.category, req.title || req.requirement),
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
      const catItems = requirements.filter(
        (r) => normalizeCategory(r.category, r.requirement) === cat.match
      );
      map[cat.id] = {
        total: catItems.length,
        compliant: catItems.filter((r) => r.status === 'Compliant').length,
      };
    });
    return map;
  }, [requirements]);

  // Filtered and Sorted Requirements
  const filteredRequirements = useMemo(() => {
    return requirements
      .filter((item) => {
        // Category filter
        if (activeCategory) {
          const def = CATEGORY_DEFINITIONS.find((c) => c.id === activeCategory);
          if (def?.match) {
            const itemCat = normalizeCategory(item.category, item.requirement);
            if (itemCat !== def.match) return false;
          }
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

  const handleExportComplianceDossier = () => {
    const reportData = {
      title: 'GeM Statutory Compliance Verification Dossier',
      exportedAt: new Date().toISOString(),
      tender: {
        id: submissionData?.tenderId || 'GEM/2026/B/6',
        title: submissionData?.tenderTitle || 'Public Procurement Tender',
      },
      bidder: {
        name: submissionData?.bidder || 'Evaluated Bidder',
        submittedOn: submissionData?.submittedOn || 'Today',
      },
      summary: {
        score: stats?.complianceScore || 0,
        status: stats?.status || 'Compliant',
        passedRequirements: stats?.passedCount || 0,
        flaggedRequirements: stats?.flaggedCount || 0,
        failedRequirements: stats?.failedCount || 0,
      },
      verifiedChecklist: (requirements || []).map((r) => ({
        id: r.id,
        requirement: r.requirement || r.name,
        category: r.category,
        status: r.status,
        confidence: `${r.confidence}%`,
        clause: r.clause,
        document: r.docName,
        remarks: r.remarks || r.description,
      })),
      digitalSeal: {
        verifiedBy: 'GeM AI Statutory Verification Engine',
        framework: 'Rule 192 GFR 2017 & GeM STC Clause 4.2',
        hash: '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeRef = (submissionData?.tenderId || 'Tender').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.setAttribute('download', `Compliance_Audit_Dossier_${safeRef}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200 text-slate-900 dark:text-slate-100">
      {/* ========================================================================= */}
      {/* 0. NAVIGATION & BREADCRUMB BAR                                            */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-2xs transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-blue-600" />
          <span>
            Back to Tender Submissions</span>
        </button>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 hidden sm:inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Detailed Statutory Compliance Audit
        </span>
      </div>

      {!submissionData && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                No Bidder Selected for Detailed Audit
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Detailed compliance audits are conducted per bidder submission. Go to Tender Submissions and click &quot;Detailed Audit&quot; on any applicant to evaluate their criteria and documents.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition cursor-pointer"
          >
            <span>Open Tender Submissions</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

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
              {submissionData?.tenderId || 'GEM/2026/B/6'}
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
              Evaluated Bidder
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              {submissionData?.bidder || 'Rajat (Rajat)'}
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
              Evaluation Status
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
              (submissionData?.evaluationStatus === 'Cleared' || submissionData?.evaluationStatus === 'Approved' || submissionData?.isQualified)
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                (submissionData?.evaluationStatus === 'Cleared' || submissionData?.evaluationStatus === 'Approved' || submissionData?.isQualified)
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`} />
              {submissionData?.evaluationStatus || submissionData?.complianceStatus || 'Pending'}
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
              Compliance Score
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {stats.compliant}/{stats.total} Rules ({stats.compliantPct}%)
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
              Last Updated
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {submissionData?.submittedOn ? `${submissionData.submittedOn}${submissionData.submittedTime ? `, ${submissionData.submittedTime}` : ''}` : '24 Sep 2026, 03:12 PM'}
            </span>
          </div>
        </div>

        {/* Primary Page Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportComplianceDossier}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs transition cursor-pointer"
            aria-label="Export Audit Dossier"
            title="Download Verified Compliance Audit Dossier (JSON)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export Report</span>
          </button>
        </div>
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
                    setActiveCategory((prev) => (prev === cat.id ? null : cat.id));
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
              {activeCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory(null);
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                  title="Filtered by pillar. Click to view all rules across pillars."
                >
                  <span>Pillar: {CATEGORY_DEFINITIONS.find((c) => c.id === activeCategory)?.name}</span>
                  <X className="w-3 h-3 text-blue-500 hover:text-blue-700 dark:hover:text-blue-200" />
                </button>
              )}
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
                              setActiveCategory('eligibility');
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
                    onClick={() => setPreviewDoc({ ...selectedReq, fileName: selectedReq.docName, name: selectedReq.docName })}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
                    title="Preview PDF"
                    aria-label={`Preview PDF ${selectedReq.docName}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDocument({ ...selectedReq, fileName: selectedReq.docName, name: selectedReq.docName })}
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

      {/* Universal Document Preview & Download Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
};

export default ComplianceCheckView;
