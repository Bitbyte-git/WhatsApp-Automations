import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Zap,
  Key,
  Users,
  Search,
  Check,
  Copy,
} from 'lucide-react';
import { api } from '../services/api';
import { MessageTemplate } from '../types';

export const AdminAuthenticationView: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Client API Keys Monitor (Admin overview across all clients)
  const [allClientKeys, setAllClientKeys] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);

  const loadData = async () => {
    setLoadingTemplates(true);
    setLoadingKeys(true);
    try {
      const [tmplRes, keysRes] = await Promise.all([
        api.getTemplates('category=AUTHENTICATION'),
        api.getClientApiKeys(),
      ]);
      setTemplates(tmplRes.results || []);
      setAllClientKeys(keysRes.results || (Array.isArray(keysRes) ? keysRes : []));
    } catch {
      setTemplates([]);
      setAllClientKeys([]);
    } finally {
      setLoadingTemplates(false);
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeTemplate = templates.find((t) => t.status === 'APPROVED') || templates[0];

  const handleSendTestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter a valid WhatsApp phone number.');
      return;
    }
    setSending(true);
    setError('');
    setResult(null);

    try {
      const res = await api.sendExternalOtp({
        phone: phone.trim(),
        otp: otpCode.trim() || undefined,
        template_name: activeTemplate?.name || '',
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch test OTP via Meta Gateway.');
    } finally {
      setSending(false);
    }
  };

  const copyKey = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#075E54] to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Admin Master Gateway Controller</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center">
              WhatsApp Authentication Engine
            </h1>
            <p className="text-sm text-emerald-100/80 mt-2 max-w-2xl leading-relaxed">
              Master control center for WhatsApp Authentication OTP delivery. Dispatches zero-friction verification codes via Meta Cloud API using Bit Byte verified master gateway.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs">
            <div className="text-emerald-200/80 uppercase font-semibold text-[10px]">Active Master Gateway</div>
            <div className="font-bold text-white text-sm mt-0.5 flex items-center">
              <span>Bit Byte Technologies</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-mono">
                +91 99444 95366
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Master Gateway Status & Test Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Master Templates (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-[#075E54]">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Master Authentication Templates</h3>
                  <p className="text-xs text-gray-400">Meta approved zero-friction OTP formats</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                • APPROVED
              </span>
            </div>

            {loadingTemplates ? (
              <div className="py-6 text-center text-xs text-gray-400">Loading approved templates...</div>
            ) : templates.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">No AUTHENTICATION templates found.</div>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-gray-900">{t.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2">{t.body_text}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-200/60">
                      <span>Gateway: {t.whatsapp_account_name || 'Bit Byte Technologies'}</span>
                      <span className="font-semibold text-gray-600">[ Copy Code ] Button</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Master Dispatch Console (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <Zap className="w-4.5 h-4.5 text-[#075E54] mr-2" />
                Master Gateway Dispatch Test
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Send a real test WhatsApp OTP directly from Bit Byte Technologies (+91 99444 95366).
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                  <span>OTP Delivered to {result.phone_number}!</span>
                </div>
                <div className="font-mono text-[11px] text-emerald-700 space-y-1">
                  <div>• Dispatched Code: <strong>{result.otp_code}</strong></div>
                  <div>• Meta WAMID: <span className="break-all">{result.wamid}</span></div>
                  <div>• Sender Gateway: Bit Byte Technologies (+91 99444 95366)</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSendTestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Recipient WhatsApp Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-mono text-xs">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-mono text-xs transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  OTP Code (Optional — Auto-Generates 6 Digits)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 482910"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-mono text-xs transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching via Master Gateway...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Live WhatsApp OTP</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Client API Keys Platform Monitor */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-[#075E54]">
              <Key className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Active Client Project API Keys</h3>
              <p className="text-xs text-gray-400">All external project keys across registered tenants</p>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-mono">Total: {allClientKeys.length} Keys</span>
        </div>

        {loadingKeys ? (
          <div className="py-6 text-center text-xs text-gray-400">Loading keys...</div>
        ) : allClientKeys.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">No client API keys generated yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Client Tenant</th>
                  <th className="pb-3 font-semibold">Project Name</th>
                  <th className="pb-3 font-semibold">API Key</th>
                  <th className="pb-3 font-semibold">Template</th>
                  <th className="pb-3 font-semibold">Created</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allClientKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 font-bold text-gray-900">{k.client_name || 'Direct Client'}</td>
                    <td className="py-3 font-semibold text-emerald-900">{k.project_name}</td>
                    <td className="py-3 font-mono text-[11px] text-gray-600">
                      <span>{k.key.slice(0, 10)}••••••••••••{k.key.slice(-4)}</span>
                      <button
                        type="button"
                        onClick={() => copyKey(k.key, k.id)}
                        className="ml-2 text-gray-400 hover:text-emerald-600 inline-flex items-center"
                        title="Copy Key"
                      >
                        {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-gray-600">{k.template_name}</td>
                    <td className="py-3 text-gray-500">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        ACTIVE
                      </span>
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
