import React, { useState } from 'react';
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
  Laptop
} from 'lucide-react';
import { useAuth, useTheme, useLanguage } from '../../context';

const Settings = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
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
  const [isSaved, setIsSaved] = useState(false);

  // Officer Preferences State
  const [settings, setSettings] = useState({
    rule144xiStrict: true,
    miiThreshold50: true,
    cvcBlacklistAutoScan: true,
    anomalySensitivity: 'High',
    autoGenerateAuditLogs: true,
    emailAlertsForHighRisk: true,
    twoFactorApprovals: true,
    defaultExportFormat: 'PDF_CERTIFIED',
    sessionTimeoutMins: '30',
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="w-full space-y-6 select-none animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span className="bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded font-mono text-[11px]">
              {isOfficer ? 'GeM Officer Control Center' : 'GeM Portal Preferences'}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Configuration Synchronized
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-[#0a2e5c] dark:text-blue-400" />
            <span>{isOfficer ? 'Officer Account & System Settings' : 'Account & Security Settings'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isOfficer
              ? 'Manage GFR 2017 regulatory screening parameters, e-Sign certificates, automated compliance sensitivity, and security controls.'
              : 'Manage your portal account, registered vendor profile, and notification preferences.'}
          </p>
        </div>

        {/* Save Status / Button */}
        <div className="flex items-center gap-3">
          {isSaved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-bold animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Settings Saved & Encrypted</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#073567] hover:bg-[#05284f] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {isOfficer && (
          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'compliance'
                ? 'border-[#073567] dark:border-blue-500 text-[#073567] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>GFR Compliance Engine</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-[#073567] dark:border-blue-500 text-[#073567] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{isOfficer ? 'Officer Credentials' : 'Profile Information'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeTab === 'security'
              ? 'border-[#073567] dark:border-blue-500 text-[#073567] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & 2FA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeTab === 'preferences'
              ? 'border-[#073567] dark:border-blue-500 text-[#073567] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>System & Display</span>
        </button>
      </div>

      {/* Tab 1: GFR Compliance Engine (Officer Only) */}
      {activeTab === 'compliance' && isOfficer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Autonomous Regulatory Screening Rules
                </h2>
              </div>

              {/* Rule 1: Land Border */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    <span>Rule 144(xi) Land Border Sharing Verification</span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400">
                      National Security Clause
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mandates DPIIT registration check and self-declaration scrutiny for any bidder having beneficial ownership in countries sharing land borders with India.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('rule144xiStrict')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.rule144xiStrict ? 'bg-[#073567] dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
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
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    <span>Make in India (MII) Class-I 50% Threshold Check</span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
                      PPP-MII 2017
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enforces local content calculation from cost auditor / statutory certificates for purchases above ₹10 Crores.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('miiThreshold50')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.miiThreshold50 ? 'bg-[#073567] dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
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
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    <span>CVC & GeM Debarment Scraping</span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                      Rule 151
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live cross-check of Director DINs and Company PANs against Central Debarment list before technical bid evaluation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('cvcBlacklistAutoScan')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.cvcBlacklistAutoScan ? 'bg-[#073567] dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
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

          {/* Right Column: AI Model Parameters */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>AI Sensitivity Threshold</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Determines strictness of natural language clause mismatch parsing for tender BOQ specifications.
              </p>

              <div className="space-y-2">
                {['Standard (Balanced)', 'High (Recommended for ₹50L+)', 'Ultra Strict (National Tenders)'].map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="radio"
                      name="sensitivity"
                      defaultChecked={mode.includes('High')}
                      className="accent-[#073567] dark:accent-blue-500"
                    />
                    <span className="text-slate-800 dark:text-slate-200">{mode}</span>
                  </label>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                Current Model: <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">GeM-GFR-v4.2-Hybrid</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Profile / Officer Credentials */}
      {activeTab === 'profile' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-[#0a2e5c] text-white flex items-center justify-center font-bold text-base shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PO'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.name || (isOfficer ? 'Officer Profile' : 'Commercial Vendor Profile')}
              </h2>
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <span>{user?.role || (isOfficer ? 'Procurement Officer' : 'Procurement Bidder')}</span>
                <span>&bull;</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isOfficer ? 'NIC-CA Verified' : 'GeM GSTIN Verified'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                {isOfficer ? 'Official Name' : 'Authorized Signatory Name'}
              </label>
              <input
                type="text"
                readOnly
                value={user?.name || 'Authorized User'}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                {isOfficer ? 'Registered Govt Email ID' : 'Registered Business Email'}
              </label>
              <input
                type="text"
                readOnly
                value={user?.email || (isOfficer ? 'officer@gem.gov.in' : 'vendor@company.com')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                {isOfficer ? 'Assigned Ministry / Department' : 'Legal Business / Enterprise Name'}
              </label>
              <input
                type="text"
                readOnly
                value={
                  isOfficer
                    ? (user?.ministry || 'Ministry of Commerce & Industry / GeM SPV')
                    : (user?.legalName || 'TechSolutions Bharat Pvt Ltd')
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                {isOfficer ? 'Designation / Post' : 'GSTIN / Identification No.'}
              </label>
              <input
                type="text"
                readOnly
                value={
                  isOfficer
                    ? (user?.designation || user?.role || 'Procurement Officer')
                    : (user?.gstNumber || '07AAAAA0000A1Z5')
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileBadge className="w-6 h-6 text-blue-700 dark:text-blue-400" />
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  {isOfficer ? 'NIC Class-3 Digital Signature Certificate (DSC)' : 'GeM Registered Vendor Certificate'}
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-400">
                  Token ID: <span className="font-mono">{isOfficer ? 'GEM-DSC-2026-X889' : 'GEM-BIDDER-2026-V889'}</span> &bull; Valid through Dec 2027
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500 text-white font-bold text-[10px]">
              VERIFIED
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Security & 2FA */}
      {activeTab === 'security' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Authentication & Signing Security
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Two-Factor Authentication for Tender Clearance
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sends an instant OTP to registered government mobile when certifying bids or disqualifying vendors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('twoFactorApprovals')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.twoFactorApprovals ? 'bg-[#073567] dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    settings.twoFactorApprovals ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Immediate High-Risk Discrepancy Email Alerts
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Notify instantly if an anomaly with confidence score {'>'} 90% is detected in a live tender.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('emailAlertsForHighRisk')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.emailAlertsForHighRisk ? 'bg-[#073567] dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    settings.emailAlertsForHighRisk ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System & Display */}
      {activeTab === 'preferences' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Interface & Regional Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isDarkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>Portal Theme</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch between standard government white theme and high-contrast dark theme.
              </p>
              <button
                type="button"
                onClick={toggleTheme}
                className="mt-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Toggle Mode: Currently {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs font-bold text-slate-900 dark:text-white">Default Audit Export Format</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format applied when downloading compliance reports for CAG submission.
              </p>
              <select
                value={settings.defaultExportFormat}
                onChange={(e) => setSettings({ ...settings, defaultExportFormat: e.target.value })}
                className="w-full mt-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="PDF_CERTIFIED">Signed PDF (e-Sign Encrypted)</option>
                <option value="EXCEL_AUDIT">Excel (.xlsx) with GFR Checklist</option>
                <option value="JSON_SCHEMA">Machine-readable JSON (CVC API)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
