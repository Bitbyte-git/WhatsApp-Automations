import React, { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
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

  // Service Type
  const [serviceType, setServiceType] = useState<'MARKETING' | 'SERVICE'>('MARKETING');

  // Target Mode: 'ALL' | 'CUSTOM_COUNT' | 'TEST'
  const [deliveryMode, setDeliveryMode] = useState<'ALL' | 'CUSTOM_COUNT' | 'TEST'>('TEST');
  const [customSendCount, setCustomSendCount] = useState<number>(100);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [customAudienceText, setCustomAudienceText] = useState('');
  const [connectingContacts, setConnectingContacts] = useState(false);

  // Status Alerts
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  // Marketing Images
  const [marketingImages, setMarketingImages] = useState<any[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const tenantParam = activeTenantId ? `client_id=${activeTenantId}` : '';
      const [campRes, contRes, wallRes, imgRes] = await Promise.all([
        api.getCampaigns(tenantParam),
        api.getContacts(tenantParam),
        api.getWallet(tenantParam),
        api.getMarketingImages().catch(() => ({ results: [] })),
      ]);
      setCampaigns(campRes?.results || (Array.isArray(campRes) ? campRes : []));
      setContacts(contRes?.results || (Array.isArray(contRes) ? contRes : []));
      if (wallRes?.balance !== undefined) {
        setWalletBalance(String(wallRes.balance));
      }
      setMarketingImages(imgRes?.results || []);
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

  const handleConnectContacts = async () => {
    setConnectingContacts(true);
    setAlertSuccess('');
    setAlertError('');
    try {
      const res = await api.syncWhatsAppDevice();
      if (res?.success) {
        setAlertSuccess(`Contacts synced! ${res.total_contacts || 0} real contacts ready.`);
        loadData();
      } else {
        setAlertError(res?.error || 'Failed to sync contacts.');
      }
    } catch (err: any) {
      setAlertError(err.message || 'Error connecting contacts.');
    } finally {
      setConnectingContacts(false);
    }
  };

  const handleQuickDispatch = async () => {
    if (!message.trim()) {
      setAlertError('Please enter your marketing offer message.');
      return;
    }

    setAlertSuccess('');
    setAlertError('');
    setSending(true);

    try {
      let recipientType = 'AUDIENCE';
      let audienceNumbers: string[] = [];

      if (deliveryMode === 'TEST') {
        recipientType = 'TEST';
      } else if (deliveryMode === 'ALL') {
        recipientType = 'AUDIENCE';
        if (contacts.length > 0) {
          audienceNumbers = contacts.map((c) => c.phone_number);
        } else if (customAudienceText.trim()) {
          audienceNumbers = customAudienceText
            .split(/[\n,]/)
            .map((n) => n.trim())
            .filter((n) => n.length >= 10);
        }
      } else if (deliveryMode === 'CUSTOM_COUNT') {
        recipientType = 'AUDIENCE';
        const count = Math.max(1, customSendCount || 100);
        if (contacts.length > 0) {
          audienceNumbers = contacts.slice(0, count).map((c) => c.phone_number);
        } else if (customAudienceText.trim()) {
          audienceNumbers = customAudienceText
            .split(/[\n,]/)
            .map((n) => n.trim())
            .filter((n) => n.length >= 10)
            .slice(0, count);
        }
      }

      const selectedImg = marketingImages.find((img: any) => img.id === selectedImageId);

      const payload = {
        recipient_type: recipientType,
        phone_number: testPhoneNumber.trim(),
        phone_numbers: audienceNumbers,
        service_name: campaignTitle.trim() || 'Marketing Offer',
        header_text: headerText.trim(),
        message: message.trim(),
        buttons: buttons.filter((b) => b.trim().length > 0),
        footer_text: user?.client_details?.name || 'BitByte Platform',
        image_url: selectedImg?.webp_url || selectedImg?.cloudinary_url || '',
      };

      const res = await api.quickBroadcast(payload);

      if (res?.success) {
        setAlertSuccess(
          deliveryMode === 'TEST'
            ? `Test message delivered to +91 ${testPhoneNumber}!`
            : `Marketing broadcast launched successfully to ${res.sent_count} recipient(s)!`
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

  // ── Image Handlers ──────────────────────────────────────────
  const loadImages = async () => {
    try {
      const res = await api.getMarketingImages();
      setMarketingImages(res?.results || []);
    } catch { /* ignore */ }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setImageUploadError('');
    try {
      const res = await api.uploadMarketingImage(file, file.name.replace(/\.[^.]+$/, ''));
      await loadImages();
      setSelectedImageId(res?.image?.id || null);
      setAlertSuccess(`Image "${res?.image?.name}" uploaded as WebP successfully!`);
    } catch (err: any) {
      setImageUploadError(err.message || 'Upload failed. Check Cloudinary config.');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (id: number, name: string) => {
    if (!window.confirm(`Delete image "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteMarketingImage(id);
      if (selectedImageId === id) setSelectedImageId(null);
      await loadImages();
      setAlertSuccess(`Image "${name}" deleted.`);
    } catch (err: any) {
      setAlertError(err.message || 'Delete failed.');
    }
  };

  // Load images on mount
  useEffect(() => { loadImages(); }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-50 text-[#075E54] border border-emerald-200">
              {user?.role === 'SUPERADMIN' ? '👑 Admin Official WhatsApp Sender' : 'WhatsApp Broadcast Engine'}
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-600 font-semibold">
              {user?.role === 'SUPERADMIN' ? 'BitByte Technologies (+91 9363938143)' : (user?.client_details?.name || 'My Organization')}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            {user?.role === 'SUPERADMIN' ? 'Admin Marketing Broadcast Engine' : 'Broadcast Campaigns'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {user?.role === 'SUPERADMIN'
              ? 'Send WhatsApp marketing messages directly from the Admin Official WhatsApp Number (+91 9363938143) to any customer or contact.'
              : 'Create real marketing announcements, add action buttons, and dispatch to your customer audience.'}
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-3 bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl shrink-0">
          <div className="w-10 h-10 rounded-lg bg-[#075E54] text-white flex items-center justify-center shadow-xs">
            <Smartphone className="w-5 h-5 text-[#25D366]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#075E54]">
              {user?.role === 'SUPERADMIN' ? 'Admin Gateway Status' : 'Wallet Balance'}
            </p>
            <p className="text-base font-black text-slate-900">
              {user?.role === 'SUPERADMIN' ? '+91 9363938143 (Active)' : `₹${parseFloat(walletBalance).toFixed(2)}`}
            </p>
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

          {/* ── Marketing Image Upload Section ───────────────────── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-[#075E54]" />
                <span>1b. Marketing Image (Optional)</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">{marketingImages.length}/3 images</span>
            </div>

            {/* Upload Zone */}
            {marketingImages.length < 3 && (
              <div
                className="border-2 border-dashed border-emerald-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#075E54] hover:bg-emerald-50/40 transition-all"
                onClick={() => imageInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-[#075E54] mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Click to upload image</p>
                <p className="text-[11px] text-slate-400 mt-1">JPG, PNG, WebP — max 5MB — auto-converted to WebP</p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </div>
            )}

            {uploadingImage && (
              <div className="flex items-center space-x-2 text-xs text-emerald-700 font-semibold">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Uploading to Cloudinary as WebP...</span>
              </div>
            )}

            {imageUploadError && (
              <p className="text-xs text-rose-600 font-semibold">{imageUploadError}</p>
            )}

            {/* Image Grid */}
            {marketingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {marketingImages.map((img: any) => (
                  <div
                    key={img.id}
                    className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedImageId === img.id
                        ? 'border-[#075E54] ring-2 ring-[#25D366]/40'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                    onClick={() => setSelectedImageId(selectedImageId === img.id ? null : img.id)}
                  >
                    <img
                      src={img.webp_url || img.cloudinary_url}
                      alt={img.name}
                      className="w-full h-24 object-cover"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        title="Preview"
                        className="p-1.5 bg-white/90 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(img.webp_url || img.cloudinary_url); }}
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className="p-1.5 bg-rose-500 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id, img.name); }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                    {/* Selected badge */}
                    {selectedImageId === img.id && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#075E54] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="p-1.5 bg-white">
                      <p className="text-[10px] font-bold text-slate-700 truncate">{img.name}</p>
                      <p className="text-[9px] text-slate-400">{img.file_size_kb}KB • WebP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedImageId && (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Image selected — will be sent with message</span>
              </p>
            )}
          </div>

          {/* Image Preview Modal */}
          {previewImageUrl && (
            <div
              className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
              onClick={() => setPreviewImageUrl(null)}
            >
              <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <img src={previewImageUrl} alt="Preview" className="w-full rounded-2xl shadow-2xl" />
                <button
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-slate-700 shadow"
                  onClick={() => setPreviewImageUrl(null)}
                >✕</button>
              </div>
            </div>
          )}

          {/* Audience Selection */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Connect Contacts & Target Audience
              </h2>
              <button
                type="button"
                onClick={handleConnectContacts}
                disabled={connectingContacts}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#075E54] border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{connectingContacts ? 'Connecting...' : '📱 Connect / Sync Contacts'}</span>
              </button>
            </div>

            {/* Contacts Status Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${contacts.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="font-semibold text-slate-700">Connected Contacts:</span>
              </div>
              <span className="font-black text-[#075E54] text-sm">{contacts.length} Real Contacts Available</span>
            </div>

            {/* 3 Delivery Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDeliveryMode('ALL')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  deliveryMode === 'ALL'
                    ? 'border-[#075E54] bg-emerald-50/60 ring-1 ring-[#075E54]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-bold text-slate-900">All Contacts</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Send to all {contacts.length} contacts</p>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMode('CUSTOM_COUNT')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  deliveryMode === 'CUSTOM_COUNT'
                    ? 'border-[#075E54] bg-emerald-50/60 ring-1 ring-[#075E54]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-bold text-slate-900">Custom Count</p>
                <p className="text-[11px] text-slate-500 mt-0.5">e.g. 50, 100, 500 people</p>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMode('TEST')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  deliveryMode === 'TEST'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-bold text-emerald-950">
                  {user?.role === 'SUPERADMIN' ? '📱 Specific Number' : '⚡ Single Test'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {user?.role === 'SUPERADMIN' ? 'Send to entered customer phone' : 'Test on own phone'}
                </p>
              </button>
            </div>

            {/* Custom Count Input */}
            {deliveryMode === 'CUSTOM_COUNT' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  How many contacts to send to?
                </label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, contacts.length)}
                  value={customSendCount}
                  onChange={(e) => setCustomSendCount(parseInt(e.target.value) || 10)}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] bg-white"
                />
                <p className="text-[10px] text-slate-500">Will send to the first {customSendCount} connected contacts.</p>
              </div>
            )}

            {/* Single Test / Specific Number Input */}
            {deliveryMode === 'TEST' && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    {user?.role === 'SUPERADMIN' ? 'Enter Target WhatsApp Number *' : 'Enter Test WhatsApp Number *'}
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    Sender: +91 9363938143
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                    +91
                  </span>
                  <input
                    type="text"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] bg-white text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-emerald-800">
                  {user?.role === 'SUPERADMIN'
                    ? 'This WhatsApp marketing message will be dispatched directly from Admin Official WhatsApp (+91 9363938143).'
                    : 'Test this offer on your personal mobile before sending to all contacts.'}
                </p>
              </div>
            )}

            {/* Optional additional numbers */}
            {deliveryMode !== 'TEST' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Or Paste Extra Numbers (Optional, Comma/Newline Separated)
                </label>
                <textarea
                  rows={2}
                  value={customAudienceText}
                  onChange={(e) => setCustomAudienceText(e.target.value)}
                  placeholder="e.g. 9876543210, 9123456780"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] font-mono"
                />
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
                  <span>
                    {deliveryMode === 'TEST'
                      ? (user?.role === 'SUPERADMIN'
                          ? `🚀 Send WhatsApp Message from Admin to +91 ${testPhoneNumber || '...'}`
                          : `⚡ Send Test Message to +91 ${testPhoneNumber || 'Phone'}`)
                      : deliveryMode === 'CUSTOM_COUNT'
                      ? `🚀 Send Marketing Offer to ${Math.min(customSendCount, contacts.length || customSendCount)} Contacts`
                      : `🚀 Send Marketing Offer to ALL ${contacts.length} Contacts`}
                  </span>
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
                    {user?.role === 'SUPERADMIN' ? 'BB' : (user?.client_details?.name || 'WA').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">
                      {user?.role === 'SUPERADMIN' ? 'BitByte Official (+91 9363938143)' : (user?.client_details?.name || 'Business Account')}
                    </h4>
                    <p className="text-[10px] text-emerald-200">
                      {user?.role === 'SUPERADMIN' ? 'Admin Verified Gateway' : 'Official WhatsApp'}
                    </p>
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
