"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, FileText, Calendar, Truck, Anchor, 
  Scale, Navigation, ShieldAlert, Sparkles, CheckCheck, Loader2, Download
} from 'lucide-react';
import { Invoice, LineItem, Contract } from '@/types';
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge';
import LineItemTable from '@/components/invoices/LineItemTable';

interface InvoiceDetailPageProps {
  invoiceId?: string; // Sourced when running inside SPA client router
  onBack?: () => void; // Navigates back inside SPA mode
}

export default function InvoiceDetailPage({ invoiceId, onBack }: InvoiceDetailPageProps) {
  // Extract id from window pathname if props is omitted (for direct browser loads in SSR contexts)
  const resolvedId = invoiceId || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvingClean, setApprovingClean] = useState(false);
  const [generatingDispute, setGeneratingDispute] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchInvoiceData = async () => {
    if (!resolvedId || resolvedId === 'invoices') return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/invoices/${resolvedId}`);
      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to fetch invoice details.');
      }
      const data = await response.json();
      if (data.success) {
        setInvoice(data.invoice);
        setLineItems(data.lineItems || []);
        setContract(data.contract);
      } else {
        throw new Error(data.error || 'Server structure resolved with errors.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Network error fetching invoice ledger details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [resolvedId]);

  // Bulk action: approve clean non-discrepant items
  const handleApproveAllCleanItems = async () => {
    if (!resolvedId) return;
    setApprovingClean(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/invoices/${resolvedId}/approve-clean`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to bulk-approve clean items.');
      }

      const result = await response.json();
      if (result.success) {
        // Trigger refetch of updated document state and items
        await fetchInvoiceData();

        // Broadcast a success status toast
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            title: 'Auto-Approved Clean Rows',
            message: `Successfully verified and approved ${result.approvedCount} items with zero contracts discrepancy.`
          }
        }));
      } else {
        throw new Error(result.error || 'Auto-approval transaction rejected.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred during bulk verification approval.');
    } finally {
      setApprovingClean(false);
    }
  };

  const handleGenerateDisputeLetter = async () => {
    if (!resolvedId || !invoice) return;
    setGeneratingDispute(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/disputes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoice_id: resolvedId,
          carrier_email: 'billing-claims@' + (invoice.carrier_name.toLowerCase().includes('ups') ? 'ups-freight.com' : invoice.carrier_name.toLowerCase().includes('fedex') ? 'fedex-claims.com' : 'dhl-express.com')
        })
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to initialize dispute letter.');
      }

      const result = await response.json();
      if (result.success && result.disputeId) {
        // Broadcast success toast
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            title: 'Dispute Letter Created',
            message: `Dispute claim dossier has been successfully generated using Anthropic/Gemini AI.`
          }
        }));

        // Redirect to detail page
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', `/disputes/${result.disputeId}`);
          window.dispatchEvent(new Event('popstate'));
        }
      } else {
        throw new Error(result.error || 'Server rejected creation request.');
      }
    } catch (err: any) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          title: 'Dispute Creation Failed',
          message: err.message || 'Error occurred initializing dispute claimant.'
        }
      }));
    } finally {
      setGeneratingDispute(false);
    }
  };

  // Navigates back safely
  const handleNavigateBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/invoices');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  // Detect if there are any lingering 'pending' rows that have exactly discrepancy = 0
  const cleanPendingCount = lineItems.filter(
    item => item.status === 'pending' && item.discrepancy === 0
  ).length;

  const hasCleanPendingItems = cleanPendingCount > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4" id="detail-page-loader">
        <div className="h-10 w-10 border-4 border-[#2DD4BF] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase font-mono tracking-widest text-[#2DD4BF]">Reassembling freight audit matrix...</span>
      </div>
    );
  }

  if (errorMessage || !invoice) {
    return (
      <div className="bg-[#111827] border border-red-950/40 rounded-xl p-8 text-center space-y-4 max-w-xl mx-auto my-12" id="detail-page-error">
        <div className="p-3 bg-red-950/40 text-[#EF4444] border border-red-500/20 rounded-full inline-block">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-lg font-bold font-display text-white">Freight Audit Ledger Unresolved</h3>
        <p className="text-xs text-[#94A3B8]">
          {errorMessage || "The requested carrier invoice document could not be located in your cloud cluster."}
        </p>
        <button
          onClick={handleNavigateBack}
          className="py-2 px-5 bg-[#1C2537] hover:bg-teal-950/30 text-[#2DD4BF] border border-[#1F2D45] rounded-xl text-xs uppercase font-semibold font-mono tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Return to invoices</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="invoice-detail-view-workspace">
      
      {/* Header with back actions and breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          {/* Back button and breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleNavigateBack}
              className="p-1 px-2.5 bg-[#111827] hover:bg-[#1C2537] border border-[#1F2D45] hover:border-[#2DD4BF]/40 text-[#94A3B8] hover:text-white rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              id="back-to-invoices-nav"
            >
              <ArrowLeft size={14} />
              <span>Invoices</span>
            </button>
            <span className="text-[#475569]/80 font-mono text-xs">/</span>
            <span className="text-[#94A3B8] font-mono font-bold text-xs">#{invoice.invoice_number}</span>
          </div>

          {/* Document Reference Title */}
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <h1 className="text-xl md:text-2xl font-black text-white font-display tracking-tight">
              Audit Review: Invoice #{invoice.invoice_number}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>

        {/* Dynamic Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {hasCleanPendingItems && (
            <button
              onClick={handleApproveAllCleanItems}
              disabled={approvingClean}
              className="py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:text-black text-[#10B981] font-bold font-mono rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              id="bulk-approve-clean-action"
            >
              {approvingClean ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCheck size={14} />
              )}
              <span>Approve {cleanPendingCount} Clean Items</span>
            </button>
          )}

          {invoice.total_savings > 0 && invoice.status !== 'approved' && (
            <button
              onClick={handleGenerateDisputeLetter}
              disabled={generatingDispute || invoice.status === 'disputed'}
              className="py-2.5 px-4 bg-[#EF4444] hover:bg-red-500 border border-red-500/30 text-white font-black font-mono rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
              id="generate-dispute-action"
            >
              {generatingDispute ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              <span>{invoice.status === 'disputed' ? 'Dispute Issued' : 'Generate Dispute'}</span>
            </button>
          )}

          {invoice.file_url !== '#' && (
            <a
              href={invoice.file_url}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3.5 bg-[#111827] hover:bg-[#1C2537] text-[#94A3B8] hover:text-white border border-[#1F2D45] rounded-lg text-xs font-semibold font-mono tracking-wide flex items-center gap-1.5 transition-all"
            >
              <Download size={14} />
              <span>Original PDF</span>
            </a>
          )}
        </div>
      </div>

      {/* METADATA DATACARD */}
      <div className="bg-[#111827] border border-teal-900/10 rounded-xl p-5 md:p-6" id="invoice-metadata-deck">
        <label className="text-[10px] font-bold text-[#2DD4BF] font-mono uppercase tracking-widest block mb-4">
          Freight Bill Metadata Details
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-5 text-left">
          
          {/* Carrier */}
          <div>
            <div className="flex items-center gap-1 text-[#94A3B8] text-[10px] font-mono uppercase tracking-wide">
              <Truck size={10} />
              <span>Carrier</span>
            </div>
            <span className="font-bold text-white text-xs block mt-1 uppercase tracking-tight truncate">
              {invoice.carrier_name}
            </span>
          </div>

          {/* Invoice Date */}
          <div>
            <div className="flex items-center gap-1 text-[#94A3B8] text-[10px] font-mono uppercase tracking-wide">
              <Calendar size={10} />
              <span>Billed Date</span>
            </div>
            <span className="font-mono text-zinc-300 text-xs font-semibold block mt-1">
              {invoice.invoice_date}
            </span>
          </div>

          {/* Shipment Date */}
          <div>
            <div className="flex items-center gap-1 text-[#94A3B8] text-[10px] font-mono uppercase tracking-wide">
              <Calendar size={10} />
              <span>Ship Date</span>
            </div>
            <span className="font-mono text-zinc-300 text-xs font-semibold block mt-1">
              {invoice.shipment_date}
            </span>
          </div>

          {/* Origin */}
          <div>
            <div className="flex items-center gap-1 text-[#94A3B8] text-[10px] font-mono uppercase tracking-wide">
              <Anchor size={10} />
              <span>Origin</span>
            </div>
            <span className="font-bold text-teal-400 text-xs block mt-1 truncate">
              {invoice.origin}
            </span>
          </div>

          {/* Destination */}
          <div>
            <div className="flex items-center gap-1 text-[#94A3B8] text-[10px] font-mono uppercase tracking-wide">
              <Anchor size={10} />
              <span>Destination</span>
            </div>
            <span className="font-bold text-teal-400 text-xs block mt-1 truncate">
              {invoice.destination}
            </span>
          </div>

          {/* Weight */}
          <div>
            <div className="flex items-center gap-1 text-[#94A3B8] text-[10px] font-mono uppercase tracking-wide">
              <Scale size={10} />
              <span>Weight</span>
            </div>
            <span className="font-mono text-white text-xs font-bold block mt-1">
              {invoice.weight_lbs?.toLocaleString()} LBS
            </span>
          </div>

          {/* Distance */}
          <div>
            <div className="flex items-center gap-1 text-[#94A3B8] text-[10px] font-mono uppercase tracking-wide">
              <Navigation size={10} />
              <span>Distance</span>
            </div>
            <span className="font-mono text-white text-xs font-bold block mt-1">
              {invoice.distance_miles?.toLocaleString()} MI
            </span>
          </div>

          {/* File Name */}
          <div>
            <div className="flex items-center gap-1 text-[#94A3B8] text-[10px] font-mono uppercase tracking-wide">
              <FileText size={10} />
              <span>Source File</span>
            </div>
            <span className="font-semibold text-zinc-400 text-xs mt-1 block truncate cursor-help" title={invoice.file_name}>
              {invoice.file_name}
            </span>
          </div>

        </div>
      </div>

      {/* SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="invoice-billing-sums-grid">
        
        {/* Total Billed */}
        <div className="bg-[#111827] border border-[#1F2D45] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#EF4444] font-mono uppercase tracking-widest block">Total Billed Amt</span>
            <p className="text-2xl md:text-3xl font-black text-white font-mono leading-none tracking-tight">
              {invoice.total_billed.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div className="border-t border-[#1F2D45]/50 pt-3 mt-4 text-[10px] text-[#94A3B8] font-mono uppercase">
            Aggregated gross charges raw from PDF
          </div>
        </div>

        {/* Contract Approved */}
        <div className="bg-[#111827] border border-[#1F2D45] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#10B981] font-mono uppercase tracking-widest block">Contract Approved</span>
            <p className="text-2xl md:text-3xl font-black text-white font-mono leading-none tracking-tight">
              {invoice.total_approved.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div className="border-t border-[#1F2D45]/50 pt-3 mt-4 text-[10px] text-[#94A3B8] font-mono uppercase">
            Total verified within tariff thresholds
          </div>
        </div>

        {/* Captured Savings */}
        <div className="bg-[#111827] border border-[#2DD4BF]/40 shadow-[0_0_20px_rgba(45,212,191,0.15)] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#2DD4BF] font-mono uppercase tracking-widest block">Captured Savings</span>
              {invoice.total_savings > 0 && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-black bg-[#2DD4BF] px-2 py-0.5 rounded-full font-mono shadow-[0_0_10px_rgba(45,212,191,0.4)] animate-pulse">
                  <Sparkles size={10} /> DISCREPANCIES DETECTED
                </span>
              )}
            </div>
            <p className="text-2xl md:text-3xl font-black text-[#2DD4BF] font-mono leading-none tracking-tight">
              {invoice.total_savings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div className="border-t border-teal-900/50 pt-3 mt-4 text-[10px] text-[#2DD4BF] font-mono uppercase">
            Overbill tariff protection claimable refund
          </div>
        </div>

      </div>

      {/* CORE DISCREPANCY TABLE VIEW */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white font-display uppercase">
            Freight Itemization Ledger Summary
          </h3>
          <p className="text-[10px] text-[#94A3B8] font-mono">
            CLICK ON ANY ROW TO CROSS CHECK AGAINST SPECIFIC RATINGS FROM RATE-SHEET ID #{contract?.id || 'ALPHA-TARIFF'}
          </p>
        </div>

        {/* Embedded Dynamic Table */}
        <LineItemTable
          lineItems={lineItems}
          contract={contract}
          onLineItemUpdated={async (updatedLine) => {
            // Instantly update local state inside table
            const nextLines = lineItems.map(
              li => li.id === updatedLine.id ? updatedLine : li
            );
            setLineItems(nextLines);

            // Re-trigger invoice aggregation metrics from database
            await fetchInvoiceData();
          }}
        />
      </div>

    </div>
  );
}
