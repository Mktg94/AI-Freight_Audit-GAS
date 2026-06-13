"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Check, Send, Download, Mail, Calendar, 
  MapPin, AlertTriangle, User, FileText, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { Dispute, Invoice, LineItem } from '@/types';
import PermissionGate from '@/components/shared/PermissionGate';


interface DisputeDetailPageProps {
  disputeId?: string;
  onBack?: () => void;
}

export default function DisputeDetailPage({ disputeId: propDisputeId, onBack }: DisputeDetailPageProps) {
  const [disputeId, setDisputeId] = useState<string>('');
  
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [letterText, setLetterText] = useState('');
  const [carrierEmail, setCarrierEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [resolutionAmount, setResolutionAmount] = useState<number>(0);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (propDisputeId) {
      setDisputeId(propDisputeId);
    } else if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      const id = parts[parts.length - 1] || '';
      setDisputeId(id);
    }
  }, [propDisputeId]);

  const loadDisputeData = async () => {
    if (!disputeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`);
      if (!res.ok) throw new Error("Could not load dispute data");
      const data = await res.json();
      if (data.success) {
        setDispute(data.dispute);
        setInvoice(data.invoice);
        setLineItems(data.lineItems || []);
        setLetterText(data.dispute.dispute_letter_text || '');
        setCarrierEmail(data.dispute.carrier_email || '');
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error loading", "Failed to retrieve dispute info.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputeData();
  }, [disputeId]);

  const triggerToast = (title: string, message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title, message }
      }));
    }
  };

  const handleNavigateBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/disputes');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleSaveChanges = async () => {
    if (!disputeId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_letter_text: letterText,
          carrier_email: carrierEmail
        })
      });

      if (!res.ok) throw new Error("Failed to update letter");
      const data = await res.json();
      if (data.success) {
        setDispute(data.dispute);
        setIsEditing(false);
        triggerToast("Changes Saved", "Dispute document text has been updated successfully.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Update Failed", "We could not persist changes to the dispute document.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendDisputeEmail = async () => {
    if (!disputeId || !carrierEmail) {
      triggerToast("Invalid Email", "Please supply a valid carrier claim email first.");
      return;
    }
    setIsSending(true);
    try {
      await fetch(`/api/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_letter_text: letterText,
          carrier_email: carrierEmail
        })
      });

      const res = await fetch(`/api/disputes/${disputeId}/send`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error("Send failed");
      const data = await res.json();
      if (data.success) {
        await loadDisputeData();
        triggerToast("Email Dispatched", `Dispute letter has been successfully queued for ${carrierEmail}`);
      } else {
        throw new Error(data.error || "Mail transmission failed.");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast("Delivery Failure", err.message || "Failed to dispatch email claim.");
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!disputeId) return;
    setIsResolving(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_amount: resolutionAmount }),
      });
      if (!res.ok) throw new Error("Resolve failed");
      await loadDisputeData();
      triggerToast("Dispute Resolved", `Credit of $${resolutionAmount.toFixed(2)} recorded successfully.`);
    } catch (err: any) {
      triggerToast("Resolution Failed", err.message);
    } finally {
      setIsResolving(false);
    }
  };

  const handleDownloadPDF = () => {
    triggerToast("Coming Soon", "PDF compilation & attachments binding is currently under developer synthesis.");
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatMoney = (val?: number) => {
    if (val === undefined || val === null) return '$0.00';
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4" id="dispute-detail-page-loader">
        <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs uppercase font-mono tracking-widest text-indigo-600">Compiling dispute case files...</span>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-16 space-y-4 bg-white border border-gray-100 rounded-2xl mx-auto max-w-lg" id="dispute-not-found-screen">
        <AlertTriangle className="mx-auto text-red-400" size={48} />
        <h3 className="text-lg font-semibold text-gray-900">Dispute Not Found</h3>
        <p className="text-sm text-gray-400">The dispute ID does not match any records.</p>
        <button onClick={handleNavigateBack} className="text-xs font-mono font-semibold text-indigo-600 hover:underline">
          &larr; Return to Claims
        </button>
      </div>
    );
  }

  const isSent = dispute.status === 'sent' || dispute.status === 'resolved';
  const isResolved = dispute.status === 'resolved';

  return (
    <div className="space-y-6 animate-fade-in" id="dispute-detail-page-root">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={handleNavigateBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold font-mono text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to ledger</span>
        </button>
        
        <div className="text-xs font-mono text-gray-400">
          Dispute ID: <span className="text-indigo-600 font-bold">{dispute.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex justify-between items-center bg-white border border-gray-100 rounded-t-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="text-indigo-600" size={16} />
              <span className="text-xs font-mono font-semibold text-gray-900 uppercase tracking-wider">Formal Challenge Letter</span>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="py-1 px-3 bg-white hover:bg-indigo-50 border border-gray-200 text-indigo-600 rounded-lg text-[10px] uppercase font-semibold font-mono tracking-wider transition-all inline-flex items-center gap-1 cursor-pointer"
                id="edit-letter-btn"
              >
                <Edit2 size={11} />
                <span>Edit Letter</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="py-1 px-2.5 bg-white hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 border border-gray-200 rounded-l-lg text-[10px] uppercase font-semibold font-mono transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-r-lg text-[10px] uppercase font-mono transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  id="save-letter-btn"
                >
                  {isSaving ? (
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={11} />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border-x border-b border-gray-100 rounded-b-xl p-6 md:p-8 space-y-6 relative overflow-hidden">
            
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 select-none relative z-10">
              <div>
                <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-semibold block">Originator Group</span>
                <span className="text-sm font-semibold text-gray-900 uppercase tracking-tight">{invoice?.carrier_name ? "Atlas Global Logistics" : "Your Corporation"}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-gray-400 uppercase block select-all">Dossier Date</span>
                <span className="text-xs font-mono font-semibold text-gray-500">{new Date(dispute.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="relative z-10" id="document-body-renderer">
              {isEditing ? (
                <div className="space-y-1">
                  <label className="text-[9px] text-indigo-600 font-mono uppercase tracking-widest block mb-1">Live Document Editor</label>
                  <textarea
                    value={letterText}
                    onChange={(e) => setLetterText(e.target.value)}
                    rows={20}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-mono leading-relaxed text-gray-900 focus:outline-none focus:border-indigo-400 resize-y"
                    id="dispute-letter-textarea"
                  />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-gray-700 select-text outline-none p-2 bg-gray-50 rounded-lg border border-gray-100 select-all">
                  {letterText}
                </pre>
              )}
            </div>

            <div className="pt-10 border-t border-gray-100 flex justify-between items-center text-[10px] font-mono text-gray-400 select-none relative z-10">
              <span>FreightAudit AI Certified Claims</span>
              <span>Ref ID: {dispute.id}</span>
            </div>

          </div>

        </div>

        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4" id="dispute-quickview-card">
            <span className="text-[10px] font-semibold font-mono text-indigo-600 uppercase tracking-widest block">Audit Dispute Summary</span>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-4 py-1.5 border-b border-gray-100 text-xs">
              <div>
                <span className="text-gray-400 font-mono text-[9px] uppercase">Carrier</span>
                <span className="font-semibold text-gray-900 block mt-0.5 uppercase truncate">{dispute.carrier_name}</span>
              </div>
              <div>
                <span className="text-gray-400 font-mono text-[9px] uppercase">Invoice Number</span>
                <span className="font-semibold text-gray-900 font-mono block mt-0.5">{invoice?.invoice_number || 'FDX-987452'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-mono text-[9px] uppercase">Invoice Date</span>
                <span className="font-mono text-gray-500 block mt-0.5">{invoice?.invoice_date || '-'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-mono text-[9px] uppercase">Charge Status</span>
                <span className="font-semibold text-amber-600 uppercase block mt-0.5">{dispute.status}</span>
              </div>
            </div>

            <div className="py-2.5">
              <span className="text-gray-400 font-mono text-[9px] uppercase block mb-1">Disputed Overcharge Amount</span>
              <p className="text-3xl font-bold text-red-500 font-mono leading-none tracking-tight">
                {formatMoney(dispute.total_disputed_amount)}
              </p>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-4">
              <span className="text-[9px] font-semibold font-mono text-gray-500 uppercase tracking-wider block mb-1">Contested Charge Lines ({lineItems.length})</span>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {lineItems.length === 0 ? (
                  <div className="text-[10px] font-mono text-gray-400 italic">No items flagged disputed.</div>
                ) : (
                  lineItems.map((li) => (
                    <div key={li.id} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex items-center justify-between text-[11px] gap-2">
                      <div className="truncate">
                        <span className="font-semibold text-gray-700 block truncate leading-tight uppercase">{li.description}</span>
                        <span className="text-[9px] font-mono text-gray-400 mt-0.5 block">Billed: {formatMoney(li.billed_amount)} | Contract: {formatMoney(li.expected_amount)}</span>
                      </div>
                      <span className="font-mono font-bold text-red-500 shrink-0">+{formatMoney(li.discrepancy)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-4">
              <label className="block text-[9px] font-semibold font-mono text-gray-500 uppercase tracking-wider">
                Carrier Dispute Claims Email Address
              </label>
              <input
                type="email"
                placeholder="disputes-committee@carrier-fleet.com"
                value={carrierEmail}
                onChange={(e) => setCarrierEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg text-xs font-mono placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-all"
                id="carrier-email-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadPDF}
                className="py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                id="pdf-placeholder-action"
              >
                <Download size={13} />
                <span>Download PDF</span>
              </button>

              <PermissionGate 
                action="send_disputes"
                fallback={
                  <div className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-center">
                    <p className="text-[9px] text-gray-400 font-mono leading-relaxed">Only managers can send disputes.</p>
                  </div>
                }
              >
                <button
                  onClick={handleSendDisputeEmail}
                  disabled={isSending || isResolved || !carrierEmail}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-[10px] font-mono uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  id="send-claim-email-action"
                >
                  {isSending ? (
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  <span>Send Claim Email</span>
                </button>
              </PermissionGate>
            </div>

            {isSent && !isResolved && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <label className="block text-[9px] font-semibold font-mono text-gray-500 uppercase tracking-wider">
                  Resolution Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={resolutionAmount || ''}
                  onChange={(e) => setResolutionAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-green-400 transition-all"
                  id="resolution-amount-field"
                />
                <button
                  onClick={handleResolveDispute}
                  disabled={isResolving || resolutionAmount <= 0}
                  className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-[10px] font-mono uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  id="resolve-dispute-action"
                >
                  {isResolving ? (
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  <span>Mark Resolved & Record Refund</span>
                </button>
              </div>
            )}

          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5" id="dispute-timeline-panel">
            <span className="text-[10px] font-semibold font-mono text-indigo-600 uppercase tracking-widest block">Audit Dispute Timeline</span>
            
            <div className="relative border-l border-gray-200 ml-2.5 pl-5.5 space-y-6">
              
              <div className="relative">
                <span className="absolute -left-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 border border-indigo-300">
                  <Check className="h-2.5 w-2.5 text-indigo-600" />
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Claim File Created</h4>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">Dossier recorded successfully matching discrepancy levels.</p>
                  <p className="text-[10px] font-mono font-medium text-indigo-600 mt-1">{formatDate(dispute.created_at)}</p>
                </div>
              </div>

              <div className="relative">
                <span className={`absolute -left-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full border ${
                  isSent 
                    ? 'bg-indigo-50 border-indigo-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  {isSent ? (
                    <Check className="h-2.5 w-2.5 text-indigo-600" />
                  ) : (
                    <Clock className="h-2.5 w-2.5 text-gray-300" />
                  )}
                </span>
                <div>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide ${isSent ? 'text-gray-900' : 'text-gray-300'}`}>Claims Dispatched to Carrier</h4>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">Dispute letter transmitted to billing auditor committee email channel.</p>
                  {isSent && dispute.sent_at && (
                    <p className="text-[10px] font-mono font-medium text-indigo-600 mt-1">{formatDate(dispute.sent_at)}</p>
                  )}
                </div>
              </div>

              <div className="relative">
                <span className={`absolute -left-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full border ${
                  isResolved 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  {isResolved ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Clock className="h-2.5 w-2.5 text-gray-300" />
                  )}
                </span>
                <div>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide ${isResolved ? 'text-green-600' : 'text-gray-300'}`}>Dispute Resolved & Refunded</h4>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">Credit adjustment applied successfully against the original freight bill.</p>
                  {isResolved && dispute.resolved_at && (
                    <div className="mt-1 space-y-1">
                      <p className="text-[10px] font-mono font-medium text-indigo-600">{formatDate(dispute.resolved_at)}</p>
                      <p className="text-[10px] font-bold text-green-600 font-mono">Recovered Cash: {formatMoney(dispute.resolution_amount)}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
