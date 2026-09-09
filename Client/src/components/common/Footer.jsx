import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import NicLogo from './NicLogo';
import DigitalIndiaLogo from './DigitalIndiaLogo';
import AtmanirbharLogo from './AtmanirbharLogo';

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

const Footer = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // If not on landing page (e.g., Login, Signup), show compact clean footer
  if (!isLandingPage) {
    return (
      <footer className="shrink-0 w-full py-1.5 sm:py-2 border-t z-30 bg-white/95 backdrop-blur-sm border-slate-200 text-slate-700 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-[11px] sm:text-xs font-medium text-slate-700">
            <Link to="/" className="hover:text-blue-600 transition">
              Home
            </Link>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => alert('About GeM Compliflix: The official AI Bid Compliance Platform of the Government of India.')}
              className="hover:text-blue-600 transition cursor-pointer"
            >
              About
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => alert('Help & Support: 24x7 Government Procurement Helpdesk - 1800-111-999')}
              className="hover:text-blue-600 transition cursor-pointer"
            >
              Help & Support
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => alert('Privacy Policy: Standard Government of India digital data protection guidelines apply.')}
              className="hover:text-blue-600 transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => alert('Terms of Use: Terms and Conditions for GeM Compliflix platform access.')}
              className="hover:text-blue-600 transition cursor-pointer"
            >
              Terms of Use
            </button>
          </div>

          {/* Right: Designed, Developed and Maintained by + NIC Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-slate-600 text-[11px] sm:text-xs font-medium">
              Designed, Developed and Maintained by
            </span>
            <NicLogo className="h-6 sm:h-7" />
          </div>
        </div>
      </footer>
    );
  }

  // Full Rich Government Portal Footer for Landing Page
  return (
    <footer id="footer" className="w-full bg-[#071A2F] text-slate-300 select-none">
      {/* Upper Grid Area */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8">
          
          {/* Col 1: Brand & Gov Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/emblem.svg"
                alt="Emblem of India"
                className="h-10 w-auto object-contain brightness-0 invert opacity-90"
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-700/60 pb-1.5">
              Quick Links
            </h4>
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
                <Link to="/#about" className="hover:text-white transition">
                  Resources
                </Link>
              </li>
              <li>
                <Link to="/#about" className="hover:text-white transition">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Help & Support */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-700/60 pb-1.5">
              Help & Support
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => alert('FAQs: GeM Compliflix AI helps evaluate bids, technical parameters, and financial eligibility.')}
                  className="hover:text-white transition cursor-pointer"
                >
                  FAQs
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('User Guide: Step-by-step documentation for Department Buyers and Bidders.')}
                  className="hover:text-white transition cursor-pointer"
                >
                  User Guide
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Video Tutorials: Watch onboarding and tender upload guides.')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Video Tutorials
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Contact: support@gemcompliflix.gov.in')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Raise a Request: Helpdesk tickets are processed within 24 hours.')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Raise a Request
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-700/60 pb-1.5">
              Legal
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => alert('Privacy Policy: Personal Data Protection Act compliance.')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Terms of Use: Government Procurement guidelines apply.')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Terms of Use
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Disclaimer: This platform assists evaluation; final decisions rest with competent authorities.')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Disclaimer
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Accessibility: Conforms to WCAG 2.1 Level AA standards.')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Accessibility
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Sitemap: Complete index of portals, guidelines, and APIs.')}
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
                <span className="text-[11px]">1800-123-4567 (Toll Free)</span>
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

      {/* Lower Copyright Bar */}
      <div className="border-t border-slate-800 bg-[#051322] py-4 text-xs text-slate-500">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 GeM Compliflix. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">सत्यमेव जयते</span>
            <span className="text-slate-600">|</span>
            <span>Government of India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
