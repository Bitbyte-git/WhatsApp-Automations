import React, { useState, useEffect } from 'react';
import {
  Bot,
  Save,
  Plus,
  Trash2,
  FileText,
  MessageSquare,
  Sparkles,
  Send,
  User,
  Zap,
  CheckCircle,
  AlertCircle,
  Headphones,
  ListChecks,
} from 'lucide-react';
import { api } from '../services/api';
import { ChatbotConfig, KnowledgeDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';

export const ChatbotView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  // Form State (Only Real Database Fields)
  const [isEnabled, setIsEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [handoverEnabled, setHandoverEnabled] = useState(true);
  const [handoverKeywords, setHandoverKeywords] = useState('');
  const [handoverMessage, setHandoverMessage] = useState('');

  // Dynamic Interactive Menu & Button Flow State (Zero hardcoded business text)
  const [flowEnabled, setFlowEnabled] = useState(false);
  const [flowHeader, setFlowHeader] = useState('');
  const [flowWelcome, setFlowWelcome] = useState('');
  const [flowButtonLabel, setFlowButtonLabel] = useState('Explore Menu');
  const [flowFooter, setFlowFooter] = useState('');
  const [menuItems, setMenuItems] = useState<Array<{ id: string; title: string; description: string; reply_text: string }>>([]);
  const [actionButtons, setActionButtons] = useState<Array<{ id: string; title: string; reply_text: string }>>([]);

  // Document Modal State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'TEXT' | 'FAQ' | 'DOCUMENT'>('TEXT');
  const [docContent, setDocContent] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  // Live Chatbot Simulator (Calls Backend API)
  const [simMessages, setSimMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I am your automated assistant. Ask me anything based on our knowledge documents.' },
  ]);
  const [simInput, setSimInput] = useState('');
  const [simLoading, setSimLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cfgRes, docsRes] = await Promise.all([
        api.getChatbotConfig(),
        api.getKnowledgeDocs(),
      ]);

      const cfgList = cfgRes?.results || (Array.isArray(cfgRes) ? cfgRes : [cfgRes]);
      const currentCfg = cfgList[0] || null;
      setConfig(currentCfg);

      if (currentCfg) {
        setIsEnabled(currentCfg.is_enabled);
        setWelcomeMessage(currentCfg.welcome_message || '');
        setFallbackMessage(currentCfg.fallback_message || '');
        setHandoverEnabled(currentCfg.handover_enabled ?? true);
        setHandoverKeywords(currentCfg.handover_keywords || '');
        setHandoverMessage(currentCfg.handover_message || '');

        const flow = currentCfg.interactive_flow || {};
        setFlowEnabled(Boolean(flow.enabled));
        setFlowHeader(flow.header_text || '');
        setFlowWelcome(flow.welcome_text || '');
        setFlowButtonLabel(flow.menu_button_label || 'Explore Menu');
        setFlowFooter(flow.footer_text || '');
        setMenuItems(Array.isArray(flow.menu_items) ? flow.menu_items : []);
        setActionButtons(Array.isArray(flow.action_buttons) ? flow.action_buttons : []);
      }

      setDocs(docsRes?.results || (Array.isArray(docsRes) ? docsRes : []));
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const payload: any = {
        is_enabled: isEnabled,
        welcome_message: welcomeMessage,
        fallback_message: fallbackMessage,
        handover_enabled: handoverEnabled,
        handover_keywords: handoverKeywords,
        handover_message: handoverMessage,
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

      setAlertSuccess('Chatbot configuration saved successfully to database!');
      loadData();
    } catch (err: any) {
      setAlertError(err.message || 'Failed to save chatbot configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocLoading(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      await api.createKnowledgeDoc({
        title: docTitle,
        doc_type: docType,
        content: docContent,
        is_active: true,
      });

      setDocModalOpen(false);
      setDocTitle('');
      setDocContent('');
      setAlertSuccess('Knowledge document added successfully.');
      loadData();
    } catch (err: any) {
      setAlertError(err.message || 'Failed to add knowledge document.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document from the knowledge base?')) return;
    try {
      await api.deleteKnowledgeDoc(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  const handleSimulateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim() || simLoading) return;

    const userText = simInput.trim();
    setSimMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setSimInput('');
    setSimLoading(true);

    try {
      if (config?.id) {
        const res = await api.simulateChatbot(config.id, {
          message: userText,
          history: simMessages.slice(-6),
        });
        const botReply = res?.response || res?.message || fallbackMessage || 'No answer available.';
        setSimMessages((prev) => [...prev, { role: 'assistant', content: botReply }]);
      } else {
        const defaultReply = welcomeMessage || 'Chatbot configuration is not initialized yet.';
        setSimMessages((prev) => [...prev, { role: 'assistant', content: defaultReply }]);
      }
    } catch (err: any) {
      setSimMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message || 'Failed to query chatbot service.'}` },
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-50 text-[#075E54] border border-emerald-200">
              Interactive WhatsApp Bot
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-600 font-semibold">{user?.client_details?.name || 'Organization Bot'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            WhatsApp Auto-Reply & Knowledge Base
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure automated responses, welcome greetings, and human handover for incoming customer messages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDocModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#075E54] hover:bg-[#064E3B] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Document</span>
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

      {/* Main Grid: Settings (Left) + Sandbox Simulator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Bot Behavior & Greetings
              </h2>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#075E54] rounded"
                />
                <span className="text-xs font-bold text-slate-700">Enable Bot Auto-Reply</span>
              </label>
            </div>

            {/* Welcome Greeting */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Welcome Message (Sent on "Hi" or greeting)
              </label>
              <textarea
                rows={3}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="e.g. Hello! Welcome to our customer support. How can we assist you today?"
                className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] leading-relaxed text-slate-800"
              />
            </div>

            {/* Fallback Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Fallback Message (When question is unknown)
              </label>
              <textarea
                rows={2}
                value={fallbackMessage}
                onChange={(e) => setFallbackMessage(e.target.value)}
                placeholder="e.g. Thank you for your inquiry. Our team will get back to you shortly."
                className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] leading-relaxed text-slate-800"
              />
            </div>

            {/* Human Handover */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Human Agent Handover</h3>
                  <p className="text-[11px] text-slate-500">Forward conversation when customer requests a human.</p>
                </div>
                <input
                  type="checkbox"
                  checked={handoverEnabled}
                  onChange={(e) => setHandoverEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#075E54] rounded"
                />
              </div>

              {handoverEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Trigger Keywords (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={handoverKeywords}
                      onChange={(e) => setHandoverKeywords(e.target.value)}
                      placeholder="human, agent, representative, call, support"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Handover Response Message
                    </label>
                    <input
                      type="text"
                      value={handoverMessage}
                      onChange={(e) => setHandoverMessage(e.target.value)}
                      placeholder="Connecting you to our team. Please wait a moment."
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 rounded-xl bg-[#075E54] hover:bg-[#064E3B] text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>

          {/* Dynamic Interactive Menu & Button Flow Builder */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ListChecks className="w-4 h-4 text-[#075E54]" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Interactive Menu & Button Flow
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Customize the auto-reply menu & buttons sent when customers message "Hi".
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setFlowEnabled(true);
                    setFlowHeader('Sri Lakshmi Sarees');
                    setFlowWelcome('Vanakkam! Welcome to Sri Lakshmi Sarees. Tap below to explore our latest silk & designer saree collections:');
                    setFlowButtonLabel('View Collections');
                    setFlowFooter('Sri Lakshmi Sarees Showroom');
                    setMenuItems([
                      { id: 'item_1', title: 'Kanchipuram Silk', description: 'Pure Wedding Silk Sarees', reply_text: 'Pure Kanchipuram Wedding Silk Sarees starting from Rs. 4,500. Available in Bridal Red, Gold & Pastel shades.' },
                      { id: 'item_2', title: 'Banarasi & Soft Silk', description: 'Lightweight Festive Sarees', reply_text: 'Trendy Banarasi & Soft Silk Sarees starting from Rs. 2,200 with contrast blouse pieces.' },
                      { id: 'item_3', title: 'Cotton & Daily Wear', description: 'Chettinad & Linen Sarees', reply_text: 'Breathable Pure Cotton & Linen Sarees starting from Rs. 850. Ideal for office and daily wear.' },
                    ]);
                    setActionButtons([
                      { id: 'btn_1', title: 'Get Price Catalog', reply_text: 'Thank you! Our team will send you the latest saree photos & price catalog shortly.' },
                      { id: 'btn_2', title: 'Call Showroom', reply_text: 'Call or WhatsApp our showroom directly at +91 99444 95366. Open 10 AM - 9 PM.' },
                    ]);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#075E54] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Load Saree Shop Sample</span>
                </button>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flowEnabled}
                    onChange={(e) => setFlowEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#075E54] rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">Enable</span>
                </label>
              </div>
            </div>

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
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Menu Button Name *
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={flowButtonLabel}
                  onChange={(e) => setFlowButtonLabel(e.target.value)}
                  placeholder="e.g. View Collections"
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Welcome Message (Sent on "Hi") *
              </label>
              <textarea
                rows={2}
                value={flowWelcome}
                onChange={(e) => setFlowWelcome(e.target.value)}
                placeholder="Welcome to our store! Tap below to explore our products..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
            </div>

            {/* Menu List Options */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Menu Options ({menuItems.length}/10)
                </label>
                {menuItems.length < 10 && (
                  <button
                    type="button"
                    onClick={() =>
                      setMenuItems([
                        ...menuItems,
                        { id: `item_${Date.now()}`, title: '', description: '', reply_text: '' },
                      ])
                    }
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#075E54] text-white text-[11px] font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              {menuItems.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No menu options added yet. Click "+ Add Option" or "Load Saree Shop Sample".
                </p>
              ) : (
                <div className="space-y-3">
                  {menuItems.map((item, idx) => (
                    <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#075E54]">Option #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setMenuItems(menuItems.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete Option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          maxLength={24}
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...menuItems];
                            updated[idx].title = e.target.value;
                            setMenuItems(updated);
                          }}
                          placeholder="Option Title (max 24 chars)"
                          className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#075E54]"
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
                          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#075E54]"
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
                        placeholder="Reply message sent when customer taps this option..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#075E54]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Follow-up Action Buttons */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Follow-up Action Buttons ({actionButtons.length}/2 + Main Menu)
                </label>
                {actionButtons.length < 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setActionButtons([
                        ...actionButtons,
                        { id: `btn_${Date.now()}`, title: '', reply_text: '' },
                      ])
                    }
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Button</span>
                  </button>
                )}
              </div>

              {actionButtons.map((btn, idx) => (
                <div key={btn.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
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
                      placeholder="Button Label (max 20 chars, e.g. Call Showroom)"
                      className="flex-1 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#075E54]"
                    />
                    <button
                      type="button"
                      onClick={() => setActionButtons(actionButtons.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-1"
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
                    placeholder="Reply message sent when customer taps this button (e.g. Call +91...)..."
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#075E54]"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={(e) => handleSaveConfig(e as any)}
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#075E54] to-[#25D366] text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Flow...' : 'Save Interactive Button Flow'}</span>
            </button>
          </div>

          {/* Knowledge Base Documents List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Knowledge Documents & FAQs
                </h3>
                <p className="text-[11px] text-slate-500">Real documents used by the bot to answer customer questions.</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">{docs.length} Active Documents</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading documents...</div>
            ) : docs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No knowledge documents yet.</p>
                <p>Click "Add Knowledge Document" above to upload business FAQs, service info, or price lists.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {docs.map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 uppercase">
                          {doc.doc_type}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{doc.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Real Interactive Simulator (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[580px]">
            {/* Header */}
            <div className="px-4 py-3 bg-[#075E54] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-[#25D366]" />
                <span className="text-xs font-bold">Bot Sandbox Simulator</span>
              </div>
              <button
                type="button"
                onClick={() => setSimMessages([{ role: 'assistant', content: 'Chat history reset. How can I help?' }])}
                className="text-[10px] text-emerald-200 hover:text-white"
              >
                Clear
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50/60">
              {simMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#075E54] text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {simLoading && (
                <div className="flex items-center space-x-1 text-slate-400 text-xs py-1">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-200" />
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSimulateChat} className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
              <button
                type="submit"
                disabled={simLoading || !simInput.trim()}
                className="p-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal: Add Knowledge Document */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Add Knowledge Document"
      >
        <form onSubmit={handleAddDocument} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Service Pricing & Delivery Policy"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Type *
            </label>
            <select
              value={docType}
              onChange={(e: any) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] bg-white"
            >
              <option value="TEXT">General Business Info</option>
              <option value="FAQ">FAQ (Question & Answer)</option>
              <option value="DOCUMENT">Policy / Catalog Document</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Content *
            </label>
            <textarea
              required
              rows={6}
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Enter facts, service descriptions, answers to customer questions..."
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54] leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setDocModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={docLoading}
              className="px-4 py-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
            >
              {docLoading ? 'Saving...' : 'Add Document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
