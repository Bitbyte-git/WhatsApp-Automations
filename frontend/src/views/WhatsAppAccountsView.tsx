import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { WhatsAppAccount, Client } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export const WhatsAppAccountsView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [metaStatus, setMetaStatus] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  // Form State for Manual / Embedded WABA connection
  const [businessName, setBusinessName] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>(activeTenantId || '');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const tenantParam = activeTenantId ? `client_id=${activeTenantId}` : '';
      const [accountsRes, statusRes] = await Promise.all([
        api.getWhatsAppAccounts(tenantParam),
        api.getMetaStatus(),
      ]);
      setAccounts(accountsRes.results || []);
      setMetaStatus(statusRes);

      if (user?.role === 'SUPERADMIN') {
        const clientsRes = await api.getClients();
        setClients(clientsRes.results || []);
      }
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId]);

  const handleSync = async (id: number) => {
    setSyncingId(id);
    try {
      const res = await api.syncWhatsAppAccount(id);
      if (res.success) {
        alert('Quality rating and connection status refreshed from Meta Graph API.');
        loadData();
      } else {
        alert(res.error || 'Failed to sync with Meta');
      }
    } catch (err: any) {
      alert(err.message || 'WhatsApp integration is not configured.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const payload: any = {
        business_name: businessName,
        waba_id: wabaId,
        phone_number: phoneNumber,
        phone_number_id: phoneNumberId,
        access_token: accessToken,
        connection_status: 'PENDING_CONFIGURATION',
      };

      if (user?.role === 'SUPERADMIN' && selectedClient) {
        payload.client = parseInt(selectedClient);
      }

      await api.createWhatsAppAccount(payload);
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to connect WhatsApp account.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">WhatsApp Accounts</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Connect and manage official Meta WhatsApp Business Accounts (WABA) and phone numbers.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setBusinessName('');
            setWabaId('');
            setPhoneNumber('');
            setPhoneNumberId('');
            setAccessToken('');
            setModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1faa53] rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Connect WhatsApp Account
        </button>
      </div>

      {/* Meta Configuration Status Banner */}
      {metaStatus && !metaStatus.is_configured && (
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-900">WhatsApp integration is not configured.</h4>
            <p className="mt-0.5 text-amber-700">
              The Meta Cloud API access credentials (System User Token or App Secret) are not yet supplied in the backend environment.
              Please connect your Meta WABA account or configure your Meta Developer credentials in the Settings page.
            </p>
            <div className="mt-2.5 flex items-center space-x-3 text-[11px]">
              <span className="font-mono bg-amber-100/70 px-2 py-0.5 rounded">
                App ID: {metaStatus.meta_app_id_configured ? 'Configured' : 'Missing'}
              </span>
              <span className="font-mono bg-amber-100/70 px-2 py-0.5 rounded">
                System Token: {metaStatus.meta_system_token_configured ? 'Configured' : 'Missing'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Accounts List / Empty State */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading WhatsApp account records from database...</p>
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            title="No WhatsApp accounts connected yet."
            description="You have not connected any Meta WhatsApp Business Account (WABA) or phone numbers. Connect your verified phone number to send and receive real WhatsApp messages."
            actionLabel="Connect WhatsApp Account"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">WABA ID</th>
                  <th className="py-3 px-4">Phone Number & ID</th>
                  <th className="py-3 px-4">Connection Status</th>
                  <th className="py-3 px-4">Quality Rating</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Connected Client</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>{acc.business_name}</span>
                        {acc.is_default && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">DEFAULT</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {acc.waba_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{acc.phone_number}</div>
                      <span className="text-[10px] text-gray-400 font-mono">ID: {acc.phone_number_id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={acc.connection_status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={acc.quality_rating} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={acc.account_status} />
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {acc.client_name || `Tenant #${acc.client}`}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleSync(acc.id)}
                        disabled={syncingId === acc.id}
                        className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Sync live status from Meta Graph API"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncingId === acc.id ? 'animate-spin text-emerald-600' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Embedded Signup Architecture Guidance Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center">
          <Zap className="w-4 h-4 text-[#25D366] mr-2" />
          Meta Embedded Signup Architecture
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed mb-4">
          BitByte Technologies uses Meta WhatsApp Cloud API with Embedded Signup SDK.
          Clients can onboard their WhatsApp Business Account directly inside this dashboard without leaving the portal.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-800">1. Facebook Login Dialog</span>
            <p className="text-gray-500 mt-1">Initiates Meta popup for business authentication and phone number verification.</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-800">2. OAuth Code Exchange</span>
            <p className="text-gray-500 mt-1">Backend exchanges temporary code for system user permanent access token.</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="font-semibold text-gray-800">3. Webhook Subscription</span>
            <p className="text-gray-500 mt-1">Subscribes WABA to BitByte webhook endpoint for real-time delivery and incoming chats.</p>
          </div>
        </div>
      </div>

      {/* Connect WhatsApp Account Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Connect WhatsApp Business Account"
      >
        <form onSubmit={handleConnectAccount} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
              {formError}
            </div>
          )}

          {user?.role === 'SUPERADMIN' && clients.length > 0 && (
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Select Tenant Client *</label>
              <select
                required
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
              >
                <option value="">Choose a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">WhatsApp Business Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. BitByte Tech Support"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">WhatsApp Business Account ID (WABA ID) *</label>
            <input
              type="text"
              required
              placeholder="e.g. 109823478912345"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Phone Number (E.164 Format) *</label>
            <input
              type="text"
              required
              placeholder="+919876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Meta Phone Number ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. 102345678901234"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Permanent Access Token (Optional)</label>
            <input
              type="password"
              placeholder="EAAG... (If omitted, system user token is used)"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 bg-[#25D366] hover:bg-[#1faa53] text-white rounded-xl font-semibold shadow-sm disabled:opacity-50"
            >
              {formLoading ? 'Connecting...' : 'Connect Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
