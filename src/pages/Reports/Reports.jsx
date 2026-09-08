import React, { useState, useMemo } from 'react';
import { Download, FileText, CheckCircle2, Search, ShieldCheck, Filter, ArrowDownToLine, Printer } from 'lucide-react';

const mockReportsData = [
  {
    id: 'REP-2026-001',
    tender: 'Turnkey EPC for 50MW Rooftop Solar PV Systems',
    refNo: 'GEM/2026/B/9401',
    date: '04 Sep 2026',
    status: 'Certified & Signed',
    size: '2.4 MB',
    auditor: 'CAG & GeM Autonomous Engine',
  },
  {
    id: 'REP-2026-002',
    tender: 'Cloud Infrastructure & High-Performance AI Edge Computing',
    refNo: 'GEM/2026/B/8812',
    date: '02 Sep 2026',
    status: 'Certified & Signed',
    size: '3.1 MB',
    auditor: 'MeitY Compliance Cell',
  },
  {
    id: 'REP-2026-003',
    tender: 'Supply of Advanced Multi-Slice CT Scanner & MRI',
    refNo: 'GEM/2026/B/7734',
    date: '28 Aug 2026',
    status: 'Certified & Signed',
    size: '1.8 MB',
    auditor: 'MoHFW Technical Audit Team',
  },
  {
    id: 'REP-2026-004',
    tender: 'Fleet Electrification: 350 Electric Passenger Vehicles',
    refNo: 'GEM/2026/B/6619',
    date: '25 Aug 2026',
    status: 'Certified & Signed',
    size: '2.9 MB',
    auditor: 'MHI FAME-II Compliance Wing',
  },
  {
    id: 'REP-2026-005',
    tender: 'Smart Border Surveillance UAV Drones with Thermal Sensors',
    refNo: 'GEM/2026/B/4405',
    date: '20 Aug 2026',
    status: 'Certified & Signed',
    size: '4.2 MB',
    auditor: 'MoD Make-II Steering Committee',
  },
  {
    id: 'REP-2026-006',
    tender: 'Next-Gen Perimeter Security & Access Control System',
    refNo: 'GEM/2026/B/5520',
    date: '16 Aug 2026',
    status: 'Certified & Signed',
    size: '1.5 MB',
    auditor: 'CPWD Audit Board',
  },
];

const Reports = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = useMemo(() => {
    return mockReportsData.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.tender.toLowerCase().includes(q) ||
        r.refNo.toLowerCase().includes(q) ||
        r.auditor.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const handleDownload = (report) => {
    alert(`Downloading official certified report: ${report.id} (${report.size})\nDigital signature verified: NIC-CA e-Sign`);
  };

  const handleExportAll = () => {
    alert('Preparing complete GFR 2017 compliant audit archive (6 certified reports). Export started!');
  };

  return (
    <div className="w-full space-y-6 select-none animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/90 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span className="bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded font-mono text-[11px]">
              GeM Official Audit Trail
            </span>
            <span>&bull;</span>
            <span className="text-slate-500 dark:text-slate-400">CAG & CVC Standard Compliant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Compliance Reports & Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            Immutable AI compliance certifications, clause-by-clause audit trails, and digitally-signed summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#073567] hover:bg-[#05284f] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Export Full Audit Package (ZIP)</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search reports by ID, tender name, GEM ID, or auditor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <strong className="text-slate-900 dark:text-white">{filteredReports.length}</strong> verified audit records
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="uppercase font-bold text-[10px] bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="p-4">Report ID</th>
              <th className="p-4">Tender Name & Ref</th>
              <th className="p-4">Date Generated</th>
              <th className="p-4">Audited Authority</th>
              <th className="p-4">Verdict Status</th>
              <th className="p-4 text-right">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.map((rep) => (
              <tr key={rep.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                  {rep.id}
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100 max-w-sm truncate" title={rep.tender}>
                    {rep.tender}
                  </div>
                  <span className="font-mono text-[10.5px] text-slate-400 block mt-0.5">
                    {rep.refNo}
                  </span>
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                  {rep.date}
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400 text-[11px]">
                  {rep.auditor}
                </td>
                <td className="p-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-[10.5px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {rep.status}
                  </span>
                </td>
                <td className="p-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => handleDownload(rep)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#073567] dark:text-blue-400 rounded-lg transition font-bold text-xs cursor-pointer border border-blue-200 dark:border-blue-900/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF ({rep.size})</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Reports;
