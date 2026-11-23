import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Shirt,
  UtensilsCrossed,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Lock,
} from 'lucide-react';

export const LandingView: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* ================= STICKY NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center text-white shadow-md shadow-emerald-900/10">
              <span className="font-black text-xl tracking-wider">BB</span>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                BitByte <span className="text-[#25D366]">Technologies</span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-800">
                WhatsApp Business SaaS
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#solutions" className="hover:text-emerald-700 transition-colors">
              Solutions
            </a>
            <a href="#categories" className="hover:text-emerald-700 transition-colors">
              Message Rates
            </a>
            <a href="#how-it-works" className="hover:text-emerald-700 transition-colors">
              How It Works
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#075E54] to-[#128C7E] hover:from-[#064e43] hover:to-[#0f7669] rounded-xl shadow-md shadow-emerald-900/20 hover:shadow-lg transition-all flex items-center gap-2 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Soft Decorative Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-emerald-100/60 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-200/40 rounded-full blur-2xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold tracking-wide shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
                <span>Meta WhatsApp Cloud API Multi-Tenant SaaS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Scale Your Retail & Store Sales with{' '}
                <span className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] bg-clip-text text-transparent">
                  WhatsApp Automation
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Empowering Supermarkets, Textile Outlets, Restaurants, and Healthcare Clinics across Tamil Nadu. Send high-converting festival offers, instant billing receipts, and support customers 24/7.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#075E54] hover:bg-[#064e43] text-white font-extrabold text-base shadow-xl shadow-emerald-900/20 hover:shadow-2xl transition-all flex items-center justify-center gap-3 group"
                >
                  <span>Register Your Business</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-base border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>Admin Sign In</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80 max-w-md mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-2xl font-black text-slate-900">99.9%</p>
                  <p className="text-xs font-semibold text-slate-500">Delivery Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">1,000</p>
                  <p className="text-xs font-semibold text-slate-500">Free Monthly Chats</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">100%</p>
                  <p className="text-xs font-semibold text-slate-500">Tenant Data Isolation</p>
                </div>
              </div>
            </div>

            {/* Right Visual: Interactive WhatsApp SaaS Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 overflow-hidden">
                {/* Header Mockup */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#075E54] flex items-center justify-center text-white font-bold text-sm">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Salem Fresh Supermarket</h4>
                      <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified WhatsApp Business
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-100">
                    WABA ACTIVE
                  </span>
                </div>

                {/* Simulated Chat Feed */}
                <div className="py-5 space-y-4 text-xs">
                  {/* Outbound Marketing Message */}
                  <div className="bg-[#DCF8C6] border border-emerald-200/70 p-3.5 rounded-2xl rounded-tr-xs shadow-xs text-slate-800 space-y-2">
                    <div className="flex items-center justify-between font-bold text-emerald-950 text-[11px]">
                      <span>🎉 WEEKEND MEGA OFFER</span>
                      <span className="text-[9px] text-emerald-800 font-medium">10:30 AM</span>
                    </div>
                    <p className="leading-relaxed">
                      Dear Customer, get flat <strong>20% OFF</strong> on all Grocery & Fresh Vegetables today at Salem Fresh Supermarket!
                    </p>
                    <div className="pt-1.5 border-t border-emerald-200 flex items-center justify-between text-[10px] font-bold text-emerald-900">
                      <span>Rate: ₹0.8631</span>
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered (5,000 sent)
                      </span>
                    </div>
                  </div>

                  {/* Outbound Utility Bill */}
                  <div className="bg-[#DCF8C6] border border-emerald-200/70 p-3.5 rounded-2xl rounded-tr-xs shadow-xs text-slate-800 space-y-2">
                    <div className="flex items-center justify-between font-bold text-emerald-950 text-[11px]">
                      <span>🧾 DIGITAL BILL RECEIPT</span>
                      <span className="text-[9px] text-emerald-800 font-medium">11:15 AM</span>
                    </div>
                    <p className="leading-relaxed">
                      Order <strong>#BB-8921</strong> confirmed. Total Amount: <strong>₹1,450</strong>. Thank you for shopping with us!
                    </p>
                    <div className="pt-1.5 border-t border-emerald-200 flex items-center justify-between text-[10px] font-bold text-emerald-900">
                      <span>Rate: ₹0.1150</span>
                      <span className="text-emerald-700 font-semibold">Instant Receipt</span>
                    </div>
                  </div>

                  {/* Inbound Customer Query */}
                  <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl rounded-tl-xs text-slate-700 space-y-1">
                    <p className="font-semibold">Customer: "Is home delivery available in Hasthampatti?"</p>
                    <p className="text-[10px] text-slate-400">11:16 AM • Free Service Window</p>
                  </div>
                </div>

                {/* Live Metric Bar at Bottom */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-700" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Prepaid Wallet</p>
                      <p className="text-sm font-black text-slate-900">₹2,450.00</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                    Real-Time Balance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4 CORE CLIENT BUSINESSES ================= */}
      <section id="solutions" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black tracking-widest text-[#075E54] uppercase bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-100">
              Tailored Solutions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Built for Every Business Across Tamil Nadu
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Each business gets their own dedicated client portal, private contact book, and separate wallet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Supermarket */}
            <div className="bg-slate-50 hover:bg-emerald-50/40 p-6 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6 text-[#075E54]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Supermarkets</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Broadcast weekend discounts, grocery arrival alerts, and send automated PDF bill receipts directly after checkout.
              </p>
              <ul className="text-[11px] font-semibold text-slate-700 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Weekend Offer Catalogs</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Digital E-Bills & Receipts</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Loyalty Points Reminders</li>
              </ul>
            </div>

            {/* 2. Textile Shop */}
            <div className="bg-slate-50 hover:bg-emerald-50/40 p-6 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Shirt className="w-6 h-6 text-[#075E54]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Textile & Garments</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Send festival collection catalogs (Deepavali, Pongal), tailor delivery updates, and VIP member special promos.
              </p>
              <ul className="text-[11px] font-semibold text-slate-700 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Festival Collection Catalogs</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Order Ready Notifications</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> High Photo Rich Media Support</li>
              </ul>
            </div>

            {/* 3. Restaurant */}
            <div className="bg-slate-50 hover:bg-emerald-50/40 p-6 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="w-6 h-6 text-[#075E54]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Restaurants & Cafes</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Share digital menus, confirm table bookings, announce special weekend buffets, and collect direct customer feedback.
              </p>
              <ul className="text-[11px] font-semibold text-slate-700 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Table Booking Confirmation</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Daily Specials Broadcast</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 24/7 Menu Bot Inquiries</li>
              </ul>
            </div>

            {/* 4. Medical Shop */}
            <div className="bg-slate-50 hover:bg-emerald-50/40 p-6 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6 text-[#075E54]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Clinics & Medicals</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Send appointment reminders, prescription refill alerts, and secure WhatsApp OTPs with high privacy standards.
              </p>
              <ul className="text-[11px] font-semibold text-slate-700 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Doctor Appointment Reminders</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Monthly Medicine Refills</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Secure OTP Authentication</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4 MESSAGE CATEGORIES & OFFICIAL RATES ================= */}
      <section id="categories" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black tracking-widest text-[#25D366] uppercase bg-emerald-950 px-3.5 py-1 rounded-full border border-emerald-800">
              Transparent Meta Rate Card
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Official WhatsApp Message Categories
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Calculated accurately per category according to official Meta WhatsApp business guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category 1: Marketing */}
            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md">
                  Category 1
                </span>
                <h3 className="text-xl font-black text-white mt-3 mb-1">Marketing</h3>
                <p className="text-xs text-slate-400 mb-4">Promotions, discounts, festival offers, and product sales.</p>
                <div className="py-3 border-y border-slate-700/60 mb-4">
                  <span className="text-3xl font-black text-[#25D366]">₹0.8631</span>
                  <span className="text-xs text-slate-400"> / message</span>
                  <p className="text-[10px] text-slate-500 mt-1">1,000 msgs: ₹1,018.46 (incl 18% GST)</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-300">"Get 20% OFF today! Visit our supermarket."</p>
            </div>

            {/* Category 2: Utility */}
            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md">
                  Category 2
                </span>
                <h3 className="text-xl font-black text-white mt-3 mb-1">Utility</h3>
                <p className="text-xs text-slate-400 mb-4">Order confirmations, bill receipts, and delivery updates.</p>
                <div className="py-3 border-y border-slate-700/60 mb-4">
                  <span className="text-3xl font-black text-[#25D366]">₹0.1150</span>
                  <span className="text-xs text-slate-400"> / message</span>
                  <p className="text-[10px] text-slate-500 mt-1">1,000 msgs: ₹135.70 (incl 18% GST)</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-300">"Your order #582 has been confirmed."</p>
            </div>

            {/* Category 3: Authentication */}
            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-md">
                  Category 3
                </span>
                <h3 className="text-xl font-black text-white mt-3 mb-1">Authentication</h3>
                <p className="text-xs text-slate-400 mb-4">WhatsApp Login OTPs, account security, and verification codes.</p>
                <div className="py-3 border-y border-slate-700/60 mb-4">
                  <span className="text-3xl font-black text-[#25D366]">₹0.1150</span>
                  <span className="text-xs text-slate-400"> / message</span>
                  <p className="text-[10px] text-slate-500 mt-1">1,000 msgs: ₹135.70 (incl 18% GST)</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-300">"Your WhatsApp login OTP is 123456."</p>
            </div>

            {/* Category 4: Service */}
            <div className="bg-slate-800/80 border border-emerald-500/50 p-6 rounded-2xl flex flex-col justify-between relative shadow-lg shadow-emerald-950">
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-[#25D366] text-slate-900 text-[10px] font-black rounded-full uppercase">
                1,000 Free
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md">
                  Category 4
                </span>
                <h3 className="text-xl font-black text-white mt-3 mb-1">Service Chats</h3>
                <p className="text-xs text-slate-400 mb-4">Two-way customer support when users message your business.</p>
                <div className="py-3 border-y border-slate-700/60 mb-4">
                  <span className="text-3xl font-black text-[#25D366]">FREE</span>
                  <span className="text-xs text-slate-400"> (First 1,000 / mo)</span>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1">Then ₹0.1150 per message</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-300">"Shop opening timing: 9:00 AM to 10:00 PM."</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black tracking-widest text-[#075E54] uppercase bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-100">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How BitByte Platform Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-[#075E54] text-white flex items-center justify-center font-black text-sm mb-4">
                1
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Create Shop Account</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Supermarket or restaurant owner logs into their isolated dashboard and connects their business WhatsApp number.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-[#075E54] text-white flex items-center justify-center font-black text-sm mb-4">
                2
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Recharge Prepaid Wallet</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Recharge ₹500 or ₹2,000. Balance is verified in real-time before messages are dispatched. Zero overdraft risk.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-[#075E54] text-white flex items-center justify-center font-black text-sm mb-4">
                3
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Broadcast & Chat</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send 1,000 offers with one click. View real-time delivery ticks (Sent, Delivered, Read) and reply from team inbox.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CALL TO ACTION FOOTER ================= */}
      <section className="bg-gradient-to-tr from-[#064E3B] via-[#075E54] to-[#128C7E] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Automate Your Business on WhatsApp?
          </h2>
          <p className="text-emerald-100 max-w-2xl mx-auto text-sm sm:text-base">
            Join BitByte Technologies today. Build customer trust with official verified WhatsApp business messaging.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-emerald-950 font-black rounded-xl hover:bg-emerald-50 transition-all shadow-lg inline-block text-center"
            >
              Get Started Now
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-900/60 hover:bg-emerald-900/90 text-white font-bold rounded-xl border border-emerald-400/30 transition-all inline-block text-center"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#25D366] text-slate-950 font-black flex items-center justify-center text-xs">
              BB
            </div>
            <span className="font-bold text-white">BitByte Technologies</span>
            <span className="text-slate-600">|</span>
            <span>Salem, Tamil Nadu, India</span>
          </div>
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} BitByte Technologies. All rights reserved. Official WhatsApp Platform.
          </p>
        </div>
      </footer>
    </div>
  );
};
