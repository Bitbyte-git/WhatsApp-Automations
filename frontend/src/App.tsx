import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { OverviewView } from './views/OverviewView';
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
import { TransactionsView } from './views/TransactionsView';
import { ApiWebhooksView } from './views/ApiWebhooksView';
import { SettingsView } from './views/SettingsView';

// Protected Dashboard Component
const DashboardApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7F8] flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white shadow-lg mb-4 animate-pulse">
          <span className="font-extrabold text-2xl tracking-wider">BB</span>
        </div>
        <p className="text-sm font-bold text-gray-800">BitByte Technologies</p>
        <p className="text-xs text-gray-500 mt-1">Connecting to WhatsApp SaaS Engine...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

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
      {currentTab === 'settings' && <SettingsView />}
    </Layout>
  );
};

export const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Home */}
        <Route path="/" element={<LandingView />} />

        {/* Dedicated Separate Login Page */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginView />}
        />

        {/* Dedicated Separate Register Page */}
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <RegisterView />}
        />

        {/* Protected SaaS Multi-Tenant Dashboard */}
        <Route path="/dashboard" element={<DashboardApp />} />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppContent;
