import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileCode,
  Send,
  BarChart3,
  Wallet,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  History,
  Smartphone,
  Bot,
  Package,
  Headphones,
  ChevronDown,
  ChevronRight,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConnectWhatsAppModal } from './ConnectWhatsAppModal';
import { api } from '../services/api';

interface ClientLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ currentTab, setCurrentTab, children }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(true);
  const [connectedAccount, setConnectedAccount] = useState<any>(null);

  const fetchConnectedAccount = async () => {
    try {
      const res = await api.getWhatsAppAccounts();
      const accounts = Array.isArray(res) ? res : res?.results || [];
      const connected = accounts.find((a: any) => a.connection_status === 'CONNECTED');
      if (connected) {
        setConnectedAccount(connected);
      } else {
        setConnectedAccount(null);
      }
    } catch {
      setConnectedAccount(null);
    }
  };

  useEffect(() => {
    fetchConnectedAccount();
  }, [user]);

  const clientName = user?.client_details?.name || 'My Business';

  const serviceItems = [
    { id: 'marketing', label: 'Marketing', icon: Send, badge: 'Offers' },
    { id: 'utility', label: 'Utility', icon: Package, badge: 'Orders' },
    { id: 'service', label: 'Service', icon: Headphones, badge: '24h' },
    { id: 'chatbot', label: 'Chatbot', icon: Bot, badge: 'AI' },
  ];

  const otherNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inbox', label: 'Live Chat', icon: MessageSquare },
    { id: 'message-history', label: 'Message History', icon: History },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'templates', label: 'Meta Templates', icon: FileCode },
    { id: 'billing', label: 'Wallet & Plans', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isServiceActive = ['marketing', 'campaigns', 'utility', 'service', 'chatbot'].includes(currentTab);

  const getPageTitle = (tab: string) => {
    if (tab === 'marketing' || tab === 'campaigns') return 'Marketing Broadcast Studio';
    if (tab === 'utility') return 'Utility Notifications';
    if (tab === 'service') return 'Customer Service';
    if (tab === 'chatbot') return 'AI Autonomous Chatbot';
    const found = otherNavItems.find((n) => n.id === tab);
    return found ? found.label : 'Client Portal';
  };

  const renderNavButtons = () => (
    <>
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
        <LayoutDashboard className={`w-4 h-4 mr-3 transition-colors ${currentTab === 'overview' ? 'text-[#25D366]' : 'text-gray-400'}`} />
        <span>Overview</span>
      </button>

      {/* Services Dropdown/Group */}
      <div className="pt-2">
        <button
          onClick={() => setServicesOpen(!servicesOpen)}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            isServiceActive ? 'text-[#075E54] bg-emerald-50/70' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Layers className={`w-4 h-4 ${isServiceActive ? 'text-[#075E54]' : 'text-slate-400'}`} />
            <span>Services</span>
          </div>
          {servicesOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {servicesOpen && (
          <div className="ml-3 pl-2.5 border-l-2 border-emerald-100 mt-1 space-y-0.5">
            {serviceItems.map((item) => {
              const Icon = item.icon;
              const active =
                currentTab === item.id || (item.id === 'marketing' && currentTab === 'campaigns');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#075E54] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-[#075E54]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#25D366]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold ${
                      active
                        ? 'bg-emerald-800 text-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Other Nav Items */}
      <div className="pt-2 border-t border-slate-100 space-y-1">
        {otherNavItems
          .filter((i) => i.id !== 'overview')
          .map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#075E54] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-[#075E54]'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 transition-colors ${active ? 'text-[#25D366]' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F5F7F8] overflow-hidden">
      {/* Client Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shadow-xs z-30">
        {/* Brand Header */}
        <div className="flex items-center px-6 h-20 border-b border-slate-200/80 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white shadow-md">
              <span className="font-extrabold text-lg tracking-wider">BB</span>
            </div>
            <div>
              <span className="font-black text-lg text-slate-900 tracking-tight block truncate max-w-[140px]">
                {clientName}
              </span>
              <p className="text-[11px] text-emerald-700 font-semibold">Client WhatsApp Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {renderNavButtons()}
        </div>

        {/* Client User Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#075E54] flex items-center justify-center font-black text-sm shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || 'Client User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold text-slate-400 hidden sm:inline">{clientName}</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#075E54] font-bold">
                {getPageTitle(currentTab)}
              </span>
              <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] mr-1.5 animate-pulse" />
                Cloud API Active
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {connectedAccount && connectedAccount.connection_status === 'CONNECTED' ? (
              <button
                onClick={() => setConnectModalOpen(true)}
                title="Click to view connected WhatsApp account details"
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-xs transition-all cursor-pointer group"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-emerald-950 font-black">
                  {connectedAccount.display_phone_number || connectedAccount.phone_number}
                </span>
                <span className="hidden md:inline text-[9px] bg-emerald-200/90 text-emerald-900 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                  Connected
                </span>
              </button>
            ) : (
              <button
                onClick={() => setConnectModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect WhatsApp</span>
              </button>
            )}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[85%] bg-white h-full flex flex-col shadow-2xl z-10">
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
              <span className="font-black text-base text-slate-900">{clientName}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {renderNavButtons()}
            </div>
          </div>
        </div>
      )}

      {/* Connect WhatsApp Modal */}
      <ConnectWhatsAppModal
        isOpen={connectModalOpen}
        onClose={() => {
          setConnectModalOpen(false);
          fetchConnectedAccount();
        }}
        onSuccess={() => fetchConnectedAccount()}
      />
    </div>
  );
};
