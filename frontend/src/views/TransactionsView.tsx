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
  FileText,
  Printer,
  CheckCircle,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { WalletTransaction } from '../types';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { TableSkeleton, useInfiniteScroll, InfiniteScrollFooter } from '../components/Skeleton';

export const TransactionsView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const { visibleCount, hasMore, loadingMore, sentinelRef } = useInfiniteScroll(transactions.length, 20, 20);
  const visibleTransactions = transactions.slice(0, visibleCount);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Selected Transaction for PDF Bill
  const [selectedTxForBill, setSelectedTxForBill] = useState<WalletTransaction | null>(null);

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

  const handlePrintBill = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-50 text-[#075E54] border border-emerald-200">
              Billing Ledger
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-600 font-semibold">{user?.client_details?.name || 'My Organization'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Payment Transactions & Bills
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            View all wallet recharges, payments, and message debits. Download official PDF payment receipts.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by description or reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl py-1.5 px-3 focus:outline-none focus:border-[#075E54] bg-white"
          >
            <option value="">All Types (Credit / Debit)</option>
            <option value="CREDIT">Credits (Deposits & Recharges)</option>
            <option value="DEBIT">Debits (Message Usage)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl py-1.5 px-3 focus:outline-none focus:border-[#075E54] bg-white"
          >
            <option value="">All Categories</option>
            <option value="RECHARGE">Recharges</option>
            <option value="MARKETING">Marketing Messages</option>
            <option value="SERVICE">Service Conversations</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions found."
            description="No matching transaction records found in the database. Transactions will automatically register as messages are sent or wallet funds added."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Transaction / Description</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Reference ID</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Invoice / Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {visibleTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{tx.description}</div>
                      <span className="text-[10px] text-slate-400">ID: #{tx.id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          tx.transaction_type === 'CREDIT'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">{tx.category}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{tx.reference_id || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(tx.created_at).toLocaleString()}</td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold text-sm ${
                        tx.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.transaction_type === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTxForBill(tx)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#075E54] hover:text-white text-slate-700 text-xs font-bold transition-all shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download Bill</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InfiniteScrollFooter
            hasMore={hasMore}
            loadingMore={loadingMore}
            sentinelRef={sentinelRef}
            shownCount={visibleTransactions.length}
            totalCount={transactions.length}
          />
          </>
        )}
      </div>

      {/* Bill / PDF Modal */}
      {selectedTxForBill && (
        <Modal
          isOpen={!!selectedTxForBill}
          onClose={() => setSelectedTxForBill(null)}
          title="Payment Invoice & Receipt"
        >
          <div className="space-y-6 p-2 text-xs" id="printable-invoice">
            {/* Invoice Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#075E54] text-white flex items-center justify-center font-black text-base">
                  BB
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">BitByte Technologies</h3>
                  <p className="text-[11px] text-slate-500">Official WhatsApp Cloud SaaS Provider • Salem, TN</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#075E54] font-black text-[10px] uppercase">
                  PAID ✓
                </span>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">INV-{selectedTxForBill.id.toString().padStart(6, '0')}</p>
              </div>
            </div>

            {/* Billed To & Date */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Billed To:</p>
                <p className="font-bold text-slate-900 mt-0.5">{user?.client_details?.name || user?.full_name}</p>
                <p className="text-[11px] text-slate-500">{user?.email}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Transaction Date:</p>
                <p className="font-bold text-slate-900 mt-0.5">{new Date(selectedTxForBill.created_at).toLocaleDateString()}</p>
                <p className="text-[11px] text-slate-500 font-mono">Ref: {selectedTxForBill.reference_id || 'N/A'}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-[11px] uppercase font-bold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900">{selectedTxForBill.description}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{selectedTxForBill.category}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      ₹{parseFloat(selectedTxForBill.amount).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-right">
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Subtotal:</span>
                <span>₹{(parseFloat(selectedTxForBill.amount) / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-xs">
                <span>GST (18% Included):</span>
                <span>₹{(parseFloat(selectedTxForBill.amount) - (parseFloat(selectedTxForBill.amount) / 1.18)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                <span>Total Paid:</span>
                <span className="text-[#075E54]">₹{parseFloat(selectedTxForBill.amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedTxForBill(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintBill}
                className="px-4 py-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-bold shadow-xs flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
