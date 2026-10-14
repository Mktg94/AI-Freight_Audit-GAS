"use client";

import React, { useState, useId } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Send,
  Copy,
  Layers,
  Scale,
  Lock,
  Calculator,
  Sliders,
  DollarSign,
  TrendingDown,
  Clock,
  Eye,
  FileCheck,
  Building2,
  Cpu,
  ChevronDown,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// SPA client routing helper — preserves existing navigation system
const navigate = (href: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  window.history.pushState({}, "", href);
  window.dispatchEvent(new Event("popstate"));
};

// ---------------------------------------------------------------------------
// DATA ARCHETYPES — Realistic freight scenarios with clause citations
// ---------------------------------------------------------------------------

interface InvoiceItem {
  desc: string;
  billed: number;
  expected: number;
  status: "matched" | "discrepancy" | "flagged";
  rule: string;
}

interface DemoScenario {
  id: string;
  name: string;
  carrier: string;
  ref: string;
  date: string;
  route: string;
  mode: string;
  billed: number;
  expected: number;
  variance: number;
  flaggedCount: number;
  items: InvoiceItem[];
  contractRef: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "drayage",
    name: "Port Drayage & Chassis",
    carrier: "Pacific Drayage Co.",
    ref: "PDC-7742-Q4",
    date: "Oct 12, 2024",
    route: "Port of Long Beach, CA → Ontario, CA",
    mode: "40ft High-Cube · Pier Pass · Chassis 3-Axle",
    billed: 1715.0,
    expected: 1210.0,
    variance: 505.0,
    flaggedCount: 2,
    contractRef: "MSA-PACIFIC-2024-V3 · §4.2 Chassis Schedule",
    items: [
      {
        desc: "Port Drayage Base (40ft High-Cube)",
        billed: 850.0,
        expected: 850.0,
        status: "matched",
        rule: "Standard contracted terminal-to-inland rate schedule",
      },
      {
        desc: "Chassis Usage Fee (7 Days Billed)",
        billed: 490.0,
        expected: 210.0,
        status: "discrepancy",
        rule: "Contract §4.2: 4 free days included. 3 billable days @ $70/day = $210.00",
      },
      {
        desc: "Port Congestion Emergency Surcharge",
        billed: 225.0,
        expected: 0.0,
        status: "flagged",
        rule: "Non-contractual accessorial. Surcharge absent from signed tariff addendum",
      },
      {
        desc: "Pre-Pull Authorization Terminal Fee",
        billed: 150.0,
        expected: 150.0,
        status: "matched",
        rule: "Authorized per electronic dispatch instructions #EDI-9941",
      },
    ],
  },
  {
    id: "ltl",
    name: "LTL Dry Freight",
    carrier: "Apex Freight Lines",
    ref: "APX-2024-08817",
    date: "Oct 8, 2024",
    route: "Houston, TX → Memphis, TN",
    mode: "LTL · 3,800 lbs · NMFC Class 85",
    billed: 1666.56,
    expected: 1430.2,
    variance: 236.36,
    flaggedCount: 2,
    contractRef: "AGMT-APEX-EXP-2023 · §7.1 DOE Index",
    items: [
      {
        desc: "Base Linehaul (Class 85 Discount 78.5%)",
        billed: 1180.0,
        expected: 1180.0,
        status: "matched",
        rule: "Base CZAR-Lite tariff benchmark with negotiated 78.5% discount",
      },
      {
        desc: "Fuel Surcharge (Billed at 19.2% instead of 14.0%)",
        billed: 226.56,
        expected: 165.2,
        status: "discrepancy",
        rule: "Contract §7.1: EIA weekly diesel index ($3.62/gal) establishes 14.0% FSC ceiling",
      },
      {
        desc: "Liftgate Delivery at Destination",
        billed: 175.0,
        expected: 0.0,
        status: "flagged",
        rule: "Dock-high receiver facility on record. No liftgate requested or utilized",
      },
      {
        desc: "Inside Delivery Standard Accessorial",
        billed: 85.0,
        expected: 85.0,
        status: "matched",
        rule: "Authorized accessorial per Bill of Lading instruction",
      },
    ],
  },
  {
    id: "intermodal",
    name: "Intermodal Rail",
    carrier: "Midwest Continental Logistics",
    ref: "MCL-RAIL-9021",
    date: "Sep 29, 2024",
    route: "Chicago Corwith, IL → Atlanta Inman, GA",
    mode: "53' Domestic Intermodal · Co-Modal Ramp",
    billed: 2480.0,
    expected: 2100.0,
    variance: 380.0,
    flaggedCount: 1,
    contractRef: "RAIL-INTERMODAL-T2 · Addendum B (Detention)",
    items: [
      {
        desc: "Ramp-to-Ramp Linehaul Transportation",
        billed: 1850.0,
        expected: 1850.0,
        status: "matched",
        rule: "Agreed dedicated equipment linehaul lane commitment",
      },
      {
        desc: "Destination Rail Ramp Storage (Demurrage)",
        billed: 380.0,
        expected: 0.0,
        status: "discrepancy",
        rule: "Carrier rail-delay notice on file. Contract §11 waives demurrage during rail mechanical holds",
      },
      {
        desc: "Origin Hostler Dray & Chassis Mount",
        billed: 250.0,
        expected: 250.0,
        status: "matched",
        rule: "Standard fixed origin terminal hostling fee schedule",
      },
    ],
  },
];

const DISPUTE_TEMPLATES: Record<string, string> = {
  drayage: `FORMAL FREIGHT BILLING DISPUTE & REMITTANCE NOTICE

To: Billing & Accounting Dept. — XXXXX.
Date: XXX XX, XXXX
Invoice Reference: XXXX-XXXX-XX
Shipment Route: XXXXX, XX → XXXXX, XX
Master Service Agreement Reference: XXXX-XXXX-XXXX

Dear Billing Representative,

Following automated contract reconciliation against our executed Master Drayage Agreement, FreightAudit AI has identified two unapproved billing variances totaling $505.00 on the referenced invoice.

ITEMIZED CONTRACTUAL DISCREPANCIES:

1. Chassis Usage Fee — Overcharge: $280.00
   • Billed: 7 days @ $70.00/day = $490.00
   • Contracted Entitlement: Per MSA §4.2, container shipments are entitled to 4 free calendar days of chassis usage. Only 3 days are billable.
   • Audited Obligation: 3 days @ $70.00 = $210.00
   • Net Adjustment Claimed: -$280.00

2. Port Congestion Emergency Surcharge — Unauthorized: $225.00
   • Billed: $225.00 flat surcharge
   • Contractual Absence: This fee does not exist within our signed rate tariff or addendum exhibits. Emergency surcharges require 30-day advance written consent per MSA §9.1.
   • Net Adjustment Claimed: -$225.00 (Full Waiver)

SUMMARY OF REMITTANCE:
Total Amount Invoiced:      $1,715.00
Total Disputed Balance:     -$505.00
Approved Remittance Amount: $1,210.00

We have authorized electronic disbursement of the undisputed balance of $1,210.00 under terms Net 30. Please issue a corrected invoice or credit memo reflecting the $505.00 adjustment to reconcile your accounts receivable ledger.

Sincerely,
Freight Audit & Logistics Operations
System Generated & Audited via FreightAudit AI`,

  ltl: `FORMAL FREIGHT BILLING DISPUTE & REMITTANCE NOTICE

To: Revenue Accounting Dept. — XXXXXX.
Date: XXX XX, XXXX
Invoice Reference: XXXX-XXXX-XX
Shipment Route: XXXXX, XX → XXXXX, XX
Contract Reference: XXXXXX-XXXX-XXXX

Dear Billing Team,

Automated audit against our contracted rate schedule indicates a cumulative billing variance of $236.36 requiring immediate credit memorandum adjustment.

ITEMIZED CONTRACTUAL DISCREPANCIES:

1. Fuel Surcharge Index Variance — Overcharge: $61.36
   • Billed: 19.20% ($226.56)
   • Contracted Entitlement: Per Agreement §7.1, the Weekly Fuel Surcharge is pegged to the DOE Gulf Coast Weekly On-Highway Diesel average for shipment date Oct 8 ($3.62/gal), which establishes a maximum surcharge rate of 14.00% ($165.20).
   • Net Adjustment Claimed: -$61.36

2. Liftgate Delivery Fee — Unauthorized: $175.00
   • Billed: $175.00
   • Contractual Absence: Destination delivery location (XXXXX XXXX) is a fully dock-high facility with 14 hydraulic bays. Signed Delivery Receipt (POD) confirms standard dock unload with zero liftgate engagement.
   • Net Adjustment Claimed: -$175.00 (Full Cancellation)

SUMMARY OF REMITTANCE:
Total Invoiced:            $1,666.56
Disputed Adjustment:       -$236.36
Authorized Remittance:     $1,430.20

Undisputed funds ($1,430.20) scheduled for release upon standard remittance cycle. Please acknowledge invoice adjustment.

Sincerely,
Corporate Freight Accounting Team`,

  intermodal: `FORMAL FREIGHT BILLING DISPUTE & REMITTANCE NOTICE

To: Intermodal Customer Accounting — XXXXXX.
Date: XXX XX, XXXX
Invoice Reference: XXXX-XXXX-XX
Shipment: XXXXX, XX → XXXXX, XX
Agreement: XXXXXX-XXXXXX (Addendum B)

Dear Customer Accounting,

A review of invoice XXXX-XXXX-XX against rail terminal interchange records has isolated an invalid storage assessment of $380.00.

DISCREPANCY SPECIFICATION:
• Charge Disputed: Destination Rail Ramp Storage (Demurrage) — $380.00
• Contractual Exemption: XXXXX rail terminal logged an inbound track signal outage holding train symbol XXXX for XX hours beyond scheduled interchange. Under Addendum B §XX, storage charges accruing as a direct consequence of carrier track delays are strictly waived.

RECONCILIATION:
Total Billed:               $2,480.00
Disputed Storage Exemption: -$380.00
Remittance Scheduled:       $2,100.00

Please provide corrected credit balance or statement reconciliation.

Sincerely,
Intermodal Operations Controller`,
};

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function StatusTag({ status }: { status: "matched" | "discrepancy" | "flagged" }) {
  if (status === "matched") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />
        Contract Verified
      </span>
    );
  }
  if (status === "discrepancy") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/25">
        <AlertTriangle className="w-3 h-3 text-rose-400" strokeWidth={1.5} />
        Rate Discrepancy
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25">
      <AlertTriangle className="w-3 h-3 text-amber-400" strokeWidth={1.5} />
      Unauthorized Charge
    </span>
  );
}

// ---------------------------------------------------------------------------
// MAIN HIGH-END LANDING PAGE
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("drayage");
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [copiedDispute, setCopiedDispute] = useState(false);

  // Interactive ROI Calculator State
  const [monthlySpend, setMonthlySpend] = useState<number>(185000);
  const [leakageRate, setLeakageRate] = useState<number>(5.2);

  const activeScenario =
    DEMO_SCENARIOS.find((s) => s.id === selectedScenarioId) || DEMO_SCENARIOS[0];

  // Calculations for ROI section
  const annualSpend = monthlySpend * 12;
  const annualSavings = (annualSpend * (leakageRate / 100));
  const hoursSavedPerMonth = Math.round(monthlySpend / 1500);

  const copyDisputeToClipboard = () => {
    const textToCopy =
      DISPUTE_TEMPLATES[selectedScenarioId] || DISPUTE_TEMPLATES.drayage;
    navigator.clipboard.writeText(textToCopy);
    setCopiedDispute(true);
    setTimeout(() => setCopiedDispute(false), 2200);
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#05070B] text-slate-100 antialiased overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* ─── SCOPED HIGH-END FONT & STYLING INJECTION ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        
        .fa-font-display {
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        }
        
        .fa-font-mono {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
        }

        .fa-glass-surface {
          background: rgba(11, 16, 28, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .fa-grid-overlay {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        }

        .fa-bezier {
          transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
        }

        .fa-btn-pill-white {
          background-color: #ffffff !important;
          color: #05070b !important;
        }

        .fa-btn-pill-white:hover {
          background-color: #f1f5f9 !important;
        }

        .fa-btn-pill-white span {
          color: #05070b !important;
        }
      `}</style>

      {/* Subtle Noise / Film-Grain Simulation (Fixed, Non-scrolling pointer-events-none) */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.025] fa-grid-overlay"
        aria-hidden="true"
      />

      {/* ─── 1. THE "FLUID ISLAND" FLOATING DETACHED NAVBAR ─── */}
      <header className="fixed top-0 inset-x-0 z-40 px-4 sm:px-6 pt-4 pointer-events-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Main Floating Island */}
          <div className="pointer-events-auto flex items-center justify-between w-full rounded-full bg-[#080D1A]/85 backdrop-blur-2xl border border-white/10 px-4 sm:px-6 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.05]">

            {/* Logo Brandmark */}
            <a
              href="/"
              onClick={navigate("/")}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 group-hover:border-emerald-400/50 transition-colors">
                <ShieldCheck className="w-4 h-4 text-emerald-400 transition-transform group-hover:scale-110 duration-300" strokeWidth={1.5} />
              </div>
              <span className="fa-font-display font-bold text-sm tracking-tight text-white flex items-center gap-1">
                FreightAudit<span className="text-emerald-400 font-semibold">AI</span>
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-300">
              <a
                href="#how-it-works"
                className="hover:text-white transition-colors duration-200"
              >
                Pipeline
              </a>
              <a
                href="#capabilities"
                className="hover:text-white transition-colors duration-200"
              >
                Capabilities
              </a>
              <a
                href="#interactive-audit"
                className="hover:text-white transition-colors duration-200"
              >
                Audit Console
              </a>
              <a
                href="#calculator"
                className="hover:text-white transition-colors duration-200"
              >
                ROI Engine
              </a>
            </nav>

            {/* Desktop Action Pills */}
            <div className="hidden sm:flex items-center gap-4">
              <a
                href="/auth/login"
                onClick={navigate("/auth/login")}
                className="text-[13px] font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5 cursor-pointer"
              >
                Sign In
              </a>

              {/* Nested Island Button Architecture */}
              <a
                href="/auth/signup"
                onClick={navigate("/auth/signup")}
                className="group relative inline-flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full font-bold text-[13px] hover:brightness-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] cursor-pointer fa-btn-pill-white"
                style={{ backgroundColor: '#ffffff', color: '#05070b' }}
              >
                <span className="font-bold tracking-tight" style={{ color: '#05070b' }}>Audit Free</span>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#05070b] group-hover:text-white"
                  style={{ backgroundColor: 'rgba(5, 7, 11, 0.08)', color: '#05070b' }}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" strokeWidth={2.5} />
                </span>
              </a>
            </div>

            {/* Mobile Hamburger Morph Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between relative">
                <span
                  className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                    }`}
                />
                <span
                  className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                    }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ─── FLUID FULL-SCREEN MOBILE OVERLAY WITH STAGGERED REVEAL ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#05070B]/95 backdrop-blur-3xl flex flex-col justify-between p-8 sm:p-12 md:hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-white text-base">FreightAudit AI</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-6 py-8 text-2xl font-semibold fa-font-display">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Autonomous Pipeline
            </a>
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Core Capabilities
            </a>
            <a
              href="#interactive-audit"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Live Audit Console
            </a>
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Savings Calculator
            </a>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
            <a
              href="/auth/login"
              onClick={(e) => {
                setMobileMenuOpen(false);
                navigate("/auth/login")(e);
              }}
              className="w-full py-3.5 text-center rounded-full border border-white/10 text-white font-medium text-sm hover:bg-white/5 transition-colors"
            >
              Sign In to Portal
            </a>
            <a
              href="/auth/signup"
              onClick={(e) => {
                setMobileMenuOpen(false);
                navigate("/auth/signup")(e);
              }}
              className="w-full py-3.5 text-center rounded-full bg-emerald-400 text-slate-950 font-bold text-sm hover:bg-emerald-300 transition-colors shadow-[0_0_25px_rgba(16,185,129,0.3)]"
            >
              Launch First Audit
            </a>
          </div>
        </div>
      )}

      {/* ─── 2. HERO SECTION (MACRO-WHITESPACE SCALE) ─── */}
      <section className="relative pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-28 lg:pb-36 overflow-hidden">
        {/* Cargo Plane Background (Air Freight) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <img
            src="/freight_images/cargo_plane.png"
            alt="Air Freight Cargo Aircraft Loading"
            className="w-full h-full object-cover object-[center_20%] opacity-65"
          />
          {/* Subtle dark tint to preserve text readability while keeping the airplane clearly visible */}
          <div className="absolute inset-0 bg-[#05070B]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-[#05070B]/60" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">



          {/* Massive Display H1 */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="fa-font-display text-4xl sm:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight text-white leading-[1.08]">
              Every freight invoice hides margin.{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                We extract the proof.
              </span>
            </h1>

            <p className="mt-8 text-base sm:text-lg lg:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto font-normal">
              Autonomous AI that audits carrier invoices against your signed rate schedules, isolates unauthorized accessorials with penny precision, and formats carrier-ready dispute evidence.
            </p>

            {/* Button-in-Button CTA Cluster */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/auth/signup"
                onClick={navigate("/auth/signup")}
                className="group relative inline-flex items-center gap-4 pl-6 pr-2 py-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold text-sm hover:opacity-95 transition-all duration-300 shadow-[0_0_35px_rgba(16,185,129,0.35)] active:scale-[0.98] cursor-pointer"
              >
                <span>Upload Invoice for Free Audit</span>
                <span className="w-8 h-8 rounded-full bg-slate-950/20 flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-all duration-300">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                </span>
              </a>

              <a
                href="#interactive-audit"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/10 bg-white/[0.03] text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
              >
                <span>View Live Audit Radar</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            {/* Proof Metrics Micro-Bar */}
            <div className="mt-14 pt-8 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-left">
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">$18.4M+</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Audited Volume</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">4.8%</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Avg Overcharge Catch</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">99.4%</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Extraction Precision</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-teal-300">0.0%</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Hallucinated Disputes</div>
              </div>
            </div>
          </div>

          {/* ─── 3. THE "DOUBLE-BEZEL" INTERACTIVE AUDIT RADAR CONSOLE ─── */}
          <div id="interactive-audit" className="mt-20 scroll-mt-24">

            {/* Scenario Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {DEMO_SCENARIOS.map((s) => {
                const isActive = s.id === selectedScenarioId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenarioId(s.id)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${isActive
                      ? "bg-white/10 text-white border border-white/25 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                      : "bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/[0.03]"
                      }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>

            {/* Hardware-Grade Doppelrand Nested Architecture */}
            <div className="p-2 sm:p-3 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.03]">

              {/* Inner Core Container */}
              <div className="rounded-[calc(2rem-0.75rem)] bg-[#070B16]/75 backdrop-blur-xl border border-white/[0.07] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden">

                {/* Console Bar Header */}
                <div className="px-6 py-4 border-b border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {activeScenario.carrier}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                          {activeScenario.ref}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {activeScenario.route} · <span className="text-slate-500">{activeScenario.mode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Matched Against</div>
                      <div className="text-xs font-mono text-emerald-400">{activeScenario.contractRef}</div>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center gap-2">

                      <span className="text-xs font-mono font-bold text-rose-300">
                        {activeScenario.flaggedCount}  Discrepancies Caught
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Reconciliation Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-slate-400 uppercase tracking-wider text-[10px] font-mono bg-white/[0.01]">
                        <th className="py-3 px-6 font-medium">Billed Item Description</th>
                        <th className="py-3 px-4 text-right font-medium">Invoice Billed</th>
                        <th className="py-3 px-4 text-right font-medium">Contract Rate</th>
                        <th className="py-3 px-4 text-right font-medium">Discrepancy</th>
                        <th className="py-3 px-6 font-medium">Contract Clause Evidence</th>
                        <th className="py-3 px-4 text-center font-medium">Audit Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {activeScenario.items.map((item, index) => {
                        const varianceAmt = item.billed - item.expected;
                        const isOver = varianceAmt > 0;
                        return (
                          <tr
                            key={index}
                            className={`group transition-colors ${item.status !== "matched"
                              ? "bg-rose-500/[0.03] hover:bg-rose-500/[0.06]"
                              : "hover:bg-white/[0.02]"
                              }`}
                          >
                            <td className="py-3.5 px-6 font-medium text-slate-200">
                              {item.desc}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                              ${item.billed.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-emerald-400/90">
                              ${item.expected.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-semibold">
                              {isOver ? (
                                <span className="text-rose-400">+${varianceAmt.toFixed(2)}</span>
                              ) : (
                                <span className="text-slate-500">$0.00</span>
                              )}
                            </td>
                            <td className="py-3.5 px-6 text-slate-400 max-w-xs text-[11px] leading-relaxed">
                              {item.rule}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <StatusTag status={item.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Console Action & Summary Bar */}
                <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Invoice Total</div>
                      <div className="font-mono text-sm text-slate-300 font-semibold">
                        ${activeScenario.billed.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-slate-600">→</div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Approved Remittance</div>
                      <div className="font-mono text-sm text-emerald-400 font-semibold">
                        ${activeScenario.expected.toFixed(2)}
                      </div>
                    </div>
                    <div className="pl-4 border-l border-white/10">
                      <div className="text-[10px] text-rose-400 uppercase tracking-wider font-mono">Recoverable Cash</div>
                      <div className="font-mono text-lg font-bold text-rose-400">
                        −${activeScenario.variance.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Trigger Dispute Modal */}
                  <button
                    onClick={() => setDisputeModalOpen(true)}
                    className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 text-xs font-semibold transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)] active:scale-[0.98]"
                  >
                    <span>Inspect Carrier Dispute Letter</span>
                    <Send className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500 font-mono">
              Realistic freight audit demonstration · Rates cross-referenced against executed tariff addendums
            </p>
          </div>
        </div>
      </section>

      {/* ─── 4. THE ASYMMETRIC BENTO GRID: ENGINE ARCHITECTURE ─── */}
      <section id="capabilities" className="py-24 sm:py-32 lg:py-40 relative border-t border-white/[0.06] scroll-mt-16 overflow-hidden">
        {/* Cargo Ship Background (Ocean Freight & Port Drayage) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <img
            src="/freight_images/cargo_ship.png"
            alt="Maritime Ocean Container Freight Vessel"
            className="w-full h-full object-cover object-[center_30%] opacity-60"
          />
          {/* Subtle dark tint to keep cards legible while ocean vessel is clearly visible */}
          <div className="absolute inset-0 bg-[#05070B]/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070B] via-transparent to-[#05070B]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="max-w-2xl">

            <h2 className="fa-font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Built for high-volume freight complexity.
            </h2>
            <p className="mt-4 text-slate-400 text-base leading-relaxed">
              General invoice extractors fail on freight tariffs because logistics agreements are conditional matrices of fuel indexes, free-time windows, and equipment addendums.
            </p>
          </div>

          {/* Asymmetrical Bento Structure */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Bento Card 1: Span 8 — Dynamic Tariff & Addendum Mapping */}
            <div className="md:col-span-8 p-1.5 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
              <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#090D1A]/75 backdrop-blur-xl border border-white/[0.05] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-teal-400" strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 border border-white/10 px-2.5 py-1 rounded-full">
                      T-2 Vector Engine
                    </span>
                  </div>

                  <h3 className="fa-font-display text-xl sm:text-2xl font-bold text-white mb-3">
                    Multi-Tier Tariff & Index Modeling
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                    Parses master transportation agreements, discount matrices (CZAR-Lite, SMC³), EIA weekly diesel fuel surcharge schedules, and lane minimums. Every billed item is benchmarked against exact mathematical terms.
                  </p>
                </div>

                {/* Visual Contract Clause Chiplet */}
                <div className="mt-8 p-4 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs text-slate-300 space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] pb-2 border-b border-white/[0.04]">
                    <span>Contract Clause Resolver</span>
                    <span className="text-emerald-400">Match 100%</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-emerald-400">§7.1(b):</span> IF Diesel_Index &gt; $3.50 AND &lt; $3.75 THEN FSC = 14.0%
                  </div>
                  <div className="text-rose-400">
                    <span className="text-slate-500">Invoice:</span> Carrier applied 19.2% without index justification (Violation Flagged)
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Span 4 — Autonomous Accessorial Sentry */}
            <div className="md:col-span-4 p-1.5 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
              <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#090D1A]/75 backdrop-blur-xl border border-white/[0.05] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                    <Shield className="w-5 h-5 text-rose-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="fa-font-display text-xl font-bold text-white mb-3">
                    Rogue Accessorial Defense
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Instantly flags phantom liftgates, bogus residential drop charges, reweigh fees without scale tickets, and pre-pulls lacking dispatch records.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Accessorial Block Rate</span>
                  <span className="text-rose-400 font-bold">34.2% of Audits</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Span 4 — Demurrage & Detention Clock */}
            <div className="md:col-span-4 p-1.5 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
              <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#090D1A]/75 backdrop-blur-xl border border-white/[0.05] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                    <Clock className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="fa-font-display text-xl font-bold text-white mb-3">
                    Free-Time & Demurrage Clocks
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Tracks contractual terminal free time against container interchange gate logs. Prevents premature detention and chassis fee roll-overs.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Avg Drayage Recovery</span>
                  <span className="text-amber-400 font-bold">$380 - $720/load</span>
                </div>
              </div>
            </div>

            {/* Bento Card 4: Span 8 — Evidence-Backed Dispute Architect */}
            <div className="md:col-span-8 p-1.5 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
              <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#090D1A]/75 backdrop-blur-xl border border-white/[0.05] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                    </div>

                  </div>

                  <h3 className="fa-font-display text-xl sm:text-2xl font-bold text-white mb-3">
                    Carrier-Ready Legal Dispute Letters
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                    Instead of generic objection notices, our engine generates structured, legally precise dispute letters complete with section citations, approved short-pay totals, and POD attachments.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-slate-300">
                    PDF Export
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-slate-300">
                    EDI 210 / 820 Remittance Ready
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-slate-300">
                    Direct Carrier Mail Dispatch
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 5. THE 4-STAGE AUTONOMOUS PIPELINE ─── */}
      <section id="how-it-works" className="py-24 sm:py-32 lg:py-40 relative border-t border-white/[0.06] scroll-mt-16 bg-[#04060A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-20">

            <h2 className="fa-font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Four steps from carrier invoice to reclaimed cash.
            </h2>
            <p className="mt-4 text-slate-400 text-base">
              Upload your master rate agreements once. Invoices are parsed, validated, and reconciled with zero manual data entry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Multi-Format Ingestion",
                desc: "Drop carrier PDFs, scans, image bundles, or pipe directly via forwarding inbox. AI handles layout variance across 500+ carriers.",
                icon: FileText,
              },
              {
                step: "02",
                title: "Contract Matrix Match",
                desc: "Every line item is paired with the specific rate tariff, baseline discount, fuel surcharge index, and authorized addendum clause.",
                icon: Cpu,
              },
              {
                step: "03",
                title: "Penny-Accurate Audit",
                desc: "Calculates the exact contractual obligation. Flags unauthorized accessorials, overbilled chassis, and invalid weight surcharges.",
                icon: Calculator,
              },
              {
                step: "04",
                title: "Evidence & Dispute",
                desc: "Generates dispute evidence citing agreements and terminal data. Review and send directly or integrate with your ERP remittance.",
                icon: Send,
              },
            ].map((st, i) => (
              <div
                key={st.step}
                className="p-1.5 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl group hover:border-emerald-500/30 transition-colors duration-300"
              >
                <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#080C18]/75 backdrop-blur-xl border border-white/[0.05] p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <span className="font-mono text-2xl font-bold text-emerald-400/50 group-hover:text-emerald-400 transition-colors">
                        {st.step}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <st.icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="fa-font-display text-lg font-bold text-white mb-2">
                      {st.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── 6. INTERACTIVE FREIGHT ROI CALCULATOR ─── */}
      <section id="calculator" className="py-24 sm:py-32 lg:py-40 relative border-t border-white/[0.06] scroll-mt-16 overflow-hidden">
        {/* Financial Capital Recovery & Savings Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <img
            src="/freight_images/saving.png"
            alt="Capital Recovery & Financial Savings"
            className="w-full h-full object-cover object-[center_65%] opacity-65"
          />
          {/* Subtle dark tint so the currency stacks and upward green yield chart glow cleanly behind the calculator */}
          <div className="absolute inset-0 bg-[#05070B]/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070B] via-transparent to-[#05070B]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="p-2 sm:p-3 rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)]">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#070B16]/75 backdrop-blur-xl border border-white/[0.07] p-8 sm:p-12 lg:p-16">

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

                {/* Left: Interactive Controls */}
                <div className="lg:col-span-7">

                  <h2 className="fa-font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Quantify your freight overpayment leakage.
                  </h2>
                  <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-xl">
                    Shippers and logistics managers universally discover an average 3% to 7% billing error rate on complex carrier invoices. Move the sliders to calculate your recovery upside.
                  </p>

                  <div className="mt-10 space-y-8">
                    {/* Slider 1: Monthly Spend */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-medium text-slate-300">
                          Monthly Freight Spend (All Modes)
                        </label>
                        <span className="font-mono text-base font-bold text-white">
                          ${monthlySpend.toLocaleString()} / mo
                        </span>
                      </div>
                      <input
                        type="range"
                        min="25000"
                        max="1000000"
                        step="10000"
                        value={monthlySpend}
                        onChange={(e) => setMonthlySpend(Number(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                        <span>$25k</span>
                        <span>$500k</span>
                        <span>$1M+</span>
                      </div>
                    </div>

                    {/* Slider 2: Leakage Rate */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-medium text-slate-300">
                          Estimated Billing Error & Accessorial Rate
                        </label>
                        <span className="font-mono text-base font-bold text-emerald-400">
                          {leakageRate.toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2.0"
                        max="9.0"
                        step="0.1"
                        value={leakageRate}
                        onChange={(e) => setLeakageRate(Number(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                        <span>2.0% (Conservative)</span>
                        <span>4.8% (Industry Median)</span>
                        <span>9.0% (High Accessorial)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Projected Yield Board */}
                <div className="lg:col-span-5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="rounded-xl bg-black/40 backdrop-blur-md p-6 sm:p-8 border border-white/[0.04]">
                    <div className="text-xs uppercase font-mono tracking-wider text-slate-400">
                      Projected Annual Capital Recouped
                    </div>
                    <div className="mt-2 text-4xl sm:text-5xl font-extrabold font-mono text-emerald-400">
                      ${Math.round(annualSavings).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Pure bottom-line margin returned to operations
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/[0.08] space-y-4 font-mono text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Monthly Run-Rate Savings</span>
                        <span className="font-bold text-white">
                          ${Math.round(annualSavings / 12).toLocaleString()} / mo
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Manual Audit Hours Reclaimed</span>
                        <span className="font-bold text-teal-300">
                          ~{hoursSavedPerMonth} hrs / mo
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Typical System ROI</span>
                        <span className="font-bold text-emerald-400">
                          12.4x Multiplier
                        </span>
                      </div>
                    </div>

                    <a
                      href="/auth/signup"
                      onClick={navigate("/auth/signup")}
                      className="mt-8 w-full group inline-flex items-center justify-center gap-3 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_25px_rgba(16,185,129,0.25)] active:scale-[0.98] cursor-pointer"
                    >
                      <span>Claim Your First Recovery</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── 7. HUMAN-IN-THE-LOOP & ENTERPRISE GOVERNANCE ─── */}
      <section className="py-24 sm:py-32 relative border-t border-white/[0.06] bg-[#04060A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="fa-font-display text-3xl sm:text-4xl font-extrabold text-white">
              Zero automated short-pays without human consent.
            </h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Carrier partnerships matter. Our AI never sends carrier correspondence or modifies remittance batches until an authorized team member clicks approve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <Eye className="w-6 h-6 text-emerald-400 mb-4" strokeWidth={1.5} />
              <h3 className="fa-font-display text-base font-bold text-white mb-2">
                100% Explainable Mathematics
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Every single flagged delta links to the exact sentence, table row, or diesel index formula in your contract. No mysterious proprietary black boxes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <ShieldCheck className="w-6 h-6 text-teal-400 mb-4" strokeWidth={1.5} />
              <h3 className="fa-font-display text-base font-bold text-white mb-2">
                Carrier Relationship Safeguard
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Maintain carrier goodwill by presenting polite, structured, evidence-backed disputes that carrier billing departments can reconcile instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <Lock className="w-6 h-6 text-cyan-400 mb-4" strokeWidth={1.5} />
              <h3 className="fa-font-display text-base font-bold text-white mb-2">
                Tenant Data Sovereignty
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Your negotiated freight rates, volume tiers, and carrier contracts are encrypted at rest and never shared or aggregated into external models.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 8. FINAL CONVERSION ARCHITECTURE ─── */}
      <section className="py-24 sm:py-36 relative border-t border-white/[0.06] overflow-hidden">
        {/* Subtle Highway Logistics Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <img
            src="/freight_images/cargo_truck.png"
            alt="Highway Freight Logistics Truck"
            className="w-full h-full object-cover object-[center_45%] opacity-55"
          />
          <div className="absolute inset-0 bg-[#05070B]/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070B] via-transparent to-[#030508]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          <div className="p-2 rounded-[2.5rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.9)]">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#070B16]/75 backdrop-blur-xl px-8 py-16 sm:py-20 border border-white/[0.08]">


              <h2 className="fa-font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto">
                Stop paying for freight services you never ordered.
              </h2>
              <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Upload your latest carrier invoice. In less than 30 seconds, see exactly how much you were overbilled and get the dispute letter to fix it.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="/auth/signup"
                  onClick={navigate("/auth/signup")}
                  className="group relative inline-flex items-center gap-4 pl-6 pr-2 py-2.5 rounded-full font-bold text-sm hover:brightness-105 transition-all duration-300 shadow-[0_0_35px_rgba(255,255,255,0.25)] active:scale-[0.98] cursor-pointer fa-btn-pill-white"
                  style={{ backgroundColor: '#ffffff', color: '#05070b' }}
                >
                  <span className="font-bold tracking-tight" style={{ color: '#05070b' }}>Start Free Invoice Audit</span>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#05070b] group-hover:text-white"
                    style={{ backgroundColor: 'rgba(5, 7, 11, 0.08)', color: '#05070b' }}
                  >
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.5} />
                  </span>
                </a>

                <a
                  href="/auth/login"
                  onClick={navigate("/auth/login")}
                  className="px-6 py-3.5 rounded-full border border-white/10 bg-white/[0.03] text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Sign In to Enterprise Workspace
                </a>
              </div>

              <div className="mt-8 text-xs font-mono text-slate-500">
                No credit card required · Compatible with all LTL, Drayage & Truckload carriers
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 9. MINIMALIST ARCHITECTURAL FOOTER ─── */}
      <footer className="py-16 border-t border-white/[0.06] bg-[#030508] text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">

            <div className="md:col-span-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                <span className="fa-font-display font-bold text-white tracking-tight text-sm">
                  FreightAudit<span className="text-emerald-400">AI</span>
                </span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
                Autonomous freight invoice audit, accessorial detection, and evidence-backed contract reconciliation software for enterprise shippers.
              </p>
            </div>

            <div className="md:col-span-3">
              <div className="font-mono uppercase tracking-wider text-[10px] text-slate-300 font-semibold mb-3">
                Platform
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    Reconciliation Pipeline
                  </a>
                </li>
                <li>
                  <a href="#capabilities" className="hover:text-white transition-colors">
                    Accessorial Engine
                  </a>
                </li>
                <li>
                  <a href="#interactive-audit" className="hover:text-white transition-colors">
                    Live Audit Radar
                  </a>
                </li>
                <li>
                  <a href="#calculator" className="hover:text-white transition-colors">
                    Capital ROI Calculator
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <div className="font-mono uppercase tracking-wider text-[10px] text-slate-300 font-semibold mb-3">
                Access
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="/auth/login" onClick={navigate("/auth/login")} className="hover:text-white transition-colors">
                    Sign In
                  </a>
                </li>
                <li>
                  <a href="/auth/signup" onClick={navigate("/auth/signup")} className="hover:text-white transition-colors">
                    Create Tenant Account
                  </a>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-400">
            <div>
              © {new Date().getFullYear()} FreightAudit AI Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <span>All Audit Engines Operational · Zero Hallucination Protocol · Built by Noreina Studio</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── 10. SAMPLE DISPUTE LETTER MODAL (DOPPELRAND ARCHITECTURE) ─── */}
      {disputeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDisputeModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Sample Carrier Dispute Package"
        >
          {/* Outer Shell */}
          <div className="p-1 sm:p-1.5 rounded-[2rem] bg-white/[0.08] border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.9)] max-w-2xl w-full">

            {/* Inner Core */}
            <div className="rounded-[calc(2rem-0.375rem)] bg-[#080D1A] border border-white/10 p-6 sm:p-8 relative">

              <button
                onClick={() => setDisputeModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Send className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="fa-font-display text-lg font-bold text-white">
                    Formal Dispute Memorandum
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generated from active audit: {activeScenario.carrier} ({activeScenario.ref})
                  </p>
                </div>
              </div>

              {/* Formatted Letter Body */}
              <div className="p-4 sm:p-5 rounded-xl bg-black/60 border border-white/[0.08] text-xs font-mono text-slate-300 overflow-y-auto max-h-80 whitespace-pre-wrap leading-relaxed selection:bg-emerald-500/30">
                {DISPUTE_TEMPLATES[selectedScenarioId] || DISPUTE_TEMPLATES.drayage}
              </div>

              {/* Modal Footer Controls */}
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  onClick={copyDisputeToClipboard}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-mono font-medium transition-colors cursor-pointer"
                >
                  {copiedDispute ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copy Formal Dispute Notice</span>
                    </>
                  )}
                </button>

                <a
                  href="/auth/signup"
                  onClick={(e) => {
                    setDisputeModalOpen(false);
                    navigate("/auth/signup")(e);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  <span>Audit Your Own Invoices</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
