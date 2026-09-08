import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  FileText,
  Users,
  Store,
  Landmark,
  Leaf,
  Info,
} from 'lucide-react';
import rastrapatiBhawanImg from '../../../assets/rastrapati-bhawan.png';
import DigitalIndiaLogo from '../../../components/common/DigitalIndiaLogo';

const stats = [
  {
    icon: FileText,
    iconBg: 'bg-emerald-50 text-emerald-600',
    value: '18.4+ Lakh Crore',
    label: 'Total GeM GMV (Cumulative)',
    info: 'Cumulative Gross Merchandise Value processed through GeM portal',
  },
  {
    icon: Users,
    iconBg: 'bg-blue-50 text-blue-600',
    value: '1.5+ Lakh',
    label: 'Buyer Organisations',
    info: 'Verified government entities registered on GeM',
  },
  {
    icon: Store,
    iconBg: 'bg-indigo-50 text-indigo-600',
    value: '65+ Lakh',
    label: 'Sellers on GeM',
    info: 'Micro, Small, and Medium Enterprises and vendors across India',
  },
  {
    icon: Landmark,
    iconBg: 'bg-teal-50 text-teal-600',
    value: '90+',
    label: 'Government Departments',
    info: 'Central ministries and state departments leveraging AI compliance',
  },
  {
    icon: Leaf,
    iconBg: 'bg-emerald-50 text-emerald-600',
    value: '100%',
    label: 'Towards Transparent India',
    info: 'Commitment to zero bias and transparent public procurement',
  },
];

const HeroSection = () => {
  return (
    <section id="hero" className="relative w-full bg-[#f8fafc] overflow-hidden select-none">
      {/* 1. HERO BANNER CONTAINER */}
      <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex items-center overflow-hidden">
        
        {/* Background Image: Rashtrapati Bhavan & Sky */}
        <div className="absolute inset-0 z-0">
          <img
            src={rastrapatiBhawanImg}
            alt="Rashtrapati Bhavan - Government of India"
            className="w-full h-full object-cover object-[center_top] sm:object-[70%_top] lg:object-[center_35%]"
          />

          {/* SVG Indian Tricolor Wave Banner */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
              className="absolute top-0 right-0 w-[85%] sm:w-[70%] lg:w-[60%] h-full opacity-90"
              viewBox="0 0 1000 600"
              fill="none"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Saffron Ribbon Band */}
              <path
                d="M 150 -50 C 450 80, 650 40, 1050 -20 L 1050 120 C 650 180, 450 220, 150 90 Z"
                fill="url(#saffronWave)"
                opacity="0.88"
              />
              {/* White Ribbon Band */}
              <path
                d="M 150 80 C 450 210, 650 170, 1050 110 L 1050 220 C 650 280, 450 320, 150 190 Z"
                fill="url(#whiteWave)"
                opacity="0.95"
              />
              {/* Green Ribbon Band */}
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

          {/* Left-to-Right Daylight Gradient Overlay (Ensures text readability on left while showing building on right) */}
          <div
            className="hero-daylight-scrim absolute inset-0 pointer-events-none transition-all duration-300"
            style={{
              background:
                'linear-gradient(90deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 32%, rgba(255, 255, 255, 0.82) 46%, rgba(255, 255, 255, 0.25) 65%, rgba(255, 255, 255, 0.02) 85%, transparent 100%)',
            }}
          />

          {/* Subtle bottom fade to blend with stats bar */}
          <div className="hero-bottom-fade absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white/70 to-transparent pointer-events-none transition-all duration-300" />
        </div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col justify-between h-full">
          
          {/* Top Right Quote: “Technology for Transparent Governance” */}
          <div className="flex justify-end w-full mb-4 sm:mb-2">
            <div className="text-right">
              <p className="font-serif italic text-sm sm:text-base md:text-[17px] font-bold text-[#1e3a5f] leading-snug drop-shadow-2xs">
                &ldquo;Technology for<br className="sm:hidden" /> Transparent Governance&rdquo;
              </p>
              <p className="text-[11px] sm:text-xs font-semibold text-[#3b5998] mt-0.5">
                &mdash; Government of India
              </p>
            </div>
          </div>

          {/* Left Hero Content Box */}
          <div className="max-w-2xl mt-2 sm:mt-4">
            {/* Main Catchy Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-black tracking-tight leading-[1.12] text-[#0A2540] mb-4">
              Smarter Procurement.<br />
              Transparent Governance.<br />
              A <span className="text-[#FF671F]">Stronger</span>{' '}
              <span className="text-[#046A38]">India.</span>
            </h1>

            {/* Subtext Paragraph */}
            <p className="text-sm sm:text-[15px] md:text-base text-slate-700 leading-relaxed font-medium mb-7 max-w-xl">
              An AI-powered platform to analyze, verify, and ensure compliance
              with GeM tender documents — faster, smarter, and more transparent.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-2">
              <Link
                to="/tenders"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#073567] hover:bg-[#05284f] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>Explore Tenders</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => alert('GeM Compliflix Walkthrough Video Demo is loading...')}
                className="inline-flex items-center gap-2.5 px-5 py-3 bg-white/95 hover:bg-white text-[#073567] text-sm font-semibold rounded-lg border-2 border-[#073567] shadow-2xs hover:shadow-xs transition-all hover:bg-blue-50/50 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#073567]/10 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-[#073567] text-[#073567] translate-x-0.5" />
                </div>
                <span>Watch Video (2 min)</span>
              </button>
            </div>
          </div>

          {/* Bottom Right: National Initiatives Badges */}
          <div className="flex justify-end w-full mt-6 sm:mt-4">
            <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-3.5 sm:px-4 py-2 rounded-xl shadow-md border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all flex items-center gap-3 sm:gap-4">
              <DigitalIndiaLogo imgClassName="h-7 sm:h-15 w-auto" />
            </div>
          </div>

        </div>
      </div>

      {/* 2. STATS BAR (Directly below Hero) */}
      <div className="w-full bg-white border-y border-slate-200/90 shadow-2xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-0 lg:divide-x lg:divide-slate-200">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-2 lg:px-4 group cursor-default"
                  title={stat.info}
                >
                  {/* Icon in Rounded Badge */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
                  </div>

                  {/* Text Details */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      {stat.value}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
                      <span className="truncate">{stat.label}</span>
                      <Info className="w-3 h-3 text-slate-400 shrink-0 inline-block hover:text-blue-600" />
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
