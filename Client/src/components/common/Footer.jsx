import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  ShieldCheck,
  HelpCircle,
  Info,
  FileText,
  X,
  Lock,
  Scale,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import NicLogo from './NicLogo';
import DigitalIndiaLogo from './DigitalIndiaLogo';
import AtmanirbharLogo from './AtmanirbharLogo';
import logoGemVariant from '../../assets/logo_gem_variant.png';

const LinkedinIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 0 0 1.66-1.66 1.66 1.66 0 0 0-1.66-1.65 1.66 1.66 0 0 0-1.66 1.65c0 .92.74 1.66 1.66 1.66m1.39 9.74v-8.37H5.07v8.37h2.78z" />
  </svg>
);

const TwitterIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YoutubeIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const FacebookIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// Informational Modal for Footer Links
const FooterInfoModal = ({ topic, onClose }) => {
  useEffect(() => {
    if (!topic) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [topic, onClose]);

  if (!topic) return null;

  const contentMap = {
    about: {
      title: 'About GeM Compliflix',
      subtitle: 'Government of India AI-Powered Procurement & Compliance Verification Platform',
      icon: Building2,
      badge: 'Official Platform Overview',
      body: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-white font-semibold">GeM Compliflix</strong> is an advanced AI-driven procurement compliance verification platform designed for public procurement across central ministries, state departments, and autonomous bodies under the Government of India.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-2 font-semibold text-emerald-400 text-xs mb-1">
                <ShieldCheck className="w-4 h-4" /> AI Pre-Screening
              </div>
              <p className="text-[12px] text-slate-400">
                Automated document parsing, GST/PAN validation, financial turnover verification, and blacklisting cross-checks.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-2 font-semibold text-blue-400 text-xs mb-1">
                <CheckCircle2 className="w-4 h-4" /> Transparent Evaluation
              </div>
              <p className="text-[12px] text-slate-400">
                Tamper-evident audit trails adhering strictly to the General Financial Rules (GFR 2017) and CVC procurement guidelines.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-950/25 border border-emerald-800/40 text-[12px] text-emerald-300/90">
            <span className="font-semibold text-emerald-300">Statutory Alignment: </span>
            Engineered in alignment with the GeM SPV standards, National Informatics Centre (NIC) data security parameters, and the Ministry of Commerce & Industry guidelines.
          </div>
        </div>
      ),
    },
    help: {
      title: 'Help & 24x7 Support Desk',
      subtitle: 'Official assistance for Department Buyers, Evaluation Officers, and Commercial Bidders',
      icon: HelpCircle,
      badge: 'National Helpdesk Service',
      body: (  
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            The GeM Compliflix Helpdesk provides round-the-clock technical and functional assistance for bid submission, document verification, and compliance assessment.
          </p>
          <div className="space-y-2.5">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-900/40 text-blue-400 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Toll-Free National Helpdesk</div>
                  <div className="text-[11px] text-slate-400">24x7 Interactive Voice & Support</div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-400">1800-111-999 / 1800-102-3436</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-900/40 text-emerald-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Official Support Email</div>
                  <div className="text-[11px] text-slate-400">SLA: Response within 24 business hours</div>
                </div>
              </div>
              <div className="text-xs font-mono font-medium text-slate-300">support@gemcompliflix.gov.in</div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[12px] text-slate-400">
            <strong className="text-slate-200">Helpdesk Timings: </strong>
            Portal navigation & AI checks available 24x7x365. Officer grievance assistance available Monday through Saturday, 09:00 AM to 06:00 PM IST.
          </div>
        </div>
      ),
    },
    privacy: {
      title: 'Privacy Policy & Data Security',
      subtitle: 'Statutory compliance under the Digital Personal Data Protection (DPDP) Act, 2023',
      icon: Lock,
      badge: 'Data Protection Notice',
      body: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            The Government of India is committed to safeguarding organizational and personal data submitted through GeM Compliflix.
          </p>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-white">Confidential Document Processing: </strong>
                All financial balance sheets, ITR filings, and proprietary technical credentials uploaded by bidders are encrypted in transit via TLS 1.3 and at rest via AES-256 GCM encryption.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-white">Authorized Access Only: </strong>
                Bids and financial bids remain encrypted and are accessible solely by designated Technical and Financial Evaluation Committee officers upon designated bid opening timelines.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-white">Zero Third-Party Commercial Sharing: </strong>
                Bidder data is processed strictly for tender qualification evaluation and is never commodified or shared with private analytics entities.
              </span>
            </li>
          </ul>
          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[12px] text-blue-300/90">
            For data privacy inquiries, contact the Data Protection Officer (DPO) at <span className="font-mono text-white">dpo@gemcompliflix.gov.in</span>.
          </div>
        </div>
      ),
    },
    terms: {
      title: 'Terms of Use & Code of Conduct',
      subtitle: 'Guidelines governing procurement portal access and bid submission integrity',
      icon: Scale,
      badge: 'Legal & GTC Compliance',
      body: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            By accessing or submitting bids through GeM Compliflix, participating bidders and department buyers agree to adhere to the following mandatory conditions:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-white">Authenticity of Submissions: </strong>
                Bidders affirm that all submitted licenses, experience certificates, and GST returns are genuine. Submission of fabricated documents invites debarment under Rule 151 of GFR 2017.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-white">AI Evaluation Role: </strong>
                AI pre-checks serve as automated evaluative aids. The final determination of qualification remains vested with the authorized Tender Committee.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-white">System Fair Use: </strong>
                Automated crawling, unauthorized security probing, or injection attempts will trigger automated cyber forensics logging and IP blacklisting.
              </span>
            </li>
          </ul>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[12px] text-slate-400">
            Subject to the exclusive jurisdiction of the Courts in New Delhi, India.
          </div>
        </div>
      ),
    },
    faqs: {
      title: 'Frequently Asked Questions (FAQs)',
      subtitle: 'Common inquiries regarding bid eligibility, AI checks, and submission protocols',
      icon: HelpCircle,
      badge: 'Knowledge Base',
      body: (
        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-semibold text-white mb-1">Q: How does the AI Pre-Checker determine compliance?</div>
            <p className="text-slate-400">
              The AI verifies your uploaded technical specs against the tender BOQ, checks ISO/BIS certification validity, validates active GST registration, and calculates 3-year average turnover.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-semibold text-white mb-1">Q: Can I update my documents after submission?</div>
            <p className="text-slate-400">
              Documents can be revised up until the bid submission deadline. Once the bid opening timestamp passes, no modifications are permitted.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-semibold text-white mb-1">Q: What should I do if an AI check indicates non-compliance?</div>
            <p className="text-slate-400">
              Review the detailed line-item discrepancy highlighted in the Document Vault, attach clarifying annexures, and re-run the verification before final submission.
            </p>
          </div>
        </div>
      ),
    },
    'user-guide': {
      title: 'User Documentation & Guidelines',
      subtitle: 'Step-by-step instructions for bidders and procurement departments',
      icon: FileText,
      badge: 'Manuals & Guides',
      body: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            Access comprehensive manuals covering step-by-step platform navigation:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="font-medium text-white">Commercial Bidder Quick Start Guide (v2.4)</span>
              <span className="text-emerald-400 font-medium">PDF (2.1 MB)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="font-medium text-white">Tender Evaluation Committee Handbook (GFR 2017)</span>
              <span className="text-emerald-400 font-medium">PDF (3.8 MB)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="font-medium text-white">Document Vault & Cryptographic Verification Guide</span>
              <span className="text-emerald-400 font-medium">PDF (1.5 MB)</span>
            </div>
          </div>
        </div>
      ),
    },
    disclaimer: {
      title: 'Official Legal Disclaimer',
      subtitle: 'Scope of automated assistance and statutory procurement authorities',
      icon: Info,
      badge: 'Legal Notice',
      body: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            GeM Compliflix is an AI-assisted evaluation support system. While every precaution is taken to ensure absolute accuracy of verification rules, the platform outputs constitute evaluative recommendations.
          </p>
          <p className="text-slate-400 text-xs">
            Final decisions regarding bidder qualification, technical acceptability, price bid opening, and award of contract rest solely with the Competent Financial Authority (CFA) designated by the procuring entity under the Government of India.
          </p>
        </div>
      ),
    },
    accessibility: {
      title: 'Accessibility Statement',
      subtitle: 'Conformance to Guidelines for Indian Government Websites (GIGW) and WCAG 2.1 AA',
      icon: ShieldCheck,
      badge: 'Digital Inclusion',
      body: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            GeM Compliflix is designed to be accessible to all users, including persons with disabilities, complying with the <strong className="text-white">Guidelines for Indian Government Websites (GIGW)</strong> and <strong className="text-white">WCAG 2.1 Level AA</strong> standards.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li>• High-contrast color palette and font scaling tools</li>
            <li>• Full keyboard navigation across all interactive elements</li>
            <li>• Built-in speech screen reader and text-to-speech assistant</li>
            <li>• Descriptive alt text on all logos and informational badges</li>
          </ul>
        </div>
      ),
    },
    sitemap: {
      title: 'Portal Sitemap & Directory',
      subtitle: 'Complete index of GeM Compliflix modules and public links',
      icon: FileText,
      badge: 'Index',
      body: (
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div>
            <div className="font-semibold text-emerald-400 mb-2">Public Portals</div>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/" onClick={onClose} className="hover:text-white">Home / Landing Page</Link></li>
              <li><Link to="/tenders" onClick={onClose} className="hover:text-white">Active Tenders Search</Link></li>
              <li><Link to="/login" onClick={onClose} className="hover:text-white">Secure Officer / Bidder Login</Link></li>
              <li><Link to="/signup" onClick={onClose} className="hover:text-white">Bidder Registration Portal</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-blue-400 mb-2">Bidder Workspaces</div>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/bidder-dashboard" onClick={onClose} className="hover:text-white">Bidder Overview Dashboard</Link></li>
              <li><Link to="/bidder-dashboard?tab=vault" onClick={onClose} className="hover:text-white">Digital Document Vault</Link></li>
              <li><Link to="/bidder-dashboard?tab=matches" onClick={onClose} className="hover:text-white">Matched Tenders</Link></li>
              <li><Link to="/bidder-dashboard?tab=checker" onClick={onClose} className="hover:text-white">AI Bid Pre-Checker</Link></li>
            </ul>
          </div>
        </div>
      ),
    },
  };

  const activeContent = contentMap[topic] || contentMap.about;
  const IconComponent = activeContent.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="footer-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl bg-[#071a2f] dark:bg-[#181818] border border-[#1e3a5f] dark:border-[#343434] shadow-2xl text-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 dark:border-[#303030] bg-[#051426] dark:bg-[#141414] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="footer-modal-title" className="text-base font-bold text-white tracking-tight">
                  {activeContent.title}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {activeContent.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeContent.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-5 overflow-y-auto flex-1 custom-scrollbar">
          {activeContent.body}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800/90 bg-[#04101e] flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Government of India • GeM Compliflix</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Footer = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const [modalTopic, setModalTopic] = useState(null);

  // Compact Government Footer for Internal, Auth, and Dashboard Pages
  // On login/signup, applies an elegant glassmorphic backdrop to blend with Rashtrapati Bhavan panorama
  if (!isLandingPage) {
    return (
      <>
        <footer
          id="portal-footer"
          className={`shrink-0 w-full mt-auto z-30 py-2 sm:py-2.5 select-none transition-colors duration-200 ${
            isAuthPage
              ? 'bg-[#071322]/85 dark:bg-[#121212]/90 backdrop-blur-md border-t border-white/10 dark:border-white/10 text-slate-200 shadow-[0_-2px_12px_rgba(0,0,0,0.35)]'
              : 'bg-[#071A2F] dark:bg-[#181818] border-t border-[#1E3A5F]/75 dark:border-[#303030] text-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.25)]'
          }`}
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            {/* Left Links */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5 text-[11px] sm:text-xs font-medium text-slate-300 dark:text-slate-300">
              <Link
                to="/"
                className="hover:text-emerald-400 focus:outline-none focus:text-emerald-400 transition-colors"
              >
                Home
              </Link>
              <span className="text-white/25 select-none" aria-hidden="true">
                &bull;
              </span>
              <button
                type="button"
                onClick={() => setModalTopic('about')}
                className="hover:text-emerald-400 focus:outline-none focus:text-emerald-400 transition-colors cursor-pointer"
              >
                About
              </button>
              <span className="text-white/25 select-none" aria-hidden="true">
                &bull;
              </span>
              <button
                type="button"
                onClick={() => setModalTopic('help')}
                className="hover:text-emerald-400 focus:outline-none focus:text-emerald-400 transition-colors cursor-pointer"
              >
                Help & Support
              </button>
              <span className="text-white/25 select-none" aria-hidden="true">
                &bull;
              </span>
              <button
                type="button"
                onClick={() => setModalTopic('privacy')}
                className="hover:text-emerald-400 focus:outline-none focus:text-emerald-400 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-white/25 select-none" aria-hidden="true">
                &bull;
              </span>
              <button
                type="button"
                onClick={() => setModalTopic('terms')}
                className="hover:text-emerald-400 focus:outline-none focus:text-emerald-400 transition-colors cursor-pointer"
              >
                Terms of Use
              </button>
            </div>

            {/* Right: Designed, Developed and Maintained by + NIC Logo */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="text-slate-300/90 text-[11px] sm:text-xs font-normal tracking-tight">
                Designed, Developed and Maintained by
              </span>
              <NicLogo className="h-5 sm:h-5.5 brightness-110" />
            </div>
          </div>
        </footer>

        <FooterInfoModal topic={modalTopic} onClose={() => setModalTopic(null)} />
      </>
    );
  }

  // Full Rich Government Portal Footer for Landing Page
  return (
    <>
      <footer id="footer" className="w-full bg-[#071A2F] text-slate-300 select-none mt-auto">
        {/* Upper Grid Area */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8">
            
            {/* Col 1: Brand & Gov Info */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoGemVariant}
                  alt="GeM Compliflix"
                  className="h-10 w-auto object-contain shrink-0"
                />
                <div>
                  <div className="text-xl font-black tracking-tight leading-none text-white">
                    <span>GeM</span>
                    <span className="text-[#34D399] ml-0.5"> Compliflix</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    Compliant Procurement. Stronger India.
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                An official initiative by the Government of India to bring AI-powered transparency,
                rigorous compliance verification, and efficiency to public procurement.
              </p>

              <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>A Government of India Initiative</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-700/60 pb-1.5">
                Quick Links
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="/" className="hover:text-white transition">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/tenders" className="hover:text-white transition">
                    Tenders
                  </Link>
                </li>
                <li>
                  <Link to="/#how-it-works" className="hover:text-white transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/#why-choose" className="hover:text-white transition">
                    For Departments
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('user-guide')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Resources
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('about')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    About
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Help & Support */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-700/60 pb-1.5">
                Help & Support
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('faqs')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    FAQs
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('user-guide')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    User Guide
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('help')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('help')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Raise a Request
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Legal */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-700/60 pb-1.5">
                Legal
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('privacy')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('terms')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Terms of Use
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('disclaimer')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Disclaimer
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('accessibility')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Accessibility
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setModalTopic('sitemap')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Sitemap
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 5: Connect With Us + National Logos */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-700/60 pb-1.5">
                Connect With Us
              </h4>

              {/* Social Icons */}
              <div className="flex items-center gap-2">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center text-slate-300 hover:text-white transition"
                  aria-label="LinkedIn"
                >
                  <LinkedinIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
                  aria-label="Twitter"
                >
                  <TwitterIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-600 flex items-center justify-center text-slate-300 hover:text-white transition"
                  aria-label="YouTube"
                >
                  <YoutubeIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-blue-700 flex items-center justify-center text-slate-300 hover:text-white transition"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Direct Contact Info */}
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-[11px]">support@gemcompliflix.gov.in</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px]">1800-111-999 (Toll Free)</span>
                </div>
              </div>

              {/* National Initiative Badges */}
              <div className="pt-2 flex items-center gap-4">
                <DigitalIndiaLogo variant="white" showTagline={false} />
                <AtmanirbharLogo variant="white" />
              </div>
            </div>

          </div>
        </div>

        {/* Lower Copyright & NIC Attribution Bar */}
        <div className="border-t border-slate-800/80 dark:border-[#303030] bg-[#051322] dark:bg-[#141414] py-3 text-xs text-slate-400 select-none">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] sm:text-xs">
              <span>&copy; 2026 GeM Compliflix. All rights reserved.</span>
              <span className="text-slate-600">|</span>
              <span className="font-medium text-slate-300">सत्यमेव जयते</span>
              <span className="text-slate-600">|</span>
              <span>Government of India</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="text-slate-400 text-[11px] sm:text-xs font-normal tracking-tight">
                Designed, Developed and Maintained by
              </span>
              <NicLogo className="h-5 sm:h-6" />
            </div>
          </div>
        </div>
      </footer>

      <FooterInfoModal topic={modalTopic} onClose={() => setModalTopic(null)} />
    </>
  );
};

export default Footer;
