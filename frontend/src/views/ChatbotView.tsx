import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Smartphone,
  ExternalLink,
  PhoneCall,
  Check,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  Camera,
  Heart,
  Gift,
  Phone,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ChatbotView: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testingPhone, setTestingPhone] = useState(false);
  const [testNumber, setTestNumber] = useState('9363938143');

  // SBI-Style Auto-Reply Settings
  const [triggerWords, setTriggerWords] = useState('Hi, Hello, Hey, Hi sir, Vanakkam, Start, Menu');
  const [headerText, setHeaderText] = useState('📸 DJ Photograph - Salem');
  const [welcomeText, setWelcomeText] = useState(
    `Good Day! Welcome to DJ Photograph Salem 📸✨\n\nSeamless photography booking is just a message away! We capture your precious wedding, reception, outdoor & birthday moments into cinematic memories.\n\nExplore our Services 👇`
  );
  const [button1, setButton1] = useState('📸 Wedding Package');
  const [button2, setButton2] = useState('🎬 Pre-Wedding Shoot');
  const [button3, setButton3] = useState('📞 Call Naveen');

  // Sub-menu replies
  const [weddingReply, setWeddingReply] = useState(
    `🎉 *Wedding & Reception Special Package*\n\n• 2 Days Full HD Candid Photography + Cinematography\n• Traditional & Drone Coverage\n• Free 4K Cinematic Teaser Reel\n• Premium Velvet Photo Album (40 Pages)\n\n✨ *Flat 30% OFF for 2026-2027 Bookings!*\n\nChoose an option below to proceed:`
  );
  const [preweddingReply, setPreweddingReply] = useState(
    `✨ *Outdoor & Pre-Wedding Couple Shoot*\n\n• 50 Color-graded High-Resolution Photos\n• 1 Cinematic Instagram Reel for social media\n• Salem & Yercaud scenic locations\n\nAll at just ₹4,999! Limited slots available.\n\nChoose an option below:`
  );
  const [callReply, setCallReply] = useState(
    `You can reach Naveen directly at *+91 9363938143* or reply here with your wedding date and venue details. Our studio team will contact you immediately!`
  );

  // Status Alerts
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  // Simulator Chat History
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'bot'; text: string; header?: string; buttons?: string[] }>>([
    { sender: 'user', text: 'Hi' },
    {
      sender: 'bot',
      header: '📸 DJ Photograph - Salem',
      text: `Good Day! Welcome to DJ Photograph Salem 📸✨\n\nSeamless photography booking is just a message away! We capture your precious wedding, reception, outdoor & birthday moments into cinematic memories.\n\nExplore our Services 👇`,
      buttons: ['📸 Wedding Package', '🎬 Pre-Wedding Shoot', '📞 Call Naveen'],
    },
  ]);
  const [simInput, setSimInput] = useState('');

  const handleSimulateMessage = (msg: string) => {
    const clean = msg.trim().toLowerCase();
    const newLog = [...chatLog, { sender: 'user' as const, text: msg }];

    if (clean.includes('wedding') || clean === '📸 wedding package') {
      newLog.push({
        sender: 'bot',
        header: '📸 Wedding Special Package',
        text: weddingReply,
        buttons: ['📅 Check Date', '🖼️ View Portfolio', '📞 Call Naveen'],
      });
    } else if (clean.includes('pre-wedding') || clean.includes('couple') || clean === '🎬 pre-wedding shoot') {
      newLog.push({
        sender: 'bot',
        header: '✨ Outdoor & Couple Shoot',
        text: preweddingReply,
        buttons: ['📸 Book Shoot', '📍 View Locations', '📞 Call Naveen'],
      });
    } else if (clean.includes('call') || clean.includes('naveen') || clean === '📞 call naveen') {
      newLog.push({
        sender: 'bot',
        header: '📞 Connect with Studio',
        text: callReply,
        buttons: ['📅 Check Date', '📸 Wedding Package'],
      });
    } else {
      // Default Welcome
      newLog.push({
        sender: 'bot',
        header: headerText,
        text: welcomeText,
        buttons: [button1, button2, button3],
      });
    }

    setChatLog(newLog);
    setSimInput('');
  };

  const handleLivePhoneTest = async () => {
    setTestingPhone(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const res = await api.testAutoReply({
        phone_number: testNumber,
        dispatch_to_phone: true,
        message: 'Hi',
      });

      if (res?.success) {
        setAlertSuccess(`🎉 SBI-style Welcome Menu sent to +91 ${testNumber}! Please check your WhatsApp.`);
      } else {
        setAlertError(res?.error || 'Failed to dispatch test message.');
      }
    } catch (err: any) {
      setAlertError(err.message || 'Error communicating with WhatsApp Gateway.');
    } finally {
      setTestingPhone(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-50 text-[#075E54] border border-emerald-200">
              Interactive Menu Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-600 font-semibold">SBI WhatsApp Banking Style</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Customer "Hi" Auto-Reply & Interactive Service Menu
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            When any customer sends "Hi" or "Hello" to DJ Photograph's WhatsApp (+91 9363938143), the system instantly replies with your studio banner, welcome greeting, and 3 touch buttons — just like SBI WhatsApp Banking!
          </p>
        </div>

        {/* Live Test Pill */}
        <button
          type="button"
          onClick={handleLivePhoneTest}
          disabled={testingPhone}
          className="px-4 py-2.5 rounded-xl bg-[#075E54] hover:bg-[#064E3B] text-white font-black text-xs shadow-xs transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-[#25D366]" />
          <span>{testingPhone ? 'Sending to Phone...' : 'Test "Hi" on My Phone (+91 9363938143)'}</span>
        </button>
      </div>

      {/* Alerts */}
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

      {/* MAIN TWO-COLUMN WORKSPACE: CONFIGURATION (LEFT) + LIVE SBI-STYLE MOCKUP (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Bot Triggers & Buttons Customizer */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step A: Greeting Triggers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Customer Triggers (What customer enters)
              </h2>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Trigger Keywords
              </label>
              <input
                type="text"
                value={triggerWords}
                onChange={(e) => setTriggerWords(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                If a customer sends any of these words (e.g. <b>"Hi"</b>, <b>"Hi sir"</b>, <b>"Hello"</b>), your interactive menu triggers instantly.
              </p>
            </div>
          </div>

          {/* Step B: Welcome Greeting & 3 Main Buttons (SBI Style) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                SBI-Style Welcome Banner & 3 Interactive Buttons
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Header Title
              </label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Welcome Message Body
              </label>
              <textarea
                rows={4}
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] leading-relaxed text-slate-800 font-normal"
              />
            </div>

            {/* 3 Interactive Buttons */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3 Touch Action Buttons (Tap to Select Service)
              </label>

              <div className="space-y-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-[#075E54] font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                    1
                  </span>
                  <input
                    type="text"
                    value={button1}
                    maxLength={25}
                    onChange={(e) => setButton1(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-[#075E54] font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                    2
                  </span>
                  <input
                    type="text"
                    value={button2}
                    maxLength={25}
                    onChange={(e) => setButton2(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-[#075E54] font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                    3
                  </span>
                  <input
                    type="text"
                    value={button3}
                    maxLength={25}
                    onChange={(e) => setButton3(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step C: What Happens When Customer Taps a Button */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Automated Service Responses
              </h2>
            </div>

            {/* Wedding Response */}
            <div>
              <label className="block text-xs font-bold text-[#075E54] uppercase tracking-wider mb-1">
                When Customer Taps "{button1}"
              </label>
              <textarea
                rows={3}
                value={weddingReply}
                onChange={(e) => setWeddingReply(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
            </div>

            {/* Pre-wedding Response */}
            <div>
              <label className="block text-xs font-bold text-[#075E54] uppercase tracking-wider mb-1">
                When Customer Taps "{button2}"
              </label>
              <textarea
                rows={3}
                value={preweddingReply}
                onChange={(e) => setPreweddingReply(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
            </div>

            {/* Call Naveen Response */}
            <div>
              <label className="block text-xs font-bold text-[#075E54] uppercase tracking-wider mb-1">
                When Customer Taps "{button3}"
              </label>
              <textarea
                rows={2}
                value={callReply}
                onChange={(e) => setCallReply(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): REAL SBI-STYLE WHATSAPP MOCKUP SIMULATOR */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
            {/* Notch */}
            <div className="flex justify-center mb-3">
              <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
              </div>
            </div>

            {/* Phone Screen */}
            <div className="bg-[#EFEAE2] rounded-[28px] overflow-hidden border border-slate-700 flex flex-col h-[620px] shadow-inner">
              {/* WhatsApp Top Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-xs">
                    DJ
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">DJ Photograph Salem</h4>
                    <p className="text-[10px] text-emerald-200">Official Auto-Reply Bot</p>
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

                {chatLog.map((chat, idx) => (
                  <div key={idx} className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}>
                    {chat.sender === 'user' ? (
                      <div className="bg-[#E7FFDB] text-slate-900 rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs shadow-xs max-w-[80%] flex items-center space-x-1.5">
                        <span className="font-semibold">{chat.text}</span>
                        <span className="text-[9px] text-slate-400">5:07 PM</span>
                        <span className="text-sky-500 font-bold text-[10px]">✓✓</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-w-[92%]">
                        {/* Bot Bubble */}
                        <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm border border-slate-200/60 space-y-2">
                          {chat.header && (
                            <div className="font-black text-xs text-slate-900 border-b border-slate-100 pb-1.5">
                              {chat.header}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed font-normal">
                            {chat.text}
                          </div>
                          <div className="flex items-center justify-end text-[9px] text-slate-400">
                            <span>5:07 PM</span>
                          </div>
                        </div>

                        {/* Interactive Action Buttons */}
                        {chat.buttons && (
                          <div className="space-y-1">
                            {chat.buttons.map((btn, bIdx) => (
                              <button
                                key={bIdx}
                                type="button"
                                onClick={() => handleSimulateMessage(btn)}
                                className="w-full bg-white hover:bg-slate-50 transition-colors py-2 px-3 rounded-xl border border-slate-200 text-[#075E54] text-xs font-bold flex items-center justify-center space-x-1.5 shadow-2xs"
                              >
                                <span>{btn}</span>
                                <ExternalLink className="w-3 h-3 text-[#075E54]/70" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Interactive Input Bar */}
              <div className="bg-[#F0F2F5] p-2.5 flex items-center space-x-2 border-t border-slate-200">
                <input
                  type="text"
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && simInput.trim() && handleSimulateMessage(simInput)}
                  placeholder="Type 'Hi' or ask a question..."
                  className="flex-1 bg-white px-3.5 py-1.5 rounded-full text-xs border border-slate-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => simInput.trim() && handleSimulateMessage(simInput)}
                  className="w-8 h-8 rounded-full bg-[#075E54] text-white flex items-center justify-center shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
