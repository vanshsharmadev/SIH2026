import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Store,
  Landmark,
  Award,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import rastrapatiBhawanImg from '../../../assets/rastrapati-bhawan.png';
import DigitalIndiaLogo from '../../../components/common/DigitalIndiaLogo';
import AtmanirbharLogo from '../../../components/common/AtmanirbharLogo';

const sampleScans = [
  {
    id: 'meity',
    title: 'MeitY Edge AI Servers',
    ref: 'GEM/2026/B/9401',
    dept: 'National Informatics Centre',
    score: 98,
    status: 'High Qualification Probability',
    statusColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    checks: [
      { rule: 'GFR 144(xi) Land Border Rule', status: 'Pass', detail: 'OEM Declaration Verified' },
      { rule: 'PPP-MII Local Content', status: 'Pass', detail: '62% (Threshold: 50%)' },
      { rule: 'MSE / Startup Exemption', status: 'Pass', detail: 'Valid Udyam Registration' },
      { rule: 'EMD Guarantee Clause', status: 'Valid', detail: 'Online Exemption Applied' },
    ],
  },
  {
    id: 'seci',
    title: 'SECI 50MW Rooftop Solar',
    ref: 'GEM/2026/B/9385',
    dept: 'Solar Energy Corp. of India',
    score: 94,
    status: 'Qualified with 1 Recommendation',
    statusColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    checks: [
      { rule: 'ALMM Solar PV Module Listing', status: 'Pass', detail: 'Tier-1 Certified OEM' },
      { rule: 'EPC 25MW Cumulative Past Work', status: 'Pass', detail: 'Audited Completion Slips' },
      { rule: 'Joint Venture Deed Format', status: 'Notice', detail: 'Notarized Stamp Required' },
      { rule: 'Reverse Auction Eligibility', status: 'Pass', detail: 'Financial Ratio Meets Criteria' },
    ],
  },
  {
    id: 'cris',
    title: 'CRIS AI CCTV Analytics',
    ref: 'GEM/2026/B/9210',
    dept: 'Ministry of Railways',
    score: 96,
    status: 'Ready for Immediate Submission',
    statusColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    checks: [
      { rule: 'RDSO Specification Spec-2024', status: 'Pass', detail: 'Class-A Hardware Compliance' },
      { rule: 'Cybersecurity STQC Certificate', status: 'Pass', detail: 'Valid until Nov 2027' },
      { rule: 'Annual Turnover Requirement', status: 'Pass', detail: 'CA Audited Balance Sheets' },
      { rule: 'Consortium Lead Agreement', status: 'Pass', detail: 'Form-VII Signed via DSC' },
    ],
  },
];

const stats = [
  {
    icon: FileText,
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    value: '₹18.4+ Lakh Cr',
    label: 'Cumulative GeM GMV',
    info: 'Total Gross Merchandise Value processed through GeM public procurement portal',
  },
  {
    icon: Users,
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    value: '1.5+ Lakh',
    label: 'Buyer Organisations',
    info: 'Verified Central, State, and PSU procurement authorities',
  },
  {
    icon: Store,
    iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
    value: '65+ Lakh',
    label: 'Registered Sellers',
    info: 'Micro, Small, Medium Enterprises and verified Indian OEM suppliers',
  },
  {
    icon: Landmark,
    iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400',
    value: '90+',
    label: 'Government Ministries',
    info: 'Departments leveraging automated GFR 2017 compliance scrutiny',
  },
  {
    icon: Award,
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    value: '99.4%',
    label: 'Compliance Accuracy',
    info: 'Measured accuracy across 12,000+ audited technical RFP parameters',
  },
];

const HeroSection = () => {
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const sample = sampleScans[activeSampleIndex];

  return (
    <section id="hero" className="relative w-full bg-[#f8fafc] dark:bg-[#121212] overflow-hidden select-none transition-colors duration-200">
      {/* 1. HERO BANNER CONTAINER */}
      <div className="relative w-full min-h-[560px] lg:min-h-[600px] flex items-center overflow-hidden">
        
        {/* Background Image: Rashtrapati Bhavan with refined scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src={rastrapatiBhawanImg}
            alt="Rashtrapati Bhavan - Government of India"
            className="w-full h-full object-cover object-[center_top] sm:object-[70%_top] lg:object-[center_35%] opacity-40 dark:opacity-20 transition-opacity"
          />

          {/* SVG Indian Tricolor Wave Banner */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
              className="absolute top-0 right-0 w-[85%] sm:w-[70%] lg:w-[60%] h-full opacity-70 dark:opacity-25"
              viewBox="0 0 1000 600"
              fill="none"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 150 -50 C 450 80, 650 40, 1050 -20 L 1050 120 C 650 180, 450 220, 150 90 Z"
                fill="url(#saffronWave)"
                opacity="0.88"
              />
              <path
                d="M 150 80 C 450 210, 650 170, 1050 110 L 1050 220 C 650 280, 450 320, 150 190 Z"
                fill="url(#whiteWave)"
                opacity="0.95"
              />
              <path
                d="M 150 180 C 450 310, 650 270, 1050 210 L 1050 330 C 650 390, 450 430, 150 300 Z"
                fill="url(#greenWave)"
                opacity="0.90"
              />

              <defs>
                <linearGradient id="saffronWave" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF9933" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#FF671F" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#E65100" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="whiteWave" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                  <stop offset="50%" stopColor="#F8FAFC" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="greenWave" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#138808" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#0B7C3E" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#046A38" stopOpacity="0.95" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Daylight Scrim Overlay (Day / Soft-Black Night) */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-300 bg-gradient-to-r from-[#f8fafc] via-[#f8fafc]/95 to-[#f8fafc]/40 dark:from-[#121212] dark:via-[#121212]/95 dark:to-[#121212]/50"
          />

          {/* Bottom fade blending to stats bar */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#f8fafc] dark:from-[#121212] to-transparent pointer-events-none" />
        </div>

        {/* Hero Foreground Content: Split Layout */}
        <div className="relative z-10 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            
            {/* Left Column: Headings, Value Proposition & Action Triggers */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              
              {/* Official Innovation Badge */}
              <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/70 text-blue-800 dark:text-blue-300 text-xs font-semibold w-fit mb-4 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>GeM Ecosystem AI Compliance Engine</span>
                <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 hidden sm:inline">GFR 2017 &bull; SIH 2026</span>
              </div>

              {/* Catchy Commanding Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-[#0A2540] dark:text-white mb-4">
                Smarter Procurement.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#073567] via-[#0284c7] to-[#059669] dark:from-[#4da3ff] dark:via-[#38bdf8] dark:to-[#38d39f]">
                  Zero Disqualification.
                </span><br />
                A <span className="text-[#FF671F]">Stronger</span>{' '}
                <span className="text-[#046A38] dark:text-[#38d39f]">India.</span>
              </h1>

              {/* Subtext Paragraph */}
              <p className="text-xs sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-6 sm:mb-7 max-w-xl">
                Empower your GeM procurement with instant AI verification. Automatically dissect complex tender clauses, verify Land Border GFR 144(xi) compliance, ensure Make-in-India quotas, and submit bids with zero technical errors.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 mb-8">
                <Link
                  to="/tenders"
                  id="hero-explore-tenders-btn"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#073567] hover:bg-[#05284f] dark:bg-[#4da3ff] dark:hover:bg-[#3b82f6] text-white dark:text-slate-950 text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer w-full sm:w-auto text-center"
                >
                  <span>Explore Active Tenders</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>

                <Link
                  to="/tenders"
                  id="hero-ai-precheck-btn"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white/95 hover:bg-white dark:bg-[#181818] dark:hover:bg-[#202020] text-[#073567] dark:text-[#4da3ff] text-sm font-bold rounded-xl border border-slate-300 dark:border-[#343434] shadow-2xs hover:shadow-xs transition-all cursor-pointer w-full sm:w-auto text-center"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Explore Procurement Portal</span>
                </Link>
              </div>

              {/* National Initiatives Badges */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 border-t border-slate-200/80 dark:border-[#282828]">
                <div className="bg-white/90 dark:bg-[#181818] backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#303030] flex items-center gap-2 shadow-2xs">
                  <DigitalIndiaLogo imgClassName="h-6 w-auto" />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Digital India Initiative</span>
                </div>
                <div className="bg-white/90 dark:bg-[#181818] backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#303030] flex items-center gap-2 shadow-2xs">
                  <AtmanirbharLogo imgClassName="h-6 w-auto" />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Atmanirbhar Bharat Aligned</span>
                </div>
              </div>

            </div>

            {/* Right Column: Live Interactive AI Compliance Scanner Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                
                {/* Scanner Widget Header - Balanced contrast */}
                <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-slate-800 dark:text-slate-200 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Live AI Compliance Preview</span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Interactive</span>
                </div>

                {/* Sample Tender Selector Tabs */}
                <div className="p-3 bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200/80 dark:border-[#282828] flex items-center gap-1.5 overflow-x-auto">
                  {sampleScans.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSampleIndex(idx)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        activeSampleIndex === idx
                          ? 'bg-white dark:bg-[#242424] text-[#073567] dark:text-[#4da3ff] shadow-2xs border border-slate-200 dark:border-[#383838]'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>

                {/* Simulated Scan Details */}
                <div className="p-4 sm:p-5">
                  {/* Tender Meta */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">{sample.ref}</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5" role="heading" aria-level="2">{sample.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{sample.dept}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{sample.score}%</div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Readiness</span>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold mb-4 border flex items-center gap-1.5 ${sample.statusColor}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{sample.status}</span>
                  </div>

                  {/* Key Compliance Checklist */}
                  <div className="space-y-2 mb-4">
                    {sample.checks.map((chk, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#202020] border border-slate-100 dark:border-[#2c2c2c] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {chk.status === 'Pass' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{chk.rule}</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0 ml-2">{chk.detail}</span>
                      </div>
                    ))}
                  </div>

                  {/* Scanner CTA */}
                  <Link
                    to="/tenders"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-[#073567] dark:text-[#4da3ff] font-bold text-xs border border-blue-200/80 dark:border-blue-800/60 transition-colors"
                  >
                    <span>Test Your Own GeM Bid Documents</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. STATS BAR (Directly below Hero) */}
      <div className="w-full bg-white dark:bg-[#181818] border-y border-slate-200/90 dark:border-[#303030] shadow-2xs transition-colors">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-0 lg:divide-x lg:divide-slate-200 dark:lg:divide-[#303030]">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-2 lg:px-4 group cursor-default last:col-span-2 sm:last:col-span-1 lg:last:col-span-1"
                  title={stat.info}
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                      {stat.value}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      <span className="truncate">{stat.label}</span>
                      <Info className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0 inline-block group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
