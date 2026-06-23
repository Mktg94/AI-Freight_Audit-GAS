# FreightAudit AI

**Automated Carrier Invoice Audit & Overcharge Recovery Platform**

FreightAudit AI is an enterprise-grade SaaS platform that automates the tedious, manual process of auditing freight carrier invoices. It uses AI (Google Gemini) to extract line items from PDF invoices, compare them against your negotiated contract rates, flag discrepancies, and generate professional dispute letters — all from a single dashboard.

---

## The Problem

Logistics companies lose **3–8% of every freight dollar** to carrier overcharges that go undetected. The root causes:

- **Manual audits don't scale** — A logistics manager reviewing 500+ invoices/month spends hours cross-referencing line items against rate sheets
- **Rate agreements are complex** — Each carrier has different rates per lane, per weight break, per accessorial charge (liftgate, detention, residential delivery, etc.)
- **Discrepancies are buried** — Carriers bundle charges in dense PDFs; overbilled line items hide in plain sight
- **Dispute follow-through is rare** — Even when overcharges are spotted, writing and sending a formal dispute letter is its own time sink

**The result:** Carriers keep the overbilled revenue, and shippers accept it as a "cost of doing business."

---

## The Solution

FreightAudit AI connects three core data points — **your invoice PDFs**, **your carrier rate agreements**, and **AI** — to automatically:

1. **Extract** every line item from carrier invoices using AI-powered OCR
2. **Audit** each charge against your signed contract rates with semantic matching
3. **Flag** overcharges, undercharges, and suspicious items with confidence scores
4. **Generate** professional dispute letters for every verified overcharge
5. **Track** savings, approval rates, and carrier performance over time

---

## How It Works (5-Minute Setup)

### 1. Load Your Rate Agreements

Create contracts for each carrier using the rate builder:

- Choose a template (Road Freight, Air Freight, Ocean, or Custom)
- Define charge items with names, rates, and rate types:
  - Per lb / Per kg / Per mile / Per km
  - Per hour / Per CBM
  - Flat fee per occurrence
  - Percentage of base freight charge
  - Not Allowed (zero tolerance)
- Set effective and expiry dates, minimum charges, and currency

Each contract becomes the ground truth for auditing that carrier's invoices.

### 2. Upload Invoices

Drag and drop PDF or image invoices (single or batch):

- **Single upload** — One invoice, one contract match
- **Batch upload** — Upload a folder of PDFs; each is processed individually against the selected contract
- **Multi-invoice detection** — PDFs with multiple invoice pages are automatically detected and split for separate processing
- Files are securely stored in your Supabase storage bucket

### 3. AI Extracts & Audits

Behind the scenes, the AI engine runs two passes:

**Pass 1 — Extraction (Veryfi + Gemini)**
- The raw PDF/image is parsed into structured data
- Gemini extracts: carrier name, invoice number, dates, origin/destination, weight, line items (description, billed amount, quantity), and total billed

**Pass 2 — Audit (Gemini + Contract Rules)**
- Each extracted line item is matched against your contract's charge items using **semantic matching** (e.g., "Waiting Time" → "Detention / Driver Standby")
- For each match, the expected amount is calculated using the contract's rate type:
  - *Flat fee* → the contracted flat rate
  - *Per unit* → rate × quantity from the invoice
  - *Percentage* → percentage × base freight amount
  - *Not Allowed* → any billed amount is an automatic overcharge
- Each item gets a status: `correct`, `overcharged`, `undercharged`, `not_in_contract`, or `suspicious`
- A confidence score (0.00–1.00) communicates how certain the AI is
- All PII is stripped before sending to the AI — **your data stays private**

### 4. Review & Act

On the invoice detail page, every line item is displayed in a data table. Click any item to open the review panel:

| What you see | What you can do |
|---|---|
| Billed vs. Expected vs. Difference | **Approve** — Mark as correct (with optional reason) |
| AI analysis / flag reason | **Dispute** — Flag for dispute generation |
| Confidence score bar | Review the AI's reasoning |
| Contract reference (what the contract says) | Compare the billed amount against the contracted rate |

The status bar updates in real time — flagged invoices get a red indicator, while clean ones show green.

### 5. Generate & Send Disputes

When overcharges are confirmed:

1. Click **"Generate Dispute"** — the AI writes a professional dispute letter listing each overcharge with exact amounts, referencing your signed rate agreement
2. Review the letter — edit if needed
3. Click **"Send"** — the letter is emailed to the carrier via Gmail SMTP with a professional amber-themed HTML template
4. Track response — mark disputes as resolved when the carrier issues a credit memo

### 6. Measure Your Savings

The dashboard and reports page give you:

- **Total savings recovered** — Actual dollars recouped from disputes
- **Flagged invoice rate** — Percentage of invoices with discrepancies
- **Monthly savings chart** — Trend your recovery over time
- **Carrier performance** — Which carriers overbill most frequently
- **Audit log** — Every action is recorded for compliance and team accountability

---

## Key Features

| Feature | Description |
|---|---|
| **AI-Powered Audit Engine** | Gemini extracts and audits invoice line items against contract rates with semantic matching |
| **Smart Contract Rate Builder** | Flexible charge items matrix with 8 rate types, templates, and legacy column support |
| **Batch Processing** | Upload dozens of invoices at once; each is extracted, audited, and stored independently |
| **Multi-Invoice PDF Splitting** | Detects and splits multi-page PDFs containing separate invoices |
| **Line Item Review Panel** | Side panel shows billed vs. expected, AI analysis, confidence score, and contract reference |
| **Automated Dispute Letters** | AI generates professional, carrier-ready dispute letters with real dollar amounts |
| **Email Dispatch** | Send dispute letters directly to carriers via Gmail SMTP with branded HTML templates |
| **Team Collaboration** | Role-based access (Admin, Logistics Manager, Finance Clerk, Operations Coordinator) |
| **Role-Based Access Control** | Granular permissions for upload, review, dispute generation, team management |
| **Team Invites** | Invite team members by email with role assignment and seat limit enforcement |
| **Dashboard & Reports** | Real-time metrics: savings, flagged rates, carrier performance, monthly trends |
| **Audit Logging** | Complete chronological record of every action for compliance |
| **Batch Uploading** | Process multiple invoices in a single upload against a selected contract |
| **Rules-Based Audit Fallback** | Works fully offline with local rules-based matching when no AI key is configured |
| **Sandbox Mode** | Full demo mode without requiring any API keys or database |
| **Data Privacy** | All PII stripped before AI processing; data never leaves your control |

---

## Who Is It For?

| Role | What They Get |
|---|---|
| **Logistics Manager** | Automated invoice auditing — hours saved per week, every overcharge caught |
| **Finance / AP Clerk** | Dispute letters generated and sent in minutes instead of hours |
| **Operations Coordinator** | Quick upload workflow, contract management, batch processing |
| **Chief Financial Officer** | Measurable savings dashboard, carrier performance analytics, ROI visibility |
| **Compliance / Audit Team** | Full audit log, approval tracking, resolution documentation |

---

## The Technology

| Layer | Stack |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| **Backend** | Express.js (Node.js), bundled as Vercel serverless function |
| **Database** | Supabase PostgreSQL with Row-Level Security |
| **AI Engine** | Google Gemini 2.5 Flash Lite |
| **OCR Pipeline** | Veryfi API (PDF/image to structured data) |
| **Email** | Nodemailer + Gmail SMTP |
| **Auth** | Supabase Auth (email/password, invite flow) |
| **UI** | Lucide icons, Recharts, TanStack Table, Framer Motion |
| **Hosting** | Vercel (frontend + serverless) |

---

## Pricing Plans

| Plan | Price | Seats | Monthly Invoices |
|---|---|---|---|
| **Starter** | $99/mo | 3 | 100 |
| **Professional** | $299/mo | 10 | 500 |
| **Enterprise** | Custom | Unlimited | Unlimited |

All plans include full AI audit engine, dispute generation, team collaboration, and email dispatch.

---

## Getting Started

```bash
git clone <repo-url>
cd freight-audit-ai
npm install
cp .env.example .env   # Add your Supabase & Gemini keys
npm run dev             # Opens at http://localhost:3000
```

See `SETUP_GUIDE.md` for detailed environment setup and `README.md` for full installation instructions.

---

## The Bottom Line

If your company pays freight carrier invoices, you are almost certainly being overcharged. FreightAudit AI finds those overcharges automatically, disputes them professionally, and recovers the money — turning a cost center into a profit center.

**Stop auditing invoices. Start auditing carriers.**
