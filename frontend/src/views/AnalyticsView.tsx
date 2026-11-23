import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  TrendingUp,
  Download,
  Send,
  CheckCheck,
  AlertCircle,
  PieChart,
  Wallet,
} from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

export const AnalyticsView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');
  const [data, setData] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const tenantParam = activeTenantId ? `client_id=${activeTenantId}` : '';
      const [analyticsRes, overviewRes] = await Promise.all([
        api.getMessageAnalytics(range, tenantParam),
        api.getOverviewStats(tenantParam),
      ]);
      setData(analyticsRes);
      setOverview(overviewRes);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [range, activeTenantId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Analytics & Usage Reports</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Aggregated delivery rates, Meta category costs, and volume trends computed from actual PostgreSQL logs.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-gray-200 shadow-subtle">
            {(['today', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  range === r ? 'bg-[#075E54] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'Today'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Period Messages"
          value={data?.total_messages ?? 0}
          icon={Send}
          subtext={`Calculated for ${range}`}
        />
        <StatCard
          title="Delivered Rate"
          value={overview?.total_messages_sent > 0
            ? `${Math.round(((overview.total_messages_delivered || 0) / overview.total_messages_sent) * 100)}%`
            : '0%'
          }
          icon={CheckCheck}
          subtext="Meta delivery confirmation"
        />
        <StatCard
          title="Failure Rate"
          value={overview?.total_messages_sent > 0
            ? `${Math.round(((overview.total_messages_failed || 0) / overview.total_messages_sent) * 100)}%`
            : '0%'
          }
          icon={AlertCircle}
          subtext="Undelivered or invalid numbers"
        />
        <StatCard
          title="Total Wallet Debits"
          value={`₹${(overview?.total_wallet_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          subtext="Active balance remaining"
        />
      </div>

      {/* Time-Series Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
          Message Traffic Breakdown ({range})
        </h3>
        {data && data.time_series && data.time_series.length > 0 ? (
          <div className="space-y-3">
            {data.time_series.map((item: any, idx: number) => {
              const max = Math.max(...data.time_series.map((d: any) => d.sent || 1));
              const pct = Math.min(100, Math.round(((item.sent || 0) / max) * 100));
              return (
                <div key={idx} className="flex items-center text-xs">
                  <span className="w-16 font-medium text-gray-600 shrink-0">{item.date}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 mx-3 overflow-hidden flex">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-[#25D366] h-full transition-all duration-300"
                    />
                  </div>
                  <div className="w-40 text-right space-x-2 font-medium">
                    <span className="text-gray-800">{item.sent} sent</span>
                    <span className="text-emerald-600">{item.delivered} delivered</span>
                    <span className="text-rose-600">{item.failed} failed</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No message analytics recorded in the database yet.
          </div>
        )}
      </div>

      {/* Categories Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
            Official Meta Category Usage
          </h3>
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Marketing (Promotions, Offers)</span>
                <span>{data?.categories?.marketing ?? 0} msgs</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (data?.categories?.marketing || 0) * 10)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Utility (Transactions, Orders, Invoices)</span>
                <span>{data?.categories?.utility ?? 0} msgs</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (data?.categories?.utility || 0) * 10)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Authentication (OTPs, Security)</span>
                <span>{data?.categories?.authentication ?? 0} msgs</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (data?.categories?.authentication || 0) * 10)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Service (Inbound Support 24h Window)</span>
                <span>{data?.categories?.service ?? 0} msgs</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${Math.min(100, (data?.categories?.service || 0) * 10)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
            Pricing & Charge Structure
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Transparent breakdown separating Meta Cloud API pass-through charges from BitByte platform fees.
          </p>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">Marketing Conversation</p>
                <p className="text-[11px] text-gray-400">Meta pass-through: ₹0.70 + BitByte platform: ₹0.15</p>
              </div>
              <span className="font-bold text-gray-900">₹0.85 / msg</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">Utility Message</p>
                <p className="text-[11px] text-gray-400">Meta pass-through: ₹0.30 + BitByte platform: ₹0.10</p>
              </div>
              <span className="font-bold text-gray-900">₹0.40 / msg</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">Service Conversation</p>
                <p className="text-[11px] text-gray-400">Meta pass-through: ₹0.30 + BitByte platform: ₹0.10</p>
              </div>
              <span className="font-bold text-gray-900">₹0.40 / msg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
