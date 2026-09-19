import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import TenderCard from '../../components/tender/TenderCard';
import TenderDetailModal from '../../components/tender/TenderDetailModal';
import { tenderService } from '../../services';

import { isTenderClosed } from '../../utils';

const categories = [
  'All',
  'Computers & IT Equipment',
  'Renewable Energy',
  'Medical Devices',
  'Electric Vehicles',
  'Security Systems',
  'Furniture & Furnishings',
  'Drones & Aerospace',
  'Cyber Security Services',
  'Heavy Machinery',
  'Environmental & IoT',
];

const Tenders = () => {
  const [searchParams] = useSearchParams();
  const queryTenderId = searchParams.get('tenderId') || searchParams.get('tender');
  const [tendersList, setTendersList] = useState([]);
  const [isLoadingTenders, setIsLoadingTenders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [activeTenderModal, setActiveTenderModal] = useState(null);
  const [isStuck, setIsStuck] = useState(false);

  // Auto-open modal if query parameter tenderId or tender is present
  useEffect(() => {
    if (queryTenderId && tendersList.length > 0) {
      const matched = tendersList.find(
        (t) =>
          String(t.id) === String(queryTenderId) ||
          t.referenceNo?.toLowerCase() === String(queryTenderId).toLowerCase()
      );
      if (matched) {
        const timer = setTimeout(() => {
          setActiveTenderModal(matched);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [queryTenderId, tendersList]);

  // Fetch real tenders from deployed backend API (or fallback to mockTenders)
  useEffect(() => {
    let isMounted = true;
    const loadTenders = async () => {
      try {
        setIsLoadingTenders(true);
        const role = localStorage.getItem('role');
        const token = localStorage.getItem('token');
        let remoteData = null;

        // If officer session, call GET /api/officer/tenders
        if (role === 'OFFICER' || token) {
          try {
            const officerData = await tenderService.getOfficerTenders();
            if (Array.isArray(officerData) && officerData.length > 0) {
              remoteData = officerData;
            }
          } catch (e) {
            console.warn('getOfficerTenders fallback notice:', e);
          }
        }

        // Otherwise fallback to general /tenders
        if (!remoteData) {
          remoteData = await tenderService.getTenders();
        }

        if (isMounted && Array.isArray(remoteData)) {
          setTendersList(remoteData);
        }
      } catch (err) {
        console.warn('Backend tenders load notice:', err);
      } finally {
        if (isMounted) setIsLoadingTenders(false);
      }
    };
    loadTenders();
    return () => {
      isMounted = false;
    };
  }, []);

  // Detect when user scrolls past header and metric cards to highlight sticky state
  useEffect(() => {
    const handleScroll = () => {
      setIsStuck(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter & Sort Logic
  const filteredTenders = useMemo(() => {
    return tendersList
      .filter((tender) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          tender.title?.toLowerCase().includes(query) ||
          tender.referenceNo?.toLowerCase().includes(query) ||
          tender.ministry?.toLowerCase().includes(query) ||
          tender.category?.toLowerCase().includes(query) ||
          (tender.location && tender.location.toLowerCase().includes(query));

        const matchesCategory =
          selectedCategory === 'All' || tender.category === selectedCategory;

        const matchesStatus =
          selectedStatus === 'All'
            ? true
            : selectedStatus === 'Closed'
            ? isTenderClosed(tender)
            : tender.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const valA = Number(a.numericValue || a.value) || 0;
        const valB = Number(b.numericValue || b.value) || 0;
        if (sortBy === 'value-desc') return valB - valA;
        if (sortBy === 'value-asc') return valA - valB;
        if (sortBy === 'compliance') return (b.complianceScore || 0) - (a.complianceScore || 0);
        if (sortBy === 'days') return (parseInt(a.daysLeft) || 0) - (parseInt(b.daysLeft) || 0);
        return 0;
      });
  }, [tendersList, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Statistics calculation
  const totalValue = useMemo(() => {
    const sum = tendersList.reduce((acc, t) => acc + (Number(t.numericValue) || 0), 0) / 10000000;
    return sum > 0 ? sum.toFixed(1) : '248.5';
  }, [tendersList]);

  const openCount = tendersList.filter((t) => t.status === 'Open' || t.status === 'Active').length;
  const closingSoonCount = tendersList.filter((t) => t.status === 'Closing Soon').length;
  const evaluationCount = tendersList.filter((t) => t.status === 'Under Evaluation').length;
  const closedCount = tendersList.filter((t) => isTenderClosed(t)).length;

  return (
    <div className="w-full space-y-6 py-6 select-none animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/90 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span className="bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
              GeM Live Procurement
            </span>
            <span>&bull;</span>
            <span className="text-slate-500 dark:text-slate-400">
              Government of India
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Government Tenders & Bids
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Live public procurement opportunities with instant AI compliance checking, GFR policy verification, and Make-in-India scorecards.
          </p>
        </div>

        {/* Action badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
            <span>AI Pre-Screening Enabled</span>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Counter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#181818] border border-slate-200/80 dark:border-[#303030] shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            Total Active Tenders
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {tendersList.length}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-[#4da3ff]">
              Published on GeM
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#181818] border border-slate-200/80 dark:border-[#303030] shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            Cumulative Value
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-[#38d39f]">
              ₹ {totalValue} Cr
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              INR
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#181818] border border-slate-200/80 dark:border-[#303030] shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            Open for Bidding
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {openCount}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-[#38d39f]">
              Active Now
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#181818] border border-slate-200/80 dark:border-[#303030] shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            Closing Soon
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-500">
              {closingSoonCount}
            </span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              &lt; 10 days
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sticky Search & Filter Bar */}
      <div
        style={{ top: 'var(--navbar-height, 84px)' }}
        className={`sticky z-30 pt-1 pb-3 -mx-2 px-2 sm:-mx-3 sm:px-3  bg-[#f8fafc]/95 dark:bg-[#121212]/95 backdrop-blur-md transition-all duration-200 ${
          isStuck ? 'border-b border-slate-200/80 dark:border-[#282828] ' : ''
        }`}
      >
        <div className="bg-white dark:bg-[#181818] p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-[#303030]  space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center">
            {/* Keyword Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tenders by title, GEM ID (e.g. GEM/2026/B/9401), ministry, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#343434] bg-slate-50/70 dark:bg-[#202020] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition"
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

            {/* Show / Hide Filters Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                showFilters || selectedCategory !== 'All' || selectedStatus !== 'All'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border-slate-200 dark:border-[#343434] bg-slate-50/70 dark:bg-[#202020] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#282828]'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              {(selectedCategory !== 'All' || selectedStatus !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expandable Filters (Category, Sort By, Status) */}
          {showFilters && (
            <div className="pt-3 border-t border-slate-100 dark:border-[#282828] space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Filter by Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#343434] bg-slate-50/70 dark:bg-[#202020] text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'All' ? 'All Categories (10)' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By Dropdown */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Sort Tenders By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#343434] bg-slate-50/70 dark:bg-[#202020] text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="default">Sort: Default</option>
                    <option value="value-desc">Value: High to Low</option>
                    <option value="value-asc">Value: Low to High</option>
                    <option value="compliance">Highest Compliance Score</option>
                    <option value="days">Closing Soonest</option>
                  </select>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div data-lenis-prevent="true" className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 text-xs font-semibold">
                <span className="text-slate-400 dark:text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Status:
                </span>
                {[
                  { label: 'All', count: tendersList.length },
                  { label: 'Open', count: openCount },
                  { label: 'Closing Soon', count: closingSoonCount },
                  { label: 'Under Evaluation', count: evaluationCount },
                  { label: 'Closed', count: closedCount },
                ].map((statusTab) => (
                  <button
                    key={statusTab.label}
                    onClick={() => setSelectedStatus(statusTab.label)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                      selectedStatus === statusTab.label
                        ? 'bg-[#073567] dark:bg-[#4da3ff] text-white dark:text-slate-950 shadow-2xs font-bold'
                        : 'bg-slate-100 dark:bg-[#202020] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#282828]'
                    }`}
                  >
                    {statusTab.label} ({statusTab.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Results Counter */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{filteredTenders.length}</strong> of {tendersList.length} tenders
        </span>
        {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedStatus('All');
              setSortBy('default');
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* 5. Tenders Grid */}
      {isLoadingTenders ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" aria-busy="true" aria-label="Loading tenders">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTenders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredTenders.map((tender) => (
            <TenderCard
              key={tender.id}
              tender={tender}
              onViewDetails={(t) => setActiveTenderModal(t)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No tenders found matching your criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, clear category filters, or select "All" in the status selector.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedStatus('All');
            }}
            className="px-4 py-2 bg-[#073567] hover:bg-[#05284f] text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
          >
            Show All Tenders
          </button>
        </div>
      )}

      {/* 6. Tender Details Modal */}
      <TenderDetailModal
        tender={activeTenderModal}
        onClose={() => setActiveTenderModal(null)}
      />

    </div>
  );
};

export default Tenders;
