import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  Search,
  ArrowRight,
  BarChart3,
  Layers,
  Sparkles,
  Award,
  Clock,
  Send,
  Building2,
  FileCheck,
  Scale,
  BadgeAlert,
  AlertCircle,
  FileSpreadsheet,
  MessageSquare,
} from 'lucide-react';
import BidderChatBot from '../../components/common/BidderChatBot';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';

const INITIAL_REQUIREMENTS = [
  {
    id: 1,
    category: 'Eligibility Criteria',
    requirement: 'Bidder Registration on GeM',
    clause: 'Section 2.1',
    tenderText: 'Bidder must possess a valid, active seller registration on Government e-Marketplace (GeM) with verified bank credentials.',
    requiredDoc: 'GeM Seller Registration Certificate',
    status: 'Compliant',
    confidence: 98,
    hasIssue: false,
    docName: 'GeM_Seller_Registration_Cert.pdf',
    docSize: '410 KB',
    description: 'Bidder must possess valid and active seller registration on Government e-Marketplace (GeM).',
    aiSummary: 'Active GeM seller ID verified against GeM SPV database. Valid till 31 Dec 2026. Primary bank account active.',
    remarks: 'Verified & active on GeM portal.',
    ruleSource: 'GeM GTC Clause 3.1 & Rule 149 GFR 2017',
  },
  {
    id: 2,
    category: 'Eligibility Criteria',
    requirement: 'Valid Business Registration',
    clause: 'Section 2.2',
    tenderText: 'Bidder must be incorporated under Companies Act 2013 or registered as MSME/Udyam enterprise with at least 3 years active vintage.',
    requiredDoc: 'Certificate of Incorporation / Udyam',
    status: 'Compliant',
    confidence: 95,
    hasIssue: false,
    docName: 'Certificate_of_Incorporation.pdf',
    docSize: '1.2 MB',
    description: 'Valid certificate of incorporation under Companies Act or registered partnership / MSME Udyam.',
    aiSummary: 'CIN: U72900DL2018PTC334512 verified via Ministry of Corporate Affairs (MCA21). Operating vintage: 6.2 years.',
    remarks: 'Entity active for 6+ years.',
    ruleSource: 'Companies Act 2013 / MSMED Act 2006',
  },
  {
    id: 3,
    category: 'Eligibility Criteria',
    requirement: 'GST Registration & Return Record',
    clause: 'Section 2.3',
    tenderText: 'Valid Goods and Services Tax (GST) registration certificate in the state of supply with active GSTR-3B filings for preceding 12 months.',
    requiredDoc: 'GST Registration Certificate & GSTR-3B',
    status: 'Compliant',
    confidence: 96,
    hasIssue: false,
    docName: 'GST_Registration_Certificate.pdf',
    docSize: '620 KB',
    description: 'Valid Goods and Services Tax (GST) registration certificate in the state of procurement.',
    aiSummary: 'GSTIN 07AAAAA0000A1Z5 validated. Regular taxpayer with continuous 12-month compliance on GSTN portal.',
    remarks: 'Active status confirmed via GSTN API.',
    ruleSource: 'CGST Act 2017 & GeM STC Clause 4.1',
  },
  {
    id: 4,
    category: 'Eligibility Criteria',
    requirement: 'Permanent Account Number (PAN)',
    clause: 'Section 2.4',
    tenderText: 'Permanent Account Number (PAN) allotted by Income Tax Department in name of bidder entity.',
    requiredDoc: 'Company PAN Card',
    status: 'Compliant',
    confidence: 99,
    hasIssue: false,
    docName: 'Company_PAN_Card.pdf',
    docSize: '310 KB',
    description: 'Permanent Account Number (PAN) allotted by Income Tax Department in name of bidder entity.',
    aiSummary: 'PAN matched with MCA corporate records and IT department database with verified tax return filings.',
    remarks: 'Allotted & verified.',
    ruleSource: 'Income Tax Act 1961 Section 139A',
  },
  {
    id: 5,
    category: 'Eligibility Criteria',
    requirement: 'Authorized Signatory KYC & DSC',
    clause: 'Section 2.5',
    tenderText: 'Identity and address proof of authorized signatory supported by Board Resolution and valid Class-3 Digital Signature Certificate.',
    requiredDoc: 'Board Resolution & Signatory KYC',
    status: 'Compliant',
    confidence: 94,
    hasIssue: false,
    docName: 'Authorized_Signatory_KYC.pdf',
    docSize: '540 KB',
    description: 'Identity and address proof of authorized signatory and primary directors.',
    aiSummary: 'Board resolution dated 12 Apr 2024 and authorized signatory DSC match registered MCA DIN records.',
    remarks: 'Signatory authority confirmed.',
    ruleSource: 'IT Act 2000 & GeM e-Sign Guidelines',
  },
  {
    id: 6,
    category: 'Eligibility Criteria',
    requirement: 'Non-Blacklisting / Debarment Affidavit',
    clause: 'Section 2.6',
    tenderText: 'Bidder must submit a notarized self-declaration on corporate letterhead stating the firm has never been blacklisted or debarred by any Central/State Ministry or PSU.',
    requiredDoc: 'Self Declaration on Non-Blacklisting',
    status: 'Needs Review',
    confidence: 70,
    hasIssue: true,
    isDiscrepancy: true,
    issue: "The certificate is not on the bidder's official corporate letterhead.",
    recommendation: "Issue Clarification Notice requesting a signed declaration on official letterhead within 48 hours as per GeM GTC Clause 4.2.",
    docName: 'Self_Declaration.pdf',
    docSize: '245 KB',
    description: 'Bidder must submit a self-declaration certificate stating that the firm is not blacklisted or debarred by any Govt. Department / PSU.',
    aiSummary: 'Document extracted. Declaration date: 20 May 2024. Valid non-debarment statement found, but missing standard corporate letterhead watermark.',
    remarks: "Certificate is not on official letterhead.",
    ruleSource: 'GFR 2017 Rule 151 (Debarment from Bidding)',
  },
  {
    id: 7,
    category: 'Eligibility Criteria',
    requirement: 'OEM Authorization (If applicable)',
    clause: 'Section 2.7',
    tenderText: 'Manufacturer Authorization Form (MAF) from original equipment manufacturer if the bidder is an authorized distributor or reseller.',
    requiredDoc: 'OEM Authorization Letter (MAF)',
    status: 'Not Applicable',
    confidence: null,
    hasIssue: false,
    docName: null,
    docSize: null,
    description: 'Manufacturer Authorization Form (MAF) from original equipment manufacturer if reseller.',
    aiSummary: 'Bidder is registered as primary manufacturer / direct supplier for stationery lot. OEM MAF waiver applies.',
    remarks: 'Exempted per Clause 2.7(b) for primary OEMs.',
    ruleSource: 'GeM Product Category Specific Guidelines',
  },
  {
    id: 8,
    category: 'Financial Requirements',
    requirement: 'Financial Turnover Criteria',
    clause: 'Section 2.8',
    tenderText: 'Average annual turnover of at least ₹ 2.50 Crores across preceding 3 audited financial years certified by Chartered Accountant with valid UDIN.',
    requiredDoc: 'Audited Financial Statements & CA Certificate',
    status: 'Non-Compliant',
    confidence: 68,
    hasIssue: true,
    isDiscrepancy: true,
    issue: 'CA UDIN number missing on Sheet 3 of provisional FY 2023-24 financial statement.',
    recommendation: 'Request verified UDIN timestamp from statutory auditor within 48 hours as per ICAI and GFR requirements.',
    docName: 'Audited_Financial_Turnover.pdf',
    docSize: '3.8 MB',
    description: 'Average annual financial turnover of at least ₹ 2.50 Crores over last 3 audited financial years.',
    aiSummary: '3-year average turnover meets ₹ 3.20 Cr threshold. However, UDIN verification is missing on Sheet 3 of FY 2023-24 provisional report.',
    remarks: 'Turnover value meets criteria, but UDIN clarification needed.',
    ruleSource: 'ICAI UDIN Mandatory Mandate & GFR Rule 144(ix)',
  },
  {
    id: 9,
    category: 'Mandatory Documents',
    requirement: 'Bid Security / EMD Exemption',
    clause: 'Section 2.9',
    tenderText: 'Earnest Money Deposit (EMD) of ₹ 85,000 via BG/e-PBG or valid MSME Udyam exemption certificate.',
    requiredDoc: 'EMD Receipt / MSME Udyam Exemption',
    status: 'Compliant',
    confidence: 97,
    hasIssue: false,
    docName: 'MSME_Udyam_EMD_Waiver.pdf',
    docSize: '890 KB',
    description: 'Earnest Money Deposit (EMD) of ₹ 85,000 or valid MSME/Udyam exemption certificate.',
    aiSummary: 'Valid Udyam certificate (Small Enterprise) matched on MSME Portal. EMD waiver granted under GFR Rule 170(i).',
    remarks: 'EMD exempted under GFR 170(i).',
    ruleSource: 'GFR 2017 Rule 170(i) & MSME Policy Order 2012',
  },
  {
    id: 10,
    category: 'Tender Conditions',
    requirement: 'GFR Rule 144(xi) Land Border Declaration',
    clause: 'Section 2.10',
    tenderText: 'Mandatory certificate regarding restrictions on procurement from bidders having land borders with India per Department of Expenditure OM.',
    requiredDoc: 'Land Border Sharing Undertaking',
    status: 'Compliant',
    confidence: 98,
    hasIssue: false,
    docName: 'Land_Border_Rule_144xi_Certificate.pdf',
    docSize: '480 KB',
    description: 'Bidder compliance certification with DoE OM F.No.6/18/2019-PPD dated 23.07.2020.',
    aiSummary: 'Declaration compliant. Entity is 100% incorporated in India with no beneficial ownership from land border countries.',
    remarks: 'Compliant and digitally signed with Class-3 DSC.',
    ruleSource: 'DoE OM F.No.6/18/2019-PPD & GFR Rule 144(xi)',
  },
  {
    id: 11,
    category: 'Tender Conditions',
    requirement: 'PPP-MII Local Content (Make in India)',
    clause: 'Section 2.11',
    tenderText: 'Public Procurement (Preference to Make in India) Order: Bidder must declare local content percentage (Min 50% for Class-I Local Supplier).',
    requiredDoc: 'Local Content Self-Certificate',
    status: 'Compliant',
    confidence: 94,
    hasIssue: false,
    docName: 'Make_in_India_65Percent_Declaration.pdf',
    docSize: '510 KB',
    description: 'Self-certification of minimum 50% local content with location of value addition.',
    aiSummary: 'Local content declared at 65.4% with primary manufacturing facility in Okhla, New Delhi. Class-I Local Supplier status confirmed.',
    remarks: 'Class-I Local Supplier (65.4% Local Content).',
    ruleSource: 'DPIIT PPP-MII Order 2017 & GeM MII Clauses',
  },
  {
    id: 12,
    category: 'Technical Requirements',
    requirement: 'Past Performance & Supply Experience',
    clause: 'Section 2.12',
    tenderText: 'Proof of having executed at least 2 similar purchase orders for Govt/PSU buyers valued over ₹ 50 Lakhs in last 3 years.',
    requiredDoc: 'Satisfactory Performance Certificates & GeM CRAC',
    status: 'Compliant',
    confidence: 92,
    hasIssue: false,
    docName: 'Past_Performance_CRAC_Certificates.pdf',
    docSize: '2.1 MB',
    description: 'Consignee Receipt and Acceptance Certificates (CRAC) from past procurement contracts.',
    aiSummary: 'CRAC copies from Indian Railways (₹64 Lakhs) and DRDO (₹58 Lakhs) verified against GeM past contracts registry.',
    remarks: 'Past performance criteria satisfied.',
    ruleSource: 'GeM GTC Clause 4.8 & Manual for Procurement 2017',
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Categories', count: '128 Criteria', color: 'indigo' },
  { id: 'eligibility', name: '1. Eligibility Criteria', count: '18 / 20 Compliant', color: 'emerald' },
  { id: 'mandatory_docs', name: '2. Mandatory Documents', count: '12 / 14 Compliant', color: 'emerald' },
  { id: 'technical', name: '3. Technical Requirements', count: '28 / 30 Compliant', color: 'amber' },
  { id: 'financial', name: '4. Financial Requirements', count: '16 / 18 Compliant', color: 'rose' },
  { id: 'conditions', name: '5. Tender Conditions & GFR', count: '40 / 46 Compliant', color: 'emerald' },
];

const ComplianceCheckView = ({ onBackToDashboard, submissionData }) => {
  const [activeTab, setActiveTab] = useState('all'); // all | compliant | needs_review | non_compliant | not_applicable
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatBotOpen, setChatBotOpen] = useState(false);

  // Requirements state
  const [requirements, setRequirements] = useState(INITIAL_REQUIREMENTS);

  // Selected requirement for detail drawer (default: item 6 with Discrepancy #1)
  const [selectedReqId, setSelectedReqId] = useState(6);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(true);

  // Clarification notice modal state
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);
  const [clarificationSentSuccess, setClarificationSentSuccess] = useState(false);

  // Active requirement lookup
  const selectedReq = requirements.find((r) => r.id === selectedReqId) || requirements[0];
  const [statusSelect, setStatusSelect] = useState(selectedReq.status);
  const [remarksInput, setRemarksInput] = useState(selectedReq.remarks);
  const [savedNotification, setSavedNotification] = useState(false);

  // Sync edit state when requirement changes
  const handleSelectReq = (req) => {
    setSelectedReqId(req.id);
    setStatusSelect(req.status);
    setRemarksInput(req.remarks || '');
    setDetailsPanelOpen(true);
  };

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

  // Filtered requirements list
  const filteredRequirements = useMemo(() => {
    return requirements.filter((item) => {
      // Category filter
      if (activeCategory === 'eligibility' && item.category !== 'Eligibility Criteria') return false;
      if (activeCategory === 'mandatory_docs' && item.category !== 'Mandatory Documents') return false;
      if (activeCategory === 'technical' && item.category !== 'Technical Requirements') return false;
      if (activeCategory === 'financial' && item.category !== 'Financial Requirements') return false;
      if (activeCategory === 'conditions' && item.category !== 'Tender Conditions') return false;

      // Status tab filter
      if (activeTab === 'compliant' && item.status !== 'Compliant') return false;
      if (activeTab === 'needs_review' && item.status !== 'Needs Review') return false;
      if (activeTab === 'non_compliant' && item.status !== 'Non-Compliant') return false;
      if (activeTab === 'not_applicable' && item.status !== 'Not Applicable') return false;
      if (activeTab === 'discrepancies' && !item.isDiscrepancy) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.requirement.toLowerCase().includes(q);
        const matchClause = item.clause.toLowerCase().includes(q);
        const matchDoc = item.requiredDoc.toLowerCase().includes(q);
        const matchRule = item.ruleSource?.toLowerCase().includes(q);
        if (!matchTitle && !matchClause && !matchDoc && !matchRule) return false;
      }

      return true;
    });
  }, [requirements, activeCategory, activeTab, searchQuery]);

  // Government Status Badge Component
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Compliant':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Compliant</span>
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            <span>Needs Review</span>
          </span>
        );
      case 'Non-Compliant':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>Non-Compliant</span>
          </span>
        );
      case 'Not Applicable':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>Not Applicable</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ---------------- 1. 4-TIER GOVERNMENT STATUS STATS CARDS ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Evaluated */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer hover:shadow-md ${
            activeTab === 'all'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-2xs'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Criteria</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">128</h4>
          <span className="text-[10.5px] font-semibold text-slate-400 mt-0.5 block">Full rule set</span>
        </div>

        {/* 🟢 Compliant */}
        <div
          onClick={() => setActiveTab('compliant')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer hover:shadow-md ${
            activeTab === 'compliant'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Compliant</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">114</h4>
          <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            89.1% satisfied
          </span>
        </div>

        {/* 🟡 Needs Review */}
        <div
          onClick={() => setActiveTab('needs_review')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer hover:shadow-md ${
            activeTab === 'needs_review'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-2xs'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Needs Review</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">10</h4>
          <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
            Manual check needed
          </span>
        </div>

        {/* 🔴 Non-Compliant */}
        <div
          onClick={() => setActiveTab('non_compliant')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer hover:shadow-md ${
            activeTab === 'non_compliant'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-2xs'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Non-Compliant</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">2</h4>
          <span className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
            2 Discrepancies
          </span>
        </div>

        {/* ⚪ Not Applicable */}
        <div
          onClick={() => setActiveTab('not_applicable')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer hover:shadow-md ${
            activeTab === 'not_applicable'
              ? 'border-slate-400 ring-2 ring-slate-400/20 shadow-2xs'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Not Applicable</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">2</h4>
          <span className="text-[10.5px] font-semibold text-slate-400 mt-0.5 block">Exempted per rules</span>
        </div>
      </div>

      {/* ---------------- 3. TABS & SEARCH BAR ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/90 dark:border-slate-800 pb-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Criteria (128)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compliant')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'compliant'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Compliant (114)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('needs_review')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'needs_review'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Needs Review (10)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('non_compliant')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'non_compliant'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Non-Compliant (2)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discrepancies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'discrepancies'
                ? 'bg-[#FF9933] text-white shadow-xs'
                : 'text-[#FF9933] hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Discrepancies (2)</span>
          </button>
        </div>

        {/* Search & Export Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clause or rule..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setChatBotOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-xs font-bold text-white shadow-xs transition cursor-pointer shrink-0 group"
            title="Ask AI Tender Assistant (POST /api/officer/tenders/chat)"
          >
            <MessageSquare className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Ask Tender AI</span>
          </button>

          <button
            type="button"
            onClick={() => alert('Official Procurement Verification Audit Dossier exported in PDF with digital seal & cryptographic hash.')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Audit Dossier</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* ---------------- 4. THREE-COLUMN VERIFICATION WORKSPACE ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Categories List (~3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Procurement Pillars
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">GFR 2017</span>
          </div>

          <div className="space-y-1.5 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left font-semibold transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/80'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="truncate pr-1 text-[11.5px]">{cat.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    cat.color === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : cat.color === 'amber'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : cat.color === 'rose'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tri-Partite Ingestion Info Box */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-xs space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Tri-Partite Verification
            </span>
            <div className="text-[11px] space-y-1">
              <p className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                <span>Tender Specs (RFP/NIT)</span>
              </p>
              <p className="flex items-center gap-1.5">
                <FileCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Bidder Dossier &amp; Attachments</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Scale className="w-3 h-3 text-amber-500 shrink-0" />
                <span>GFR 2017 &amp; PPP-MII Rules</span>
              </p>
            </div>
          </div>
        </div>

        {/* Middle Column: Criteria Verification Table (~6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            {/* Table Header / Subtitle */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Compliance Verification Criteria
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Showing {filteredRequirements.length} criteria evaluated by AI Verification Engine
                </p>
              </div>

              {filteredRequirements.some((r) => r.isDiscrepancy) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <AlertTriangle className="w-3 h-3" />
                  <span>2 Discrepancies</span>
                </span>
              )}
            </div>

            {/* Verification Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-2.5 px-3 font-semibold w-8">#</th>
                    <th className="py-2.5 px-2.5 font-semibold">Requirement</th>
                    <th className="py-2.5 px-2 font-semibold">Clause / Rule</th>
                    <th className="py-2.5 px-2 font-semibold">Status</th>
                    <th className="py-2.5 px-2 font-semibold">AI Confidence</th>
                    <th className="py-2.5 px-3 text-center font-semibold w-12">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredRequirements.map((req) => {
                    const isSelected = selectedReqId === req.id;
                    return (
                      <React.Fragment key={req.id}>
                        <tr
                          onClick={() => handleSelectReq(req)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50/70 dark:bg-amber-950/25'
                              : req.isDiscrepancy
                              ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-3 text-slate-400 font-bold text-[11px]">
                            {req.id}
                          </td>
                          <td className="py-3 px-2.5 font-bold text-slate-900 dark:text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span>{req.requirement}</span>
                              {req.isDiscrepancy && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Discrepancy detected" />
                              )}
                            </div>
                            <span className="text-[10px] font-normal text-slate-400 block truncate max-w-[200px]">
                              {req.requiredDoc}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                            <span className="font-semibold text-blue-600 dark:text-blue-400 block">
                              {req.clause}
                            </span>
                            <span className="text-[9.5px] text-slate-400 block truncate max-w-[110px]">
                              {req.ruleSource}
                            </span>
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            {renderStatusBadge(req.status)}
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            {req.confidence ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-7">
                                  {req.confidence}%
                                </span>
                                <div className="w-14 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
                              <span className="text-slate-400 font-normal pl-2">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectReq(req);
                              }}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                isSelected
                                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/60'
                                  : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title="Inspect Clause Evidence"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>

                        {/* Inline Discrepancy Callout if Row is selected and has discrepancy */}
                        {isSelected && req.isDiscrepancy && (
                          <tr>
                            <td colSpan={6} className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border-y border-amber-200/90 dark:border-amber-800/70">
                              <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                  <span className="inline-flex items-center gap-1 font-bold text-amber-900 dark:text-amber-200 shrink-0">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    Discrepancy:
                                  </span>
                                  <span className="text-amber-800 dark:text-amber-300 font-semibold">
                                    {req.issue}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="font-bold text-amber-900 dark:text-amber-200 shrink-0">
                                    Remedial Action:
                                  </span>
                                  <span className="text-amber-800 dark:text-amber-300">
                                    {req.recommendation}
                                  </span>
                                </div>
                                <div className="pt-1 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setClarificationModalOpen(true)}
                                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Issue Clarification Notice</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Evidence & Verification Drawer (~3 cols) */}
        {detailsPanelOpen && (
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 space-y-4 animate-in fade-in duration-150">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Verification Evidence
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsPanelOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Requirement Title & Category */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {selectedReq.category}
              </span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {selectedReq.requirement}
              </h4>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {selectedReq.clause} &bull; {selectedReq.ruleSource}
              </p>
            </div>

            {/* Verbatim Tender Requirement Clause */}
            <div className="space-y-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Verbatim Tender Requirement (RFP)
              </span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 italic leading-relaxed">
                “{selectedReq.tenderText}”
              </p>
            </div>

            {/* Bidder Submitted Document Evidence */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Bidder Document Evidence
              </span>
              {selectedReq.docName ? (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {selectedReq.docName}
                      </p>
                      <p className="text-[10px] text-slate-400">{selectedReq.docSize} &bull; DSC Verified</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => alert(`Opening preview of ${selectedReq.docName}`)}
                      className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      title="View PDF"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading verified copy of ${selectedReq.docName}`)}
                      className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No document required (Waiver applicable).</p>
              )}
            </div>

            {/* AI Extraction Summary */}
            <div className="space-y-1 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>AI Verification Reasoning</span>
              </span>
              <MarkdownRenderer
                content={selectedReq.aiSummary}
                className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed mt-1"
              />
            </div>

            {/* Discrepancy Callout if applicable */}
            {selectedReq.isDiscrepancy && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Actionable Discrepancy</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  {selectedReq.issue}
                </p>
                <p className="text-[10.5px] text-amber-700 dark:text-amber-400">
                  <span className="font-bold">Remedy:</span> {selectedReq.recommendation}
                </p>
              </div>
            )}

            {/* Evaluator Status Update */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Verification Status Override
              </label>
              <select
                value={statusSelect}
                onChange={(e) => setStatusSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="Compliant">🟢 Compliant — Requirement satisfied</option>
                <option value="Needs Review">🟡 Needs Review — Potential issue / manual verification needed</option>
                <option value="Non-Compliant">🔴 Non-Compliant — Requirement not satisfied</option>
                <option value="Not Applicable">⚪ Not Applicable — Requirement doesn't apply</option>
              </select>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Procurement Officer Remarks
                </label>
                <textarea
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  rows={2}
                  placeholder="Enter evaluation justification..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveStatus}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0A2540] hover:bg-[#081d33] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Official Audit Trail</span>
              </button>

              {savedNotification && (
                <p className="text-[11px] text-center font-bold text-emerald-600 animate-in fade-in">
                  ✓ Verification record timestamped and committed!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---------------- MODAL: ISSUE CLARIFICATION NOTICE ---------------- */}
      {clarificationModalOpen && (
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
                onClick={() => setClarificationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  Recipient: ABC Enterprises Pvt. Ltd. (SUB/2024/000346)
                </p>
                <p className="text-slate-500">
                  Tender: Supply of Office Stationery Items (GEM/2024/B/5123981)
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

              <p className="text-[11px] text-slate-500 italic">
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
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Clarification Notice</span>
              </button>
            </div>

            {clarificationSentSuccess && (
              <p className="text-xs font-bold text-emerald-600 text-center animate-in fade-in">
                ✓ GeM Clarification Notice dispatched to bidder! Response deadline: 48 hours.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Per-Tender & Bidder AI Chatbot (POST /api/officer/tenders/chat) */}
      <BidderChatBot
        isOpen={chatBotOpen}
        onClose={() => setChatBotOpen(false)}
        tenderId={submissionData?.tenderId || '1'}
        bidderId={submissionData?.bidderId || submissionData?.id || 'BID-007'}
        bidderData={
          submissionData || {
            bidder: 'ABC Enterprises Pvt. Ltd.',
            id: 'BID-007',
            bidderId: 'BID-007',
            tenderId: '1',
            tenderTitle: 'Supply of Office Stationery Items',
            department: 'Ministry of Education',
            complianceScore: 92,
            complianceStatus: 'Compliant',
          }
        }
      />
    </div>
  );
};

export default ComplianceCheckView;
