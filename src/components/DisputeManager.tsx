import React, { useState } from 'react';
import { Dispute, Invoice } from '../../types';
import { 
  FileText, Mail, Send, CheckCircle2, XCircle, Plus, 
  Trash2, Copy, Download, Save, Clock, ChevronRight, Edit3
} from 'lucide-react';

interface DisputeManagerProps {
  disputes: Dispute[];
  invoices: Invoice[];
  onAddDispute: (dispute: Dispute) => void;
  onUpdateDisputeStatus: (disputeId: string, status: 'draft' | 'sent' | 'resolved' | 'rejected', resolutionAmount?: number) => void;
  onAddAuditLog: (log: {action: string, entity_type: string, entity_id: string, metadata?: any}) => void;
}

export default function DisputeManager({ 
  disputes, invoices, onAddDispute, onUpdateDisputeStatus, onAddAuditLog 
}: DisputeManagerProps) {
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(disputes[0]?.id || null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [showResModal, setShowResModal] = useState(false);
  
  // Resolution inputs
  const [resolutionAmount, setResolutionAmount] = useState('');
  const [resStatus, setResStatus] = useState<'resolved' | 'rejected'>('resolved');

  // Form states for manually compiling a dispute
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chosenInvoiceId, setChosenInvoiceId] = useState('');
  const [carrierEmail, setCarrierEmail] = useState('');

  const selectedDispute = disputes.find(d => d.id === selectedDisputeId);
  const [editedLetterText, setEditedLetterText] = useState(selectedDispute?.dispute_letter_text || '');

  // Keep edited text in sync when changing selection
  React.useEffect(() => {
    if (selectedDispute) {
      setEditedLetterText(selectedDispute.dispute_letter_text);
      setIsEditingText(false);
    }
  }, [selectedDisputeId]);

  const handleCreateDisputeFromScratch = () => {
    const inv = invoices.find(i => i.id === chosenInvoiceId);
    if (!inv) return;

    const emailPrefix = inv.carrier_name.toLowerCase().replace(/[^a-z]/g, '');
    const genEmail = `disputes@${emailPrefix || 'carrier'}.com`;

    const disputeLetter = `RE: Carrier Billing Dispute - Invoice #${inv.invoice_number}

Atlas Global Logistics is submitting a formal billing correction request for freight invoice #${inv.invoice_number}, issued on ${inv.invoice_date}.

The audit comparison with active Contract Terms identified several pricing overcharges:
- Billed freight rate: $${inv.total_billed.toFixed(2)}
- Expected contract structure: $${(inv.total_approved || (inv.total_billed - 120)).toFixed(2)}
- Unreconciled pricing difference: $${(inv.total_savings || 120).toFixed(2)}

Please review the contractual rate sheet limits, hold subsequent payments for these specific line items, and adjust our billing ledger or apply account credits immediately.

With regards,
Atlas Global Logistics Audit Team`;

    const newDispute: Dispute = {
      id: `disp-${Date.now()}`,
      invoice_id: inv.id,
      org_id: "org-101",
      carrier_name: inv.carrier_name,
      carrier_email: carrierEmail || genEmail,
      dispute_letter_text: disputeLetter,
      total_disputed_amount: inv.total_savings || 120.00,
      status: 'draft',
      created_at: new Date().toISOString()
    };

    onAddDispute(newDispute);
    setSelectedDisputeId(newDispute.id);
    setShowCreateModal(false);
    onAddAuditLog({
      action: "New dispute item drafted",
      entity_type: "dispute",
      entity_id: newDispute.id,
      metadata: { invoice_number: inv.invoice_number, amount: newDispute.total_disputed_amount }
    });
  };

  const handleDownloadTxt = () => {
    if (!selectedDispute) return;
    const element = document.createElement("a");
    const file = new Blob([editedLetterText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `FreightAudit_Dispute_${selectedDispute.carrier_name.replace(/\s+/g, '_')}_INV.txt`;
    document.body.appendChild(element);
    element.click();
    
    // cleanup
    document.body.removeChild(element);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editedLetterText);
  };

  const handleSaveTextChanges = () => {
    if (!selectedDispute) return;
    selectedDispute.dispute_letter_text = editedLetterText;
    setIsEditingText(false);
    onAddAuditLog({
      action: "Inline dispute legal letter modified",
      entity_type: "dispute",
      entity_id: selectedDispute.id,
      metadata: { carrier: selectedDispute.carrier_name }
    });
  };

  const handleSendEmailSim = () => {
    if (!selectedDispute) return;
    
    // Transition to Sent status
    onUpdateDisputeStatus(selectedDispute.id, 'sent');
    onAddAuditLog({
      action: "Emailed dispute claims record directly to carrier",
      entity_type: "dispute",
      entity_id: selectedDispute.id,
      metadata: { carrier: selectedDispute.carrier_name, recipient: selectedDispute.carrier_email }
    });
  };

  const handleResolveTrigger = (statusFlag: 'resolved' | 'rejected') => {
    setResStatus(statusFlag);
    setResolutionAmount(selectedDispute?.total_disputed_amount.toString() || '0');
    setShowResModal(true);
  };

  const handleSaveResolution = () => {
    if (!selectedDispute) return;
    const val = resStatus === 'resolved' ? parseFloat(resolutionAmount) : 0;
    
    onUpdateDisputeStatus(selectedDispute.id, resStatus, val);
    setShowResModal(false);
    onAddAuditLog({
      action: `Claim dispute resolved to standard: ${resStatus.toUpperCase()}`,
      entity_type: "dispute",
      entity_id: selectedDispute.id,
      metadata: { status: resStatus, offset_savings: val }
    });
  };

  const getDisputeStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30';
      case 'sent': return 'bg-[#2dd4bf]/15 text-[#2dd4bf] border-[#2dd4bf]/30';
      case 'rejected': return 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30';
      default: return 'bg-zinc-500/15 text-[#94a3b8] border-zinc-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dispute-claims-portal">
      
      {/* LEFT COLUMN: Dispute drafts queue */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-4 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-[#f1f5f9] tracking-tight flex items-center gap-2">
              <Mail className="text-[#2dd4bf] h-5 w-5" /> Disputes Portal
            </h2>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">Track recovering balances</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-1 px-2.5 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-[11px] rounded flex items-center gap-1.5"
          >
            <Plus size={12} /> Claim Draft
          </button>
        </div>

        <div className="bg-[#111827] border border-[#1f2d45] rounded-xl overflow-hidden divide-y divide-[#1f2d45]/60 max-h-[500px] overflow-y-auto">
          {disputes.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">No dispute logs loaded in draft. Check in later.</div>
          ) : (
            disputes.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelectedDisputeId(d.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedDisputeId === d.id ? 'bg-[#1c2537]' : 'hover:bg-zinc-950/20'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#f1f5f9] tracking-tight truncate max-w-[140px]">{d.carrier_name}</span>
                  <span className={`text-[9px] px-2 py-0.2 font-bold rounded-full border ${getDisputeStatusBadge(d.status)}`}>
                    {d.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1.5">
                  <span className="font-semibold block font-mono text-[#2dd4bf]">${d.total_disputed_amount.toFixed(2)} contested</span>
                  {d.resolved_at ? (
                    <span className="text-[9px] text-[#10b981] font-bold">Recoved ${d.resolution_amount?.toFixed(2)}</span>
                  ) : (
                    <span className="text-[9px] flex items-center gap-1 text-zinc-500"><Clock size={10} /> Pending</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Dispute Letter editor */}
      <div className="lg:col-span-8">
        {!selectedDispute ? (
          <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-10 text-center text-[#475569] flex flex-col justify-center items-center h-full">
            <FileText size={42} className="text-zinc-600 mb-2" />
            <span className="text-sm font-semibold">No Dispute Claim Highlighted</span>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">Please select an item from the list to preview claims, customize letter details, or download.</p>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1f2d45] rounded-xl overflow-hidden flex flex-col space-y-4 p-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#1f2d45] gap-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">{selectedDispute.carrier_name} Dispute File</h3>
                <span className="text-[11px] text-zinc-400 block mt-0.5">Dispatched to carrier contact: <span className="text-[#2dd4bf] font-medium">{selectedDispute.carrier_email}</span></span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={handleCopyToClipboard}
                  className="p-2 py-1.5 bg-zinc-800 text-zinc-300 hover:text-white rounded text-xs flex items-center gap-1"
                  title="Copy Text to Clipboard"
                >
                  <Copy size={13} /> Copy
                </button>
                <button 
                  onClick={handleDownloadTxt}
                  className="p-2 py-1.5 bg-zinc-800 text-zinc-300 hover:text-white rounded text-xs flex items-center gap-1"
                  title="Download File (.txt)"
                >
                  <Download size={13} /> Saved TXT
                </button>

                {selectedDispute.status === 'draft' && (
                  <button 
                    onClick={handleSendEmailSim}
                    className="p-2 py-1.5 bg-[#2dd4bf] hover:bg-[#14b8a4] text-[#0a0f1e] font-bold rounded text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(45,212,191,0.2)]"
                  >
                    <Send size={12} /> Despatch Email
                  </button>
                )}

                {selectedDispute.status === 'sent' && (
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleResolveTrigger('resolved')}
                      className="p-2 py-1.5 bg-[#10b981] hover:bg-emerald-600 text-white font-bold rounded text-xs flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} /> Approved Settlement
                    </button>
                    <button 
                      onClick={() => handleResolveTrigger('rejected')}
                      className="p-2 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs flex items-center gap-1"
                    >
                      <XCircle size={12} /> Claim Denied
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content text */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#94a3b8] font-bold uppercase tracking-wider">Audit Claim Draft Letter</span>
                
                {!isEditingText ? (
                  <button 
                    onClick={() => setIsEditingText(true)}
                    className="text-xs text-[#2dd4bf] flex items-center gap-1 hover:underline"
                  >
                    <Edit3 size={11} /> Modify Letter Body
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveTextChanges}
                    className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-2.5 py-0.5 flex items-center gap-1 hover:bg-emerald-500/20"
                  >
                    <Save size={11} /> Save Changes
                  </button>
                )}
              </div>

              {isEditingText ? (
                <textarea
                  value={editedLetterText}
                  onChange={(e) => setEditedLetterText(e.target.value)}
                  className="w-full text-xs font-mono bg-[#0a0f1e] text-white border border-[#1f2d45] rounded-xl p-4.5 h-[350px] focus:outline-none focus:border-[#2dd4bf] leading-relaxed"
                />
              ) : (
                <div className="w-full text-xs font-mono bg-[#0a0f1e]/80 text-[#f1f5f9] border border-[#1f2d45] rounded-xl p-4.5 h-[350px] overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
                  {editedLetterText}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Resolution Adjustment Modal */}
      {showResModal && (
        <div className="fixed inset-0 bg-[#0a0f1e]/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1f2d45] rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              {resStatus === 'resolved' ? 'Approved Settlement Credit Ledger' : 'Confirm Dispute Rejection Claim'}
            </h3>
            
            {resStatus === 'resolved' ? (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">Carrier accepted billing mistakes. Log the settled refund/credit amount to balance Atlas claims statistics:</p>
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-bold">Approved resolution credit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={resolutionAmount}
                    onChange={(e) => setResolutionAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded font-mono text-xs focus:outline-none focus:border-[#20b981]"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">Marking this claims file as rejected/denied. This resolves outstanding balance records while adjusting recoveries to zero.</p>
            )}

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button onClick={() => setShowResModal(false)} className="px-3.5 py-1.5 bg-[#1c2537] text-zinc-400 rounded">Cancel</button>
              <button 
                onClick={handleSaveResolution} 
                className="px-4 py-1.5 bg-[#2dd4bf] text-[#0a0f1e] font-semibold rounded hover:bg-[#14b8a4]"
              >
                Log claim Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create custom dispute Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0a0f1e]/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1f2d45] rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Create Claim Dispute File</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#94a3b8] mb-1">Target Billing Invoice</label>
                <select
                  value={chosenInvoiceId}
                  onChange={(e) => setChosenInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded"
                >
                  <option value="">Select an invoice to dispute</option>
                  {invoices.filter(i => i.status === 'flagged' || i.status === 'pending').map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoice_number} ({inv.carrier_name} - ${inv.total_billed.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#94a3b8] mb-1">Carrier Recipient Claims Email</label>
                <input
                  type="email"
                  placeholder="e.g. claims@carrier.com"
                  value={carrierEmail}
                  onChange={(e) => setCarrierEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-3.5 py-1.5 bg-zinc-800 text-zinc-400 rounded">Cancel</button>
              <button 
                onClick={handleCreateDisputeFromScratch}
                disabled={!chosenInvoiceId}
                className="px-4 py-1.5 bg-[#2dd4bf] text-[#0a0f1e] font-bold rounded disabled:opacity-50"
              >
                Assemble Dispute Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
