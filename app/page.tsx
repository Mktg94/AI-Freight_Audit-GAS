"use client";

import React from 'react';
import { 
  Zap, ArrowRight, ShieldAlert, CheckCircle, UploadCloud, Cpu, 
  HelpCircle, Sparkles, MoveRight, Layers, FileCheck, ShieldCheck, 
  CheckCircle2, Laptop, Calendar, DollarSign, BarChart3, TrendingUp, Search
} from 'lucide-react';

export default function LandingPage() {
  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F1F5F9] font-sans antialiased selection:bg-[#2DD4BF]/30 selection:text-[#2DD4BF]" id="landing-page-wrapper">
      
      {/* Dynamic drifting background dots styling */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes driftDots {
          0% { background-position: 0px 0px; }
          100% { background-position: 40px 40px; }
        }
        .drifting-dots-bg {
          background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 24px 24px;
          animation: driftDots 20s linear infinite;
        }
      `}} />

      {/* SECTION 1 — Navigation */}
      <nav className="bg-[#0A0F1E]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#1F2D45] transition-all duration-300" id="landing-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo with small zap icon */}
          <div 
            onClick={() => navigateTo('/')}
            className="flex items-center gap-2 cursor-pointer group"
            id="nav-logo"
          >
            <div className="bg-[#2DD4BF]/10 text-[#2DD4BF] p-1.5 rounded-lg border border-[#2DD4BF]/20 shadow-[0_0_15px_rgba(45,212,191,0.15)] group-hover:scale-110 transition-transform">
              <Zap size={18} className="fill-[#2DD4BF]/20 text-[#2DD4BF]" />
            </div>
            <span className="font-display font-black text-white hover:text-[#2DD4BF] tracking-tight uppercase text-lg transition-colors">
              FreightAudit <span className="text-[#2DD4BF]">AI</span>
            </span>
          </div>

          {/* Right Action Trigger Buttons */}
          <div className="flex items-center gap-4" id="nav-actions">
            <button
              onClick={() => navigateTo('/pricing')}
              className="text-xs uppercase font-extrabold tracking-wider text-slate-400 hover:text-[#2DD4BF] font-mono mr-2 transition-colors cursor-pointer"
              id="nav-pricing-link"
            >
              Pricing
            </button>
            <button
              onClick={() => navigateTo('/auth/login')}
              className="font-mono text-xs uppercase font-extrabold tracking-wider border border-[#1F2D45] hover:border-[#2DD4BF] hover:text-[#2DD4BF] text-zinc-300 py-2 px-4.5 rounded-lg transition-all cursor-pointer"
              id="nav-login-btn"
            >
              Login
            </button>
            <button
              onClick={() => navigateTo('/auth/signup')}
              className="bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-mono text-xs uppercase font-black tracking-wider py-2 px-5 rounded-lg transition-all cursor-pointer shadow-[0_0_20px_rgba(45,212,191,0.3)]"
              id="nav-get-started-btn"
            >
              Get Started Free
            </button>
          </div>

        </div>
      </nav>

      {/* SECTION 2 — Hero */}
      <header className="relative py-12 lg:py-24 bg-[#0A0F1E] drifting-dots-bg overflow-hidden flex flex-col justify-center border-b border-[#1F2D45]/30" id="landing-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text content info */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Beta pill */}
            <div className="inline-flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] rounded-full py-1 px-3.5 select-none font-mono text-[10px] uppercase font-black tracking-wider" id="hero-beta-badge">
              <Sparkles size={11} className="fill-[#F59E0B]/15" />
              <span>Now in Beta · Free to start</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6.5xl font-black text-white tracking-tight leading-1.07 font-display uppercase" id="hero-headline">
              Stop Overpaying on <br />
              <span className="text-[#2DD4BF] drop-shadow-[0_0_15px_rgba(45,212,191,0.2)]">Freight. Automatically.</span>
            </h1>

            {/* Description subheader */}
            <p className="text-sm md:text-base lg:text-lg text-[#94A3B8] max-w-xl font-sans leading-relaxed" id="hero-subheadline">
              FreightAudit AI catches billing errors across every invoice — before you pay them. Powered by AI. Backed by your contracts.
            </p>

            {/* Action buttons CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2" id="hero-cta-box">
              <button
                onClick={() => navigateTo('/auth/signup')}
                className="bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-mono text-sm uppercase font-black tracking-wider py-3.5 px-8 rounded-lg transition-all cursor-pointer shadow-[0_0_20px_rgba(45,212,191,0.45)] text-center flex items-center justify-center gap-2"
                id="hero-primary-cta"
              >
                <span>Start Free Audit</span>
                <MoveRight size={16} />
              </button>
              <a
                href="#how-it-works-anchor"
                className="border border-[#2DD4BF]/40 hover:border-[#2DD4BF] text-[#2DD4BF] font-mono text-sm uppercase font-black tracking-wider py-3.5 px-7 rounded-lg transition-all text-center"
                id="hero-secondary-cta"
              >
                See How It Works
              </a>
            </div>

          </div>

          {/* Right CSS Mock interactive Invoice Card */}
          <div className="lg:col-span-5 relative" id="hero-visual-container">
            <div className="absolute inset-0 bg-radial-gradient from-[#2DD4BF]/20 to-transparent blur-3xl opacity-30 select-none pointer-events-none" />
            
            {/* Visual Card body representation */}
            <div className="relative bg-[#111827] border border-teal-900/40 rounded-xl shadow-2xl p-5 md:p-6 w-full max-w-md mx-auto transform hover:-translate-y-1 transition-all">
              
              {/* Fake Invoice Meta */}
              <div className="flex justify-between items-start border-b border-[#1F2D45] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                    <span className="font-mono text-[9px] font-black uppercase tracking-wider text-red-400">Audit Discrepancy Found</span>
                  </div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wide">Carrier Ledger FDX-98774</h4>
                  <p className="text-[9px] text-zinc-500 font-mono">Invoice Date: 2026-06-03</p>
                </div>
                <span className="font-mono text-[10px] font-black tracking-wide text-[#2DD4BF] bg-[#2DD4BF]/10 border border-[#2DD4BF]/25 py-1 px-2.5 rounded">
                  FEDEX EXPRESS
                </span>
              </div>

              {/* Rows Comparison details container */}
              <div className="pt-4 space-y-3.5">
                
                {/* Row 1 - Verified Normal Row */}
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-slate-500 font-bold">
                    <span>Base Freight Charge</span>
                    <span className="text-[#10B981] flex items-center gap-1">✓ Verified</span>
                  </div>
                  <div className="flex justify-between text-white font-mono bg-[#0A0F1E]/40 p-1.5 px-2.5 rounded border border-[#1F2D45]/20">
                    <span className="text-zinc-400">Billed: $1,240.00</span>
                    <span className="text-zinc-500 font-medium">Contract expected: $1,240.00</span>
                  </div>
                </div>

                {/* Row 2 - FLAGGED Overcharge Row */}
                <div className="text-xs space-y-1 border border-red-900/40 p-2.5 bg-amber-500/5 rounded-lg">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-amber-500 font-black">
                    <span>Fuel Surcharge index %</span>
                    <span className="text-[#EF4444] animate-pulse font-mono font-black flex items-center gap-1">⚠ OVERCHARGE DETECTED</span>
                  </div>
                  <div className="flex justify-between text-white font-mono bg-[#0A0F1E]/80 p-1.5 px-2 rounded">
                    <span className="text-zinc-300 font-black">Billed: $385.10</span>
                    <span className="text-[#10B981] font-extrabold">Contract: $112.50</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-[#EF4444] font-black">
                    <span>Rate Sheet discrepancy:</span>
                    <span className="bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">+$272.60 overcharge</span>
                  </div>
                </div>

                {/* Row 3 - Regular Row verified */}
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-slate-500 font-bold">
                    <span>Residential Delivery Accessory</span>
                    <span className="text-[#10B981] flex items-center gap-1">✓ Verified</span>
                  </div>
                  <div className="flex justify-between text-white font-mono bg-[#0A0F1E]/40 p-1.5 px-2.5 rounded border border-[#1F2D45]/20">
                    <span className="text-zinc-400">Billed: $85.00</span>
                    <span className="text-zinc-500 font-medium">Contract expected: $85.00</span>
                  </div>
                </div>

              </div>

              {/* Total Card footer */}
              <div className="border-t border-[#1F2D45] mt-4 pt-4 flex justify-between items-center font-mono">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">Net Audited Difference:</span>
                <span className="text-[#EF4444] text-xs font-black bg-[#EF4444]/15 px-2.5 py-1 rounded border border-red-500/20">
                  -$272.60 Disputed Amount
                </span>
              </div>

            </div>
          </div>

        </div>
      </header>

      {/* SECTION 3 — Stats Bar */}
      <section className="bg-[#111827] border-y border-[#1F2D45]" id="landing-stats-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 items-center">
            
            {/* Stat 1 */}
            <div className="flex flex-col items-center justify-center text-center space-y-1 md:border-r border-[#1F2D45] md:pr-4">
              <span className="text-4xl font-extrabold font-display text-[#2DD4BF] tracking-tight">
                $2.4B+
              </span>
              <span className="text-xs text-[#94A3B8] font-mono uppercase tracking-widest font-bold">
                Industry overcharges annually
              </span>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center justify-center text-center space-y-1 md:border-r border-[#1F2D45] px-4">
              <span className="text-4xl font-extrabold font-display text-[#2DD4BF] tracking-tight">
                15-25%
              </span>
              <span className="text-xs text-[#94A3B8] font-mono uppercase tracking-widest font-bold">
                Average invoice error rate
              </span>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center justify-center text-center space-y-1 pl-4">
              <span className="text-4xl font-extrabold font-display text-[#2DD4BF] tracking-tight">
                $13.11
              </span>
              <span className="text-xs text-[#94A3B8] font-mono uppercase tracking-widest font-bold">
                Cost to manually process one invoice
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4 — How It Works (3 Steps) */}
      <section className="py-20 bg-[#0A0F1E] border-b border-[#1F2D45]/20 scroll-mt-18" id="how-it-works-anchor">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">
              Audit Intelligence in Action
            </h2>
            <p className="text-xs font-mono uppercase tracking-widest text-[#2DD4BF] font-black">
              three seamless steps to automate invoice audits
            </p>
          </div>

          <div className="relative" id="steps-card-deck">
            
            {/* Connecting lines between nodes on desktop sizes */}
            <div className="hidden lg:block absolute top-[44%] left-24 right-24 h-[1px] bg-gradient-to-r from-teal-500/10 via-[#2DD4BF]/30 to-teal-500/10 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              
              {/* Step 1 */}
              <div className="bg-[#111827] border border-teal-900/40 rounded-xl p-6.5 text-center flex flex-col items-center space-y-4 hover:border-[#2DD4BF]/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/30 flex items-center justify-center font-mono text-base font-black shadow-[0_0_15px_rgba(45,212,191,0.1)]">
                  1
                </div>
                <div className="bg-[#1C2537] p-3 rounded-xl text-[#2DD4BF] border border-[#1F2D45]/40 mt-1">
                  <UploadCloud size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white font-display uppercase tracking-tight">Upload Your Invoice</h3>
                  <p className="text-xs text-[#94A3B8] font-sans">
                    Drop PDF invoices via our secure portal.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#111827] border border-teal-900/40 rounded-xl p-6.5 text-center flex flex-col items-center space-y-4 hover:border-[#2DD4BF]/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/30 flex items-center justify-center font-mono text-base font-black shadow-[0_0_15px_rgba(45,212,191,0.1)]">
                  2
                </div>
                <div className="bg-[#1C2537] p-3 rounded-xl text-[#2DD4BF] border border-[#1F2D45]/40 mt-1">
                  <Cpu size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white font-display uppercase tracking-tight">AI Audits in Minutes</h3>
                  <p className="text-xs text-[#94A3B8] font-sans">
                    Compares every line item against your contracts.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#111827] border border-teal-900/40 rounded-xl p-6.5 text-center flex flex-col items-center space-y-4 hover:border-[#2DD4BF]/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/30 flex items-center justify-center font-mono text-base font-black shadow-[0_0_15px_rgba(45,212,191,0.1)]">
                  3
                </div>
                <div className="bg-[#1C2537] p-3 rounded-xl text-[#2DD4BF] border border-[#1F2D45]/40 mt-1">
                  <CheckCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white font-display uppercase tracking-tight">Catch Overcharges</h3>
                  <p className="text-xs text-[#94A3B8] font-sans">
                    Review flags and generate disputes instantly.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 5 — Features (3 Cards) */}
      <section className="py-20 bg-[#0A0F1E] border-b border-[#1F2D45]/20" id="landing-features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight animate-fade-in">
              What FreightAudit AI Does
            </h2>
            <p className="text-xs font-mono uppercase tracking-widest text-[#2DD4BF] font-black">
              Enterprise grade tools crafted for logistic billing integrity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="features-grid">
            
            {/* Feature 1 */}
            <div className="bg-[#111827] border border-[#1F2D45]/60 hover:border-[#2DD4BF]/40 rounded-xl p-6 relative flex flex-col space-y-4 transition-all">
              <div className="bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20 p-3.5 rounded-xl self-start">
                <Search size={24} />
              </div>
              <div className="space-y-1.5 flex-grow">
                <h3 className="text-sm font-black text-white font-display uppercase tracking-tight">Smart Extraction</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  AI reads any invoice format, any carrier. No standard templates, regex rules, or structured mapping schedules required.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#111827] border border-[#1F2D45]/60 hover:border-[#2DD4BF]/40 rounded-xl p-6 relative flex flex-col space-y-4 transition-all">
              <div className="bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20 p-3.5 rounded-xl self-start">
                <FileCheck size={24} />
              </div>
              <div className="space-y-1.5 flex-grow">
                <h3 className="text-sm font-black text-white font-display uppercase tracking-tight">Contract Matching</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Every charge verified against your active carrier rate agreements. We check base freights, accessorial fees, weight steps, and fuel scale models.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#111827] border border-[#1F2D45]/60 hover:border-[#2DD4BF]/40 rounded-xl p-6 relative flex flex-col space-y-4 transition-all">
              <div className="bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20 p-3.5 rounded-xl self-start">
                <Zap size={24} />
              </div>
              <div className="space-y-1.5 flex-grow">
                <h3 className="text-sm font-black text-white font-display uppercase tracking-tight">Dispute Automation</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  One-click dispute letters generated dynamically with exact references. Sent in seconds to bypass lengthy back-and-forth arguments.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 6 — CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-teal-950 to-[#0A0F1E] relative border-b border-[#1F2D45]/30 overflow-hidden" id="landing-cta-banner">
        <div className="absolute inset-0 bg-[#000]/25 mix-blend-multiply pointer-events-none select-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4.5xl font-black text-white font-display tracking-tight uppercase leading-none">
              Ready to stop the leakage?
            </h2>
            <p className="text-[#94A3B8] text-sm md:text-base max-w-xl mx-auto font-sans">
              Join logistics teams already saving thousands of dollars per month by catching carrier billing errors early.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => navigateTo('/auth/signup')}
              className="w-full sm:w-auto bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-mono text-sm uppercase font-black tracking-wider py-4 px-10 rounded-lg shadow-[0_0_20px_rgba(45,212,191,0.45)] cursor-pointer transition-all"
              id="cta-create-account"
            >
              Create Free Account
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 7 — Footer */}
      <footer className="bg-[#111827] border-t border-[#1F2D45] py-12" id="landing-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Logo brand and copyrights */}
          <div className="text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <span className="font-display font-black text-xs text-white uppercase tracking-tight">FreightAudit AI</span>
            </div>
            <p className="text-[11px] text-[#475569] font-mono">
              &copy; 2025 FreightAudit AI. All rights reserved. Registered SaaS.
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap justify-center gap-6 text-[#94A3B8] font-mono text-[10px] uppercase font-bold tracking-wider" id="footer-links">
            <span className="hover:text-[#2DD4BF] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-[#1F2D45]">•</span>
            <span className="hover:text-[#2DD4BF] cursor-pointer transition-colors">Terms of Service</span>
            <span className="text-[#1F2D45]">•</span>
            <span className="hover:text-[#2DD4BF] cursor-pointer transition-colors" onClick={() => navigateTo('#landing-features')}>Features</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
