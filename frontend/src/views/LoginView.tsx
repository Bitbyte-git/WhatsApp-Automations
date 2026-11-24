import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Sparkles,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({
        email: email.trim(),
        password: password,
      });
      login(res.tokens.access, res.tokens.refresh, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-white">
      {/* ================= LEFT SIDE: PREMIUM BRAND & LIVE VALUE SHOWCASE ================= */}
      <div className="hidden lg:flex lg:w-[55%] h-full relative overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#075E54] to-slate-950 p-8 xl:p-12 flex-col justify-between border-r border-emerald-900/40">
        {/* Soft Ambient Radial Lights */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#25D366]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#25D366] to-[#128C7E] flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
              BB
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                BitByte <span className="text-[#25D366]">Technologies</span>
              </span>
              <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-300">
                WhatsApp Business SaaS
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200/80 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Center: Hero Pitch & Live Message Card */}
        <div className="relative z-10 space-y-5 max-w-lg my-auto py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-[#25D366]" />
            <span>Salem's #1 WhatsApp SaaS Automation Engine</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
            Scale your retail business with{' '}
            <span className="bg-gradient-to-r from-[#25D366] via-emerald-200 to-teal-300 bg-clip-text text-transparent">
              WhatsApp Broadcasts.
            </span>
          </h1>

          <p className="text-emerald-100/70 text-xs xl:text-sm leading-relaxed">
            Multi-tenant automation for Supermarkets, Textile Outlets, Restaurants, and Clinics across Tamil Nadu.
          </p>

          {/* Interactive Live Message Mockup Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[#25D366]">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs">Salem Fresh Supermarket</p>
                  <p className="text-[10px] text-emerald-400">99.8% Meta API Delivery Rate</p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/15 text-[#25D366] border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="bg-emerald-950/70 border border-emerald-500/20 p-2.5 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-emerald-200">
                <span>🎉 Weekend 20% Offer Broadcast</span>
                <span className="text-emerald-400">Rate: ₹0.8631</span>
              </div>
              <p className="text-slate-300 text-[10px]">
                5,000 WhatsApp messages delivered to loyalty members in 1.4 seconds.
              </p>
            </div>
          </div>

          {/* Value Checklist */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-emerald-100/90">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
              <span>100% Tenant Isolation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Real-Time Prepaid Wallet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
              <span>1,000 Free Monthly Chats</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Instant Digital E-Bills</span>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="relative z-10 pt-3 border-t border-emerald-900/40 flex items-center justify-between text-[11px] text-emerald-200/70">
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
            <span className="font-bold text-white ml-1">5.0</span>
            <span>(50+ Retail Stores in TN)</span>
          </div>
          <span>BitByte Technologies • Salem</span>
        </div>
      </div>

      {/* ================= RIGHT SIDE: LUXURY AUTH FORM (FITS 100VH NO SCROLL) ================= */}
      <div className="w-full lg:w-[45%] h-full bg-slate-900 flex flex-col justify-center px-6 sm:px-12 lg:px-12 xl:px-16 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-sm mx-auto space-y-6">
          {/* Mobile Back Button */}
          <div className="lg:hidden mb-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sign In to Dashboard
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Enter your credentials to access your WhatsApp Business workspace
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Business Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#075E54] to-[#25D366] hover:from-[#064E3B] hover:to-[#128C7E] text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-950/50 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch to Register */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-bold text-[#25D366] hover:text-emerald-300 transition-colors ml-1"
              >
                Register your business now →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
