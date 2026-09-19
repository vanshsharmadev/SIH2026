import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Tenders, { TenderDetails } from '../pages/Tenders';
import Verification from '../pages/Verification';
import Reports from '../pages/Reports';
import Bidders from '../pages/Bidders';
import Dashboard, { BidderDashboard } from '../pages/Dashboard';
import MyApplications from '../pages/MyApplications';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import { useAuth } from '../context';
import { isOfficerUser } from '../utils/roleUtils';

// Protected: Only Govt Officers can view
const OfficerRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/dashboard" replace />;
  }
  const role = (user?.role || '').toUpperCase();
  if (role !== 'OFFICER' && !isOfficerUser(user)) {
    return <Navigate to="/bidder-dashboard" replace />;
  }
  return children;
};

// Protected: Only Commercial Bidders can view (Officers get redirected to /dashboard)
const BidderRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  const role = (user?.role || '').toUpperCase();
  if (role === 'OFFICER' || isOfficerUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Protected: Bidder Verification Portal (Pre-screening & Bid submission)
// Officers get redirected to /dashboard?tab=compliance
const BidderVerificationRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  const role = (user?.role || '').toUpperCase();
  if (role === 'OFFICER' || isOfficerUser(user)) {
    return <Navigate to="/dashboard?tab=compliance" replace />;
  }
  return children;
};

// Guard: Redirect already authenticated users away from /login and /signup
const PublicAuthRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated && user) {
    const role = (user.role || '').toUpperCase();
    if (role === 'OFFICER' || isOfficerUser(user)) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/bidder-dashboard" replace />;
  }
  return children;
};

// Protected: Authenticated Settings
const AuthenticatedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicAuthRoute>
            <Login />
          </PublicAuthRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicAuthRoute>
            <Login />
          </PublicAuthRoute>
        }
      />
      <Route path="/tenders" element={<Tenders />} />
      <Route path="/tenders/:tenderId" element={<TenderDetails />} />
      <Route path="/bidders" element={<Bidders />} />

      {/* Bidder-Only Verification & Pre-screening (Blocked for Officers -> /dashboard?tab=compliance) */}
      <Route
        path="/verification"
        element={
          <BidderVerificationRoute>
            <Verification />
          </BidderVerificationRoute>
        }
      />
      <Route
        path="/verification/:tenderId"
        element={
          <BidderVerificationRoute>
            <Verification />
          </BidderVerificationRoute>
        }
      />

      {/* Bidder-Only Routes: /bidder/*, /bidder-dashboard, /my-applications (Blocked for Officers -> /dashboard) */}
      <Route
        path="/bidder/dashboard"
        element={
          <BidderRoute>
            <BidderDashboard />
          </BidderRoute>
        }
      />
      <Route
        path="/bidder/tenders/:tenderId"
        element={
          <BidderRoute>
            <TenderDetails />
          </BidderRoute>
        }
      />
      <Route
        path="/bidder/my-applications"
        element={
          <BidderRoute>
            <MyApplications />
          </BidderRoute>
        }
      />
      <Route
        path="/bidder/*"
        element={
          <BidderRoute>
            <BidderDashboard />
          </BidderRoute>
        }
      />
      <Route
        path="/bidder-dashboard"
        element={
          <BidderRoute>
            <BidderDashboard />
          </BidderRoute>
        }
      />
      <Route
        path="/my-applications"
        element={
          <BidderRoute>
            <MyApplications />
          </BidderRoute>
        }
      />

      {/* Officer-Only Routes: /officer/*, /dashboard, /reports (Blocked for Bidders -> /bidder-dashboard) */}
      <Route
        path="/officer/dashboard"
        element={
          <OfficerRoute>
            <Dashboard />
          </OfficerRoute>
        }
      />
      <Route
        path="/officer/reports"
        element={
          <OfficerRoute>
            <Reports />
          </OfficerRoute>
        }
      />
      <Route
        path="/officer/*"
        element={
          <OfficerRoute>
            <Dashboard />
          </OfficerRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <OfficerRoute>
            <Dashboard />
          </OfficerRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <OfficerRoute>
            <Reports />
          </OfficerRoute>
        }
      />
      <Route path="/audit" element={<Navigate to="/dashboard?tab=audit" replace />} />
      <Route path="/audit-trail" element={<Navigate to="/dashboard?tab=audit" replace />} />

      {/* Authenticated Settings */}
      <Route
        path="/settings"
        element={
          <AuthenticatedRoute>
            <Settings />
          </AuthenticatedRoute>
        }
      />

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
