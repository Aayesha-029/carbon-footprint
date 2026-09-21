import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ChatProvider } from './contexts/ChatContext';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import ActivityLog from './components/ActivityLog';
import Analytics from './components/Analytics';
import Goals from './components/Goals';
import Recommendations from './components/Recommendations';
import Leaderboard from './components/Leaderboard';
import Badges from './components/Badges';
import ActivityHistory from './components/ActivityHistory';
import Profile from './components/Profile';
import Settings from './components/Settings';
import SupportCenter from './components/SupportCenter';
import TicketDetail from './components/TicketDetail';
import OAuthRedirect from './components/auth/OAuthRedirect';

// Admin components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminActivities from './components/admin/AdminActivities';
import AdminEmissions from './components/admin/AdminEmissions';
import AdminOrganizations from './components/admin/AdminOrganizations';
import AdminBadges from './components/admin/AdminBadges';
import AdminReports from './components/admin/AdminReports';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminSettings from './components/admin/AdminSettings';
import AdminLeaderboard from './components/admin/AdminLeaderboard';
import AdminTickets from './components/admin/AdminTickets';

// ============ ORGANIZER IMPORTS (UPDATED PATH) ============
import OrganizerRegister from './components/pages/organizer/OrganizerRegister';
import OrganizerDashboard from './components/pages/organizer/OrganizerDashboard';
import OrganizerMembers from './components/pages/organizer/OrganizerMembers';
import OrganizerAnalytics from './components/pages/organizer/OrganizerAnalytics';
import OrganizerSettings from './components/pages/organizer/OrganizerSettings';
import InvitationAccept from './components/pages/organizer/InvitationAccept';
import OrganizerEmployees from './components/pages/organizer/OrganizerEmployees';
import OrganizerBadges from './components/pages/organizer/OrganizerBadges';
import OrganizerActivities from './components/pages/organizer/OrganizerActivities';
import OrganizerEmissionFactors from './components/pages/organizer/OrganizerEmissionFactors';
import OrganizerLeaderboard from './components/pages/organizer/OrganizerLeaderboard';

import './styles/globals.css';
import './styles/globals.css';
import InstallPrompt from './components/InstallPrompt';
import OfflineBanner from './components/OfflineBanner';
// Protected Route wrapper
const ProtectedRoute = ({ children, adminOnly = false, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Feature Guard
const FeatureGuard = ({ children, featureKey, fallbackPath = '/dashboard' }) => {
  const { settings, loading } = useSettings();
  
  if (loading) {
    return <div className="spinner" style={{ 
      width: '40px', height: '40px',
      border: '4px solid #e2e8f0', borderTop: '4px solid #22c55e',
      borderRadius: '50%', animation: 'spin 1s linear infinite',
      margin: '40px auto'
    }} />;
  }
  
  const isEnabled = settings[featureKey] !== false;
  
  if (!isEnabled) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return children;
};

function AppRoutes() {
  console.log('🚀 App routes rendering...');

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth2/redirect" element={<OAuthRedirect />} />
      <Route path="/organizer/register" element={<OrganizerRegister />} />

      {/* User routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/activities" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><FeatureGuard featureKey="carbonGoalEnabled"><Goals /></FeatureGuard></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><FeatureGuard featureKey="leaderboardEnabled"><Leaderboard /></FeatureGuard></ProtectedRoute>} />
      <Route path="/badges" element={<ProtectedRoute><FeatureGuard featureKey="badgesEnabled"><Badges /></FeatureGuard></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><ActivityHistory /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><SupportCenter /></ProtectedRoute>} />
      <Route path="/support/ticket/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/activities" element={<ProtectedRoute adminOnly><AdminActivities /></ProtectedRoute>} />
      <Route path="/admin/emissions" element={<ProtectedRoute adminOnly><AdminEmissions /></ProtectedRoute>} />
      <Route path="/admin/organizations" element={<ProtectedRoute adminOnly><AdminOrganizations /></ProtectedRoute>} />
      <Route path="/admin/badges" element={<ProtectedRoute adminOnly><AdminBadges /></ProtectedRoute>} />
      <Route path="/admin/leaderboard" element={<ProtectedRoute adminOnly><AdminLeaderboard /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/tickets" element={<ProtectedRoute adminOnly><AdminTickets /></ProtectedRoute>} />
      {/* ============ Organizer routes (require ORGANIZER role) ============ */}
      <Route path="/organizer/dashboard" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}><OrganizerDashboard /></ProtectedRoute>
      } />
      <Route path="/organizer/employees" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}><OrganizerEmployees /></ProtectedRoute>
      } />
      <Route path="/organizer/badges" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}><OrganizerBadges /></ProtectedRoute>
      } />
      <Route path="/organizer/activities" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}><OrganizerActivities /></ProtectedRoute>
      } />
      <Route path="/organizer/emission-factors" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}><OrganizerEmissionFactors /></ProtectedRoute>
      } />
      <Route path="/organizer/analytics" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}><OrganizerAnalytics /></ProtectedRoute>
      } />
      <Route path="/organizer/leaderboard" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}><OrganizerLeaderboard /></ProtectedRoute>
      } />
      <Route path="/organizer/members" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}><OrganizerEmployees /></ProtectedRoute>
      } />
      <Route path="/organizer/settings" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}><OrganizerSettings /></ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <BrowserRouter>
          <ChatProvider>
            <OfflineBanner />
            <AppRoutes />
            <InstallPrompt />
          </ChatProvider>
        </BrowserRouter>
      </LanguageProvider>
    </SettingsProvider>
  );
}

export default App;