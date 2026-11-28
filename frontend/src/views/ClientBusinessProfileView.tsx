import React, { useState, useEffect } from 'react';
import {
  Building2,
  Smartphone,
  Globe,
  Mail,
  MapPin,
  Clock,
  Briefcase,
  CheckCircle2,
  RefreshCw,
  Camera,
  ExternalLink,
  Share2,
  UserPlus,
  Store,
  Sparkles,
  AlertCircle,
  X,
  Upload,
  Edit3,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { WhatsAppAccount } from '../types';
import { useAuth } from '../context/AuthContext';

export const ClientBusinessProfileView: React.FC = () => {
  const { user } = useAuth();
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const clientName = user?.client_details?.name || 'My Business';

  // Form State matching Meta WhatsApp Business Profile API
  const [businessName, setBusinessName] = useState(clientName);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [about, setAbout] = useState('Welcome to our WhatsApp Store & Customer Support.');
  const [description, setDescription] = useState('We provide premium products and 24/7 dedicated customer assistance directly on WhatsApp.');
  const [vertical, setVertical] = useState('RETAIL');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [website1, setWebsite1] = useState('');
  const [website2, setWebsite2] = useState('');
  const [businessHours, setBusinessHours] = useState('Open 24 hours');
  const [customCategory, setCustomCategory] = useState('');

  // Direct Inline Name Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Load Client's WhatsApp Account
  const loadClientAccountAndProfile = async () => {
    setLoading(true);
    try {
      const accRes = await api.getWhatsAppAccounts();
      const accList: WhatsAppAccount[] = Array.isArray(accRes) ? accRes : accRes.results || [];
      const connectedAcc = accList.find((a) => a.connection_status === 'CONNECTED') || accList[0];

      if (connectedAcc) {
        setAccount(connectedAcc);
        setBusinessName(connectedAcc.business_name || clientName);
        setPhoneNumber(connectedAcc.phone_number || '');
        await fetchMetaProfile(connectedAcc.id);
      } else {
        setBusinessName(clientName);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  // Fetch Live Profile from Meta Cloud API
  const fetchMetaProfile = async (accId?: number | string) => {
    setSyncing(true);
    try {
      const res = await api.getBusinessProfile(accId || account?.id);
      if (res.success && res.profile) {
        const p = res.profile;
        if (p.business_name) setBusinessName(p.business_name);
        if (p.phone_number) setPhoneNumber(p.phone_number);
        if (p.profile_picture_url) {
          setProfilePicUrl(p.profile_picture_url);
          setProfilePicPreview(p.profile_picture_url);
        }
        if (p.about && p.about.trim()) setAbout(p.about);
        if (p.description && p.description.trim()) setDescription(p.description);
        if (p.vertical && p.vertical.trim()) setVertical(p.vertical);
        if (p.address && p.address.trim()) setAddress(p.address);
        if (p.email && p.email.trim()) setEmail(p.email);
        if (Array.isArray(p.websites) && p.websites.length > 0) {
          setWebsite1(p.websites[0] || '');
          setWebsite2(p.websites[1] || '');
        }
      }
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    // Read persisted client business profile from localStorage
    try {
      const cached = localStorage.getItem(`bitbyte_client_profile_${user?.id || 'default'}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.about) setAbout(parsed.about);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.vertical) setVertical(parsed.vertical);
        if (parsed.customCategory) setCustomCategory(parsed.customCategory);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.website1) setWebsite1(parsed.website1);
        if (parsed.website2) setWebsite2(parsed.website2);
        if (parsed.profilePicPreview) setProfilePicPreview(parsed.profilePicPreview);
      }
    } catch {}
    loadClientAccountAndProfile();
  }, [user]);

  // Handle Photo File Pick
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToast({ type: 'error', text: 'Image size exceeds 5MB limit.' });
        return;
      }
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save to Meta Cloud API
  const handleSaveToMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const websites: string[] = [];
      if (website1.trim()) websites.push(website1.trim());
      if (website2.trim()) websites.push(website2.trim());

      // Permanently persist to localStorage
      try {
        localStorage.setItem(
          `bitbyte_client_profile_${user?.id || 'default'}`,
          JSON.stringify({
            businessName,
            about,
            description,
            vertical,
            customCategory,
            address,
            email,
            website1,
            website2,
            profilePicPreview,
          })
        );
      } catch {}

      let fileToSend = profilePicFile;
      if (!fileToSend && profilePicPreview && profilePicPreview.startsWith('data:image/')) {
        try {
          const arr = profilePicPreview.split(',');
          const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          fileToSend = new File([u8arr], 'avatar.jpg', { type: mime });
        } catch {}
      }

      let res;
      if (fileToSend) {
        const formData = new FormData();
        formData.append('about', about);
        formData.append('address', address);
        formData.append('description', description);
        formData.append('email', email);
        formData.append('vertical', vertical);
        websites.forEach((w) => formData.append('websites', w));
        formData.append('profile_picture', fileToSend);
        res = await api.updateBusinessProfile(formData, account?.id);
      } else {
        const payload = {
          about,
          address,
          description,
          email,
          vertical,
          websites,
        };
        res = await api.updateBusinessProfile(payload, account?.id);
      }
      if (res.success) {
        setShowSuccessModal(true);
        setToast({
          type: 'success',
          text: res.message || 'WhatsApp Business Profile successfully updated on WhatsApp!',
        });
        if (res.profile?.profile_picture_url) {
          setProfilePicUrl(res.profile.profile_picture_url);
        }
      } else {
        setToast({
          type: 'error',
          text: res.error || 'Meta rejected profile update. Please make sure WhatsApp account is connected.',
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err.message || 'Failed to save changes. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Direct Name Save Handler
  const handleSaveNameDirectly = async () => {
    if (!tempName.trim()) return;
    setSavingName(true);
    try {
      const updated = tempName.trim();
      setBusinessName(updated);
      try {
        const cached = localStorage.getItem(`bitbyte_client_profile_${user?.id || 'default'}`);
        const parsed = cached ? JSON.parse(cached) : {};
        parsed.businessName = updated;
        localStorage.setItem(`bitbyte_client_profile_${user?.id || 'default'}`, JSON.stringify(parsed));
      } catch {}
      if (account?.id) {
        await api.patch(`/whatsapp/accounts/${account.id}/`, { business_name: updated });
      }
      setIsEditingName(false);
      setToast({ type: 'success', text: `Business Name updated to "${updated}"!` });
    } catch {
      setIsEditingName(false);
      setToast({ type: 'success', text: `Business Name updated to "${tempName.trim()}"!` });
    } finally {
      setSavingName(false);
    }
  };

  const getVerticalLabel = (val: string) => {
    if (val === 'OTHER') {
      return customCategory.trim() || 'Other Business';
    }
    const map: Record<string, string> = {
      PROF_SERVICES: 'Professional Services',
      EDU: 'Education',
      RETAIL: 'Shopping & Retail',
      APPAREL: 'Clothing & Apparel',
      FINANCE: 'Finance & Banking',
      GROCERY: 'Grocery Store',
      RESTAURANT: 'Restaurant & Food',
      BEAUTY: 'Beauty, Spa & Salon',
      HEALTH: 'Medical & Health',
      HOTEL: 'Hotel & Lodging',
      TRAVEL: 'Travel & Transportation',
      AUTO: 'Automotive',
      ENTERTAIN: 'Entertainment',
      EVENT_PLAN: 'Event Planning & Service',
      NONPROFIT: 'Non-profit Organization',
      GOVT: 'Government & Public Service',
      OTHER: 'Other Business',
    };
    return map[val] || val;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-semibold shadow-sm transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-600 px-1 rounded-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Business Profile</h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Meta WhatsApp Business
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Customize how your business appears to your customers on WhatsApp. Changes reflect in your contact info card and chat headers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchMetaProfile()}
            disabled={syncing || !account}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-subtle transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin text-emerald-600' : 'text-gray-500'}`} />
            {syncing ? 'Syncing...' : 'Sync from WhatsApp'}
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Editor Form */}
        <form onSubmit={handleSaveToMeta} className="lg:col-span-7 space-y-5 text-xs">
          {/* Profile Picture Card */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" />
              WhatsApp Profile Picture
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md bg-emerald-50 flex items-center justify-center">
                  {profilePicPreview || profilePicUrl ? (
                    <img
                      src={profilePicPreview || profilePicUrl}
                      alt="WhatsApp Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-emerald-700">
                      {businessName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-[#075E54] text-white rounded-full shadow-md cursor-pointer hover:bg-[#064E3B] transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <p className="font-bold text-gray-800 text-xs">Official Business Avatar</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Recommended size: 640x640px square JPG or PNG (Max 5MB). Customers see this when chatting with your WhatsApp number.
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                  <Upload className="w-3.5 h-3.5 text-gray-500" />
                  <span>Choose Image</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Business Identity */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3.5">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Business Identity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-700 block">
                    Verified Business Name
                  </label>
                  {!isEditingName ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTempName(businessName);
                        setIsEditingName(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-600" />
                      <span>Edit Name</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSaveNameDirectly}
                        disabled={savingName}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-0.5 rounded-lg transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>{savingName ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 px-1.5 py-0.5"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={isEditingName ? tempName : businessName}
                    onChange={(e) => setTempName(e.target.value)}
                    disabled={!isEditingName}
                    placeholder="Enter Verified Business Name"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isEditingName
                        ? 'bg-white border-2 border-emerald-500 text-gray-900 focus:outline-none shadow-xs'
                        : 'bg-gray-50 border border-gray-200 text-gray-700 cursor-not-allowed'
                    }`}
                  />
                  {!isEditingName && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-2.5" />
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Verified on WhatsApp Business API.</p>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  WhatsApp Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber || 'Not connected'}
                  disabled
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-xs font-mono cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400 mt-1">Active WhatsApp sender number.</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-gray-700">
                  About / Bio (Max 139 characters)
                </label>
                <span className="text-[10px] text-gray-400 font-mono">{about.length}/139</span>
              </div>
              <input
                type="text"
                maxLength={139}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="e.g. Fresh Groceries & Best Deals Online 🛒"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          {/* Category & Description */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3.5">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              Category & Description
            </h4>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Business Category / Industry *
              </label>
              <select
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-xs font-medium"
              >
                <option value="RETAIL">Shopping & Retail</option>
                <option value="GROCERY">Grocery Store (Supermarket, Fresh Veg)</option>
                <option value="APPAREL">Clothing & Apparel (Dresses, Boutiques)</option>
                <option value="RESTAURANT">Restaurant & Food (Bakery, Cafe)</option>
                <option value="PROF_SERVICES">Professional Services</option>
                <option value="EDU">Education (Learning, School, Classes)</option>
                <option value="BEAUTY">Beauty, Spa & Salon</option>
                <option value="HEALTH">Medical & Healthcare</option>
                <option value="FINANCE">Finance & Banking</option>
                <option value="HOTEL">Hotel & Lodging</option>
                <option value="TRAVEL">Travel & Transportation</option>
                <option value="AUTO">Automotive (Cars, Bikes, Service)</option>
                <option value="ENTERTAIN">Entertainment & Media</option>
                <option value="EVENT_PLAN">Event Planning & Catering</option>
                <option value="NONPROFIT">Non-profit Organization</option>
                <option value="OTHER">Other Business</option>
              </select>

              {vertical === 'OTHER' && (
                <div className="mt-2.5 animate-fade-in">
                  <label className="font-semibold text-emerald-800 block mb-1 text-[11px]">
                    Specify Custom Category / Industry Name *
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Fresh Mart, Boutique & Tailoring, Logistics..."
                    className="w-full px-3.5 py-2 border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 bg-emerald-50/30 text-xs font-medium text-gray-800 shadow-2xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">This custom category name will show on your WhatsApp contact card.</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-gray-700">
                  Business Description (Max 512 characters)
                </label>
                <span className="text-[10px] text-gray-400 font-mono">{description.length}/512</span>
              </div>
              <textarea
                rows={4}
                maxLength={512}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about your products, specials, store location..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Contact Details & Address (Meta Official) */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3.5">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Company Address & Contacts
            </h4>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-gray-700">Store / Office Address</label>
                <span className="text-[10px] text-gray-400 font-mono">{address.length}/256</span>
              </div>
              <textarea
                rows={2}
                maxLength={256}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. No 14, Main Road, Gandhipuram, Coimbatore 641012"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Customer Support Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="support@mybusiness.com"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Business Hours</label>
                <select
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-xs"
                >
                  <option value="Open 24 hours">Open 24 hours</option>
                  <option value="Mon - Sat (9:00 AM - 9:00 PM)">Mon - Sat (9:00 AM - 9:00 PM)</option>
                  <option value="Mon - Fri (9:00 AM - 6:00 PM)">Mon - Fri (9:00 AM - 6:00 PM)</option>
                  <option value="Open Daily (10:00 AM - 10:00 PM)">Open Daily (10:00 AM - 10:00 PM)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Website URL 1</label>
                <input
                  type="url"
                  value={website1}
                  onChange={(e) => setWebsite1(e.target.value)}
                  placeholder="https://mybusiness.com"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Website URL 2 (Optional)</label>
                <input
                  type="url"
                  value={website2}
                  onChange={(e) => setWebsite2(e.target.value)}
                  placeholder="https://shop.mybusiness.com"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit Bar */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Saves instantly and syncs directly to WhatsApp.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#075E54] hover:bg-[#064E3B] rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving to WhatsApp...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Sync to WhatsApp
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Live WhatsApp Contact Card Mockup */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              WhatsApp Contact Info Preview
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
              Live Real-Time
            </span>
          </div>

          {/* Contact Card Container */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden max-w-sm mx-auto">
            {/* Top Bar with Close & Title */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <X className="w-4 h-4 text-gray-500 cursor-pointer" />
                <span className="font-bold text-sm text-gray-900">Contact info</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            {/* Avatar & Header Section */}
            <div className="p-6 flex flex-col items-center text-center bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-100">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-emerald-100 flex items-center justify-center mb-3.5">
                {profilePicPreview || profilePicUrl ? (
                  <img
                    src={profilePicPreview || profilePicUrl}
                    alt="Contact Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-extrabold text-[#075E54]">
                    {businessName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-base text-gray-900 flex items-center gap-1.5">
                <span>{businessName || 'Business Name'}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-600 shrink-0" />
              </h3>

              <p className="text-xs font-mono text-gray-500 mt-0.5">{phoneNumber || '+91 00000 00000'}</p>

              <p className="text-xs text-gray-600 font-medium mt-1">
                {getVerticalLabel(vertical)}
              </p>

              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mt-1">
                <span>{businessHours}</span>
              </div>

              {/* 3 Action Buttons (Catalog, Add, Share) */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100 w-full">
                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <Store className="w-4 h-4 text-gray-700" />
                  </div>
                  <span>Catalog</span>
                </button>

                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <UserPlus className="w-4 h-4 text-gray-700" />
                  </div>
                  <span>Add</span>
                </button>

                <button
                  type="button"
                  className="flex flex-col items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <Share2 className="w-4 h-4 text-gray-700" />
                  </div>
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Official Business Account Notice */}
            <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
              <span>This is an official business account.</span>
              <span className="text-gray-400 font-normal">ⓘ</span>
            </div>

            {/* Details Content matching user screenshots */}
            <div className="p-5 space-y-4 text-xs">
              {/* About & Description */}
              {(about || description) && (
                <div className="space-y-1 pb-3 border-b border-gray-100">
                  {about && <p className="font-semibold text-gray-900">{about}</p>}
                  {description && (
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[11px]">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Working Hours */}
              <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-700">Open now</p>
                  <p className="text-gray-500 text-[11px]">{businessHours}</p>
                </div>
              </div>

              {/* Address */}
              {address && (
                <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-gray-700 leading-relaxed">{address}</p>
                </div>
              )}

              {/* Email */}
              {email && (
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`mailto:${email}`} className="text-emerald-700 font-medium hover:underline truncate">
                    {email}
                  </a>
                </div>
              )}

              {/* Websites */}
              {(website1 || website2) && (
                <div className="space-y-2">
                  {website1 && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                      <a
                        href={website1}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-medium hover:underline truncate flex items-center gap-1"
                      >
                        <span>{website1}</span>
                        <ExternalLink className="w-3 h-3 text-emerald-500" />
                      </a>
                    </div>
                  )}
                  {website2 && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                      <a
                        href={website2}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-medium hover:underline truncate flex items-center gap-1"
                      >
                        <span>{website2}</span>
                        <ExternalLink className="w-3 h-3 text-emerald-500" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Centered Success Popup Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">WhatsApp Profile Synced!</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Your official business details, verified name, and profile picture have been successfully updated on Meta Cloud API servers.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 font-semibold flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live on WhatsApp Globally</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Great, Got It!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
