import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  ExternalLink,
  Smartphone,
  Users,
  Wallet,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { Client } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.getClients(params.toString());
      setClients(res.results || []);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [search, statusFilter]);

  const handleOpenModal = (client?: Client) => {
    setFormError('');
    if (client) {
      setEditingClient(client);
      setName(client.name);
      setCompanyEmail(client.company_email);
      setPhoneNumber(client.phone_number || '');
      setAddress(client.address || '');
      setWebsite(client.website || '');
      setNotes(client.notes || '');
    } else {
      setEditingClient(null);
      setName('');
      setCompanyEmail('');
      setPhoneNumber('');
      setAddress('');
      setWebsite('');
      setNotes('');
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const payload = {
        name,
        company_email: companyEmail,
        phone_number: phoneNumber,
        address,
        website,
        notes,
      };

      if (editingClient) {
        await api.updateClient(editingClient.id, payload);
      } else {
        await api.createClient(payload);
      }
      setModalOpen(false);
      loadClients();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save client details.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.toggleClientStatus(id);
      loadClients();
    } catch (err: any) {
      alert(err.message || 'Failed to update client status');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Client Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage multi-tenant business organizations, isolate tenant resources, and monitor accounts.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#075E54] hover:bg-[#064E3B] rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Client
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by client name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl py-1.5 px-3 focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading client records...</p>
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            title="No clients found."
            description="You have not onboarded any client businesses yet. Add your first tenant to start managing WhatsApp accounts."
            actionLabel="Add Client"
            onAction={() => handleOpenModal()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Business / Client Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">WhatsApp Accounts</th>
                  <th className="py-3 px-4">Wallet Balance</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div>{c.name}</div>
                      <span className="text-[10px] text-gray-400 font-mono">Tenant ID: #{c.id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{c.company_email}</div>
                      {c.phone_number && <div className="text-[11px] text-gray-400">{c.phone_number}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 font-medium">
                        <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.accounts_count ?? 0}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      ₹{parseFloat(String(c.wallet_balance || 0)).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(c)}
                        className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Client"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(c.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          c.status === 'ACTIVE'
                            ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {c.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? `Edit Client: ${editingClient.name}` : 'Add New Client Tenant'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Company / Client Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Global Solutions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Company Email *</label>
            <input
              type="email"
              required
              placeholder="billing@company.com"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Business Phone Number</label>
            <input
              type="text"
              placeholder="+91 98765 00000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Office Address</label>
            <textarea
              rows={2}
              placeholder="Headquarters address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Website URL</label>
            <input
              type="url"
              placeholder="https://company.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
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
              disabled={formLoading}
              className="px-4 py-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-semibold shadow-sm disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
