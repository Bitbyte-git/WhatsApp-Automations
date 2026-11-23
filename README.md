# BitByte Technologies — WhatsApp Business SaaS Platform

A multi-tenant WhatsApp Business SaaS Dashboard built for **BitByte Technologies**. The platform allows multiple businesses to connect their own WhatsApp Business Accounts (WABA) and phone numbers using the official **Meta WhatsApp Cloud API**.

Designed with a WhatsApp brand-inspired color scheme (#25D366, #075E54, #DCF8C6), clean cards, subtle shadows, and strict real-data integration.

---

## 1. Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Python 3.12, Django 6, Django REST Framework, SimpleJWT, CORS Headers
- **Database**: Neon PostgreSQL / PostgreSQL configured via `DATABASE_URL` environment variable, Django ORM, and database migrations

---

## 2. Platform Architecture & Features

### Main Dashboard Modules
1. **Overview Dashboard**: Real-time summary cards (Clients, Connected Accounts, Messages Sent, Delivered, Failed, Wallet Balance), message volume timeline, official Meta category breakdown (Marketing, Utility, Authentication, Service), and recent activity streams.
2. **Client Management (Multi-Tenant)**: Separate tenant identity, Add/Edit/View Client, Activate / Deactivate status toggle, search & filter. Full tenant isolation.
3. **WhatsApp Account Management**: Connected WABA details, Phone Number ID, Quality Rating, Connection Status, Meta Embedded Signup readiness, and live Meta status synchronization. Clearly displays *"WhatsApp integration is not configured"* when Meta credentials are not set.
4. **Team Inbox**: WhatsApp-style interface with conversation search, unread count badges, incoming/outgoing chat bubbles, delivery checkmarks (single sent tick, double delivered ticks, double blue read ticks), and real-time outbound messaging via Meta Cloud API.
5. **Contact Management**: Customer phone numbers, opt-in statuses, segmentation tags, notes, and batch import (JSON/CSV).
6. **Template Management**: Template builder (name, category, language, header, body with `{{1}}` variables, footer, buttons), live mobile preview mockup, and direct template synchronization from Meta Graph API.
7. **Broadcast Campaigns**: Select WhatsApp account, approved template, target audience, schedule, and launch broadcasts via official Meta Cloud API with wallet balance deduction.
8. **AI Chatbot**: Autonomous customer care powered by OpenRouter / OpenAI, tenant knowledge base document management, system prompt configuration, and human agent handover keywords. Includes an interactive Chatbot Sandbox Simulator.
9. **Analytics & Reports**: Real database metrics filtered by Today, Last 7 Days, Last 30 Days with daily traffic charts and Meta category breakdowns.
10. **Wallet & Billing**: Prepaid messaging credit wallet per client, recharge modal (UPI, NetBanking, Card), low balance alert threshold, granular cost audit (Meta pass-through, platform fee, tax), and invoices.
11. **Transactions**: Immutable ledger of all deposits and message deductions with search and category filters.
12. **API & Webhooks**: Meta Webhook endpoint (`/api/webhooks/whatsapp/`), verification challenge (`hub.challenge`), HMAC-SHA256 signature verification (`X-Hub-Signature-256`), deduplication protection, and raw event log inspector.
13. **Settings**: BitByte Technologies company identity, Meta Developer App ID, App Secret, System User Token, and user security.

---

## 3. Environment Variables Configuration

### Frontend (`frontend/.env`)
```bash
VITE_API_BASE_URL=/api
```

### Backend (`backend/.env`)
```bash
# Neon PostgreSQL Database Connection
DATABASE_URL=postgresql://username:password@ep-bitbyte-xxxx.ap-southeast-1.neon.tech/bitbyte_whatsapp?sslmode=require

# Django Security
DJANGO_SECRET_KEY=your-production-django-secret-key-here
DEBUG=True
ALLOWED_HOSTS=*

# Official Meta WhatsApp Cloud API Credentials
META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=bitbyte_whatsapp_webhook_token_secure
META_GRAPH_API_VERSION=v21.0
META_SYSTEM_USER_TOKEN=

# OpenRouter / AI Chatbot
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/gpt-oss-20b

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:8000
```

---

## 4. Getting Started & Running Locally

### Step 1: Database & Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py seed_platform
```

### Step 2: Run Backend Server
```bash
python manage.py runserver 0.0.0.0:8000
```

### Step 3: Run Frontend Development Server
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Superadmin Credentials
- **Email**: `admin@bitbytetech.org`
- **Password**: `ChangeMe@123`
