import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { WalletTransaction } from '../types';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export const TransactionsView: React.FC = () => {
  const { activeTenantId } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTenantId) params.append('client_id', activeTenantId);
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const res = await api.getTransactions(params.toString());
      setTransactions(res.results || res || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [activeTenantId, search, typeFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Financial Transactions</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Full immutable ledger of wallet deposits, WhatsApp message usage deductions, and adjustments.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by description or reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl py-1.5 px-3 focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="">All Types (Credit / Debit)</option>
            <option value="CREDIT">Credits (Deposits & Recharges)</option>
            <option value="DEBIT">Debits (Message Usage & Fees)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl py-1.5 px-3 focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="">All Categories</option>
            <option value="RECHARGE">Recharges</option>
            <option value="MARKETING">Marketing Messages</option>
            <option value="UTILITY">Utility Messages</option>
            <option value="AUTHENTICATION">Authentication</option>
            <option value="SERVICE">Service Conversations</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading transaction ledger...</p>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions found."
            description="No matching transaction records found in the database. Transactions will automatically register as messages are sent or wallet funds added."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Transaction / Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div>{tx.description}</div>
                      <span className="text-[10px] text-gray-400">ID: #{tx.id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        tx.transaction_type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600 text-[11px]">
                      {tx.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                      {tx.reference_id || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={tx.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                      ₹{parseFloat(tx.balance_after || '0').toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold text-sm ${
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
    </div>
  );
};
