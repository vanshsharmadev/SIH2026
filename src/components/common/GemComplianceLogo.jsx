import React from 'react';

const GemComplianceLogo = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Verification Emblem beside GeM: [ Shield + Document + ✓ ] */}
      <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Circular Seal Outer Dashed Orbit */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke="#0A2540"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            className="opacity-60 dark:stroke-slate-400"
          />
          {/* Inner Solid Circular Ring */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#0E9F6E"
            strokeWidth="1.8"
            className="opacity-90"
          />

          {/* Restrained Saffron Accent Dot (Top North-East) */}
          <circle cx="38" cy="10" r="2.5" fill="#FF9933" />

          {/* Government Document Base (Folded Corner) */}
          <path
            d="M13 14C13 12.3431 14.3431 11 16 11H30L36 17V34C36 35.6569 34.6569 37 33 37H16C14.3431 37 13 35.6569 13 34V14Z"
            fill="#F0F9FF"
            stroke="#0A2540"
            strokeWidth="1.6"
            className="dark:fill-slate-800 dark:stroke-slate-300"
          />
          {/* Document Fold Flap */}
          <path
            d="M30 11V17H36"
            stroke="#0A2540"
            strokeWidth="1.4"
            fill="#E0F2FE"
            className="dark:stroke-slate-300 dark:fill-slate-700"
          />

          {/* Security Shield */}
          <path
            d="M24 17L17 20.5V27C17 31.8 20.2 35.8 24 37C27.8 35.8 31 31.8 31 27V20.5L24 17Z"
            fill="#0A2540"
            stroke="#0E9F6E"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />

          {/* Bold Verified Checkmark ✓ */}
          <path
            d="M20.5 27L22.8 29.5L27.5 24"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Digital AI Node Accent */}
          <circle cx="24" cy="17" r="1.5" fill="#FF9933" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center leading-none text-xl md:text-2xl tracking-tight font-black">
          {/* Deep Navy GeM */}
          <span className="text-[#0A2540] dark:text-white">GeM</span>

          {/* Compliflix with C as Circular Verification Seal */}
          <span className="inline-flex items-center text-[#0E9F6E] ml-1.5">
            <span className="relative inline-flex items-center justify-center mr-0.5">
              <svg
                className="w-[1.05em] h-[1.05em] inline-block -mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Circular Seal C Shape */}
                <path
                  d="M18.5 7.5C16.8 4.8 13.8 3.5 10.2 4.2C5.8 5 2.5 9 2.5 13.5C2.5 18 5.8 21.8 10.5 22.2C14.2 22.5 17.2 20.8 18.8 18"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                {/* Restrained Saffron Verification Checkmark inside the C */}
                <path
                  d="M8.5 12.8L11 15.2L16.2 9.8"
                  stroke="#FF9933"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>ompliflix</span>
          </span>
        </div>
        <span className="text-[10px] md:text-[11px] font-semibold tracking-wide mt-0.5 text-slate-500 dark:text-slate-400">
          AI-Powered Procurement Compliance
        </span>
      </div>
    </div>
  );
};

export default GemComplianceLogo;
