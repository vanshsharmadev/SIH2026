import React, { useState } from 'react';
import {
  UploadCloud,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileCheck2,
  Users,
  Building,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const workflows = {
  bidder: [
    {
      num: '01',
      icon: UploadCloud,
      title: 'Upload RFP & Bid Files',
      desc: 'Ingest GeM tender documents and your company credentials (PDF, DOCX, DSC certificates).',
      detail: 'Multi-document ingestion with automated table of contents and BOQ extraction.',
      badge: 'Step 1: Ingestion',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
    },
    {
      num: '02',
      icon: Cpu,
      title: 'AI Clause Dissection',
      desc: 'Our engine extracts technical criteria, GFR 144(xi) Land Border rules, and PPP-MII ratios.',
      detail: 'Deep cross-referencing against DoE procurement manuals and GeM 4.0 guidelines.',
      badge: 'Step 2: Analysis',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    },
    {
      num: '03',
      icon: ShieldAlert,
      title: 'Disqualification Risk Alert',
      desc: 'Detects missing annexures, turnover shortfalls, and anti-competitive OEM lock-in clauses.',
      detail: 'Receive immediate recommendations and auto-drafted clarification notices before bid close.',
      badge: 'Step 3: Defect Shield',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    },
    {
      num: '04',
      icon: CheckCircle2,
      title: 'Certified Bid Dossier',
      desc: 'Export an audit-ready compliance package validated for one-click upload to the GeM portal.',
      detail: 'Includes cryptographic timestamp, self-declaration annexures, and eligibility checklist.',
      badge: 'Step 4: Submission',
      badgeColor: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300',
    },
  ],
  buyer: [
    {
      num: '01',
      icon: FileCheck2,
      title: 'Publish Tender RFP Draft',
      desc: 'Import draft tender documents before publishing on GeM to audit for fair competition.',
      detail: 'Verifies CVC guidelines and ensures non-restrictive technical specifications.',
      badge: 'Step 1: Drafting',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
    },
    {
      num: '02',
      icon: Cpu,
      title: 'Automate Bid Scrutiny',
      desc: 'Batch-evaluate multiple bidder submissions in minutes instead of weeks of manual paper review.',
      detail: 'Instant automated qualification matrix for Technical Evaluation Committees (TEC).',
      badge: 'Step 2: Scrutiny',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    },
    {
      num: '03',
      icon: ShieldAlert,
      title: 'Flag Land Border & Collusion',
      desc: 'AI cross-verifies beneficial ownership, GFR 144(xi) compliance, and cartel-like bidding patterns.',
      detail: 'Automated entity resolution across MCA-21, GeM blacklist, and GSTN records.',
      badge: 'Step 3: Oversight',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    },
    {
      num: '04',
      icon: CheckCircle2,
      title: 'One-Click Comparative Statement',
      desc: 'Generate transparent, CAG-ready comparative evaluation sheets and audit trails.',
      detail: 'Export official TEC scrutiny reports with full cryptographic evidence logs.',
      badge: 'Step 4: Finalization',
      badgeColor: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300',
    },
  ],
};

const HowItWorks = () => {
  const [role, setRole] = useState('bidder');
  const steps = workflows[role];

  return (
    <section id="how-it-works" className="py-14 sm:py-20 bg-slate-50 dark:bg-[#151515] select-none transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-[#4da3ff] uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Intelligent Procurement Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              How GeM Compliflix Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1 max-w-xl">
              From raw tender specifications to a fully verified, zero-defect submission dossier in four streamlined steps.
            </p>
          </div>

          {/* Persona Toggle */}
          <div className="w-full sm:w-auto p-1 rounded-xl bg-slate-200/80 dark:bg-[#202020] border border-slate-300/80 dark:border-[#343434] grid grid-cols-2 sm:flex sm:items-center shrink-0">
            <button
              type="button"
              onClick={() => setRole('bidder')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                role === 'bidder'
                  ? 'bg-white dark:bg-[#2c2c2c] text-[#073567] dark:text-[#4da3ff] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">For Bidders & Vendors</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                role === 'buyer'
                  ? 'bg-white dark:bg-[#2c2c2c] text-[#073567] dark:text-[#4da3ff] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">For Procurement Officers</span>
            </button>
          </div>
        </div>

        {/* 4 Process Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200/90 dark:border-[#303030] p-6 hover:shadow-lg hover:border-blue-400 dark:hover:border-[#4da3ff] transition-all duration-200 flex flex-col justify-between group"
              >
                {/* Step Top Bar: Badge & Number */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${step.badgeColor}`}>
                      {step.badge}
                    </span>
                    <span className="font-mono text-2xl font-black text-slate-300 dark:text-[#383838] group-hover:text-blue-600 dark:group-hover:text-[#4da3ff] transition-colors">
                      {step.num}
                    </span>
                  </div>

                  {/* Step Icon */}
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#242424] text-[#073567] dark:text-[#4da3ff] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-3">
                    {step.desc}
                  </p>
                </div>

                {/* Sub-detail footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#282828] text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {step.detail}
                </div>
              </div>
            );
          })}
        </div>

        {/* Process Action CTA */}
        <div className="mt-10 flex items-center justify-center">
          <Link
            to={role === 'bidder' ? '/tenders' : '/dashboard'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#073567] hover:bg-[#05284f] dark:bg-[#4da3ff] dark:hover:bg-[#3b82f6] text-white dark:text-slate-950 font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.01]"
          >
            <span>{role === 'bidder' ? 'Explore Opportunities & Submit Bids' : 'Open Buyer Evaluation Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
