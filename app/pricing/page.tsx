"use client";

import React, { useState } from 'react';
import { CheckCircle, Zap, ChevronDown, ChevronUp, Mail, ArrowRight, Sparkles } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleToggle = () => {
    setIsAnnual(!isAnnual);
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "Can I change plans later?",
      answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. When you change plans, your current balance and limits will be updated instantly."
    },
    {
      question: "What counts as an invoice?",
      answer: "Each freight bill or individual single-page/multi-page invoice PDF document processed through the compliance auditor counts as a singular ledgered invoice item."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, our Professional plan includes a 14-day free trial containing fully unlocked access to bulk uploading and contract auditing features for evaluation."
    },
    {
      question: "What happens if I hit my invoice limit?",
      answer: "We will notify you via email when you are close to hitting your invoice audit limit. Once exceeded, automatic processing is temporarily paused until you upgrade or request additional ledger slots."
    },
    {
      question: "Is my data secure?",
      answer: "All documents and rate schedules uploaded are secured using bank-level AES-256 encryption at rest and in transit. Your pricing agreements remain completely private."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F1F5F9] font-sans antialiased pb-20 selection:bg-[#2DD4BF]/30 selection:text-[#2DD4BF]" id="pricing-page-container">
      
      {/* Navigation Header */}
      <nav className="bg-[#0A0F1E]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#1F2D45]" id="pricing-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div 
            onClick={() => navigateTo('/')}
            className="flex items-center gap-2 cursor-pointer group"
            id="pricing-logo"
          >
            <div className="bg-[#2DD4BF]/10 text-[#2DD4BF] p-1.5 rounded-lg border border-[#2DD4BF]/20 shadow-[0_0_15px_rgba(45,212,191,0.15)] group-hover:scale-110 transition-transform">
              <Zap size={18} className="fill-[#2DD4BF]/20 text-[#2DD4BF]" />
            </div>
            <span className="font-display font-black text-white hover:text-[#2DD4BF] tracking-tight uppercase text-lg transition-colors">
              FreightAudit <span className="text-[#2DD4BF]">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo('/auth/login')}
              className="font-mono text-xs uppercase font-extrabold tracking-wider border border-[#1F2D45] hover:border-[#2DD4BF] hover:text-[#2DD4BF] text-zinc-300 py-2 px-4.5 rounded-lg transition-all cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => navigateTo('/auth/signup')}
              className="bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-mono text-xs uppercase font-black tracking-wider py-2 px-5 rounded-lg transition-all cursor-pointer shadow-[0_0_20px_rgba(45,212,191,0.3)]"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center" id="pricing-hero">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none font-display uppercase max-w-3xl mx-auto">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 text-sm md:text-base text-[#94A3B8] max-w-xl mx-auto font-sans">
          Start free. Upgrade when you're ready. Cancel anytime.
        </p>

        {/* Billing period scale switcher toggle */}
        <div className="mt-10 flex items-center justify-center gap-3" id="pricing-billing-toggle">
          <span className={`text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-200 ${!isAnnual ? 'text-[#2DD4BF]' : 'text-slate-500'}`}>
            Monthly
          </span>
          <button 
            onClick={handleToggle}
            className="w-12 h-6.5 rounded-full bg-[#1F2D45] border border-teal-900/40 relative flex items-center transition-all p-0.5 focus:outline-none cursor-pointer"
            id="pricing-toggle-switch"
          >
            <div 
              className={`w-5 h-5 rounded-full bg-[#2DD4BF] shadow-[0_0_12px_rgba(45,212,191,0.5)] transform duration-300 ${isAnnual ? 'translate-x-5.5' : 'translate-x-0'}`} 
            />
          </button>
          <span className={`text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors duration-200 ${isAnnual ? 'text-[#2DD4BF]' : 'text-slate-500'}`}>
            Annual
            <span className="text-[9px] bg-emerald-500/10 text-[#10B981] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/30">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-6" id="pricing-tier-grid">
        
        {/* Card 1: Starter */}
        <div className="bg-[#111827] border border-teal-900/40 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all duration-300" id="pricing-card-starter">
          <div>
            <span className="font-display font-black text-xs uppercase tracking-widest text-[#2DD4BF]">Starter</span>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-black text-white font-mono tracking-tight transition-all text-shadow">
                ${isAnnual ? '79' : '99'}
              </span>
              <span className="ml-1 text-xs text-[#94A3B8] font-mono uppercase tracking-wide">/month</span>
            </div>
            {isAnnual && (
              <span className="text-[10px] text-emerald-400 font-semibold font-mono mt-1 block">Billed annually ($948/yr)</span>
            )}
            <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">
              For small teams getting started
            </p>

            <ul className="mt-8 space-y-4 text-xs font-sans text-[#F1F5F9]">
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Up to 100 invoices/month</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>3 user seats</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>AI invoice extraction</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Contract rate matching</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Dispute letter generation</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Email support</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1F2D45]/40">
            <button
              onClick={() => navigateTo('/auth/signup?plan=starter')}
              className="w-full py-2.5 px-4 bg-transparent hover:bg-[#2DD4BF]/5 text-[#2DD4BF] hover:text-[#2DD4BF] border border-[#2DD4BF] hover:border-[#14B8A4] font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all text-center cursor-pointer font-mono"
            >
              Get Started Free
            </button>
          </div>
        </div>

        {/* Card 2: Professional - MOST POPULAR */}
        <div className="relative bg-[#111827] border-2 border-[#2DD4BF] rounded-2xl p-8 flex flex-col justify-between shadow-[0_0_30px_rgba(45,212,191,0.15)] hover:shadow-[0_0_35px_rgba(45,212,191,0.22)] transition-all duration-300 scale-100 md:scale-[1.03]" id="pricing-card-professional">
          
          {/* Amber pill badge for popularity */}
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2" id="pop-badge">
            <span className="flex items-center gap-1 bg-[#F59E0B] text-black font-mono text-[9px] uppercase font-black tracking-widest px-4.5 py-1 rounded-full border border-[#D97706] shadow-md select-none">
              <Sparkles size={11} className="fill-black" />
              Most Popular
            </span>
          </div>

          <div>
            <span className="font-display font-black text-xs uppercase tracking-widest text-[#2DD4BF]">Professional</span>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-black text-white font-mono tracking-tight transition-all">
                ${isAnnual ? '239' : '299'}
              </span>
              <span className="ml-1 text-xs text-[#94A3B8] font-mono uppercase tracking-wide">/month</span>
            </div>
            {isAnnual && (
              <span className="text-[10px] text-emerald-400 font-semibold font-mono mt-1 block">Billed annually ($2,868/yr)</span>
            )}
            <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">
              For expanding logistics and freight operations
            </p>

            <ul className="mt-8 space-y-4 text-xs font-sans text-[#F1F5F9]">
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span className="font-semibold text-white">Up to 500 invoices/month</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>10 user seats</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5 w-4" />
                <span>Bulk upload + PDF splitting</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Priority AI processing</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Savings dashboard</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Priority email support</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1F2D45]/40">
            <button
              onClick={() => navigateTo('/auth/signup?plan=professional')}
              className="w-full py-3 px-4 bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(45,212,191,0.35)] text-center cursor-pointer font-mono flex items-center justify-center gap-1.5 hover:scale-[1.02]"
            >
              <span>Start Free Trial</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Card 3: Enterprise */}
        <div className="bg-[#111827] border border-teal-900/40 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all duration-300" id="pricing-card-enterprise">
          <div>
            <span className="font-display font-black text-xs uppercase tracking-widest text-[#2DD4BF]">Enterprise</span>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-black text-white font-display uppercase tracking-tight">
                Custom
              </span>
            </div>
            <p className="mt-4.5 text-xs text-[#94A3B8] leading-relaxed">
              For large logistics teams
            </p>

            <ul className="mt-8 space-y-4 text-xs font-sans text-[#F1F5F9]">
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span className="font-semibold text-white">Unlimited invoices</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Unlimited user seats</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Dedicated onboarding</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Custom contract rules</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>SLA guarantee</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>API access</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Dedicated account manager</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1F2D45]/40">
            <a
              href="mailto:billing@freightaudit.ai?subject=FreightAudit%20AI%20Enterprise%20Plan%20Inquiry"
              className="block w-full py-2.5 px-4 bg-transparent hover:bg-[#2DD4BF]/5 text-[#2DD4BF] hover:text-[#2DD4BF] border border-[#2DD4BF] font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all text-center cursor-pointer font-mono"
            >
              Contact Sales
            </a>
          </div>
        </div>

      </div>

      {/* Accordion FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-left" id="pricing-faqs-deck">
        <h2 className="text-2xl font-black font-display text-white text-center uppercase tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-xs text-[#94A3B8] font-mono text-center uppercase tracking-wider mt-1.5 mb-10">
          Everything you need to know about plans and billing
        </p>

        <div className="space-y-4 font-sans" id="faqs-accordion">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-[#111827] border border-teal-900/40 rounded-xl overflow-hidden shadow-md transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between py-4 px-5 text-left text-sm font-bold text-white hover:text-[#2DD4BF] transition-colors focus:outline-none select-none cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <span className="p-1 rounded bg-[#1F2D45]/50 text-[#94A3B8]">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs text-[#94A3B8] leading-relaxed border-t border-[#1F2D45]/30 bg-[#0E1524]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
