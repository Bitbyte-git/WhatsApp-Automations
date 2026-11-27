import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Lock,
  Mail,
  Building,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [clientName, setClientName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({
        email: email.trim(),
        password: password,
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        client_name: clientName.trim(),
        role: 'CLIENT_ADMIN',
      });
      login(res.tokens.access, res.tokens.refresh, res.user);
      navigate(res.user?.role === 'SUPERADMIN' ? '/admin/dashboard' : '/client/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FBF9] text-slate-800 flex flex-col justify-between font-sans selection:bg-[#007A4D] selection:text-white relative overflow-hidden">
      {/* Ambient Background Glow matching Landing Page */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#E8F7F0] to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#19A974]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-[#DCE9E2] flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
            <img src="/assets/Logo-Icon.png" alt="Infisq Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-900 tracking-tight block leading-tight">
              Infisq Innovations
            </span>
            <span className="text-[9px] font-bold tracking-widest text-[#007A4D] uppercase block">
              Communicate • Automate • Grow
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#007A4D] px-3.5 py-2 rounded-full bg-white border border-[#DCE9E2] shadow-xs hover:border-[#19A974] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Register Card (Centered, Clean, No Bloat) */}
      <main className="w-full max-w-xl mx-auto px-6 my-auto py-8">
        <div className="bg-white rounded-3xl border border-[#DCE9E2] p-8 sm:p-10 shadow-xl shadow-slate-900/5 relative">
          {/* Header Title */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#E8F7F0] flex items-center justify-center text-[#007A4D]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Register Your Business
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
              Start broadcasting and automating on WhatsApp Cloud API
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business / Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Acme Retail Stores"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FBF9] border border-[#DCE9E2] rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#007A4D] focus:ring-4 focus:ring-[#007A4D]/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FBF9] border border-[#DCE9E2] rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#007A4D] focus:ring-4 focus:ring-[#007A4D]/10 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@acme.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FBF9] border border-[#DCE9E2] rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#007A4D] focus:ring-4 focus:ring-[#007A4D]/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FBF9] border border-[#DCE9E2] rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#007A4D] focus:ring-4 focus:ring-[#007A4D]/10 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="w-full pl-10 pr-11 py-3 bg-[#F8FBF9] border border-[#DCE9E2] rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#007A4D] focus:ring-4 focus:ring-[#007A4D]/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full pl-10 pr-11 py-3 bg-[#F8FBF9] border border-[#DCE9E2] rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#007A4D] focus:ring-4 focus:ring-[#007A4D]/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#007A4D] to-[#19A974] hover:from-[#005C3A] hover:to-[#007A4D] text-white font-bold text-sm shadow-lg shadow-[#007A4D]/20 hover:shadow-xl hover:shadow-[#007A4D]/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 pt-6 border-t border-[#DCE9E2] text-center">
            <p className="text-xs text-slate-500 font-medium">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-[#007A4D] hover:text-[#005C3A] underline underline-offset-2 ml-1"
              >
                Sign In here →
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 font-medium">
        © 2026 Infisq Innovations. All rights reserved.
      </footer>
    </div>
  );
};
