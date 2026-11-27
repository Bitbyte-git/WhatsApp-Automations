import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  CheckCircle,
  AlertCircle,
  XCircle,
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
  FileSpreadsheet,
  Download,
  ShieldCheck,
  CheckCheck,
  X,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { Campaign, Contact } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeleton';

interface CampaignsViewProps {
  initialCategory?: 'MARKETING' | 'UTILITY' | 'SERVICE';
  onNavigate?: (tab: string) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({ initialCategory = 'MARKETING', onNavigate }) => {
  const { user, activeTenantId } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string>('0.00');
  const [dispatchPopup, setDispatchPopup] = useState<{
    isOpen: boolean;
    isSuccess: boolean;
    title: string;
    message: string;
    category: string;
    errorTip?: string;
  } | null>(null);

  // Real Form State (Zero hardcoded data)
  const [campaignTitle, setCampaignTitle] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState<string[]>([]);
  const [newButtonText, setNewButtonText] = useState('');

  // Service Type
  const [serviceType, setServiceType] = useState<'MARKETING' | 'UTILITY' | 'SERVICE'>(initialCategory);

  useEffect(() => {
    setServiceType(initialCategory);
  }, [initialCategory]);

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
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; url: string } | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [excelSummary, setExcelSummary] = useState<string>('');

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

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAlertError('');
    setExcelSummary('');
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const extracted = new Set<string>();

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        rows.forEach((row) => {
          if (!Array.isArray(row)) return;
          row.forEach((cell) => {
            if (cell === null || cell === undefined) return;
            const digits = String(cell).replace(/[^0-9]/g, '');
            if (digits.length === 10 && /^[6-9]/.test(digits)) {
              extracted.add(digits);
            } else if (digits.length === 12 && digits.startsWith('91')) {
              extracted.add(digits.slice(2));
            } else if (digits.length >= 10 && digits.length <= 13) {
              extracted.add(digits);
            }
          });
        });
      });

      const list = Array.from(extracted);
      if (list.length === 0) {
        setAlertError('No valid 10-digit WhatsApp phone numbers found in the uploaded file. Please check your columns.');
        return;
      }

      setDeliveryMode('TEST');
      setTestPhoneNumber(list.join(', '));
      setExcelSummary(`${list.length} unique numbers loaded from "${file.name}"`);
    } catch {
      setAlertError('Could not parse file. Please upload a valid .xlsx, .xls, or .csv file.');
    } finally {
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handleDownloadSampleExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Phone Number'],
      ['Customer 1', '6385257541'],
      ['Customer 2', '7339201392'],
      ['Customer 3', '9876543210'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, 'bitbyte_whatsapp_contacts_sample.xlsx');
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

      const parsedSpecificNumbers = testPhoneNumber
        .split(/[\n,\s]+/)
        .map((n) => n.trim().replace(/[^0-9+]/g, ''))
        .filter((n) => n.length >= 10);

      if (deliveryMode === 'TEST') {
        if (parsedSpecificNumbers.length > 1) {
          recipientType = 'AUDIENCE';
          audienceNumbers = parsedSpecificNumbers;
        } else {
          recipientType = 'TEST';
        }
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

      const selectedImg =
        marketingImages.find((img: any) => img.id === selectedImageId) ||
        (serviceType === 'MARKETING' && marketingImages.length === 1 ? marketingImages[0] : undefined);

      const payload = {
        recipient_type: recipientType,
        message_category: serviceType,
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
        const count = res.sent_count || 1;
        const successMsg =
          deliveryMode === 'TEST' && count === 1
            ? `Message delivered to +91 ${testPhoneNumber}!`
            : `Broadcast successfully delivered to ${count} recipient(s)!`;
        setAlertSuccess(successMsg);
        setDispatchPopup({
          isOpen: true,
          isSuccess: true,
          title:
            serviceType === 'UTILITY'
              ? 'Utility Update Delivered!'
              : serviceType === 'SERVICE'
              ? 'Service Reply Delivered!'
              : 'Marketing Message Delivered!',
          message: successMsg,
          category: serviceType,
        });
        if (res.wallet_balance !== undefined) {
          setWalletBalance(res.wallet_balance);
        }
        // Delete sent image from active composer & Cloudinary so next message starts at 0/3 fresh
        const sentImgId = selectedImg?.id;
        setCampaignTitle('');
        setHeaderText('');
        setMessage('');
        setButtons([]);
        setNewButtonText('');
        setSelectedImageId(null);
        setTestPhoneNumber('');
        setCustomAudienceText('');
        setExcelSummary('');
        if (sentImgId) {
          // Hide from active composer immediately so next message starts at 0/3 fresh,
          // but delay Cloudinary deletion by 30s so Meta's async media downloader doesn't hit 404!
          setMarketingImages((prev) => prev.filter((img: any) => img.id !== sentImgId));
          setTimeout(() => {
            api.deleteMarketingImage(sentImgId).catch(() => {});
          }, 30000);
        }
        loadData();
      } else {
        const errorMsg = res?.error || res?.message || 'Failed to dispatch WhatsApp broadcast.';
        setAlertError(errorMsg);
        setDispatchPopup({
          isOpen: true,
          isSuccess: false,
          title: 'Delivery Failed',
          message: errorMsg,
          category: serviceType,
          errorTip: errorMsg.includes('131049')
            ? 'Meta policy blocks promotional messages to numbers that have not opted in. Switch to the Utility tab to send updates/alerts.'
            : undefined,
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error executing WhatsApp broadcast.';
      setAlertError(errorMsg);
      setDispatchPopup({
        isOpen: true,
        isSuccess: false,
        title: 'Delivery Failed',
        message: errorMsg,
        category: serviceType,
      });
    } finally {
      setSending(false);
    }
  };

  // ── Image Handlers ──────────────────────────────────────────
  const loadImages = async () => {
    try {
      const res = await api.getMarketingImages();
      const imgs = res?.results || [];
      setMarketingImages(imgs);
      if (imgs.length === 1 && !selectedImageId) {
        setSelectedImageId(imgs[0].id);
      }
    } catch { /* ignore */ }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setImageUploadError('');
    try {
      const res = await api.uploadMarketingImage(file, file.name.replace(/\.[^.]+$/, ''));
      const newId = res?.image?.id || res?.id || null;
      await loadImages();
      if (newId) setSelectedImageId(newId);
      setAlertSuccess(`Image "${res?.image?.name || file.name}" uploaded as WebP successfully!`);
    } catch (err: any) {
      setImageUploadError(err.message || 'Upload failed. Check Cloudinary config.');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const confirmDeleteImage = async () => {
    if (!deleteTarget) return;
    setDeletingImage(true);
    try {
      await api.deleteMarketingImage(deleteTarget.id);
      if (selectedImageId === deleteTarget.id) setSelectedImageId(null);
      await loadImages();
      setAlertSuccess(`Image "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      setAlertError(err.message || 'Delete failed.');
    } finally {
      setDeletingImage(false);
    }
  };

  // Load images on mount
  useEffect(() => { loadImages(); }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white px-6 py-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-emerald-50 text-[#075E54] border border-emerald-200/70">
              <ShieldCheck className="w-3.5 h-3.5 text-[#075E54]" />
              <span>{user?.role === 'SUPERADMIN' ? 'Official Meta Gateway' : 'Broadcast Studio'}</span>
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              {user?.role === 'SUPERADMIN' ? '+91 99444 95366' : (user?.client_details?.name || 'My Organization')}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            {serviceType === 'UTILITY'
              ? 'Utility Notifications'
              : serviceType === 'SERVICE'
              ? 'Customer Service Studio'
              : 'Marketing Broadcasts'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {serviceType === 'UTILITY'
              ? 'Dispatch instant transactional alerts, invoices, order confirmations, and delivery updates (Meta rate: ~₹0.14/msg).'
              : serviceType === 'SERVICE'
              ? 'Handle 24-hour customer support replies and user-initiated inquiries (Meta rate: Free window / ~₹0.29/conv).'
              : 'Broadcast high-converting promotional offers, festival sales, and product announcements with posters and CTA buttons.'}
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-50 to-white border border-emerald-200/80 px-4 py-3 rounded-xl shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#075E54] text-white flex items-center justify-center shadow-xs">
            <Smartphone className="w-5 h-5 text-[#25D366]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#075E54]">
                {user?.role === 'SUPERADMIN' ? 'Gateway Online' : 'Wallet Balance'}
              </p>
            </div>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              {user?.role === 'SUPERADMIN' ? '+91 99444 95366' : `₹${parseFloat(walletBalance).toFixed(2)}`}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {serviceType === 'UTILITY' ? 'Update Title *' : serviceType === 'SERVICE' ? 'Reply Subject *' : 'Campaign Title *'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (serviceType === 'UTILITY') {
                      setCampaignTitle('Payment Confirmation - Order #BB-1042');
                      setHeaderText('');
                      setButtons([]);
                      setMessage('Order #BB-1042 (Rs. 2,499) - Paid via UPI. Invoice generated and shared to your registered email.');
                    } else if (serviceType === 'SERVICE') {
                      setCampaignTitle('Customer Support Reply');
                      setHeaderText('BitByte Support Team');
                      setMessage('Hello! Thank you for contacting BitByte Technologies. Our team is ready to assist you with Web App, Mobile App, E-Commerce & Digital Marketing solutions.');
                    } else {
                      setCampaignTitle('BitByte Digital Solutions Offer');
                      setHeaderText('Special Announcement');
                      setMessage('Scale Your Business with BitByte Technologies!\nCustom Web App, Mobile App, E-Commerce & Digital Marketing solutions.');
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#075E54] hover:text-[#064e46] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Fill {serviceType === 'UTILITY' ? 'Utility' : serviceType === 'SERVICE' ? 'Service' : 'Marketing'} Sample</span>
                </button>
              </div>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder={
                  serviceType === 'UTILITY'
                    ? 'e.g. Payment Receipt / Project Update'
                    : serviceType === 'SERVICE'
                    ? 'e.g. Customer Support Reply'
                    : 'e.g. Festive Offer Announcement'
                }
                className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
            </div>

            {serviceType === 'MARKETING' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Header Text (Optional)
                </label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="e.g. Special Festive Announcement"
                  className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Message Content *
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  serviceType === 'UTILITY'
                    ? 'Type your Utility update here (e.g. Payment confirmed, Invoice generated, Order dispatched — NO promotional offers)...'
                    : serviceType === 'SERVICE'
                    ? 'Type your customer care resolution here (Free tier — works within 24h of customer message)...'
                    : 'Type your WhatsApp marketing broadcast message here...'
                }
                className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] leading-relaxed text-slate-800"
              />
            </div>

            {/* Buttons Builder (ONLY for Marketing Broadcasts) */}
            {serviceType === 'MARKETING' && (
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
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Marketing Image Upload Section (ONLY for Marketing broadcasts) ── */}
          {serviceType === 'MARKETING' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-[#075E54]" />
                <span>
                  {serviceType === 'SERVICE'
                    ? '1b. Reply Image / Poster (Optional)'
                    : '1b. Marketing Image (Optional)'}
                </span>
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
                        className="p-1.5 bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: img.id, name: img.name, url: img.webp_url || img.cloudinary_url });
                        }}
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
          )}

          {/* Image Preview Modal */}
          {previewImageUrl && (
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6"
              onClick={() => setPreviewImageUrl(null)}
            >
              <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <img src={previewImageUrl} alt="Preview" className="w-full rounded-2xl shadow-2xl" />
                <button
                  type="button"
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-700 shadow hover:bg-slate-100"
                  onClick={() => setPreviewImageUrl(null)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Premium Delete Confirmation Modal */}
          {deleteTarget && (
            <div
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
              onClick={() => !deletingImage && setDeleteTarget(null)}
            >
              <div
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <button
                    type="button"
                    disabled={deletingImage}
                    onClick={() => setDeleteTarget(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">Delete Marketing Image?</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-slate-700">"{deleteTarget.name}"</span>? This will permanently remove it from Cloudinary.
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={deleteTarget.url} alt={deleteTarget.name} className="w-full h-32 object-cover" />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={deletingImage}
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deletingImage}
                    onClick={confirmDeleteImage}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {deletingImage ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Image</span>
                      </>
                    )}
                  </button>
                </div>
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
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#075E54] border border-emerald-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center space-x-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{connectingContacts ? 'Syncing...' : 'Sync Contacts'}</span>
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
                <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#075E54]" />
                  <span>{user?.role === 'SUPERADMIN' ? 'Specific Number(s)' : 'Single Test'}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {user?.role === 'SUPERADMIN' ? '1 or 10+ numbers / Excel' : 'Test on own phone'}
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

            {/* Single Test / Specific Numbers Input + Excel Upload */}
            {deliveryMode === 'TEST' && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    {user?.role === 'SUPERADMIN' ? 'Enter Numbers or Upload Excel *' : 'Enter Test WhatsApp Number *'}
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      {testPhoneNumber.split(/[\n,\s]+/).filter((n) => n.trim().replace(/[^0-9+]/g, '').length >= 10).length} Number(s) Ready
                    </span>
                  </div>
                </div>

                {/* Excel Upload Bar */}
                {user?.role === 'SUPERADMIN' && (
                  <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-emerald-200/80">
                    <button
                      type="button"
                      onClick={() => excelInputRef.current?.click()}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#075E54] hover:bg-[#064e46] text-white text-xs font-bold transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Upload Excel / CSV (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSampleExcel}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Sample Excel</span>
                    </button>
                    <input
                      ref={excelInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleExcelUpload}
                    />
                    {excelSummary && (
                      <span className="text-[11px] font-bold text-emerald-700">{excelSummary}</span>
                    )}
                  </div>
                )}

                <textarea
                  rows={2}
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="Enter 1 number, 10 numbers (comma/line separated), or click Upload Excel above..."
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] bg-white text-slate-900"
                />
                <p className="text-[11px] text-emerald-800">
                  {user?.role === 'SUPERADMIN'
                    ? 'Tip: Upload an Excel sheet (.xlsx / .csv) to automatically parse customer numbers and broadcast in one click.'
                    : 'Test this broadcast on your personal mobile before sending to your entire audience.'}
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
                      ? (() => {
                          const count = testPhoneNumber.split(/[\n,\s]+/).filter((n) => n.trim().replace(/[^0-9+]/g, '').length >= 10).length;
                          const label = serviceType === 'UTILITY' ? 'Utility Update' : serviceType === 'SERVICE' ? 'Service Reply' : 'Marketing Message';
                          if (count > 1) return `Send ${label} to ${count} Numbers`;
                          return user?.role === 'SUPERADMIN'
                            ? `Send ${label} to +91 ${testPhoneNumber || '...'}`
                            : `Send Test Message to +91 ${testPhoneNumber || 'Phone'}`;
                        })()
                      : deliveryMode === 'CUSTOM_COUNT'
                      ? `Send ${serviceType === 'UTILITY' ? 'Utility Update' : serviceType === 'SERVICE' ? 'Service Reply' : 'Marketing Offer'} to ${Math.min(customSendCount, contacts.length || customSendCount)} Contacts`
                      : `Send ${serviceType === 'UTILITY' ? 'Utility Update' : serviceType === 'SERVICE' ? 'Service Reply' : 'Marketing Offer'} to ALL ${contacts.length} Contacts`}
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
                      {user?.role === 'SUPERADMIN' ? 'BitByte Official (+91 99444 95366)' : (user?.client_details?.name || 'Business Account')}
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
                {(() => {
                  const previewImg = marketingImages.find((img: any) => img.id === selectedImageId);
                  return (
                    <div className="bg-white rounded-2xl rounded-tl-xs p-2.5 shadow-sm max-w-[92%] border border-slate-200/60 space-y-2">
                      {previewImg && (
                        <img
                          src={previewImg.webp_url || previewImg.cloudinary_url}
                          alt={previewImg.name}
                          className="w-full h-36 object-cover rounded-xl"
                        />
                      )}
                      <div className="px-1 space-y-1.5">
                        {headerText && (
                          <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1">
                            {headerText}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {message || 'Your broadcast message preview will appear here...'}
                        </div>

                        <div className="flex items-center justify-end space-x-1 text-[9px] text-slate-400 pt-0.5">
                          <span>12:00 PM</span>
                          <CheckCheck className="w-3 h-3 text-sky-500" />
                        </div>
                      </div>
                    </div>
                  );
                })()}

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

      {/* Recent Broadcast History (Last 5) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-extrabold text-slate-900">Recent Broadcast History</h3>
            <span className="text-[11px] text-slate-400 font-semibold">(Latest 5)</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 font-semibold">{campaigns.length} Total</span>
            {onNavigate && campaigns.length > 5 && (
              <button
                type="button"
                onClick={() => onNavigate('message-history')}
                className="text-xs font-bold text-[#075E54] hover:underline"
              >
                View All History →
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
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
                {campaigns.slice(0, 5).map((camp) => (
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

      {/* Dispatch Result Popup Modal (Success or Meta Error) */}
      <Modal
        isOpen={!!dispatchPopup}
        onClose={() => setDispatchPopup(null)}
        title={dispatchPopup?.title || 'Dispatch Status'}
      >
        <div className="text-center py-4 space-y-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              dispatchPopup?.isSuccess
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-rose-100 text-rose-600'
            }`}
          >
            {dispatchPopup?.isSuccess ? (
              <CheckCircle className="w-9 h-9" />
            ) : (
              <XCircle className="w-9 h-9" />
            )}
          </div>
          <div className="space-y-2">
            <p
              className={`text-base font-extrabold ${
                dispatchPopup?.isSuccess ? 'text-slate-900' : 'text-rose-900'
              }`}
            >
              {dispatchPopup?.title}
            </p>
            <p className="text-sm font-medium text-slate-700 leading-relaxed max-w-sm mx-auto">
              {dispatchPopup?.message}
            </p>
            {dispatchPopup?.errorTip && (
              <p className="text-xs font-medium text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-left">
                💡 {dispatchPopup.errorTip}
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              Dispatched via Meta WhatsApp Cloud API ({dispatchPopup?.category})
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDispatchPopup(null)}
            className={`w-full py-2.5 font-bold text-sm rounded-xl transition-colors text-white ${
              dispatchPopup?.isSuccess
                ? 'bg-[#075E54] hover:bg-[#064E3B]'
                : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            {dispatchPopup?.isSuccess ? 'OK, Got It' : 'Close'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
