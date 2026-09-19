import { FileText, Clock, ShieldCheck, Users } from 'lucide-react';
import TricolorBar from '../../components/common/TricolorBar';

const HeroSection = () => {
  const featureBadges = [
    {
      icon: FileText,
      title: "Ensure compliance",
      subtitle: "with regulations",
    },
    {
      icon: Clock,
      title: "Reduce",
      subtitle: "manual effort",
    },
    {
      icon: ShieldCheck,
      title: "Enable transparent",
      subtitle: "evaluation",
    },
    {
      icon: Users,
      title: "Build trust in public",
      subtitle: "procurement",
    },
  ];

  return (
    <div className="relative flex flex-col justify-center pt-2 sm:pt-4 pb-1 z-10">

      <div className="max-w-lg">
        {/* Tricolor Accent Pill */}
        <TricolorBar className="w-12 h-1 mb-2" />

        {/* Tagline */}
        <div className="flex items-center gap-2 text-[10px] sm:text-[10.5px] font-bold tracking-widest uppercase mb-1.5 text-white/90 drop-shadow-sm">
          <span>TRANSPARENT</span>
          <span className="text-white/50">|</span>
          <span>EFFICIENT</span>
          <span className="text-white/50">|</span>
          <span>ACCOUNTABLE</span>
        </div>

        {/* Big Bold Headline */}
        <h1 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[38px] font-black tracking-tight leading-[1.15] mb-2 text-white drop-shadow-md">
          Transparent<br />
          Procurement.<br />
          Stronger India.
        </h1>

        {/* Subtitle Paragraph */}
        <p className="text-xs sm:text-[13px] leading-relaxed mb-3 max-w-md font-medium text-white/95 drop-shadow-sm">
          AI-powered compliance checks for efficient,<br className="hidden sm:inline" />
          {' '}fair and accountable government procurement.
        </p>

        {/* 4 Feature Circular Badges */}
        <div className="grid grid-cols-4 gap-2 mb-3 max-w-md">
          {featureBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center group cursor-default">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 transition-transform duration-200 group-hover:scale-105 shadow-md bg-white/95 backdrop-blur-xs border border-white/80 text-[#0c396d]">
                  <Icon className="w-4 h-4 stroke-[1.8]" />
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold leading-tight text-white drop-shadow-sm">
                  <div>{badge.title}</div>
                  <div className="text-white/85 font-semibold">{badge.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Good Governance Quote */}
        <div className="mt-1.5 inline-block">
          <TricolorBar className="w-10 h-0.5 mb-1.5" />
          <blockquote className="italic font-bold text-xs sm:text-sm leading-snug text-white drop-shadow-sm">
            &ldquo;Good Governance Builds a Stronger Nation&rdquo;
          </blockquote>
          <p className="text-[10px] sm:text-[10.5px] text-white/85 mt-0.5 font-semibold drop-shadow-sm">
            &mdash; Government of India
          </p>
        </div>

      </div>

    </div>
  );
};

export default HeroSection;
