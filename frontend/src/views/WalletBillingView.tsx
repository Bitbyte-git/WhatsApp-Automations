import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Receipt,
  Download,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { Wallet as WalletType, WalletTransaction, Invoice, UsageRecord } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export const WalletBillingView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Recharge Form State
  const [amount, setAmount] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceId, setReferenceId] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [formError, setFormError] = useState('');

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const tenantParam = activeTenantId ? `client_id=${activeTenantId}` : '';
      const [walletRes, txRes, usageRes, invRes] = await Promise.all([
        api.getWallet(tenantParam),
        api.getTransactions(tenantParam),
        api.getUsageRecords(tenantParam),
        api.getInvoices(),
      ]);

      if (walletRes && !walletRes.overview) {
        setWallet(walletRes);
      } else {
        setWallet(walletRes?.wallets?.[0] || null);
      }

      setTransactions(txRes.results || txRes || []);
      setUsageRecords(usageRes.results || usageRes || []);
      setInvoices(invRes.results || invRes || []);
    } catch {
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [activeTenantId]);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setRecharging(true);

    try {
      const payload: any = {
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        reference_id: referenceId || undefined,
      };

      if (user?.role === 'SUPERADMIN' && activeTenantId) {
        payload.client_id = parseInt(activeTenantId);
      }

      await api.rechargeWallet(payload);
      setModalOpen(false);
      loadBillingData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to process recharge.');
    } finally {
      setRecharging(false);
    }
  };

  const balanceNum = parseFloat(wallet?.balance || '0');
  const isLow = balanceNum < 500;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Wallet & Billing</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Prepaid credit balance, usage ledgers, and transaction breakdown per tenant client.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setReferenceId('');
            setModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1faa53] rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Recharge Wallet
        </button>
      </div>

      {/* Low Balance Alert Banner */}
      {isLow && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-900">Low Wallet Balance Alert</h4>
            <p className="mt-0.5 text-amber-700">
              Your prepaid balance is below the recommended threshold (₹500.00). Outbound campaigns and bot replies may pause if funds are depleted.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs"
          >
            Recharge Now
          </button>
        </div>
      )}

      {/* Wallet Balance Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-tr from-[#075E54] to-[#064E3B] rounded-2xl p-6 text-white shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                Prepaid Messaging Wallet
              </span>
              <Wallet className="w-5 h-5 text-[#25D366]" />
            </div>
            <h3 className="text-3xl font-extrabold mt-3 tracking-tight">
              ₹{balanceNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-100/70 mt-1">
              Currency: {wallet?.currency || 'INR'} • Auto-deducted per message
            </p>
          </div>

          <div className="pt-6 border-t border-emerald-600/50 mt-6 flex items-center justify-between">
            <span className="text-xs text-emerald-100">
              Client: {wallet?.client_name || user?.client_details?.name || 'My Business'}
            </span>
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1faa53] text-[#064E3B] text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Add Funds
            </button>
          </div>
        </div>

        {/* Rate Card */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
            Standard WhatsApp Usage Rates (per message)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Official Meta Cloud API passthrough rates plus platform delivery infrastructure.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase">Marketing</span>
              <p className="text-lg font-bold text-gray-900 mt-1">₹0.85</p>
              <p className="text-[10px] text-gray-400">Meta + BitByte fee</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[11px] font-semibold text-blue-800 uppercase">Utility</span>
              <p className="text-lg font-bold text-gray-900 mt-1">₹0.40</p>
              <p className="text-[10px] text-gray-400">Meta + BitByte fee</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[11px] font-semibold text-amber-800 uppercase">Authentication</span>
              <p className="text-lg font-bold text-gray-900 mt-1">₹0.35</p>
              <p className="text-[10px] text-gray-400">Meta + BitByte fee</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[11px] font-semibold text-purple-800 uppercase">Service</span>
              <p className="text-lg font-bold text-gray-900 mt-1">₹0.40</p>
              <p className="text-[10px] text-gray-400">24-hour window</p>
            </div>
          </div>
        </div>
      </div>

      {/* Granular Usage Records Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
          Granular Message Cost Audit
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Separately identifiable Meta pass-through charges, BitByte platform markup, and taxes.
        </p>

        {usageRecords.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No message usage records recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Meta Charge</th>
                  <th className="py-2.5 px-3">Platform Fee</th>
                  <th className="py-2.5 px-3">Taxes</th>
                  <th className="py-2.5 px-3 text-right">Total Deducted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usageRecords.slice(0, 10).map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 px-3 text-gray-500">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-2 px-3 font-semibold text-gray-800">{r.category}</td>
                    <td className="py-2 px-3">₹{parseFloat(String(r.meta_cost)).toFixed(4)}</td>
                    <td className="py-2 px-3">₹{parseFloat(String(r.platform_fee)).toFixed(4)}</td>
                    <td className="py-2 px-3">₹{parseFloat(String(r.tax_amount)).toFixed(4)}</td>
                    <td className="py-2 px-3 text-right font-bold text-gray-900">
                      ₹{parseFloat(String(r.total_cost)).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Transaction Ledger</h3>
          <span className="text-xs text-gray-400">Total: {transactions.length}</span>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet."
            description="Your wallet history will show all credits (recharges) and debits (message usage) recorded in PostgreSQL."
            actionLabel="Recharge Wallet"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Transaction Details</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {tx.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        tx.transaction_type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                      {tx.category}
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                      {tx.reference_id || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${
                      tx.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-gray-900'
                    }`}>
                      {tx.transaction_type === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recharge Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Recharge Prepaid Wallet"
      >
        <form onSubmit={handleRecharge} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Recharge Amount (INR) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
              <input
                type="number"
                min="100"
                step="50"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-gray-900"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            {['500', '1000', '2500', '5000'].map((amt) => (
              <button
                type="button"
                key={amt}
                onClick={() => setAmount(amt)}
                className={`flex-1 py-1.5 border rounded-lg font-semibold transition-colors ${
                  amount === amt ? 'bg-emerald-50 border-emerald-500 text-[#075E54]' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                +₹{amt}
              </button>
            ))}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
            >
              <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
              <option value="NETBANKING">Corporate NetBanking</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="NEFT_RTGS">NEFT / RTGS Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Reference ID / Bank UTR (Optional)</label>
            <input
              type="text"
              placeholder="e.g. UTR-98234871923"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recharging}
              className="px-4 py-2 bg-[#25D366] hover:bg-[#1faa53] text-white rounded-xl font-semibold shadow-sm disabled:opacity-50"
            >
              {recharging ? 'Processing...' : `Confirm Recharge (₹${amount})`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
