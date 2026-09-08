import React from 'react';
import { Landmark, Clock, ShieldCheck, Award } from 'lucide-react';

const benefits = [
  {
    icon: Landmark,
    title: 'Built for Government',
    desc: "Designed specifically for India's procurement ecosystem.",
    iconBg: 'bg-blue-50 text-blue-700',
  },
  {
    icon: Clock,
    title: 'Saves Time & Cost',
    desc: 'Reduce manual effort by up to 70%.',
    iconBg: 'bg-orange-50 text-orange-600',
  },
  {
    icon: ShieldCheck,
    title: 'Increases Transparency',
    desc: 'Ensures fair and unbiased evaluation.',
    iconBg: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: Award,
    title: 'Supports Atmanirbhar Bharat',
    desc: 'Empowering Indian businesses through compliant procurement.',
    iconBg: 'bg-amber-50 text-amber-700',
  },
];

const WhyChoose = () => {
  return (
    <section id="why-choose" className="py-12 sm:py-16 bg-[#f8fafc] select-none">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Why Choose GeMCompliance?
          </h2>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md hover:border-blue-300 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-11 h-11 rounded-xl ${benefit.iconBg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-700 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
