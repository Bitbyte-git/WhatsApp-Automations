import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Smartphone,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { MessageTemplate, WhatsAppAccount } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

// In-file Success Modal (No extra file created)
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  templateName?: string;
  status?: string;
  onSync?: () => void;
  syncing?: boolean;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  templateName,
  status = 'PENDING',
  onSync,
  syncing = false,
}) => {
  if (!isOpen) return null;

  const isPending = status?.toUpperCase() === 'PENDING';
  const isApproved = status?.toUpperCase() === 'APPROVED';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-md border border-gray-100 p-6 sm:p-7 relative z-10">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Badge */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 shadow-sm relative">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>

            <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">{message}</p>
          </div>

          {/* Details Card */}
          {(templateName || status) && (
            <div className="mt-5 p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
              {templateName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Template Name:</span>
                  <span className="font-mono font-semibold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                    {templateName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Meta Review Status:</span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg font-semibold text-[11px] ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : isPending
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {isPending && <Clock className="w-3 h-3 mr-1 animate-spin" />}
                  {isApproved && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {status}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-200/60 text-[11px] text-gray-500 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Meta automated review takes 1–5 minutes. Once approved, you can broadcast messages with this template.
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                disabled={syncing}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Checking Status...' : 'Check Approval Now'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [otpModalTemplate, setOtpModalTemplate] = useState<MessageTemplate | null>(null);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpFeedback, setOtpFeedback] = useState('');

  // Success & Sync Notification States (No window.alert)
  const [successInfo, setSuccessInfo] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    templateName?: string;
    status?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [syncToast, setSyncToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    setSyncToast(null);
    try {
      const res = await api.syncTemplatesFromMeta({
        whatsapp_account_id: accounts[0]?.id,
      });
      setSyncToast({
        type: 'success',
        text: res.message || 'Templates successfully synced from Meta Cloud API!',
      });
      loadData();
      setTimeout(() => setSyncToast(null), 5000);
    } catch (err: any) {
      setSyncToast({
        type: 'error',
        text: err.message || 'WhatsApp integration is not configured. Missing Meta credentials or WABA ID.',
      });
      setTimeout(() => setSyncToast(null), 6000);
    } finally {
      setSyncing(false);
    }
  };

  const handleCheckApprovalInModal = async () => {
    setSyncing(true);
    try {
      await api.syncTemplatesFromMeta({
        whatsapp_account_id: accounts[0]?.id,
      });
      const params = new URLSearchParams();
      if (activeTenantId) params.append('client_id', activeTenantId);
      const tmplRes = await api.getTemplates(params.toString());
      const updatedList: MessageTemplate[] = Array.isArray(tmplRes.data) ? tmplRes.data : [];
      setTemplates(updatedList);
      
      const match = updatedList.find(t => t.name === successInfo.templateName);
      if (match) {
        setSuccessInfo(prev => ({
          ...prev,
          status: match.status,
          message: match.status === 'APPROVED'
            ? 'Awesome! Meta has approved your template. You can now use it in broadcasts.'
            : 'Meta automated review is still in progress. Usually takes 1–5 minutes.',
        }));
      }
    } catch (err: any) {
      // silently ignore in modal check
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
        header_type: category === 'AUTHENTICATION' ? 'NONE' : headerText.trim() ? 'TEXT' : headerType,
        header_text: category === 'AUTHENTICATION' ? '' : headerText,
        body_text:
          category === 'AUTHENTICATION'
            ? '{{1}} is your verification code. For your security, do not share this code.'
            : bodyText,
        footer_text: category === 'AUTHENTICATION' ? 'This code expires in 10 minutes.' : footerText,
        buttons:
          category === 'AUTHENTICATION'
            ? [{ type: 'OTP', text: 'Copy Code' }]
            : buttons,
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

      // Show beautiful success popup instead of browser window.alert
      setSuccessInfo({
        isOpen: true,
        title: 'Template Submitted to Meta!',
        message: 'Your template has been submitted to Meta Cloud API for review.',
        templateName: created?.name || payload.name,
        status: created?.status || 'PENDING',
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create message template.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {syncToast && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-medium transition-all shadow-sm ${
            syncToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {syncToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncToast.text}</span>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="text-gray-400 hover:text-gray-600 font-bold px-1.5 py-0.5 rounded-lg hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

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
                  <div className="flex items-center space-x-3">
                    {(tmpl.category === 'AUTHENTICATION' || tmpl.name === 'bitbyte_utility_update') && tmpl.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOtpFeedback('');
                          setOtpPhone('');
                          setOtpCode('');
                          setOtpModalTemplate(tmpl);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 text-[#075E54] hover:bg-emerald-100 rounded-lg font-bold transition-colors"
                      >
                        Send Test OTP
                      </button>
                    )}
                    <span>Created: {new Date(tmpl.created_at).toLocaleDateString()}</span>
                  </div>
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
              placeholder="e.g. ak_dress_shop"
              value={name}
              onChange={(e) => {
                const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                setName(clean);
              }}
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

          {category === 'AUTHENTICATION' ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
              <p className="font-bold">Official Meta OTP Format (Auto-Configured)</p>
              <p className="text-[11px]">
                Meta automatically uses its verified OTP layout: <code>{'{{1}}'} is your verification code</code> + 10-minute expiry + <strong>Copy Code</strong> button.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Header Text (Optional - Plain Text, No Emojis)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Festive Offer"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value.replace(/[^\x00-\x7F]/g, ''))}
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
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Quick Reply Button Label (Optional - Plain Text, No Emojis)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Claim Offer"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value.replace(/[^\x00-\x7F]/g, ''))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

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

      {/* Send Test OTP Modal */}
      <Modal
        isOpen={!!otpModalTemplate}
        onClose={() => setOtpModalTemplate(null)}
        title={`Send OTP via ${otpModalTemplate?.name || 'Template'}`}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!otpModalTemplate) return;
            setOtpSending(true);
            setOtpFeedback('');
            try {
              const res = await api.sendTemplateOtp(otpModalTemplate.id, {
                phone_number: otpPhone,
                otp_code: otpCode || undefined,
              });
              setOtpFeedback(res?.message || 'OTP sent successfully!');
            } catch (err: any) {
              setOtpFeedback(`Error: ${err.message || 'Failed to send OTP'}`);
            } finally {
              setOtpSending(false);
            }
          }}
          className="space-y-4 text-xs"
        >
          {otpFeedback && (
            <div
              className={`p-3 rounded-xl border ${
                otpFeedback.startsWith('Error:')
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
              }`}
            >
              {otpFeedback}
            </div>
          )}
          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Customer WhatsApp Number (10-digit) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 9600681036"
              value={otpPhone}
              onChange={(e) => setOtpPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              OTP Code (Optional — auto-generates 6 digits if empty)
            </label>
            <input
              type="text"
              placeholder="e.g. 482910"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setOtpModalTemplate(null)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={otpSending}
              className="px-4 py-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {otpSending ? 'Sending OTP...' : 'Send OTP Now'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Success Modal - Replaces browser alert */}
      <SuccessModal
        isOpen={successInfo.isOpen}
        onClose={() => setSuccessInfo(prev => ({ ...prev, isOpen: false }))}
        title={successInfo.title}
        message={successInfo.message}
        templateName={successInfo.templateName}
        status={successInfo.status}
        onSync={handleCheckApprovalInModal}
        syncing={syncing}
      />
    </div>
  );
};
