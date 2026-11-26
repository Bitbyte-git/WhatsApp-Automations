import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, CheckCircle2, XCircle, Send } from 'lucide-react';
import { api } from '../services/api';
import { Campaign } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton, useInfiniteScroll, InfiniteScrollFooter } from '../components/Skeleton';

export const MessageHistoryView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = user?.role === 'SUPERADMIN' && activeTenantId ? `client_id=${activeTenantId}` : '';
      const res = await api.getCampaigns(params);
      if (res && res.results) {
        setCampaigns(res.results);
      } else if (Array.isArray(res)) {
        setCampaigns(res);
      }
    } catch {
      // Ignore transient errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeTenantId]);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = !searchQuery.trim() || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { visibleCount, hasMore, loadingMore, sentinelRef } = useInfiniteScroll(filteredCampaigns.length, 15, 15);
  const visibleCampaigns = filteredCampaigns.slice(0, visibleCount);

  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.delivered_count || c.sent_count || 0), 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + (c.failed_count || 0), 0);

  const getCampaignCostInfo = (camp: any) => {
    const nameLower = (camp.name || '').toLowerCase();
    const cat = (camp.template_details?.category || '').toUpperCase();
    const isService =
      cat === 'SERVICE' ||
      nameLower.includes('service reply') ||
      nameLower.includes('support reply');
    if (isService) {
      return { label: 'Service (24h)', unitRate: 0, isFree: true };
    }
    if (cat === 'UTILITY' || nameLower.includes('utility') || nameLower.includes('payment') || nameLower.includes('order')) {
      return { label: 'Utility', unitRate: 0.14, isFree: false };
    }
    if (cat === 'AUTHENTICATION' || nameLower.includes('otp') || nameLower.includes('auth')) {
      return { label: 'Auth / OTP', unitRate: 0.14, isFree: false };
    }
    return { label: 'Marketing', unitRate: 0.85, isFree: false };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-50 text-[#075E54] border border-emerald-200 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Full Broadcast Logs</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Message History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete history of all WhatsApp Marketing, Utility, and Service broadcasts sent from your workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Broadcasts</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{campaigns.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#075E54] flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Delivered</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{totalDelivered}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Failed</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{totalFailed}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter + Full Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaign name..."
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
            />
          </div>

          <div className="flex items-center space-x-2">
            {['ALL', 'COMPLETED', 'FAILED', 'IN_PROGRESS'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-[#075E54] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={7} cols={6} />
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-500">No broadcast records match your filter.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Campaign Name</th>
                    <th className="py-3 px-4">Recipients</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Delivered</th>
                    <th className="py-3 px-4">Failed</th>
                    <th className="py-3 px-4">Meta Rate / Cost</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {visibleCampaigns.map((camp) => {
                    const costInfo = getCampaignCostInfo(camp);
                    const delivered = camp.delivered_count || camp.sent_count || 0;
                    const totalCost = delivered * costInfo.unitRate;
                    return (
                    <tr key={camp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{camp.name}</td>
                      <td className="py-3.5 px-4">{camp.total_recipients}</td>
                      <td className="py-3.5 px-4">
                        <Badge status={camp.status} />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">{delivered}</td>
                      <td className="py-3.5 px-4 font-bold text-rose-600">{camp.failed_count}</td>
                      <td className="py-3.5 px-4">
                        {costInfo.isFree ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Free
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">
                              ₹{totalCost.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {costInfo.label} (₹{costInfo.unitRate.toFixed(2)}/msg)
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {camp.created_at ? new Date(camp.created_at).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <InfiniteScrollFooter
              hasMore={hasMore}
              loadingMore={loadingMore}
              sentinelRef={sentinelRef}
              shownCount={visibleCampaigns.length}
              totalCount={filteredCampaigns.length}
            />
          </>
        )}
      </div>
    </div>
  );
};
