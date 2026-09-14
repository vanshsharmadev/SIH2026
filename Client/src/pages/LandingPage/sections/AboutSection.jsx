import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Brain, ShieldCheck, BarChart3, Lock, X, CheckCircle2, Sparkles, Building } from 'lucide-react';
import TricolorBar from '../../../components/common/TricolorBar';
import indiaGateImg from '../../../assets/india_gate.jpg';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Clause Extraction',
    desc: 'Automates discovery of eligibility hurdles, OEM turnover mandates, and hidden penalty terms.',
    iconBg: 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400',
  },
  {
    icon: ShieldCheck,
    title: 'Statutory Policy Mapping',
    desc: 'Dynamic alignment with latest GFR 2017 amendments, DoE OM mandates, and GeM 4.0 terms.',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-[#38d39f]',
  },
  {
    icon: BarChart3,
    title: 'Actionable Readiness Insights',
    desc: 'Clear, prioritized remediation reports that guide bidders exactly what documents to attach.',
    iconBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-[#4da3ff]',
  },
  {
    icon: Lock,
    title: 'Cryptographic Privacy & Vaulting',
    desc: 'Your proprietary financial data and technical IP remain client-side encrypted and tamper-proof.',
    iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400',
  },
];

const AboutSection = () => {
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);

  return (
    <section id="about" className="py-14 sm:py-20 bg-slate-50 dark:bg-[#151515] select-none transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

          {/* Left: Text Description */}
          <div className="lg:col-span-5">
            <TricolorBar className="w-16 h-1 mb-4" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              About<br />
              <span className="text-[#073567] dark:text-[#4da3ff]">GeM </span>
              <span className="text-[#059669] dark:text-[#38d39f]">Compliflix</span>
            </h2>
            <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed mb-6 font-medium">
              GeM Compliflix is an AI-powered national procurement intelligence platform built to eliminate tender ambiguity, reduce bid disqualifications, and guarantee transparent governance across India’s public procurement landscape.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8 font-medium">
              Whether you are an MSME navigating complex technical conditions or a Government Procurement Officer managing evaluation committees, Compliflix provides automated clarity, GFR compliance, and verified trust.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                to="/#how-it-works"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#073567] hover:bg-[#05284f] dark:bg-[#4da3ff] dark:hover:bg-[#3b82f6] text-white dark:text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all"
              >
                <span>How It Works</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => setIsMissionModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#202020] hover:bg-slate-100 dark:hover:bg-[#282828] border border-slate-300 dark:border-[#343434] text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Our National Mission</span>
              </button>
            </div>
          </div>

          {/* Center: India Gate Monument Card with Soft Scrim */}
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-[#303030] group">
              <img
                src={indiaGateImg}
                alt="India Gate - Viksit Bharat"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-5 text-center text-white z-10">
                <div className="bg-white/15 dark:bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-lg">
                  <p className="text-xs sm:text-sm font-serif italic font-bold leading-relaxed text-white drop-shadow-xs">
                    &ldquo;Enabling transparent, fair, and accessible procurement for a Viksit Bharat.&rdquo;
                  </p>
                  <p className="text-[10px] text-amber-300 font-semibold mt-2 tracking-wider uppercase">
                    Viksit Bharat @2047
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: 4 Features Column */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/70 dark:bg-[#181818]/70 hover:bg-white dark:hover:bg-[#202020] border border-slate-200/70 dark:border-[#2a2a2a] hover:border-blue-300 dark:hover:border-[#4da3ff] hover:shadow-md transition-all duration-200 group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${feature.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-[#4da3ff] transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Accessible Mission Modal Dialog */}
      {isMissionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsMissionModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-[#343434] shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-[#282828]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Our National Mission & Mandate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMissionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#282828] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <p>
                Under the <strong>Smart India Hackathon 2026</strong> initiative and aligning with <strong>Viksit Bharat @2047</strong>, GeM Compliflix bridges the gap between complex government procurement manuals and daily enterprise execution.
              </p>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 space-y-2">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                  Core Architectural Commitments:
                </h4>
                <ul className="space-y-1.5 text-xs text-blue-800 dark:text-blue-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span><strong>100% GFR 2017 Fidelity</strong>: Strict algorithmic compliance with Rules 144(xi), 153, 161.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span><strong>Zero Bias & Collusion Shield</strong>: Objective evaluation without preferential supplier bias.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span><strong>Empowering MSMEs</strong>: Equal opportunity for regional vendors through automated eligibility guidance.</span>
                  </li>
                </ul>
              </div>

              <p>
                By digitizing and democratizing technical scrutiny, we save thousands of taxpayer hours and ensure public funds are spent with maximum transparency, value, and integrity.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#282828] flex justify-end">
              <button
                type="button"
                onClick={() => setIsMissionModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#073567] dark:bg-[#4da3ff] text-white dark:text-slate-950 text-xs font-bold hover:bg-[#05284f] dark:hover:bg-[#3b82f6] transition"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AboutSection;
