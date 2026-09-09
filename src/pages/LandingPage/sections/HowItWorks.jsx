import React from 'react';
import { UploadCloud, Cpu, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';

const steps = [
  {
    num: 1,
    icon: UploadCloud,
    title: 'Upload Documents',
    desc: 'Upload GeM tender documents (PDF/DOCX).',
    numColor: 'bg-blue-600 text-white',
    iconColor: 'text-blue-600 bg-blue-50',
  },
  {
    num: 2,
    icon: Cpu,
    title: 'AI Analysis',
    desc: 'Our AI checks eligibility, clauses, risks and compliance.',
    numColor: 'bg-emerald-600 text-white',
    iconColor: 'text-emerald-600 bg-emerald-50',
  },
  {
    num: 3,
    icon: BarChart3,
    title: 'Get Insights',
    desc: 'Receive clear, actionable reports with recommendations.',
    numColor: 'bg-purple-600 text-white',
    iconColor: 'text-purple-600 bg-purple-50',
  },
  {
    num: 4,
    icon: CheckCircle2,
    title: 'Take Action',
    desc: 'Make informed decisions and ensure compliance.',
    numColor: 'bg-teal-600 text-white',
    iconColor: 'text-teal-600 bg-teal-50',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-12 sm:py-16 bg-white select-none">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            From tender discovery to compliance assurance — in just a few simple steps.
          </p>
        </div>

        {/* 4 Process Flow Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative flex flex-col items-start group">
                {/* Step Card */}
                <div className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between h-full">
                  {/* Top: Step Number & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`w-7 h-7 rounded-full ${step.numColor} text-xs font-black flex items-center justify-center shadow-xs`}
                    >
                      {step.num}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-xl ${step.iconColor} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-700 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Arrow Connector between steps (Desktop) */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-slate-200 items-center justify-center shadow-xs pointer-events-none">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
