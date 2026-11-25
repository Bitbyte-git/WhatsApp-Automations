import React, { useEffect, useState } from 'react';
import {
  Users,
  Smartphone,
  Send,
  CheckCheck,
  AlertCircle,
  Wallet,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Inbox,
  BarChart2,
} from 'lucide-react';
import { OverviewSkeleton } from '../components/Skeleton';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { OverviewStats } from '../types';
import { useAuth } from '../context/AuthContext';

export const OverviewView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { user, activeTenantId } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [activity, setActivity] = useState<any>(null);
  const [chartRange, setChartRange] = useState<'today' | '7d' | '30d'>('7d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const tenantParam = activeTenantId ? `client_id=${activeTenantId}` : '';
      const [overviewRes, activityRes, analyticsRes] = await Promise.all([
        api.getOverviewStats(tenantParam),
        api.getRecentActivity(tenantParam),
        api.getMessageAnalytics(chartRange, tenantParam),
      ]);
      setStats(overviewRes);
      setActivity(activityRes);
      setAnalyticsData(analyticsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId, chartRange]);

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-sm">
        <div className="flex items-center space-x-2 font-bold mb-1">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>Error loading overview metrics</span>
        </div>
        <p>{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const isSuperadmin = user?.role === 'SUPERADMIN';
  const hasRecords = stats && (stats.total_messages_sent > 0 || stats.total_accounts > 0 || (isSuperadmin && stats.total_clients > 0));

  return (
    <div className="space-y-8">
      {/* Page Header with Generous Breathing Room */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview Dashboard</h1>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#075E54] text-[11px] font-bold border border-emerald-200/60 shadow-2xs">
              {isSuperadmin ? 'Superadmin Platform' : 'Client Store'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-tenant WhatsApp Business metrics synced with Neon PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('inbox')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-[#075E54] hover:bg-[#064E3B] rounded-xl shadow-md shadow-emerald-950/10 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open Team Inbox</span>
          </button>
          <button
            onClick={() => onNavigate('whatsapp-accounts')}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span>WhatsApp Accounts</span>
          </button>
        </div>
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Clients"
          value={stats?.total_clients ?? 0}
          icon={Users}
          subtext={isSuperadmin ? "Active business tenants" : "Assigned tenant"}
        />
        <StatCard
          title="Connected Accounts"
          value={`${stats?.connected_accounts ?? 0} / ${stats?.total_accounts ?? 0}`}
          icon={Smartphone}
          subtext="Meta Cloud API status"
        />
        <StatCard
          title="Messages Sent"
          value={stats?.total_messages_sent ?? 0}
          icon={Send}
          subtext="Outbound messages"
        />
        <StatCard
          title="Delivered"
          value={stats?.total_messages_delivered ?? 0}
          icon={CheckCheck}
          subtext="Confirmed by Meta"
        />
        <StatCard
          title="Failed"
          value={stats?.total_messages_failed ?? 0}
          icon={AlertCircle}
          subtext="Delivery errors"
        />
        <StatCard
          title="Wallet Balance"
          value={`₹${(stats?.total_wallet_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          subtext="Prepaid messaging credits"
        />
      </div>

      {/* Message Category Breakdown Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              WhatsApp Message Categories
            </h3>
            <p className="text-xs text-gray-500">
              Breakdown across official Meta pricing tiers: Marketing, Utility, Authentication, and Service.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 mt-2 sm:mt-0 bg-gray-50 p-1 rounded-xl border border-gray-200">
            {(['today', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  chartRange === r ? 'bg-[#075E54] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'Today'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Metrics Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Marketing</span>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats?.category_breakdown?.marketing ?? 0}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Promotions & broadcasts</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">Utility</span>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats?.category_breakdown?.utility ?? 0}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Order updates & receipts</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Authentication</span>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats?.category_breakdown?.authentication ?? 0}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">OTPs & verification codes</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
            <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider">Service</span>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats?.category_breakdown?.service ?? 0}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Customer support replies</p>
          </div>
        </div>

        {/* Real Data Chart Visualization */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
            Daily Message Activity Timeline ({chartRange})
          </h4>
          {analyticsData && analyticsData.time_series && analyticsData.time_series.some((d: any) => d.sent > 0 || d.delivered > 0) ? (
            <div className="space-y-3">
              {analyticsData.time_series.map((item: any, idx: number) => {
                const max = Math.max(...analyticsData.time_series.map((d: any) => d.sent || 1));
                const pct = Math.min(100, Math.round(((item.sent || 0) / max) * 100));
                return (
                  <div key={idx} className="flex items-center text-xs">
                    <span className="w-16 font-medium text-gray-600 shrink-0">{item.date}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 mx-3 overflow-hidden flex">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-[#25D366] h-full transition-all duration-300"
                        title={`Sent: ${item.sent}`}
                      />
                    </div>
                    <span className="w-20 text-right font-semibold text-gray-800">
                      {item.sent} sent
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <BarChart2 className="w-6 h-6 mx-auto mb-2 text-gray-300" />
              <span>No message records found in the database for this timeframe.</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Client Registrations */}
        {isSuperadmin && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Recent Clients</h3>
              <button
                onClick={() => onNavigate('clients')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-50 mt-3">
              {activity?.recent_clients?.length > 0 ? (
                activity.recent_clients.map((c: any) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-800">{c.name}</p>
                      <p className="text-[11px] text-gray-500">{c.company_email}</p>
                    </div>
                    <Badge status={c.status} />
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">No client registrations yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-card ${isSuperadmin ? '' : 'lg:col-span-1'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Recent Transactions</h3>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50 mt-3">
            {activity?.recent_transactions?.length > 0 ? (
              activity.recent_transactions.map((t: any) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="truncate mr-2">
                    <p className="font-semibold text-gray-800 truncate">{t.description}</p>
                    <span className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`font-bold shrink-0 ${t.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-gray-800'}`}>
                    {t.transaction_type === 'CREDIT' ? '+' : '-'}₹{parseFloat(t.amount).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No transaction records yet.</p>
            )}
          </div>
        </div>

        {/* Recent WhatsApp Messages */}
        <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-card ${isSuperadmin ? '' : 'lg:col-span-2'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Recent WhatsApp Activity</h3>
            <button
              onClick={() => onNavigate('inbox')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Open Inbox
            </button>
          </div>
          <div className="divide-y divide-gray-50 mt-3">
            {activity?.recent_messages?.length > 0 ? (
              activity.recent_messages.map((m: any) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="truncate mr-3">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${m.direction === 'INBOUND' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                      <span className="font-semibold text-gray-800">{m.contact_phone || 'WhatsApp User'}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{m.content || `[${m.message_type}]`}</p>
                  </div>
                  <Badge status={m.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No messages sent or received yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
