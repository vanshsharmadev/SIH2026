import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Tenders from '../pages/Tenders';
import Verification from '../pages/Verification';
import Reports from '../pages/Reports';
import Bidders from '../pages/Bidders';
import Dashboard from '../pages/Dashboard';
import MyApplications from '../pages/MyApplications';
import Settings from '../pages/Settings';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Login />} />
      <Route path="/tenders" element={<Tenders />} />
      <Route path="/bidders" element={<Bidders />} />
      <Route path="/verification" element={<Verification />} />
      <Route path="/verification/:tenderId" element={<Verification />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/my-applications" element={<MyApplications />} />
      <Route path="/bidder-dashboard" element={<Navigate to="/my-applications" replace />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
