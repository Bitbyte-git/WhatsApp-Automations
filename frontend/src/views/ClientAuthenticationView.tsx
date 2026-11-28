import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Send,
  Copy,
  Check,
  Code,
  Terminal,
  Zap,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Plus,
  Trash2,
  FolderGit2,
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

interface ClientApiKeyItem {
  id: number;
  project_name: string;
  key: string;
  template_name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export const ClientAuthenticationView: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeCodeTab, setActiveCodeTab] = useState<'express' | 'js' | 'curl' | 'python' | 'php'>('express');
  const [copiedKeyId, setCopiedKeyId] = useState<number | string | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Project API Keys state
  const [apiKeys, setApiKeys] = useState<ClientApiKeyItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<ClientApiKeyItem | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // Modal State for Generating API Key
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [createdKeyData, setCreatedKeyData] = useState<ClientApiKeyItem | null>(null);

  const backendBase = (import.meta.env.VITE_API_BASE_URL || 'https://whatsapp-automations-jy7s.onrender.com/api').replace(/\/$/, '');
  const apiEndpoint = `${backendBase}/otp/send/`;

  const loadApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await api.getClientApiKeys();
      const keysList = res.results || (Array.isArray(res) ? res : []);
      setApiKeys(keysList);
      if (keysList.length > 0 && !selectedKey) {
        setSelectedKey(keysList[0]);
      }
    } catch {
      setApiKeys([]);
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const currentKeyString = selectedKey?.key || (apiKeys[0]?.key || '<YOUR_PROJECT_API_KEY>');
  const currentProjectName = selectedKey?.project_name || 'My Application';

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setModalError('Enter a valid Project / App Name.');
      return;
    }
    setGenerating(true);
    setModalError('');
    try {
      const created = await api.createClientApiKey({
        project_name: projectName.trim(),
      });
      setCreatedKeyData(created);
      await loadApiKeys();
      setSelectedKey(created);
    } catch (err: any) {
      setModalError(err.message || 'Failed to create Project API Key');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!window.confirm('Are you sure you want to revoke this API Key? Any external apps using it will stop sending OTPs.')) {
      return;
    }
    try {
      await api.deleteClientApiKey(id);
      const remaining = apiKeys.filter((k) => k.id !== id);
      setApiKeys(remaining);
      if (selectedKey?.id === id) {
        setSelectedKey(remaining[0] || null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete API Key');
    }
  };

  const handleSendTestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter a valid customer WhatsApp phone number.');
      return;
    }
    setSending(true);
    setError('');
    setResult(null);

    try {
      const res = await api.sendExternalOtp({
        phone: phone.trim(),
        otp: otpCode.trim() || undefined,
        template_name: selectedKey?.template_name || undefined,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch WhatsApp OTP. Check phone number and wallet balance.');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'endpoint' | 'code', keyId?: number | string) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKeyId(keyId || 'modal');
      setTimeout(() => setCopiedKeyId(null), 2000);
    } else if (type === 'endpoint') {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getCodeSnippet = () => {
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '919876543210';
    const sampleOtp = otpCode || '482910';

    switch (activeCodeTab) {
      case 'express':
        return `// Node.js + Express.js Integration (${currentProjectName})
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// API Configuration
const BITBYTE_OTP_ENDPOINT = '${apiEndpoint}';
const BITBYTE_API_KEY = '${currentKeyString}';

// POST /api/auth/send-whatsapp-otp
app.post('/api/auth/send-whatsapp-otp', async (req, res) => {
  const { phone } = req.body; // e.g. "${cleanPhone}"
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  try {
    const waResponse = await axios.post(
      BITBYTE_OTP_ENDPOINT,
      {
        phone: phone,
        otp: otpCode
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': BITBYTE_API_KEY
        }
      }
    );

    // TODO: Store otpCode in your database/Redis for 10 minutes to verify
    // await db.saveOtp(phone, otpCode);

    return res.status(200).json({
      success: true,
      message: 'OTP delivered to your WhatsApp successfully!',
      wamid: waResponse.data.wamid
    });
  } catch (error) {
    console.error('WhatsApp OTP Error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to dispatch WhatsApp OTP'
    });
  }
});

app.listen(3000, () => console.log('${currentProjectName} server listening on port 3000'));`;

      case 'js':
        return `// JavaScript / Node.js (Fetch API)
const sendWhatsAppOTP = async (phoneNumber, otp) => {
  const response = await fetch('${apiEndpoint}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': '${currentKeyString}'
    },
    body: JSON.stringify({
      phone: phoneNumber,
      otp: otp
    })
  });

  const data = await response.json();
  if (data.success) {
    console.log('OTP Delivered for ${currentProjectName}! WAMID:', data.wamid);
  } else {
    console.error('Failed:', data.error);
  }
};

// Usage Example:
sendWhatsAppOTP('${cleanPhone}', '${sampleOtp}');`;

      case 'curl':
        return `curl -X POST "${apiEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${currentKeyString}" \\
  -d '{
    "phone": "${cleanPhone}",
    "otp": "${sampleOtp}"
  }'`;

      case 'python':
        return `import requests

def send_whatsapp_otp(phone_number, otp_code):
    url = "${apiEndpoint}"
    headers = {
        "Content-Type": "application/json",
        "X-API-KEY": "${currentKeyString}"
    }
    payload = {
        "phone": phone_number,
        "otp": otp_code
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Usage Example for ${currentProjectName}:
res = send_whatsapp_otp("${cleanPhone}", "${sampleOtp}")
print(res)`;

      case 'php':
        return `<?php
// PHP cURL Integration for ${currentProjectName}
$curl = curl_init();

$payload = json_encode([
    "phone" => "${cleanPhone}",
    "otp" => "${sampleOtp}"
]);

curl_setopt_array($curl, [
    CURLOPT_URL => "${apiEndpoint}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "X-API-KEY": "${currentKeyString}"
    ],
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`;
    }
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
              <span>Developer API Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center">
              WhatsApp Authentication (OTP) API
            </h1>
            <p className="text-sm text-emerald-100/80 mt-2 max-w-2xl leading-relaxed">
              Create Project API Keys to dispatch instant WhatsApp OTP verification codes with official one-tap Copy Code buttons directly to your users.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={() => {
                setModalError('');
                setProjectName('');
                setCreatedKeyData(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-slate-900 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Project API Key</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Badge: Dispatched via Bit Byte Verified Gateway */}
      <div className="bg-emerald-50 border border-emerald-200/70 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-[#075E54] shrink-0">
            <Smartphone className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold">Verified High-Speed Gateway: </span>
            <span className="text-emerald-800">
              Bit Byte Technologies (<strong className="font-mono">+91 99444 95366</strong>)
            </span>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">
              Your project OTPs route through our Meta-verified official gateway with guaranteed ~2-second delivery and high delivery rates.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          VERIFIED
        </span>
      </div>

      {/* Project API Keys Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-[#075E54]">
              <Key className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Your Project API Keys</h3>
              <p className="text-xs text-gray-400">Select a project to load its custom code snippets</p>
            </div>
          </div>
          <button
            onClick={() => {
              setModalError('');
              setProjectName('');
              setCreatedKeyData(null);
              setModalOpen(true);
            }}
            className="text-xs font-bold text-[#075E54] hover:text-[#064E3B] flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>

        {loadingKeys ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading Project API Keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6">
            <FolderGit2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-gray-700">No Project API Keys Yet</h4>
            <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
              Click &quot;Generate Project API Key&quot; above to create a key for your web or mobile applications.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Project Name</th>
                  <th className="pb-3 font-semibold">API Secret Key</th>
                  <th className="pb-3 font-semibold">Template</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {apiKeys.map((k) => {
                  const isSelected = selectedKey?.id === k.id;
                  return (
                    <tr
                      key={k.id}
                      onClick={() => setSelectedKey(k)}
                      className={`hover:bg-emerald-50/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900">{k.project_name}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded bg-[#075E54] text-white text-[9px] font-extrabold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-[11px] text-gray-600">
                        <span>{k.key.slice(0, 10)}••••••••••••{k.key.slice(-4)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(k.key, 'key', k.id);
                          }}
                          className="ml-2 p-1 text-gray-400 hover:text-emerald-600 transition-colors inline-flex items-center"
                          title="Copy Full Secret Key"
                        >
                          {copiedKeyId === k.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {k.template_name || 'Standard OTP'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          ACTIVE
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteKey(k.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: Live Test Console & Developer API Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Test Console (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mobile Preview */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-[#075E54]">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">OTP Client Preview</h3>
                  <p className="text-xs text-gray-400">Zero-friction template format</p>
                </div>
              </div>
              <span className="font-bold text-emerald-800 text-xs">
                {currentProjectName}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-[#d1c7bc] text-gray-800 text-xs shadow-inner space-y-2 relative font-sans">
              <div className="bg-white rounded-xl p-3 shadow-xs space-y-1.5 border border-black/5">
                <p className="font-semibold text-gray-900 text-xs leading-relaxed">
                  <span className="font-mono font-bold text-[#075E54] bg-emerald-50 px-1 py-0.5 rounded">
                    {otpCode || '482910'}
                  </span>{' '}
                  is your verification code. For your security, do not share this code.
                </p>
                <p className="text-[10px] text-gray-400">This code expires in 10 minutes.</p>
                <div className="pt-2 border-t border-gray-100">
                  <div className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-center text-[#075E54] font-bold text-xs flex items-center justify-center space-x-1.5 border border-gray-200">
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test OTP Dispatcher */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <Zap className="w-4.5 h-4.5 text-[#075E54] mr-2" />
                Live Test Console
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Test OTP dispatch using Project: <strong>{currentProjectName}</strong>.
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
                  <div>• Gateway: Bit Byte Technologies (+91 99444 95366)</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSendTestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Customer WhatsApp Number *
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
                    <span>Dispatching OTP via Meta...</span>
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

        {/* Right Column: Developer Integration Hub (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* API Credentials Box */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <Code className="w-4.5 h-4.5 text-[#075E54] mr-2" />
                Integration Credentials ({currentProjectName})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Use the endpoint & credentials below in your backend server.
              </p>
            </div>

            {/* Endpoint */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                API Endpoint URL
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3.5 py-2.5 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto select-all">
                  <span className="text-emerald-300 font-bold mr-2">POST</span>
                  {apiEndpoint}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors shrink-0 flex items-center space-x-1 text-xs font-semibold"
                >
                  {copiedEndpoint ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedEndpoint ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Project Secret Key (X-API-KEY) — {currentProjectName}
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3.5 py-2.5 bg-gray-900 text-gray-200 font-mono text-xs rounded-xl overflow-x-auto select-all">
                  {currentKeyString}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentKeyString, 'key', 'active')}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors shrink-0 flex items-center space-x-1 text-xs font-semibold"
                >
                  {copiedKeyId === 'active' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKeyId === 'active' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Code Snippets Box with Tabs */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4.5 h-4.5 text-[#075E54]" />
                <h4 className="text-sm font-bold text-gray-900">Customized Code Snippets</h4>
              </div>

              {/* Language Tabs */}
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
                {(['express', 'js', 'curl', 'python', 'php'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeCodeTab === tab
                        ? 'bg-[#075E54] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'express' ? 'Express.js' : tab === 'js' ? 'Node Fetch' : tab === 'curl' ? 'cURL' : tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Block Container */}
            <div className="relative">
              <button
                type="button"
                onClick={() => copyToClipboard(getCodeSnippet(), 'code')}
                className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-[11px] font-semibold flex items-center space-x-1.5 transition-colors border border-gray-700 backdrop-blur-sm z-10"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied Code' : 'Copy Snippet'}</span>
              </button>

              <pre className="p-4 sm:p-5 bg-gray-950 text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-gray-800 shadow-inner">
                <code>{getCodeSnippet()}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Generate Project API Key */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={createdKeyData ? 'Project API Key Generated!' : 'Generate New Project API Key'}
      >
        {createdKeyData ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-center text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                <span>Project &quot;{createdKeyData.project_name}&quot; Created Successfully!</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Copy your secret API Key below. Keep this key secret in your backend server environment.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                Your Secret API Key (X-API-KEY)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={createdKeyData.key}
                  className="w-full px-3 py-2 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl select-all border border-gray-800"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdKeyData.key, 'key', 'modal')}
                  className="px-4 py-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-bold flex items-center space-x-1 shrink-0"
                >
                  {copiedKeyId === 'modal' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKeyId === 'modal' ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
              >
                Close & View Integration Snippets
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateKey} className="space-y-4 text-xs">
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                {modalError}
              </div>
            )}

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Project / App Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. My Website, Fitness App, Store Portal"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Enter your application or website name where you want to send WhatsApp OTPs.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5 text-[11px]">
              <div className="font-semibold text-gray-800 flex items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1.5" />
                <span>Zero-Friction Authentication Mapping</span>
              </div>
              <p className="text-gray-500 leading-relaxed">
                This project will automatically map to an official Meta-approved OTP template with an interactive <strong>[ Copy Code ]</strong> button.
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="px-5 py-2.5 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-bold shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Key...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Create Project Key</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
