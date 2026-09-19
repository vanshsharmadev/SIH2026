import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Landmark,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Building,
  Phone,
  FileCheck,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import TricolorBar from '../../components/common/TricolorBar';
import OtpVerificationCard from './OtpVerificationCard';
import { authService } from '../../services';
import { isCustomBackendConfigured } from '../../services/api';

const SignupCard = ({ onSwitchToSignIn, onPendingVerification }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('select_role'); // 'select_role' | 'form'
  const [role, setRole] = useState('bidder'); // 'bidder' | 'officer'

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: '',
    organizationName: '',
    ministry: '',
    email: '',
    phone: '',
    gstin: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
    declaration: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Email OTP Verification State
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpResendCountdown, setOtpResendCountdown] = useState(60);
  const [otpError, setOtpError] = useState(null);

  // OTP resend countdown effect
  useEffect(() => {
    let timer;
    if (step === 'verify_email' && otpResendCountdown > 0) {
      timer = setInterval(() => {
        setOtpResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpResendCountdown]);

  // Recalculate Lenis scroll bounds when switching between registration steps
  useEffect(() => {
    if (window.lenis) {
      window.lenis.resize();
    }
  }, [step, role]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep('form');
    setErrors({});
  };

  // ===========================================================================
  // FEATURE: Form Validation (Allows standard email domains for all roles)
  // ===========================================================================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required.';
    } else if (!/^\+?[0-9]{10,13}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    if (role === 'bidder') {
      if (!formData.organizationName.trim()) {
        newErrors.organizationName = 'Company / Organization name is required.';
      }
      if (!formData.gstin.trim()) {
        newErrors.gstin = 'GSTIN or Business PAN is required.';
      }
      if (!formData.agreedToTerms) {
        newErrors.agreedToTerms = 'You must agree to the Terms of Service.';
      }
    } else if (role === 'officer') {
      if (!formData.ministry.trim()) {
        newErrors.ministry = 'Ministry / Department name is required.';
      }
      if (!formData.declaration) {
        newErrors.declaration = 'You must confirm the official authorization declaration.';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    const pendingPayload = role === 'bidder' ? {
      legalName: formData.organizationName || formData.fullName,
      panNumber: formData.gstin && formData.gstin.length >= 12 ? formData.gstin.substring(2, 12).toUpperCase() : '',
      gstNumber: formData.gstin,
      udyamNumber: '',
      registrationNumber: 'REG-' + Date.now(),
      email: formData.email,
      phone: formData.phone,
      address: 'India',
      password: formData.password,
    } : {
      name: formData.fullName,
      email: formData.email,
      mobile: formData.phone,
      officerId: 'GOV-' + Date.now().toString().slice(-6),
      ministry: formData.ministry || 'Government of India',
      designation: 'Procurement Officer',
      password: formData.password,
    };

    if (isCustomBackendConfigured()) {
      try {
        if (role === 'bidder') {
          const res = await authService.bidderSignup(pendingPayload);
          // Trigger OTP dispatch for bidder
          try {
            await authService.resendOtp({ email: formData.email, role: 'bidder' });
          } catch (otpErr) {
            console.warn('Bidder OTP dispatch notice:', otpErr.message);
          }
        } else {
          const res = await authService.officerSignup(pendingPayload);
          const tempToken =
            res?.data?.tempToken || res?.tempToken || sessionStorage.getItem('tempToken');
          if (tempToken) {
            await authService.verifyDigiLocker(tempToken, { simulatedName: formData.fullName });
          }
        }
      } catch (err) {
        setIsLoading(false);
        const isConflict =
          err.status === 409 ||
          String(err.message || '').toLowerCase().includes('already registered');
        const serverMsg = isConflict
          ? 'An account with this Email, GSTIN, or Identity is already registered. Please sign in.'
          : (err.response?.data?.message || err.message || 'Registration failed. Please check your credentials and try again.');
        setErrors((prev) => ({
          ...prev,
          form: serverMsg,
        }));
        return;
      }
    }

    setIsLoading(false);

    if (onPendingVerification) {
      onPendingVerification({
        email: formData.email,
        role,
        pendingUser: pendingPayload,
      });
    } else {
      setStep('verify_email');
      setOtpResendCountdown(60);
      setOtpError(null);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    const otpCode = emailOtp.join('');
    if (otpCode.length < 6) {
      setOtpError('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    if (isCustomBackendConfigured()) {
      try {
        await authService.verifyOtp({ email: formData.email, otp: otpCode, role });
      } catch (err) {
        setIsVerifyingOtp(false);
        setOtpError(err.message || 'Invalid or expired verification code. Please check and try again.');
        return;
      }
    }

    // Success response
    setTimeout(() => {
      setIsVerifyingOtp(false);
      setRegistrationSuccess(true);
      setTimeout(() => {
        if (onSwitchToSignIn) onSwitchToSignIn();
      }, 2200);
    }, 800);
  };

  const handleResendEmailOtp = async () => {
    if (otpResendCountdown > 0) return;
    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      if (isCustomBackendConfigured()) {
        await authService.resendOtp({ email: formData.email, role });
      }
      setOtpResendCountdown(60);
    } catch (err) {
      setOtpError(err.message || 'Failed to resend verification OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <>
      {/* ----------------- STEP 1: ROLE SELECTION (MATCHES SCREENSHOT) ----------------- */}
      {step === 'select_role' && (
        <div className="w-full max-w-[590px] mx-auto rounded-2xl transition-all duration-300 p-5 sm:p-7 relative z-20 bg-white dark:bg-[#181818] border border-slate-100 dark:border-[#303030] shadow-xl text-slate-900 dark:text-slate-100">
          
          {/* Top-Left Tricolor Bar */}
          <div className="mb-3">
            <TricolorBar className="w-12 h-1" />
          </div>

          {/* Heading */}
          <div className="mb-4 text-center sm:text-left">
            <h2 className="text-xl sm:text-[23px] font-extrabold tracking-tight text-slate-900">
              Create your GeM Compliflix account
            </h2>
            <p className="text-xs sm:text-[13px] mt-1 font-medium text-slate-500">
              Choose your account type to get started
            </p>
          </div>

          {/* Dual Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 my-4">
            
            {/* 1. Bidder Card */}
            <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-white dark:bg-slate-900/60 p-4 sm:p-4.5 flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition-all group">
              <div>
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
                  <Briefcase className="w-5 h-5 stroke-[2]" />
                </div>

                {/* Title & Desc */}
                <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white text-center">
                  I'm a Bidder
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-1 mb-3 leading-snug min-h-[32px]">
                  Submit bids, manage documents and track compliance status.
                </p>

                {/* Feature Checklist */}
                <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Search and view tenders</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Upload and manage bids</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Check compliance with AI</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Track submission status</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleRoleSelect('bidder')}
                className="w-full mt-4 py-2 px-3 bg-[#0c396d] hover:bg-[#082b54] active:scale-[0.99] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm transition cursor-pointer"
              >
                <span>Continue as Bidder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Government Officer Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-4.5 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all group">
              <div>
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-2.5 border border-blue-100 dark:border-blue-900 group-hover:scale-105 transition-transform">
                  <Landmark className="w-5 h-5 stroke-[2]" />
                </div>

                {/* Title & Desc */}
                <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white text-center">
                  I'm a Government Officer
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-1 mb-3 leading-snug min-h-[32px]">
                  Evaluate bids, verify compliance and manage tenders.
                </p>

                {/* Feature Checklist */}
                <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Review and evaluate bids</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>AI-powered compliance checks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Manage tender lifecycle</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Generate reports and insights</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleRoleSelect('officer')}
                className="w-full mt-4 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.99] border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Continue as Officer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* OR Divider */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            <span className="absolute px-2 text-[9.5px] uppercase tracking-wider font-semibold bg-white dark:bg-[#181818] text-slate-400">
              OR
            </span>
          </div>

          {/* Bottom Switch to Sign In */}
          <div className="text-center pt-1">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
            </span>
            <Link
              to="/login"
              onClick={(e) => {
                if (onSwitchToSignIn) {
                  e.preventDefault();
                  onSwitchToSignIn();
                }
              }}
              className="text-xs font-semibold text-[#0c396d] dark:text-blue-400 hover:underline transition cursor-pointer"
            >
              Sign In
            </Link>
          </div>

        </div>
      )}

      {/* ----------------- STEP 2: REGISTRATION FORM FIELDS ----------------- */}
      {step === 'form' && (
        <div className="w-full max-w-[560px] mx-auto rounded-2xl transition-all duration-300 p-5 sm:p-6 relative z-20 bg-white dark:bg-[#181818] border border-slate-100 dark:border-[#303030] shadow-xl text-slate-900 dark:text-slate-100">
          
          {/* Top Header Controls (Back button & Role Switcher) */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setStep('select_role');
                setErrors({});
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to role selection</span>
            </button>

            {/* Quick Role Switcher Pill */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10.5px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setRole('bidder');
                  setErrors({});
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  role === 'bidder'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Bidder
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('officer');
                  setErrors({});
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  role === 'officer'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Govt Officer
              </button>
            </div>
          </div>

          {/* Form Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <TricolorBar className="w-9 h-1 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  {role === 'bidder' ? 'Commercial Bidder Account' : 'Official Government Onboarding'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {role === 'bidder' ? 'Register as a Bidder' : 'Register as a Government Officer'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {role === 'bidder'
                  ? 'Enter company & authorized representative details'
                  : 'Official government credentials required for portal access'}
              </p>
            </div>
          </div>

          {/* Success Notification */}
          {registrationSuccess ? (
            <div className="my-6 p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                Registration Successful!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-sm mx-auto mb-4">
                Your {role === 'bidder' ? 'Bidder' : 'Government Officer'} account has been initiated. You will now be redirected to sign in.
              </p>
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="py-1.5 px-4 bg-[#0c396d] hover:bg-[#082b54] text-white text-xs font-semibold rounded-md transition cursor-pointer"
              >
                Proceed to Sign In
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-2.5">
              
              {errors.form && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold leading-relaxed">{errors.form}</p>
                    {(errors.form.includes('already registered') ||
                      errors.form.includes('already exists') ||
                      errors.form.includes('Please sign in')) && (
                      <button
                        type="button"
                        onClick={onSwitchToSignIn}
                        className="mt-1.5 text-[11.5px] font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Click here to Sign In with this account</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 2-Column Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-700 dark:text-slate-300">
                    {role === 'bidder' ? 'Authorized Person Name' : 'Full Name (as per Govt ID)'} <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder={role === 'bidder' ? 'e.g. Rahul Sharma' : 'e.g. Dr. Rajesh Kumar'}
                      className={`w-full pl-8 pr-2.5 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 ${
                        errors.fullName ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {errors.fullName && <p className="text-[9.5px] mt-0.5 text-rose-600">{errors.fullName}</p>}
                </div>

                {/* Second Column in Row 1: Company Name (Bidder) or Ministry / Department (Officer) */}
                {role === 'bidder' ? (
                  <div>
                    <label className="block text-[11px] font-semibold mb-0.5 text-slate-700 dark:text-slate-300">
                      Company / Organization Name <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        placeholder="e.g. Apex Infotech Ltd"
                        className={`w-full pl-8 pr-2.5 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 ${
                          errors.organizationName ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {errors.organizationName && <p className="text-[9.5px] mt-0.5 text-rose-600">{errors.organizationName}</p>}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold mb-0.5 text-slate-700 dark:text-slate-300">
                      Ministry / Department <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={formData.ministry}
                        onChange={(e) => handleInputChange('ministry', e.target.value)}
                        placeholder="e.g. Ministry of Finance"
                        className={`w-full pl-8 pr-2.5 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 ${
                          errors.ministry ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {errors.ministry && <p className="text-[9.5px] mt-0.5 text-rose-600">{errors.ministry}</p>}
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-700 dark:text-slate-300">
                    {role === 'bidder' ? 'Official Business Email' : 'Official Govt Email'} <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={role === 'bidder' ? 'officer@company.com' : 'officer.dept@email.com'}
                      className={`w-full pl-8 pr-2.5 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 ${
                        errors.email ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-[9.5px] mt-0.5 text-rose-600">{errors.email}</p>}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-700 dark:text-slate-300">
                    Mobile Number <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className={`w-full pl-8 pr-2.5 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 ${
                        errors.phone ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-[9.5px] mt-0.5 text-rose-600">{errors.phone}</p>}
                </div>

                {/* GSTIN Number (Only for Bidder) */}
                {role === 'bidder' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold mb-0.5 text-slate-700 dark:text-slate-300">
                      GSTIN Number <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <FileCheck className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                        placeholder="e.g. 09ARNAV9012H3Z7"
                        className={`w-full pl-8 pr-2.5 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 uppercase ${
                          errors.gstin ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {errors.gstin && <p className="text-[9.5px] mt-0.5 text-rose-600">{errors.gstin}</p>}
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-700 dark:text-slate-300">
                    Password <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Minimum 6 characters"
                      className={`w-full pl-8 pr-8 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 ${
                        errors.password ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[9.5px] mt-0.5 text-rose-600">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-700 dark:text-slate-300">
                    Confirm Password <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full pl-8 pr-8 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 ${
                        errors.confirmPassword ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[9.5px] mt-0.5 text-rose-600">{errors.confirmPassword}</p>}
                </div>

              </div>

              {/* Checkbox: Terms / Declaration */}
              <div className="pt-1">
                {role === 'bidder' ? (
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-tight">
                      I agree to the <span className="font-semibold text-blue-700 dark:text-blue-400">Terms of Service</span>, <span className="font-semibold text-blue-700 dark:text-blue-400">Privacy Policy</span>, and bidding compliance regulations.
                    </span>
                  </label>
                ) : (
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.declaration}
                      onChange={(e) => handleInputChange('declaration', e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-tight">
                      I hereby declare that I am an authorized government official accessing GeM Compliflix for official duty.
                    </span>
                  </label>
                )}
                {role === 'bidder' && errors.agreedToTerms && (
                  <p className="text-[9.5px] mt-0.5 text-rose-600">{errors.agreedToTerms}</p>
                )}
                {role === 'officer' && errors.declaration && (
                  <p className="text-[9.5px] mt-0.5 text-rose-600">{errors.declaration}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2 px-4 bg-[#0c396d] hover:bg-[#082b54] active:scale-[0.99] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending Verification Code...
                  </span>
                ) : (
                  <>
                    <span>Verify Email & Proceed</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Bottom Switch to Sign In */}
              <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Already have an account?{' '}
                </span>
                <Link
                  to="/login"
                  onClick={(e) => {
                    if (onSwitchToSignIn) {
                      e.preventDefault();
                      onSwitchToSignIn();
                    }
                  }}
                  className="text-xs font-semibold text-[#0c396d] dark:text-blue-400 hover:underline transition cursor-pointer"
                >
                  Sign In
                </Link>
              </div>

            </form>
          )}

        </div>
      )}

      {/* ----------------- STEP 3: DEDICATED GSAP OTP VERIFICATION CARD (FALLBACK) ----------------- */}
      {step === 'verify_email' && (
        <OtpVerificationCard
          email={formData.email}
          role={role}
          pendingUser={
            role === 'bidder' ? {
              legalName: formData.organizationName || formData.fullName,
              panNumber: formData.gstin && formData.gstin.length >= 12 ? formData.gstin.substring(2, 12).toUpperCase() : '',
              gstNumber: formData.gstin,
              udyamNumber: '',
              registrationNumber: 'REG-' + Date.now(),
              email: formData.email,
              phone: formData.phone,
              address: 'India',
              password: formData.password,
            } : {
              name: formData.fullName,
              email: formData.email,
              mobile: formData.phone,
              officerId: 'GOV-' + Date.now().toString().slice(-6),
              ministry: formData.ministry || 'Government of India',
              designation: 'Procurement Officer',
              password: formData.password,
            }
          }
          onBack={() => setStep('form')}
          onSuccess={() => {
            navigate('/tenders');
          }}
        />
      )}
    </>
  );
};

export default SignupCard;
