import { useState, useEffect, useMemo } from 'react';
import { Search, Building2, CheckCircle2, RefreshCw, Award, CreditCard } from 'lucide-react';
import BidderCard from '../../components/bidder/BidderCard';
import { bidderService } from '../../services/bidderService';

const Bidders = () => {
  const [bidders, setBidders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchBidders = async () => {
    setIsLoading(true);
    try {
      const data = await bidderService.getBidders();
      if (Array.isArray(data) && data.length > 0) {
        setBidders(data);
      }
    } catch (err) {
      console.warn('Could not fetch bidders from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBidders();
  }, []);

  const stats = useMemo(() => {
    const total = bidders.length;
    const msme = bidders.filter((b) => b.isMsme || Boolean(b.udyamNumber)).length;
    const panVerified = bidders.filter((b) => Boolean(b.panNumber)).length;
    const gstVerified = bidders.filter((b) => Boolean(b.gstNumber || b.gstin)).length;
    return { total, msme, panVerified, gstVerified };
  }, [bidders]);

  const filteredBidders = useMemo(() => {
    return bidders.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (b.legalName && b.legalName.toLowerCase().includes(q)) ||
        (b.companyName && b.companyName.toLowerCase().includes(q)) ||
        (b.panNumber && b.panNumber.toLowerCase().includes(q)) ||
        (b.gstNumber && b.gstNumber.toLowerCase().includes(q)) ||
        (b.gstin && b.gstin.toLowerCase().includes(q)) ||
        (b.udyamNumber && b.udyamNumber.toLowerCase().includes(q)) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q));

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'MSME' && (b.isMsme || Boolean(b.udyamNumber))) ||
        (statusFilter === 'PAN' && Boolean(b.panNumber)) ||
        (statusFilter === 'Verified' && b.status === 'Verified');

      return matchesQuery && matchesStatus;
    });
  }, [bidders, searchQuery, statusFilter]);

  return (
    <div className="w-full space-y-6 select-none animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/90 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span className="bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded font-mono text-[11px]">
              GeM Central Supplier & Vendor Registry
            </span>
            <span>&bull;</span>
            <span className="text-slate-500 dark:text-slate-400">Government of India</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Registered Bidders & Vendors
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            Verified suppliers, MSME Udyam classification, Income Tax PAN validation, and GSTIN registration status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBidders}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Vendor Records</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Active GSTIN & PAN Sync</span>
          </div>
        </div>
      </div>

      {/* Quick Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{stats.total}</div>
            <div className="text-[11px] text-slate-500 font-medium">Total Vendors</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{stats.msme}</div>
            <div className="text-[11px] text-slate-500 font-medium">MSME Udyam Verified</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{stats.gstVerified}</div>
            <div className="text-[11px] text-slate-500 font-medium">Active GSTIN</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{stats.panVerified}</div>
            <div className="text-[11px] text-slate-500 font-medium">PAN Validated</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Keyword search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by legal name (e.g. Arnav Tyagi), PAN, GSTIN, Udyam No, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            {[
              { label: 'All Vendors', key: 'All' },
              { label: 'MSME (Udyam)', key: 'MSME' },
              { label: 'PAN Validated', key: 'PAN' },
              { label: 'Verified Status', key: 'Verified' },
            ].map((tab) => (
              <button
                type="button"
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                  statusFilter === tab.key
                    ? 'bg-[#073567] dark:bg-blue-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredBidders.length}</strong> of {bidders.length} registered vendors
          </span>
          {(searchQuery || statusFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* Bidders Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs text-slate-500">Loading registered vendors...</p>
        </div>
      ) : filteredBidders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBidders.map((bidder) => (
            <BidderCard key={bidder.id} bidder={bidder} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No vendors found matching your filter criteria
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
            className="px-4 py-2 bg-[#073567] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Show All Vendors
          </button>
        </div>
      )}

    </div>
  );
};

export default Bidders;
