import React, { useState, useEffect } from 'react';
import {
  Bot,
  Save,
  Plus,
  Trash2,
  FileText,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Send,
  User,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { ChatbotConfig, KnowledgeDocument, WhatsAppAccount } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const ChatbotView: React.FC = () => {
  const { user, activeTenantId } = useAuth();
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [isEnabled, setIsEnabled] = useState(false);
  const [provider, setProvider] = useState<'OPENROUTER' | 'OPENAI'>('OPENROUTER');
  const [modelName, setModelName] = useState('openai/gpt-oss-20b');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [handoverEnabled, setHandoverEnabled] = useState(true);
  const [handoverKeywords, setHandoverKeywords] = useState('');
  const [handoverMessage, setHandoverMessage] = useState('');
  const [maxTokens, setMaxTokens] = useState(500);
  const [temperature, setTemperature] = useState(0.7);

  // Document Modal State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'TEXT' | 'FAQ' | 'DOCUMENT'>('TEXT');
  const [docContent, setDocContent] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  // Chatbot Sandbox Simulator
  const [simMessages, setSimMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I am your AI Business Assistant. Ask me anything about our company based on the active knowledge documents.' }
  ]);
  const [simInput, setSimInput] = useState('');
  const [simLoading, setSimLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cfgRes, docsRes, accsRes] = await Promise.all([
        api.getChatbotConfig(),
        api.getKnowledgeDocs(),
        api.getWhatsAppAccounts(activeTenantId ? `client_id=${activeTenantId}` : ''),
      ]);

      const cfgList = cfgRes.results || cfgRes || [];
      const currentCfg = cfgList[0] || null;
      setConfig(currentCfg);

      if (currentCfg) {
        setIsEnabled(currentCfg.is_enabled);
        setProvider(currentCfg.provider);
        setModelName(currentCfg.model_name);
        setSystemPrompt(currentCfg.system_prompt);
        setWelcomeMessage(currentCfg.welcome_message);
        setFallbackMessage(currentCfg.fallback_message);
        setHandoverEnabled(currentCfg.handover_enabled);
        setHandoverKeywords(currentCfg.handover_keywords);
        setHandoverMessage(currentCfg.handover_message);
        setMaxTokens(currentCfg.max_tokens);
        setTemperature(currentCfg.temperature);
      }

      setDocs(docsRes.results || docsRes || []);
      setAccounts(accsRes.results || accsRes || []);
    } catch {
      setConfig(null);
      setDocs([]);
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
    setSaveSuccess(false);

    try {
      const payload: any = {
        is_enabled: isEnabled,
        provider,
        model_name: modelName,
        system_prompt: systemPrompt,
        welcome_message: welcomeMessage,
        fallback_message: fallbackMessage,
        handover_enabled: handoverEnabled,
        handover_keywords: handoverKeywords,
        handover_message: handoverMessage,
        max_tokens: maxTokens,
        temperature,
      };

      if (config) {
        await api.updateChatbotConfig(config.id, payload);
      } else {
        if (user?.role === 'SUPERADMIN' && activeTenantId) {
          payload.client = parseInt(activeTenantId);
        }
        await api.createChatbotConfig(payload);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save chatbot settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocLoading(true);

    try {
      const payload: any = {
        title: docTitle,
        content_type: docType,
        content: docContent,
        chatbot: config?.id,
      };
      if (user?.role === 'SUPERADMIN' && activeTenantId) {
        payload.client = parseInt(activeTenantId);
      }
      await api.createKnowledgeDoc(payload);
      setDocModalOpen(false);
      setDocTitle('');
      setDocContent('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add knowledge document.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!confirm('Are you sure you want to remove this knowledge document?')) return;
    try {
      await api.deleteKnowledgeDoc(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim() || !config || simLoading) return;

    const query = simInput.trim();
    setSimMessages(prev => [...prev, { role: 'user', content: query }]);
    setSimInput('');
    setSimLoading(true);

    try {
      const res = await api.simulateChatbot(config.id, {
        message: query,
        history: simMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      });
      setSimMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
    } catch (err: any) {
      setSimMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Error executing AI response.' }]);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">AI WhatsApp Chatbot</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure autonomous customer support, company knowledge bases, and human agent handover.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center cursor-pointer space-x-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-subtle text-xs font-semibold">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className={isEnabled ? 'text-emerald-700' : 'text-gray-500'}>
              {isEnabled ? 'Chatbot Active' : 'Chatbot Disabled'}
            </span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Settings */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Model & Provider Settings</h3>
              {saveSuccess && (
                <span className="text-emerald-600 font-semibold text-xs">Settings saved successfully!</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">AI Provider</label>
                <select
                  value={provider}
                  onChange={(e: any) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="OPENROUTER">OpenRouter (Multi-model)</option>
                  <option value="OPENAI">OpenAI Direct</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Model Name</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. openai/gpt-oss-20b"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                System Instructions & Personality *
              </label>
              <textarea
                rows={3}
                required
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Instructions on role, tone, and guidelines for answering customer queries..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Welcome Message</label>
                <textarea
                  rows={2}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Hello! How may we assist you?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Fallback Message</label>
                <textarea
                  rows={2}
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  placeholder="I cannot answer that. An agent will assist you."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Human Handover */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Human Agent Handover</h4>
                  <p className="text-[11px] text-gray-500">Detect customer keywords to hand over chat to human executives.</p>
                </div>
                <input
                  type="checkbox"
                  checked={handoverEnabled}
                  onChange={(e) => setHandoverEnabled(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {handoverEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Trigger Keywords</label>
                    <input
                      type="text"
                      value={handoverKeywords}
                      onChange={(e) => setHandoverKeywords(e.target.value)}
                      placeholder="human, agent, executive, support"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Handover Reply</label>
                    <input
                      type="text"
                      value={handoverMessage}
                      onChange={(e) => setHandoverMessage(e.target.value)}
                      placeholder="Connecting you to our team..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>

          {/* Knowledge Base Documents */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 uppercase tracking-wider">Tenant Knowledge Base</h3>
                <p className="text-[11px] text-gray-500">
                  Documents used as factual ground truth. The bot never invents prices or product specs.
                </p>
              </div>
              <button
                onClick={() => setDocModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Document
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {docs.length === 0 ? (
                <p className="text-gray-400 py-6 text-center">No knowledge documents uploaded yet.</p>
              ) : (
                docs.map((doc) => (
                  <div key={doc.id} className="py-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-gray-800">{doc.title}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded uppercase font-bold">
                          {doc.content_type}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1 line-clamp-2 max-w-lg">{doc.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Sandbox Simulator */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-card h-[650px] overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-emerald-50/50 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-emerald-700" />
              <div>
                <h4 className="font-bold text-xs text-gray-900">Chatbot Sandbox Simulator</h4>
                <p className="text-[10px] text-gray-500">Live AI test against your active knowledge base</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              TEST MODE
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 text-xs">
            {simMessages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#DCF8C6] text-gray-900 rounded-tr-none'
                      : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {simLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center space-x-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSimulate} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2 shrink-0">
            <input
              type="text"
              placeholder="Test a customer question..."
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              className="flex-1 py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={simLoading || !simInput.trim() || !config}
              className="p-2.5 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Add Knowledge Document Modal */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Add Tenant Knowledge Base Document"
      >
        <form onSubmit={handleCreateDocument} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Return & Refund Policy 2026"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Content Type</label>
            <select
              value={docType}
              onChange={(e: any) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
            >
              <option value="TEXT">Custom Text / Knowledge Article</option>
              <option value="FAQ">FAQ Q&A Pair</option>
              <option value="DOCUMENT">Policy / Specifications</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">Document Content *</label>
            <textarea
              rows={6}
              required
              placeholder="Provide exact facts, answers, or terms..."
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setDocModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={docLoading}
              className="px-4 py-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl font-semibold shadow-sm disabled:opacity-50"
            >
              {docLoading ? 'Uploading...' : 'Save Knowledge Document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
