import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Award,
  Mail,
  Phone,
  FileCheck,
  CreditCard,
  Hash,
  ExternalLink,
  X,
  Calendar
} from 'lucide-react';

const BidderCard = ({ bidder, onVerify }) => {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const isVerified = bidder.status === 'Verified' || Boolean(bidder.gstNumber || bidder.panNumber);

  return (
    <>
      <div className="p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 text-slate-800 dark:text-slate-100 flex flex-col justify-between group">
        <div>
          {/* Top Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#073567] dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-100 dark:border-blue-900/50 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug truncate">
                  {bidder.legalName || bidder.companyName}
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
                    ID: #{bidder.id}
                  </span>
                  {bidder.registrationNumber && bidder.registrationNumber !== 'string' && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                        {bidder.registrationNumber}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                isVerified
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {isVerified ? 'Verified' : 'Pending'}
            </span>
          </div>

          {/* Vendor Identifiers Strip (PAN, GSTIN, Address) */}
          <div className="space-y-2 text-xs py-2.5 border-y border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            {/* GSTIN */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-slate-400" />
                <span>GSTIN:</span>
              </span>
              <span className="font-mono font-semibold text-[11px] text-slate-800 dark:text-slate-200">
                {bidder.gstNumber || bidder.gstin || 'Not Provided'}
              </span>
            </div>

            {/* PAN */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-slate-400" />
                <span>PAN Number:</span>
              </span>
              <span className="font-mono font-semibold text-[11px] text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {bidder.panNumber || 'N/A'}
              </span>
            </div>

            {/* Location / Address */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1 shrink-0">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Address:</span>
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[170px] text-right">
                {bidder.address || bidder.location || 'India'}
              </span>
            </div>

            {/* Contact (Email / Phone) */}
            {(bidder.email || bidder.phone) && (
              <div className="flex items-center justify-between gap-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {bidder.email && (
                  <span className="truncate max-w-[150px] flex items-center gap-1" title={bidder.email}>
                    <Mail className="w-3 h-3 shrink-0 text-blue-500" />
                    <span className="truncate">{bidder.email}</span>
                  </span>
                )}
                {bidder.phone && (
                  <span className="flex items-center gap-1 shrink-0 font-mono">
                    <Phone className="w-3 h-3 text-emerald-500" />
                    <span>{bidder.phone}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Badges / MSME Classification */}
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            {bidder.udyamNumber ? (
              <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>MSME: {bidder.udyamNumber}</span>
              </span>
            ) : bidder.isMsme ? (
              <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200 dark:border-purple-800">
                MSME Registered
              </span>
            ) : null}

            {bidder.panNumber && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200 dark:border-blue-900/60">
                PAN Validated
              </span>
            )}

            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[10px]">
              GeM Active
            </span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Govt Vendor</span>
          </span>
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[#073567] hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            View Profile
          </button>
        </div>
      </div>

      {/* Detailed Profile Dossier Modal */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150 select-none"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#073567] dark:bg-slate-950 p-5 text-white flex items-start justify-between gap-3 border-b border-blue-900/30">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Building2 className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base leading-snug">
                      {bidder.legalName || bidder.companyName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/80 mt-0.5">
                    Bidder ID #{bidder.id} &bull; GeM Registry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-slate-800 dark:text-slate-100">
              
              {/* Compliance & Identity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    GSTIN Number
                  </span>
                  <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {bidder.gstNumber || bidder.gstin || 'Not Provided'}
                  </div>
                  <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active & Tax Compliant
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    PAN Card Number
                  </span>
                  <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {bidder.panNumber || 'N/A'}
                  </div>
                  <span className="text-[9.5px] text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Income Tax Verified
                  </span>
                </div>
              </div>

              {/* MSME Udyam Details */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                  <span className="font-bold text-xs text-purple-900 dark:text-purple-200">
                    MSME / Udyam Certification
                  </span>
                </div>
                <div className="font-mono font-bold text-xs text-purple-800 dark:text-purple-300">
                  {bidder.udyamNumber || 'No Udyam ID Registered (General Category)'}
                </div>
                <p className="text-[10.5px] text-purple-700/80 dark:text-purple-300/80 mt-1">
                  Eligible for GFR 2017 MSME exemptions on EMD & Tender Fee requirements.
                </p>
              </div>

              {/* Contact & Address Information */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-700/60 pb-1">
                  Registered Contact & Location
                </div>
                <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{bidder.address || bidder.location || 'India'}</span>
                </div>
                {bidder.email && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{bidder.email}</span>
                  </div>
                )}
                {bidder.phone && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-mono">{bidder.phone}</span>
                  </div>
                )}
              </div>

              {/* Metadata & Timestamps */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Registered: {new Date(bidder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div>
                  Updated: {new Date(bidder.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 bg-[#073567] hover:bg-[#05284f] text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BidderCard;
