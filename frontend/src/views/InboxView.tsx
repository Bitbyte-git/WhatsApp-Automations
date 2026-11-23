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
} from 'lucide-react';
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const params = new URLSearchParams();
      if (activeTenantId) params.append('client_id', activeTenantId);
      if (search) params.append('search', search);
      if (selectedAccountId) params.append('whatsapp_account_id', selectedAccountId);

      const res = await api.getConversations(params.toString());
      const convList: Conversation[] = res.results || [];
      setConversations(convList);

      if (convList.length > 0 && !selectedConv) {
        setSelectedConv(convList[0]);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const tenantParam = activeTenantId ? `client_id=${activeTenantId}` : '';
      const res = await api.getWhatsAppAccounts(tenantParam);
      setAccounts(res.results || []);
    } catch {}
  };

  useEffect(() => {
    loadAccounts();
    loadConversations();
  }, [activeTenantId, search, selectedAccountId]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
      api.markConversationRead(selectedConv.id).catch(() => {});
    }
  }, [selectedConv]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (convId: number) => {
    setMessagesLoading(true);
    try {
      const res = await api.getMessages(convId);
      setMessages(res.results || res || []);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv || sending) return;

    setSending(true);
    try {
      const res = await api.sendMessage({
        conversation_id: selectedConv.id,
        content: replyText.trim(),
        message_type: 'TEXT',
      });

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setReplyText('');
        loadConversations();
      } else {
        alert(res.error || 'Failed to dispatch message via Meta Cloud API.');
      }
    } catch (err: any) {
      alert(err.message || 'Error sending message. Check Meta Cloud API credentials or wallet balance.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden flex h-[calc(100vh-140px)]">
      {/* Left Column: Conversation List */}
      <div className="w-80 md:w-96 border-r border-gray-200 flex flex-col bg-white shrink-0">
        {/* Header & Filter */}
        <div className="p-3.5 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">WhatsApp Inbox</h3>
            <button
              onClick={loadConversations}
              className="p-1 text-gray-400 hover:text-emerald-700 rounded transition-colors"
              title="Refresh messages"
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
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full text-xs bg-white border border-gray-200 rounded-xl py-1 px-2.5 text-gray-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All WhatsApp Numbers</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.business_name} ({a.phone_number})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading inbox...</div>
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
                          {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    <span>{selectedConv.contact?.phone_number}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">
                      via {selectedConv.whatsapp_account?.business_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge status={selectedConv.status} />
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#EFEAE2]/30">
              {messagesLoading ? (
                <div className="py-12 text-center text-xs text-gray-400">Loading conversation history...</div>
              ) : messages.length === 0 ? (
                <div className="py-16 text-center text-xs text-gray-400">
                  <p>No messages in this conversation thread yet.</p>
                  <p className="mt-1">Send your first message below using Meta Cloud API.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOut = msg.direction === 'OUTBOUND';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md lg:max-w-lg rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                          isOut
                            ? 'bg-[#DCF8C6] text-gray-900 rounded-tr-none'
                            : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                        }`}
                      >
                        {/* Media caption or body */}
                        <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{msg.content}</p>

                        {/* Timestamp & Status Icon */}
                        <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-gray-400">
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Attach Document / Media"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder="Type a WhatsApp reply message..."
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
  );
};
