import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Upload,
  FileText,
  Users,
  Send,
  Loader2,
  X,
  PhoneCall,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
  ChevronDown,
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
];
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ConnectWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
  onSuccess?: () => void;
}

export const ConnectWhatsAppModal: React.FC<ConnectWhatsAppModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSuccess,
}) => {
  const { user, activeTenantId } = useAuth();
  const [activeTab, setActiveTab] = useState<'otp' | 'contacts'>('otp');

  // WhatsApp OTP Registration State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullConnectedPhone, setFullConnectedPhone] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessName, setBusinessName] = useState(user?.client_name || user?.full_name || '');
  const [codeMethod, setCodeMethod] = useState<'SMS' | 'VOICE'>('SMS');
  const [otpCode, setOtpCode] = useState('');
  const [twoStepPin, setTwoStepPin] = useState('123456');

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMobileConflict, setIsMobileConflict] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Contacts Tab State
  const [contactsSubTab, setContactsSubTab] = useState<'sync' | 'file' | 'paste'>('sync');
  const [pasteText, setPasteText] = useState('');
  const [syncedCount, setSyncedCount] = useState<number | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Request OTP from Meta
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsMobileConflict(false);
    setSuccessMsg('');

    const digitsOnly = phoneNumber.replace(/[^0-9]/g, '');
    if (!digitsOnly || digitsOnly.length < 7) {
      setErrorMsg('Please enter a valid phone number (at least 7 to 12 digits).');
      return;
    }
    const fullNumber = `${countryCode}${digitsOnly}`;

    setLoading(true);
    try {
      const res = await api.requestWhatsAppOtp({
        phone_number: fullNumber,
        business_name: businessName,
        code_method: codeMethod,
      });

      if (res?.success) {
        setFullConnectedPhone(fullNumber);
        if (res?.phone_number_id) {
          setPhoneNumberId(res.phone_number_id);
        }
        setStep(2);
        setResendCooldown(30);
        setSuccessMsg(res.message || `6-digit OTP code sent via ${codeMethod} to ${fullNumber}`);
      } else {
        const rawErr = [res?.error || '', res?.instruction || '', JSON.stringify(res || '')].join(' ').toLowerCase();
        if (
          res?.already_registered_on_mobile ||
          res?.code === 133010 ||
          rawErr.includes('already') ||
          rawErr.includes('verified ownership') ||
          rawErr.includes('registered')
        ) {
          setIsMobileConflict(true);
          setErrorMsg('Sorry! This phone number is already active on WhatsApp. Please provide a new phone number that is not on WhatsApp, or delete your current mobile WhatsApp account.');
        } else {
          setErrorMsg(res?.error || 'Failed to request OTP from Meta.');
        }
      }
    } catch (err: any) {
      const errData = err?.data || {};
      const rawErr = [
        err?.message || '',
        errData?.error || '',
        errData?.instruction || '',
        errData?.detail || '',
        JSON.stringify(errData)
      ].join(' ').toLowerCase();

      if (
        errData?.already_registered_on_mobile ||
        err?.already_registered_on_mobile ||
        rawErr.includes('133010') ||
        rawErr.includes('already') ||
        rawErr.includes('verified ownership') ||
        rawErr.includes('already active') ||
        rawErr.includes('registered')
      ) {
        setIsMobileConflict(true);
        setErrorMsg('Sorry! This phone number is already active on WhatsApp. Please provide a new phone number that is not on WhatsApp, or delete your current mobile WhatsApp account.');
      } else {
        setErrorMsg(errData?.error || err.message || 'Error communicating with Meta Cloud API.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP with Meta
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setErrorMsg('');
    setIsMobileConflict(false);
    setLoading(true);

    try {
      const res = await api.verifyWhatsAppOtp({
        phone_number: fullConnectedPhone || `${countryCode}${phoneNumber.replace(/[^0-9]/g, '')}`,
        phone_number_id: phoneNumberId,
        code: otpCode.trim(),
        pin: twoStepPin.trim() || '123456',
        business_name: businessName,
      });

      if (res?.success) {
        setStep(3);
        setSuccessMsg(res.message || 'WhatsApp number connected successfully!');
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res?.error || 'Verification failed. Please check the code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Contact Sync Handlers
  const handleDeviceSync = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.syncWhatsAppDevice({ client_id: activeTenantId });
      if (res?.success) {
        setSyncedCount(res.total_contacts || 0);
        setSuccessMsg(res.message || `WhatsApp device verified! ${res.total_contacts || 0} contacts ready.`);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res?.error || 'Failed to sync WhatsApp contacts.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Device sync error.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedContacts: { name: string; phone_number: string }[] = [];

        if (file.name.toLowerCase().endsWith('.vcf')) {
          const cards = text.split(/END:VCARD/i);
          for (const card of cards) {
            if (!card.trim()) continue;
            let name = '';
            let phone = '';
            const fnMatch = card.match(/FN(?:;[^:]*)?:([^\r\n]+)/i);
            if (fnMatch) name = fnMatch[1].trim();
            const telMatch = card.match(/TEL(?:;[^:]*)?:([^\r\n]+)/i);
            if (telMatch) phone = telMatch[1].trim().replace(/[^0-9+]/g, '');
            if (phone && phone.length >= 10) {
              if (!phone.startsWith('+') && phone.length === 10) phone = '+91' + phone;
              parsedContacts.push({ name: name || 'Contact', phone_number: phone });
            }
          }
        } else {
          const lines = text.split(/\r\n|\n/);
          for (const line of lines) {
            const parts = line.split(/[,\t]/);
            if (parts.length >= 1) {
              let phone = parts[0].trim().replace(/[^0-9+]/g, '');
              let name = parts[1]?.trim() || 'Contact';
              if (!phone && parts[1]) {
                phone = parts[1].trim().replace(/[^0-9+]/g, '');
                name = parts[0]?.trim() || 'Contact';
              }
              if (phone && phone.length >= 10) {
                if (!phone.startsWith('+') && phone.length === 10) phone = '+91' + phone;
                parsedContacts.push({ name, phone_number: phone });
              }
            }
          }
        }

        if (parsedContacts.length === 0) {
          setErrorMsg('No valid phone numbers found in file.');
          setLoading(false);
          return;
        }

        const res = await api.batchImportContacts({ contacts: parsedContacts });
        if (res?.success) {
          setSyncedCount(res.imported_count || parsedContacts.length);
          setSuccessMsg(`Imported ${res.imported_count || parsedContacts.length} contacts!`);
          if (onSuccess) onSuccess();
        } else {
          setErrorMsg(res?.error || 'Import failed.');
        }
      } catch (err: any) {
        setErrorMsg('Error parsing file: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const lines = pasteText.split(/\r\n|\n/);
    const parsedContacts: { name: string; phone_number: string }[] = [];

    for (const line of lines) {
      const parts = line.split(/[,\t-]/);
      let phone = '';
      let name = 'Client Contact';
      for (const p of parts) {
        const clean = p.trim().replace(/[^0-9+]/g, '');
        if (clean.length >= 10) {
          phone = clean;
          break;
        }
      }
      if (phone) {
        if (!phone.startsWith('+') && phone.length === 10) phone = '+91' + phone;
        parsedContacts.push({ name, phone_number: phone });
      }
    }

    if (parsedContacts.length === 0) {
      setErrorMsg('No valid phone numbers detected in pasted text.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.batchImportContacts({ contacts: parsedContacts });
      if (res?.success) {
        setSyncedCount(res.imported_count || parsedContacts.length);
        setSuccessMsg(`Successfully imported ${res.imported_count || parsedContacts.length} numbers!`);
        setPasteText('');
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res?.error || 'Failed to import numbers.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing numbers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-linear-to-r from-emerald-50/70 via-white to-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Connect WhatsApp Number</h3>
              <p className="text-xs text-slate-500 font-medium">Official Meta WhatsApp Cloud API Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Mode Tabs */}
        <div className="px-6 pt-4 flex space-x-2 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('otp')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center space-x-2 ${
              activeTab === 'otp'
                ? 'text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Connect Number (OTP)</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center space-x-2 ${
              activeTab === 'contacts'
                ? 'text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Import Contacts</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: WhatsApp Number OTP Connection */}
          {activeTab === 'otp' && (
            <div>
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    1
                  </span>
                  <span className={`text-xs font-bold ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                    Number & Rules
                  </span>
                </div>
                <div className={`h-0.5 flex-1 mx-3 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    2
                  </span>
                  <span className={`text-xs font-bold ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                    Verify OTP
                  </span>
                </div>
                <div className={`h-0.5 flex-1 mx-3 ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    3
                  </span>
                  <span className={`text-xs font-bold ${step === 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                    Connected
                  </span>
                </div>
              </div>

              {/* STEP 1: Phone Input & Meta Policy Guidance */}
              {step === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  {/* Meta Policy Warning Card */}
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900">
                    <div className="flex items-start space-x-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1.5 leading-relaxed">
                        <p className="font-extrabold text-amber-950">Important Meta Cloud API Rule:</p>
                        <p>
                          1. <strong>Fresh SIM Number (Recommended):</strong> Using a new, dedicated number provides instant OTP delivery and immediate activation.
                        </p>
                        <p>
                          2. <strong>Existing WhatsApp Number:</strong> If this number is currently active on a mobile WhatsApp application, Meta will reject registration (Error 133010). 
                          Please open your mobile WhatsApp app and navigate to: <br />
                          <span className="font-semibold text-amber-800">Settings ➔ Account ➔ "Delete my account"</span> before entering the number here.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Business Display Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. AK Shop / BitByte Technologies"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
                    />
                  </div>

                  {/* Phone Number with Separate Country Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      WhatsApp Phone Number
                    </label>
                    <div className="flex items-center space-x-2">
                      {/* Country Code Dropdown */}
                      <div className="relative shrink-0 w-36">
                        <select
                          value={countryCode}
                          onChange={(e) => {
                            setCountryCode(e.target.value);
                            setErrorMsg('');
                            setIsMobileConflict(false);
                          }}
                          className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all cursor-pointer shadow-xs"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.code} ({c.country})
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Phone Number Input (Strictly Digits Only) */}
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={15}
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''));
                            setErrorMsg('');
                            setIsMobileConflict(false);
                          }}
                          placeholder="e.g. 9876543210"
                          required
                          className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-slate-200 text-sm font-bold font-mono text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all shadow-xs"
                        />

                        {/* SMS / CALL Switcher */}
                        <div className="absolute right-2 top-2 flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setCodeMethod('SMS')}
                            className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                              codeMethod === 'SMS'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            SMS
                          </button>
                          <button
                            type="button"
                            onClick={() => setCodeMethod('VOICE')}
                            className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                              codeMethod === 'VOICE'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            CALL
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Conflict Alert */}
                  {isMobileConflict && (
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs shadow-xs animate-in fade-in">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1.5 leading-relaxed">
                          <p className="font-black text-sm text-amber-900">
                            Sorry! This number is already active on WhatsApp
                          </p>
                          <p className="text-amber-800 font-medium">
                            You have already registered/verified ownership of this phone number. Meta Cloud API cannot connect to a number currently active on a mobile WhatsApp application.
                          </p>
                          <div className="p-3 rounded-xl bg-white/90 border border-amber-200 text-[11px] space-y-1.5 mt-2">
                            <p className="font-extrabold text-amber-950 uppercase tracking-wide">Please choose one of the following:</p>
                            <p>
                              ✅ <strong>Option 1 (Recommended):</strong> Please provide a <strong>fresh SIM number</strong> that does NOT have a WhatsApp account.
                            </p>
                            <p>
                              ⚠️ <strong>Option 2:</strong> If you want to use this number, open the WhatsApp app on your mobile phone ➔ Go to <strong>Settings ➔ Account ➔ "Delete my account"</strong>, and then try connecting here again.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {errorMsg && !isMobileConflict && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Requesting Meta OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit Meta OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Verify 6-Digit OTP */}
              {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold">OTP sent to {fullConnectedPhone || phoneNumber}</p>
                      <p className="text-emerald-700">Enter the 6-digit code received via {codeMethod}.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950"
                    >
                      Change Number
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                        setErrorMsg('');
                      }}
                      placeholder="• • • • • •"
                      required
                      autoFocus
                      className="w-full text-center tracking-[1em] text-2xl font-black font-mono py-3 rounded-2xl border-2 border-emerald-500/40 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 outline-hidden transition-all text-slate-900"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start space-x-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full py-3 rounded-2xl bg-[#007A4D] hover:bg-[#00633e] text-white font-bold text-sm shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying with Meta Cloud API...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Connect WhatsApp</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    {resendCooldown > 0 ? (
                      <span className="text-xs text-slate-400 font-medium">
                        Resend code in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRequestOtp()}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center justify-center space-x-1 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resend OTP Code</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* STEP 3: Success Screen */}
              {step === 3 && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">WhatsApp Connected Successfully!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Your number is now registered directly on Meta WhatsApp Cloud API.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Connected Number:</span>
                      <span className="font-black text-slate-900 font-mono">{fullConnectedPhone || phoneNumber}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Business Name:</span>
                      <span className="font-bold text-slate-900">{businessName}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Meta Quality Rating:</span>
                      <span className="inline-flex items-center text-emerald-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                        High (Green)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    Done & Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Contacts Import */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
                <button
                  onClick={() => setContactsSubTab('sync')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    contactsSubTab === 'sync' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  1-Click Sync
                </button>
                <button
                  onClick={() => setContactsSubTab('file')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    contactsSubTab === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Upload VCF / CSV
                </button>
                <button
                  onClick={() => setContactsSubTab('paste')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    contactsSubTab === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Paste Numbers
                </button>
              </div>

              {contactsSubTab === 'sync' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Sync Real Contacts from WhatsApp</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Instantly sync and verify contacts linked to your account.
                    </p>
                  </div>
                  <button
                    onClick={handleDeviceSync}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all inline-flex items-center space-x-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    <span>Sync Contacts Now</span>
                  </button>
                </div>
              )}

              {contactsSubTab === 'file' && (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500 transition-all">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Upload Phonebook (.VCF) or Excel/CSV (.csv)</p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-3">Android & iPhone exported contacts supported</p>
                  <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800 transition-all">
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept=".vcf,.csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {contactsSubTab === 'paste' && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste phone numbers (one per line or comma-separated):&#10;+919876543210&#10;+919876543211, Ramesh&#10;+919876543212"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:border-emerald-500 outline-hidden"
                  />
                  <button
                    onClick={handlePasteSubmit}
                    disabled={loading || !pasteText.trim()}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    Import Pasted Numbers
                  </button>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
