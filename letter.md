# FreightAudit AI — Project Overview

## What It Is

FreightAudit AI is a full-stack web application that automates freight invoice auditing, carrier contract management, and billing dispute generation. Logistics companies upload carrier invoices, the AI extracts line items and compares them against signed contract rates, flags discrepancies, and generates professional dispute letters — all in one dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4, Framer Motion |
| **Backend API** | Express.js 4 (Node), hosted as a Vercel Serverless Function |
| **Auth** | Supabase Auth (email/password, session management, SSO-ready) |
| **Database** | Supabase PostgreSQL (RLS, views, functions) |
| **AI/ML** | Google Gemini 2.5 Flash Lite (extraction, auditing, letter generation) |
| **OCR** | Veryfi API (invoice document parsing) |
| **Email** | Nodemailer + Gmail SMTP (app password) |
| **Build** | esbuild (backend bundling for Vercel), Vite (frontend) |
| **Hosting** | Vercel (frontend + serverless function) |
| **Deployment** | Auto-deploy from GitHub (`main` branch) |

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────┐
│                    Browser                           │
│  React SPA  ───  Custom Router (popstate-based)     │
└──────────┬──────────────────────────────────────────┘
           │  /api/*  (fetch)
           ▼
┌──────────────────────────────────────────────────────┐
│            Vercel Serverless Function                 │
│         ┌────────────────────────────────────┐        │
│         │  Express Router (api/index.js)      │        │
│         │  Bundled by esbuild → ~72kb single  │        │
│         │  file with all deps inlined         │        │
│         └──────┬─────────────────────────────┘        │
│                │                                      │
│    ┌───────────┼───────────────┐                      │
│    ▼           ▼               ▼                      │
│  Routes    Middleware      Supabase Admin Client       │
│  /api/       (CORS,         (service_role key)        │
│  contracts   JSON,          bypasses RLS              │
│  /invoices   auth)                                    │
│  /disputes                                           │
│  /team                                               │
│  /settings                                           │
└──────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│              Supabase PostgreSQL                       │
│                                                        │
│  Tables: organizations, org_members, contracts,        │
│          invoices, line_items, disputes, audit_logs    │
│                                                        │
│  RLS: Row-level security via get_user_org_id()          │
│  Views: org_member_details (joins auth.users)          │
│  Functions: get_user_role(), get_user_org_id()         │
└──────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│          External APIs / Services                      │
│                                                        │
│  Google Gemini  → Invoice extraction, line-item       │
│                   auditing, dispute letter gen         │
│                                                        │
│  Veryfi OCR     → Convert invoice PDF/image → JSON    │
│                                                        │
│  Gmail SMTP     → Send invite emails, dispute letters │
│                   to carriers via mikeabrsh21@gmail.com│
└──────────────────────────────────────────────────────┘
```

## Workflow

### 1. Authentication & Organization Setup

```
User visits app  →  Login page (/auth/login)
                        │
                    [No account?]
                        ▼
                  Sign Up (/auth/signup)
                  - Company name, full name, email, password
                  - Creates record in `organizations` table
                  - First user = admin/owner
                  - Redirects to dashboard
                        │
                    [Has account?]
                        ▼
                  Login → supabase.auth.signInWithPassword()
                  - Session stored in localStorage
                  - Role fetched from org_members
                  - Redirects to dashboard

  Admin → Team page → Invite by email
    - Selects role (logistics_manager, finance_clerk, etc.)
    - Express generates token, stores in org_members
    - Sends email with accept link via Gmail SMTP
    - Invitee clicks link → accept-invite page
      → Sets password → Linked to org

  Forgot password?
    → /auth/forgot-password → enter email
    → supabase.auth.resetPasswordForEmail()
    → Email sent with recovery link
    → /auth/update-password → set new password
```

### 2. Contract Management

```
Dashboard → Contracts (/contracts)
              │
              ├── View all contracts (table with TanStack)
              │
              ├── Create new (/contracts/new)
              │   - Carrier name, effective/expiry dates
              │   - Rate table: min charge, per-lb, per-mile,
              │     liftgate fee, fuel surcharge %, stop-off fee
              │   - Saves to `contracts` table via Express API
              │
              └── Edit existing (/contracts/:id)
                  - Loads contract data, pre-fills form
                  - Saves updates via Express API
```

### 3. Invoice Upload & AI Auditing

```
Dashboard → Invoices (/invoices)
              │
              ├── Upload invoice (/invoices/upload)
              │   - Dropzone for PDF/image files
              │   - Optional: manual line-item entry fallback
              │   - Veryfi OCR extracts raw text/content
              │
              ├── Review pending invoice
              │   │
              │   ▼
              │   "Audit with AI" button
              │      │
              │      ├── 1. Gemini extracts invoice data
              │      │   (invoice number, date, carrier, line items)
              │      │
              │      ├── 2. Gemini audits against contract rates
              │      │   (compares billed vs expected amounts)
              │      │
              │      └── 3. Results displayed:
              │          - Status: approved / flagged / disputed
              │          - Per line-item: billed, expected, discrepancy
              │          - Total savings calculation
              │
              └── View flagged/disputed invoices
                  - Drill into line-item details
                  - Trigger dispute generation
```

### 4. Dispute Generation & Sending

```
Invoice flagged as disputed
      │
      ▼
  "Generate Dispute" button
      │
      ▼
  Gemini generates professional dispute letter
  - Recipient (carrier billing dept)
  - Lists all disputed line items with amounts
  - References contract rates
  - Requests credit memo within 15 days
      │
      ▼
  Review → Save as draft → Send
      │
      ▼
  Express sends email via Gmail SMTP:
  - Professional amber-themed HTML template
  - Dispute summary card (invoice #, carrier, amount, date)
  - Full dispute letter content
  - Dispute reference number
  - Status updated to "sent" in database
```

### 5. Team & Role Management

```
Settings → Team (/settings)
              │
              ├── Invite members (admin only)
              │   - Email + role selection
              │   - Resend invite / cancel
              │
              ├── Member list with status:
              │   - Active      → Suspend / Remove
              │   - Suspended   → Reactivate / Delete
              │   - Invited     → Delete (cancel invite)
              │
              └── Role-based permissions:
                  Admin                  - full access
                  Logistics Manager      - invoices, contracts, disputes
                  Finance Clerk          - view invoices, generate disputes
                  Operations Coordinator - view-only
```

### 6. Reports & Audit Logs

```
Dashboard → Reports (/reports)
  - Aggregated savings/discrepancy metrics
  - Invoice status breakdown
  - Carrier performance

Dashboard → Audit Logs (/logs)
  - Chronological log of all actions
  - User, action, entity, timestamp
```

---

## Database Schema (PostgreSQL)

### `organizations`
- `id` UUID PK
- `name`, `owner_id` (→ auth.users), `created_at`
- `seat_limit`, `plan`, `invoice_limit_per_month`, `billing_reset_date`

### `org_members`
- `id` UUID PK
- `org_id` FK, `user_id` (nullable → auth.users), `role`, `status`
- `email`, `full_name`, `invite_token`, `invite_expires_at`, `invited_by`

### `contracts`
- `id` UUID PK
- `org_id` FK, `carrier_name`, `effective_date`, `expiry_date`
- Rate fields: `min_charge`, `per_lb`, `per_mile`, `liftgate_fee`, `fuel_surcharge_pct`, `stop_off_fee`

### `invoices`
- `id` UUID PK
- `org_id` FK, `contract_id` FK (nullable)
- `invoice_number`, `carrier_name`, `total_billed`, `total_approved`, `total_savings`
- `status` (pending/auditing/flagged/approved/disputed)
- `audited_at`, `uploaded_at`

### `line_items`
- `id` UUID PK
- `invoice_id` FK, `description`, `billed_amount`, `expected_amount`
- `discrepancy`, `confidence_score`, `status`

### `disputes`
- `id` UUID PK
- `org_id` FK, `invoice_id` FK
- `carrier_name`, `carrier_email`, `total_disputed_amount`
- `dispute_letter_text`, `status` (draft/sent/resolved/rejected)
- `sent_at`, `resolved_at`, `resolution_amount`

### `audit_logs`
- `id` UUID PK
- `org_id` FK, `user_id`, `action`, `entity_type`, `entity_id`, `metadata` (JSONB)

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Express API over Next.js routes** | Simpler, single codebase. Frontend calls Express directly for all data operations. |
| **esbuild bundling** | Vercel's native TypeScript compilation fails on imports outside `api/`. esbuild bundles everything into one file (~72kb). |
| **`api/index.js` wrapper** | A committed thin re-exporter that Vercel detects pre-build, then imports the esbuild bundle at runtime. |
| **Supabase admin client in API** | Bypasses RLS for server-side operations (invites, role management). Frontend uses anonymous client with RLS. |
| **Brevo → Gmail SMTP migration** | Brevo blocked; Gmail SMTP via Nodemailer uses an app password. No SDK dependency. |
| **Custom SPA router** | No Next.js Router or React Router. Uses `popstate` events and manual path matching — lighter and more predictable. |
| **`_` prefix files** | Files like `_app.ts` and `_bundle.js` start with underscore so Vercel's function scanner ignores them. |

---

## File Structure

```
/
├── api/
│   ├── index.js         ← Committed Vercel entry wrapper
│   ├── _app.ts          ← Express app (all routes)
│   └── _bundle.js       ← esbuild output (gitignored)
│
├── app/
│   ├── auth/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── update-password/
│   │   └── accept-invite/
│   ├── dashboard/
│   ├── invoices/
│   ├── contracts/
│   ├── disputes/
│   ├── reports/
│   ├── settings/
│   └── api/             ← Next.js backup routes
│       ├── team/
│       └── disputes/
│
├── components/
│   ├── layout/          ← Sidebar, TopBar
│   ├── settings/        ← TeamMemberList
│   └── shared/          ← PermissionGate
│
├── lib/
│   ├── supabase/        ← client.ts, server.ts
│   ├── auth/            ← RoleContext, roles, planLimits
│   ├── ai/              ← extractInvoice, auditInvoice, generateDispute
│   ├── email.ts         ← Nodemailer Gmail transport
│   └── email-templates.ts  ← HTML email templates
│
├── src/
│   ├── App.tsx          ← Main SPA router + state management
│   └── main.tsx         ← React mount point
│
├── server.ts            ← Local dev entry (tsx)
├── package.json
├── vite.config.ts
├── vercel.json
├── .env
└── schema.sql
```

---

## Environment Variables

```
VITE_SUPABASE_URL              # Frontend Supabase URL
VITE_SUPABASE_ANON_KEY         # Frontend Supabase anon key
SUPABASE_SERVICE_ROLE_KEY      # Admin Supabase key (server-side)
GEMINI_API_KEY                 # Google Gemini API key
GEMINI_MODEL_NAME              # Gemini model (gemini-2.5-flash-lite)
APP_URL                        # Base URL for invite links
VERYFI_CLIENT_ID               # Veryfi OCR client ID
VERYFI_CLIENT_SECRET           # Veryfi OCR secret
VERYFI_API_KEY                 # Veryfi OCR API key
GMAIL_APP_PASSWORD             # Gmail app password for SMTP
```

---

## Deployment

- **Host:** Vercel (auto-deploys from `main` branch)
- **Build command:** `vite build && esbuild api/_app.ts --bundle --outfile=api/index.js && esbuild server.ts --outfile=dist/server.js`
- **Frontend output:** `dist/` (Vite default)
- **API function:** `api/index.js` (auto-detected post-build)
- **Rewrite rules:** `/api/(.*)` → `/api`, everything else → SPA fallback
- **Local dev:** `tsx server.ts` (Express + Vite middleware on port 3000)
- **Production server:** `node dist/server.js`

---

## Status & Roadmap

### ✅ Implemented
- Full auth (login, signup, logout, password reset, invite-accept)
- Role-based team management (CRUD members, invite via email, suspend/delete)
- Contract CRUD with rate tables
- Invoice upload + Veryfi OCR integration
- AI auditing via Gemini (extraction + line-item comparison)
- Dispute letter generation + email dispatch to carriers
- Audit log tracking
- Settings (org profile, integrations, password change)
- Professional HTML email templates (invite + dispute)
- Vercel deployment with esbuild bundling

### 🚀 Future Ideas
- Dashboard analytics/revenue charts
- Carrier portal (carriers log in to view/resolve disputes)
- Multi-language dispute letters
- Slack/email alerts for flagged invoices
- Monthly billing reports auto-generated
- Stripe subscription billing
