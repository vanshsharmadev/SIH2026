import React from 'react';
import { Star, ShieldCheck, CheckCircle2, Quote, Building2, UserCheck } from 'lucide-react';

const testimonials = [
  {
    quote:
      'Compliflix revolutionized our Technical Evaluation Committee workflow. Auditing 45 complex multi-crore vendor submissions used to take weeks of overtime; now clause matching and GFR 144(xi) flags are generated automatically in hours.',
    name: 'Rajeev M. Kumar',
    role: 'Senior Procurement Officer',
    organization: 'Central Public Sector Undertaking (CPSU)',
    verifiedBadge: 'Verified Buyer Authority',
    metricTag: '85% Faster Bid Scrutiny',
    avatar: 'RK',
    avatarBg: 'bg-[#073567] text-white',
  },
  {
    quote:
      'As an MSME hardware manufacturer, we lost bids previously because of minor declaration formatting errors. Compliflix detected an outdated STQC lab certificate and saved us from disqualification on a ₹14 Cr GeM tender.',
    name: 'Pooja Sharma',
    role: 'Managing Director & Founder',
    organization: 'Apex Embedded Systems (Class-I MSME)',
    verifiedBadge: 'Class-I Local Supplier',
    metricTag: '₹0 Disqualification across 18 Bids',
    avatar: 'PS',
    avatarBg: 'bg-emerald-600 text-white',
  },
  {
    quote:
      'The platform provides a rock-solid audit trail. When questions arise during oversight or vigilance reviews, having cryptographic timestamps and clear rule-by-rule scoring makes compliance completely indisputable.',
    name: 'Anand K. Verma',
    role: 'Director of Procurement & Contracts',
    organization: 'State Urban Development Authority',
    verifiedBadge: 'Vigilance & Audit Compliant',
    metricTag: '100% GFR 2017 Audit Pass',
    avatar: 'AV',
    avatarBg: 'bg-indigo-600 text-white',
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-14 sm:py-20 bg-white dark:bg-[#121212] select-none transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-[#4da3ff] uppercase tracking-wider mb-2">
              <UserCheck className="w-4 h-4" />
              <span>Institutional Trust & Field Results</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Trusted Across Ministries & Enterprises
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
              Real feedback from procurement officers, committee members, and registered GeM vendors.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold self-start md:self-auto">
            <CheckCircle2 className="w-4 h-4" />
            <span>Over 12,000+ Tenders Pre-Audited</span>
          </div>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="border border-slate-200/90 dark:border-[#303030] rounded-2xl p-6 bg-[#f8fafc] dark:bg-[#181818] hover:shadow-xl hover:border-blue-300 dark:hover:border-[#4da3ff] transition-all duration-200 flex flex-col justify-between group"
            >
              {/* Card Top: Stars & Metric Badge */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                    {t.metricTag}
                  </span>
                </div>

                {/* Quote Text */}
                <div className="relative mb-6">
                  <Quote className="w-8 h-8 text-slate-200 dark:text-[#282828] absolute -top-2 -left-1 pointer-events-none -z-0" />
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium relative z-10">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-[#282828] flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl ${t.avatarBg} flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}
                >
                  {t.avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {t.name}
                    </h3>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-[#4da3ff] shrink-0" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                    {t.role}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                    {t.organization}
                  </p>
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
