import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  X,
  FileText,
  FileSpreadsheet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Play,
  FileCheck,
  ShieldCheck,
  Building2,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const INITIAL_SUBMISSIONS = [
  {
    id: 'SUB/2024/000346',
    tenderId: 'GEM/2024/B/5123981',
    tenderTitle: 'Supply of Office Stationery Items',
    department: 'Ministry of Education',
    bidder: 'ABC Enterprises Pvt. Ltd.',
    submittedOn: '25 May 2024',
    submittedTime: '10:30 AM',
    docCount: 18,
    complianceScore: 92,
    complianceStatus: 'Compliant',
    evaluationStatus: 'Pending',
    documents: [
      { name: 'Technical Bid.pdf', size: '3.4 MB', type: 'Technical' },
      { name: 'Financial Bid.pdf', size: '1.2 MB', type: 'Financial' },
      { name: 'GST Certificate.pdf', size: '640 KB', type: 'Statutory' },
      { name: 'PAN Card.pdf', size: '420 KB', type: 'Identity' },
      { name: 'Turnover Auditor Certificate.pdf', size: '890 KB', type: 'Financial' },
      { name: 'Make In India Declaration.pdf', size: '510 KB', type: 'Policy' },
      { name: 'Land Border Rule 144(xi) Undertaking.pdf', size: '380 KB', type: 'Policy' },
    ],
  },
  {
    id: 'SUB/2024/000345',
    tenderId: 'GEM/2024/B/5123981',
    tenderTitle: 'Supply of Office Stationery Items',
    department: 'Ministry of Education',
    bidder: 'XYZ Solutions',
    submittedOn: '25 May 2024',
    submittedTime: '09:45 AM',
    docCount: 21,
    complianceScore: 68,
    complianceStatus: 'Needs Review',
    evaluationStatus: 'Under Review',
    documents: [
      { name: 'Technical Proposal_v2.pdf', size: '4.1 MB', type: 'Technical' },
      { name: 'BOQ Price Schedule.xlsx', size: '680 KB', type: 'Financial' },
      { name: 'GST Clearance Certificate.pdf', size: '720 KB', type: 'Statutory' },
      { name: 'PAN Card.pdf', size: '380 KB', type: 'Identity' },
      { name: 'Local Content Declaration (45%).pdf', size: '490 KB', type: 'Policy' },
    ],
  },
  {
    id: 'SUB/2024/000344',
    tenderId: 'GEM/2024/B/5123981',
    tenderTitle: 'Supply of Office Stationery Items',
    department: 'Ministry of Education',
    bidder: 'Global Traders',
    submittedOn: '25 May 2024',
    submittedTime: '09:15 AM',
    docCount: 16,
    complianceScore: 45,
    complianceStatus: 'Non-Compliant',
    evaluationStatus: 'Pending',
    documents: [
      { name: 'Global Bidder Technical Dossier.pdf', size: '2.8 MB', type: 'Technical' },
      { name: 'Financial Quotation Sheet.pdf', size: '850 KB', type: 'Financial' },
      { name: 'Subcontractor Disclosures.pdf', size: '920 KB', type: 'Statutory' },
      { name: 'Land Border Certificate.pdf', size: '310 KB', type: 'Policy' },
    ],
  },
  {
    id: 'SUB/2024/000343',
    tenderId: 'GEM/2024/B/5123981',
    tenderTitle: 'Supply of Office Stationery Items',
    department: 'Ministry of Education',
    bidder: 'TechCorp India Pvt. Ltd.',
    submittedOn: '24 May 2024',
    submittedTime: '04:20 PM',
    docCount: 19,
    complianceScore: 85,
    complianceStatus: 'Compliant',
    evaluationStatus: 'Under Review',
    documents: [
      { name: 'Hardware & Stationery Specs.pdf', size: '5.2 MB', type: 'Technical' },
      { name: 'Audited Financial Statements.pdf', size: '2.4 MB', type: 'Financial' },
      { name: 'GST Certificate.pdf', size: '580 KB', type: 'Statutory' },
      { name: 'PAN Card.pdf', size: '390 KB', type: 'Identity' },
    ],
  },
  {
    id: 'SUB/2024/000342',
    tenderId: 'GEM/2024/B/5123981',
    tenderTitle: 'Supply of Office Stationery Items',
    department: 'Ministry of Education',
    bidder: 'Innovative Supplies',
    submittedOn: '24 May 2024',
    submittedTime: '03:10 PM',
    docCount: 20,
    complianceScore: 72,
    complianceStatus: 'Needs Review',
    evaluationStatus: 'Pending',
    documents: [
      { name: 'Technical Compliance Matrix.pdf', size: '3.1 MB', type: 'Technical' },
      { name: 'Price Schedule.xlsx', size: '480 KB', type: 'Financial' },
      { name: 'MSME Registration Certificate.pdf', size: '620 KB', type: 'Statutory' },
    ],
  },
  {
    id: 'SUB/2024/000341',
    tenderId: 'GEM/2024/B/5123981',
    tenderTitle: 'Supply of Office Stationery Items',
    department: 'Ministry of Education',
    bidder: 'Quick Supplies Co.',
    submittedOn: '24 May 2024',
    submittedTime: '02:05 PM',
    docCount: 17,
    complianceScore: 88,
    complianceStatus: 'Compliant',
    evaluationStatus: 'Under Review',
    documents: [
      { name: 'Technical Bid Proposal.pdf', size: '3.6 MB', type: 'Technical' },
      { name: 'Commercial Bid Breakdown.pdf', size: '1.4 MB', type: 'Financial' },
      { name: 'Tax Compliance Proof.pdf', size: '740 KB', type: 'Statutory' },
    ],
  },
  {
    id: 'SUB/2024/000340',
    tenderId: 'GEM/2024/B/5123981',
    tenderTitle: 'Supply of Office Stationery Items',
    department: 'Ministry of Education',
    bidder: 'Shree Enterprises',
    submittedOn: '24 May 2024',
    submittedTime: '11:30 AM',
    docCount: 14,
    complianceScore: 35,
    complianceStatus: 'Non-Compliant',
    evaluationStatus: 'Pending',
    documents: [
      { name: 'Bid Document Package.pdf', size: '2.1 MB', type: 'Technical' },
      { name: 'Price Quotation.xlsx', size: '510 KB', type: 'Financial' },
      { name: 'Company Registration.pdf', size: '890 KB', type: 'Statutory' },
    ],
  },
  {
    id: 'SUB/2024/000339',
    tenderId: 'GEM/2024/B/5123981',
    tenderTitle: 'Supply of Office Stationery Items',
    department: 'Ministry of Education',
    bidder: 'Premier Distributors',
    submittedOn: '24 May 2024',
    submittedTime: '10:00 AM',
    docCount: 18,
    complianceScore: 90,
    complianceStatus: 'Compliant',
    evaluationStatus: 'Under Review',
    documents: [
      { name: 'Technical Proposal Dossier.pdf', size: '4.2 MB', type: 'Technical' },
      { name: 'Financial Offer Sheet.pdf', size: '1.1 MB', type: 'Financial' },
      { name: 'GST & PAN Documentation.pdf', size: '920 KB', type: 'Statutory' },
    ],
  },
];

const TenderSubmissionsView = ({ onBackToDashboard, onOpenCompliance }) => {
  // Filters & State
  const [showFilters, setShowFilters] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all'); // all | pending | review | compliant | non_compliant
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTenderId, setFilterTenderId] = useState('GEM/2024/B/5123981');
  const [filterDept, setFilterDept] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterCompliance, setFilterCompliance] = useState('');
  const [filterEval, setFilterEval] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected submission for side drawer
  const [selectedSubmission, setSelectedSubmission] = useState(INITIAL_SUBMISSIONS[0]);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(true);
  const [viewAllDocs, setViewAllDocs] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterTenderId('');
    setFilterDept('');
    setFilterOrg('');
    setFilterCompliance('');
    setFilterEval('');
    setStartDate('');
    setEndDate('');
    setSelectedTab('all');
  };

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return INITIAL_SUBMISSIONS.filter((item) => {
      // Tab filter
      if (selectedTab === 'pending' && item.evaluationStatus !== 'Pending') return false;
      if (selectedTab === 'review' && item.evaluationStatus !== 'Under Review') return false;
      if (selectedTab === 'compliant' && item.complianceStatus !== 'Compliant') return false;
      if (selectedTab === 'non_compliant' && item.complianceStatus === 'Compliant') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.tenderTitle.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        const matchTender = item.tenderId.toLowerCase().includes(q);
        const matchBidder = item.bidder.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchTender && !matchBidder) return false;
      }

      // Tender ID specific filter
      if (filterTenderId.trim()) {
        if (!item.tenderId.toLowerCase().includes(filterTenderId.toLowerCase())) return false;
      }

      // Compliance status dropdown
      if (filterCompliance && item.complianceStatus !== filterCompliance) return false;

      // Evaluation status dropdown
      if (filterEval && item.evaluationStatus !== filterEval) return false;

      return true;
    });
  }, [selectedTab, searchQuery, filterTenderId, filterCompliance, filterEval]);

  const handleSelectRow = (sub) => {
    setSelectedSubmission(sub);
    setDetailsDrawerOpen(true);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-5 select-none animate-in fade-in duration-200">

      {/* -------------------- 1. TOP 5 STAT CARDS -------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Submissions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Submissions</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                346
              </h3>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">All time</p>
            </div>
          </div>
        </div>

        {/* Card 2: Active Tenders */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Tenders</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                128
              </h3>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">With submissions</p>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Evaluation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pending Evaluation</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                89
              </h3>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Awaiting evaluation</p>
            </div>
          </div>
        </div>

        {/* Card 4: Non-Compliant */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Non-Compliant</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                23
              </h3>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Require attention</p>
            </div>
          </div>
        </div>

        {/* Card 5: Compliant */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Compliant</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                234
              </h3>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Passed compliance</p>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- 3. FILTER PANEL -------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Search & Filter Criteria</span>
          </span>
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
          <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150">
            {/* Row 1: Search, Tender ID, Dept, Org, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Tender ID / Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tender ID / Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Tender ID or Title..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Tender ID with clear X */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tender ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterTenderId}
                    onChange={(e) => setFilterTenderId(e.target.value)}
                    placeholder="e.g. GEM/2024/B/5123981"
                    className="w-full pl-3 pr-8 py-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {filterTenderId && (
                    <button
                      type="button"
                      onClick={() => setFilterTenderId('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Department</option>
                  <option value="Ministry of Education">Ministry of Education</option>
                  <option value="Ministry of Railways">Ministry of Railways</option>
                  <option value="PWD Department">PWD Department</option>
                  <option value="Health Department">Health Department</option>
                </select>
              </div>

              {/* Organization / Bidder */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Organization / Bidder
                </label>
                <select
                  value={filterOrg}
                  onChange={(e) => setFilterOrg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Organization</option>
                  <option value="ABC Enterprises Pvt. Ltd.">ABC Enterprises Pvt. Ltd.</option>
                  <option value="XYZ Solutions">XYZ Solutions</option>
                  <option value="Global Traders">Global Traders</option>
                  <option value="TechCorp India Pvt. Ltd.">TechCorp India Pvt. Ltd.</option>
                </select>
              </div>

              {/* Submission Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Submission Status
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Row 2: Compliance Status, Date Range, Evaluation Status, Reset, Apply */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs items-end">
              {/* Compliance Status */}
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Compliance Status
                </label>
                <select
                  value={filterCompliance}
                  onChange={(e) => setFilterCompliance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Compliance</option>
                  <option value="Compliant">🟢 Compliant</option>
                  <option value="Needs Review">🟡 Needs Review</option>
                  <option value="Non-Compliant">🔴 Non-Compliant</option>
                  <option value="Not Applicable">⚪ Not Applicable</option>
                </select>
              </div>

              {/* Submitted Date Range */}
              <div className="lg:col-span-4">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Submitted Date
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Start Date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-3 pr-7 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-xs text-slate-400">to</span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="End Date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-3 pr-7 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Evaluation Status */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Evaluation Status
                </label>
                <select
                  value={filterEval}
                  onChange={(e) => setFilterEval(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Evaluation Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>

              {/* Buttons: Reset & Apply Filters */}
              <div className="lg:col-span-3 flex items-center justify-end gap-2 pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Apply Filters</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- 4. TABS & EXPORT BUTTON -------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSelectedTab('all')}
            className={`pb-2.5 px-2 font-bold flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
              selectedTab === 'all'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>All Submissions</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold">
              346
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('pending')}
            className={`pb-2.5 px-2 font-bold flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
              selectedTab === 'pending'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Pending Evaluation</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              89
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('review')}
            className={`pb-2.5 px-2 font-bold flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
              selectedTab === 'review'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Under Review</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              45
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('compliant')}
            className={`pb-2.5 px-2 font-bold flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
              selectedTab === 'compliant'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Compliant</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold">
              234
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('non_compliant')}
            className={`pb-2.5 px-2 font-bold flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
              selectedTab === 'non_compliant'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Non-Compliant</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-semibold">
              23
            </span>
          </button>
        </div>

        {/* Export Button */}
        <div className="pb-1">
          <button
            type="button"
            onClick={() => alert('Exporting submissions table to CSV / Excel...')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* -------------------- 5. MAIN CONTENT: TABLE & RIGHT DETAILS DRAWER -------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Submissions Data Table */}
        <div
          className={`${
            detailsDrawerOpen ? 'lg:col-span-8' : 'lg:col-span-12'
          } bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-all duration-200`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3.5">Submission ID</th>
                  <th className="py-3 px-3.5">Tender ID / Title</th>
                  <th className="py-3 px-3.5">Bidder / Organization</th>
                  <th className="py-3 px-3.5">Submitted On</th>
                  <th className="py-3 px-3.5 text-center">Documents</th>
                  <th className="py-3 px-3.5">Compliance Score</th>
                  <th className="py-3 px-3.5 text-center">Compliance Status</th>
                  <th className="py-3 px-3.5 text-center">Evaluation Status</th>
                  <th className="py-3 px-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-200">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No tender submissions found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const isSelected = selectedSubmission?.id === sub.id && detailsDrawerOpen;
                    return (
                      <tr
                        key={sub.id}
                        onClick={() => handleSelectRow(sub)}
                        className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                          isSelected ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''
                        }`}
                      >
                        {/* Submission ID */}
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                            {sub.id}
                          </span>
                        </td>

                        {/* Tender ID / Title */}
                        <td className="py-3 px-3.5 max-w-[200px]">
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">
                            {sub.tenderId}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {sub.tenderTitle}
                          </p>
                        </td>

                        {/* Bidder / Organization */}
                        <td className="py-3 px-3.5 font-semibold text-slate-900 dark:text-white">
                          {sub.bidder}
                        </td>

                        {/* Submitted On */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <p className="text-slate-900 dark:text-white leading-tight">{sub.submittedOn}</p>
                          <p className="text-[10px] text-slate-400">{sub.submittedTime}</p>
                        </td>

                        {/* Documents Pill */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                            <FileText className="w-3 h-3" />
                            <span>{sub.docCount} Docs</span>
                          </span>
                        </td>

                        {/* Compliance Score + Progress Bar */}
                        <td className="py-3 px-3.5 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-xs w-7">
                              {sub.complianceScore}%
                            </span>
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getScoreColor(sub.complianceScore)}`}
                                style={{ width: `${sub.complianceScore}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Compliance Status Badge */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {sub.complianceStatus === 'Compliant' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Compliant</span>
                            </span>
                          )}
                          {sub.complianceStatus === 'Needs Review' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Needs Review</span>
                            </span>
                          )}
                          {sub.complianceStatus === 'Non-Compliant' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>Non-Compliant</span>
                            </span>
                          )}
                          {sub.complianceStatus === 'Not Applicable' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Not Applicable</span>
                            </span>
                          )}
                        </td>

                        {/* Evaluation Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {sub.evaluationStatus === 'Pending' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Pending
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                              Under Review
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleSelectRow(sub)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenCompliance && onOpenCompliance(sub)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer text-xs font-bold"
                              title="Evaluate"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Pagination & Rows per page */}
          <div className="p-3.5 border-t border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span>Showing 1 to {filteredSubmissions.length} of 346 submissions</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Pagination numbers */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs"
                >
                  1
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center text-xs cursor-pointer"
                >
                  2
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center text-xs cursor-pointer"
                >
                  3
                </button>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center text-xs cursor-pointer"
                >
                  35
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rows Per Page Selector */}
              <div className="flex items-center gap-1.5">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------- 6. RIGHT SIDE DETAILS DRAWER -------------------- */}
        {detailsDrawerOpen && selectedSubmission && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Submission Details
              </h3>
              <button
                type="button"
                onClick={() => setDetailsDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Submission ID & Badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                {selectedSubmission.id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                  selectedSubmission.complianceStatus === 'Compliant'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60'
                    : selectedSubmission.complianceStatus === 'Needs Review'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedSubmission.complianceStatus === 'Compliant'
                      ? 'bg-emerald-500'
                      : selectedSubmission.complianceStatus === 'Needs Review'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span>{selectedSubmission.complianceStatus}</span>
              </span>
            </div>

            {/* Tender Info */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Tender</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {selectedSubmission.tenderId}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {selectedSubmission.tenderTitle}
              </p>
            </div>

            {/* Bidder */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Bidder</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {selectedSubmission.bidder}
              </p>
            </div>

            {/* Submitted On */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Submitted On</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {selectedSubmission.submittedOn}, {selectedSubmission.submittedTime}
              </p>
            </div>

            {/* Compliance Score Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Compliance Score</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedSubmission.complianceScore}% Compliant
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getScoreColor(selectedSubmission.complianceScore)}`}
                  style={{ width: `${selectedSubmission.complianceScore}%` }}
                />
              </div>
            </div>

            {/* Documents List */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Documents ({selectedSubmission.docCount})
                </span>
                <button
                  type="button"
                  onClick={() => setViewAllDocs(!viewAllDocs)}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {viewAllDocs ? 'Show Less' : 'View All'}
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {(viewAllDocs ? selectedSubmission.documents : selectedSubmission.documents.slice(0, 4)).map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-xs font-medium">{doc.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{doc.size}</span>
                  </div>
                ))}
                {!viewAllDocs && selectedSubmission.docCount > 4 && (
                  <p className="text-[11px] text-slate-400 italic pt-0.5">
                    ...and {selectedSubmission.docCount - 4} more
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* View Compliance Report */}
              <button
                type="button"
                onClick={() => onOpenCompliance && onOpenCompliance(selectedSubmission)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>View Compliance Report</span>
              </button>

              {/* Start Evaluation */}
              <button
                type="button"
                onClick={() => onOpenCompliance && onOpenCompliance(selectedSubmission)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 border border-blue-600/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700/50 text-xs font-bold transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Evaluation</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- 7. FOOTER -------------------- */}
      <div className="pt-6 pb-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <div>
          <span>© 2024 GeM Compliflix Platform. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Version 1.0.0</span>
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span className="hover:underline cursor-pointer">Terms of Service</span>
        </div>
      </div>
    </div>
  );
};

export default TenderSubmissionsView;
