import React, { useState, useEffect } from 'react';
import {
  Send,
  Plus,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Smartphone,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, WhatsAppAccount, MessageTemplate, Contact } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export const CampaignsView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [launchingId, setLaunchingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const tenantParam = activeTenantId ? `client_id=${activeTenantId}` : '';
      const [campRes, accRes, tmplRes, contRes] = await Promise.all([
        api.getCampaigns(tenantParam),
        api.getWhatsAppAccounts(tenantParam),
        api.getTemplates(tenantParam ? `${tenantParam}&status=APPROVED` : 'status=APPROVED'),
        api.getContacts(tenantParam),
      ]);
      setCampaigns(campRes.results || []);
      setAccounts(accRes.results || []);
      setTemplates(tmplRes.results || []);
      setContacts(contRes.results || []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const payload: any = {
        name,
        whatsapp_account_id: parseInt(selectedAccount),
        template_id: parseInt(selectedTemplate),
        scheduled_at: scheduleTime || null,
      };

      await api.createCampaign(payload);
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create broadcast campaign.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLaunch = async (id: number) => {
    if (!confirm('Are you sure you want to broadcast this campaign via official Meta Cloud API? Real wallet credits will be deducted.')) return;

    setLaunchingId(id);
    try {
      const res = await api.launchCampaign(id);
      alert(res.message);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to launch campaign. Check Meta integration credentials or wallet balance.');
    } finally {
      setLaunchingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Campaign Broadcasts</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Broadcast marketing and notification campaigns to segmented audiences with Meta-approved templates.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setName('');
            setSelectedAccount(accounts[0]?.id ? String(accounts[0].id) : '');
            setSelectedTemplate(templates[0]?.id ? String(templates[0].id) : '');
            setScheduleTime('');
            setModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#075E54] hover:bg-[#064E3B] rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Broadcast Campaign
        </button>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading campaigns from database...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns created yet."
            description="Create your first WhatsApp broadcast campaign. Choose an approved template and your customer audience to begin."
            actionLabel="Create Campaign"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">WhatsApp Account</th>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Delivered / Failed</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4 text-right">Launch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {camp.name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-emerald-800">
                      {camp.whatsapp_account_name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {camp.template_name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={camp.status} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      {camp.total_recipients} contacts
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-600 font-bold">{camp.delivered_count || camp.sent_count}</span>
                      <span className="text-gray-400"> / </span>
                      <span className="text-rose-600 font-bold">{camp.failed_count}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {camp.scheduled_at ? new Date(camp.scheduled_at).toLocaleString() : 'Immediate'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {['DRAFT', 'SCHEDULED'].includes(camp.status) ? (
                        <button
                          onClick={() => handleLaunch(camp.id)}
                          disabled={launchingId === camp.id}
                          className="inline-flex items-center px-3 py-1 bg-[#25D366] hover:bg-[#1faa53] text-white rounded-lg font-semibold shadow-xs transition-colors disabled:opacity-50 text-[11px]"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          {launchingId === camp.id ? 'Broadcasting...' : 'Launch'}
                        </button>
                      ) : (
                        <span className="text-gray-400 font-medium text-[11px]">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Broadcast Campaign"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Campaign Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Diwali Mega Festival Broadcast"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Sending WhatsApp Account *</label>
            <select
              required
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
            >
              <option value="">Choose sending account...</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.business_name} ({a.phone_number})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Select Meta-Approved Template *</label>
            <select
              required
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
            >
              <option value="">Choose an approved template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} [{t.category}] ({t.language})</option>
              ))}
            </select>
            {templates.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                Note: No approved templates found. Only Meta-approved templates can be broadcast.
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Target Audience</label>
            <p className="text-gray-500 mb-1">All {contacts.length} opted-in contacts will be included automatically.</p>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Schedule Broadcast (Optional)</label>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
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
              disabled={formLoading || accounts.length === 0 || templates.length === 0}
              className="px-4 py-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-semibold shadow-sm disabled:opacity-50"
            >
              {formLoading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
