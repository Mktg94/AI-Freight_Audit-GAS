"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, CloudLightning, ShieldCheck, Mail, Edit3, 
  CheckCircle2, XCircle, ChevronRight, Eye, Calendar, Sparkles, FileText
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Dispute } from '@/types';
import { initialDisputes } from '@/src/fakeData';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<(Dispute & { invoice_number?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealSupabase, setIsRealSupabase] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'resolved' | 'rejected'>('all');

  const fetchDisputes = async () => {
    setLoading(true);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const hasSupabaseKeys = supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder');

    if (hasSupabaseKeys) {
      try {
        setIsRealSupabase(true);
        const supabase = createClient();
        
        // Fetch disputes
        const { data: disputesData, error: dErr } = await supabase
          .from('disputes')
          .select('*')
          .order('created_at', { ascending: false });

        if (dErr) throw dErr;

        // Fetch invoice numbers
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('id, invoice_number');

        const invoiceMap = new Map();
        if (invoicesData) {
          invoicesData.forEach((inv) => invoiceMap.set(inv.id, inv.invoice_number));
        }

        const enriched = (disputesData || []).map((disp) => ({
          ...disp,
          invoice_number: invoiceMap.get(disp.invoice_id) || 'FDX-987452'
        }));

        setDisputes(enriched);
      } catch (err) {
        console.warn("Supabase load error, running fallback:", err);
        loadFallbackData();
      } finally {
        setLoading(false);
      }
    } else {
      loadFallbackData();
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    // Read from sandbox memory stores
    const memoryDisputes = (global as any).memoryDisputesStore || [...initialDisputes];
    const memoryInvoices = (global as any).memoryInvoicesStore || [];

    const enriched = memoryDisputes.map((disp: any) => {
      const match = memoryInvoices.find((inv: any) => inv.id === disp.invoice_id);
      return {
        ...disp,
        invoice_number: match ? match.invoice_number : 'DHL-8874102'
      };
    });

    setDisputes(enriched);
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  // Compute stats metrics dynamically
  const stats = useMemo(() => {
    const draft = disputes.filter(d => d.status === 'draft');
    const sent = disputes.filter(d => d.status === 'sent');
    const resolved = disputes.filter(d => d.status === 'resolved');

    return {
      draftCount: draft.length,
      draftSum: draft.reduce((acc, curr) => acc + curr.total_disputed_amount, 0),
      sentCount: sent.length,
      sentSum: sent.reduce((acc, curr) => acc + curr.total_disputed_amount, 0),
      resolvedCount: resolved.length,
      resolvedSum: resolved.reduce((acc, curr) => acc + (curr.resolution_amount || 0), 0),
      totalDisputedAmt: disputes.reduce((acc, curr) => acc + curr.total_disputed_amount, 0)
    };
  }, [disputes]);

  // Filter lists based on Tab Choice
  const filteredDisputes = useMemo(() => {
    if (activeTab === 'all') return disputes;
    return disputes.filter(d => d.status === activeTab);
  }, [disputes, activeTab]);

  const handleNavigateToDisputeDetail = (disputeId: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/disputes/${disputeId}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleNavigateToInvoices = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/invoices');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatMoney = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const renderDisputeStatusBadge = (status: Dispute['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1C2537] border border-[#1F2D45] text-[#94A3B8] font-mono text-[10px] uppercase font-black rounded-full">
            <Edit3 size={11} />
            <span>Draft</span>
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] uppercase font-black rounded-full animate-pulse">
            <Mail size={11} />
            <span>Sent Claim</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] uppercase font-black rounded-full">
            <CheckCircle2 size={11} />
            <span>Resolved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] uppercase font-black rounded-full">
            <XCircle size={11} />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="disputes-page-workspace">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white font-display tracking-tight uppercase">
              Billing Claims & Disputes
            </h1>
            {isRealSupabase ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                <ShieldCheck size={11} /> Secure CRM
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#2DD4BF] bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-mono">
                <CloudLightning size={11} /> Sandbox Registry
              </span>
            )}
          </div>
          <p className="text-xs text-[#94A3B8]">
            Manage, review, dispatch, and track carrier billing disputes identified during rate discrepancy audits.
          </p>
        </div>

        {/* Global disputed sum in RED */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-5 py-3 relative overflow-hidden" id="dispute-total-sum-label">
          <span className="text-[10px] font-bold font-mono text-red-400 uppercase tracking-widest block mb-0.5">Total Under Dispute</span>
          <p className="text-xl md:text-2xl font-black text-[#EF4444] font-mono leading-none tracking-tight">
            {formatMoney(stats.totalDisputedAmt)}
          </p>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="dispute-stats-dashboard-row">
        {/* Drafts */}
        <div className="bg-[#111827] border border-[#1F2D45] rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#94A3B8] font-mono uppercase tracking-wider block">Draft Claims</span>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-2xl font-black text-white font-mono">{stats.draftCount}</p>
            <p className="text-sm font-semibold text-zinc-400 font-mono">Value: <span className="text-zinc-200">{formatMoney(stats.draftSum)}</span></p>
          </div>
        </div>

        {/* Sent */}
        <div className="bg-[#111827] border border-[#1F2D45] rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-500 font-mono uppercase tracking-wider block">Sent Claims</span>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-2xl font-black text-amber-500 font-mono">{stats.sentCount}</p>
            <p className="text-sm font-semibold text-zinc-400 font-mono">Value: <span className="text-zinc-200">{formatMoney(stats.sentSum)}</span></p>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-[#111827] border border-emerald-950/50 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider block">Resolved Recoveries</span>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-2xl font-black text-emerald-400 font-mono">{stats.resolvedCount}</p>
            <p className="text-sm font-bold text-[#10B981] font-mono">Recovered: <span>{formatMoney(stats.resolvedSum)}</span></p>
          </div>
        </div>
      </div>

      {/* Custom Tabs Navigation Filter */}
      <div className="flex border-b border-[#1F2D45]/80 space-x-2 md:space-x-4 overflow-x-auto" id="dispute-filter-tabs">
        {(['all', 'draft', 'sent', 'resolved', 'rejected'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 px-4 font-mono text-xs uppercase tracking-wider font-extrabold border-b-2 cursor-pointer transition-all ${
                isActive 
                  ? 'border-[#2DD4BF] text-teal-400 font-black' 
                  : 'border-transparent text-[#94A3B8] hover:text-white'
              }`}
              id={`tab-filter-${tab}`}
            >
              {tab === 'all' ? 'All Disputes' : `${tab}s`}
            </button>
          );
        })}
      </div>

      {/* Loading state / Empty State / Table Data */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4" id="disputes-table-loader">
          <div className="h-8 w-8 border-4 border-[#2DD4BF] border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#2DD4BF]">Aligning billing logs...</span>
        </div>
      ) : disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#111827] border border-teal-900/40 space-y-5 max-w-lg mx-auto" id="disputes-total-empty">
          <div className="p-4 bg-[#1C2537] border border-[#1F2D45] text-red-400 rounded-full">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black font-display text-white uppercase tracking-tight">No actions raised yet</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Disputes are only generated from audit reviews with carrier rate-sheets discrepancy. Let's inspect some bills first!
            </p>
          </div>
          <button
            onClick={handleNavigateToInvoices}
            className="py-2.5 px-5 bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-bold rounded-lg text-xs uppercase tracking-wider transition-all font-mono inline-flex items-center gap-1.5"
          >
            <FileText size={14} />
            <span>Audit Invoices</span>
          </button>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#94A3B8] font-mono border border-[#1F2D45]/30 rounded-xl bg-[#111827]/50" id="disputes-tab-empty">
          No credit agreements found matching status '{activeTab}'.
        </div>
      ) : (
        <div className="bg-[#111827] border border-teal-900/30 rounded-xl overflow-hidden shadow-2xl" id="disputes-datatable-deck">
          <div className="min-w-full overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table">
              <thead>
                <tr className="border-b border-[#1F2D45] bg-[#0A0F1E]/80 text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider font-mono">
                  <th className="py-4 px-6">Invoice #</th>
                  <th className="py-4 px-4">Carrier</th>
                  <th className="py-4 px-4 text-right">Disputed Value</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4">Created Date</th>
                  <th className="py-4 px-4">Sent Date</th>
                  <th className="py-4 px-4 text-right">Resolved $</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2D45]/20 font-sans text-xs">
                {filteredDisputes.map((disp, index) => (
                  <tr 
                    key={disp.id}
                    onClick={() => handleNavigateToDisputeDetail(disp.id)}
                    className={`group hover:bg-[#1C2537] cursor-pointer transition-colors ${
                      index % 2 === 1 ? 'bg-[#0f1624]' : 'bg-transparent'
                    }`}
                  >
                    {/* Invoice # */}
                    <td className="py-4.5 px-6 font-mono font-black text-white group-hover:text-[#2DD4BF] transition-colors">
                      {disp.invoice_number || 'FDX-987452'}
                    </td>

                    {/* Carrier */}
                    <td className="py-4.5 px-4 font-bold text-zinc-300 uppercase truncate max-w-[150px]">
                      {disp.carrier_name}
                    </td>

                    {/* Amount Disputed */}
                    <td className="py-4.5 px-4 text-right font-mono font-black text-[#EF4444]">
                      {formatMoney(disp.total_disputed_amount)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4.5 px-4 text-center">
                      {renderDisputeStatusBadge(disp.status)}
                    </td>

                    {/* Created Date */}
                    <td className="py-4.5 px-4 text-[#94A3B8] font-mono">
                      {formatDate(disp.created_at)}
                    </td>

                    {/* Sent Date */}
                    <td className="py-4.5 px-4 text-[#94A3B8] font-mono">
                      {formatDate(disp.sent_at)}
                    </td>

                    {/* Resolution Amount */}
                    <td className="py-4.5 px-4 text-right font-mono text-emerald-400 font-bold">
                      {formatMoney(disp.resolution_amount)}
                    </td>

                    {/* Actions buttons */}
                    <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleNavigateToDisputeDetail(disp.id)}
                        className="p-1.5 px-3 bg-[#1C2537] hover:bg-[#2DD4BF] hover:text-black border border-[#1F2D45] text-[#2DD4BF] font-mono text-[10px] items-center gap-1 font-bold rounded-lg uppercase tracking-wide inline-flex transition-all"
                        id={`view-btn-${disp.id}`}
                      >
                        <Eye size={11} />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
