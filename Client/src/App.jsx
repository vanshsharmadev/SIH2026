import { useState, useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider, LanguageProvider, ThemeProvider, useAuth } from './context';
import { Navbar, Footer } from './components/common';
import { AppRoutes } from './routes';
import { useLenis } from './hooks';
import { isOfficerUser } from './utils/roleUtils';

function AppContent({ fontScale, setFontScale }) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isOfficer = Boolean(isAuthenticated && isOfficerUser(user));

  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  // Dedicated sidebar-based evaluation console is only rendered for officers
  const isOfficerDashboardPage = isOfficer && (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/officer'));
  const isWidePage = isLandingPage || isAuthPage || isOfficerDashboardPage || location.pathname === '/my-applications' || location.pathname === '/reports';

  // Initialize Lenis smooth scrolling
  useLenis();

  // Scroll restoration and anchor target smooth navigation on route changes
  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        const timer = setTimeout(() => {
          if (window.lenis) {
            window.lenis.resize();
            window.lenis.scrollTo(target, { offset: -60 });
          } else {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }, 80);
        return () => clearTimeout(timer);
      }
    } else {
      if (window.lenis) {
        window.lenis.resize();
        window.lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    }

    // Refresh Lenis boundaries after new page DOM finishes initial mount
    const timer = setTimeout(() => {
      if (window.lenis) {
        window.lenis.resize();
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200 relative selection:bg-blue-600 selection:text-white bg-[#f0f4f9] dark:bg-[#121212] text-[#1e293b] dark:text-[#eeeeee]"
    >
      {/* Top Navigation - hidden on Officer Dashboard to render the dedicated platform interface */}
      {!isOfficerDashboardPage && (
        <Navbar
          fontScale={fontScale}
          setFontScale={setFontScale}
        />
      )}

      {/* Main Application Content */}
      <main
        id="main-content"
        tabIndex={-1}
        className={`flex-1 outline-none flex flex-col min-h-0 ${
          isWidePage
            ? 'w-full'
            : 'max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5'
        }`}
      >
        <AppRoutes />
      </main>

      {/* Bottom Footer - hidden on Officer Dashboard to match the dedicated interface */}
      {!isOfficerDashboardPage && <Footer />}
    </div>
  );
}

function App() {
  const [fontScale, setFontScale] = useState(() => {
    try {
      const saved = localStorage.getItem('site_font_scale');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  // Apply font scale directly to documentElement so all Tailwind rem units scale proportionally
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
    try {
      localStorage.setItem('site_font_scale', fontScale.toString());
    } catch {
      // Ignore storage errors
    }
  }, [fontScale]);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <AppContent fontScale={fontScale} setFontScale={setFontScale} />
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;