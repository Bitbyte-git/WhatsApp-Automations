import React, { useEffect, useState } from 'react';
import { Wallet, RefreshCw, ExternalLink, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const META_DEPOSIT_STORAGE_KEY = 'bitbyte_meta_deposited_inr';

export const MetaBalanceView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [depositedInput, setDepositedInput] = useState<string>(
    () => localStorage.getItem(META_DEPOSIT_STORAGE_KEY) || ''
  );
  const [editingDeposit, setEditingDeposit] = useState(false);

  const loadMetaBalance = async (lookbackDays = days) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getMetaBalance(lookbackDays);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live Meta WABA balance & spend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetaBalance(days);
  }, [days]);

  const totalCost = Number(data?.total_cost || 0);
  const depositedNum = parseFloat(depositedInput || '0') || 0;
  const remainingBalance = Math.max(0, depositedNum - totalCost);

  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(META_DEPOSIT_STORAGE_KEY, depositedInput.trim() || '0');
    setEditingDeposit(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-50 text-[#075E54] border border-emerald-200 inline-flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            <span>Official Meta WABA Billing & Spend</span>
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">Meta Balance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Live official Meta Graph API message charges for {data?.waba_name || 'BitByte'} ({data?.phone_number || '+91 99444 95366'}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>

          <button
            type="button"
            onClick={() => loadMetaBalance(days)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <a
            href={data?.meta_billing_url || 'https://business.facebook.com/billing_hub/accounts'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#075E54] hover:bg-[#064E3B] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Balance / Pay Meta</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Balance + Live Meta Spend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live Meta Spend */}
        <div className="bg-gradient-to-tr from-[#075E54] to-[#064E3B] rounded-2xl p-6 text-white shadow-card flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Live Meta Spend (Last {days} Days)
            </p>
            <h2 className="text-3xl font-black mt-2">
              {loading ? '...' : `₹${totalCost.toFixed(2)}`}
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1">
              Total Official Messages Delivered: {data?.total_volume ?? 0} • Currency: {data?.currency || 'INR'}
            </p>
          </div>
          <div className="pt-4 mt-5 border-t border-emerald-600/50 flex items-center justify-between text-xs">
            <span className="text-emerald-100">WABA ID: {data?.waba_id || '1630144941424450'}</span>
            <span className="inline-flex items-center gap-1 text-[#25D366] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Live Meta API
            </span>
          </div>
        </div>

        {/* Meta Prepaid Balance Tracker */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Meta Prepaid Balance Tracker
              </p>
              <button
                type="button"
                onClick={() => setEditingDeposit(!editingDeposit)}
                className="text-xs font-bold text-[#075E54] hover:underline"
              >
                {editingDeposit ? 'Cancel' : 'Set Meta Deposit'}
              </button>
            </div>

            {editingDeposit ? (
              <form onSubmit={handleSaveDeposit} className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={depositedInput}
                  onChange={(e) => setDepositedInput(e.target.value)}
                  placeholder="Enter amount added in Meta (e.g. 500)"
                  className="flex-1 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#075E54] text-white text-xs font-bold rounded-xl"
                >
                  Save
                </button>
              </form>
            ) : (
              <>
                <h2 className="text-3xl font-black text-slate-900 mt-2">
                  {depositedNum > 0 ? `₹${remainingBalance.toFixed(2)}` : 'Check Meta Billing'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {depositedNum > 0
                    ? `Deposited: ₹${depositedNum.toFixed(2)} − Live Meta Spend: ₹${totalCost.toFixed(2)}`
                    : 'Meta API does not expose prepaid wallet balance directly. Click "Set Meta Deposit" or open Meta Billing.'}
                </p>
              </>
            )}
          </div>

          <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Add funds directly in Meta Business Billing Hub
            </span>
            <a
              href={data?.meta_billing_url || 'https://business.facebook.com/billing_hub/accounts'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#1faa53] text-[#064E3B] text-xs font-bold rounded-xl transition-colors"
            >
              <span>Pay Meta</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Marketing</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ₹{Number(data?.breakdown?.MARKETING?.cost || 0).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {data?.breakdown?.MARKETING?.volume || 0} messages delivered
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Utility</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ₹{Number(data?.breakdown?.UTILITY?.cost || 0).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {data?.breakdown?.UTILITY?.volume || 0} messages delivered
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Authentication (OTP)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ₹{Number(data?.breakdown?.AUTHENTICATION?.cost || 0).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {data?.breakdown?.AUTHENTICATION?.volume || 0} messages delivered
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Service (24h Window)</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">Free (₹0.00)</p>
          <p className="text-xs text-slate-500 mt-1">
            {data?.breakdown?.SERVICE?.volume || 0} messages delivered
          </p>
        </div>
      </div>
    </div>
  );
};
