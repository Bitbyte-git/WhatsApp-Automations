import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Send,
  CheckCheck,
  AlertCircle,
  Wallet,
  MessageSquare,
  Users,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import { OverviewStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { OverviewSkeleton } from '../components/Skeleton';

interface ClientOverviewViewProps {
  onNavigate: (tab: string) => void;
}

export const ClientOverviewView: React.FC<ClientOverviewViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getOverviewStats('');
        setStats(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load workspace summary.');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-sm flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const clientName = user?.client_details?.name || 'My Business';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Client Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome, {user?.full_name || clientName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#075E54] text-xs font-bold border border-emerald-200">
              {clientName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your WhatsApp campaigns, customer conversations, contacts, and wallet balance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('campaigns')}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#075E54] hover:bg-[#064e46] text-white text-xs font-bold shadow-xs transition-all"
          >
            <Send className="w-4 h-4 text-[#25D366]" />
            <span>New Broadcast</span>
          </button>
          <button
            onClick={() => onNavigate('inbox')}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Live Chat</span>
          </button>
        </div>
      </div>

      {/* Client KPI Cards (No Admin/Total Clients card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate('billing')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Wallet Balance</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{Number(stats?.total_wallet_balance || 0).toFixed(2)}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Click to recharge →</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#075E54] flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">WhatsApp Gateway</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {stats?.connected_accounts || 0} / {stats?.total_accounts || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Official Cloud API</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#075E54] flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Messages Sent</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_messages_sent || 0}</p>
            <p className="text-[11px] text-slate-500 mt-1">Total outbound</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Delivered</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.total_messages_delivered || 0}</p>
            <p className="text-[11px] text-slate-500 mt-1">Confirmed by Meta</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Message Categories Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
          Your WhatsApp Usage Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <p className="text-[11px] font-bold text-[#075E54] uppercase">Marketing</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.category_breakdown?.marketing || 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Campaigns & Offers</p>
          </div>
          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100">
            <p className="text-[11px] font-bold text-sky-800 uppercase">Utility</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.category_breakdown?.utility || 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Order & Bill Updates</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100">
            <p className="text-[11px] font-bold text-amber-800 uppercase">Authentication</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.category_breakdown?.authentication || 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">OTPs & Verification</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100">
            <p className="text-[11px] font-bold text-purple-800 uppercase">Service</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.category_breakdown?.service || 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Customer Replies</p>
          </div>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('contacts')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#075E54] text-left transition-all flex items-center space-x-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#075E54] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-900">Manage Contacts</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Add or import customer numbers</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('templates')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#075E54] text-left transition-all flex items-center space-x-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#075E54] flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-900">Message Templates</p>
            <p className="text-[11px] text-slate-500 mt-0.5">View approved Meta templates</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('billing')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#075E54] text-left transition-all flex items-center space-x-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#075E54] flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-900">Recharge Wallet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Top-up prepaid credits</p>
          </div>
        </button>
      </div>
    </div>
  );
};
