import React from 'react';
import { Landmark, Clock, ShieldCheck, Award, Zap, CheckCircle2, TrendingUp, Lock } from 'lucide-react';

const pillars = [
  {
    icon: Clock,
    metric: '70% Faster',
    title: 'Rapid Bid Preparation',
    desc: 'Compress technical RFP dissection and eligibility verification from 4 days into under 8 minutes.',
    benefit: 'Save over 30 hours per bid submission.',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-[#4da3ff]',
  },
  {
    icon: ShieldCheck,
    metric: '0% Disqualifications',
    title: 'Zero Technical Rejection',
    desc: 'Never forfeit your Earnest Money Deposit (EMD) or get rejected over clerical omissions and expired certificates.',
    benefit: 'Pre-flight check catches 100% of formatting flaws.',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#38d39f]',
  },
  {
    icon: Landmark,
    metric: '100% GFR Aligned',
    title: 'Statutory Government Compliance',
    desc: 'Audited against GFR 2017 Rules 144(xi), 153, 161, CVC guidelines, and Public Procurement (Preference to Make in India) Orders.',
    benefit: 'Zero ambiguity during audit scrutiny.',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
  },
  {
    icon: Award,
    metric: 'Atmanirbhar Ready',
    title: 'Promoting Indigenous Enterprise',
    desc: 'Automatically calculates and certifies local content percentages, ensuring MSMEs and startups get statutory exemptions.',
    benefit: 'Maximizes Make-In-India preference scores.',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
  },
];

const WhyChoose = () => {
  return (
    <section id="why-choose" className="py-14 sm:py-20 bg-white dark:bg-[#121212] select-none transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header - Left-aligned to match design system */}
        <div className="max-w-2xl mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Proven Procurement Advantage</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Why Choose GeM Compliflix?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-2">
            Engineered specifically for India's public procurement ecosystem, delivering measurable accuracy, transparency, and speed.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-[#f8fafc] dark:bg-[#181818] rounded-2xl border border-slate-200/90 dark:border-[#303030] p-6 hover:shadow-lg hover:border-blue-400 dark:hover:border-[#4da3ff] transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  {/* Top: Icon & Big Metric */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${pillar.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-md bg-white dark:bg-[#222222] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white shadow-2xs">
                      {pillar.metric}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-[#4da3ff] transition-colors leading-snug">
                    {pillar.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-4">
                    {pillar.desc}
                  </p>
                </div>

                {/* Sub Benefit Tag */}
                <div className="pt-3 border-t border-slate-200/70 dark:border-[#282828] flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{pillar.benefit}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Security Reassurance Strip */}
        <div className="mt-10 p-4 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200/80 dark:border-[#2a2a2a] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-700 dark:text-slate-300 font-semibold">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-[#4da3ff] shrink-0" />
              <span>Bank-Grade 256-bit AES Encryption</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
            <span>Zero Data Sharing with Third Parties</span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
            <span>Local India MeitY-Empaneled Cloud Hosting</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/70 dark:border-[#282828]">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>99.9% Uptime SLA for Tender Deadlines</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhyChoose;
