import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Smartphone,
  User,
  MoreVertical,
  Smile,
  Image,
  RefreshCw,
  Phone,
  FileCode,
  Sparkles,
  Info,
  X,
  MessageSquare,
} from 'lucide-react';
import { InboxListSkeleton, ChatMessagesSkeleton } from '../components/Skeleton';
import { api } from '../services/api';
import { Conversation, Message, WhatsAppAccount } from '../types';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export const InboxView: React.FC = () => {
  const { activeTenantId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Template Modal State
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConvRef = useRef<Conversation | null>(null);
  selectedConvRef.current = selectedConv;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTenantId) params.append('client_id', activeTenantId);
      if (search) params.append('search', search);
      if (selectedAccountId) params.append('whatsapp_account_id', selectedAccountId);

      const res = await api.getConversations(params.toString());
      const convList: Conversation[] = res.results || [];
      setConversations(convList);

      if (convList.length > 0 && !selectedConvRef.current) {
        setSelectedConv(convList[0]);
      }
    } catch {
      if (!silent) setConversations([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const tenantParam = activeTenantId ? `client_id=${activeTenantId}` : '';
      const res = await api.getWhatsAppAccounts(tenantParam);
      setAccounts(res.results || []);
    } catch {}
  };

  const loadMessages = async (convId: number, silent = false) => {
    if (!silent) setMessagesLoading(true);
    try {
      const res = await api.getMessages(convId);
      const newMessages: Message[] = res.results || res || [];
      setMessages(newMessages);
    } catch {
      if (!silent) setMessages([]);
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAccounts();
    loadConversations();
  }, [activeTenantId, search, selectedAccountId]);

  // When selected conversation changes
  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
      api.markConversationRead(selectedConv.id).catch(() => {});
    }
  }, [selectedConv?.id]);

  // Auto-scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Real-Time Background Polling (Every 3.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Silently update conversation list for unread counts & recent messages
      loadConversations(true);

      // 2. Silently update active conversation messages
      if (selectedConvRef.current) {
        api.getMessages(selectedConvRef.current.id)
          .then((res) => {
            const freshMessages: Message[] = res.results || res || [];
            setMessages((prev) => {
              if (
                freshMessages.length !== prev.length ||
                (freshMessages.length > 0 &&
                  prev.length > 0 &&
                  freshMessages[freshMessages.length - 1]?.id !== prev[prev.length - 1]?.id)
              ) {
                return freshMessages;
              }
              // Check if any message status changed (e.g. SENT -> DELIVERED -> READ)
              const hasStatusDiff = freshMessages.some(
                (fm, idx) => prev[idx] && fm.status !== prev[idx].status
              );
              if (hasStatusDiff) return freshMessages;
              return prev;
            });
          })
          .catch(() => {});
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [activeTenantId, selectedAccountId]);

  // Calculate 24-Hour Customer Window
  const lastInboundMsg = [...messages].reverse().find((m) => m.direction === 'INBOUND');
  const nowMs = Date.now();
  let is24HourWindowActive = false;
  let hoursRemaining = 0;

  if (lastInboundMsg?.created_at) {
    const inboundTime = new Date(lastInboundMsg.created_at).getTime();
    const diffHours = (nowMs - inboundTime) / (1000 * 60 * 60);
    if (diffHours < 24) {
      is24HourWindowActive = true;
      hoursRemaining = Math.max(0, Math.floor(24 - diffHours));
    }
  }

  // Load Templates for quick re-engagement
  const handleOpenTemplatesModal = async () => {
    setTemplateModalOpen(true);
    setTemplatesLoading(true);
    try {
      const res = await api.getTemplates();
      const list = res.results || res || [];
      setTemplates(list.filter((t: any) => t.status === 'APPROVED' || !t.status));
    } catch {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Send an approved Meta Template Message
  const handleSendTemplate = async (tmpl: any) => {
    if (!selectedConv || sendingTemplate) return;
    setSendingTemplate(true);
    setToast(null);

    try {
      const res = await api.sendMessage({
        conversation_id: selectedConv.id,
        message_type: 'TEMPLATE',
        template_name: tmpl.name,
        language_code: tmpl.language || 'en_US',
        content: `Template: ${tmpl.name}`,
      });

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setTemplateModalOpen(false);
        setToast({ type: 'success', text: `Template "${tmpl.name}" sent! 24h customer window re-opened.` });
        loadConversations(true);
      } else {
        setToast({ type: 'error', text: res.error || 'Failed to dispatch template.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Error dispatching template.' });
    } finally {
      setSendingTemplate(false);
    }
  };

  // Send Free-Form Text Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv || sending) return;

    setSending(true);
    setToast(null);
    try {
      const res = await api.sendMessage({
        conversation_id: selectedConv.id,
        content: replyText.trim(),
        message_type: 'TEXT',
      });

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setReplyText('');
        loadConversations(true);
      } else {
        setToast({ type: 'error', text: res.error || 'Failed to send message via Meta Cloud API.' });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err.message || 'Error sending message. Check Meta Cloud API credentials or 24h window.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold shadow-sm transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-600 px-1 rounded-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Inbox Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden flex h-[calc(100vh-140px)]">
        {/* Left Column: Conversation List */}
        <div className="w-80 md:w-96 border-r border-gray-200 flex flex-col bg-white shrink-0">
          {/* Header & Filter */}
          <div className="p-3.5 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-gray-900">WhatsApp Inbox</h3>
                <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live</span>
                </span>
              </div>
              <button
                onClick={() => loadConversations()}
                className="p-1 text-gray-400 hover:text-emerald-700 rounded transition-colors"
                title="Refresh messages now"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            {accounts.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs font-semibold text-[#075E54]">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate font-mono">{accounts[0].business_name} ({accounts[0].phone_number})</span>
              </div>
            )}
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <InboxListSkeleton count={6} />
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                <p className="font-semibold text-gray-600">No active conversations</p>
                <p className="mt-1">Real incoming WhatsApp chats received via Meta webhooks will appear here.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/70 border-l-4 border-[#25D366]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#075E54] flex items-center justify-center font-bold text-xs shrink-0">
                      {conv.contact?.name?.charAt(0) || <User className="w-5 h-5 text-[#075E54]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {conv.contact?.name || conv.contact?.phone_number}
                        </span>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(conv.last_message_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {conv.last_message_preview || 'No messages yet'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400 font-mono truncate">
                          {conv.whatsapp_account?.business_name || conv.contact?.phone_number}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="px-1.5 py-0.2 bg-[#25D366] text-white text-[10px] font-bold rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Thread */}
        <div className="flex-1 flex flex-col bg-[#F5F7F8]">
          {selectedConv ? (
            <>
              {/* Chat Thread Header */}
              <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-subtle">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#075E54] flex items-center justify-center font-bold text-sm">
                    {selectedConv.contact?.name?.charAt(0) || <User className="w-5 h-5 text-[#075E54]" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {selectedConv.contact?.name || selectedConv.contact?.phone_number}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-gray-500">
                      <span className="font-mono">{selectedConv.contact?.phone_number}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">
                        via {selectedConv.whatsapp_account?.business_name || 'WhatsApp Business'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Meta 24-Hour Window Status Indicator */}
                  {is24HourWindowActive ? (
                    <span
                      title="Customer messaged recently. Free-form text replies are fully allowed by Meta."
                      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-full border border-emerald-200"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>24h Window Active (~{hoursRemaining}h left)</span>
                    </span>
                  ) : (
                    <span
                      title="Customer has not replied in >24 hours. Meta requires sending an approved Template to re-open."
                      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-semibold rounded-full border border-amber-200"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>24h Window Closed</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenTemplatesModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#075E54] text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send Template</span>
                  </button>
                </div>
              </div>

              {/* Notice Banner if 24h Window Expired */}
              {!is24HourWindowActive && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Meta 24-Hour Rule:</strong> Customer has not replied within the last 24 hours. Free-form text will be rejected by Meta. Use <strong>Send Template</strong> to re-open.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenTemplatesModal}
                    className="underline font-bold text-amber-800 hover:text-amber-950 ml-2 shrink-0"
                  >
                    Pick Template →
                  </button>
                </div>
              )}

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#EFEAE2]/30">
                {messagesLoading ? (
                  <ChatMessagesSkeleton />
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center text-xs text-gray-400">
                    <p className="font-semibold text-gray-600">No messages in this conversation thread yet.</p>
                    <p className="mt-1">Send a message below or pick a template to connect with this customer.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOut = msg.direction === 'OUTBOUND';
                    const isFailed = msg.status === 'FAILED';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md lg:max-w-lg rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                            isOut
                              ? isFailed
                                ? 'bg-rose-50 text-gray-900 rounded-tr-none border border-rose-200'
                                : 'bg-[#DCF8C6] text-gray-900 rounded-tr-none'
                              : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                          }`}
                        >
                          {/* Media caption or body */}
                          <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{msg.content}</p>

                          {/* Error explanation if failed */}
                          {isFailed && msg.error_message && (
                            <div className="mt-1.5 pt-1.5 border-t border-rose-200 text-[10px] text-rose-700 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                              <span>{msg.error_message}</span>
                            </div>
                          )}

                          {/* Timestamp & Status Icon */}
                          <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-gray-400">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOut && (
                              <span>
                                {msg.status === 'READ' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />
                                ) : msg.status === 'DELIVERED' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-gray-500 inline" />
                                ) : msg.status === 'SENT' ? (
                                  <Check className="w-3.5 h-3.5 text-gray-500 inline" />
                                ) : msg.status === 'FAILED' ? (
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 inline" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-gray-400 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleOpenTemplatesModal}
                  className="p-2 text-gray-500 hover:text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors"
                  title="Send Pre-Approved Meta Template"
                >
                  <FileCode className="w-4 h-4 text-emerald-600" />
                </button>

                <input
                  type="text"
                  placeholder={
                    is24HourWindowActive
                      ? 'Type a WhatsApp reply message...'
                      : 'Type message (or send template if 24h window closed)...'
                  }
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 py-2 px-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />

                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="p-2.5 bg-[#25D366] hover:bg-[#1faa53] text-white rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  title="Send via Meta Cloud API"
                >
                  {sending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title="No conversation selected"
                description="Choose a conversation from the left sidebar to start messaging your customers in real-time."
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Template Picker Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  Send Approved Meta Template
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Sending a pre-approved template delivers even when 24h window is expired and re-opens customer chat.
                </p>
              </div>
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {templatesLoading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  <p>No approved templates found.</p>
                  <p className="mt-1">Go to Meta Templates tab to create and approve templates.</p>
                </div>
              ) : (
                templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900 font-mono">{tmpl.name}</span>
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {tmpl.category || 'UTILITY'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {tmpl.body_text || tmpl.content || 'Template message content'}
                      </p>
                      <span className="text-[10px] text-gray-400 block font-mono">
                        Lang: {tmpl.language || 'en_US'}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={sendingTemplate}
                      onClick={() => handleSendTemplate(tmpl)}
                      className="px-3.5 py-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl text-xs font-bold shrink-0 transition-colors disabled:opacity-50"
                    >
                      {sendingTemplate ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
