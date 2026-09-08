import React from 'react';
import { ArrowRight, Star } from 'lucide-react';

const testimonials = [
  {
    quote: 'GemCompliance has simplified our tender evaluation process and saved significant time.',
    name: 'R. Kumar',
    role: 'Procurement Officer, State Government',
    rating: 5,
    avatar: 'RK',
    avatarBg: 'bg-[#073567]',
  },
  {
    quote: 'The AI insights are accurate and help us stay compliant with all GeM guidelines.',
    name: 'P. Sharma',
    role: 'Vendor, MSME',
    rating: 5,
    avatar: 'PS',
    avatarBg: 'bg-emerald-600',
  },
  {
    quote: 'A must-have platform for every government department and bidder.',
    name: 'A. Verma',
    role: 'Joint Secretary, Government of India',
    rating: 5,
    avatar: 'AV',
    avatarBg: 'bg-purple-600',
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-12 sm:py-16 bg-white select-none">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              What Our Users Say
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Trusted by government officials, vendors, and procurement professionals.
            </p>
          </div>
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#073567] hover:text-blue-700 transition cursor-pointer"
          >
            <span>View All Testimonials</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="border border-slate-200/90 rounded-2xl p-6 bg-white hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-slate-700 leading-relaxed mb-6 font-medium italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div
                  className={`w-10 h-10 rounded-full ${t.avatarBg} text-white text-xs font-black flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 leading-tight">{t.name}</div>
                  <div className="text-xs text-slate-500 font-medium truncate mt-0.5">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
