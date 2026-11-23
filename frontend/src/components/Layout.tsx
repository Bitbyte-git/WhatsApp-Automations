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
    { id: 'campaigns', label: 'WhatsApp Blast', icon: Send },
    { id: 'inbox', label: 'Live Inbox', icon: MessageSquare },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'billing', label: 'Wallet & Plans', icon: Wallet },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'whatsapp-accounts', label: 'WhatsApp Accounts', icon: Smartphone, superadminOnly: true },
    { id: 'templates', label: 'Meta Templates', icon: FileCode, superadminOnly: true },
    { id: 'chatbot', label: 'Chatbot', icon: Bot, superadminOnly: true },
    { id: 'transactions', label: 'Transactions', icon: Receipt, superadminOnly: true },
    { id: 'webhooks', label: 'API & Webhooks', icon: Webhook, superadminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, superadminOnly: true },
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
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shadow-xs z-30">
        {/* Brand Header */}
        <div className="flex items-center px-6 h-20 border-b border-slate-200/80 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white shadow-md">
              <span className="font-extrabold text-lg tracking-wider">BB</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-base text-slate-900 tracking-tight">BitByte</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-[#075E54]">SaaS</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">WhatsApp Cloud Platform</p>
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
        <header className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-8 flex items-center justify-between shrink-0 shadow-xs z-20">
          {/* Mobile menu button & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-800 hidden sm:inline">BitByte Platform</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-[#075E54] font-black capitalize text-sm bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-2xs">
                {navItems.find(i => i.id === currentTab)?.label || 'Dashboard'}
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                Cloud API Engine Online
              </span>
            </div>
          </div>

          {/* Right Section: Global Search, Tenant Switcher, Notifications, Profile */}
          <div className="flex items-center space-x-3">
            {/* Global Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Global search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 focus:w-64 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* Tenant Switcher (For Superadmin) */}
            {user?.role === 'SUPERADMIN' && clients.length > 0 && (
              <div className="relative">
                <select
                  value={activeTenantId || ''}
                  onChange={(e) => setActiveTenant(e.target.value || null)}
                  className="text-xs bg-emerald-50 border border-emerald-200 text-[#075E54] font-bold py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                >
                  <option value="">All Shops (Global View)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Non-superadmin Active Client Indicator */}
            {user?.role !== 'SUPERADMIN' && (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>{activeTenantName}</span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.some(n => !n.is_read) && (
                  <span className="w-2 h-2 rounded-full bg-[#25D366] absolute top-1.5 right-1.5 animate-pulse" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</span>
                    <span className="text-[10px] text-slate-500">{notifications.length} alerts</span>
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
                {filteredNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${
                        currentTab === item.id ? 'bg-[#075E54] text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
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

        {/* Content Body with Proper Breathing Room */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 bg-[#F8FAFC]">
          <div className="max-w-[1550px] mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
