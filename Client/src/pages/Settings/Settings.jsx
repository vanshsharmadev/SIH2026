import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  User,
  Bell,
  Sliders,
  Save,
  CheckCircle2,
  Lock,
  Building,
  Mail,
  FileBadge,
  Sparkles,
  AlertTriangle,
  FileText,
  Moon,
  Sun,
  Laptop,
  Globe,
  Check,
  X,
  ChevronDown,
  KeyRound,
  Smartphone,
  HelpCircle,
  Eye,
  AlertCircle,
  RefreshCw,
  Edit3,
  ExternalLink,
  MapPin,
  Clock,
  Shield,
  Loader2,
} from 'lucide-react';
import { useAuth, useTheme, useLanguage } from '../../context';
import { mlService, authService } from '../../services';

const nativeLanguages = [
  { code: 'en', label: 'English / अंग्रेज़ी' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
];

const Settings = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme, setIsDarkMode } = useTheme();
  const { currentLang, switchLanguage, languages } = useLanguage();

  const isOfficer =
    user?.role === 'Procurement Officer' ||
    user?.role === 'Govt Official' ||
    user?.role === 'Compliance Administrator' ||
    user?.role?.toLowerCase().includes('officer') ||
    user?.role?.toLowerCase().includes('admin') ||
    user?.email?.toLowerCase().endsWith('.gov.in') ||
    user?.email?.toLowerCase().endsWith('.nic.in') ||
    (user && !user.role?.toLowerCase().includes('bidder') && !user.role?.toLowerCase().includes('vendor'));

  const [activeTab, setActiveTab] = useState(isOfficer ? 'compliance' : 'profile');

  // Default fallback values
  const defaultSettings = {
    rule144xiStrict: true,
    miiThreshold50: true,
    cvcBlacklistAutoScan: true,
    anomalySensitivity: 'High',
    autoGenerateAuditLogs: true,
    emailAlertsForHighRisk: true,
    twoFactorApprovals: true,
    defaultExportFormat: 'PDF_CERTIFIED',
    sessionTimeoutMins: '30',
  };

  const defaultProfileData = {
    phone: '',
    altEmail: '',
    dispatchCity: '',
  };

  // Settings State - Hydrated from localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('gem_user_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Profile editable contact info - Hydrated from localStorage
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = localStorage.getItem('gem_user_profile');
      return saved ? { ...defaultProfileData, ...JSON.parse(saved) } : defaultProfileData;
    } catch {
      return defaultProfileData;
    }
  });

  // Save State Tracking
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState('Just now');
  const [saveAriaMessage, setSaveAriaMessage] = useState('All changes saved');

  // Modals & Confirmations
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [tempProfileData, setTempProfileData] = useState({ ...profileData });
  const [show2FAWarning, setShow2FAWarning] = useState(false);

  // Keyboard Escape listener for modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isEditProfileOpen) setIsEditProfileOpen(false);
        if (show2FAWarning) setShow2FAWarning(false);
      }
    };
    if (isEditProfileOpen || show2FAWarning) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditProfileOpen, show2FAWarning]);

  // Theme Segmented Mode: 'light', 'dark', 'system'
  const [themePreference, setThemePreference] = useState(() => {
    try {
      const saved = localStorage.getItem('site_theme_pref');
      if (saved) return saved;
      return isDarkMode ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  const handleThemeChange = (mode) => {
    setThemePreference(mode);
    try {
      localStorage.setItem('site_theme_pref', mode);
    } catch {
      // Ignore
    }

    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (setIsDarkMode) setIsDarkMode(prefersDark);
    } else if (mode === 'dark') {
      if (setIsDarkMode) setIsDarkMode(true);
    } else {
      if (setIsDarkMode) setIsDarkMode(false);
    }
    markDirty();
  };

  const markDirty = () => {
    setIsDirty(true);
    setSaveAriaMessage('You have unsaved changes');
  };

  const handleToggle = (key) => {
    if (key === 'twoFactorApprovals' && settings.twoFactorApprovals) {
      // Prompt confirmation before deactivating high-risk setting
      setShow2FAWarning(true);
      return;
    }
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    markDirty();
  };

  const confirmDisable2FA = () => {
    setSettings((prev) => ({ ...prev, twoFactorApprovals: false }));
    setShow2FAWarning(false);
    markDirty();
  };

  // ML Retraining & Token Diagnostics (POST /api/officer/tenders/ml/train-all & POST /api/officer/auth/verify-token)
  const [mlTrainLoading, setMlTrainLoading] = useState(false);
  const [mlTrainResult, setMlTrainResult] = useState(null);
  const [tokenVerifyLoading, setTokenVerifyLoading] = useState(false);
  const [tokenVerifyResult, setTokenVerifyResult] = useState(null);

  const handleTriggerRetraining = async () => {
    setMlTrainLoading(true);
    setMlTrainResult(null);
    try {
      const res = await mlService.triggerRetraining({ epochs: 10, learning_rate: 0.001 });
      setMlTrainResult({
        success: true,
        data: res,
        message: 'ML models successfully retrained and deployed across pipelines.',
      });
    } catch (err) {
      setMlTrainResult({
        success: false,
        message: err?.message || 'Retraining trigger failed.',
      });
    } finally {
      setMlTrainLoading(false);
    }
  };

  const handleVerifyOfficerToken = async () => {
    setTokenVerifyLoading(true);
    setTokenVerifyResult(null);
    try {
      const res = await authService.officerVerifyToken();
      setTokenVerifyResult({
        success: true,
        data: res,
        message: 'Cryptographic Officer Token is VALID & ACTIVE.',
      });
    } catch (err) {
      setTokenVerifyResult({
        success: false,
        message: err?.message || 'Token verification failed or session expired.',
      });
    } finally {
      setTokenVerifyLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    markDirty();
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveAriaMessage('Saving your changes...');

    try {
      localStorage.setItem('gem_user_settings', JSON.stringify(settings));
      localStorage.setItem('gem_user_profile', JSON.stringify(profileData));
    } catch (err) {
      console.warn('Failed to persist settings:', err);
    }

    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeString);
      setSaveAriaMessage('All changes saved successfully');
    }, 600);
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    const updated = { ...tempProfileData };
    setProfileData(updated);
    setIsEditProfileOpen(false);
    try {
      localStorage.setItem('gem_user_profile', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to persist profile:', err);
    }
    markDirty();
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto space-y-6 select-none animate-in fade-in duration-200">
      
      {/* Screen Reader ARIA Live Region */}
      <div aria-live="polite" className="sr-only">
        {saveAriaMessage}
      </div>

      {/* 1. BREADCRUMB & HEADER */}
      <div className="pb-4 border-b border-slate-200/90 dark:border-[#282828] space-y-3">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-blue-600 dark:hover:text-[#4da3ff] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-slate-200">Settings</span>
        </nav>

        {/* Title, Subtitle, Status & Action Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage your account, security, and portal preferences.
            </p>
          </div>

          {/* Right: Status Row & Save Button */}
          <div className="flex items-center gap-4 self-start md:self-auto">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-xs">
              {isSaving ? (
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-[#4da3ff] font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : isDirty ? (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Unsaved changes</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-[#38d39f] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>All changes saved</span>
                </div>
              )}
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
              <span className="text-slate-400 dark:text-slate-500 text-[11px] hidden sm:inline">
                Last saved: {lastSavedTime}
              </span>
            </div>

            {/* Save Button */}
            <button
              type="button"
              id="settings-save-button"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden ${
                isDirty
                  ? 'bg-[#073567] hover:bg-[#05284f] dark:bg-[#4da3ff] dark:hover:bg-[#3b82f6] text-white dark:text-slate-950 shadow-md hover:scale-[1.01]'
                  : 'bg-slate-100 dark:bg-[#202020] text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200/60 dark:border-[#2a2a2a]'
              }`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION */}
      {/* Mobile Select Dropdown (<768px) */}
      <div className="md:hidden">
        <label htmlFor="settings-tab-select" className="sr-only">
          Select Settings Section
        </label>
        <div className="relative">
          <select
            id="settings-tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full p-3 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#343434] text-slate-900 dark:text-white text-xs font-bold shadow-2xs appearance-none pr-10"
          >
            {isOfficer && <option value="compliance">GFR Compliance Engine</option>}
            <option value="profile">{isOfficer ? 'Officer Credentials' : 'Profile Information'}</option>
            <option value="security">Authentication & Security</option>
            <option value="preferences">System & Display Preferences</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Desktop Tabs (>=768px) */}
      <div className="hidden md:flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#181818] border border-slate-200/80 dark:border-[#2c2c2c] w-fit">
        {isOfficer && (
          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden ${
              activeTab === 'compliance'
                ? 'bg-[#17233f] dark:bg-[#20283e] text-white shadow-2xs border border-blue-500/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>GFR Compliance Engine</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden ${
            activeTab === 'profile'
              ? 'bg-[#17233f] dark:bg-[#20283e] text-white shadow-2xs border border-blue-500/50'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4 text-blue-400" />
          <span>{isOfficer ? 'Officer Credentials' : 'Profile Information'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden ${
            activeTab === 'security'
              ? 'bg-[#17233f] dark:bg-[#20283e] text-white shadow-2xs border border-blue-500/50'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 text-blue-400" />
          <span>Authentication & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden ${
            activeTab === 'preferences'
              ? 'bg-[#17233f] dark:bg-[#20283e] text-white shadow-2xs border border-blue-500/50'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>System & Display</span>
        </button>
      </div>

      {/* 3. TAB CONTENT PANELS */}

      {/* TAB 1: GFR COMPLIANCE ENGINE (Officer Only) */}
      {activeTab === 'compliance' && isOfficer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#282828]">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Autonomous Regulatory Screening Rules
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Automated GFR 2017 & CVC checks executed during Technical Evaluation Committee scrutiny.
                  </p>
                </div>
              </div>

              {/* Rule 1: Land Border */}
              <div
                onClick={() => handleToggle('rule144xiStrict')}
                className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/80 dark:border-[#2c2c2c] cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/60 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    <span>Rule 144(xi) Land Border Sharing Verification</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                      National Security Clause
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Mandates DPIIT registration check and self-declaration scrutiny for any bidder having beneficial ownership in countries sharing land borders with India.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Rule 144(xi) verification, ${settings.rule144xiStrict ? 'enabled' : 'disabled'}`}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.rule144xiStrict ? 'bg-[#073567] dark:bg-[#4da3ff]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      settings.rule144xiStrict ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Rule 2: Make In India */}
              <div
                onClick={() => handleToggle('miiThreshold50')}
                className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/80 dark:border-[#2c2c2c] cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/60 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    <span>Make in India (MII) Class-I 50% Threshold Check</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                      PPP-MII 2017
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Enforces local content calculation from cost auditor certificates for public purchases above ₹10 Crores.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Make in India check, ${settings.miiThreshold50 ? 'enabled' : 'disabled'}`}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.miiThreshold50 ? 'bg-[#073567] dark:bg-[#4da3ff]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      settings.miiThreshold50 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Rule 3: Debarment Registry */}
              <div
                onClick={() => handleToggle('cvcBlacklistAutoScan')}
                className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/80 dark:border-[#2c2c2c] cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/60 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    <span>CVC & GeM Debarment Automated Scraping</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                      Rule 151
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Live cross-check of Director DINs and Company PANs against the Central Debarment registry prior to qualification.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`CVC debarment scan, ${settings.cvcBlacklistAutoScan ? 'enabled' : 'disabled'}`}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.cvcBlacklistAutoScan ? 'bg-[#073567] dark:bg-[#4da3ff]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      settings.cvcBlacklistAutoScan ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* AI Model Sensitivity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-[#4da3ff]" />
                <span>AI Sensitivity Threshold</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Determines the strictness of NLP clause mismatch parsing for tender BOQ specifications.
              </p>

              <div className="space-y-2">
                {['Standard (Balanced)', 'High (Recommended for ₹50L+)', 'Ultra Strict (National Tenders)'].map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-[#303030] text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-[#202020] transition-colors"
                  >
                    <input
                      type="radio"
                      name="sensitivity"
                      checked={settings.anomalySensitivity === mode.split(' ')[0]}
                      onChange={() => handleSettingChange('anomalySensitivity', mode.split(' ')[0])}
                      className="accent-[#073567] dark:accent-[#4da3ff]"
                    />
                    <span className="text-slate-800 dark:text-slate-200">{mode}</span>
                  </label>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#282828] text-[11px] text-slate-400">
                Engine: <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">GeM-GFR-v4.2-Hybrid</span>
              </div>
            </div>

            {/* Verification Model Optimization */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Verification Model Optimization
                    </h3>
                    <p className="text-xs text-slate-500">
                      Continuous Model Improvement &amp; Compliance Calibration
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={mlTrainLoading}
                  onClick={handleTriggerRetraining}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {mlTrainLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sliders className="w-3.5 h-3.5" />
                  )}
                  <span>{mlTrainLoading ? 'Calibrating Models...' : 'Optimize Verification Models'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Synchronizes and calibrates all compliance verification models:
                DSC validation, GST taxpayer verification, GFR Rule 144(xi) classification, and anomaly checks.
              </p>
              {mlTrainResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    mlTrainResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <p className="font-bold">{mlTrainResult.message}</p>
                  {mlTrainResult.data && (
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                      Verification models and compliance parameters have been calibrated successfully.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE INFORMATION */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          
          {/* Identity Summary Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#073567] dark:bg-[#1a2948] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 border border-blue-400/20">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : (isOfficer ? 'PO' : 'BD')}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user?.name || (isOfficer ? 'Procurement Officer' : 'Authorized Bidder')}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-900/50">
                    {user?.role || (isOfficer ? 'Procurement Officer' : 'Bidder')}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-[#38d39f] font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isOfficer ? 'NIC-CA Officer Verified' : 'GeM GSTIN Verified'}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setTempProfileData({ ...profileData });
                setIsEditProfileOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#343434] bg-slate-50 dark:bg-[#202020] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#282828] text-xs font-bold transition shadow-2xs self-start sm:self-auto cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit profile</span>
            </button>
          </div>

          {/* Business Information (Explicit Read-Only & Verified Rows) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-[#282828]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isOfficer ? 'Government Authority Identification' : 'Business & Entity Information'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified registration details synchronized with Ministry of Corporate Affairs and GeM portal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Row 1: Signatory Name */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/70 dark:border-[#2a2a2a] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                    {isOfficer ? 'Authorized Official Name' : 'Authorized Signatory Name'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {user?.name || (isOfficer ? 'Procurement Officer' : 'Authorized Signatory')}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 dark:bg-[#2c2c2c] text-slate-600 dark:text-slate-400">
                  Read-only
                </span>
              </div>

              {/* Row 2: Registered Email */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/70 dark:border-[#2a2a2a] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                    {isOfficer ? 'Official Govt Email ID' : 'Registered Business Email'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {user?.email || (isOfficer ? 'officer@gem.gov.in' : 'bidder@gem-portal.gov.in')}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                  Verified
                </span>
              </div>

              {/* Row 3: Entity Name */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/70 dark:border-[#2a2a2a] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                    {isOfficer ? 'Assigned Ministry / Department' : 'Legal Business / Enterprise Name'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {isOfficer
                      ? (user?.ministry || 'Ministry Department')
                      : (user?.legalName || user?.organization || 'Registered Entity')}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                  Verified
                </span>
              </div>

              {/* Row 4: GSTIN / Designation */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/70 dark:border-[#2a2a2a] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                    {isOfficer ? 'Designation / Post' : 'GSTIN / Identification No.'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {isOfficer
                      ? (user?.designation || 'Procurement Official')
                      : (user?.gstNumber || '—')}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                  Verified
                </span>
              </div>

              {/* Row 5: Contact Phone */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/70 dark:border-[#2a2a2a] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                    Primary Contact Mobile
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {profileData.phone || '—'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  Verified OTP
                </span>
              </div>

              {/* Row 6: Dispatch Cluster */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/70 dark:border-[#2a2a2a] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                    Primary Dispatch & Operations Hub
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {profileData.dispatchCity || '—'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 dark:bg-[#2c2c2c] text-slate-600 dark:text-slate-400">
                  Editable
                </span>
              </div>
            </div>
          </div>

          {/* Verified Business Credential Card */}
          <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-[#1a2538] border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <FileBadge className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-950 dark:text-blue-100">
                  {isOfficer ? 'NIC Class-3 Digital Signature Certificate (DSC)' : 'GeM Registered Vendor Certificate'}
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                  Token ID: <span className="font-mono font-bold">{isOfficer ? 'GEM-DSC-2026-X889' : 'GEM-BIDDER-2026-V889'}</span> &bull; Valid through Dec 31, 2027
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] tracking-wider uppercase shadow-2xs">
                VERIFIED & ACTIVE
              </span>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: AUTHENTICATION & SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          
          {/* Security Header & Controls Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-[#282828] gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-[#4da3ff]" />
                  <span>Authentication & Security Controls</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Protect your account, enable cryptographic safeguards, and manage discrepancy alerts.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Last security audit: March 8, 2026</span>
              </div>
            </div>

            {/* 2FA Confirmation Warning Alert (If user clicked to disable) */}
            {show2FAWarning && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="text-xs font-bold text-red-900 dark:text-red-200">
                      Confirm Deactivation of Two-Factor Authentication
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                      Turning off 2FA will materially reduce protection for high-risk actions such as certifying bids, submitting financial offers, or withdrawing tender documents.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShow2FAWarning(false)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#202020] border border-slate-300 dark:border-[#383838] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
                      >
                        Keep 2FA Enabled
                      </button>
                      <button
                        type="button"
                        onClick={confirmDisable2FA}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-2xs"
                      >
                        Confirm Deactivation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Control 1: Two-Factor Authentication */}
            <div
              onClick={() => handleToggle('twoFactorApprovals')}
              className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/80 dark:border-[#2c2c2c] cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/60 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Two-Factor Authentication (2FA) for Tender Clearances
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    settings.twoFactorApprovals
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {settings.twoFactorApprovals ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Adds an OTP challenge to your registered mobile and Aadhaar-linked phone when certifying bids, submitting financial proposals, or revoking submissions.
                </p>
              </div>
              <button
                type="button"
                aria-label={`Two-factor authentication for tender clearance, ${settings.twoFactorApprovals ? 'enabled' : 'disabled'}`}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.twoFactorApprovals ? 'bg-[#073567] dark:bg-[#4da3ff]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    settings.twoFactorApprovals ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Control 2: High-Risk Discrepancy Alerts */}
            <div
              onClick={() => handleToggle('emailAlertsForHighRisk')}
              className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/80 dark:border-[#2c2c2c] cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/60 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    High-Risk Discrepancy & Compliance Alerts
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    settings.emailAlertsForHighRisk
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {settings.emailAlertsForHighRisk ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Notify registered business email immediately if an unusual tender discrepancy, restrictive clause, or high-confidence qualification risk is detected.
                </p>
              </div>
              <button
                type="button"
                aria-label={`High-risk discrepancy alerts, ${settings.emailAlertsForHighRisk ? 'enabled' : 'disabled'}`}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.emailAlertsForHighRisk ? 'bg-[#073567] dark:bg-[#4da3ff]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    settings.emailAlertsForHighRisk ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Control 3: Inactivity Session Timeout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200/80 dark:border-[#2c2c2c]">
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Portal Session Inactivity Timeout
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Automatically sign out if no user interaction is detected to protect tender confidentiality.
                </p>
              </div>
              <select
                value={settings.sessionTimeoutMins}
                onChange={(e) => handleSettingChange('sessionTimeoutMins', e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#383838] text-xs font-bold text-slate-900 dark:text-white shrink-0"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes (Recommended)</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>

          </div>

          {/* Active Session & Device Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200/80 dark:border-[#2a2a2a] flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Laptop className="w-4 h-4 text-blue-600 dark:text-[#4da3ff]" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Current Session: Chrome on Windows &bull; New Delhi, India
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  IP: 49.36.120.x &bull; Active Now &bull; Secured with TLS 1.3
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-[#38d39f]">
              This Device
            </span>
          </div>

          {/* Officer Token Diagnostic Tool (POST /api/officer/auth/verify-token) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Session Security &amp; Credential Validation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time Officer Session &amp; Authentication Check
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={tokenVerifyLoading}
                onClick={handleVerifyOfficerToken}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {tokenVerifyLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                <span>{tokenVerifyLoading ? 'Verifying Session...' : 'Verify Session Security'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Validates the active session against the signing authority, verifying authorization status and credentials.
            </p>
            {tokenVerifyResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  tokenVerifyResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                }`}
              >
                <p className="font-bold">{tokenVerifyResult.message}</p>
                {tokenVerifyResult.data && (
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Officer session authorization and credential validity confirmed.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 4: SYSTEM & DISPLAY (PREFERENCES) */}
      {activeTab === 'preferences' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/90 dark:border-[#303030] shadow-2xs space-y-6">
          <div className="pb-3 border-b border-slate-100 dark:border-[#282828]">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-[#4da3ff]" />
              <span>Interface & Regional Preferences</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure visual appearance, audit export defaults, and regional language preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Control 1: Segmented Theme Control */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#303030] space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {isDarkMode ? <Moon className="w-4 h-4 text-[#4da3ff]" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span>Portal Theme</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Choose between official daylight white, soft-black dark mode, or system automatic matching.
                </p>
              </div>

              {/* Segmented Control [Light] [Dark] [System] */}
              <div className="p-1 rounded-xl bg-slate-100 dark:bg-[#222222] border border-slate-200 dark:border-[#343434] grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    themePreference === 'light'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    themePreference === 'dark'
                      ? 'bg-[#181818] text-white shadow-xs border border-[#383838]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    themePreference === 'system'
                      ? 'bg-white dark:bg-[#181818] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* Control 2: Default Audit Export Format */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#303030] space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-[#4da3ff]" />
                  <span>Default Audit Export Format</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Standard format applied when exporting tender compliance dossiers for CAG or CVC vigilance audit.
                </p>
              </div>

              <div>
                <label htmlFor="audit-export-format-select" className="sr-only">
                  Audit Export Format
                </label>
                <select
                  id="audit-export-format-select"
                  value={settings.defaultExportFormat}
                  onChange={(e) => handleSettingChange('defaultExportFormat', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#383838] text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                >
                  <option value="PDF_CERTIFIED">Signed PDF (e-Sign Encrypted)</option>
                  <option value="EXCEL_AUDIT">Excel (.xlsx) with GFR Checklist</option>
                  <option value="JSON_SCHEMA">Machine-readable Audit Format (CVC Format)</option>
                </select>
              </div>
            </div>

            {/* Control 3: Portal Language with Native Labels */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#303030] space-y-3 flex flex-col justify-between notranslate" translate="no">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-[#4da3ff]" />
                  <span className="notranslate" translate="no">Portal Language</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Preferred official regional language for navigation labels and tender alerts.
                </p>
              </div>

              <div>
                <label htmlFor="portal-language-select" className="sr-only">
                  Portal Language
                </label>
                <select
                  id="portal-language-select"
                  value={currentLang}
                  onChange={(e) => {
                    switchLanguage(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#383838] text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs notranslate"
                  translate="no"
                >
                  {nativeLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="notranslate" translate="no">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. ACCESSIBLE EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsEditProfileOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-[#343434] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-[#282828]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600 dark:text-[#4da3ff]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Contact & Operational Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300">
                <p className="font-semibold leading-relaxed">
                  Notice: Statutory entity details (Legal Business Name, PAN, and GSTIN) cannot be altered here. Modifications require statutory re-KYC on the GeM portal.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Primary Mobile Contact (for OTP alerts)
                </label>
                <input
                  type="text"
                  value={tempProfileData.phone}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Alternate Notification Email ID
                </label>
                <input
                  type="email"
                  value={tempProfileData.altEmail}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, altEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Primary Dispatch & Operations Hub (City / State)
                </label>
                <input
                  type="text"
                  value={tempProfileData.dispatchCity}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, dispatchCity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-[#282828] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#343434] text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-[#242424] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#073567] hover:bg-[#05284f] dark:bg-[#4da3ff] dark:hover:bg-[#3b82f6] text-white dark:text-slate-950 font-bold transition shadow-xs"
                >
                  Save Profile Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
