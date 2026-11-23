import React, { useState, useEffect } from 'react';
import {
  Send,
  Plus,
  Play,
  CheckCircle,
  AlertCircle,
  Users,
  Smartphone,
  Sparkles,
  Camera,
  ShoppingBag,
  Briefcase,
  Edit3,
  PhoneCall,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Wallet,
  ArrowRight,
  Flame,
  Check,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, Contact } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

interface ServicePreset {
  id: string;
  name: string;
  icon: any;
  category: string;
  headerText: string;
  message: string;
  buttons: string[];
  sampleAudience: string;
}

const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: 'photography',
    name: 'DJ Photograph (Salem)',
    icon: Camera,
    category: 'Wedding & Events',
    headerText: '📸 DJ Photograph - Salem Special',
    message: `Hello! 🌟 DJ Photograph is now taking priority bookings for upcoming Wedding, Reception & Outdoor shoot seasons in Salem!\n\n✨ Book your dates early and get a FREE 4K Cinematic Teaser Reel + complimentary drone coverage! Limited slots available.`,
    buttons: ['📅 Book Shoot Slot', '🖼️ View Portfolio', '📞 Call Naveen'],
    sampleAudience: '500 Wedding & Event Inquiries',
  },
  {
    id: 'supermarket',
    name: 'Salem Fresh Supermarket',
    icon: ShoppingBag,
    category: 'Retail & Grocery',
    headerText: '🛒 Salem Fresh Mega Weekend Sale',
    message: `Exclusive Weekend Dhamaka Savings at Salem Fresh! 🥭🥑\n\nEnjoy Flat 25% OFF on premium dry fruits, organic farm-fresh vegetables, and monthly grocery essentials. Free door delivery across Salem on orders above ₹499!`,
    buttons: ['🛒 Order on WhatsApp', '🏷️ View Offers', '📍 Store Location'],
    sampleAudience: '1,200 Salem Fresh Club Members',
  },
  {
    id: 'corporate',
    name: 'Corporate B2B Blast',
    icon: Briefcase,
    category: 'Enterprise SaaS',
    headerText: '🚀 BitByte Cloud Automation',
    message: `Scale your customer engagement with official WhatsApp Cloud API automation. Broadcast promotional offers, deliver instant OTPs, and automate customer support with AI chatbots.`,
    buttons: ['💼 Schedule Live Demo', '📄 Download Pricing', '💬 Chat With Sales'],
    sampleAudience: '850 Salem Business Owners',
  },
  {
    id: 'custom',
    name: 'Custom Service',
    icon: Edit3,
    category: 'Custom Message',
    headerText: '⚡ Special Announcement',
    message: `Greetings from our team! We have exciting news and updates for you. Reach out to us directly for exclusive offers and inquiries.`,
    buttons: ['👉 Learn More', '📞 Contact Us'],
    sampleAudience: 'Custom Recipient Audience',
  },
];

export const CampaignsView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string>('0.00');

  // Flow State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('photography');
  const [headerText, setHeaderText] = useState<string>(SERVICE_PRESETS[0].headerText);
  const [message, setMessage] = useState<string>(SERVICE_PRESETS[0].message);
  const [buttons, setButtons] = useState<string[]>(SERVICE_PRESETS[0].buttons);
  const [deliveryMode, setDeliveryMode] = useState<'TEST' | 'AUDIENCE'>('TEST');
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>('9363938143');
  const [customAudienceText, setCustomAudienceText] = useState<string>('');

  // Status Alerts
  const [alertSuccess, setAlertSuccess] = useState<string>('');
  const [alertError, setAlertError] = useState<string>('');

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
      // keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId]);

  const handleSelectPreset = (preset: ServicePreset) => {
    setSelectedPresetId(preset.id);
    setHeaderText(preset.headerText);
    setMessage(preset.message);
    setButtons([...preset.buttons]);
    setAlertSuccess('');
    setAlertError('');
  };

  const handleUpdateButton = (index: number, val: string) => {
    const updated = [...buttons];
    updated[index] = val;
    setButtons(updated);
  };

  const handleAddButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, `👉 Action ${buttons.length + 1}`]);
    }
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleQuickDispatch = async () => {
    setAlertSuccess('');
    setAlertError('');
    setSending(true);

    try {
      const activePreset = SERVICE_PRESETS.find(p => p.id === selectedPresetId);
      const serviceName = activePreset ? activePreset.name : 'Business Service';

      let audienceNumbers: string[] = [];
      if (deliveryMode === 'AUDIENCE') {
        if (customAudienceText.trim()) {
          audienceNumbers = customAudienceText
            .split(/[\n,]/)
            .map(n => n.trim())
            .filter(n => n.length >= 10);
        } else if (contacts.length > 0) {
          audienceNumbers = contacts.map(c => c.phone_number);
        } else {
          audienceNumbers = [testPhoneNumber];
        }
      }

      const payload = {
        recipient_type: deliveryMode,
        phone_number: testPhoneNumber,
        phone_numbers: audienceNumbers,
        service_name: serviceName,
        header_text: headerText,
        message: message,
        buttons: buttons.filter(b => b.trim().length > 0),
        footer_text: 'BitByte WhatsApp Engine',
      };

      const res = await api.quickBroadcast(payload);

      if (res?.success) {
        setAlertSuccess(
          deliveryMode === 'TEST'
            ? `🎉 Free Test WhatsApp message delivered to +91 ${testPhoneNumber}! Please check your phone.`
            : `🚀 Campaign broadcast dispatched successfully to ${res.sent_count} recipient(s)!`
        );
        if (res.wallet_balance !== undefined) {
          setWalletBalance(res.wallet_balance);
        }
        loadData();
      } else {
        setAlertError(res?.message || 'Failed to dispatch WhatsApp message. Check gateway credentials.');
      }
    } catch (err: any) {
      setAlertError(err.message || 'Error executing WhatsApp broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-50 text-[#075E54] border border-emerald-200">
              Official WhatsApp Cloud Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-600 font-semibold">1-Click Corporate Broadcast</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            WhatsApp Service & Campaign Flow
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Choose your service type, customize interactive quick-reply buttons, run instant free tests, and launch 500+ broadcasts across Salem with verified Meta delivery.
          </p>
        </div>

        {/* Live Wallet Balance Pill */}
        <div className="flex items-center space-x-3 bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl shrink-0">
          <div className="w-10 h-10 rounded-lg bg-[#075E54] text-white flex items-center justify-center shadow-xs">
            <Wallet className="w-5 h-5 text-[#25D366]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#075E54]">Wallet Credits</p>
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

      {/* STEP 1: SERVICE TYPE PRESET SELECTOR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Select Your Business Service
            </h2>
          </div>
          <span className="text-xs text-slate-500">Pick a preset to auto-fill message & buttons</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'border-[#075E54] bg-emerald-50/50 shadow-md ring-2 ring-[#075E54]/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#075E54] text-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#25D366]" />
                  </div>
                )}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    isSelected ? 'bg-[#075E54] text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-[#075E54]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {preset.category}
                </p>
                <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{preset.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{preset.headerText}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2 & 3: SPLIT COMPOSER & LIVE WHATSAPP PHONE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Message Header & Content */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Compose WhatsApp Message & Interactive Buttons
              </h2>
            </div>

            {/* Header Text Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Message Title / Header Banner
              </label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="e.g. 📸 DJ Photograph - Salem Special"
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54]"
              />
            </div>

            {/* Main Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  WhatsApp Message Body
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Supports WhatsApp *bold* and emojis</span>
              </div>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your customer promotional announcement..."
                className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] font-normal leading-relaxed text-slate-800"
              />
            </div>

            {/* Interactive Quick-Reply Buttons Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Interactive Quick-Reply Buttons (Up to 3)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Customers can tap these buttons in WhatsApp for instant bookings or replies.
                  </p>
                </div>
                {buttons.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddButton}
                    className="inline-flex items-center text-xs font-bold text-[#075E54] hover:text-[#064E3B]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Button
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {buttons.map((btn, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={btn}
                      maxLength={25}
                      onChange={(e) => handleUpdateButton(idx, e.target.value)}
                      placeholder={`e.g. Button ${idx + 1} Label`}
                      className="flex-1 px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveButton(idx)}
                      className="px-2 py-2 text-slate-400 hover:text-rose-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 3: AUDIENCE & TEST MODE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Audience & Instant Free Test
              </h2>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setDeliveryMode('TEST')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  deliveryMode === 'TEST'
                    ? 'bg-white text-[#075E54] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>⚡ Free Test (Single Phone)</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMode('AUDIENCE')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  deliveryMode === 'AUDIENCE'
                    ? 'bg-white text-[#075E54] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>👥 Broadcast Blast (500+ Contacts)</span>
              </button>
            </div>

            {deliveryMode === 'TEST' ? (
              <div className="space-y-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center space-x-2 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold">100% Free Verification Test</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Test this message with interactive buttons directly on your mobile device. Zero wallet balance required for free test.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Enter WhatsApp Number (Naveen / Tester Phone)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                      +91
                    </span>
                    <input
                      type="text"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      placeholder="9363938143"
                      className="flex-1 px-3.5 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Saved Contacts in System</p>
                      <p className="text-[11px] text-slate-600">{contacts.length} opted-in business contacts ready</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#075E54] text-white text-xs font-black">
                      {contacts.length} Contacts
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Or Paste 500+ Numbers (Comma or Newline Separated)
                  </label>
                  <textarea
                    rows={3}
                    value={customAudienceText}
                    onChange={(e) => setCustomAudienceText(e.target.value)}
                    placeholder="e.g. 9363938143, 9876543210, 9123456780"
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: CORPORATE PACKAGES & PRICING */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Transparent Package Pricing
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">Official Meta Gateway Delivery</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-amber-300 bg-amber-50/50 text-center">
                <p className="text-[10px] font-extrabold uppercase text-amber-800">Free Test</p>
                <p className="text-base font-black text-slate-900 mt-0.5">₹0.00</p>
                <p className="text-[10px] text-slate-500">1 Free Message</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <p className="text-[10px] font-extrabold uppercase text-slate-600">Starter 500</p>
                <p className="text-base font-black text-slate-900 mt-0.5">₹499</p>
                <p className="text-[10px] text-emerald-700 font-semibold">₹0.99 / msg</p>
              </div>

              <div className="p-3 rounded-xl border border-[#075E54] bg-emerald-50/60 text-center relative">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-[#075E54] text-white text-[8px] font-black uppercase rounded">
                  Popular
                </span>
                <p className="text-[10px] font-extrabold uppercase text-[#075E54]">Growth 1,000</p>
                <p className="text-base font-black text-slate-900 mt-0.5">₹899</p>
                <p className="text-[10px] text-emerald-700 font-semibold">₹0.89 / msg</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <p className="text-[10px] font-extrabold uppercase text-slate-600">Pro 5,000</p>
                <p className="text-base font-black text-slate-900 mt-0.5">₹3,999</p>
                <p className="text-[10px] text-emerald-700 font-semibold">₹0.80 / msg</p>
              </div>
            </div>

            {/* Dispatch Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleQuickDispatch}
                disabled={sending}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#075E54] to-[#25D366] text-white font-extrabold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending through Infisq WhatsApp Cloud Gateway...</span>
                  </>
                ) : deliveryMode === 'TEST' ? (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Send Instant Free Test to +91 {testPhoneNumber}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Launch WhatsApp Broadcast Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Smartphone WhatsApp Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
            {/* Phone Speaker & Camera Notch */}
            <div className="flex justify-center mb-3">
              <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
              </div>
            </div>

            {/* WhatsApp App Mockup Screen */}
            <div className="bg-[#EFEAE2] rounded-[28px] overflow-hidden border border-slate-700 flex flex-col min-h-[520px] shadow-inner">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-xs">
                    DJ
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">DJ Photograph Salem</h4>
                    <p className="text-[10px] text-emerald-200">Official Business Account</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-white/80 text-xs">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>

              {/* Chat Canvas with WhatsApp Wallpaper Pattern */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                {/* Date Pill */}
                <div className="text-center">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/80 text-slate-600 text-[10px] font-semibold shadow-2xs">
                    TODAY
                  </span>
                </div>

                {/* Message Bubble */}
                <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm max-w-[92%] border border-slate-200/60 space-y-2">
                  {/* Header Banner */}
                  <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1.5 flex items-center space-x-1.5">
                    <span>{headerText || '📸 Service Announcement'}</span>
                  </div>

                  {/* Body Text */}
                  <div className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed font-normal">
                    {message}
                  </div>

                  {/* Timestamp & Double Blue Ticks */}
                  <div className="flex items-center justify-end space-x-1 text-[9px] text-slate-400 pt-1">
                    <span>12:00 PM</span>
                    <span className="text-sky-500 font-bold">✓✓</span>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="space-y-1.5 max-w-[92%]">
                  {buttons.map((btn, idx) => (
                    <div
                      key={idx}
                      className="bg-white hover:bg-slate-50 transition-colors py-2 px-3 rounded-xl border border-slate-200 text-[#075E54] text-xs font-bold flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
                    >
                      <span>{btn}</span>
                      <ExternalLink className="w-3 h-3 text-[#075E54]/70" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Fake WhatsApp Bottom Input Bar */}
              <div className="bg-[#F0F2F5] px-3 py-2 flex items-center space-x-2 border-t border-slate-200">
                <div className="flex-1 bg-white px-3 py-1.5 rounded-full text-[11px] text-slate-400 border border-slate-200">
                  Type a reply...
                </div>
                <div className="w-7 h-7 rounded-full bg-[#075E54] text-white flex items-center justify-center shadow-2xs">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT CAMPAIGNS & BROADCAST LOGS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Broadcast Campaign History</h3>
            <p className="text-xs text-slate-500">Live delivery statistics from PostgreSQL database</p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{campaigns.length} Total Campaigns</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading past campaign records...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">No campaigns launched yet.</p>
            <p>Use the 1-Click flow above to dispatch your first WhatsApp blast or run a free test.</p>
          </div>
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
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{camp.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{camp.total_recipients}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={camp.status} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {camp.delivered_count || camp.sent_count}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">{camp.failed_count}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {camp.created_at ? new Date(camp.created_at).toLocaleString() : 'Just now'}
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
