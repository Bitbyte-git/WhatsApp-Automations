import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building,
  Building2,
  Smartphone,
  MessageSquare,
  Users,
  FileCode,
  Send,
  Bot,
  BarChart3,
  Wallet,
  Receipt,
  Webhook,
  Settings,
  LogOut,
  Search,
  Bell,
  CheckCircle,
  Menu,
  X,
  ChevronDown,
  Layers,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Client } from '../types';
import { ConnectWhatsAppModal } from './ConnectWhatsAppModal';

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, setCurrentTab, children }) => {
  const { user, logout, activeTenantId, setActiveTenant } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  // Services Dropdown Toggle
  const isServiceActive = ['marketing', 'utility', 'service', 'campaigns', 'chatbot'].includes(currentTab);
  const [servicesOpen, setServicesOpen] = useState(true);

  useEffect(() => {
    if (user?.role === 'SUPERADMIN') {
      api.getClients().then((data) => {
        if (data && data.results) setClients(data.results);
      }).catch(() => {});
    }

    api.getNotifications().then((data) => {
      if (Array.isArray(data)) setNotifications(data);
      else if (data && data.results) setNotifications(data.results);
    }).catch(() => {});
  }, [user]);

  const activeTenantName = user?.role === 'SUPERADMIN'
    ? (activeTenantId ? clients.find(c => String(c.id) === String(activeTenantId))?.name || 'Selected Tenant' : 'All Tenants (Superadmin)')
    : (user?.client_details?.name || 'My Organization');

  return (
    <div className="flex h-screen bg-[#F5F7F8] overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shadow-xs z-30">
        {/* Brand Header without SaaS badge */}
        <div className="flex items-center px-6 h-20 border-b border-slate-200/80 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white shadow-md">
              <span className="font-extrabold text-lg tracking-wider">BB</span>
            </div>
            <div>
              <span className="font-black text-lg text-slate-900 tracking-tight block">BitByte</span>
              <p className="text-[11px] text-slate-500 font-medium">WhatsApp Cloud Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Overview */}
          <button
            onClick={() => {
              setCurrentTab('overview');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'overview'
                ? 'bg-[#075E54] text-white shadow-sm'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
            }`}
          >
            <LayoutDashboard className={`w-4.5 h-4.5 mr-3 transition-colors ${currentTab === 'overview' ? 'text-[#25D366]' : 'text-gray-400'}`} />
            <span>Overview</span>
          </button>

          {/* Services Dropdown */}
          <div className="space-y-1 pt-1">
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isServiceActive
                  ? 'bg-emerald-50 text-[#075E54] font-bold'
                  : 'text-gray-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center">
                <Layers className="w-4.5 h-4.5 mr-3 text-[#075E54]" />
                <span>Services</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
            </button>

            {servicesOpen && (
              <div className="pl-6 pr-1 space-y-1">
                {/* 1. Marketing */}
                <button
                  onClick={() => {
                    setCurrentTab('marketing');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'marketing' || currentTab === 'campaigns'
                      ? 'bg-[#075E54] text-white shadow-2xs'
                      : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
                  }`}
                >
                  <Send className={`w-3.5 h-3.5 mr-2.5 ${currentTab === 'marketing' || currentTab === 'campaigns' ? 'text-[#25D366]' : 'text-gray-400'}`} />
                  <span>Marketing</span>
                </button>

                {/* 2. Utility */}
                <button
                  onClick={() => {
                    setCurrentTab('utility');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'utility'
                      ? 'bg-[#075E54] text-white shadow-2xs'
                      : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
                  }`}
                >
                  <Receipt className={`w-3.5 h-3.5 mr-2.5 ${currentTab === 'utility' ? 'text-[#25D366]' : 'text-gray-400'}`} />
                  <span>Utility</span>
                </button>

                {/* 3. Service */}
                <button
                  onClick={() => {
                    setCurrentTab('service');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'service'
                      ? 'bg-[#075E54] text-white shadow-2xs'
                      : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 mr-2.5 ${currentTab === 'service' ? 'text-[#25D366]' : 'text-gray-400'}`} />
                  <span>Service</span>
                </button>

                {/* 4. Chatbot */}
                <button
                  onClick={() => {
                    setCurrentTab('chatbot');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'chatbot'
                      ? 'bg-[#075E54] text-white shadow-2xs'
                      : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
                  }`}
                >
                  <Bot className={`w-3.5 h-3.5 mr-2.5 ${currentTab === 'chatbot' ? 'text-[#25D366]' : 'text-gray-400'}`} />
                  <span>Chatbot</span>
                </button>
              </div>
            )}
          </div>

          {/* Live Chat (Inbox) */}
          <button
            onClick={() => {
              setCurrentTab('inbox');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'inbox'
                ? 'bg-[#075E54] text-white shadow-sm'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
            }`}
          >
            <MessageSquare className={`w-4.5 h-4.5 mr-3 transition-colors ${currentTab === 'inbox' ? 'text-[#25D366]' : 'text-gray-400'}`} />
            <span>Live Chat</span>
          </button>

          {/* Message History */}
          <button
            onClick={() => {
              setCurrentTab('message-history');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'message-history'
                ? 'bg-[#075E54] text-white shadow-sm'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
            }`}
          >
            <History className={`w-4.5 h-4.5 mr-3 transition-colors ${currentTab === 'message-history' ? 'text-[#25D366]' : 'text-gray-400'}`} />
            <span>Message History</span>
          </button>

          {/* Contacts */}
          <button
            onClick={() => {
              setCurrentTab('contacts');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'contacts'
                ? 'bg-[#075E54] text-white shadow-sm'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
            }`}
          >
            <Users className={`w-4.5 h-4.5 mr-3 transition-colors ${currentTab === 'contacts' ? 'text-[#25D366]' : 'text-gray-400'}`} />
            <span>Contacts</span>
          </button>

          {/* Transactions (with PDF Bill) */}
          <button
            onClick={() => {
              setCurrentTab('transactions');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'transactions'
                ? 'bg-[#075E54] text-white shadow-sm'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
            }`}
          >
            <Receipt className={`w-4.5 h-4.5 mr-3 transition-colors ${currentTab === 'transactions' ? 'text-[#25D366]' : 'text-gray-400'}`} />
            <span>Transactions</span>
          </button>

          {/* Wallet & Plans */}
          <button
            onClick={() => {
              setCurrentTab('billing');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'billing'
                ? 'bg-[#075E54] text-white shadow-sm'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
            }`}
          >
            <Wallet className={`w-4.5 h-4.5 mr-3 transition-colors ${currentTab === 'billing' ? 'text-[#25D366]' : 'text-gray-400'}`} />
            <span>Wallet & Plans</span>
          </button>

          {/* Reports & Analytics */}
          <button
            onClick={() => {
              setCurrentTab('analytics');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'analytics'
                ? 'bg-[#075E54] text-white shadow-sm'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
            }`}
          >
            <BarChart3 className={`w-4.5 h-4.5 mr-3 transition-colors ${currentTab === 'analytics' ? 'text-[#25D366]' : 'text-gray-400'}`} />
            <span>Reports & Analytics</span>
          </button>

          {/* Superadmin Menu Section */}
          {user?.role === 'SUPERADMIN' && (
            <div className="pt-3 border-t border-slate-100 space-y-1">
              <p className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Superadmin</p>
              <button
                onClick={() => { setCurrentTab('clients'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3.5 py-2 rounded-lg text-xs font-medium ${currentTab === 'clients' ? 'bg-[#075E54] text-white' : 'text-gray-600 hover:bg-slate-50'}`}
              >
                <Building2 className="w-4 h-4 mr-2.5 text-gray-400" />
                <span>Clients</span>
              </button>
              <button
                onClick={() => { setCurrentTab('whatsapp-accounts'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3.5 py-2 rounded-lg text-xs font-medium ${currentTab === 'whatsapp-accounts' ? 'bg-[#075E54] text-white' : 'text-gray-600 hover:bg-slate-50'}`}
              >
                <Smartphone className="w-4 h-4 mr-2.5 text-gray-400" />
                <span>WhatsApp Gateways</span>
              </button>
              <button
                onClick={() => { setCurrentTab('business-profile'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3.5 py-2 rounded-lg text-xs font-medium ${currentTab === 'business-profile' ? 'bg-[#075E54] text-white' : 'text-gray-600 hover:bg-slate-50'}`}
              >
                <Building2 className="w-4 h-4 mr-2.5 text-gray-400" />
                <span>Business Profile</span>
              </button>
              <button
                onClick={() => { setCurrentTab('templates'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3.5 py-2 rounded-lg text-xs font-medium ${currentTab === 'templates' ? 'bg-[#075E54] text-white' : 'text-gray-600 hover:bg-slate-50'}`}
              >
                <FileCode className="w-4 h-4 mr-2.5 text-gray-400" />
                <span>Meta Templates</span>
              </button>
              <button
                onClick={() => { setCurrentTab('webhooks'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3.5 py-2 rounded-lg text-xs font-medium ${currentTab === 'webhooks' ? 'bg-[#075E54] text-white' : 'text-gray-600 hover:bg-slate-50'}`}
              >
                <Webhook className="w-4 h-4 mr-2.5 text-gray-400" />
                <span>API & Webhooks</span>
              </button>
              <button
                onClick={() => { setCurrentTab('meta-balance'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3.5 py-2 rounded-lg text-xs font-medium ${currentTab === 'meta-balance' ? 'bg-[#075E54] text-white' : 'text-gray-600 hover:bg-slate-50'}`}
              >
                <Wallet className="w-4 h-4 mr-2.5 text-gray-400" />
                <span>Meta Balance</span>
              </button>
              <button
                onClick={() => { setCurrentTab('settings'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3.5 py-2 rounded-lg text-xs font-medium ${currentTab === 'settings' ? 'bg-[#075E54] text-white' : 'text-gray-600 hover:bg-slate-50'}`}
              >
                <Settings className="w-4 h-4 mr-2.5 text-gray-400" />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* User Info / Tenant Info */}
        <div className="p-4 border-t border-[#E5E7EB] bg-gray-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Navbar */}
        <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8 z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-400">BitByte Platform</span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-[#075E54] capitalize bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                {currentTab.replace('-', ' ')}
              </span>
              <span className="hidden sm:inline-flex items-center space-x-1.5 text-[11px] text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cloud API Engine Online</span>
              </span>
            </div>
          </div>

          {/* Right Header Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Search Input */}
            <div className="hidden md:flex items-center relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              <input
                type="text"
                placeholder="Global search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-48 focus:outline-none focus:w-64 focus:border-[#075E54] focus:bg-white transition-all"
              />
            </div>

            {/* Superadmin Tenant Selector */}
            {user?.role === 'SUPERADMIN' && (
              <div className="hidden sm:flex items-center space-x-2">
                <select
                  value={activeTenantId || ''}
                  onChange={(e) => setActiveTenant(e.target.value || null)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#075E54]"
                >
                  <option value="">All Tenants (Global)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {user?.role !== 'SUPERADMIN' && (
              <span className="hidden sm:inline-flex items-center px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                <Building className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                {activeTenantName}
              </span>
            )}

            {/* Connect WhatsApp Quick Action */}
            <button
              onClick={() => setConnectModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd5b] text-white rounded-xl text-xs font-bold shadow-sm transition-all shadow-emerald-500/20 active:scale-95"
              title="Connect WhatsApp and sync real contacts"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
              <span>Connect WhatsApp</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl relative transition-colors"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-800">Notifications</span>
                    <span className="text-[10px] text-slate-400">{notifications.length} new</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 p-4 text-center">No notifications available yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 text-xs">
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-600 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 px-3.5 py-2 rounded-xl hover:bg-rose-50 border border-slate-200 transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 flex">
            <div className="w-64 bg-white h-full flex flex-col p-4 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-900">BitByte WhatsApp</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 space-y-1">
                <button
                  onClick={() => { setCurrentTab('overview'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'overview' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-3" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('marketing'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'marketing' || currentTab === 'campaigns' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <Send className="w-4 h-4 mr-3" />
                  <span>Marketing</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('utility'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'utility' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <Receipt className="w-4 h-4 mr-3" />
                  <span>Utility</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('service'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'service' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <MessageSquare className="w-4 h-4 mr-3" />
                  <span>Service</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('chatbot'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'chatbot' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <Bot className="w-4 h-4 mr-3" />
                  <span>Chatbot</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('inbox'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'inbox' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <MessageSquare className="w-4 h-4 mr-3" />
                  <span>Live Chat</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('message-history'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'message-history' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <History className="w-4 h-4 mr-3" />
                  <span>Message History</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('contacts'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'contacts' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <Users className="w-4 h-4 mr-3" />
                  <span>Contacts</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('transactions'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'transactions' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <Receipt className="w-4 h-4 mr-3" />
                  <span>Transactions</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('billing'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'billing' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <Wallet className="w-4 h-4 mr-3" />
                  <span>Wallet & Plans</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('meta-balance'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'meta-balance' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <Wallet className="w-4 h-4 mr-3" />
                  <span>Meta Balance</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('business-profile'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'business-profile' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <Building2 className="w-4 h-4 mr-3" />
                  <span>Business Profile</span>
                </button>
                <button
                  onClick={() => { setCurrentTab('analytics'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${currentTab === 'analytics' ? 'bg-[#075E54] text-white' : 'text-slate-700'}`}
                >
                  <BarChart3 className="w-4 h-4 mr-3" />
                  <span>Reports & Analytics</span>
                </button>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-xl"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F5F7F8]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Connect WhatsApp & Real Contacts Sync Modal */}
      <ConnectWhatsAppModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
};
