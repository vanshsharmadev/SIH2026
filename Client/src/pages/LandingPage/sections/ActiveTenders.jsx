import React, { useState } from 'react';
import { ArrowRight, MapPin, Calendar, Tag, ShieldCheck, Sparkles, Building2, ExternalLink, Check, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockTenders } from '../../../data/mockTenders';

const categories = [
  'All Sectors',
  'Computers & IT',
  'Renewable Energy',
  'Railways & Transport',
  'Urban Infrastructure',
];

const ActiveTenders = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Sectors');
  const [copiedRef, setCopiedRef] = useState(null);

  const filteredTenders = (mockTenders || []).filter((t) => {
    if (selectedCategory === 'All Sectors') return true;
    if (selectedCategory === 'Computers & IT') return t.category.toLowerCase().includes('it') || t.category.toLowerCase().includes('computer');
    if (selectedCategory === 'Renewable Energy') return t.category.toLowerCase().includes('solar') || t.category.toLowerCase().includes('renewable');
    if (selectedCategory === 'Railways & Transport') return t.ministry.toLowerCase().includes('railways') || t.title.toLowerCase().includes('railway');
    if (selectedCategory === 'Urban Infrastructure') return t.ministry.toLowerCase().includes('housing') || t.title.toLowerCase().includes('waste');
    return true;
  }).slice(0, 4);

  const handleCopy = (ref) => {
    navigator.clipboard?.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <section id="tenders" className="py-12 sm:py-16 bg-white dark:bg-[#121212] border-b border-slate-200/80 dark:border-[#282828] select-none transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-[#4da3ff] uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Public Procurement</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              High-Priority GeM Opportunities
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-2xl">
              Discover verified central ministry and state public bids pre-audited for GFR 2017 rules, local content requirements, and MSME benefits.
            </p>
          </div>

          <Link
            to="/tenders"
            id="view-all-tenders-top"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#073567] dark:text-[#4da3ff] hover:text-blue-700 dark:hover:text-[#76b8ff] transition shrink-0"
          >
            <span>Explore All Tenders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Sector Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#073567] text-white dark:bg-[#4da3ff] dark:text-slate-950 shadow-2xs'
                  : 'bg-slate-100 dark:bg-[#1e1e1e] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#282828]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tender Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredTenders.map((tender) => (
            <div
              key={tender.id}
              className="border border-slate-200/90 dark:border-[#343434] rounded-2xl p-5 bg-[#ffffff] dark:bg-[#181818] hover:shadow-xl hover:border-blue-400 dark:hover:border-[#4da3ff] transition-all duration-200 group flex flex-col justify-between"
            >
              {/* Top Details */}
              <div>
                {/* Status & Countdown */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {tender.status}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Ends in <strong className="text-slate-800 dark:text-slate-200">{tender.daysLeft}</strong>
                  </span>
                </div>

                {/* Ref No & Copy trigger */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-[#4da3ff]">
                    {tender.referenceNo}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(tender.referenceNo)}
                    title="Copy Bid Number"
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5"
                  >
                    {copiedRef === tender.referenceNo ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Tender Title */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-blue-700 dark:group-hover:text-[#4da3ff] transition-colors line-clamp-2">
                  {tender.title}
                </h3>

                {/* Ministry & Meta */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                  <div className="flex items-start gap-1.5">
                    <Building2 className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                    <span className="truncate">{tender.department || tender.ministry}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Closing: {tender.closes}</span>
                  </div>
                </div>

                {/* Compliance Scrutiny & Local Content Badge */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-100 dark:border-blue-900/50">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{tender.complianceScore || 95}% Match</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#222222] text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                    {tender.minLocalContent?.split('(')[0] || 'Make In India'}
                  </span>
                </div>
              </div>

              {/* Bottom: Tender Value & Actions */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-[#282828] mt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Est. Value</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{tender.value}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/tenders"
                    className="text-center py-2 px-2.5 rounded-lg border border-slate-200 dark:border-[#343434] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#242424] transition"
                  >
                    View Details
                  </Link>
                  <Link
                    to="/verification"
                    className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg bg-[#073567] hover:bg-[#05284f] dark:bg-[#4da3ff] dark:hover:bg-[#3b82f6] text-white dark:text-slate-950 text-xs font-bold transition shadow-2xs"
                  >
                    <span>Pre-Check</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Bottom Banner with Quick Link */}
        <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200/80 dark:border-[#2e2e2e] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Looking for specific Ministry or State RFP requirements?
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Search through active tenders by CPV code, EMD exemption status, and annual turnover clauses.
              </p>
            </div>
          </div>
          <Link
            to="/tenders"
            className="px-4 py-2 rounded-lg bg-white dark:bg-[#222222] border border-slate-200 dark:border-[#383838] text-xs font-bold text-[#073567] dark:text-[#4da3ff] hover:bg-slate-50 dark:hover:bg-[#282828] transition shrink-0"
          >
            Launch Tender Search Engine
          </Link>
        </div>

      </div>
    </section>
  );
};

export default ActiveTenders;
