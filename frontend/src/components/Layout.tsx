import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
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
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Client } from '../types';

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

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Building2, superadminOnly: true },
    { id: 'whatsapp-accounts', label: 'WhatsApp Accounts', icon: Smartphone },
    { id: 'inbox', label: 'Inbox', icon: MessageSquare },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'templates', label: 'Templates', icon: FileCode },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'chatbot', label: 'Chatbot', icon: Bot },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'billing', label: 'Wallet & Billing', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'webhooks', label: 'API & Webhooks', icon: Webhook },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (item.superadminOnly && user?.role !== 'SUPERADMIN') return false;
    return true;
  });

  const activeTenantName = user?.role === 'SUPERADMIN'
    ? (activeTenantId ? clients.find(c => String(c.id) === String(activeTenantId))?.name || 'Selected Tenant' : 'All Tenants (Superadmin)')
    : (user?.client_details?.name || 'My Organization');

  return (
    <div className="flex h-screen bg-[#F5F7F8] overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E5E7EB] shadow-subtle z-30">
        {/* Brand Header */}
        <div className="flex items-center px-6 h-18 border-b border-[#E5E7EB] bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white shadow-md">
              <span className="font-bold text-lg tracking-wider">BB</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base text-gray-900 tracking-tight">BitByte</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">SaaS</span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">WhatsApp Cloud Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#075E54] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 mr-3 transition-colors ${isActive ? 'text-[#25D366]' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
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
        {/* Top Navigation */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 lg:px-8 flex items-center justify-between shrink-0 shadow-subtle z-20">
          {/* Mobile menu button & Current page title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 capitalize">
                {navItems.find(i => i.id === currentTab)?.label || 'Dashboard'}
              </h1>
              <p className="hidden sm:block text-xs text-gray-500">
                Official Meta WhatsApp Cloud API SaaS Engine
              </p>
            </div>
          </div>

          {/* Right Section: Global Search, Tenant Switcher, Notifications, Profile */}
          <div className="flex items-center space-x-3">
            {/* Global Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Global search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg w-52 focus:w-64 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Tenant Switcher (For Superadmin) */}
            {user?.role === 'SUPERADMIN' && clients.length > 0 && (
              <div className="relative">
                <select
                  value={activeTenantId || ''}
                  onChange={(e) => setActiveTenant(e.target.value || null)}
                  className="text-xs bg-emerald-50 border border-emerald-200 text-[#075E54] font-medium py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">All Tenants (Global)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Non-superadmin Active Client Indicator */}
            {user?.role !== 'SUPERADMIN' && (
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700">
                <Building className="w-3.5 h-3.5 text-gray-500" />
                <span>{activeTenantName}</span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.some(n => !n.is_read) && (
                  <span className="w-2 h-2 rounded-full bg-[#25D366] absolute top-1.5 right-1.5 animate-pulse" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Notifications</span>
                    <span className="text-[10px] text-gray-500">{notifications.length} alerts</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-500 p-4 text-center">No notifications available yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 text-xs">
                          <p className="font-semibold text-gray-800">{n.title}</p>
                          <p className="text-gray-600 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
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
              className="flex items-center space-x-1.5 text-xs font-medium text-gray-600 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 border border-gray-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-gray-900/50 flex">
            <div className="w-64 bg-white h-full flex flex-col p-4 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="font-bold text-gray-900">BitByte WhatsApp</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 space-y-1">
                {filteredNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                        currentTab === item.id ? 'bg-[#075E54] text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#F5F7F8]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
