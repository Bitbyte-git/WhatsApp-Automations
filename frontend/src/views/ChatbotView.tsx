import React, { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ListChecks,
  CheckCheck,
  List,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { ChatbotConfig } from '../types';
import { useAuth } from '../context/AuthContext';

export const ChatbotView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  // Dynamic Interactive Menu & Button Flow State
  const [flowEnabled, setFlowEnabled] = useState(false);
  const [flowHeader, setFlowHeader] = useState('');
  const [flowWelcome, setFlowWelcome] = useState('');
  const [flowButtonLabel, setFlowButtonLabel] = useState('Explore Menu');
  const [flowFooter, setFlowFooter] = useState('');
  interface SubOption {
    id: string;
    title: string;
    description: string;
    reply_text: string;
  }

  interface MenuOption {
    id: string;
    title: string;
    description: string;
    reply_text: string;
    sub_button_label?: string;
    sub_items?: SubOption[];
  }

  const [menuItems, setMenuItems] = useState<MenuOption[]>([]);
  const [actionButtons, setActionButtons] = useState<Array<{ id: string; title: string; reply_text: string }>>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cfgRes = await api.getChatbotConfig();
      const cfgList = cfgRes?.results || (Array.isArray(cfgRes) ? cfgRes : [cfgRes]);
      const currentCfg = cfgList[0] || null;
      setConfig(currentCfg);

      if (currentCfg) {
        const flow = currentCfg.interactive_flow || {};
        setFlowEnabled(Boolean(flow.enabled));
        setFlowHeader(flow.header_text || '');
        setFlowWelcome(flow.welcome_text || '');
        setFlowButtonLabel(flow.menu_button_label || 'Explore Menu');
        setFlowFooter(flow.footer_text || '');
        setMenuItems(Array.isArray(flow.menu_items) ? flow.menu_items : []);
        setActionButtons(Array.isArray(flow.action_buttons) ? flow.action_buttons : []);
      }
    } catch {
      // ignore transient error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId]);

  const handleSaveFlow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const payload: any = {
        is_enabled: config?.is_enabled ?? false,
        welcome_message: flowWelcome.trim() || config?.welcome_message || 'Welcome!',
        interactive_flow: {
          enabled: flowEnabled,
          header_text: flowHeader.trim(),
          welcome_text: flowWelcome.trim(),
          menu_button_label: flowButtonLabel.trim() || 'Explore Menu',
          footer_text: flowFooter.trim(),
          menu_items: menuItems.filter((m) => m.title.trim()),
          action_buttons: actionButtons.filter((b) => b.title.trim()),
        },
      };

      if (config?.id) {
        await api.updateChatbotConfig(config.id, payload);
      } else {
        await api.createChatbotConfig(payload);
      }

      setAlertSuccess('Interactive Menu & Button Flow saved successfully!');
      loadData();
    } catch (err: any) {
      setAlertError(err.message || 'Failed to save Interactive Flow.');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSample = () => {
    setFlowEnabled(true);
    setFlowHeader('BitByte Mobile World');
    setFlowWelcome('Welcome to BitByte Mobile World! Tap below to explore our latest smartphones, used mobiles & accessories:');
    setFlowButtonLabel('Explore Mobiles');
    setFlowFooter('Open 10 AM - 9:30 PM | All Days');
    setMenuItems([
      {
        id: 'item_new',
        title: 'New Smartphones',
        description: 'Vivo, Oppo, iPhone & Moto',
        reply_text: 'Select your favorite brand below to check latest models & rates:',
        sub_button_label: 'Select Brand',
        sub_items: [
          { id: 'sub_vivo', title: 'Vivo 5G', description: 'V30, T3 & Y-Series', reply_text: 'Vivo Latest Rates:\n• Vivo Y200e 5G: Rs. 19,999\n• Vivo V30 5G: Rs. 33,999\n0% EMI & Exchange Bonus Available!' },
          { id: 'sub_oppo', title: 'Oppo 5G', description: 'Reno & F-Series', reply_text: 'Oppo Latest Rates:\n• Oppo F25 Pro 5G: Rs. 23,999\n• Oppo Reno 11 5G: Rs. 29,999' },
          { id: 'sub_iphone', title: 'Apple iPhone', description: 'iPhone 13, 14, 15 & 16', reply_text: 'Apple iPhone Rates:\n• iPhone 13 (128GB): Rs. 48,999\n• iPhone 15 (128GB): Rs. 68,999\n• iPhone 16 (128GB): Rs. 79,900' },
          { id: 'sub_moto', title: 'Motorola 5G', description: 'Edge & G-Series', reply_text: 'Motorola Latest Rates:\n• Moto G64 5G: Rs. 14,999\n• Moto Edge 50 Fusion: Rs. 22,999' },
        ],
      },
      {
        id: 'item_used',
        title: 'Used Mobiles',
        description: 'Certified Phones with Warranty',
        reply_text: 'Choose your budget range below to see available Certified Used Mobiles:',
        sub_button_label: 'Select Budget',
        sub_items: [
          { id: 'sub_4k', title: 'Rs. 4,000 - 10,000', description: 'Budget 4G & 5G Used Phones', reply_text: 'Used Mobiles (Rs. 4,000 - 10,000):\n• Redmi Note 11: Rs. 6,999\n• Realme Narzo 50: Rs. 7,499\n• Vivo Y21: Rs. 6,499\n(With 6-Month Shop Warranty!)' },
          { id: 'sub_11k', title: 'Rs. 11,000 Above', description: 'Premium Used iPhones & 5G', reply_text: 'Premium Used Mobiles (Rs. 11,000+):\n• OnePlus Nord CE 3: Rs. 15,500\n• Samsung S22 5G: Rs. 26,999\n• iPhone 13 (Mint): Rs. 34,500\n(With 6-Month Shop Warranty!)' },
        ],
      },
      {
        id: 'item_acc',
        title: 'Mobile Accessories',
        description: 'Chargers, Earbuds & Watches',
        reply_text: 'Original Fast Chargers, TWS Earbuds, Smartwatches & Cases starting from Rs. 299!',
        sub_button_label: 'Select Option',
        sub_items: [],
      },
    ]);
    setActionButtons([
      {
        id: 'btn_1',
        title: 'Check Price & Stock',
        reply_text: 'Thank you! Our mobile expert will confirm stock availability shortly. WhatsApp: +91 99444 95366.',
      },
      {
        id: 'btn_2',
        title: 'Call Showroom',
        reply_text: 'Call or WhatsApp our Mobile Showroom directly at +91 99444 95366. Open 10 AM - 9:30 PM.',
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Studio Header */}
      <div className="bg-white px-6 py-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-emerald-50 text-[#075E54] border border-emerald-200/70">
              <ShieldCheck className="w-3.5 h-3.5 text-[#075E54]" />
              <span>Auto-Reply Button Flow</span>
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              {user?.client_details?.name || 'BitByte Official'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            Interactive WhatsApp Bot
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#075E54] bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200/70 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Flow</span>
          </button>
          <button
            type="button"
            onClick={() => setFlowEnabled(!flowEnabled)}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
              flowEnabled
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${flowEnabled ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
            <span>{flowEnabled ? 'Bot Active (ON)' : 'Bot Paused (Click to Enable)'}</span>
          </button>
        </div>
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

      {/* Two Column Studio: Builder (Left) + Live WhatsApp Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={handleSaveFlow} className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ListChecks className="w-4 h-4 text-[#075E54]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. Welcome Greeting & Menu Button
              </h2>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading saved flow...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Business Header *
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={flowHeader}
                      onChange={(e) => setFlowHeader(e.target.value)}
                      placeholder="e.g. Sri Lakshmi Sarees"
                      className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Menu Button Label *
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={flowButtonLabel}
                      onChange={(e) => setFlowButtonLabel(e.target.value)}
                      placeholder="e.g. View Collections"
                      className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Welcome Message (Sent on "Hi") *
                  </label>
                  <textarea
                    rows={3}
                    value={flowWelcome}
                    onChange={(e) => setFlowWelcome(e.target.value)}
                    placeholder="Welcome to our shop! Tap below to explore our products and services..."
                    className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Footer Note (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={flowFooter}
                    onChange={(e) => setFlowFooter(e.target.value)}
                    placeholder="e.g. Open 10 AM - 9 PM"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                  />
                </div>
              </>
            )}
          </div>

          {/* 2. Menu Options */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Menu Options ({menuItems.length}/10)
              </h2>
              {menuItems.length < 10 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!flowEnabled && menuItems.length === 0) setFlowEnabled(true);
                    setMenuItems([
                      ...menuItems,
                      { id: `item_${Date.now()}`, title: '', description: '', reply_text: '' },
                    ]);
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#075E54] hover:bg-[#064E3B] text-white text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            {menuItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No menu options yet. Click "Add Option" or "Load Sample Flow".
              </div>
            ) : (
              <div className="space-y-3">
                {menuItems.map((item, idx) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#075E54] uppercase">Option {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setMenuItems(menuItems.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete Option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        maxLength={24}
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[idx].title = e.target.value;
                          setMenuItems(updated);
                        }}
                        placeholder="Title (max 24 chars)"
                        className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#075E54]"
                      />
                      <input
                        type="text"
                        maxLength={72}
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[idx].description = e.target.value;
                          setMenuItems(updated);
                        }}
                        placeholder="Short Description"
                        className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#075E54]"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={item.reply_text}
                      onChange={(e) => {
                        const updated = [...menuItems];
                        updated[idx].reply_text = e.target.value;
                        setMenuItems(updated);
                      }}
                      placeholder={
                        (item.sub_items?.length || 0) > 0
                          ? 'Intro text shown above sub-menu (e.g. Select a brand below:)'
                          : 'Reply message when customer selects this option...'
                      }
                      className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#075E54]"
                    />

                    {/* Per-Option Sub-Menu Builder */}
                    <div className="pt-2 border-t border-slate-200/80 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Sub-Options under "{item.title || `Option ${idx + 1}`}" ({item.sub_items?.length || 0}/9)
                        </span>
                        {(item.sub_items?.length || 0) < 9 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...menuItems];
                              const currSubs = updated[idx].sub_items || [];
                              updated[idx].sub_items = [
                                ...currSubs,
                                { id: `sub_${Date.now()}`, title: '', description: '', reply_text: '' },
                              ];
                              setMenuItems(updated);
                            }}
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-[#075E54] text-[10px] font-bold transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Sub-Option</span>
                          </button>
                        )}
                      </div>

                      {(item.sub_items?.length || 0) > 0 && (
                        <div className="space-y-2 pl-3 border-l-2 border-emerald-400">
                          <input
                            type="text"
                            maxLength={20}
                            value={item.sub_button_label || ''}
                            onChange={(e) => {
                              const updated = [...menuItems];
                              updated[idx].sub_button_label = e.target.value;
                              setMenuItems(updated);
                            }}
                            placeholder="Sub-Menu Button Label (e.g. Select Brand)"
                            className="w-full px-2.5 py-1.5 text-[11px] font-bold bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-[#075E54]"
                          />
                          {(item.sub_items || []).map((sub, sIdx) => (
                            <div key={sub.id} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-700">Sub-Option #{sIdx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...menuItems];
                                    updated[idx].sub_items = (updated[idx].sub_items || []).filter((_, j) => j !== sIdx);
                                    setMenuItems(updated);
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                <input
                                  type="text"
                                  maxLength={24}
                                  value={sub.title}
                                  onChange={(e) => {
                                    const updated = [...menuItems];
                                    if (updated[idx].sub_items?.[sIdx]) {
                                      updated[idx].sub_items![sIdx].title = e.target.value;
                                    }
                                    setMenuItems(updated);
                                  }}
                                  placeholder="Sub-Title (e.g. iPhone / Rs. 4000+)"
                                  className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded-md focus:outline-none focus:border-[#075E54]"
                                />
                                <input
                                  type="text"
                                  maxLength={72}
                                  value={sub.description}
                                  onChange={(e) => {
                                    const updated = [...menuItems];
                                    if (updated[idx].sub_items?.[sIdx]) {
                                      updated[idx].sub_items![sIdx].description = e.target.value;
                                    }
                                    setMenuItems(updated);
                                  }}
                                  placeholder="Short Description"
                                  className="px-2.5 py-1 text-[11px] border border-slate-200 rounded-md focus:outline-none focus:border-[#075E54]"
                                />
                              </div>
                              <textarea
                                rows={2}
                                value={sub.reply_text}
                                onChange={(e) => {
                                  const updated = [...menuItems];
                                  if (updated[idx].sub_items?.[sIdx]) {
                                    updated[idx].sub_items![sIdx].reply_text = e.target.value;
                                  }
                                  setMenuItems(updated);
                                }}
                                placeholder="Rate / Details shown when customer taps this sub-option..."
                                className="w-full p-2 text-[11px] border border-slate-200 rounded-md focus:outline-none focus:border-[#075E54]"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Follow-up Action Buttons */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. Follow-up Action Buttons ({actionButtons.length}/2 + Main Menu)
              </h2>
              {actionButtons.length < 2 && (
                <button
                  type="button"
                  onClick={() =>
                    setActionButtons([
                      ...actionButtons,
                      { id: `btn_${Date.now()}`, title: '', reply_text: '' },
                    ])
                  }
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Button</span>
                </button>
              )}
            </div>

            {actionButtons.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Optional: Add buttons like "Get Pricing" or "Call Showroom".
              </div>
            ) : (
              <div className="space-y-3">
                {actionButtons.map((btn, idx) => (
                  <div key={btn.id} className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        maxLength={20}
                        value={btn.title}
                        onChange={(e) => {
                          const updated = [...actionButtons];
                          updated[idx].title = e.target.value;
                          setActionButtons(updated);
                        }}
                        placeholder="Button Label (max 20 chars)"
                        className="flex-1 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#075E54]"
                      />
                      <button
                        type="button"
                        onClick={() => setActionButtons(actionButtons.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={btn.reply_text}
                      onChange={(e) => {
                        const updated = [...actionButtons];
                        updated[idx].reply_text = e.target.value;
                        setActionButtons(updated);
                      }}
                      placeholder="Reply sent when customer taps this button (e.g. Call +91...)..."
                      className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#075E54]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#075E54] to-[#25D366] text-white font-extrabold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Interactive Flow...' : 'Save Interactive Button Flow'}</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live WhatsApp Preview */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
            <div className="flex justify-center mb-3">
              <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
              </div>
            </div>

            <div className="bg-[#EFEAE2] rounded-[28px] overflow-hidden border border-slate-700 flex flex-col min-h-[500px] shadow-inner">
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-xs">
                    {(flowHeader || 'BB').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{flowHeader || 'Your Business'}</p>
                    <p className="text-[10px] text-emerald-200 font-medium">Official WhatsApp Bot</p>
                  </div>
                </div>
                <PhoneCall className="w-4 h-4 text-white/80" />
              </div>

              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                <div className="flex justify-end">
                  <div className="bg-[#D9FDD3] text-slate-900 px-3 py-1.5 rounded-xl rounded-tr-xs text-xs font-medium shadow-2xs flex items-center gap-1.5">
                    <span>Hi</span>
                    <CheckCheck className="w-3 h-3 text-sky-500" />
                  </div>
                </div>

                {/* Bot Reply Bubble */}
                <div className="bg-white rounded-2xl rounded-tl-xs shadow-sm max-w-[92%] border border-slate-200/60 overflow-hidden">
                  <div className="p-3 space-y-1.5">
                    {flowHeader && (
                      <p className="text-xs font-bold text-slate-900">{flowHeader}</p>
                    )}
                    <p className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {flowWelcome || 'Your welcome message will appear here...'}
                    </p>
                    {flowFooter && (
                      <p className="text-[10px] text-slate-400">{flowFooter}</p>
                    )}
                  </div>
                  <div className="border-t border-slate-100 py-2.5 px-3 flex items-center justify-center space-x-1.5 text-[#075E54] text-xs font-bold bg-slate-50/50">
                    <List className="w-3.5 h-3.5" />
                    <span>{flowButtonLabel || 'Explore Menu'}</span>
                  </div>
                </div>

                {/* Preview of Options inside Menu */}
                {menuItems.length > 0 && (
                  <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5 max-w-[92%]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Menu List Preview ({menuItems.length})
                    </p>
                    {menuItems.slice(0, 5).map((m, i) => (
                      <div key={m.id || i} className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-[11px] font-bold text-slate-800">{m.title || `Option ${i + 1}`}</p>
                        {m.description && (
                          <p className="text-[10px] text-slate-500 truncate">{m.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
