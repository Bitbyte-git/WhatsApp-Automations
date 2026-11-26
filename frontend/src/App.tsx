import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ClientLayout } from './components/ClientLayout';
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { OverviewView } from './views/OverviewView';
import { ClientOverviewView } from './views/ClientOverviewView';
import { ClientsView } from './views/ClientsView';
import { WhatsAppAccountsView } from './views/WhatsAppAccountsView';
import { InboxView } from './views/InboxView';
import { ContactsView } from './views/ContactsView';
import { TemplatesView } from './views/TemplatesView';
import { CampaignsView } from './views/CampaignsView';
import { MessageHistoryView } from './views/MessageHistoryView';
import { ChatbotView } from './views/ChatbotView';
import { AnalyticsView } from './views/AnalyticsView';
import { WalletBillingView } from './views/WalletBillingView';
import { MetaBalanceView } from './views/MetaBalanceView';
import { TransactionsView } from './views/TransactionsView';
import { ApiWebhooksView } from './views/ApiWebhooksView';
import { SettingsView } from './views/SettingsView';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#F5F7F8] flex flex-col items-center justify-center">
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white shadow-lg mb-4 animate-pulse">
      <span className="font-extrabold text-2xl tracking-wider">BB</span>
    </div>
    <p className="text-sm font-bold text-gray-800">BitByte Technologies</p>
    <p className="text-xs text-gray-500 mt-1">Connecting to WhatsApp SaaS Engine...</p>
  </div>
);

// 1. Dedicated Admin Dashboard (/admin/dashboard) - Untouched Admin Experience
const AdminDashboardApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'SUPERADMIN') return <Navigate to="/client/dashboard" replace />;

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'overview' && <OverviewView onNavigate={setCurrentTab} />}
      {currentTab === 'clients' && <ClientsView />}
      {currentTab === 'whatsapp-accounts' && <WhatsAppAccountsView />}
      {currentTab === 'inbox' && <InboxView />}
      {currentTab === 'contacts' && <ContactsView />}
      {currentTab === 'templates' && <TemplatesView />}
      {(currentTab === 'campaigns' || currentTab === 'marketing') && <CampaignsView initialCategory="MARKETING" onNavigate={setCurrentTab} />}
      {currentTab === 'utility' && <CampaignsView initialCategory="UTILITY" onNavigate={setCurrentTab} />}
      {currentTab === 'service' && <CampaignsView initialCategory="SERVICE" onNavigate={setCurrentTab} />}
      {currentTab === 'message-history' && <MessageHistoryView />}
      {currentTab === 'chatbot' && <ChatbotView />}
      {currentTab === 'analytics' && <AnalyticsView />}
      {currentTab === 'billing' && <WalletBillingView />}
      {currentTab === 'transactions' && <TransactionsView />}
      {currentTab === 'webhooks' && <ApiWebhooksView />}
      {currentTab === 'meta-balance' && <MetaBalanceView />}
      {currentTab === 'settings' && <SettingsView />}
    </Layout>
  );
};

// 2. Dedicated Client Dashboard (/client/dashboard) - Completely Separate Client Portal
const ClientDashboardApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SUPERADMIN') return <Navigate to="/admin/dashboard" replace />;

  return (
    <ClientLayout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'overview' && <ClientOverviewView onNavigate={setCurrentTab} />}
      {currentTab === 'campaigns' && <CampaignsView initialCategory="MARKETING" onNavigate={setCurrentTab} />}
      {currentTab === 'inbox' && <InboxView />}
      {currentTab === 'message-history' && <MessageHistoryView />}
      {currentTab === 'contacts' && <ContactsView />}
      {currentTab === 'templates' && <TemplatesView />}
      {currentTab === 'billing' && <WalletBillingView />}
      {currentTab === 'transactions' && <TransactionsView />}
      {currentTab === 'analytics' && <AnalyticsView />}
      {currentTab === 'settings' && <SettingsView />}
    </ClientLayout>
  );
};

// Role-based smart redirect for /dashboard
const RoleDashboardRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'SUPERADMIN' ? '/admin/dashboard' : '/client/dashboard'} replace />;
};

export const AppContent: React.FC = () => {
  const { user } = useAuth();
  const homeRedirect = user?.role === 'SUPERADMIN' ? '/admin/dashboard' : '/client/dashboard';

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Home */}
        <Route path="/" element={<LandingView />} />

        {/* Dedicated Separate Login Page */}
        <Route
          path="/login"
          element={user ? <Navigate to={homeRedirect} replace /> : <LoginView />}
        />

        {/* Dedicated Separate Register Page */}
        <Route
          path="/register"
          element={user ? <Navigate to={homeRedirect} replace /> : <RegisterView />}
        />

        {/* Separate Role-Based Dashboards */}
        <Route path="/admin/dashboard" element={<AdminDashboardApp />} />
        <Route path="/client/dashboard" element={<ClientDashboardApp />} />
        <Route path="/dashboard" element={<RoleDashboardRedirect />} />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppContent;
