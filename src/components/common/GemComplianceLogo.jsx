import React from 'react';

const GemComplianceLogo = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Shield Check Icon */}
      <div className="relative flex items-center justify-center w-10 h-10">
        <svg
          viewBox="0 0 44 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Outer Shield Outline */}
          <path
            d="M22 2L4 8.5V20.5C4 32.2 11.6 42.8 22 46C32.4 42.8 40 32.2 40 20.5V8.5L22 2Z"
            stroke="#0b4da2"
            strokeWidth="3.2"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Inner Shield Accent */}
          <path
            d="M22 7.5L8.5 12.5V21C8.5 30.2 14.3 38.6 22 41.5C29.7 38.6 35.5 30.2 35.5 21V12.5L22 7.5Z"
            fill="#f0f7ff"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Checkmark */}
          <path
            d="M16 23.5L20.2 27.5L28 17.5"
            stroke="#0b4da2"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center leading-none text-xl md:text-2xl tracking-tight font-extrabold">
          <span className="text-[#0d3468]">Gem</span>
          <span className="text-[#0284c7]">Compliance</span>
        </div>
        <span className="text-[11px] md:text-xs font-medium tracking-wide mt-0.5 text-slate-500">
          AI Bid Compliance Platform
        </span>
      </div>
    </div>
  );
};

export default GemComplianceLogo;
