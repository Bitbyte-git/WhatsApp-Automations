import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { MessageTemplate, WhatsAppAccount } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export const TemplatesView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<MessageTemplate | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en_US');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [accountId, setAccountId] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTenantId) params.append('client_id', activeTenantId);
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);

      const [tmplRes, accRes] = await Promise.all([
        api.getTemplates(params.toString()),
        api.getWhatsAppAccounts(activeTenantId ? `client_id=${activeTenantId}` : ''),
      ]);
      setTemplates(tmplRes.results || []);
      setAccounts(accRes.results || []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId, search, categoryFilter]);

  const handleSyncFromMeta = async () => {
    setSyncing(true);
    try {
      const res = await api.syncTemplatesFromMeta({
        whatsapp_account_id: accounts[0]?.id,
      });
      alert(res.message);
      loadData();
    } catch (err: any) {
      alert(err.message || 'WhatsApp integration is not configured. Missing Meta credentials or WABA ID.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const buttons = buttonText.trim()
        ? [{ type: 'QUICK_REPLY', text: buttonText.trim() }]
        : [];

      const payload: any = {
        name: name.toLowerCase().replace(/\s+/g, '_'),
        category,
        language,
        header_type: headerText.trim() ? 'TEXT' : headerType,
        header_text: headerText,
        body_text: bodyText,
        footer_text: footerText,
        buttons,
        whatsapp_account: accountId ? parseInt(accountId) : accounts[0]?.id,
      };

      if (user?.role === 'SUPERADMIN' && activeTenantId) {
        payload.client = parseInt(activeTenantId);
      }

      const created = await api.createTemplate(payload);
      setModalOpen(false);
      setName('');
      setHeaderText('');
      setBodyText('');
      setFooterText('');
      setButtonText('');
      loadData();
      alert(`Template "${created?.name || payload.name}" submitted to Meta! Status: ${created?.status || 'PENDING'}. Click "Sync from Meta" in 1 minute to refresh approval status.`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create message template.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">WhatsApp Template Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create, preview, and sync official Meta-reviewed message templates across categories.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncFromMeta}
            disabled={syncing}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-subtle transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin text-emerald-600' : 'text-gray-500'}`} />
            Sync from Meta
          </button>
          <button
            onClick={() => {
              setFormError('');
              setName('');
              setBodyText('');
              setHeaderText('');
              setFooterText('');
              setButtonText('');
              setModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#075E54] hover:bg-[#064E3B] rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Template
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl py-1.5 px-3 focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="">All Categories</option>
            <option value="MARKETING">Marketing</option>
            <option value="UTILITY">Utility</option>
            <option value="AUTHENTICATION">Authentication</option>
          </select>
        </div>
      </div>

      {/* Templates Grid & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl p-16 text-center text-xs text-gray-400 border border-gray-100">
              <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p>Loading template library from database...</p>
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              title="No templates found."
              description="Create a WhatsApp template (Marketing, Utility, or Authentication) or sync approved templates from your Meta Business Manager."
              actionLabel="Create Template"
              onAction={() => setModalOpen(true)}
            />
          ) : (
            templates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => setSelectedPreview(tmpl)}
                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                  selectedPreview?.id === tmpl.id
                    ? 'border-[#075E54] shadow-md ring-1 ring-[#075E54]/20'
                    : 'border-gray-100 shadow-card hover:border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-gray-900 font-mono">{tmpl.name}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                        {tmpl.language}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tmpl.body_text}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge status={tmpl.status} />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{tmpl.category}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                  <span>WABA: {tmpl.whatsapp_account_name || 'Global'}</span>
                  <span>Created: {new Date(tmpl.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live WhatsApp Mockup Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card flex flex-col h-fit sticky top-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center">
              <Smartphone className="w-4 h-4 text-emerald-600 mr-1.5" />
              WhatsApp Client Preview
            </span>
            <span className="text-[10px] text-gray-400">Official Mobile UI</span>
          </div>

          {selectedPreview ? (
            <div className="mt-4 bg-[#EFEAE2]/50 p-4 rounded-xl border border-gray-200">
              <div className="bg-white rounded-2xl p-4 shadow-sm text-xs max-w-sm space-y-2">
                {selectedPreview.header_text && (
                  <p className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-1">
                    {selectedPreview.header_text}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {selectedPreview.body_text}
                </p>
                {selectedPreview.footer_text && (
                  <p className="text-[10px] text-gray-400 pt-1">
                    {selectedPreview.footer_text}
                  </p>
                )}
                {selectedPreview.buttons && selectedPreview.buttons.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 space-y-1.5">
                    {selectedPreview.buttons.map((b: any, idx: number) => (
                      <div
                        key={idx}
                        className="py-1.5 bg-gray-50 text-emerald-700 text-center font-medium rounded-lg border border-gray-200 text-[11px]"
                      >
                        {b.text || b.phone_number || b.url || 'Quick Reply'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-4">
              <Eye className="w-6 h-6 mx-auto mb-2 text-gray-300" />
              <span>Select any template on the left to preview its mobile layout.</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create WhatsApp Message Template"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Template Name (lowercase & underscores only) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. order_confirmation_v1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Category *</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
              >
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Language Code *</label>
              <input
                type="text"
                required
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Header Text (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Order Confirmed! 🎉"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Body Message Text (Variables like {'{{1}}'}, {'{{2}}'}) *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Hello {{1}}, your order #{{2}} has been shipped and is on the way!"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Footer Text (Optional)</label>
            <input
              type="text"
              placeholder="BitByte Technologies • Reply STOP to unsubscribe"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Quick Reply Button Label (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Track My Order"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
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
              {formLoading ? 'Submitting...' : 'Submit for Meta Approval'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
