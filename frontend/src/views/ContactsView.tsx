import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Upload,
  Trash2,
  Edit2,
  FileText,
  Phone,
  Mail,
  Tag,
} from 'lucide-react';
import { api } from '../services/api';
import { Contact, Client } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton, useInfiniteScroll, InfiniteScrollFooter } from '../components/Skeleton';

export const ContactsView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { visibleCount, hasMore, loadingMore, sentinelRef } = useInfiniteScroll(contacts.length, 20, 20);
  const visibleContacts = contacts.slice(0, visibleCount);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [statusVal, setStatusVal] = useState<'OPTED_IN' | 'OPTED_OUT' | 'BLOCKED'>('OPTED_IN');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Import State
  const [importJson, setImportJson] = useState(`[
  { "name": "Rajesh Kumar", "phone_number": "+919876543210", "email": "rajesh@example.com" },
  { "name": "Ananya Sharma", "phone_number": "+919876543211", "email": "ananya@example.com" }
]`);
  const [importLoading, setImportLoading] = useState(false);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTenantId) params.append('client_id', activeTenantId);
      if (search) params.append('search', search);
      const res = await api.getContacts(params.toString());
      setContacts(res.results || []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [activeTenantId, search]);

  const handleOpenModal = (contact?: Contact) => {
    setFormError('');
    if (contact) {
      setEditingContact(contact);
      setName(contact.name || '');
      setPhone(contact.phone_number);
      setEmail(contact.email || '');
      setTags((contact.tags || []).join(', '));
      setNotes(contact.notes || '');
      setStatusVal(contact.status);
    } else {
      setEditingContact(null);
      setName('');
      setPhone('');
      setEmail('');
      setTags('');
      setNotes('');
      setStatusVal('OPTED_IN');
    }
    setModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const payload: any = {
        name,
        phone_number: phone,
        email,
        tags: tagList,
        notes,
        status: statusVal,
      };

      if (user?.role === 'SUPERADMIN' && activeTenantId) {
        payload.client = parseInt(activeTenantId);
      }

      if (editingContact) {
        await api.patch(`/inbox/contacts/${editingContact.id}/`, payload);
      } else {
        await api.createContact(payload);
      }
      setModalOpen(false);
      loadContacts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save contact.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.deleteContact(id);
      loadContacts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete contact');
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportLoading(true);
    try {
      const parsed = JSON.parse(importJson);
      const payload: any = { contacts: parsed };
      if (user?.role === 'SUPERADMIN' && activeTenantId) {
        payload.client_id = parseInt(activeTenantId);
      }
      const res = await api.batchImportContacts(payload);
      alert(res.message);
      setImportModalOpen(false);
      loadContacts();
    } catch (err: any) {
      alert(err.message || 'Invalid JSON format or error importing contacts');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Contact Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Organize customer phone numbers, opt-in statuses, and segmentation tags per client.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-subtle transition-colors"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
            Import Contacts
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#075E54] hover:bg-[#064E3B] rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, phone number, email, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
          />
        </div>
        <span className="text-xs text-gray-400 font-medium">Total: {contacts.length}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : contacts.length === 0 ? (
          <EmptyState
            title="No contacts found."
            description="Add customer phone numbers or import a contact list to start sending WhatsApp templates and campaigns."
            actionLabel="Add Contact"
            onAction={() => handleOpenModal()}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">WhatsApp Phone Number</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Tags</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {visibleContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {contact.name || 'Unnamed Contact'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-800">
                      {contact.phone_number}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {contact.email || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={contact.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags && contact.tags.length > 0 ? (
                          contact.tags.map((t, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                              #{t}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenModal(contact)}
                        className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Contact"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-4 h-4" />
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
            shownCount={visibleContacts.length}
            totalCount={contacts.length}
          />
          </>
        )}
      </div>

      {/* Add / Edit Contact Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingContact ? 'Edit WhatsApp Contact' : 'Add WhatsApp Contact'}
      >
        <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">WhatsApp Phone Number *</label>
            <input
              type="text"
              required
              placeholder="+919876543210 (E.164 format)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Customer Full Name</label>
            <input
              type="text"
              placeholder="e.g. Ananya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              placeholder="customer@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Segmentation Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="vip, lead, retail, premium"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Opt-in Status</label>
            <select
              value={statusVal}
              onChange={(e: any) => setStatusVal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
            >
              <option value="OPTED_IN">Opted-in (Eligible for Broadcasts)</option>
              <option value="OPTED_OUT">Opted-out (Unsubscribed)</option>
              <option value="BLOCKED">Blocked</option>
            </select>
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
              {formLoading ? 'Saving...' : editingContact ? 'Update Contact' : 'Save Contact'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Batch Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Batch Import Contacts (JSON / CSV List)"
      >
        <form onSubmit={handleImport} className="space-y-4 text-xs">
          <p className="text-gray-500">
            Paste a JSON array of contacts with <span className="font-mono">name</span>, <span className="font-mono">phone_number</span>, and optional <span className="font-mono">email</span>.
          </p>
          <textarea
            rows={8}
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono text-[11px] focus:outline-none focus:border-emerald-500 bg-gray-50"
          />
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importLoading}
              className="px-4 py-2 bg-[#25D366] hover:bg-[#1faa53] text-white rounded-xl font-semibold shadow-sm disabled:opacity-50"
            >
              {importLoading ? 'Importing...' : 'Start Batch Import'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
