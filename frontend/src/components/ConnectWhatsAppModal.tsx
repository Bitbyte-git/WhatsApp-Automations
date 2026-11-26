import React, { useState } from 'react';
import {
  Smartphone,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Send,
  Loader2,
  X,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ConnectWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSuccess?: () => void;
}

export const ConnectWhatsAppModal: React.FC<ConnectWhatsAppModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSuccess,
}) => {
  const { user, activeTenantId } = useAuth();
  const [activeTab, setActiveTab] = useState<'sync' | 'file' | 'paste'>('sync');

  // Sync state
  const [loading, setLoading] = useState(false);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Paste state
  const [pasteText, setPasteText] = useState('');

  if (!isOpen) return null;

  // 1-Click Device Sync
  const handleDeviceSync = async () => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.syncWhatsAppDevice({ client_id: activeTenantId });
      if (res?.success) {
        setSyncedCount(res.total_contacts || 0);
        setSuccessMsg(
          res.message ||
            `WhatsApp device verified! ${res.total_contacts || 0} real contacts ready.`
        );
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res?.error || 'Failed to connect WhatsApp device.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // VCF / CSV File parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedContacts: { name: string; phone_number: string }[] = [];

        if (file.name.toLowerCase().endsWith('.vcf')) {
          // Parse vCard format (Standard Android/iPhone phonebook export)
          const cards = text.split(/END:VCARD/i);
          for (const card of cards) {
            if (!card.trim()) continue;
            let name = '';
            let phone = '';
            const fnMatch = card.match(/FN(?:;[^:]*)?:([^\r\n]+)/i);
            if (fnMatch) name = fnMatch[1].trim();
            const telMatch = card.match(/TEL(?:;[^:]*)?:([^\r\n]+)/i);
            if (telMatch) {
              phone = telMatch[1].trim().replace(/[^0-9+]/g, '');
            }
            if (phone && phone.length >= 10) {
              if (!phone.startsWith('+') && phone.length === 10) {
                phone = '+91' + phone;
              }
              parsedContacts.push({
                name: name || `Contact ${phone.slice(-4)}`,
                phone_number: phone,
              });
            }
          }
        } else {
          // Parse CSV / TXT format
          const lines = text.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.toLowerCase().includes('phone') || trimmed.toLowerCase().includes('name')) {
              continue;
            }
            const parts = trimmed.split(/[,;\t]/);
            if (parts.length >= 2) {
              const name = parts[0].trim();
              let phone = parts[1].trim().replace(/[^0-9+]/g, '');
              if (phone.length >= 10) {
                if (!phone.startsWith('+') && phone.length === 10) phone = '+91' + phone;
                parsedContacts.push({ name, phone_number: phone });
              }
            } else if (parts.length === 1) {
              let phone = parts[0].trim().replace(/[^0-9+]/g, '');
              if (phone.length >= 10) {
                if (!phone.startsWith('+') && phone.length === 10) phone = '+91' + phone;
                parsedContacts.push({ name: `Contact ${phone.slice(-4)}`, phone_number: phone });
              }
            }
          }
        }

        if (parsedContacts.length === 0) {
          setErrorMsg('No valid phone numbers found in file. Please check format.');
          setLoading(false);
          return;
        }

        // Send to backend batch_import
        const res = await api.batchImportContacts({
          contacts: parsedContacts,
          client_id: activeTenantId,
        });

        const count = res?.created !== undefined ? (res.created + res.updated) : parsedContacts.length;
        setSyncedCount(count);
        setSuccessMsg(`✓ Successfully imported ${count} real contacts from ${file.name}!`);
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to parse and upload contact file.');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read the file.');
      setLoading(false);
    };

    reader.readAsText(file);
  };

  // Paste numbers import
  const handlePasteImport = async () => {
    if (!pasteText.trim()) {
      setErrorMsg('Please paste phone numbers.');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const lines = pasteText.split(/\r?\n/);
      const parsedContacts: { name: string; phone_number: string }[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(/[,;\t]/);
        if (parts.length >= 2) {
          const name = parts[0].trim();
          let phone = parts[1].trim().replace(/[^0-9+]/g, '');
          if (phone.length >= 10) {
            if (!phone.startsWith('+') && phone.length === 10) phone = '+91' + phone;
            parsedContacts.push({ name, phone_number: phone });
          }
        } else {
          let phone = trimmed.replace(/[^0-9+]/g, '');
          if (phone.length >= 10) {
            if (!phone.startsWith('+') && phone.length === 10) phone = '+91' + phone;
            parsedContacts.push({ name: `Customer ${phone.slice(-4)}`, phone_number: phone });
          }
        }
      }

      if (parsedContacts.length === 0) {
        setErrorMsg('No valid 10-digit phone numbers detected.');
        setLoading(false);
        return;
      }

      const res = await api.batchImportContacts({
        contacts: parsedContacts,
        client_id: activeTenantId,
      });

      const count = res?.created !== undefined ? (res.created + res.updated) : parsedContacts.length;
      setSyncedCount(count);
      setSuccessMsg(`✓ Successfully saved ${count} contacts!`);
      setPasteText('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import contacts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Smartphone className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Connect WhatsApp & Sync Contacts</h3>
              <p className="text-xs text-emerald-100">
                Sync Naveen's 500+ phonebook contacts to blast marketing messages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Active Tenant / Registered Device Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                📱
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Client WhatsApp Account
                </p>
                <p className="text-sm font-bold text-slate-800">
                  BitByte Official (+91 99444 95366)
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Meta Cloud API Ready
            </span>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('sync')}
              className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-1.5 ${
                activeTab === 'sync'
                  ? 'border-[#075E54] text-[#075E54]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>1-Click Device Sync</span>
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-1.5 ${
                activeTab === 'file'
                  ? 'border-[#075E54] text-[#075E54]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Import Phonebook (.vcf / .csv)</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-1.5 ${
                activeTab === 'paste'
                  ? 'border-[#075E54] text-[#075E54]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Numbers</span>
            </button>
          </div>

          {/* Success Message Banner */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3 text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm mb-1">{successMsg}</p>
                <p className="text-emerald-700">
                  All these real contacts are now saved in your account. You can send marketing offers to all of them immediately!
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('marketing');
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-[#075E54] hover:bg-[#128C7E] text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Go to Marketing & Send Message
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('contacts');
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-all"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    View Contacts List
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center space-x-2.5 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: 1-Click Device Sync */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <p className="font-bold mb-1 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Auto-Sync WhatsApp Registered Device Contacts
                </p>
                Verify and connect BitByte Official WhatsApp account (+91 99444 95366) to load all verified customer contacts into your database.
              </div>

              <button
                onClick={handleDeviceSync}
                disabled={loading}
                className="w-full py-3 bg-[#075E54] hover:bg-[#128C7E] disabled:bg-slate-300 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Syncing WhatsApp Contacts...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>⚡ Sync My WhatsApp Contacts Now</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: File Upload (VCF / CSV / Excel) */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">📱 How to export 500+ contacts from your phone:</p>
                <p>1. Open your Mobile <strong>Contacts App</strong></p>
                <p>2. Tap <strong>Settings ➡️ Export Contacts ➡️ to .vcf file</strong> (takes 5 seconds)</p>
                <p>3. Drop that <code>.vcf</code> or <code>.csv</code> file below to instantly load all contacts!</p>
              </div>

              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50/30 transition-all group">
                <input
                  type="file"
                  accept=".vcf,.csv,.txt"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-[#075E54] mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Click to upload Phonebook File</p>
                <p className="text-xs text-slate-400 mt-1">Supports .VCF (vCard), .CSV, or .TXT files</p>
              </label>

              {loading && (
                <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-emerald-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Parsing and saving contacts...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Paste Numbers */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paste Phone Numbers (One per line or comma separated):
                </label>
                <textarea
                  rows={5}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`9876543210\n9842100000\nCustomer 1, 9944495366\nSenthilkumar, 9894000000`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#075E54] focus:bg-white resize-none"
                />
              </div>

              <button
                onClick={handlePasteImport}
                disabled={loading || !pasteText.trim()}
                className="w-full py-2.5 bg-[#075E54] hover:bg-[#128C7E] disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Contacts...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Save Pasted Contacts</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tenant: <strong>DJ Photograph</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
