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
  // Extract dispute ID from prop or URL path
  const [disputeId, setDisputeId] = useState<string>('');
  
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [letterText, setLetterText] = useState('');
  const [carrierEmail, setCarrierEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Sync ID from URL if property is undefined
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
      // First save current updates (autosave)
      await fetch(`/api/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_letter_text: letterText,
          carrier_email: carrierEmail
        })
      });

      // Then dispatch send email API
      const res = await fetch(`/api/disputes/${disputeId}/send`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error("Send failed");
      const data = await res.json();
      if (data.success) {
        // Reload page data to reflect 'sent' status and timelines
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
        <div className="h-10 w-10 border-4 border-[#2DD4BF] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase font-mono tracking-widest text-[#2DD4BF] animate-pulse">Compiling dispute case files...</span>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-16 space-y-4" id="dispute-not-found-screen">
        <AlertTriangle className="mx-auto text-[#EF4444]" size={48} />
        <h3 className="text-lg font-black uppercase text-white font-display">Dispute Dossier Missing</h3>
        <p className="text-xs text-[#94A3B8]">The dispute ID does not match any ledger credentials.</p>
        <button onClick={handleNavigateBack} className="text-xs font-mono font-bold text-[#2DD4BF] hover:underline uppercase">
          &larr; Return to Claims
        </button>
      </div>
    );
  }

  const isSent = dispute.status === 'sent' || dispute.status === 'resolved';
  const isResolved = dispute.status === 'resolved';

  return (
    <div className="space-y-6 animate-fade-in" id="dispute-detail-page-root">
      
      {/* Back Button and Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={handleNavigateBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-[#94A3B8] hover:text-[#2DD4BF] uppercase transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to ledger</span>
        </button>
        
        <div className="text-xs font-mono text-zinc-500">
          Dispute ID: <span className="text-[#2DD4BF] font-bold">{dispute.id}</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT (60% equivalent to lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Header toolbar for document */}
          <div className="flex justify-between items-center bg-[#111827] border border-teal-900/40 rounded-t-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="text-[#2DD4BF]" size={16} />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Formal Challenge Letter</span>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="py-1 px-3 bg-[#1C2537] hover:bg-[#2DD4BF] hover:text-black border border-[#1F2D45] text-[#2DD4BF] rounded-lg text-[10px] uppercase font-bold font-mono tracking-wider transition-all inline-flex items-center gap-1 cursor-pointer"
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
                  className="py-1 px-2.5 bg-[#1C2537] hover:bg-red-500/10 hover:border-red-500/30 text-zinc-400 hover:text-red-400 border border-[#1F2D45] rounded-l-lg text-[10px] uppercase font-bold font-mono transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="py-1 px-3 bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-extrabold rounded-r-lg text-[10px] uppercase font-mono transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  id="save-letter-btn"
                >
                  {isSaving ? (
                    <div className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={11} />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>

          {/* Document visual paper board */}
          <div className="bg-[#1C2537] border-x border-b border-[#1F2D45] rounded-b-xl shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden text-[#F1F5F9]">
            
            {/* Elegant grid background styled as security document paper */}
            <div className="absolute inset-0 bg-radial-gradient from-teal-500/5 to-transparent pointer-events-none opacity-30" />

            {/* Letterhead */}
            <div className="flex justify-between items-start border-b border-[#1F2D45] pb-4 select-none relative z-10">
              <div>
                <span className="text-[10px] font-mono text-[#2DD4BF] uppercase tracking-widest font-black block">Originator Group</span>
                <span className="text-sm font-black font-display text-white uppercase tracking-tight">{invoice?.carrier_name ? "Atlas Global Logistics" : "Your Corporation"}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block select-all">Dossier Date</span>
                <span className="text-xs font-mono font-bold text-zinc-300">{new Date(dispute.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Editable or Static Document text */}
            <div className="relative z-10" id="document-body-renderer">
              {isEditing ? (
                <div className="space-y-1">
                  <label className="text-[9px] text-[#2DD4BF] font-mono uppercase tracking-widest block mb-1">Live Document Editor</label>
                  <textarea
                    value={letterText}
                    onChange={(e) => setLetterText(e.target.value)}
                    rows={20}
                    className="w-full bg-[#0A0F1E] border border-teal-500/30 rounded-xl p-4 text-xs font-mono leading-relaxed text-[#F1F5F9] focus:outline-none focus:border-[#2DD4BF] resize-y"
                    id="dispute-letter-textarea"
                  />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-100 select-text outline-none p-2 bg-[#0A0F1E]/20 rounded-lg border border-[#1F2D45]/40 select-all">
                  {letterText}
                </pre>
              )}
            </div>

            {/* Signature Area */}
            <div className="pt-10 border-t border-[#1F2D45]/40 flex justify-between items-center text-[10px] font-mono text-zinc-500 select-none relative z-10">
              <span>FreightAudit AI Certified Claims</span>
              <span>Ref ID: {dispute.id}</span>
            </div>

          </div>

        </div>

        {/* RIGHT COMPONENT (40% equivalent to lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dispute Controls & Summary Card */}
          <div className="bg-[#111827] border border-teal-900/40 rounded-xl p-5 space-y-4 shadow-xl" id="dispute-quickview-card">
            <span className="text-[10px] font-bold font-mono text-[#2DD4BF] uppercase tracking-widest block">Audit Dispute Summary</span>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-4 py-1.5 border-b border-[#1F2D45]/50 text-xs">
              <div>
                <span className="text-zinc-500 font-mono text-[9px] uppercase">Carrier</span>
                <span className="font-extrabold text-white block mt-0.5 uppercase truncate">{dispute.carrier_name}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-mono text-[9px] uppercase">Invoice Number</span>
                <span className="font-extrabold text-white font-mono block mt-0.5">{invoice?.invoice_number || 'FDX-987452'}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-mono text-[9px] uppercase">Invoice Date</span>
                <span className="font-mono text-zinc-300 block mt-0.5">{invoice?.invoice_date || '-'}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-mono text-[9px] uppercase">Charge Status</span>
                <span className="font-bold text-amber-500 uppercase block mt-0.5">{dispute.status}</span>
              </div>
            </div>

            {/* Total disputed Refunding structure shown in LARGE RED TEXT */}
            <div className="py-2.5">
              <span className="text-zinc-500 font-mono text-[9px] uppercase block mb-1">Disputed Overcharge Amount</span>
              <p className="text-3xl font-black text-[#EF4444] font-mono leading-none tracking-tight">
                {formatMoney(dispute.total_disputed_amount)}
              </p>
            </div>

            {/* Read-Only Contested Line items list */}
            <div className="space-y-2 border-t border-[#1F2D45]/50 pt-4">
              <span className="text-[9px] font-bold font-mono text-[#94A3B8] uppercase tracking-wider block mb-1">Contested Charge Lines ({lineItems.length})</span>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {lineItems.length === 0 ? (
                  <div className="text-[10px] font-mono text-[#475569] italic">No items flagged disputed.</div>
                ) : (
                  lineItems.map((li) => (
                    <div key={li.id} className="bg-[#0A0F1E] border border-[#1F2D45]/50 rounded-lg p-2.5 flex items-center justify-between text-[11px] gap-2">
                      <div className="truncate">
                        <span className="font-bold text-zinc-300 block truncate leading-tight uppercase">{li.description}</span>
                        <span className="text-[9px] font-mono text-zinc-500 mt-0.5 block">Billed: {formatMoney(li.billed_amount)} | Contract: {formatMoney(li.expected_amount)}</span>
                      </div>
                      <span className="font-mono font-black text-[#EF4444] shrink-0">+{formatMoney(li.discrepancy)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recipient CRM input element */}
            <div className="space-y-2 border-t border-[#1F2D45]/50 pt-4">
              <label className="block text-[9px] font-bold font-mono text-[#94A3B8] uppercase tracking-wider">
                Carrier Dispute Claims Email Address
              </label>
              <input
                type="email"
                placeholder="disputes-committee@carrier-fleet.com"
                value={carrierEmail}
                onChange={(e) => setCarrierEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg text-xs font-mono placeholder-[#475569] focus:outline-none focus:border-[#2DD4BF] transition-all"
                id="carrier-email-field"
              />
            </div>

            {/* Action deck */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadPDF}
                className="py-2.5 px-4 bg-[#1C2537] hover:bg-[#1F2D45] border border-[#1F2D45] text-zinc-300 font-bold rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                id="pdf-placeholder-action"
              >
                <Download size={13} />
                <span>Download PDF</span>
              </button>

              <PermissionGate 
                action="send_disputes"
                fallback={
                  <div className="flex items-center justify-center bg-[#1A1A24]/30 border border-[#EF4444]/25 rounded-lg px-2 py-1 text-center">
                    <p className="text-[9px] text-[#94A3B8] font-mono leading-relaxed">Only managers can send disputes.</p>
                  </div>
                }
              >
                <button
                  onClick={handleSendDisputeEmail}
                  disabled={isSending || isResolved || !carrierEmail}
                  className="w-full py-2.5 px-4 bg-[#EF4444] hover:bg-red-500 text-white font-extrabold rounded-lg text-[10px] font-mono uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
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

          </div>

          {/* Vertical Status Timeline Card */}
          <div className="bg-[#111827] border border-teal-900/40 rounded-xl p-5 space-y-5" id="dispute-timeline-panel">
            <span className="text-[10px] font-bold font-mono text-[#2DD4BF] uppercase tracking-widest block">Audit Dispute Timeline</span>
            
            <div className="relative border-l border-[#1F2D45] ml-2.5 pl-5.5 space-y-6">
              
              {/* Timeline Created Stage */}
              <div className="relative">
                <span className="absolute -left-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1C2537] border border-[#2DD4BF]">
                  <Check className="h-2.5 w-2.5 text-[#2DD4BF]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide">Claim File Created</h4>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Dossier recorded successfully matching discrepancy levels.</p>
                  <p className="text-[10px] font-mono font-medium text-teal-400 mt-1">{formatDate(dispute.created_at)}</p>
                </div>
              </div>

              {/* Timeline Sent Stage */}
              <div className="relative">
                <span className={`absolute -left-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full border ${
                  isSent 
                    ? 'bg-[#1C2537] border-[#2DD4BF]' 
                    : 'bg-[#0A0F1E] border-zinc-700'
                }`}>
                  {isSent ? (
                    <Check className="h-2.5 w-2.5 text-[#2DD4BF]" />
                  ) : (
                    <Clock className="h-2.5 w-2.5 text-zinc-600" />
                  )}
                </span>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wide ${isSent ? 'text-white' : 'text-zinc-600'}`}>Claims Dispatched to Carrier</h4>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Dispute letter transmitted to billing auditor committee email channel.</p>
                  {isSent && dispute.sent_at && (
                    <p className="text-[10px] font-mono font-medium text-teal-400 mt-1">{formatDate(dispute.sent_at)}</p>
                  )}
                </div>
              </div>

              {/* Timeline Resolved Stage */}
              <div className="relative">
                <span className={`absolute -left-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full border ${
                  isResolved 
                    ? 'bg-emerald-950 border-emerald-400' 
                    : 'bg-[#0A0F1E] border-zinc-700'
                }`}>
                  {isResolved ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Clock className="h-2.5 w-2.5 text-zinc-600" />
                  )}
                </span>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wide ${isResolved ? 'text-emerald-400' : 'text-zinc-600'}`}>Dispute Resolved & Refunded</h4>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Credit adjustment applied successfully against the original freight bill.</p>
                  {isResolved && dispute.resolved_at && (
                    <div className="mt-1 space-y-1">
                      <p className="text-[10px] font-mono font-medium text-teal-400">{formatDate(dispute.resolved_at)}</p>
                      <p className="text-[10px] font-bold text-emerald-400 font-mono">Recovered Cash: {formatMoney(dispute.resolution_amount)}</p>
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
