import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  User,
  Building,
  Save,
  CheckCircle2,
  Lock,
  Server,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  // Editable Meta settings
  const [metaAppId, setMetaAppId] = useState('');
  const [metaAppSecret, setMetaAppSecret] = useState('');
  const [metaVerifyToken, setMetaVerifyToken] = useState('bitbyte_whatsapp_webhook_token_secure');
  const [metaSystemToken, setMetaSystemToken] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getPlatformSettings();
      const list = Array.isArray(res) ? res : res.results || [];
      setSettingsList(list);

      // Populate meta fields from loaded platform settings
      const appIdSetting = list.find((s: any) => s.key === 'META_APP_ID');
      const verifyTokenSetting = list.find((s: any) => s.key === 'META_VERIFY_TOKEN');
      if (appIdSetting) setMetaAppId(appIdSetting.value);
      if (verifyTokenSetting) setMetaVerifyToken(verifyTokenSetting.value);
    } catch {
      setSettingsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaveSuccess(false);

    try {
      if (metaAppId) {
        await api.updatePlatformSetting({ key: 'META_APP_ID', value: metaAppId, description: 'Meta Developer App ID' });
      }
      if (metaAppSecret) {
        await api.updatePlatformSetting({ key: 'META_APP_SECRET', value: metaAppSecret, description: 'Meta App Secret', is_secret: true });
      }
      if (metaVerifyToken) {
        await api.updatePlatformSetting({ key: 'META_VERIFY_TOKEN', value: metaVerifyToken, description: 'Webhook Verify Token' });
      }
      if (metaSystemToken) {
        await api.updatePlatformSetting({ key: 'META_SYSTEM_USER_TOKEN', value: metaSystemToken, description: 'Permanent System User Token', is_secret: true });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to update platform settings.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg('');
    if (newPassword !== confirmPassword) {
      setPwdMsg('New passwords do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPwdMsg(res.message || 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdMsg(err.message || 'Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const isSuperadmin = user?.role === 'SUPERADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">System & Account Settings</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Platform credentials, Meta Cloud API settings, company information, and profile security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Platform & Meta Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Company Identity */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-3 text-xs">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <Building className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Platform Identity
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-gray-500 uppercase text-[10px]">Operating Company</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">BitByte Technologies</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500 uppercase text-[10px]">Headquarters</span>
                <p className="font-medium text-gray-800 text-sm mt-0.5">Salem, Tamil Nadu, India</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500 uppercase text-[10px]">Support Contact</span>
                <p className="font-medium text-gray-800 mt-0.5">support@bitbytetech.org</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500 uppercase text-[10px]">Core Architecture</span>
                <p className="font-medium text-emerald-700 mt-0.5">Meta Cloud API v21.0</p>
              </div>
            </div>
          </div>

          {/* Meta Cloud API Integration Credentials */}
          {isSuperadmin && (
            <form onSubmit={handleSavePlatformSettings} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Meta Cloud API Credentials
                  </h3>
                </div>
                {saveSuccess && (
                  <span className="text-emerald-600 font-semibold text-xs flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Settings Saved!
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Meta Developer App ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 109283746591234"
                  value={metaAppId}
                  onChange={(e) => setMetaAppId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Meta App Secret (HMAC Signature Verification)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={metaAppSecret}
                  onChange={(e) => setMetaAppSecret(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Webhook Verify Token
                </label>
                <input
                  type="text"
                  value={metaVerifyToken}
                  onChange={(e) => setMetaVerifyToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Meta Permanent System User Token
                </label>
                <input
                  type="password"
                  placeholder="EAAG... (System User Access Token)"
                  value={metaSystemToken}
                  onChange={(e) => setMetaSystemToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Platform Credentials
                </button>
              </div>
            </form>
          )}

          {/* Database & Environment Info Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-3 text-xs">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <Server className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Database Architecture
              </h3>
            </div>
            <div className="space-y-2 text-gray-600">
              <p>
                • <strong>Neon PostgreSQL</strong> configured via <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono">DATABASE_URL</code> environment variable.
              </p>
              <p>
                • Managed with Django ORM migrations with full tenant isolation across Users, Accounts, Contacts, Conversations, Messages, and Wallets.
              </p>
              <p>
                • Real data strict mode enabled: zero mock numbers or fake charts.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: User Profile & Security */}
        <div className="lg:col-span-5 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4 text-xs">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <User className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                My Profile
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-500 uppercase text-[10px]">Full Name</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{user?.full_name}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500 uppercase text-[10px]">Email Address</span>
                <p className="font-medium text-gray-800 mt-0.5">{user?.email}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500 uppercase text-[10px]">Assigned Role</span>
                <p className="font-bold text-emerald-700 mt-0.5">{user?.role}</p>
              </div>
              {user?.client_details && (
                <div>
                  <span className="font-semibold text-gray-500 uppercase text-[10px]">Assigned Tenant Client</span>
                  <p className="font-bold text-gray-900 mt-0.5">{user.client_details.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Change Password Card */}
          <form onSubmit={handleChangePassword} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4 text-xs">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <Lock className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Change Password
              </h3>
            </div>

            {pwdMsg && (
              <div className={`p-3 rounded-xl ${pwdMsg.includes('success') ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                {pwdMsg}
              </div>
            )}

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">New Password (min 6 chars) *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full py-2.5 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {pwdLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
