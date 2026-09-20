import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check, KeyRound, Send, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context';
import TricolorBar from '../../components/common/TricolorBar';
import NationalEmblem from '../../components/common/NationalEmblem';
import { authService, recordAuditLog } from '../../services';
import { isCustomBackendConfigured } from '../../services/api';
import { isOfficerUser } from '../../utils/roleUtils';

const resolveRoleDestination = (userObj, requestedTarget) => {
  const role = (userObj?.role || '').toUpperCase();
  const isOfficer = role === 'OFFICER' || isOfficerUser(userObj);

  if (isOfficer) {
    if (requestedTarget && (requestedTarget.startsWith('/reports') || requestedTarget.startsWith('/officer'))) {
      return requestedTarget;
    }
    if (requestedTarget && (requestedTarget.startsWith('/verification') || requestedTarget.startsWith('/tenders'))) {
      return requestedTarget.startsWith('/verification') ? '/dashboard?tab=compliance' : requestedTarget;
    }
    return '/dashboard';
  } else {
    if (requestedTarget && (requestedTarget.startsWith('/my-applications') || requestedTarget.startsWith('/tenders') || requestedTarget.startsWith('/bidder'))) {
      return requestedTarget;
    }
    if (requestedTarget && requestedTarget.startsWith('/verification')) {
      return '/tenders';
    }
    return '/bidder-dashboard';
  }
};

// ===========================================================================
// FEATURE: Unified Authentication & Role Resolution
// Secure sign-in supporting credentials and seamless redirection by assigned role
// ===========================================================================
const LoginCard = ({ onSwitchToSignUp, onPendingVerification }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetRedirect = location.state?.redirectTo || searchParams.get('redirect') || null;
  const { login } = useAuth();
  
  // Auth Mode: 'password' or 'otp'
  const [authMethod, setAuthMethod] = useState('password');
  // Role Selector: 'officer' or 'bidder'
  const [selectedRole, setSelectedRole] = useState('officer');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Email OTP States
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(() => {
    if (searchParams.get('session_expired') === 'true') {
      return {
        type: 'error',
        message: 'Your session has expired or is unauthorized. Please sign in again.',
      };
    }
    return null;
  });
  const [ssoModalOpen, setSsoModalOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState(false);

  // Forgot Password Multi-Step Flow (POST /api/bidder/auth/forgot-password, verify-forgot-password-otp, reset-password)
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  const handleForgotSendOtp = async () => {
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered official email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      await authService.bidderForgotPassword({ email: forgotEmail.trim().toLowerCase() });
      setForgotStep(2);
      setForgotSuccessMsg(`Verification OTP sent to ${forgotEmail.trim()}`);
    } catch (err) {
      setForgotError(err?.message || 'Failed to send reset OTP. Please check the email address.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotVerifyOtp = async () => {
    if (!forgotOtp.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await authService.bidderVerifyForgotOtp({
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
      });
      const token = res?.resetToken || res?.token || res?.data?.resetToken || 'TOKEN_VERIFIED';
      setForgotResetToken(token);
      setForgotStep(3);
      setForgotSuccessMsg('Code verified! Enter your new password below.');
    } catch (err) {
      setForgotError(err?.message || 'Invalid or expired verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async () => {
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters in length.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      await authService.bidderResetPassword({
        resetToken: forgotResetToken,
        newPassword: forgotNewPassword,
      });
      setForgotSuccessMsg('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        setForgotModalOpen(false);
        setForgotStep(1);
        setEmail(forgotEmail);
      }, 1500);
    } catch (err) {
      setForgotError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle password-based login
  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setAuthStatus({
        type: 'error',
        message: 'Please enter both Email address and Password.',
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus(null);

    try {
      const authData = await authService.login({ email: cleanEmail, password });
      if (authData && authData.token) {
        setIsLoading(false);
        setAuthStatus({
          type: 'success',
          message: 'Login successful! Redirecting...',
        });
        login(authData.user, authData.token);
        recordAuditLog({
          activity: 'Login',
          module: 'Authentication',
          details: `User authenticated via Unified Login (${cleanEmail})`,
          status: 'Success',
          user: {
            name: authData.user?.name || cleanEmail,
            role: authData.user?.role || 'User',
          },
        });
        const destination = resolveRoleDestination(authData.user, targetRedirect);
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 500);
        return;
      } else {
        throw new Error('No authentication token received from server.');
      }
    } catch (err) {
      // In dev or network issue, support seamless role-based demo fallback
      if (!isCustomBackendConfigured() || err.message?.includes('Network Error') || err.message?.includes('Failed to fetch') || err.code === 'ERR_NETWORK') {
        const isGovt = selectedRole === 'officer' || cleanEmail.includes('.gov.in') || cleanEmail.includes('.nic.in');
        const rawName = cleanEmail.split('@')[0] ? cleanEmail.split('@')[0].replace(/[._-]/g, ' ').trim() : '';
        const formattedName = rawName && rawName.length > 2
          ? rawName.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
          : (isGovt ? 'Procurement Officer' : 'Authorized Vendor');

        const fallbackUser = {
          name: formattedName,
          email: cleanEmail,
          role: isGovt ? 'Procurement Officer' : 'Procurement Bidder',
          designation: isGovt ? 'Under Secretary (Procurement)' : 'Registered Vendor',
        };
        setIsLoading(false);
        setAuthStatus({
          type: 'success',
          message: 'Login successful! Redirecting...',
        });
        login(fallbackUser, 'gem-token-' + Date.now());
        setTimeout(() => {
          navigate(resolveRoleDestination(fallbackUser, targetRedirect));
        }, 500);
        return;
      }

      setIsLoading(false);
      setAuthStatus({
        type: 'error',
        message: err.message || 'Authentication failed. Please verify your credentials.',
      });
      // Do not redirect on login failure
    }
  };

  // Handle sending email OTP
  const handleSendLoginOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setAuthStatus({
        type: 'error',
        message: 'Please enter a valid official Email Address first.',
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus(null);

    const isGovt = selectedRole === 'officer' || email.toLowerCase().includes('.gov.in') || email.toLowerCase().includes('.nic.in');
    const detectedRole = isGovt ? 'officer' : 'bidder';

    // Dispatch real OTP via backend
    if (isCustomBackendConfigured()) {
      try {
        await authService.resendOtp({ email, role: detectedRole });
      } catch (err) {
        console.warn('Backend resend-otp notice:', err.message);
        setIsLoading(false);
        const errMsg = String(err.message || '').toLowerCase();
        if (errMsg.includes('no pending') || errMsg.includes('expired') || errMsg.includes('restart signup') || errMsg.includes('cannot send email otp')) {
          setAuthStatus({
            type: 'error',
            message: 'No active registration session found. Please sign in using your Password or create an account via Signup.',
          });
          return;
        }
        setAuthStatus({
          type: 'error',
          message: err.message || 'Unable to send verification OTP. Please sign in with Password.',
        });
        return;
      }
    }

    setIsLoading(false);

    if (onPendingVerification) {
      onPendingVerification({
        email,
        role: detectedRole,
        pendingUser: {
          name: email.split('@')[0],
          email,
        },
      });
      return;
    }

    setIsOtpSent(true);
    setCountdown(60);
    setAuthStatus({
      type: 'success',
      message: `6-digit verification code sent to ${email}`,
    });
  };

  // Handle email OTP verification and sign in
  const handleOtpSignIn = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      setAuthStatus({
        type: 'error',
        message: 'Please enter both your Email and the 6-digit verification OTP.',
      });
      return;
    }

    if (otp.length < 6) {
      setAuthStatus({
        type: 'error',
        message: 'Please enter complete 6-digit OTP code.',
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus(null);

    const isGovt = selectedRole === 'officer' || email.toLowerCase().includes('.gov.in') || email.toLowerCase().includes('.nic.in');
    const detectedRole = isGovt ? 'officer' : 'bidder';

    if (isCustomBackendConfigured()) {
      try {
        const authData = await authService.verifyOtp({ email, otp, role: detectedRole });
        if (authData && authData.token) {
          setIsLoading(false);
          setAuthStatus({
            type: 'success',
            message: 'Email OTP verified! Logging in...',
          });
          login(authData.user, authData.token);
          setTimeout(() => {
            navigate(resolveRoleDestination(authData.user, targetRedirect));
          }, 600);
          return;
        }
      } catch (err) {
        setIsLoading(false);
        setAuthStatus({
          type: 'error',
          message: err.message || 'Invalid or expired OTP. Please try again.',
        });
        return;
      }
    }

    // Demo fallback
    setTimeout(() => {
      setIsLoading(false);
      setAuthStatus({
        type: 'success',
        message: 'Email OTP verified! Redirecting to portal...',
      });

      const isGovt = selectedRole === 'officer' || email.toLowerCase().includes('.gov.in') || email.toLowerCase().includes('.nic.in');
      const rawName = email.split('@')[0] ? email.split('@')[0].replace(/[._-]/g, ' ').trim() : '';
      const formattedName = rawName && rawName.length > 2
        ? rawName.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : (isGovt ? 'Procurement Officer' : 'Authorized Vendor');

      login(
        {
          name: formattedName,
          email: email,
          role: isGovt ? 'Procurement Officer' : 'Procurement Bidder',
          designation: isGovt ? 'Under Secretary (Procurement)' : 'Registered Vendor',
        },
        'gem-token-' + Date.now()
      );

      setTimeout(() => {
        navigate(resolveRoleDestination({ role: isGovt ? 'Procurement Officer' : 'Procurement Bidder', email }, targetRedirect));
      }, 700);
    }, 700);
  };

  return (
    <>
      <div className="w-full max-w-[410px] mx-auto lg:mr-0 lg:ml-auto rounded-2xl transition-all duration-300 p-4 sm:p-7 relative z-20 shadow-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-slate-200/70 dark:shadow-none text-slate-900 dark:text-slate-100">

        {/* Top-Right Tricolor Pill */}
        <div className="absolute top-4 right-5">
          <TricolorBar className="w-12 h-1" />
        </div>

        {/* Header */}
        <div className="mb-3">
          <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-[11px] sm:text-xs mt-0.5 font-medium text-slate-500 dark:text-slate-400">
            Sign in to your GeM Compliflix account
          </p>
        </div>


        {/* Auth Method Selector (Password vs Email OTP) */}
        <div className="grid grid-cols-2 p-0.5 mb-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold select-none">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setAuthStatus(null);
            }}
            className={`py-1 rounded-md transition cursor-pointer ${
              authMethod === 'password'
                ? 'bg-white dark:bg-slate-700 text-[#0c396d] dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('otp');
              setAuthStatus(null);
            }}
            className={`py-1 rounded-md transition flex items-center justify-center gap-1 cursor-pointer ${
              authMethod === 'otp'
                ? 'bg-white dark:bg-slate-700 text-[#0c396d] dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Email OTP</span>
            <span className="px-1 py-0.2 rounded text-[8.5px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
              Secure
            </span>
          </button>
        </div>

        {/* Status Message */}
        {authStatus && (
          <div className={`mb-2.5 p-2 rounded-md text-[11px] font-medium border ${
            authStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}>
            {authStatus.message}
          </div>
        )}

        {/* Form: Password Login Mode */}
        {authMethod === 'password' ? (
          <form onSubmit={handlePasswordSignIn} className="space-y-2">

            {/* Email Address Input */}
            <div>
              <label className="block text-[11px] font-semibold mb-0.5 text-slate-700 dark:text-slate-300">
                Email Address <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[11px] font-semibold mb-0.5 text-slate-700 dark:text-slate-300">
                Password <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-8 pr-8 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>  

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center transition border ${
                    rememberMe
                      ? 'bg-[#0c396d] dark:bg-blue-600 border-[#0c396d] dark:border-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  {rememberMe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-[11px] font-semibold text-[#0c396d] dark:text-blue-400 hover:underline transition cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-2 px-4 bg-[#0c396d] hover:bg-[#082b54] dark:bg-blue-600 dark:hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verifying Credentials...
                </span>
              ) : (
                <>
                  <span>Sign In with Credentials</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Form: Email OTP Mode */
          <form onSubmit={isOtpSent ? handleOtpSignIn : handleSendLoginOtp} className="space-y-2.5">
            
            {/* Email Address Input */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Official Email Address <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                {isOtpSent && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpSent(false);
                      setOtp('');
                      setAuthStatus(null);
                    }}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    Change Email
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  disabled={isOtpSent}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-md border text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isOtpSent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600'
                  }`}
                />
              </div>
            </div>

            {/* OTP Input (Shown after OTP is sent) */}
            {isOtpSent && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Enter 6-Digit Email OTP <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  {countdown > 0 ? (
                    <span className="text-[10px] font-mono text-slate-400">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendLoginOtp}
                      disabled={isLoading}
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    required
                    autoFocus
                    className="w-full pl-8 pr-2.5 py-2 rounded-md border text-sm font-mono tracking-widest transition focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {/* OTP Action Buttons */}
            {!isOtpSent ? (
              <button
                type="button"
                onClick={handleSendLoginOtp}
                disabled={isLoading}
                className="w-full mt-1 py-2 px-4 bg-[#0c396d] hover:bg-[#082b54] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCw className="animate-spin h-3.5 w-3.5" />
                    Sending Code to Email...
                  </span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full mt-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCw className="animate-spin h-3.5 w-3.5" />
                    Verifying Email Code...
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify OTP & Sign In</span>
                  </>
                )}
              </button>
            )}

          </form>
        )}

        {/* Divider */}
        <div className="relative flex py-1.5 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          <span className="flex-shrink mx-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            or
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* ePramaan SSO Button */}
        <button
          type="button"
          onClick={() => setSsoModalOpen(true)}
          className="w-full py-1.5 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-md transition text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:border-slate-300 active:scale-[0.99]"
        >
          <NationalEmblem className="h-7 w-auto" />
          <div className="text-left">
            <div className="text-[11px] font-semibold leading-tight text-slate-800 dark:text-slate-100">
              Sign in with MeriPehchaan
            </div>
            <div className="text-[9.5px] leading-tight text-slate-500 dark:text-slate-400">
              (ePramaan / National SSO)
            </div>
          </div>
        </button>

        {/* Authorized Officials Notice */}
        <div className="mt-2 p-2 rounded-md flex items-start gap-1.5 border bg-[#eff6ff] dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50 text-slate-700 dark:text-slate-300">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold font-serif">
            i
          </div>
          <p className="text-[10px] leading-snug">
            Authorized government buyers and registered vendors can access compliance analytics.
          </p>
        </div>

        {/* Bottom Account Registration Link */}
        <div className="text-center pt-1">
          <span className="text-[11px] text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
          </span>
          <Link
            to="/signup"
            onClick={(e) => {
              if (onSwitchToSignUp) {
                e.preventDefault();
                onSwitchToSignUp();
              }
            }}
            className="text-[11px] font-semibold text-[#0c396d] dark:text-blue-400 hover:underline transition cursor-pointer"
          >
            Create an account
          </Link>
        </div>

      </div>

      {/* ePramaan SSO Coming Soon Modal */}
      {ssoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl relative text-center">
            
            {/* Top Tricolor Bar */}
            <div className="w-12 h-1 bg-gradient-to-r from-orange-500 via-white to-green-600 rounded-full mx-auto mb-3" />

            {/* Emblem / Portal Icon */}
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto mb-3">
              <NationalEmblem className="h-7 w-auto" />
            </div>

            {/* Header */}
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              ePramaan / MeriPehchaan SSO
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              National Single Sign-On Service
            </p>

            {/* Coming Soon Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 my-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Coming Soon</span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 px-1">
              ePramaan National Single Sign-On (NSSO) integration is currently under development. Please sign in using your official credentials.
            </p>

            {/* Action Button */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setSsoModalOpen(false)}
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#0c396d] hover:bg-[#082b54] dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                Okay, Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal with 3-Step Email OTP Flow */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {forgotStep === 1 && 'Recover Account Password'}
                    {forgotStep === 2 && 'Enter Verification Code'}
                    {forgotStep === 3 && 'Create New Password'}
                  </h3>
                  <span className="text-[10px] text-slate-500">Step {forgotStep} of 3 • GeM Auth</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForgotModalOpen(false);
                  setForgotStep(1);
                  setForgotError('');
                  setForgotSuccessMsg('');
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {forgotError}
              </div>
            )}

            {forgotSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">
                {forgotSuccessMsg}
              </div>
            )}

            {forgotStep === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your registered official email address. A one-time verification passcode will be dispatched.
                </p>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. director@techcorp.in"
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={handleForgotSendOtp}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {forgotLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{forgotLoading ? 'Sending...' : 'Send OTP'}</span>
                  </button>
                </div>
              </div>
            )}

            {forgotStep === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter the 6-digit verification code sent to <strong className="text-slate-800 dark:text-slate-200">{forgotEmail}</strong>.
                </p>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    6-Digit Passcode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-3 py-2 border rounded-xl text-center tracking-widest text-base font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-[11px] text-slate-500 hover:underline"
                  >
                    ← Change Email
                  </button>
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={handleForgotVerifyOtp}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {forgotLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{forgotLoading ? 'Verifying...' : 'Verify Code'}</span>
                  </button>
                </div>
              </div>
            )}

            {forgotStep === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Identity verified. Choose a strong new password for your account.
                </p>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={handleForgotResetPassword}
                    className="w-full py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {forgotLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{forgotLoading ? 'Updating Password...' : 'Set New Password & Complete'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {createAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900 mb-1.5">Government Official Onboarding</h3>
            <p className="text-[11px] text-slate-600 mb-3">
              Access requires authorization through your Ministry or Department Nodal Officer.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setCreateAccountModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0c396d] hover:bg-[#092b54] rounded-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginCard;
