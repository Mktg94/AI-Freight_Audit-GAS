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
  invoiceId?: string;
  onBack?: () => void;
}

export default function InvoiceDetailPage({ invoiceId, onBack }: InvoiceDetailPageProps) {
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
        await fetchInvoiceData();

        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            title: 'Auto-Approved Clean Rows',
            message: `Successfully verified and approved ${result.approvedCount} items with zero discrepancy.`
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
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            title: 'Dispute Letter Created',
            message: `Dispute claim dossier has been successfully generated using AI.`
          }
        }));

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

  const handleNavigateBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/invoices');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const cleanPendingCount = lineItems.filter(
    item => item.status === 'pending' && item.discrepancy === 0
  ).length;

  const hasCleanPendingItems = cleanPendingCount > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4" id="detail-page-loader">
        <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs uppercase font-mono tracking-widest text-indigo-600">Loading...</span>
      </div>
    );
  }

  if (errorMessage || !invoice) {
    return (
      <div className="bg-white border border-red-100 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto my-12" id="detail-page-error">
        <div className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-full inline-block">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Unable to Load Invoice</h3>
        <p className="text-sm text-gray-500">
          {errorMessage || "The requested invoice could not be found."}
        </p>
        <button
          onClick={handleNavigateBack}
          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 text-sm font-medium px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Return to invoices</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="invoice-detail-view-workspace">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleNavigateBack}
              className="p-1 px-2.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 rounded-lg transition-all flex items-center gap-1.5 text-sm font-medium cursor-pointer"
              id="back-to-invoices-nav"
            >
              <ArrowLeft size={14} />
              <span>Invoices</span>
            </button>
            <span className="text-gray-300 font-mono text-sm">/</span>
            <span className="text-gray-500 font-mono font-semibold text-sm">#{invoice.invoice_number}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h1 className="text-xl font-semibold text-gray-900">
              Audit Review: Invoice #{invoice.invoice_number}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasCleanPendingItems && (
            <button
              onClick={handleApproveAllCleanItems}
              disabled={approvingClean}
              className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-sm font-medium px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 text-sm font-medium px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all"
            >
              <Download size={14} />
              <span>PDF</span>
            </a>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6" id="invoice-metadata-deck">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-5 text-left">
          
          <div>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-mono uppercase tracking-wide">
              <Truck size={10} />
              <span>Carrier</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm block mt-1">
              {invoice.carrier_name}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-mono uppercase tracking-wide">
              <Calendar size={10} />
              <span>Billed</span>
            </div>
            <span className="font-mono text-gray-700 text-sm block mt-1">
              {invoice.invoice_date}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-mono uppercase tracking-wide">
              <Calendar size={10} />
              <span>Ship Date</span>
            </div>
            <span className="font-mono text-gray-700 text-sm block mt-1">
              {invoice.shipment_date}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-mono uppercase tracking-wide">
              <Anchor size={10} />
              <span>Origin</span>
            </div>
            <span className="font-semibold text-indigo-600 text-sm block mt-1 truncate">
              {invoice.origin}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-mono uppercase tracking-wide">
              <Anchor size={10} />
              <span>Destination</span>
            </div>
            <span className="font-semibold text-indigo-600 text-sm block mt-1 truncate">
              {invoice.destination}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-mono uppercase tracking-wide">
              <Scale size={10} />
              <span>Weight</span>
            </div>
            <span className="font-mono text-gray-900 text-sm font-semibold block mt-1">
              {invoice.weight_lbs?.toLocaleString()} LBS
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-mono uppercase tracking-wide">
              <Navigation size={10} />
              <span>Distance</span>
            </div>
            <span className="font-mono text-gray-900 text-sm font-semibold block mt-1">
              {invoice.distance_miles?.toLocaleString()} MI
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-mono uppercase tracking-wide">
              <FileText size={10} />
              <span>File</span>
            </div>
            <span className="text-gray-500 text-xs mt-1 block truncate cursor-help" title={invoice.file_name}>
              {invoice.file_name}
            </span>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="invoice-billing-sums-grid">
        
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Total Billed</span>
          <p className="text-2xl font-bold font-mono text-gray-900 tabular-nums mt-1">
            {invoice.total_billed.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
          <p className="text-xs text-gray-400 mt-2">Gross charges from PDF</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Contract Approved</span>
          <p className="text-2xl font-bold font-mono text-green-600 tabular-nums mt-1">
            {invoice.total_approved.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
          <p className="text-xs text-gray-400 mt-2">Verified within tariff thresholds</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Discrepancy</span>
            {invoice.total_savings > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-mono">
                <Sparkles size={10} /> OVERCHARGE
              </span>
            )}
          </div>
          <p className="text-2xl font-bold font-mono text-red-500 tabular-nums mt-1">
            {invoice.total_savings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
          {invoice.total_savings > 0 && (
            <p className="text-xs text-red-400 mt-1">Potential overcharge</p>
          )}
        </div>

      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Line Items
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Click any row for detailed audit comparison.
          </p>
        </div>

        <LineItemTable
          lineItems={lineItems}
          contract={contract}
          onLineItemUpdated={async (updatedLine) => {
            const nextLines = lineItems.map(
              li => li.id === updatedLine.id ? updatedLine : li
            );
            setLineItems(nextLines);
            await fetchInvoiceData();
          }}
        />
      </div>

    </div>
  );
}
