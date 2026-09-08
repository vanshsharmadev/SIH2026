import React from 'react';
import { ArrowRight, MapPin, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import mockTenders from '../../../data/mockTenders';

const tenders = mockTenders.slice(0, 4);


const ActiveTenders = () => {
  return (
    <section id="tenders" className="py-10 sm:py-14 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 select-none">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified GeM Opportunities</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Active Government Tenders
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Latest public procurement bids with AI-powered compliance analysis & policy checking
            </p>
          </div>
          <Link
            to="/tenders"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#073567] dark:text-blue-400 hover:text-blue-700 transition"
          >
            <span>Explore All Tenders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tender Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {tenders.map((tender, idx) => (
            <div
              key={idx}
              className="border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900/90 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all group flex flex-col justify-between"
            >
              {/* Top: Status & Days Left */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs ${tender.statusBg}`}
                  >
                    {tender.status}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Ends in {tender.daysLeft}
                  </span>
                </div>

                {/* Ref No Badge */}
                <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-1">
                  {tender.referenceNo}
                </span>

                {/* Tender Title */}
                <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-[#073567] dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {tender.title}
                </h3>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                    <span className="truncate">{tender.ministry}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Closes: {tender.closes}</span>
                  </div>
                </div>
              </div>

              {/* Bottom: Tag, Price, and View Details */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                    <Tag className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span className="truncate">{tender.category}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {tender.value}
                  </span>
                </div>

                <Link
                  to="/tenders"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#073567] dark:text-blue-400 hover:text-blue-700 transition group-hover:translate-x-0.5"
                >
                  <span>View Full Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="sm:hidden mt-5 text-center">
          <Link
            to="/tenders"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#073567] dark:text-blue-400"
          >
            <span>Explore All 10 Tenders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ActiveTenders;
