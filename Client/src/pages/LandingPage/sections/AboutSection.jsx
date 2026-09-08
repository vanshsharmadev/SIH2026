import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Brain, BookOpen, BarChart3, Lock, ShieldCheck } from 'lucide-react';
import TricolorBar from '../../../components/common/TricolorBar';
import indiaGateImg from '../../../assets/india_gate.jpg';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    desc: 'Automatically checks eligibility, clauses and compliance.',
    iconBg: 'bg-violet-50 text-violet-700',
  },
  {
    icon: ShieldCheck,
    title: 'Policy & Guideline Mapping',
    desc: 'Aligned with latest GeM rules and government policies.',
    iconBg: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: BarChart3,
    title: 'Actionable Insights',
    desc: 'Clear reports with recommendations.',
    iconBg: 'bg-purple-50 text-purple-700',
  },
  {
    icon: Lock,
    title: 'Secure & Confidential',
    desc: 'Your data, our priority.',
    iconBg: 'bg-blue-50 text-blue-700',
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-12 sm:py-16 bg-[#f8fafc]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left: Text Description */}
          <div className="lg:col-span-5">
            <TricolorBar className="w-14 h-1 mb-3" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">
              About<br />
              <span className="text-[#0A2540]">GeM </span>
              <span className="text-[#0E9F6E]">Compliflix</span>
            </h2>
            <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed mb-6 font-medium">
              GeM Compliflix is an AI-powered platform designed to simplify
              government procurement by ensuring complete compliance with
              GeM tender documents, policies, and guidelines. Our platform
              empowers government officials and bidders with intelligent tools
              to analyze, verify, and manage compliance — making procurement
              faster, fairer, and more transparent.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/#how-it-works"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#073567] hover:bg-[#05284f] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => alert('Our Mission: To digitize and streamline government procurement compliance through AI-powered tools, ensuring transparency, fairness, and accountability for a Viksit Bharat.')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-700" />
                <span>Our Mission</span>
              </button>
            </div>
          </div>

          {/* Center: India Gate Image with Quote Card */}
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden shadow-xl group">
              {/* India Gate Background Photo */}
              <img
                src={indiaGateImg}
                alt="India Gate - Viksit Bharat"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Quote Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 text-center text-white z-10">
                <div className="bg-white/15 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-lg">
                  <p className="text-xs sm:text-sm font-serif italic font-bold leading-relaxed text-white drop-shadow-xs">
                    &ldquo;Enabling transparent and efficient procurement for a Viksit Bharat.&rdquo;
                  </p>
                  <p className="text-[10px] text-amber-300 font-semibold mt-2 tracking-wider uppercase">
                    Viksit Bharat @2047
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Feature List */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-5">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/80 transition-all group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${feature.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                      {feature.desc}
                    </p>
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

export default AboutSection;
