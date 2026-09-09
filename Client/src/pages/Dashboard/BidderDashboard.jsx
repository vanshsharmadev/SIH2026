import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Download,
  UploadCloud,
  FileSpreadsheet,
  BadgeCheck,
  Sparkles,
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  XCircle,
  AlertCircle,
  Calendar,
  IndianRupee,
  Layers,
  ChevronRight,
  Briefcase,
  Award,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context';
import { mockTenders } from '../../data/mockTenders';

const BidderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('bids'); // 'bids' | 'vault' | 'recommendations' | 'precheck'
  const [selectedBidDetail, setSelectedBidDetail] = useState(null);
  const [precheckQuery, setPrecheckQuery] = useState('');
  const [precheckResult, setPrecheckResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Derive business information from user profile or sensible verified defaults
  const bidderName =
    user?.name && user.name.length > 1 && user.name !== 'OFFICIAL USER'
      ? user.name
      : 'Arnav Tyagi';

  const companyName =
    user?.companyName ||
    user?.legalName ||
    (user?.email?.includes('bel')
      ? 'Bharat Electronics Limited'
      : user?.email?.includes('omnigrid')
      ? 'OmniGrid Solar Technologies Pvt Ltd'
      : `${bidderName} Infotech & Supplies`);

  const panNumber = user?.panNumber || 'ARNAV9012H';
  const gstNumber = user?.gstNumber || '09ARNAV9012H3Z7';
  const udyamNumber = user?.udyamNumber || 'UDYAM-UP-01-0012345';
  const vendorId = user?.registrationNumber || 'GeM-V-2026-8819';

  // Sample Submitted Bids for this bidder
  const myBids = [
    {
      tenderId: 'GEM/2026/B/9401',
      title: 'Supply, Installation & Maintenance of High-Performance AI Edge Computing Servers',
      department: 'Ministry of Electronics & IT (MeitY)',
      appliedDate: '03 Sep 2026',
      bidValue: '₹ 17.80 Cr',
      complianceScore: 96,
      status: 'Under Evaluation',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
      statusIcon: Clock,
      nextMilestone: 'Technical Scrutiny by Tender Committee',
      missingDocs: 0,
      details: {
        boqSubmitted: true,
        panGstVerified: true,
        miiDeclaration: 'Class-I Local Supplier (62% Local Content)',
        landBorderRule144: 'Compliant & Verified (Non-sharing border)',
        emdExemption: 'MSE Registered (Udyam Verified)',
      },
    },
    {
      tenderId: 'GEM/2026/B/9385',
      title: 'Turnkey EPC for 50MW Grid-Connected Rooftop Solar PV Systems',
      department: 'Ministry of New & Renewable Energy (MNRE)',
      appliedDate: '29 Aug 2026',
      bidValue: '₹ 41.20 Cr',
      complianceScore: 92,
      status: 'Technically Qualified',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
      statusIcon: CheckCircle2,
      nextMilestone: 'Financial Bid Opening on 14 Sep 2026',
      missingDocs: 0,
      details: {
        boqSubmitted: true,
        panGstVerified: true,
        miiDeclaration: 'Class-I Local Supplier (74% Local Content)',
        landBorderRule144: 'Compliant',
        emdExemption: 'Bank Guarantee Verified',
      },
    },
    {
      tenderId: 'GEM/2024/B/5123982',
      title: 'IT Hardware Procurement & Network Infrastructure Setup',
      department: 'Ministry of Railways (CRIS)',
      appliedDate: '15 Aug 2026',
      bidValue: '₹ 8.40 Cr',
      complianceScore: 84,
      status: 'Clarification Requested',
      statusColor: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
      statusIcon: AlertCircle,
      nextMilestone: 'Respond to Clause 4.2 DSC Verification by 10 Sep 2026',
      missingDocs: 1,
      details: {
        boqSubmitted: true,
        panGstVerified: true,
        miiDeclaration: 'Submitted (Clarification requested on Annexure-B)',
        landBorderRule144: 'Compliant',
        emdExemption: 'MSE Exempted',
      },
    },
    {
      tenderId: 'GEM/2024/B/5123985',
      title: 'Smart Classroom Setup & Interactive Display Boards',
      department: 'Ministry of Education',
      appliedDate: '02 Aug 2026',
      bidValue: '₹ 5.60 Cr',
      complianceScore: 95,
      status: 'Awarded & Finalized',
      statusColor: 'text-emerald-800 bg-emerald-100 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
      statusIcon: Award,
      nextMilestone: 'Contract Signed & Purchase Order Dispatched',
      missingDocs: 0,
      details: {
        boqSubmitted: true,
        panGstVerified: true,
        miiDeclaration: 'Class-I Local Supplier (80% Local Content)',
        landBorderRule144: 'Compliant',
        emdExemption: 'MSE Exempted',
      },
    },
  ];

  // Document Vault files
  const documentVault = [
    {
      name: 'Permanent Account Number (PAN) Card',
      id: panNumber,
      category: 'Statutory Identity',
      status: 'Verified (Income Tax Dept)',
      verifiedOn: '01 Aug 2026',
      validity: 'Permanent',
      icon: BadgeCheck,
      iconColor: 'text-emerald-500',
    },
    {
      name: 'Goods & Services Tax Identification (GSTIN)',
      id: gstNumber,
      category: 'Indirect Tax',
      status: 'Active & In Good Standing',
      verifiedOn: '01 Sep 2026',
      validity: 'Active',
      icon: BadgeCheck,
      iconColor: 'text-emerald-500',
    },
    {
      name: 'Udyam Registration Certificate (MSME)',
      id: udyamNumber,
      category: 'Enterprise Classification',
      status: 'Class-I Micro Enterprise',
      verifiedOn: '12 Jul 2026',
      validity: 'Valid 2026-27',
      icon: Award,
      iconColor: 'text-blue-500',
    },
    {
      name: 'GFR 2017 Rule 144(xi) Land Border Declaration',
      id: 'LBD-2026-CONF-09',
      category: 'National Security Compliance',
      status: 'Certified & Signed',
      verifiedOn: '25 Aug 2026',
      validity: 'Tender Specific',
      icon: ShieldCheck,
      iconColor: 'text-purple-500',
    },
    {
      name: 'Public Procurement Preference (Make in India) Self-Declaration',
      id: 'MII-ANNEX-2026',
      category: 'Local Content Preference',
      status: 'Class-I Local Supplier (>50%)',
      verifiedOn: '28 Aug 2026',
      validity: 'Valid',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
  ];

  const handlePrecheck = (e) => {
    e.preventDefault();
    if (!precheckQuery.trim()) return;
    setIsAnalyzing(true);
    setPrecheckResult(null);

    setTimeout(() => {
      setIsAnalyzing(false);
      const q = precheckQuery.toLowerCase();
      if (q.includes('144') || q.includes('land border')) {
        setPrecheckResult({
          title: 'GFR Rule 144(xi) Land Border Check: PASSED',
          status: 'compliant',
          score: 100,
          summary:
            'Your entity is registered under Indian Company Law with 100% domestic beneficial ownership. No DPIIT registration required under Dept of Expenditure F.No.6/18/2019-PPD.',
          action: 'Self-declaration template attached automatically in your bid package.',
        });
      } else if (q.includes('mii') || q.includes('local content')) {
        setPrecheckResult({
          title: 'Make in India (PPP-MII 2017) Eligibility: Class-I Supplier (68%)',
          status: 'compliant',
          score: 95,
          summary:
            'Your reported local content exceeds the mandatory 50% threshold. You are entitled to 20% margin of purchase preference over non-local suppliers in L1 price matching.',
          action: 'Statutory declaration ready for download.',
        });
      } else {
        setPrecheckResult({
          title: `Pre-Submission Analysis for "${precheckQuery}"`,
          status: 'compliant',
          score: 92,
          summary:
            'All primary technical parameters comply with GeM SPV General Terms and Conditions (GTC). Digital Signature Certificate (Class 3) is verified and valid.',
          action: 'Ready for submission in active tenders.',
        });
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#071322] text-slate-800 dark:text-slate-100 font-sans pb-14">
      {/* 1. TOP BIDDER HERO HEADER */}
      <div className="bg-gradient-to-r from-[#073567] via-[#092C53] to-[#0A2540] text-white border-b border-blue-900/40">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Enterprise Info */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shrink-0">
                <Building2 className="w-7 h-7 text-blue-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                    {companyName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3" />
                    GeM Verified Bidder
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <Award className="w-3 h-3" />
                    MSME Class-I
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-blue-100/90 font-medium flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    Authorized Person: <strong className="text-white">{bidderName}</strong>
                  </span>
                  <span className="text-blue-300/40 hidden sm:inline">•</span>
                  <span>
                    Vendor ID: <code className="text-amber-300 font-mono">{vendorId}</code>
                  </span>
                  <span className="text-blue-300/40 hidden sm:inline">•</span>
                  <span>
                    GSTIN: <code className="text-blue-200 font-mono">{gstNumber}</code>
                  </span>
                </p>
              </div>
            </div>

            {/* Right: Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/tenders"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Explore Open Tenders</span>
              </Link>
              <Link
                to="/verification"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AI Bid Pre-Checker</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS SUMMARY STRIP */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Active Bids */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Bids
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                4
              </h3>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                2 Under Review • 1 Qualified
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Average Compliance */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Compliance Score
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                94.8%
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                Eligible for L1 Matching
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Action Required */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Clarifications Pending
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                1
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                Due in 2 days (Railways)
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: EMD Exemption Status */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                EMD Exemption
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                100%
              </h3>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                MSE Policy Benefit Active
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN PORTAL BODY & TABS */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bids'
                ? 'bg-[#073567] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>My Bids & Applications ({myBids.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-[#073567] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Compliance & Document Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'recommendations'
                ? 'bg-[#073567] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Matched Tenders ({mockTenders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('precheck')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'precheck'
                ? 'bg-[#073567] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>AI Bid Pre-Screening</span>
          </button>
        </div>

        {/* TAB 1: MY BIDS & APPLICATIONS */}
        {activeTab === 'bids' && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 dark:bg-blue-950/30 p-3.5 sm:p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/40">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#073567] dark:text-blue-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  All your submitted bids are automatically monitored against GFR 2017 & GeM compliance changes in real-time.
                </span>
              </div>
              <Link
                to="/tenders"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline shrink-0"
              >
                <span>Browse All Tenders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {myBids.map((bid, idx) => {
                const StatusIcon = bid.statusIcon;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Bid Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {bid.tenderId}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${bid.statusColor}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {bid.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            Applied on: <strong className="text-slate-600 dark:text-slate-300">{bid.appliedDate}</strong>
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                          {bid.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {bid.department}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                          <div>
                            <span className="text-slate-400">Your Quoted Bid: </span>
                            <strong className="text-slate-900 dark:text-white font-bold">
                              {bid.bidValue}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Compliance Rating: </span>
                            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {bid.complianceScore}% Compliant
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Current Milestone: </span>
                            <strong className="text-blue-600 dark:text-blue-400 font-medium">
                              {bid.nextMilestone}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                        {bid.missingDocs > 0 ? (
                          <button
                            onClick={() =>
                              alert(
                                `Upload clarification document for ${bid.tenderId}: Clause 4.2 DSC Verification certificate.`
                              )
                            }
                            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Respond to Clarification</span>
                          </button>
                        ) : null}

                        <Link
                          to={`/verification?tenderId=${bid.tenderId.replace('GEM/2026/B/', '').replace('GEM/2024/B/', '')}`}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>View AI Audit Report</span>
                        </Link>

                        <button
                          onClick={() =>
                            alert(
                              `Downloading verified GeM Bid Submission Acknowledgement for ${bid.tenderId}. Hash: sha256:4a8f9c1e...`
                            )
                          }
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                          title="Download Official Submission Receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Receipt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: COMPLIANCE & DOCUMENT VAULT */}
        {activeTab === 'vault' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Verified Regulatory Credentials
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Centralized repository for statutory certificates required across all Government of India tenders.
                  </p>
                </div>
                <button
                  onClick={() => alert('New document uploader: Select PDF/DSC certificate to upload.')}
                  className="px-4 py-2 rounded-xl bg-[#073567] hover:bg-[#05284f] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload New Document</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                {documentVault.map((doc, idx) => {
                  const DocIcon = doc.icon;
                  return (
                    <div
                      key={idx}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          <DocIcon className={`w-5 h-5 ${doc.iconColor}`} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {doc.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>
                              Identifier: <code className="font-mono text-slate-700 dark:text-slate-300 font-bold">{doc.id}</code>
                            </span>
                            <span>•</span>
                            <span>Category: {doc.category}</span>
                            <span>•</span>
                            <span>Verified: {doc.verifiedOn}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3 h-3 stroke-[3]" />
                          {doc.status}
                        </span>
                        <button
                          onClick={() => alert(`Previewing authenticated copy of: ${doc.name}`)}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Preview document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RECOMMENDED TENDERS */}
        {activeTab === 'recommendations' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Matched Tenders for Your Enterprise
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI-filtered opportunities based on your MSME sector, turnover, and Make in India local content percentage.
                </p>
              </div>
              <Link
                to="/tenders"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View all ({mockTenders.length})</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockTenders.slice(0, 4).map((tender) => (
                <div
                  key={tender.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                        {tender.referenceNo}
                      </span>
                      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Closes in {tender.daysLeft}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {tender.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {tender.ministry}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 text-[11px]">Est. Value:</span>
                        <p className="font-bold text-slate-800 dark:text-white">{tender.value}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Local Content Req:</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          {tender.minLocalContent}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <Link
                      to={`/verification?tenderId=${tender.id}`}
                      className="px-3.5 py-2 rounded-xl bg-[#073567] hover:bg-[#05284f] text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verify & Pre-Screen</span>
                    </Link>

                    <Link
                      to="/tenders"
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
                    >
                      Details & BOQ →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AI BID PRE-SCREENING */}
        {activeTab === 'precheck' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Autonomous Bid Pre-Screening Assistant
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify compliance with GFR Rule 144(xi), PPP-MII 2017, and GeM GTC before technical submission to avoid disqualification.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePrecheck} className="mt-4">
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <input
                    type="text"
                    value={precheckQuery}
                    onChange={(e) => setPrecheckQuery(e.target.value)}
                    placeholder="e.g. Check GFR Rule 144(xi) compliance for server procurement..."
                    className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={isAnalyzing || !precheckQuery.trim()}
                    className="px-5 py-3 rounded-xl bg-[#073567] hover:bg-[#05284f] text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing Regulations...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Run AI Pre-Check</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Quick checks:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPrecheckQuery('GFR 144(xi) Land Border Requirement');
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    Land Border 144(xi)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrecheckQuery('Make in India Class-I Local Content');
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    PPP-MII 2017 Local Content
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrecheckQuery('MSME EMD Exemption verification');
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    MSME EMD Exemption
                  </button>
                </div>
              </form>

              {precheckResult && (
                <div className="mt-5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{precheckResult.title}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                      Score: {precheckResult.score}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                    {precheckResult.summary}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/60 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Next Action: {precheckResult.action}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidderDashboard;
