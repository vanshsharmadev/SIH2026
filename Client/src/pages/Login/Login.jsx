import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeroSection from './HeroSection';
import LoginCard from './LoginCard';
import SignupCard from './SignupCard';
import OtpVerificationCard from './OtpVerificationCard';
import rastrapatiBhawanImg from '../../assets/rastrapati-bhawan.png';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignUp = location.pathname === '/signup';

  // Holds pending verification data { email, role, pendingUser }
  const [verificationData, setVerificationData] = useState(null);

  // Clear verification data when toggling between /login and /signup
  useEffect(() => {
    setVerificationData(null);
  }, [location.pathname]);

  const handleSwitchToSignUp = () => {
    setVerificationData(null);
    navigate('/signup');
  };

  const handleSwitchToSignIn = () => {
    setVerificationData(null);
    navigate('/login');
  };

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-0 py-6 sm:py-8 lg:py-10">

      {/* Background Panorama Image with Rashtrapati Bhavan & Ashoka Chakra (Full Screen Fit) */}
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none select-none overflow-hidden">
        <img
          src={rastrapatiBhawanImg}
          alt="Government of India - Raisina Hill and Ashoka Chakra"
          className="w-full h-full object-cover object-bottom opacity-95 dark:opacity-30"
        />
        {/* Subtle gradient overlay to ensure perfect contrast with white text and card */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-slate-900/15 to-transparent pointer-events-none" />
      </div>

      {/* Two-Column Main Content (Hero on Left, Form Card on Right) */}
      <div className="relative z-10 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 my-auto flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
          
          {/* Left Column: Hero (Headline, Badges, Quote) - Hidden on mobile view */}
          <div className={`hidden lg:flex flex-col justify-center ${
            verificationData
              ? 'lg:col-span-7 xl:col-span-7'
              : isSignUp
              ? 'lg:col-span-6 xl:col-span-6'
              : 'lg:col-span-7 xl:col-span-7'
          }`}>
            <HeroSection />
          </div>

          {/* Right Column: Floating Auth Card (Login, Signup, or Dedicated OTP Verification Card) */}
          <div className={`w-full flex justify-center lg:justify-end items-center ${
            verificationData
              ? 'lg:col-span-5 xl:col-span-5'
              : isSignUp
              ? 'lg:col-span-6 xl:col-span-6'
              : 'lg:col-span-5 xl:col-span-5'
          }`}>
            {verificationData ? (
              <OtpVerificationCard
                email={verificationData.email}
                role={verificationData.role}
                pendingUser={verificationData.pendingUser}
                onBack={() => setVerificationData(null)}
                onSuccess={() => {
                  navigate('/tenders');
                }}
              />
            ) : isSignUp ? (
              <SignupCard
                onPendingVerification={(data) => setVerificationData(data)}
                onSwitchToSignIn={handleSwitchToSignIn}
              />
            ) : (
              <LoginCard
                onPendingVerification={(data) => setVerificationData(data)}
                onSwitchToSignUp={handleSwitchToSignUp}
              />
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;
