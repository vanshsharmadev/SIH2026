import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Globe, ChevronDown, Check, Menu, X, LogOut, ShieldCheck, LayoutDashboard, User, FileText, Settings, Bell } from 'lucide-react';
import { useLanguage, useTheme, useAuth } from '../../context';
import { isOfficerUser, getUserDisplayName } from '../../utils/roleUtils';
import ScreenReaderModal from './ScreenReaderModal';
import NationalEmblem from './NationalEmblem';
import NotificationDropdown from './NotificationDropdown';
import logoGemVariant from '../../assets/logo_gem_variant.png';

const Navbar = ({ fontScale, setFontScale }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLang, switchLanguage, languages } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [screenReaderOpen, setScreenReaderOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const headerRef = useRef(null);

  // Derive profile display information and role verification
  const isOfficer = Boolean(isAuthenticated && isOfficerUser(user));
  const displayName = getUserDisplayName(user);
  const displayRole = user?.role || (isOfficer ? 'Procurement Officer' : 'Procurement Bidder');

  const getInitials = (name) => {
    if (!name) return 'PS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName);

  // Global Notification Center for Authenticated Users
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [navNotifications, setNavNotifications] = useState([]);

  const loadNavNotifications = useCallback(() => {
    try {
      const storageKey = isOfficer ? 'gem_officer_notifications' : 'gem_bidder_notifications';
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(
            (n) =>
              !n.id?.startsWith('notif-seed-') &&
              !n.id?.startsWith('notif-sub-') &&
              !n.id?.startsWith('notif-bidder-seed-') &&
              !n.title?.includes('Larsen & Toubro') &&
              !n.title?.includes('Tata Projects') &&
              !n.description?.includes('Larsen & Toubro') &&
              !n.description?.includes('Tata Projects') &&
              !n.title?.includes('Land Border Rule 144(xi)') &&
              !n.title?.includes('Comparative AI Matrix Ready')
          );
          if (clean.length !== parsed.length) {
            localStorage.setItem(storageKey, JSON.stringify(clean));
          }
          return clean;
        }
      }
    } catch {}
    return [];
  }, [isOfficer]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setNavNotifications(loadNavNotifications());

    const handleSync = () => {
      setNavNotifications(loadNavNotifications());
    };

    window.addEventListener('gem_notification_created', handleSync);
    window.addEventListener('gem_submission_created', handleSync);
    window.addEventListener('gem_bidder_applications_updated', handleSync);
    window.addEventListener('gem_officer_submissions_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('gem_notification_created', handleSync);
      window.removeEventListener('gem_submission_created', handleSync);
      window.removeEventListener('gem_bidder_applications_updated', handleSync);
      window.removeEventListener('gem_officer_submissions_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [isAuthenticated, loadNavNotifications]);

  const navUnreadCount = useMemo(() => {
    return navNotifications.filter((n) => n.unread).length;
  }, [navNotifications]);

  const handleMarkAllNavRead = () => {
    setNavNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, unread: false }));
      const storageKey = isOfficer ? 'gem_officer_notifications' : 'gem_bidder_notifications';
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleMarkNavRead = (id) => {
    setNavNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, unread: false } : n));
      const storageKey = isOfficer ? 'gem_officer_notifications' : 'gem_bidder_notifications';
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteNavNotif = (id) => {
    setNavNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      const storageKey = isOfficer ? 'gem_officer_notifications' : 'gem_bidder_notifications';
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleNavNotificationNavigate = (target, item = null) => {
    if (isOfficer) {
      if (target === 'submissions') {
        navigate(item?.tenderId ? `/dashboard?tab=submissions&tenderId=${encodeURIComponent(item.tenderId)}` : '/dashboard?tab=submissions');
      } else if (target === 'tenders') {
        navigate('/dashboard?tab=tenders');
      } else if (target === 'compliance') {
        navigate('/dashboard?tab=compliance');
      } else if (target === 'audit') {
        navigate('/dashboard?tab=audit');
      } else {
        navigate('/dashboard');
      }
    } else {
      if (target === 'bids' || target === 'my-applications') {
        navigate('/my-applications');
      } else {
        navigate('/bidder-dashboard');
      }
    }
  };

  // Dynamically measure Navbar height and expose as CSS custom property for sticky subnavs
  useEffect(() => {
    const updateNavbarHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--navbar-height', `${height}px`);
      }
    };
    updateNavbarHeight();
    const resizeObserver = new ResizeObserver(updateNavbarHeight);
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }
    window.addEventListener('resize', updateNavbarHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, [fontScale]);

  // Close dropdowns on route change
  useEffect(() => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    setLangDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track scroll position for subtle elevation shadow
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global accessibility shortcuts (Alt+M: Skip to main content, Alt+A: Screen reader modal)
  useEffect(() => {
    const handleShortcuts = (e) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        scrollToSection('main-content');
      }
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setScreenReaderOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/`);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.focus({ preventScroll: true });
      if (window.lenis) {
        window.lenis.scrollTo(element, { offset: -90, duration: 1.2 });
      } else {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md border-b select-none transition-all duration-200 ${
          isScrolled ? 'shadow-md border-slate-300 dark:border-[#303030]' : 'shadow-xs border-slate-200 dark:border-[#303030]'
        }`}
      >
        {/* Main Nav Container tracked for height calculation (excludes mobile drawer to prevent layout jump) */}
        <div ref={headerRef}>
          {/* 1. Top Government Utility Bar */}
          <div className="w-full bg-[#f8fafc] dark:bg-[#141414] border-b border-slate-200/90 dark:border-[#282828] text-slate-700 dark:text-slate-300 text-xs py-1 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="max-w-[1360px] mx-auto flex items-center justify-between">
              {/* Left: Indian Flag + Government of India */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Indian Flag Badge */}
                <div className="w-4 h-3 rounded-[2px] overflow-hidden flex flex-col shadow-2xs border border-slate-300 dark:border-slate-700 shrink-0">
                  <div className="h-1 bg-[#FF9933]" />
                  <div className="h-1 bg-white flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-[#000080]" />
                  </div>
                  <div className="h-1 bg-[#138808]" />
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs whitespace-nowrap">
                  भारत सरकार
                </span>
                <span className="text-slate-400 dark:text-slate-600 text-[10px] hidden sm:inline">|</span>
                <span className="font-medium text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs hidden sm:inline whitespace-nowrap">
                  Government of India
                </span>
              </div>

            {/* Right: Accessibility + Font Controls + Theme + Language */}
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
              {/* Skip to main */}
              <button
                onClick={() => scrollToSection('main-content')}
                title="Skip directly to main content (Alt + M)"
                className="hidden md:inline-block text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition cursor-pointer"
              >
                Skip to main content
              </button>
              <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>

              {/* Screen Reader Access */}
              <button
                onClick={() => setScreenReaderOpen(true)}
                title="Screen Reader Access and Accessibility Options (Alt + A)"
                className="hidden lg:inline-block text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition cursor-pointer"
              >
                Screen Reader Access
              </button>
              <span className="hidden lg:inline text-slate-300 dark:text-slate-700">|</span>

              {/* Font Scalers A- A A+ */}
              <div className="flex items-center gap-1 font-semibold" role="group" aria-label="Font size scale">
                <button
                  onClick={() => setFontScale && setFontScale((prev) => Math.max(parseFloat((prev - 0.05).toFixed(2)), 0.85))}
                  title="Decrease Font Size (A-)"
                  aria-label="Decrease font size"
                  className={`px-1.5 py-0.2 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer ${
                    fontScale < 0.98 ? 'text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontScale && setFontScale(1.0)}
                  title="Reset Normal Font Size (A)"
                  aria-label="Normal font size"
                  className={`px-1.5 py-0.2 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer ${
                    Math.abs(fontScale - 1.0) < 0.01 ? 'text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontScale && setFontScale((prev) => Math.min(parseFloat((prev + 0.05).toFixed(2)), 1.25))}
                  title="Increase Font Size (A+)"
                  aria-label="Increase font size"
                  className={`px-1.5 py-0.2 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer ${
                    fontScale > 1.02 ? 'text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  A+
                </button>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>

              {/* Dark Mode Icon */}
              <button
                onClick={toggleTheme}
                title={isDarkMode ? 'Switch to Normal Light Theme' : 'Switch to High Contrast / Dark Theme'}
                aria-label={isDarkMode ? 'Switch to Normal Light Theme' : 'Switch to High Contrast / Dark Theme'}
                className="text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-amber-400 transition cursor-pointer p-0.5 rounded"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>

              {/* Language Selector */}
              <div className="relative notranslate" ref={dropdownRef} translate="no">
                <button
                  type="button"
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition cursor-pointer notranslate"
                  aria-label="Select Language"
                  translate="no"
                >
                  <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="notranslate" translate="no">{languages.find(l => l.code === currentLang)?.name || 'English'}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {langDropdownOpen && (
                  <div
                    className="absolute right-0 mt-1.5 w-36 rounded-lg shadow-lg border py-1 z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 animate-in fade-in duration-100 notranslate"
                    translate="no"
                  >
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1 notranslate" translate="no">
                      Language
                    </div>
                    {languages.map((lang) => (
                      <button
                        type="button"
                        key={lang.code}
                        onClick={() => {
                          switchLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer notranslate ${
                          currentLang === lang.code ? 'font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-800/60' : 'text-slate-700 dark:text-slate-200'
                        }`}
                        translate="no"
                      >
                        <span className="notranslate" translate="no">{lang.name}</span>
                        {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main Navigation Bar */}
        <div className="max-w-[1360px] mx-auto px-3.5 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: National Emblem + GeM Compliflix Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0">
            <img
              src={logoGemVariant}
              alt="GeM Compliflix"
              className="h-9 sm:h-11 md:h-13 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform drop-shadow-xs"
            />
            <div className="flex flex-col leading-none min-w-0">
              <div className="flex items-center text-lg sm:text-[22px] font-black tracking-tight">
                <span className="text-[#0A2540] dark:text-white">GeM</span>
                <span className="text-[#0E9F6E] ml-1">Compliflix</span>
              </div>
              <span className="hidden sm:block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">
                Compliant Procurement. Stronger India.
              </span>
            </div>
          </Link>

          {/* Center: Nav Menu (Desktop) - All main portal routes visible */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-[13px] xl:text-sm font-medium">
            <Link
              to="/"
              className={`transition-colors py-1 relative ${
                location.pathname === '/'
                  ? 'text-[#073567] dark:text-blue-400 font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#073567] dark:after:bg-blue-500 after:rounded-full'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400'
              }`}
            >
              Home
            </Link>
            {/* Officer Dashboard Link (Strictly for Govt Officers) */}
            {isAuthenticated && isOfficer && (
              <Link
                to="/dashboard"
                className={`transition-colors py-1 relative ${
                  location.pathname.startsWith('/dashboard')
                    ? 'text-[#073567] dark:text-blue-400 font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#073567] dark:after:bg-blue-500 after:rounded-full'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400'
                }`}
              >
                Dashboard
              </Link>
            )}

            {/* Document Vault & My Applications Link (Strictly for Commercial Bidders) */}
            {isAuthenticated && !isOfficer && (
              <>
                <Link
                  to="/bidder-dashboard"
                  className={`transition-colors py-1 relative ${
                    location.pathname === '/bidder-dashboard'
                      ? 'text-[#073567] dark:text-blue-400 font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#073567] dark:after:bg-blue-500 after:rounded-full'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400'
                  }`}
                >
                  Document Vault
                </Link>
                <Link
                  to="/my-applications"
                  className={`transition-colors py-1 relative ${
                    location.pathname === '/my-applications'
                      ? 'text-[#073567] dark:text-blue-400 font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#073567] dark:after:bg-blue-500 after:rounded-full'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400'
                  }`}
                >
                  My Applications
                </Link>
              </>
            )}

            <Link
              to="/tenders"
              className={`transition-colors py-1 relative ${
                location.pathname === '/tenders'
                  ? 'text-[#073567] dark:text-blue-400 font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#073567] dark:after:bg-blue-500 after:rounded-full'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400'
              }`}
            >
              Tenders
            </Link>
            <Link
              to="/#about"
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  scrollToSection('about');
                }
              }}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors py-1"
            >
              About
            </Link>
            <Link
              to="/#footer"
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  scrollToSection('footer');
                }
              }}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors py-1"
            >
              Contact
            </Link>
          </nav>

          {/* Right: Login / User Session Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Real-time Notification Bell for Authenticated Users */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationDropdownOpen((prev) => !prev)}
                  className={`relative p-2 rounded-xl transition cursor-pointer ${
                    notificationDropdownOpen
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                  title="Notifications"
                  aria-expanded={notificationDropdownOpen}
                  aria-haspopup="dialog"
                  aria-label={`Notifications (${navUnreadCount} unread)`}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {navUnreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative min-w-4 h-4 px-1 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white dark:border-[#181818] shadow-xs">
                        {navUnreadCount}
                      </span>
                    </span>
                  )}
                </button>

                <NotificationDropdown
                  isOpen={notificationDropdownOpen}
                  onClose={() => setNotificationDropdownOpen(false)}
                  notifications={navNotifications}
                  onMarkAllAsRead={handleMarkAllNavRead}
                  onMarkAsRead={handleMarkNavRead}
                  onDeleteNotification={handleDeleteNavNotif}
                  onNavigate={handleNavNotificationNavigate}
                />
              </div>
            )}

            {isAuthenticated ? (
              <div className="hidden sm:block relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-2 py-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer select-none text-left"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  {/* Circular Avatar matching PS icon in reference */}
                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#0a2e5c] dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xs sm:text-[13px] shadow-xs flex-shrink-0">
                    {initials}
                  </div>

                  {/* User Details (Desktop & Tablet) */}
                  <div className="hidden sm:flex flex-col text-left leading-none">
                    <span className="text-xs sm:text-[13px] font-bold text-[#0b2545] dark:text-white tracking-tight">
                      {displayName}
                    </span>
                    <span className="text-[10.5px] sm:text-[11px] text-[#476082] dark:text-slate-400 font-medium mt-0.5">
                      {displayRole}
                    </span>
                  </div>

                  {/* Chevron Down */}
                  <ChevronDown
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1b365d] dark:text-slate-300 transition-transform duration-200 ml-0.5 ${
                      userDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Card */}
                    <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#0a2e5c] dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {displayName}
                          </p>
                          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate">
                            {displayRole}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {user?.email || 'pooja.sharma@gem.gov.in'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200/50 dark:border-emerald-800/50 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {isOfficer ? 'Active Session • GeM Verified' : 'Vendor Session • Active'}
                      </div>
                    </div>

                    {/* Nav links */}
                    <div className="p-1 space-y-0.5">
                      {/* Officer Dashboard or Bidder Applications */}
                      {isOfficer ? (
                        <Link
                          to="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-lg transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#0a2e5c] dark:text-blue-400" />
                          <span>Dashboard</span>
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/bidder-dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-lg transition"
                          >
                            <LayoutDashboard className="w-4 h-4 text-[#0a2e5c] dark:text-blue-400" />
                            <span>Document Vault &amp; Bids</span>
                          </Link>
                          <Link
                            to="/my-applications"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-lg transition"
                          >
                            <FileText className="w-4 h-4 text-[#0a2e5c] dark:text-blue-400" />
                            <span>My Applications</span>
                          </Link>
                        </>
                      )}

                      {/* Settings */}
                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-lg transition"
                      >
                        <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    {/* Sign Out item */}
                    <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Login Button (Outline) */}
                <Link
                  to="/login"
                  className="px-3.5 sm:px-4 py-1.5 border border-[#073567] dark:border-blue-400 text-[#073567] dark:text-blue-300 hover:bg-blue-50/70 dark:hover:bg-blue-950/50 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Login
                </Link>

                {/* Get Started Button (Solid Navy) */}
                <Link
                  to="/signup"
                  className="hidden sm:inline-flex px-3.5 sm:px-4 py-1.5 bg-[#073567] hover:bg-[#05284f] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all hover:shadow-sm cursor-pointer"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition shrink-0 cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden max-h-[calc(100vh-var(--navbar-height,88px))] overflow-y-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 space-y-2 animate-in slide-in-from-top duration-150 shadow-xl">
            {isAuthenticated && (
              <div className="p-3 mb-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0a2e5c] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {initials}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {displayName}
                    </div>
                    <div className="text-[10.5px] text-[#476082] dark:text-slate-400 font-medium">
                      {displayRole}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            <div className="flex flex-col space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-1.5 px-3 rounded-lg transition ${
                  location.pathname === '/'
                    ? 'bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-700 dark:text-blue-400'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Home
              </Link>
              {isAuthenticated && isOfficer && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-1.5 px-3 rounded-lg transition ${
                    location.pathname === '/dashboard'
                      ? 'bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-700 dark:text-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Dashboard
                </Link>
              )}
              {isAuthenticated && !isOfficer && (
                <>
                  <Link
                    to="/bidder-dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-1.5 px-3 rounded-lg transition ${
                      location.pathname === '/bidder-dashboard'
                        ? 'bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-700 dark:text-blue-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Document Vault &amp; Bids
                  </Link>
                  <Link
                    to="/my-applications"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-1.5 px-3 rounded-lg transition ${
                      location.pathname === '/my-applications'
                        ? 'bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-700 dark:text-blue-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    My Applications
                  </Link>
                </>
              )}
              <Link
                to="/tenders"
                onClick={() => setMobileMenuOpen(false)}
                className={`py-1.5 px-3 rounded-lg transition ${
                  location.pathname === '/tenders'
                    ? 'bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-700 dark:text-blue-400'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {isOfficer ? 'Tenders & Compliance' : 'Tenders'}
              </Link>
              {isAuthenticated && isOfficer && (
                <Link
                  to="/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-1.5 px-3 rounded-lg transition ${
                    location.pathname === '/reports'
                      ? 'bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-700 dark:text-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Audit Reports
                </Link>
              )}
              {isAuthenticated && (
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-1.5 px-3 rounded-lg transition ${
                    location.pathname === '/settings'
                      ? 'bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-700 dark:text-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Settings
                </Link>
              )}
              <Link
                to="/#about"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (location.pathname === '/') {
                    e.preventDefault();
                    scrollToSection('about');
                  }
                }}
                className="text-left py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                About
              </Link>
              <Link
                to="/#footer"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (location.pathname === '/') {
                    e.preventDefault();
                    scrollToSection('footer');
                  }
                }}
                className="text-left py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Contact
              </Link>

              {!isAuthenticated && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 bg-[#073567] text-white text-xs font-bold rounded-lg"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Spacer to prevent page content from hiding behind the fixed navbar */}
      <div style={{ height: 'var(--navbar-height, 88px)' }} className="shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Accessible Screen Reader Information Modal */}
      <ScreenReaderModal
        isOpen={screenReaderOpen}
        onClose={() => setScreenReaderOpen(false)}
      />
    </>
  );
};

export default Navbar;

