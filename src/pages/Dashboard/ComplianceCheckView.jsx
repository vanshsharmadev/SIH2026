import React, { useState } from 'react';
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
} from 'lucide-react';

const INITIAL_REQUIREMENTS = [
  {
    id: 1,
    category: 'Eligibility Criteria',
    requirement: 'Bidder Registration on GeM',
    clause: 'Section 2.1',
    requiredDoc: 'GeM Seller Registration Certificate',
    status: 'Compliant',
    confidence: 98,
    hasIssue: false,
    docName: 'GeM_Seller_Registration_Cert.pdf',
    docSize: '410 KB',
    description: 'Bidder must possess valid and active seller registration on Government e-Marketplace (GeM).',
    aiSummary: 'Active GeM seller registration verified against GeM SPV database. Valid till 31 Dec 2026.',
    remarks: 'Verified & active on GeM portal.',
  },
  {
    id: 2,
    category: 'Eligibility Criteria',
    requirement: 'Valid Business Registration',
    clause: 'Section 2.2',
    requiredDoc: 'Certificate of Incorporation / Udyam',
    status: 'Compliant',
    confidence: 95,
    hasIssue: false,
    docName: 'Certificate_of_Incorporation.pdf',
    docSize: '1.2 MB',
    description: 'Valid certificate of incorporation under Companies Act or registered partnership / MSME Udyam.',
    aiSummary: 'CIN: U72900DL2018PTC334512 verified via Ministry of Corporate Affairs (MCA21).',
    remarks: 'Entity active for 6+ years.',
  },
  {
    id: 3,
    category: 'Eligibility Criteria',
    requirement: 'GST Registration',
    clause: 'Section 2.3',
    requiredDoc: 'GST Certificate',
    status: 'Compliant',
    confidence: 95,
    hasIssue: false,
    docName: 'GST_Registration_Certificate.pdf',
    docSize: '620 KB',
    description: 'Valid Goods and Services Tax (GST) registration certificate in the state of procurement.',
    aiSummary: 'GSTIN 07AAAAA0000A1Z5 validated. Regular taxpayer with clean filing record for past 12 months.',
    remarks: 'Active status confirmed via GSTN API.',
  },
  {
    id: 4,
    category: 'Eligibility Criteria',
    requirement: 'PAN Card',
    clause: 'Section 2.4',
    requiredDoc: 'PAN Card',
    status: 'Compliant',
    confidence: 99,
    hasIssue: false,
    docName: 'Company_PAN_Card.pdf',
    docSize: '310 KB',
    description: 'Permanent Account Number (PAN) allotted by Income Tax Department in name of bidder entity.',
    aiSummary: 'PAN matched with MCA corporate records and IT department database.',
    remarks: 'Allotted & verified.',
  },
  {
    id: 5,
    category: 'Eligibility Criteria',
    requirement: 'Aadhaar / KYC Verification',
    clause: 'Section 2.5',
    requiredDoc: 'Aadhaar / KYC Document',
    status: 'Compliant',
    confidence: 93,
    hasIssue: false,
    docName: 'Authorized_Signatory_KYC.pdf',
    docSize: '540 KB',
    description: 'Identity and address proof of authorized signatory and primary directors.',
    aiSummary: 'Board resolution and authorized signatory DSC match registered DIN holders.',
    remarks: 'Signatory authority confirmed.',
  },
  {
    id: 6,
    category: 'Eligibility Criteria',
    requirement: 'Blacklisted / Debarred Certificate',
    clause: 'Section 2.6',
    requiredDoc: 'Self Declaration on Non Blacklisting',
    status: 'Minor Issue',
    confidence: 70,
    hasIssue: true,
    issue: "The certificate is not on the bidder's letterhead.",
    recommendation: "Submit a self-declaration on bidder's letterhead as per tender clause.",
    docName: 'Self_Declaration.pdf',
    docSize: '245 KB',
    description: 'Bidder must submit a self-declaration certificate stating that the firm is not blacklisted or debarred by any Govt. Department / PSU.',
    aiSummary: 'Document extracted successfully. Certificate date: 20 May 2024. Valid declaration found, but missing standard corporate letterhead watermark.',
    remarks: "Certificate is not on bidder's letterhead.",
  },
  {
    id: 7,
    category: 'Eligibility Criteria',
    requirement: 'OEM Authorization (If applicable)',
    clause: 'Section 2.7',
    requiredDoc: 'OEM Authorization Letter',
    status: 'Not Applicable',
    confidence: null,
    hasIssue: false,
    docName: null,
    docSize: null,
    description: 'Manufacturer Authorization Form (MAF) from original equipment manufacturer if reseller.',
    aiSummary: 'Bidder is primary manufacturer / direct supplier for stationery lot. OEM waiver applicable.',
    remarks: 'Exempted per Clause 2.7(b).',
  },
  {
    id: 8,
    category: 'Eligibility Criteria',
    requirement: 'Financial Turnover Criteria',
    clause: 'Section 2.8',
    requiredDoc: 'Financial Statements',
    status: 'Minor Issue',
    confidence: 68,
    hasIssue: true,
    issue: 'CA UDIN number missing on page 3 of FY 2023-24 provisional balance sheet.',
    recommendation: 'Request verified UDIN timestamp from statutory auditor within 48 hours.',
    docName: 'Audited_Financial_Turnover.pdf',
    docSize: '3.8 MB',
    description: 'Average annual financial turnover of at least ₹ 2.50 Crores over last 3 audited financial years.',
    aiSummary: 'Turnover meets ₹ 3.20 Cr threshold. UDIN verification pending for last fiscal year sheet.',
    remarks: 'Turnover value passed, UDIN clarification needed.',
  },
  {
    id: 9,
    category: 'Eligibility Criteria',
    requirement: 'Bid Security / EMD Submitted',
    clause: 'Section 2.9',
    requiredDoc: 'EMD Receipt / BG',
    status: 'Compliant',
    confidence: 97,
    hasIssue: false,
    docName: 'MSME_Udyam_EMD_Waiver.pdf',
    docSize: '890 KB',
    description: 'Earnest Money Deposit (EMD) of ₹ 85,000 or valid MSME/Udyam exemption certificate.',
    aiSummary: 'Udyam certificate confirmed under Micro/Small enterprise category. GFR Rule 170(i) exemption verified.',
    remarks: 'EMD exempted under GFR 170(i).',
  },
  {
    id: 10,
    category: 'Eligibility Criteria',
    requirement: 'Other Declarations',
    clause: 'Section 2.10',
    requiredDoc: 'Annexure - Declarations',
    status: 'Compliant',
    confidence: 90,
    hasIssue: false,
    docName: 'Annexure_Declarations_Signed.pdf',
    docSize: '480 KB',
    description: 'Standard declarations regarding GFR Rule 144(xi) Land Border compliance and Make in India local content.',
    aiSummary: 'Land border clause and PPP-MII local content declarations signed with Class-3 DSC.',
    remarks: 'Compliant and digitally signed.',
  },
];

const CATEGORIES = [
  { id: 'eligibility', name: '1. Eligibility Criteria', count: '18 / 20', color: 'emerald' },
  { id: 'technical', name: '2. Technical Requirements', count: '24 / 30', color: 'amber' },
  { id: 'financial', name: '3. Financial Requirements', count: '16 / 18', color: 'emerald' },
  { id: 'certificates', name: '4. Certificate & Declarations', count: '22 / 26', color: 'amber' },
  { id: 'past_performance', name: '5. Past Performance', count: '10 / 12', color: 'emerald' },
  { id: 'legal', name: '6. Legal & Statutory', count: '9 / 10', color: 'emerald' },
  { id: 'experience', name: '7. Experience & Capacity', count: '6 / 8', color: 'amber' },
  { id: 'other', name: '8. Other Conditions', count: '0 / 4', color: 'slate' },
];

const ComplianceCheckView = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState('requirement'); // requirement | clause | document | summary
  const [activeCategory, setActiveCategory] = useState('eligibility');
  const [eligibilityOpen, setEligibilityOpen] = useState(true);
  const [techOpen, setTechOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);

  // Requirements list state
  const [requirements, setRequirements] = useState(INITIAL_REQUIREMENTS);

  // Selected requirement for details panel (default: row 6 Blacklisted / Debarred Certificate)
  const [selectedReqId, setSelectedReqId] = useState(6);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(true);

  // Edit fields for selected requirement
  const selectedReq = requirements.find((r) => r.id === selectedReqId) || requirements[0];
  const [statusSelect, setStatusSelect] = useState(selectedReq.status);
  const [remarksInput, setRemarksInput] = useState(selectedReq.remarks);
  const [savedNotification, setSavedNotification] = useState(false);

  // Sync state when active requirement changes
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
              hasIssue: statusSelect === 'Minor Issue' || statusSelect === 'Major Issues',
            }
          : r
      )
    );
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Compliant':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            Compliant
          </span>
        );
      case 'Minor Issue':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/80 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            Minor Issue
          </span>
        );
      case 'Major Issues':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
            Major Issues
          </span>
        );
      case 'Not Applicable':
      default:
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Not Applicable
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ---------------- 1. TENDER & BIDDER HEADER SUMMARY CARD ---------------- */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider block">
                Tender ID / Title
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  GEM/2024/B/5123981
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Supply of Office Stationery Items
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8 text-xs border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider block">
                Department
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                Ministry of Education
              </p>
            </div>

            <div>
              <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider block">
                Organization / Buyer
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                ABC Enterprises Pvt. Ltd.
              </p>
            </div>

            <div>
              <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider block">
                Submission / Bidder
              </span>
              <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                SUB/2024/000346
              </p>
            </div>

            <div>
              <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider block">
                Evaluation Stage
              </span>
              <div className="mt-1">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Compliance Check
                </span>
              </div>
            </div>
          </div>

          {/* Overall Compliance Score Donut */}
          <div className="flex items-center gap-3.5 lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-6 pt-2 lg:pt-0">
            <div>
              <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider block">
                Overall Compliance Score
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  82%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Compliant
                </span>
              </div>
            </div>

            {/* Donut graphic */}
            <div className="relative w-12 h-12 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* 82% Green */}
                <path
                  className="text-emerald-500"
                  strokeDasharray="82, 100"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* 12% Amber */}
                <path
                  className="text-amber-500"
                  strokeDasharray="12, 100"
                  strokeDashoffset="-82"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* 6% Red */}
                <path
                  className="text-rose-500"
                  strokeDasharray="6, 100"
                  strokeDashoffset="-94"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 2. FIVE METRICS STAT CARDS ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Requirements */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Total Requirements</span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">128</h4>
            <span className="text-[10px] text-slate-400 block mt-0.5">All applicable</span>
          </div>
        </div>

        {/* Compliant */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Compliant</span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">105</h4>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">82%</span>
          </div>
        </div>

        {/* Minor Issues */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Minor Issues</span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">15</h4>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mt-0.5">12%</span>
          </div>
        </div>

        {/* Major Issues */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Major Issues</span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">8</h4>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block mt-0.5">6%</span>
          </div>
        </div>

        {/* Not Applicable */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Not Applicable</span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">12</h4>
            <span className="text-[10px] text-slate-400 block mt-0.5">—</span>
          </div>
        </div>
      </div>

      {/* ---------------- 3. TABS & ACTIONS ROW ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('requirement')}
            className={`pb-2 transition relative cursor-pointer ${
              activeTab === 'requirement'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>Requirement-wise Check</span>
            {activeTab === 'requirement' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('clause')}
            className={`pb-2 transition relative cursor-pointer ${
              activeTab === 'clause'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>Clause-wise View</span>
            {activeTab === 'clause' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('document')}
            className={`pb-2 transition relative cursor-pointer ${
              activeTab === 'document'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>Document-wise View</span>
            {activeTab === 'document' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-2 transition relative cursor-pointer ${
              activeTab === 'summary'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>Summary</span>
            {activeTab === 'summary' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => alert('Filtering compliance criteria by status: All, Minor Issues, Major Issues.')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => alert('Official Compliance Audit Report exported in PDF/Excel format.')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ---------------- 4. MAIN THREE-COLUMN WORKSPACE ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 4A. Left Column: Categories List (~2.5 cols / 20%) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
            Categories
          </h3>

          <div className="space-y-1.5 text-xs">
            {CATEGORIES.map((cat, cIdx) => (
              <button
                key={cIdx}
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
                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    cat.color === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : cat.color === 'amber'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>View Summary</span>
            </button>
          </div>
        </div>

        {/* 4B. Middle Column: Requirements Table & Issue Box (~6.5 cols / 55%) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Section 1: Eligibility Criteria (Accordion) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => setEligibilityOpen((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer text-left"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    1. Eligibility Criteria
                  </h3>
                </div>
                {/* Green progress indicator line */}
                <div className="w-48 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[90%]" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  18 / 20 Compliant
                </span>
                {eligibilityOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Accordion Body: Table */}
            {eligibilityOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="py-2.5 px-3 font-semibold w-8">#</th>
                      <th className="py-2.5 px-2 font-semibold">Requirement</th>
                      <th className="py-2.5 px-2 font-semibold">Clause / Reference</th>
                      <th className="py-2.5 px-2 font-semibold">Required Document</th>
                      <th className="py-2.5 px-2 font-semibold">Status</th>
                      <th className="py-2.5 px-2 font-semibold">AI Confidence</th>
                      <th className="py-2.5 px-3 text-center font-semibold w-12">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {requirements.map((req) => {
                      const isSelected = selectedReqId === req.id;
                      return (
                        <React.Fragment key={req.id}>
                          <tr
                            onClick={() => handleSelectReq(req)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50/60 dark:bg-amber-950/20'
                                : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-3 px-3 text-slate-400 font-bold text-[11px]">
                              {req.id}
                            </td>
                            <td className="py-3 px-2 font-bold text-slate-900 dark:text-slate-200">
                              {req.requirement}
                            </td>
                            <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-[11px]">
                              {req.clause}
                            </td>
                            <td className="py-3 px-2 text-slate-600 dark:text-slate-300 text-[11px] max-w-[160px] truncate">
                              {req.requiredDoc}
                            </td>
                            <td className="py-3 px-2">
                              {renderStatusBadge(req.status)}
                            </td>
                            <td className="py-3 px-2">
                              {req.confidence ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-7">
                                    {req.confidence}%
                                  </span>
                                  <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        req.confidence >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
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
                                className={`p-1 rounded-md transition ${
                                  isSelected
                                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/60'
                                    : 'text-slate-400 hover:text-blue-600'
                                }`}
                                title="View Requirement Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Issue & Recommendation Box for selected Row 6 (or any row with an issue) */}
                          {isSelected && req.hasIssue && (
                            <tr>
                              <td colSpan={7} className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border-y border-amber-200/80 dark:border-amber-800/60">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  <div className="space-y-1">
                                    <div className="flex items-start gap-1.5">
                                      <span className="font-bold text-amber-900 dark:text-amber-200 shrink-0">
                                        Issue Identified:
                                      </span>
                                      <span className="text-amber-800 dark:text-amber-300/90 font-medium">
                                        {req.issue}
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-1.5">
                                      <span className="font-bold text-amber-900 dark:text-amber-200 shrink-0">
                                        Recommendation:
                                      </span>
                                      <span className="text-amber-800 dark:text-amber-300/90 font-medium">
                                        {req.recommendation}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => alert(`Showing Tender Clause: ${req.clause}\nRequirement: ${req.description}`)}
                                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-slate-50 transition shadow-2xs shrink-0 cursor-pointer"
                                  >
                                    View Clause
                                  </button>
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
            )}
          </div>

          {/* Collapsible Sections Below */}
          {/* Section 2: Technical Requirements */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4">
            <button
              type="button"
              onClick={() => setTechOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-left"
            >
              <span>2. Technical Requirements</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-600 dark:text-amber-400">24 / 30</span>
                {techOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {techOpen && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-2">
                <p>Detailed technical specifications, catalog attachments, and Make In India (PPP-MII) audits.</p>
              </div>
            )}
          </div>

          {/* Section 3: Financial Requirements */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4">
            <button
              type="button"
              onClick={() => setFinancialOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-left"
            >
              <span>3. Financial Requirements</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">16 / 18</span>
                {financialOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {financialOpen && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-2">
                <p>Audited balance sheets, net worth verification, and bank solvency declarations.</p>
              </div>
            )}
          </div>

          {/* Section 4: Certificate & Declarations */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4">
            <button
              type="button"
              onClick={() => setCertOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-left"
            >
              <span>4. Certificate &amp; Declarations</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-600 dark:text-amber-400">22 / 26</span>
                {certOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {certOpen && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-2">
                <p>Mandatory self-declarations, DSC timestamping certificates, and non-collusion affidavits.</p>
              </div>
            )}
          </div>
        </div>

        {/* 4C. Right Column: Requirement Details Panel (~3 cols / 25%) */}
        {detailsPanelOpen && (
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Requirement Details
              </h3>
              <button
                type="button"
                onClick={() => setDetailsPanelOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Close Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Requirement Title */}
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Requirement
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                {selectedReq.requirement}
              </h4>
            </div>

            {/* Clause Reference */}
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Clause / Reference
              </span>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {selectedReq.clause}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Description
              </span>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedReq.description}
              </p>
            </div>

            {/* Required Document */}
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Required Document
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {selectedReq.requiredDoc}
              </p>
            </div>

            {/* Submitted Document Box */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Submitted Document
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
                      <p className="text-[10px] text-slate-400">{selectedReq.docSize}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => alert(`Opening preview of ${selectedReq.docName}`)}
                      className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      title="View"
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
                <p className="text-xs text-slate-400 italic">No document required / submitted.</p>
              )}
            </div>

            {/* AI Extraction Summary */}
            <div className="space-y-1 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                AI Extraction Summary
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedReq.aiSummary}
              </p>
            </div>

            {/* AI Confidence Score */}
            {selectedReq.confidence && (
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    AI Confidence Score
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {selectedReq.confidence}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedReq.confidence >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${selectedReq.confidence}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Status
              </label>
              <select
                value={statusSelect}
                onChange={(e) => setStatusSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold focus:outline-hidden focus:border-blue-500"
              >
                <option value="Compliant">Compliant</option>
                <option value="Minor Issue">Minor Issue</option>
                <option value="Major Issues">Major Issues</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            {/* Remarks Textarea */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Remarks (Optional)
              </label>
              <textarea
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                rows={3}
                placeholder="Enter evaluation notes or remarks..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Save & Update Status Button */}
            <div>
              <button
                type="button"
                onClick={handleSaveStatus}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save &amp; Update Status</span>
              </button>
            </div>

            {savedNotification && (
              <p className="text-[11px] text-center font-bold text-emerald-600 animate-in fade-in">
                ✓ Status updated and saved to audit log!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceCheckView;
