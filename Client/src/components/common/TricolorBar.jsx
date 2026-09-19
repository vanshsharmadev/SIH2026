import React from 'react';

const TricolorBar = ({ className = "w-16 h-1" }) => {
  return (
    <div className={`flex rounded-full overflow-hidden shadow-xs ${className}`}>
      <div className="flex-1 bg-[#FF9933]"></div>
      <div className="flex-1 bg-white border-y border-slate-200/60"></div>
      <div className="flex-1 bg-[#138808]"></div>
    </div>
  );
};

export default TricolorBar;
