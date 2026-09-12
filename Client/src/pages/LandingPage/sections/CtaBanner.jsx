import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Building2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const CtaBanner = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#071D37] via-[#092C53] to-[#0B3C73] dark:from-[#0d1b2a] dark:via-[#14213d] dark:to-[#1b263b] py-14 sm:py-20 select-none">
      
      {/* Subtle Architectural Silhouette Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-end">
        <svg
          viewBox="0 0 1200 180"
          className="w-full h-auto text-white fill-current"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,180 L0,140 L60,140 L70,110 L100,110 L110,140 L160,140 L170,80 L200,80 L210,140 L280,140 L300,60 L330,40 L360,60 L380,140 L450,140 L460,90 L490,90 L500,140 L580,140 L600,30 L630,10 L660,30 L680,140 L760,140 L780,70 L820,70 L840,140 L920,140 L940,50 L970,30 L1000,50 L1020,140 L1100,140 L1120,90 L1160,90 L1180,140 L1200,140 L1200,180 Z" />
        </svg>
      </div>

      {/* Tricolor Ribbon at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-1.5 flex">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10">
          
          {/* Left Text */}
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-3 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Transforming Public Procurement in India</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black text-white tracking-tight leading-tight mb-3">
              Be a Part of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-emerald-300">
                Transparent Procurement
              </span>
            </h2>
            <p className="text-sm sm:text-base text-blue-100/90 font-medium leading-relaxed">
              Join thousands of government procurement officers, committee members, and Indian MSME enterprises in securing compliant, zero-defect public bids for a Viksit Bharat.
            </p>

            {/* Compliance Trust Note */}
            <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-blue-200/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>GFR 2017 & PPP-MII Ready</span>
              </span>
              <span>&bull;</span>
              <span>256-bit Encrypted</span>
              <span>&bull;</span>
              <span>GeM 4.0 Ecosystem Aligned</span>
            </div>
          </div>

          {/* Right Action Funnels */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto shrink-0">
            <Link
              to="/signup"
              id="cta-register-bidder"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 bg-white hover:bg-slate-100 text-[#071D37] text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.99]"
            >
              <UserPlus className="w-4 h-4 text-[#073567]" />
              <span>Register as Bidder</span>
              <ArrowRight className="w-4 h-4 text-[#073567]" />
            </Link>

            <Link
              to="/login"
              id="cta-officer-login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white text-sm sm:text-base font-bold rounded-xl border border-white/20 shadow-sm transition-all"
            >
              <Building2 className="w-4 h-4 text-blue-300" />
              <span>Govt Officer Portal</span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
