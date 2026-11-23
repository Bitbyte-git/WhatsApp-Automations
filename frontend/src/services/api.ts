const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Token management
export const getAccessToken = () => localStorage.getItem('bitbyte_access_token');
export const setTokens = (access: string, refresh?: string) => {
  localStorage.setItem('bitbyte_access_token', access);
  if (refresh) localStorage.setItem('bitbyte_refresh_token', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('bitbyte_access_token');
  localStorage.removeItem('bitbyte_refresh_token');
  localStorage.removeItem('bitbyte_active_tenant');
};

export const getActiveTenantId = () => localStorage.getItem('bitbyte_active_tenant');
export const setActiveTenantId = (id: string | number | null) => {
  if (id) {
    localStorage.setItem('bitbyte_active_tenant', String(id));
  } else {
    localStorage.removeItem('bitbyte_active_tenant');
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const tenantId = getActiveTenantId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, clear tokens and redirect to login if not already there
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      clearTokens();
      window.dispatchEvent(new Event('bitbyte-auth-logout'));
    }
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.detail || data?.message || (typeof data === 'string' ? data : 'API Request failed');
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: any) => request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: any) => request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: any) => request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' }),

  // Auth endpoints
  login: (data: any) => api.post<{ user: any; tokens: { access: string; refresh: string } }>('/auth/login/', data),
  register: (data: any) => api.post<{ user: any; tokens: { access: string; refresh: string } }>('/auth/register/', data),
  me: () => api.get<any>('/auth/me/'),
  changePassword: (data: any) => api.post<any>('/auth/change-password/', data),

  // Clients
  getClients: (params = '') => api.get<any>(`/clients/${params ? `?${params}` : ''}`),
  createClient: (data: any) => api.post<any>('/clients/', data),
  updateClient: (id: number, data: any) => api.patch<any>(`/clients/${id}/`, data),
  toggleClientStatus: (id: number) => api.post<any>(`/clients/${id}/toggle_status/`),

  // WhatsApp Accounts
  getWhatsAppAccounts: (params = '') => api.get<any>(`/whatsapp/accounts/${params ? `?${params}` : ''}`),
  createWhatsAppAccount: (data: any) => api.post<any>('/whatsapp/accounts/', data),
  syncWhatsAppAccount: (id: number) => api.post<any>(`/whatsapp/accounts/${id}/sync_status/`),
  getMetaStatus: () => api.get<any>('/whatsapp/status/'),

  // Inbox & Contacts
  getContacts: (params = '') => api.get<any>(`/inbox/contacts/${params ? `?${params}` : ''}`),
  createContact: (data: any) => api.post<any>('/inbox/contacts/', data),
  deleteContact: (id: number) => api.del<any>(`/inbox/contacts/${id}/`),
  batchImportContacts: (data: any) => api.post<any>('/inbox/contacts/batch_import/', data),
  syncWhatsAppDevice: (data?: any) => api.post<any>('/inbox/contacts/sync_whatsapp_device/', data || {}),
  getConversations: (params = '') => api.get<any>(`/inbox/conversations/${params ? `?${params}` : ''}`),
  getMessages: (conversationId: number) => api.get<any>(`/inbox/messages/?conversation_id=${conversationId}`),
  sendMessage: (data: any) => api.post<any>('/inbox/send/', data),
  markConversationRead: (id: number) => api.post<any>(`/inbox/conversations/${id}/mark_as_read/`),

  // Templates
  getTemplates: (params = '') => api.get<any>(`/templates/${params ? `?${params}` : ''}`),
  createTemplate: (data: any) => api.post<any>('/templates/', data),
  syncTemplatesFromMeta: (data: any) => api.post<any>('/templates/sync_from_meta/', data),

  // Campaigns
  getCampaigns: (params = '') => api.get<any>(`/campaigns/${params ? `?${params}` : ''}`),
  createCampaign: (data: any) => api.post<any>('/campaigns/', data),
  launchCampaign: (id: number) => api.post<any>(`/campaigns/${id}/launch/`),
  quickBroadcast: (data: any) => api.post<any>('/campaigns/quick_broadcast/', data),

  // Chatbot
  getChatbotConfig: () => api.get<any>('/chatbot/config/'),
  updateChatbotConfig: (id: number, data: any) => api.patch<any>(`/chatbot/config/${id}/`, data),
  createChatbotConfig: (data: any) => api.post<any>('/chatbot/config/', data),
  simulateChatbot: (id: number, data: any) => api.post<any>(`/chatbot/config/${id}/simulate/`, data),
  testAutoReply: (data: any) => api.post<any>('/chatbot/config/test_auto_reply/', data),
  getKnowledgeDocs: () => api.get<any>('/chatbot/documents/'),
  createKnowledgeDoc: (data: any) => api.post<any>('/chatbot/documents/', data),
  deleteKnowledgeDoc: (id: number) => api.del<any>(`/chatbot/documents/${id}/`),

  // Billing & Wallet
  getWallet: (params = '') => api.get<any>(`/billing/wallet/${params ? `?${params}` : ''}`),
  rechargeWallet: (data: any) => api.post<any>('/billing/wallet/recharge/', data),
  getTransactions: (params = '') => api.get<any>(`/billing/transactions/${params ? `?${params}` : ''}`),
  getUsageRecords: (params = '') => api.get<any>(`/billing/usage/${params ? `?${params}` : ''}`),
  getInvoices: () => api.get<any>('/billing/invoices/'),

  // Analytics & Reports
  getOverviewStats: (params = '') => api.get<any>(`/analytics/overview/${params ? `?${params}` : ''}`),
  getMessageAnalytics: (range = '7d', params = '') => api.get<any>(`/analytics/messages/?range=${range}${params ? `&${params}` : ''}`),
  getRecentActivity: (params = '') => api.get<any>(`/analytics/activity/${params ? `?${params}` : ''}`),

  // Webhooks & Settings
  getWebhookLogs: () => api.get<any>('/webhooks/logs/'),
  getPlatformSettings: () => api.get<any>('/settings/platform/'),
  updatePlatformSetting: (data: any) => api.post<any>('/settings/platform/', data),
  getNotifications: () => api.get<any>('/settings/notifications/'),
};
