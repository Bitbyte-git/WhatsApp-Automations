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
  Megaphone,
  Bell,
  Key,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  PhoneCall,
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
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 shadow-sm relative">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">{message}</p>
          </div>

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
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE'>('LIST');
  const [selectedPreview, setSelectedPreview] = useState<MessageTemplate | null>(null);
  const [otpModalTemplate, setOtpModalTemplate] = useState<MessageTemplate | null>(null);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpFeedback, setOtpFeedback] = useState('');

  // Success Notification
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

  // Template Form State
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [templateSubType, setTemplateSubType] = useState<'DEFAULT' | 'CATALOGUE' | 'CALL_PERMISSION' | 'OTP'>('DEFAULT');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en_US');
  const [variableType, setVariableType] = useState<'NUMBER' | 'TEXT'>('NUMBER');
  const [headerType, setHeaderType] = useState<'NONE' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('Hello');
  const [footerText, setFooterText] = useState('');
  const [buttonsList, setButtonsList] = useState<Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE'; text: string; url?: string; phone_number?: string }>>([]);
  const [buttonMenuOpen, setButtonMenuOpen] = useState(false);
  const [customValidity, setCustomValidity] = useState(false);
  const [validityDuration, setValidityDuration] = useState('10m');
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
      const accList: any[] = accRes.results || [];
      setAccounts(accList);
      if (accList.length > 0) {
        const preferred = !activeTenantId 
          ? (accList.find((a: any) => a.phone_number?.includes('99444')) || accList[0])
          : accList[0];
        if (preferred) setAccountId(String(preferred.id));
      }
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
    } catch {
      // silently ignore
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      let buttons: any[] = [];
      if (category === 'AUTHENTICATION') {
        buttons = [{ type: 'OTP', text: 'Copy Code' }];
      } else if (buttonsList.length > 0) {
        buttons = buttonsList.map((b) => {
          if (b.type === 'URL') {
            return { type: 'URL', text: b.text.trim(), url: b.url || 'https://bitbyte.co.in' };
          }
          if (b.type === 'PHONE_NUMBER') {
            return { type: 'PHONE_NUMBER', text: b.text.trim(), phone_number: b.phone_number || '+919003719307' };
          }
          if (b.type === 'COPY_CODE') {
            return { type: 'COPY_CODE', text: b.text.trim() || 'Copy Code' };
          }
          return { type: 'QUICK_REPLY', text: b.text.trim() };
        });
      }

      const payload: any = {
        name: name.toLowerCase().replace(/\s+/g, '_'),
        category,
        language,
        header_type: category === 'AUTHENTICATION' ? 'NONE' : headerType !== 'NONE' ? headerType : headerText.trim() ? 'TEXT' : 'NONE',
        header_text: category === 'AUTHENTICATION' || headerType !== 'NONE' ? '' : headerText.trim(),
        body_text:
          category === 'AUTHENTICATION'
            ? '{{1}} is your verification code. For your security, do not share this code.'
            : bodyText,
        footer_text: category === 'AUTHENTICATION' ? 'This code expires in 10 minutes.' : footerText,
        buttons,
        whatsapp_account: accountId ? parseInt(accountId) : accounts[0]?.id,
      };

      if (user?.role === 'SUPERADMIN' && activeTenantId) {
        payload.client = parseInt(activeTenantId);
      }

      const created = await api.createTemplate(payload);
      setViewMode('LIST');
      setName('');
      setHeaderText('');
      setBodyText('Hello');
      setFooterText('');
      setButtonsList([]);
      loadData();

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

      {/* Main Top Header when in LIST mode */}
      {viewMode === 'LIST' && (
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
                setBodyText('Hello');
                setHeaderText('');
                setFooterText('');
                setButtonsList([]);
                setCustomValidity(false);
                setHeaderType('NONE');
                setVariableType('NUMBER');
                setWizardStep(1);
                setCategory('MARKETING');
                setTemplateSubType('DEFAULT');
                setViewMode('CREATE');
              }}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#075E54] hover:bg-[#064E3B] rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Template
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VIEW MODE 1: FULL PAGE META TEMPLATE STUDIO (NO POPUP)            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'CREATE' ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6">
          {/* Top Breadcrumb & Stepper Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className="inline-flex items-center text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1 text-gray-500" />
                Back to templates
              </button>
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Create template</h3>
                <p className="text-[11px] text-gray-400">Cloud API template studio hosted directly with Meta</p>
              </div>
            </div>

            {/* Stepper Header (Meta Identical) */}
            <div className="flex items-center gap-3 text-xs bg-gray-50 border border-gray-200/70 px-4 py-2 rounded-2xl">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="flex items-center gap-2 cursor-pointer focus:outline-none"
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    wizardStep === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {wizardStep > 1 ? '✓' : '1'}
                </span>
                <span
                  className={`font-semibold ${
                    wizardStep === 1 ? 'text-gray-900 font-bold' : 'text-gray-500'
                  }`}
                >
                  Set up template
                </span>
              </button>

              <div className="w-8 h-px bg-gray-200" />

              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    wizardStep === 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  2
                </span>
                <span
                  className={`font-semibold ${
                    wizardStep === 2 ? 'text-gray-900 font-bold' : 'text-gray-400'
                  }`}
                >
                  Edit template
                </span>
              </div>

              <div className="w-8 h-px bg-gray-200" />

              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-[11px] font-bold">
                  3
                </span>
                <span className="text-gray-400 font-semibold">
                  Submit for Review
                </span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: SET UP TEMPLATE                                           */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {wizardStep === 1 && (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left Column: Category & Subtype Setup */}
              <div className="flex-1 space-y-5 w-full">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Set up your template</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Choose the category that best describes your message template. Then, select the type of message that you want to send.
                  </p>
                </div>

                {/* 3 Meta Category Segmented Tabs */}
                <div className="grid grid-cols-3 border border-gray-200 rounded-2xl p-1 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('MARKETING');
                      setTemplateSubType('DEFAULT');
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      category === 'MARKETING'
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Megaphone className="w-4 h-4 text-emerald-600" />
                    Marketing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('UTILITY');
                      setTemplateSubType('DEFAULT');
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      category === 'UTILITY'
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Bell className="w-4 h-4 text-emerald-600" />
                    Utility
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('AUTHENTICATION');
                      setTemplateSubType('OTP');
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      category === 'AUTHENTICATION'
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Key className="w-4 h-4 text-emerald-600" />
                    Authentication
                  </button>
                </div>

                {/* Subtype Selection Radios */}
                <div className="space-y-2.5">
                  {category === 'MARKETING' && (
                    <>
                      <label
                        className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          templateSubType === 'DEFAULT'
                            ? 'bg-blue-50/40 border-blue-500 ring-1 ring-blue-500/20'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="subType"
                          checked={templateSubType === 'DEFAULT'}
                          onChange={() => setTemplateSubType('DEFAULT')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Default</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Send messages with media and customised buttons to engage your customers.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          templateSubType === 'CATALOGUE'
                            ? 'bg-blue-50/40 border-blue-500 ring-1 ring-blue-500/20'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="subType"
                          checked={templateSubType === 'CATALOGUE'}
                          onChange={() => setTemplateSubType('CATALOGUE')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Catalogue</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Send messages that drive sales by connecting your product catalogue.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          templateSubType === 'CALL_PERMISSION'
                            ? 'bg-blue-50/40 border-blue-500 ring-1 ring-blue-500/20'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="subType"
                          checked={templateSubType === 'CALL_PERMISSION'}
                          onChange={() => setTemplateSubType('CALL_PERMISSION')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Calling permissions request</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Ask customers if you can call them on WhatsApp.
                          </p>
                        </div>
                      </label>
                    </>
                  )}

                  {category === 'UTILITY' && (
                    <>
                      <label
                        className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          templateSubType === 'DEFAULT'
                            ? 'bg-blue-50/40 border-blue-500 ring-1 ring-blue-500/20'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="subType"
                          checked={templateSubType === 'DEFAULT'}
                          onChange={() => setTemplateSubType('DEFAULT')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Default</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Send messages about an existing order or account.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          templateSubType === 'CALL_PERMISSION'
                            ? 'bg-blue-50/40 border-blue-500 ring-1 ring-blue-500/20'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="subType"
                          checked={templateSubType === 'CALL_PERMISSION'}
                          onChange={() => setTemplateSubType('CALL_PERMISSION')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Calling permissions request</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Ask customers if you can call them on WhatsApp.
                          </p>
                        </div>
                      </label>
                    </>
                  )}

                  {category === 'AUTHENTICATION' && (
                    <label className="flex items-start gap-3.5 p-3.5 rounded-2xl border bg-blue-50/40 border-blue-500 ring-1 ring-blue-500/20 cursor-pointer">
                      <input
                        type="radio"
                        name="subType"
                        checked={true}
                        readOnly
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-bold text-gray-900 text-xs">One-time passcode</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Send codes to verify a transaction or login with Copy Code button.
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Pre-approved templates banner card for Utility and Authentication (Meta Style) */}
                {(category === 'UTILITY' || category === 'AUTHENTICATION') && (
                  <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-xl">📋</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-xs">Start with pre-approved templates</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                          Save time and effort by using pre-approved templates from our template library. You can quickly build professional-looking templates without starting from scratch.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (category === 'UTILITY') {
                          setName('order_shipping_status');
                          setHeaderText('Shipping Update');
                          setBodyText('Good news! Your order {{1}} has shipped! Tracking details: {{2}}');
                          setFooterText('BitByte Technologies');
                          setButtonsList([{ type: 'QUICK_REPLY', text: 'Track shipment' }]);
                          setWizardStep(2);
                        } else {
                          setName('auth_otp_code');
                          setWizardStep(2);
                        }
                      }}
                      className="shrink-0 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 shadow-xs"
                    >
                      Go to template library
                    </button>
                  </div>
                )}

                {/* Step 1 Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewMode('LIST')}
                    className="px-5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Column: Step 1 Template Preview Card */}
              <div className="w-full lg:w-96 shrink-0 bg-[#EFEAE2] p-5 rounded-3xl border border-gray-300/80 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                    Template preview
                  </h4>

                  {/* WhatsApp Message Bubble */}
                  <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 space-y-2.5">
                    {category === 'MARKETING' && (
                      <>
                        <div className="w-full h-32 bg-emerald-50 rounded-xl flex items-center justify-center overflow-hidden border border-emerald-100">
                          <span className="text-4xl">🥦🍎🍇</span>
                        </div>
                        <p className="text-xs text-gray-800 leading-relaxed">
                          Hey there! Check out our fresh groceries now!<br /><br />
                          Use code <strong>HEALTH</strong> to get additional 10% off on your entire purchase.
                        </p>
                        <div className="text-[10px] text-gray-400 text-right">11:59</div>
                        <div className="pt-2 border-t border-gray-100 space-y-1.5">
                          <div className="w-full py-1.5 text-center text-xs font-bold text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" /> Shop now
                          </div>
                          <div className="w-full py-1.5 text-center text-xs font-bold text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5" /> Copy code
                          </div>
                        </div>
                      </>
                    )}

                    {category === 'UTILITY' && (
                      <>
                        <p className="text-xs text-gray-800 leading-relaxed">
                          Good news! Your order <strong>23KFEJJ2312</strong> has shipped!<br /><br />
                          Here's your tracking information, please check link below.
                        </p>
                        <div className="text-[10px] text-gray-400 text-right">11:59</div>
                        <div className="pt-2 border-t border-gray-100">
                          <div className="w-full py-1.5 text-center text-xs font-bold text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center">
                            Track shipment
                          </div>
                        </div>
                      </>
                    )}

                    {category === 'AUTHENTICATION' && (
                      <>
                        <p className="text-xs text-gray-800 leading-relaxed font-mono">
                          <strong>123456</strong> is your verification code. For your security, do not share this code.
                        </p>
                        <div className="text-[10px] text-gray-400 text-right">11:59</div>
                        <div className="pt-2 border-t border-gray-100">
                          <div className="w-full py-1.5 text-center text-xs font-bold text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5" /> Copy code
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* This template is good for */}
                  <div className="mt-4 p-3.5 bg-white/90 rounded-2xl border border-gray-200/60 text-[11px] text-gray-600 space-y-1.5">
                    <p className="font-bold text-gray-800">This template is good for</p>
                    <p className="text-gray-500 leading-relaxed">
                      {category === 'MARKETING'
                        ? 'Welcome messages, promotions, offers, coupons, newsletters, announcements'
                        : category === 'UTILITY'
                        ? 'Order confirmations, account update, receipts, appointment reminders, billing'
                        : 'One-time password, account recovery code, account verification, integrity challenges'}
                    </p>
                    <p className="font-bold text-gray-800 pt-1.5">Template areas that you can customise</p>
                    <p className="text-gray-500">
                      {category === 'AUTHENTICATION' ? 'Code delivery method' : 'Media, header, body, footer, button'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: EDIT TEMPLATE                                             */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {wizardStep === 2 && (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left Column: Edit Form */}
              <form onSubmit={handleCreateTemplate} className="flex-1 space-y-4 text-xs w-full">
                {formError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700">
                    {formError}
                  </div>
                )}

                {/* Top Category Pill (Meta Style) */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                      {category === 'MARKETING' ? '📢' : category === 'UTILITY' ? '🔔' : '🔑'}
                    </span>
                    <div>
                      <p className="font-mono font-bold text-xs">{name || 'your_template_name'} • {language}</p>
                      <p className="text-[10px] text-emerald-700">
                        {category.charAt(0) + category.slice(1).toLowerCase()} • {templateSubType === 'DEFAULT' ? 'Default' : templateSubType === 'CATALOGUE' ? 'Catalogue' : templateSubType === 'CALL_PERMISSION' ? 'Calling permissions' : 'One-time passcode'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline"
                  >
                    Change Category
                  </button>
                </div>

                {/* Card 1: Template name and language */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-2xs">
                  <h4 className="font-bold text-gray-900 text-xs">Template name and language</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-gray-700">Name your template *</label>
                        <span className="text-[10px] text-gray-400 font-mono">{name.length}/512</span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Enter a template name"
                        value={name}
                        onChange={(e) => {
                          const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                          setName(clean);
                        }}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Select language *</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-xs"
                      >
                        <option value="en_US">English (US)</option>
                        <option value="en_GB">English (UK)</option>
                        <option value="ta">Tamil (ta)</option>
                        <option value="hi">Hindi (hi)</option>
                        <option value="ar">Arabic (ar)</option>
                        <option value="es">Spanish (es)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Card 2: Content */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3.5 shadow-2xs">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">Content</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      Add a header, body and footer for your template. Cloud API hosted by Meta will review the template variables and content to protect the security and integrity of our services.
                    </p>
                  </div>

                  {category !== 'AUTHENTICATION' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            Type of variable <span className="text-gray-400 font-normal">ⓘ</span>
                          </label>
                          <select
                            value={variableType}
                            onChange={(e: any) => setVariableType(e.target.value)}
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-xs"
                          >
                            <option value="NUMBER">Number</option>
                            <option value="TEXT">Text</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">Media sample • Optional</label>
                          <select
                            value={headerType}
                            onChange={(e: any) => setHeaderType(e.target.value)}
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-xs"
                          >
                            <option value="NONE">None</option>
                            <option value="IMAGE">Image</option>
                            <option value="VIDEO">Video</option>
                            <option value="DOCUMENT">Document</option>
                          </select>
                        </div>
                      </div>

                      {headerType === 'NONE' && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-gray-700">Header • Optional</label>
                            <span className="text-[10px] text-gray-400 font-mono">{headerText.length}/60</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add a short line of text to the header of your message in English"
                              value={headerText}
                              onChange={(e) => setHeaderText(e.target.value.replace(/[^\x00-\x7F]/g, ''))}
                              className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setHeaderText((prev) => `${prev} {{1}}`);
                              }}
                              className="px-3 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 shrink-0"
                            >
                              + Add variable ⓘ
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-gray-700">Body *</label>
                          <span className="text-[10px] text-gray-400 font-mono">{bodyText.length}/1024</span>
                        </div>
                        <textarea
                          rows={4}
                          required
                          placeholder="Enter your message text here..."
                          value={bodyText}
                          onChange={(e) => setBodyText(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 leading-relaxed font-sans text-xs"
                        />
                        {/* Meta Format Toolbar */}
                        <div className="mt-1.5 flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              title="Add Emoji"
                              onClick={() => setBodyText((prev) => prev + ' 😊')}
                              className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600 text-xs"
                            >
                              😊
                            </button>
                            <button
                              type="button"
                              title="Bold"
                              onClick={() => setBodyText((prev) => prev + ' *bold text* ')}
                              className="px-2 py-1 hover:bg-gray-200 rounded-lg font-bold text-gray-700 text-xs"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              title="Italic"
                              onClick={() => setBodyText((prev) => prev + ' _italic text_ ')}
                              className="px-2 py-1 hover:bg-gray-200 rounded-lg italic text-gray-700 text-xs"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              title="Strikethrough"
                              onClick={() => setBodyText((prev) => prev + ' ~strikethrough~ ')}
                              className="px-2 py-1 hover:bg-gray-200 rounded-lg line-through text-gray-700 text-xs"
                            >
                              S
                            </button>
                            <button
                              type="button"
                              title="Monospace"
                              onClick={() => setBodyText((prev) => prev + ' ```code``` ')}
                              className="px-2 py-1 hover:bg-gray-200 rounded-lg font-mono text-gray-700 text-xs"
                            >
                              {'</>'}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const matches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
                              const nextNum = matches.length + 1;
                              setBodyText((prev) => `${prev} {{${nextNum}}}`);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-white border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 shadow-2xs"
                          >
                            + Add variable ⓘ
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-gray-700">Footer • Optional</label>
                          <span className="text-[10px] text-gray-400 font-mono">{footerText.length}/60</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Add a short line of text to the bottom of your message in English"
                          value={footerText}
                          onChange={(e) => setFooterText(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </div>

                      {/* Buttons • Optional (Meta Complete Model) */}
                      <div className="pt-2 border-t border-gray-100 space-y-2.5">
                        <div>
                          <h5 className="font-semibold text-gray-800">Buttons • Optional</h5>
                          <p className="text-[11px] text-gray-500 leading-snug">
                            Create buttons that let customers respond to your message or take action. You can add up to ten buttons. If you add more than three buttons, they will appear in a list.
                          </p>
                        </div>

                        {/* List of Added Buttons */}
                        {buttonsList.length > 0 && (
                          <div className="space-y-2">
                            {buttonsList.map((btn, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-2.5">
                                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-semibold rounded-lg text-[10px] uppercase">
                                  {btn.type.replace('_', ' ')}
                                </span>
                                <input
                                  type="text"
                                  placeholder="Button text"
                                  value={btn.text}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setButtonsList((prev) => prev.map((b, i) => i === idx ? { ...b, text: val } : b));
                                  }}
                                  className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs"
                                />
                                {btn.type === 'URL' && (
                                  <input
                                    type="text"
                                    placeholder="https://..."
                                    value={btn.url || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setButtonsList((prev) => prev.map((b, i) => i === idx ? { ...b, url: val } : b));
                                    }}
                                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                                  />
                                )}
                                {btn.type === 'PHONE_NUMBER' && (
                                  <input
                                    type="text"
                                    placeholder="+91..."
                                    value={btn.phone_number || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setButtonsList((prev) => prev.map((b, i) => i === idx ? { ...b, phone_number: val } : b));
                                    }}
                                    className="w-40 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setButtonsList((prev) => prev.filter((_, i) => i !== idx))}
                                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Button Dropdown */}
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setButtonMenuOpen(!buttonMenuOpen)}
                            className="px-3.5 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-xl font-semibold text-gray-700 text-xs flex items-center gap-2 shadow-2xs"
                          >
                            + Add button ▾
                          </button>
                          {buttonMenuOpen && (
                            <div className="absolute left-0 mt-1 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 py-1 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setButtonsList((prev) => [...prev, { type: 'QUICK_REPLY', text: 'Quick Reply' }]);
                                  setButtonMenuOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 font-medium text-gray-800"
                              >
                                Quick reply
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setButtonsList((prev) => [...prev, { type: 'URL', text: 'Visit Website', url: 'https://bitbyte.co.in' }]);
                                  setButtonMenuOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 font-medium text-gray-800 flex items-center justify-between"
                              >
                                <span>Visit website</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setButtonsList((prev) => [...prev, { type: 'PHONE_NUMBER', text: 'Call Support', phone_number: '+919003719307' }]);
                                  setButtonMenuOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 font-medium text-gray-800 flex items-center justify-between"
                              >
                                <span>Call phone number</span>
                                <PhoneCall className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setButtonsList((prev) => [...prev, { type: 'COPY_CODE', text: 'Copy offer code' }]);
                                  setButtonMenuOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 font-medium text-gray-800 flex items-center justify-between"
                              >
                                <span>Copy offer code</span>
                                <FileCode className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                      <p className="font-bold text-xs flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-emerald-700" />
                        Official Meta Authentication (OTP) Configuration
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Meta Cloud API auto-locks Authentication templates to the zero-friction security format:
                      </p>
                      <div className="p-3 bg-white/80 rounded-xl border border-emerald-200/80 font-mono text-[11px] text-gray-800 space-y-1">
                        <p><strong>Body:</strong> {'{{1}}'} is your verification code. For your security, do not share this code.</p>
                        <p><strong>Footer:</strong> This code expires in 10 minutes.</p>
                        <p><strong>Button:</strong> [Copy Code] (OTP one-tap clipboard copy)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card 3: Message validity period (Utility Only - Meta Screenshot 7) */}
                {category === 'UTILITY' && (
                  <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-2.5 shadow-2xs">
                    <h4 className="font-bold text-gray-900 text-xs">Message validity period</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      You can set a custom validity period that your utility message must be delivered by before it expires. If a message has not been delivered within this time frame, you will not be charged and your customer will not see the message.
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <div>
                        <label className="font-semibold text-gray-800 text-xs block">
                          Set custom validity period for your message
                        </label>
                        <p className="text-[10px] text-gray-400">
                          {customValidity
                            ? 'Custom expiration window active.'
                            : "If you don't set a custom validity period, the standard 10 minutes WhatsApp message validity period will be applied."}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={customValidity}
                        onChange={(e) => setCustomValidity(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                    {customValidity && (
                      <div className="pt-2">
                        <label className="block font-semibold text-gray-700 mb-1">Validity duration</label>
                        <select
                          value={validityDuration}
                          onChange={(e) => setValidityDuration(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-xs"
                        >
                          <option value="10m">10 Minutes (Standard)</option>
                          <option value="30m">30 Minutes</option>
                          <option value="1h">1 Hour</option>
                          <option value="6h">6 Hours</option>
                          <option value="24h">24 Hours</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {formLoading ? 'Submitting to Meta...' : 'Submit for Review'}
                  </button>
                </div>
              </form>

              {/* Right Column: Realistic WhatsApp Smartphone Screen */}
              <div className="w-full lg:w-96 shrink-0 sticky top-6">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    WhatsApp Mobile Screen
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    Live Preview
                  </span>
                </div>

                {/* Smartphone Device Frame */}
                <div className="bg-[#111B21] rounded-[40px] p-2.5 shadow-2xl border-4 border-gray-800">
                  {/* Phone Speaker Notch */}
                  <div className="w-24 h-4 bg-gray-900 rounded-full mx-auto mb-1.5 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-800 mr-2" />
                    <div className="w-8 h-1 rounded-full bg-gray-700" />
                  </div>

                  {/* Phone Screen Canvas */}
                  <div className="rounded-[30px] overflow-hidden border border-gray-700/50 bg-[#EFEAE2] flex flex-col h-[540px]">
                    {/* WhatsApp Green App Bar */}
                    <div className="bg-[#075E54] text-white px-3 py-2.5 flex items-center justify-between shadow-sm shrink-0">
                      <div className="flex items-center gap-2">
                        <ChevronLeft className="w-4 h-4 text-white/90" />
                        <div className="w-7 h-7 rounded-full bg-emerald-700 border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                          {(() => {
                            const curAcc = accounts.find((a) => String(a.id) === String(accountId)) || accounts[0];
                            const name = curAcc?.business_name || curAcc?.name || 'WhatsApp Business';
                            return name.charAt(0).toUpperCase();
                          })()}
                        </div>
                        <div className="leading-tight">
                          <p className="font-semibold text-xs flex items-center gap-1 text-white">
                            {(() => {
                              const curAcc = accounts.find((a) => String(a.id) === String(accountId)) || accounts[0];
                              return curAcc?.business_name || curAcc?.name || 'WhatsApp Business';
                            })()}
                            <CheckCircle className="w-3 h-3 text-emerald-300 fill-emerald-300" />
                          </p>
                          <p className="text-[9px] text-emerald-200">online</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span className="text-xs">⋮</span>
                      </div>
                    </div>

                    {/* Chat Wallpaper Canvas */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col justify-end">
                      {/* Date Stamp */}
                      <div className="text-center my-1">
                        <span className="bg-white/85 text-gray-500 text-[10px] font-semibold px-2.5 py-0.5 rounded-md shadow-2xs border border-gray-200/50">
                          TODAY
                        </span>
                      </div>

                      {/* The Live Interactive WhatsApp Message Bubble */}
                      <div className="max-w-[92%] bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-md border border-gray-100 text-xs space-y-2 relative self-start">
                        {/* Media Header Preview */}
                        {headerType === 'IMAGE' && (
                          <div className="w-full h-32 bg-emerald-50 rounded-xl flex items-center justify-center overflow-hidden border border-emerald-100 relative">
                            <span className="text-4xl">🥦🍎🍇</span>
                            <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
                              Image Sample
                            </span>
                          </div>
                        )}
                        {headerType === 'VIDEO' && (
                          <div className="w-full h-32 bg-slate-900 rounded-xl flex items-center justify-center text-white relative">
                            <span className="text-3xl">▶️</span>
                            <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
                              Video Sample
                            </span>
                          </div>
                        )}
                        {headerType === 'DOCUMENT' && (
                          <div className="w-full h-14 bg-amber-50 rounded-xl flex items-center px-3 gap-2.5 border border-amber-200">
                            <span className="text-2xl">📄</span>
                            <div className="truncate">
                              <p className="font-semibold text-xs text-amber-900 truncate">Document_Sample.pdf</p>
                              <p className="text-[10px] text-amber-700">1.2 MB • PDF</p>
                            </div>
                          </div>
                        )}

                        {/* Text Header */}
                        {headerType === 'NONE' && headerText && (
                          <p className="font-bold text-xs text-gray-900 border-b border-gray-100 pb-1 leading-snug">
                            {headerText}
                          </p>
                        )}

                        {/* Live Body Text */}
                        <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {category === 'AUTHENTICATION'
                            ? '123456 is your verification code. For your security, do not share this code.'
                            : (bodyText || 'Your message text will appear here...')}
                        </p>

                        {/* Footer Text */}
                        {category === 'AUTHENTICATION' ? (
                          <p className="text-[10px] text-gray-400">
                            This code expires in 10 minutes.
                          </p>
                        ) : footerText ? (
                          <p className="text-[10px] text-gray-400">
                            {footerText}
                          </p>
                        ) : null}

                        {/* Timestamp & Double Checkmarks */}
                        <div className="text-[9px] text-gray-400 text-right flex items-center justify-end gap-1">
                          <span>12:09 PM</span>
                          <span className="text-blue-500 font-bold">✓✓</span>
                        </div>

                        {/* Rendered Live Action Buttons */}
                        {category === 'AUTHENTICATION' ? (
                          <div className="pt-1.5 border-t border-gray-100">
                            <div className="w-full py-1.5 text-center text-xs font-bold text-blue-600 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center gap-1.5">
                              <FileCode className="w-3.5 h-3.5" />
                              <span>Copy code</span>
                            </div>
                          </div>
                        ) : buttonsList.length > 0 ? (
                          <div className="pt-1.5 border-t border-gray-100 space-y-1.5">
                            {buttonsList.map((btn, idx) => (
                              <div
                                key={idx}
                                className="w-full py-1.5 text-center text-xs font-bold text-blue-600 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center gap-1.5"
                              >
                                {btn.type === 'URL' && <ExternalLink className="w-3.5 h-3.5" />}
                                {btn.type === 'PHONE_NUMBER' && <PhoneCall className="w-3.5 h-3.5" />}
                                {btn.type === 'COPY_CODE' && <FileCode className="w-3.5 h-3.5" />}
                                <span>{btn.text || 'Button Action'}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Simulated Bottom Chat Input Bar */}
                    <div className="p-2 bg-white/95 border-t border-gray-200 flex items-center gap-1.5 shrink-0">
                      <span className="text-gray-400 text-sm px-1">😊</span>
                      <div className="flex-1 bg-gray-100 rounded-full px-3 py-1 text-[11px] text-gray-400">
                        Message
                      </div>
                      <span className="text-gray-400 text-xs">📎</span>
                      <div className="w-7 h-7 rounded-full bg-[#00A884] text-white flex items-center justify-center shadow-xs text-xs">
                        🎤
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════ */
        /* VIEW MODE 2: TEMPLATES LIST TABLE VIEW                             */
        /* ══════════════════════════════════════════════════════════════════ */
        <>
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
                  onAction={() => {
                    setFormError('');
                    setName('');
                    setBodyText('Hello');
                    setHeaderText('');
                    setFooterText('');
                    setButtonsList([]);
                    setWizardStep(1);
                    setCategory('MARKETING');
                    setTemplateSubType('DEFAULT');
                    setViewMode('CREATE');
                  }}
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
        </>
      )}

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
