# FreightAudit AI ⚡

⚡ **Automating Carrier Invoice Audit & Recoveries using Anthropic AI + Supabase**

FreightAudit AI is an enterprise-grade SaaS billing integrity platform. It parses complex freight carrier invoices, matches line items against loaded shipper contract rates, highlights billing discrepancies automatically via intelligent extraction (powered by Anthropic Claude Haiku), and drafts custom, copy-ready dispute letters to bypass manual claim back-and-forths.

---

## 🎨 Design Systems
- **Palette**: Deep Navy (`#0A0F1E` backgrounds), Charcoal (`#111827` surface cards), Teal accent (`#2DD4BF`), and warning alerts (`#EF4444` overcharges, `#F59E0B` flags, `#10B981` recoveries).
- **Typography**: Display paired headers rendered in "Syne" font, combined with general monospace metrics in "JetBrains Mono" and sans-serif readability in "DM Sans".
- **Visuals**: Ambient cyan glass glows, spacious layout dimensions, and clean transitions.

---

## 🛠 Prerequisites
Ensure the following are installed and configured locally:
* **Node.js**: `v18.x` or higher (Node 20+ recommended)
* **Supabase Project**: An active PostgreSQL cluster with standard credentials
* **Anthropic Suite Account**: API endpoint authentication keys (or Sandbox fallback defaults)

---

## 🚀 Step-by-Step Installation

### 1. Clone & Configure Dependencies
Verify your terminal resides inside the root workspace folder, then run:
```bash
# Populate dependencies
npm install
```

### 2. Configure Environment Secrets
Create a `.env` configuration file in the project root:
```env
# Supabase Secure Public Config
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Anthropic Suite API Access (Server-side)
ANTHROPIC_API_KEY=your-anthropic-key

# Resend Mail Dispatch keys (Optional)
RESEND_API_KEY=your-resend-key
```

### 3. Setup Relational SQL Schemas
Register tables in your remote Supabase SQL console. Utilize schemas listed under `/supabase/schema.sql`:
```sql
-- Creates core ledgers: organizations, profiles, contracts, invoices, line_items, disputes, and audit logs.
-- Execute this script inside your Supabase query workspace.
```

### 4. Boot Development Local Server
```bash
# Spawns local hot-swapping listener on port 3000
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📖 Recommended Audit Workflow

Follow these chronological steps to test rate auditing features:

1. **Upload Rate Agreements**: 
   * Navigate to the **Contracts** page.
   * Add a new rate contract agreement (e.g., base transport flat, accessory rates, residential fuel surcharge indexes).

2. **Submit Carrier Invoices**: 
   * Navigate to **Invoices** -> click **Upload Invoice**.
   * Pick or drag-and-drop a carrier invoice document parsed via AI (or load default sample sandbox files).

3. **Verify Discrepancies**: 
   * Browse discrepancy markers highlighted on the **Audits & Invoices** screen.
   * Hover over flagged rows to compare expected rates against billed figures.

4. **Claim dispute recoveries**: 
   * Click **Generate Disputes** on an audited bill.
   * AI automatically drafts a customized, polite, copy-ready carrier claim letter. Open **Disputes** to claim recovery tracking!
