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
  ExternalLink,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { api } from '../services/api';
import { MessageTemplate } from '../types';

export const AuthenticationServiceView: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js' | 'python' | 'php'>('curl');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const apiKey = 'bb_live_vino_fitness_auth_2026';
  const apiEndpoint = `${window.location.origin}/api/otp/send/`;

  const loadAuthTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.getTemplates('category=AUTHENTICATION');
      setTemplates(res.results || []);
    } catch {
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadAuthTemplates();
  }, []);

  const activeTemplate = templates.find((t) => t.status === 'APPROVED') || templates[0];

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
        template_name: activeTemplate?.name || 'vino_fitness_otp',
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch WhatsApp OTP. Check phone number and balance.');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'endpoint' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === 'endpoint') {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getCodeSnippet = () => {
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '916385257541';
    const sampleOtp = otpCode || '482910';

    switch (activeCodeTab) {
      case 'curl':
        return `curl -X POST "${apiEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${apiKey}" \\
  -d '{
    "phone": "${cleanPhone}",
    "otp": "${sampleOtp}"
  }'`;

      case 'js':
        return `// JavaScript / Node.js (Fetch API)
const sendWhatsAppOTP = async (phoneNumber, otp) => {
  const response = await fetch('${apiEndpoint}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': '${apiKey}'
    },
    body: JSON.stringify({
      phone: phoneNumber,
      otp: otp
    })
  });

  const data = await response.json();
  if (data.success) {
    console.log('OTP Delivered! WAMID:', data.wamid);
  } else {
    console.error('Failed:', data.error);
  }
};

// Usage Example for Vino Fitness webapp:
sendWhatsAppOTP('${cleanPhone}', '${sampleOtp}');`;

      case 'python':
        return `import requests

def send_whatsapp_otp(phone_number, otp_code):
    url = "${apiEndpoint}"
    headers = {
        "Content-Type": "application/json",
        "X-API-KEY": "${apiKey}"
    }
    payload = {
        "phone": phone_number,
        "otp": otp_code
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Usage Example:
res = send_whatsapp_otp("${cleanPhone}", "${sampleOtp}")
print(res)`;

      case 'php':
        return `<?php
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
        "X-API-KEY: ${apiKey}"
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
      <div className="bg-gradient-to-r from-emerald-900 via-[#075E54] to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Official Meta WhatsApp Cloud API 2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center">
              Authentication (OTP) Service
            </h1>
            <p className="text-sm text-emerald-100/80 mt-2 max-w-2xl leading-relaxed">
              Ultra-fast zero-friction WhatsApp OTP gateway for web apps (e.g. Vino Fitness). Dispatches official verification codes with instant Copy Code buttons in ~2 seconds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs">
              <div className="text-emerald-200/80 uppercase font-semibold text-[10px]">Active Master Gateway</div>
              <div className="font-bold text-white text-sm mt-0.5 flex items-center">
                <span>Bit Byte Technologies</span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px]">
                  +91 99444 95366
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Live Test Console & Developer API Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Test Console (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Template Status Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-[#075E54]">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Official Template</h3>
                  <p className="text-xs text-gray-400">Meta approved zero-friction OTP</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                • APPROVED
              </span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Template Name:</span>
                <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {activeTemplate?.name || 'vino_fitness_otp'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Category:</span>
                <span className="font-semibold text-emerald-800 uppercase text-[11px]">
                  AUTHENTICATION
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Interactive Button:</span>
                <span className="font-semibold text-gray-700">[ Copy Code ]</span>
              </div>
            </div>

            {/* Mobile Preview */}
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
                Test Dispatch Console
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Enter your mobile number to test live WhatsApp OTP delivery from Bit Byte Technologies.
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
                  <div>• Template: {result.template_used}</div>
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
                External Developer REST API Hub
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Integrate Vino Fitness or any client app. Copy the credentials below into your backend or serverless functions.
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
                Production API Key (X-API-KEY)
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3.5 py-2.5 bg-gray-900 text-gray-200 font-mono text-xs rounded-xl overflow-x-auto select-all">
                  {apiKey}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(apiKey, 'key')}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors shrink-0 flex items-center space-x-1 text-xs font-semibold"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Code Snippets Box with Tabs */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4.5 h-4.5 text-[#075E54]" />
                <h4 className="text-sm font-bold text-gray-900">Integration Code Snippets</h4>
              </div>

              {/* Language Tabs */}
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
                {(['curl', 'js', 'python', 'php'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      activeCodeTab === tab
                        ? 'bg-[#075E54] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'js' ? 'JavaScript' : tab === 'curl' ? 'cURL' : tab.toUpperCase()}
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

            {/* Expected Response Card */}
            <div className="pt-2">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Expected 200 OK Response (JSON)
              </div>
              <pre className="p-4 bg-gray-900 text-gray-200 rounded-xl font-mono text-[11px] overflow-x-auto border border-gray-800">
{`{
  "success": true,
  "message": "OTP dispatched successfully via WhatsApp",
  "phone_number": "+91${phone ? phone.replace(/[^0-9]/g, '') : '916385257541'}",
  "otp_code": "${otpCode || '482910'}",
  "wamid": "wamid.HBgMNjM4NTI1NzU0MRUCMRIA...",
  "template_used": "vino_fitness_otp",
  "gateway_number": "+919944495366"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
