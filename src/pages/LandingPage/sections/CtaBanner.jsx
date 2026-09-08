import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CtaBanner = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#071D37] via-[#092C53] to-[#0B3C73] py-12 sm:py-16 select-none">
      {/* Subtle Monument / Architectural Silhouette Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-end">
        <svg
          viewBox="0 0 1200 180"
          className="w-full h-auto text-white fill-current"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized Delhi Monuments Silhouette: India Gate, Domes, Pillars */}
          <path d="M0,180 L0,140 L60,140 L70,110 L100,110 L110,140 L160,140 L170,80 L200,80 L210,140 L280,140 L300,60 L330,40 L360,60 L380,140 L450,140 L460,90 L490,90 L500,140 L580,140 L600,30 L630,10 L660,30 L680,140 L760,140 L780,70 L820,70 L840,140 L920,140 L940,50 L970,30 L1000,50 L1020,140 L1100,140 L1120,90 L1160,90 L1180,140 L1200,140 L1200,180 Z" />
        </svg>
      </div>

      {/* Tricolor Swoosh at bottom border */}
      <div className="absolute bottom-0 inset-x-0 h-1.5 flex">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
            Be a Part of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-emerald-300">
              Transparent Procurement
            </span>
          </h2>
          <p className="text-sm sm:text-base text-blue-100/90 font-medium max-w-xl">
            Join thousands of government officers and businesses in building a compliant and prosperous India.
          </p>
        </div>

        <Link
          to="/signup"
          className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 bg-white hover:bg-blue-50 text-[#071D37] text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.99] shrink-0"
        >
          <span>Get Started Now</span>
          <ArrowRight className="w-4 h-4 text-[#071D37]" />
        </Link>
      </div>
    </section>
  );
};

export default CtaBanner;
