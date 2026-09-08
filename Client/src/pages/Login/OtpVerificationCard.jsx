import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import {
  Mail,
  ShieldCheck,
  Check,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context';
import TricolorBar from '../../components/common/TricolorBar';
import { authService } from '../../services';
import { isCustomBackendConfigured } from '../../services/api';

const OtpVerificationCard = ({
  email,
  role = 'officer',
  pendingUser = null,
  onBack,
  onSuccess
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetRedirect = location.state?.redirectTo || searchParams.get('redirect') || '/tenders';
  const { login } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [isSuccess, setIsSuccess] = useState(false);

  // GSAP Animation Refs
  const cardRef = useRef(null);
  const iconRef = useRef(null);
  const badgeRef = useRef(null);
  const inputsContainerRef = useRef(null);
  const successRef = useRef(null);
  const resendIconRef = useRef(null);

  // Initial Entrance Animation with GSAP
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        cardRef.current,
        { opacity: 0, y: 28, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55 }
      )
      .fromTo(
        badgeRef.current,
        { opacity: 0, y: -8, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)' },
        '-=0.25'
      )
      .fromTo(
        iconRef.current,
        { scale: 0, rotation: -25, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)' },
        '-=0.2'
      )
      .fromTo(
        '.gsap-otp-digit',
        { opacity: 0, y: 16, scale: 0.75 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.05, duration: 0.4, ease: 'back.out(1.5)' },
        '-=0.15'
      );

      // Subtle ambient floating animation on mail icon
      gsap.to(iconRef.current, {
        y: -4,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }, cardRef);

    return () => ctx.revert();
  }, []);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus first input automatically
  useEffect(() => {
    const firstInput = document.getElementById('otp-box-0');
    if (firstInput) firstInput.focus();
  }, []);

  // Trigger Shake Animation on Error
  const triggerErrorAnimation = (msg) => {
    setErrorMsg(msg);
    if (inputsContainerRef.current) {
      gsap.timeline()
        .to(inputsContainerRef.current, { x: -10, duration: 0.06 })
        .to(inputsContainerRef.current, { x: 10, duration: 0.06 })
        .to(inputsContainerRef.current, { x: -6, duration: 0.06 })
        .to(inputsContainerRef.current, { x: 6, duration: 0.06 })
        .to(inputsContainerRef.current, { x: 0, duration: 0.06 });
    }
  };

  // Handle single digit input and auto-advance
  const handleDigitChange = (val, index) => {
    const clean = val.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = clean ? clean[clean.length - 1] : '';
    setOtp(newOtp);
    setErrorMsg(null);

    // Pulse animation on the typed box
    const currentBox = document.getElementById(`otp-box-${index}`);
    if (clean && currentBox) {
      gsap.fromTo(currentBox, { scale: 0.9 }, { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1 });
    }

    // Auto advance focus
    if (clean && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Backspace navigation
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  // Paste 6-digit code
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      setErrorMsg(null);

      // GSAP bounce on all boxes on paste
      gsap.fromTo(
        '.gsap-otp-digit',
        { scale: 0.85 },
        { scale: 1, stagger: 0.04, duration: 0.25, ease: 'back.out(2)' }
      );

      const targetIndex = Math.min(pasted.length, 5);
      const targetInput = document.getElementById(`otp-box-${targetIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  // Resend OTP handler with animation
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setErrorMsg(null);

    if (resendIconRef.current) {
      gsap.to(resendIconRef.current, { rotation: '+=360', duration: 0.6, ease: 'power2.inOut' });
    }

    try {
      await authService.resendOtp({ email, role });
    } catch (err) {
      console.warn('Resend OTP notice:', err);
    } finally {
      setCountdown(60);
      setIsLoading(false);
    }
  };

  // Verify OTP and automatically log in
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      triggerErrorAnimation('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const authData = await authService.verifyOtp({ email, otp: code, role });

      const isGovt =
        role === 'officer' ||
        email.toLowerCase().includes('.gov.in') ||
        email.toLowerCase().includes('.nic.in');
      const formattedName =
        pendingUser?.legalName ||
        pendingUser?.name ||
        authData?.user?.name ||
        email.split('@')[0] ||
        'User';

      const userObj = {
        id: authData?.user?.id || 'user-' + Date.now(),
        name: formattedName,
        email: email,
        role: role === 'bidder' ? 'Procurement Bidder' : 'Procurement Officer',
        designation:
          role === 'bidder'
            ? 'Registered Vendor'
            : (pendingUser?.designation || (isGovt ? 'Under Secretary (Procurement)' : 'Procurement Officer')),
        legalName: pendingUser?.legalName,
        panNumber: pendingUser?.panNumber,
        gstNumber: pendingUser?.gstNumber,
        phone: pendingUser?.phone || pendingUser?.mobile,
        ministry: pendingUser?.ministry || (isGovt ? 'Ministry of Finance' : undefined),
      };

      triggerSuccessFlow(userObj, authData?.token || 'gem-token-' + Date.now());
    } catch (err) {
      setIsLoading(false);
      triggerErrorAnimation('Verification failed. Please try again.');
    }
  };

  // Success Animation and Automatic Login
  const triggerSuccessFlow = (user, token) => {
    setIsLoading(false);
    setIsSuccess(true);

    // Save session in AuthContext immediately
    login(user, token);

    // GSAP Success Reveal Animation
    setTimeout(() => {
      if (successRef.current) {
        gsap.fromTo(
          successRef.current,
          { scale: 0.3, opacity: 0, rotation: -15 },
          { scale: 1, opacity: 1, rotation: 0, duration: 0.65, ease: 'elastic.out(1, 0.55)' }
        );
      }
    }, 50);

    // Redirect to portal automatically
    setTimeout(() => {
      if (onSuccess) {
        onSuccess(user, token);
      } else {
        navigate(targetRedirect);
      }
    }, 1800);
  };

  return (
    <div
      ref={cardRef}
      className="w-full max-w-[420px] mx-auto lg:mr-0 lg:ml-auto rounded-2xl transition-all duration-300 p-5 sm:p-7 relative z-20 shadow-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-slate-200/70 dark:shadow-none text-slate-900 dark:text-slate-100"
    >
      {/* Top-Right Tricolor Accent Pill */}
      <div className="absolute top-4 right-5">
        <TricolorBar className="w-12 h-1" />
      </div>

      {/* Success State View */}
      {isSuccess ? (
        <div ref={successRef} className="py-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-lg">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Email Verified Successfully</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Authentication Approved
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Your official credentials have been validated. Automatically logging you in to your portal...
            </p>
          </div>

          {/* Animated Spinner Progress Bar */}
          <div className="pt-2 max-w-[200px] mx-auto">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 animate-[progress_1.6s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      ) : (
        /* OTP Verification Form */
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          
          {/* Header Badge */}
          <div ref={badgeRef} className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/60">
              Identity Verification
            </span>
          </div>

          {/* Central Animated Shield / Mail Icon */}
          <div className="text-center pt-1">
            <div
              ref={iconRef}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-[#073567] text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20 mb-2.5"
            >
              <Mail className="w-7 h-7 stroke-[1.8]" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Verify Your Email
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter the 6-digit OTP code sent to:
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="truncate max-w-[240px]">{email}</span>
            </div>
          </div>

          {/* Error Alert Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-md text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/60 text-center animate-in fade-in duration-150">
              {errorMsg}
            </div>
          )}

          {/* 6-Digit OTP Boxes Container */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Enter Verification Code <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <span className="text-[10.5px] text-slate-400 font-mono">
                6-Digits
              </span>
            </div>

            <div
              ref={inputsContainerRef}
              className="flex items-center justify-center gap-2 sm:gap-2.5 py-1"
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-box-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className="gsap-otp-digit w-10 h-12 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all duration-150 shadow-2xs"
                />
              ))}
            </div>
          </div>

          {/* Verify & Sign In Action Button */}
          <button
            type="submit"
            disabled={isLoading || otp.join('').length < 6}
            className="w-full mt-1 py-2.5 px-4 bg-[#0c396d] hover:bg-[#082b54] dark:bg-blue-600 dark:hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="animate-spin h-3.5 w-3.5 text-white" />
                Verifying & Signing In...
              </span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify OTP & Sign In</span>
              </>
            )}
          </button>

          {/* Resend OTP & Back Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer inline-flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email / Details</span>
              </button>
            ) : (
              <div />
            )}

            {countdown > 0 ? (
              <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                Resend code in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-[#0c396d] dark:text-blue-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <RefreshCw ref={resendIconRef} className="w-3 h-3" />
                <span>Resend Code</span>
              </button>
            )}
          </div>

          {/* Official Security Footnote */}
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
              <Lock className="w-2.5 h-2.5 text-slate-400" />
              <span>GFR 2017 & MeitY Government Authentication Standards</span>
            </span>
          </div>

        </form>
      )}
    </div>
  );
};

export default OtpVerificationCard;
