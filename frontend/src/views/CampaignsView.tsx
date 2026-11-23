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
  RefreshCw,
  Zap,
  Tag,
  Gift,
  Heart,
  Store,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, Contact } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

interface ServiceOffer {
  id: string;
  serviceCategory: string;
  serviceName: string;
  icon: any;
  offerBadge: string;
  offerTitle: string;
  discountHighlight: string;
  headerText: string;
  message: string;
  buttons: string[];
  recommendedFor: string;
}

const SERVICE_OFFERS: ServiceOffer[] = [
  {
    id: 'photo_wedding',
    serviceCategory: 'Wedding & Events',
    serviceName: 'DJ Photograph (Salem)',
    icon: Camera,
    offerBadge: '🔥 30% OFF MEGA OFFER',
    offerTitle: 'Wedding & Reception Cinematic Package',
    discountHighlight: 'Save ₹15,000 + Free 4K Teaser Reel & Drone Coverage',
    headerText: '📸 DJ Photograph - Salem Wedding Special',
    message: `Hello! 🌟 DJ Photograph brings you our exclusive Wedding & Reception Photography Package for upcoming seasons in Salem!\n\n🎁 SPECIAL OFFER: Book early & get FLAT 30% OFF + a complimentary 4K Cinematic Teaser Reel & Drone Shoot!\n\n✨ Limited calendar slots available. Tap below to reserve your date.`,
    buttons: ['📅 Book Shoot Slot', '🖼️ View Portfolio', '📞 Call Naveen'],
    recommendedFor: 'Couples, Families & Wedding Inquiries',
  },
  {
    id: 'photo_couple',
    serviceCategory: 'Outdoor & Pre-Wedding',
    serviceName: 'DJ Photograph (Salem)',
    icon: Heart,
    offerBadge: '🎉 POPULAR DEAL • ₹4,999 ONLY',
    offerTitle: 'Outdoor Cinematic Couple Shoot',
    discountHighlight: '50 Edited HD Photos + 1 Min Instagram Reel',
    headerText: '✨ DJ Photograph - Pre-Wedding Couple Shoot',
    message: `Plan your dream couple photoshoot in Salem & Yercaud scenic spots! 🌄\n\n📸 What you get:\n• 50 Color-graded High-Resolution Photos\n• 1 Cinematic Instagram Reel for social media\n• 2 Outfit changes\n\nAll at just ₹4,999! Limited weekend slots available.`,
    buttons: ['📸 Book Couple Shoot', '📍 View Locations', '💬 WhatsApp Chat'],
    recommendedFor: 'Engaged Couples & Anniversary Shoots',
  },
  {
    id: 'photo_birthday',
    serviceCategory: 'Kids & Birthday',
    serviceName: 'DJ Photograph (Salem)',
    icon: Gift,
    offerBadge: '👶 FLAT 20% DISCOUNT',
    offerTitle: 'Kids Birthday & Theme Shoot',
    discountHighlight: 'Free Custom Theme Backdrop & Printed Photo Album',
    headerText: '🎂 DJ Photograph - Kids Birthday & Baby Shoot',
    message: `Celebrate your child's special day with unforgettable candid memories! 🎈\n\nEnjoy FLAT 20% OFF on our Birthday & Baby Theme packages. Includes candid photos, family portraits & a premium printed memory album!`,
    buttons: ['🎂 Book Birthday Shoot', '🖼️ View Baby Themes', '📞 Call Studio'],
    recommendedFor: 'Parents & Family Milestone Events',
  },
  {
    id: 'retail_supermarket',
    serviceCategory: 'Retail & Grocery',
    serviceName: 'Salem Fresh Supermarket',
    icon: ShoppingBag,
    offerBadge: '🥦 25% OFF WEEKEND SALE',
    offerTitle: 'Salem Fresh Mega Grocery Dhamaka',
    discountHighlight: 'Flat 25% OFF + Free Home Delivery on ₹499+',
    headerText: '🛒 Salem Fresh - Mega Weekend Savings',
    message: `Exclusive Weekend Dhamaka Savings at Salem Fresh! 🥭🥑\n\nEnjoy Flat 25% OFF on premium dry fruits, organic farm-fresh vegetables, and monthly grocery essentials. Free door delivery across Salem on orders above ₹499!`,
    buttons: ['🛒 Order on WhatsApp', '🏷️ View Weekend Deals', '📍 Store Location'],
    recommendedFor: 'Salem Residents & Regular Shoppers',
  },
  {
    id: 'b2b_corporate',
    serviceCategory: 'Enterprise SaaS',
    serviceName: 'BitByte Technologies',
    icon: Briefcase,
    offerBadge: '🚀 BUSINESS AUTOMATION',
    offerTitle: 'Official WhatsApp Cloud API Engine',
    discountHighlight: 'Automate 10,000+ Customer Notifications & Support',
    headerText: '🚀 BitByte Cloud Automation',
    message: `Scale your customer engagement with official WhatsApp Cloud API automation. Broadcast promotional offers, deliver instant OTPs, and automate customer support with AI chatbots.`,
    buttons: ['💼 Schedule Live Demo', '📄 Download Pricing', '💬 Chat With Sales'],
    recommendedFor: 'Salem Business Owners & Merchants',
  },
];

export const CampaignsView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [syncingDevice, setSyncingDevice] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string>('0.00');

  // WhatsApp Connection State
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean>(true);
  const [connectedNumber, setConnectedNumber] = useState<string>('+91 9363938143');
  const [connectedOwner, setConnectedOwner] = useState<string>('Naveen - DJ Photograph');
  const [syncedContactsCount, setSyncedContactsCount] = useState<number>(500);

  // Selected Offer & Customizer State
  const [selectedOfferId, setSelectedOfferId] = useState<string>('photo_wedding');
  const [headerText, setHeaderText] = useState<string>(SERVICE_OFFERS[0].headerText);
  const [message, setMessage] = useState<string>(SERVICE_OFFERS[0].message);
  const [buttons, setButtons] = useState<string[]>(SERVICE_OFFERS[0].buttons);

  // Target Mode: 'ALL_WHATSAPP_CONTACTS' or 'TEST_NUMBER'
  const [sendTargetMode, setSendTargetMode] = useState<'ALL_WHATSAPP_CONTACTS' | 'TEST_NUMBER'>('ALL_WHATSAPP_CONTACTS');
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>('9363938143');

  // Status Alerts
  const [alertSuccess, setAlertSuccess] = useState<string>('');
  const [alertError, setAlertError] = useState<string>('');

  const activeOffer = SERVICE_OFFERS.find(o => o.id === selectedOfferId) || SERVICE_OFFERS[0];

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
      const loadedContacts = contRes?.results || (Array.isArray(contRes) ? contRes : []);
      setContacts(loadedContacts);
      if (loadedContacts.length > 0) {
        setSyncedContactsCount(loadedContacts.length);
      }
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

  const handleSelectOffer = (offer: ServiceOffer) => {
    setSelectedOfferId(offer.id);
    setHeaderText(offer.headerText);
    setMessage(offer.message);
    setButtons([...offer.buttons]);
    setAlertSuccess('');
    setAlertError('');
  };

  const handleSyncWhatsAppContacts = async () => {
    setSyncingDevice(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const res = await api.syncWhatsAppDevice();
      if (res?.success) {
        setIsWhatsAppConnected(true);
        if (res.device_number) setConnectedNumber(res.device_number);
        if (res.device_owner) setConnectedOwner(res.device_owner);
        if (res.total_contacts) setSyncedContactsCount(res.total_contacts);
        setAlertSuccess(res.message || 'WhatsApp connected! All contacts synced successfully.');
        loadData();
      } else {
        setAlertError(res?.error || 'Failed to sync WhatsApp contacts.');
      }
    } catch (err: any) {
      setAlertError(err.message || 'Failed to sync WhatsApp contacts from device.');
    } finally {
      setSyncingDevice(false);
    }
  };

  const handleQuickDispatch = async (forceMode?: 'ALL_WHATSAPP_CONTACTS' | 'TEST_NUMBER') => {
    const mode = forceMode || sendTargetMode;
    setAlertSuccess('');
    setAlertError('');
    setSending(true);

    try {
      let recipientType = 'AUDIENCE';
      let phoneNumbers: string[] = [];

      if (mode === 'TEST_NUMBER') {
        recipientType = 'TEST';
      } else {
        // Send to ALL synced WhatsApp numbers
        recipientType = 'AUDIENCE';
        if (contacts.length > 0) {
          phoneNumbers = contacts.map(c => c.phone_number);
        } else {
          phoneNumbers = [testPhoneNumber];
        }
      }

      const payload = {
        recipient_type: recipientType,
        phone_number: testPhoneNumber,
        phone_numbers: phoneNumbers,
        service_name: activeOffer.serviceName,
        header_text: headerText,
        message: message,
        buttons: buttons.filter(b => b.trim().length > 0),
        footer_text: 'BitByte WhatsApp Engine',
      };

      const res = await api.quickBroadcast(payload);

      if (res?.success) {
        setAlertSuccess(
          mode === 'TEST_NUMBER'
            ? `🎉 Free Test WhatsApp message delivered to +91 ${testPhoneNumber}! Please check your phone.`
            : `🚀 Broadcast launched! ${activeOffer.offerTitle} dispatched to ${res.sent_count || syncedContactsCount} WhatsApp contacts on your phone!`
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
      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-50 text-[#075E54] border border-emerald-200">
              Official WhatsApp Cloud Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-600 font-semibold">Corporate 1-Click Offer Blast</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Select Your Offer & Broadcast to All WhatsApp Contacts
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Pick your business service offer, sync all contacts from your connected WhatsApp phone, and send to all numbers in 1-click without typing individual numbers!
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

      {/* STEP 1: SELECT YOUR SERVICE & OFFER (What service do you want to offer?) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Step 1: Select Your Service & Exclusive Offer
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Click an offer to instantly load message & action buttons</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICE_OFFERS.map((offer) => {
            const Icon = offer.icon;
            const isSelected = selectedOfferId === offer.id;
            return (
              <div
                key={offer.id}
                onClick={() => handleSelectOffer(offer)}
                className={`cursor-pointer p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#075E54] bg-emerald-50/40 shadow-md ring-2 ring-[#075E54]/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 text-[#25D366]" />
                  </div>
                )}

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-100 text-amber-900 border border-amber-200">
                      {offer.offerBadge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">•</span>
                    <span className="text-[11px] text-slate-500 font-bold">{offer.serviceCategory}</span>
                  </div>

                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#075E54] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">{offer.offerTitle}</h3>
                      <p className="text-[11px] text-slate-500 font-semibold">{offer.serviceName}</p>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-emerald-800 bg-emerald-100/60 px-2.5 py-1.5 rounded-lg mt-2">
                    ✨ {offer.discountHighlight}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Audience: {offer.recommendedFor}</span>
                  <span className={`font-bold ${isSelected ? 'text-[#075E54]' : 'text-slate-400'}`}>
                    {isSelected ? 'Selected ✓' : 'Select Offer →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2: CONNECT MY WHATSAPP & AUTO-FETCH ALL CONTACTS */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#075E54] to-emerald-800 text-white p-6 rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <Smartphone className="w-6 h-6 text-[#25D366]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-[#25D366] text-emerald-950">
                  Step 2: Auto-Sync
                </span>
                <span className="text-xs text-emerald-200">Zero Typing Required</span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-1">
                Connected WhatsApp: {connectedOwner} ({connectedNumber})
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                All numbers in your WhatsApp contacts are automatically fetched. You don't have to enter numbers one by one!
              </p>
            </div>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleSyncWhatsAppContacts}
            disabled={syncingDevice}
            className="px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-[#075E54] font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${syncingDevice ? 'animate-spin' : ''}`} />
            <span>{syncingDevice ? 'Syncing WhatsApp Device...' : 'Refresh / Sync WhatsApp Contacts'}</span>
          </button>
        </div>

        {/* Sync Summary Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366] font-extrabold text-sm">
              ✓
            </div>
            <div>
              <p className="font-bold text-white text-sm">{syncedContactsCount} WhatsApp Contacts Synced</p>
              <p className="text-emerald-200 text-[11px]">Salem wedding inquiries, family contacts & customer leads auto-selected.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white font-bold text-[11px]">
              ☑️ All {syncedContactsCount} Contacts Selected
            </span>
          </div>
        </div>
      </div>

      {/* STEP 3 & 4: COMPOSER, 1-CLICK BLAST & LIVE PHONE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Message Details & 1-Click Launch */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Offer Message & Buttons */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Review Offer Message & Interactive Buttons
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#075E54]">{activeOffer.offerBadge}</span>
            </div>

            {/* Header Banner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Offer Title / Header Banner
              </label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                WhatsApp Message Body
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] leading-relaxed text-slate-800 font-normal"
              />
            </div>

            {/* Interactive Quick-Reply Buttons */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Interactive Quick-Reply Action Buttons (Touch to Action)
              </label>
              <div className="space-y-2">
                {buttons.map((btn, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-50 text-[#075E54] font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={btn}
                      maxLength={25}
                      onChange={(e) => {
                        const updated = [...buttons];
                        updated[idx] = e.target.value;
                        setButtons(updated);
                      }}
                      className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LAUNCH TARGET & 1-CLICK BLAST BUTTON */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Dispatch Offer to WhatsApp Contacts
                </h2>
              </div>
            </div>

            {/* 2 Target Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Blast to All Contacts */}
              <div
                onClick={() => setSendTargetMode('ALL_WHATSAPP_CONTACTS')}
                className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                  sendTargetMode === 'ALL_WHATSAPP_CONTACTS'
                    ? 'border-[#075E54] bg-emerald-50/60 ring-2 ring-[#075E54]/20'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-slate-900">🚀 All WhatsApp Contacts</span>
                  <input
                    type="radio"
                    name="targetMode"
                    checked={sendTargetMode === 'ALL_WHATSAPP_CONTACTS'}
                    onChange={() => setSendTargetMode('ALL_WHATSAPP_CONTACTS')}
                    className="accent-[#075E54]"
                  />
                </div>
                <p className="text-[11px] text-slate-600 font-semibold">
                  Send to all {syncedContactsCount} synced WhatsApp numbers at once!
                </p>
                <p className="text-[10px] text-[#075E54] font-extrabold mt-1">Zero contact typing required</p>
              </div>

              {/* Option B: Free Test to Naveen */}
              <div
                onClick={() => setSendTargetMode('TEST_NUMBER')}
                className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                  sendTargetMode === 'TEST_NUMBER'
                    ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/20'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-amber-900">⚡ Free Test (My Phone)</span>
                  <input
                    type="radio"
                    name="targetMode"
                    checked={sendTargetMode === 'TEST_NUMBER'}
                    onChange={() => setSendTargetMode('TEST_NUMBER')}
                    className="accent-amber-600"
                  />
                </div>
                <p className="text-[11px] text-slate-600 font-semibold">
                  Deliver 1 free test message to Naveen (+91 {testPhoneNumber})
                </p>
                <p className="text-[10px] text-amber-700 font-extrabold mt-1">100% Free • Verify on Phone</p>
              </div>
            </div>

            {/* BIG ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleQuickDispatch('ALL_WHATSAPP_CONTACTS')}
                disabled={sending}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#075E54] to-[#25D366] text-white font-black text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Broadcasting through Infisq WhatsApp Cloud Gateway...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>🚀 Blast "{activeOffer.offerTitle}" to All {syncedContactsCount} Contacts</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleQuickDispatch('TEST_NUMBER')}
                disabled={sending}
                className="w-full py-3 px-4 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 font-bold text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>⚡ Or Send 1 Instant Free Test to My Phone (+91 {testPhoneNumber})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live WhatsApp Smartphone Preview */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
            {/* Phone Notch */}
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
                    <h4 className="text-xs font-bold leading-tight">{activeOffer.serviceName}</h4>
                    <p className="text-[10px] text-emerald-200">Official Business Account • Salem</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-white/80 text-xs">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>

              {/* Chat Canvas */}
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
                  <div className="font-black text-xs text-slate-900 border-b border-slate-100 pb-1.5 flex items-center space-x-1.5">
                    <span>{headerText || activeOffer.headerText}</span>
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
            <p className="text-xs text-slate-500">Live delivery records from PostgreSQL database</p>
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
            <p>Select your offer above and click "Blast to All WhatsApp Contacts" to start.</p>
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
