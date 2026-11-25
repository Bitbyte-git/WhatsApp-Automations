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
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Shirt,
  UtensilsCrossed,
  Stethoscope,
  Sparkles,
  Star,
  Eye,
  EyeOff,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-white">
      {/* ================= LEFT SIDE: ENTERPRISE VALUE SHOWCASE ================= */}
      <div className="lg:w-[50%] relative overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#075E54] to-slate-950 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-emerald-900/40">
        {/* Soft Ambient Radial Lights */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[#25D366]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#25D366] to-[#128C7E] flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-950/50 group-hover:scale-105 transition-transform">
              BB
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                BitByte <span className="text-[#25D366]">Technologies</span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">
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

        {/* Center: Hero Pitch & Target Businesses */}
        <div className="relative z-10 my-10 lg:my-0 space-y-7 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
            <span>Join 50+ Growing Businesses in Tamil Nadu</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
            Create your isolated{' '}
            <span className="bg-gradient-to-r from-[#25D366] via-emerald-200 to-teal-300 bg-clip-text text-transparent">
              WhatsApp Business Account.
            </span>
          </h1>

          <p className="text-emerald-100/70 text-sm leading-relaxed">
            Get your own dedicated business workspace. Your customer contacts, conversations, templates, and prepaid wallet are 100% private and protected.
          </p>

          {/* 4 Industries Pills */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-[#25D366]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Supermarkets</p>
                <p className="text-[10px] text-slate-400">Weekend Offers & E-Bills</p>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-[#25D366]">
                <Shirt className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Textile Shops</p>
                <p className="text-[10px] text-slate-400">Festival Catalogs & Promos</p>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-[#25D366]">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Restaurants</p>
                <p className="text-[10px] text-slate-400">Menu Cards & Bookings</p>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-[#25D366]">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Medical & Clinics</p>
                <p className="text-[10px] text-slate-400">Appointments & OTPs</p>
              </div>
            </div>
          </div>

          {/* Pricing Highlight Pill */}
          <div className="bg-emerald-950/80 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-emerald-200 font-semibold">Service Messages Allowance:</span>
            <span className="font-black text-[#25D366] bg-emerald-500/20 px-2.5 py-1 rounded-md">
              1,000 Chats FREE / Month
            </span>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="relative z-10 pt-6 border-t border-emerald-900/40 flex items-center justify-between text-xs text-emerald-200/70">
          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="font-bold text-white ml-1">Official Meta Rates</span>
          </div>
          <span>BitByte Technologies</span>
        </div>
      </div>

      {/* ================= RIGHT SIDE: LUXURY REGISTRATION FORM ================= */}
      <div className="lg:w-[50%] bg-slate-900 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-lg space-y-6">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Register Your Business
            </h2>
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Fill in your business details to setup your WhatsApp tenant
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Company / Shop Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Salem Fresh Supermarket"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Contact Person Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senthilkumar S"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  WhatsApp Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 9363938143"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Business Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Create Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-10 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-10 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#075E54] to-[#25D366] hover:from-[#064E3B] hover:to-[#128C7E] text-white font-black text-sm tracking-wide shadow-xl shadow-emerald-950/50 hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Setting Up Tenant Workspace...</span>
              ) : (
                <>
                  <span>Complete Business Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch to Login */}
          <div className="pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-[#25D366] hover:text-emerald-300 transition-colors ml-1"
              >
                Sign In here →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
