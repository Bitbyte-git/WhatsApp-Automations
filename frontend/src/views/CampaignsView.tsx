import React, { useState, useEffect } from 'react';
import {
  Send,
  Plus,
  CheckCircle,
  AlertCircle,
  Users,
  Smartphone,
  Sparkles,
  PhoneCall,
  ExternalLink,
  Wallet,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, Contact } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export const CampaignsView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string>('0.00');

  // Real Form State (Zero hardcoded data)
  const [campaignTitle, setCampaignTitle] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState<string[]>([]);
  const [newButtonText, setNewButtonText] = useState('');

  // Target Mode: 'AUDIENCE' or 'TEST'
  const [deliveryMode, setDeliveryMode] = useState<'AUDIENCE' | 'TEST'>('TEST');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [customAudienceText, setCustomAudienceText] = useState('');

  // Status Alerts
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const tenantParam = activeTenantId ? `client_id=${activeTenantId}` : '';
      const [campRes, contRes, wallRes] = await Promise.all([
        api.getCampaigns(tenantParam),
        api.getContacts(tenantParam),
        api.getWallet(tenantParam),
      ]);
      setCampaigns(campRes?.results || (Array.isArray(campRes) ? campRes : []));
      setContacts(contRes?.results || (Array.isArray(contRes) ? contRes : []));
      if (wallRes?.balance !== undefined) {
        setWalletBalance(String(wallRes.balance));
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId]);

  const handleAddButton = () => {
    if (newButtonText.trim() && buttons.length < 3) {
      setButtons([...buttons, newButtonText.trim()]);
      setNewButtonText('');
    }
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleQuickDispatch = async () => {
    if (!message.trim()) {
      setAlertError('Please enter message text to broadcast.');
      return;
    }

    setAlertSuccess('');
    setAlertError('');
    setSending(true);

    try {
      let audienceNumbers: string[] = [];
      if (deliveryMode === 'AUDIENCE') {
        if (customAudienceText.trim()) {
          audienceNumbers = customAudienceText
            .split(/[\n,]/)
            .map((n) => n.trim())
            .filter((n) => n.length >= 10);
        } else if (contacts.length > 0) {
          audienceNumbers = contacts.map((c) => c.phone_number);
        } else if (testPhoneNumber.trim()) {
          audienceNumbers = [testPhoneNumber.trim()];
        }
      }

      const payload = {
        recipient_type: deliveryMode,
        phone_number: testPhoneNumber.trim(),
        phone_numbers: audienceNumbers,
        service_name: campaignTitle.trim() || 'WhatsApp Broadcast',
        header_text: headerText.trim(),
        message: message.trim(),
        buttons: buttons.filter((b) => b.trim().length > 0),
        footer_text: user?.client_details?.name || 'BitByte Platform',
      };

      const res = await api.quickBroadcast(payload);

      if (res?.success) {
        setAlertSuccess(
          deliveryMode === 'TEST'
            ? `Message delivered to test number: +91 ${testPhoneNumber}!`
            : `Broadcast launched successfully to ${res.sent_count} recipient(s)!`
        );
        if (res.wallet_balance !== undefined) {
          setWalletBalance(res.wallet_balance);
        }
        loadData();
      } else {
        setAlertError(res?.message || 'Failed to dispatch WhatsApp broadcast.');
      }
    } catch (err: any) {
      setAlertError(err.message || 'Error executing WhatsApp broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-50 text-[#075E54] border border-emerald-200">
              WhatsApp Broadcast Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-600 font-semibold">{user?.client_details?.name || 'My Organization'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Broadcast Campaigns
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Create real marketing announcements, add action buttons, and dispatch to your customer audience.
          </p>
        </div>

        {/* Live Wallet Balance Pill */}
        <div className="flex items-center space-x-3 bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl shrink-0">
          <div className="w-10 h-10 rounded-lg bg-[#075E54] text-white flex items-center justify-center shadow-xs">
            <Wallet className="w-5 h-5 text-[#25D366]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#075E54]">Wallet Balance</p>
            <p className="text-lg font-black text-slate-900">₹{parseFloat(walletBalance).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {alertSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-3 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{alertSuccess}</div>
        </div>
      )}

      {alertError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{alertError}</div>
        </div>
      )}

      {/* TWO COLUMN WORKSPACE: COMPOSE (LEFT) + REAL PHONE PREVIEW (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Compose Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Campaign Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              1. Campaign Information
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campaign Title *
              </label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="e.g. Festive Offer Announcement"
                className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Header Text (Optional)
              </label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="e.g. Special Announcement"
                className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Message Content *
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your WhatsApp broadcast message here..."
                className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] leading-relaxed text-slate-800"
              />
            </div>

            {/* Buttons Builder */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Action Buttons (Optional, up to 3)
              </label>

              {buttons.length < 3 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newButtonText}
                    maxLength={25}
                    onChange={(e) => setNewButtonText(e.target.value)}
                    placeholder="Enter button label..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                  />
                  <button
                    type="button"
                    onClick={handleAddButton}
                    className="px-4 py-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}

              {buttons.length > 0 && (
                <div className="space-y-2 pt-1">
                  {buttons.map((btn, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">{idx + 1}. {btn}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(idx)}
                        className="text-slate-400 hover:text-rose-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audience Selection */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              2. Target Audience
            </h2>

            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setDeliveryMode('TEST')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  deliveryMode === 'TEST' ? 'bg-white text-[#075E54] shadow-xs' : 'text-slate-600'
                }`}
              >
                ⚡ Single Test Number
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode('AUDIENCE')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  deliveryMode === 'AUDIENCE' ? 'bg-white text-[#075E54] shadow-xs' : 'text-slate-600'
                }`}
              >
                👥 Audience Contacts ({contacts.length})
              </button>
            </div>

            {deliveryMode === 'TEST' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Test Phone Number (e.g. 9363938143)
                </label>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                    +91
                  </span>
                  <input
                    type="text"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="Enter 10-digit number"
                    className="flex-1 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900">Saved Contacts in System:</span>
                  <span className="font-black text-[#075E54]">{contacts.length} Contacts</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Or Enter Additional Numbers (Comma/Newline Separated)
                  </label>
                  <textarea
                    rows={3}
                    value={customAudienceText}
                    onChange={(e) => setCustomAudienceText(e.target.value)}
                    placeholder="e.g. 9876543210, 9123456780"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Launch Button */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={handleQuickDispatch}
              disabled={sending || !message.trim()}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#075E54] to-[#25D366] text-white font-extrabold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching through WhatsApp Gateway...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>{deliveryMode === 'TEST' ? 'Send Test Message' : 'Launch WhatsApp Broadcast'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Live Realistic Preview */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
            {/* Notch */}
            <div className="flex justify-center mb-3">
              <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
              </div>
            </div>

            {/* Phone Screen */}
            <div className="bg-[#EFEAE2] rounded-[28px] overflow-hidden border border-slate-700 flex flex-col min-h-[500px] shadow-inner">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-xs">
                    {(user?.client_details?.name || 'WA').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">{user?.client_details?.name || 'Business Account'}</h4>
                    <p className="text-[10px] text-emerald-200">Official WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-white/80 text-xs">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                <div className="text-center">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/80 text-slate-600 text-[10px] font-semibold">
                    TODAY
                  </span>
                </div>

                {/* Message Bubble */}
                <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm max-w-[92%] border border-slate-200/60 space-y-2">
                  {headerText && (
                    <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1">
                      {headerText}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {message || 'Your broadcast message preview will appear here...'}
                  </div>

                  <div className="flex items-center justify-end space-x-1 text-[9px] text-slate-400 pt-1">
                    <span>12:00 PM</span>
                    <span className="text-sky-500 font-bold">✓✓</span>
                  </div>
                </div>

                {/* Buttons */}
                {buttons.length > 0 && (
                  <div className="space-y-1.5 max-w-[92%]">
                    {buttons.map((btn, idx) => (
                      <div
                        key={idx}
                        className="bg-white py-2 px-3 rounded-xl border border-slate-200 text-[#075E54] text-xs font-bold flex items-center justify-center space-x-1.5 shadow-2xs"
                      >
                        <span>{btn}</span>
                        <ExternalLink className="w-3 h-3 text-[#075E54]/70" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">Campaign Broadcast History</h3>
          <span className="text-xs text-slate-500 font-semibold">{campaigns.length} Campaigns</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading campaign records...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No campaigns created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Delivered</th>
                  <th className="py-3 px-4">Failed</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{camp.name}</td>
                    <td className="py-3.5 px-4">{camp.total_recipients}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={camp.status} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">{camp.delivered_count || camp.sent_count}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">{camp.failed_count}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {camp.created_at ? new Date(camp.created_at).toLocaleString() : 'N/A'}
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
