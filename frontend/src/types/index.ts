export type UserRole = 'SUPERADMIN' | 'CLIENT_ADMIN' | 'AGENT';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  client?: number | null;
  client_details?: {
    id: number;
    name: string;
    slug: string;
    status: string;
  };
  is_active: boolean;
  date_joined: string;
}

export interface Client {
  id: number;
  name: string;
  slug: string;
  company_email: string;
  phone_number?: string;
  address?: string;
  website?: string;
  timezone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  max_whatsapp_accounts: number;
  notes?: string;
  accounts_count?: number;
  users_count?: number;
  wallet_balance?: string | number;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppAccount {
  id: number;
  client: number;
  client_name?: string;
  business_name: string;
  waba_id: string;
  phone_number: string;
  phone_number_id: string;
  display_phone_number?: string;
  quality_rating: 'UNKNOWN' | 'GREEN' | 'YELLOW' | 'RED';
  connection_status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING_CONFIGURATION' | 'RESTRICTED';
  account_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  is_default: boolean;
  has_custom_token?: boolean;
  webhook_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  client: number;
  client_name?: string;
  phone_number: string;
  name?: string;
  email?: string;
  country_code?: string;
  tags?: string[];
  status: 'OPTED_IN' | 'OPTED_OUT' | 'BLOCKED';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation: number;
  client: number;
  whatsapp_account: number;
  contact: number;
  wamid?: string;
  direction: 'INBOUND' | 'OUTBOUND';
  message_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'TEMPLATE' | 'INTERACTIVE' | 'LOCATION';
  content: string;
  media_url?: string;
  media_caption?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  error_code?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  client: number;
  whatsapp_account: WhatsAppAccount;
  contact: Contact;
  status: 'OPEN' | 'PENDING' | 'CLOSED';
  unread_count: number;
  last_message_at?: string;
  last_message_preview?: string;
  last_message?: Message;
  assigned_agent?: number | null;
  created_at: string;
}

export interface MessageTemplate {
  id: number;
  client: number;
  client_name?: string;
  whatsapp_account?: number;
  whatsapp_account_name?: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  header_type: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  header_text?: string;
  body_text: string;
  footer_text?: string;
  buttons?: any[];
  meta_template_id?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: number;
  client: number;
  client_name?: string;
  whatsapp_account: number;
  whatsapp_account_name?: string;
  template: number;
  template_name?: string;
  name: string;
  scheduled_at?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  template_params?: Record<string, any>;
  created_at: string;
}

export interface ChatbotConfig {
  id: number;
  client: number;
  client_name?: string;
  whatsapp_account?: number;
  is_enabled: boolean;
  provider: 'OPENROUTER' | 'OPENAI';
  model_name: string;
  system_prompt: string;
  welcome_message: string;
  fallback_message: string;
  handover_enabled: boolean;
  handover_keywords: string;
  handover_message: string;
  max_tokens: number;
  temperature: number;
  documents_count?: number;
  created_at: string;
}

export interface KnowledgeDocument {
  id: number;
  client: number;
  chatbot: number;
  title: string;
  content_type: 'TEXT' | 'FAQ' | 'DOCUMENT';
  content: string;
  is_active: boolean;
  created_at: string;
}

export interface Wallet {
  id: number;
  client: number;
  client_name?: string;
  balance: string;
  currency: string;
  low_balance_threshold: string;
  is_locked: boolean;
  is_low_balance?: boolean;
  updated_at: string;
}

export interface WalletTransaction {
  id: number;
  wallet: number;
  client: number;
  client_name?: string;
  transaction_type: 'CREDIT' | 'DEBIT';
  amount: string;
  balance_after: string;
  category: 'RECHARGE' | 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SERVICE' | 'PLATFORM_FEE' | 'REFUND';
  description: string;
  reference_id?: string;
  payment_method?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  created_at: string;
}

export interface Invoice {
  id: number;
  client: number;
  client_name?: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  invoice_pdf_url?: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
}

export interface OverviewStats {
  total_clients: number;
  connected_accounts: number;
  total_accounts: number;
  total_messages_sent: number;
  total_messages_delivered: number;
  total_messages_failed: number;
  total_wallet_balance: number;
  category_breakdown: {
    marketing: number;
    utility: number;
    authentication: number;
    service: number;
  };
  has_data: boolean;
}

export interface WebhookEvent {
  id: number;
  event_id: string;
  event_type: string;
  payload: any;
  status: 'RECEIVED' | 'PROCESSED' | 'FAILED' | 'IGNORED';
  error_message?: string;
  received_at: string;
  processed_at?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'WALLET' | 'CAMPAIGN' | 'SYSTEM';
  is_read: boolean;
  link?: string;
  created_at: string;
}
