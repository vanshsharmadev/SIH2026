import React from 'react';

const StatCard = ({ title, value, change, icon: Icon }) => {
  return (
    <div className="p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{value}</h3>
          {change && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <span>●</span>
              <span>{change}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#073567] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
