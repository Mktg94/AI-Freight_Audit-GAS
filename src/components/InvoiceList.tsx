import React, { useState } from 'react';
import { Invoice, Contract, LineItem, AuditResult, AuditFlag } from '../../types';
import { 
  FileCheck2, Play, AlertTriangle, CheckCircle, FilePlus2, 
  HelpCircle, ArrowUpDown, ChevronRight, UploadCloud, 
  RefreshCw, DollarSign, Loader2, Landmark, Check
} from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  contracts: Contract[];
  lineItems: LineItem[];
  onAuditInvoice: (invoiceId: string, result: AuditResult, auditedItems: LineItem[]) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: 'pending' | 'auditing' | 'flagged' | 'approved' | 'disputed') => void;
  onAddManualInvoice: (invoice: Invoice, calculatedItems: {description: string, billed: number}[]) => void;
  onAddAuditLog: (log: {action: string, entity_type: string, entity_id: string, metadata?: any}) => void;
  initialSelectedInvoiceId?: string;
}

export default function InvoiceList({ 
  invoices, contracts, lineItems, onAuditInvoice, onUpdateInvoiceStatus, onAddManualInvoice, onAddAuditLog,
  initialSelectedInvoiceId
}: InvoiceListProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(initialSelectedInvoiceId || invoices[0]?.id || null);

  React.useEffect(() => {
    if (initialSelectedInvoiceId) {
      setSelectedInvoiceId(initialSelectedInvoiceId);
    }
  }, [initialSelectedInvoiceId]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Form states for manual entry
  const [carrierName, setCarrierName] = useState('FedEx Freight');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2026-05-30');
  const [shipmentDate, setShipmentDate] = useState('2026-05-25');
  const [origin, setOrigin] = useState('Chicago IL, USA');
  const [destination, setDestination] = useState('Memphis TN, USA');
  const [weightLbs, setWeightLbs] = useState('2500');
  const [distanceMiles, setDistanceMiles] = useState('540');
  const [totalBilled, setTotalBilled] = useState('1100.00');

  // Interactive billed items inputs
  const [itemRows, setItemRows] = useState([
    { description: 'Base Transit LTL Freight Fuel Charge', billed: '850.00' },
    { description: 'Contract fuel surcharge adjustments', billed: '150.00' },
    { description: 'Lift-gate dock accessorial surcharge', billed: '100.00' }
  ]);

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);
  const currentInvoiceLines = lineItems.filter(li => li.invoice_id === selectedInvoiceId);

  // Run AI Audit Engine via server middleware /api/audit
  const handleTriggerAudit = async (inv: Invoice) => {
    if (!inv) return;
    setIsAuditing(true);
    
    // Choose selected contract or first matching carrier contract
    const contract = contracts.find(c => c.carrier_name === inv.carrier_name) || contracts[0];
    
    try {
      onUpdateInvoiceStatus(inv.id, 'auditing');
      
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice: inv, contract })
      });
      
      const result: AuditResult = await response.json();
      
      // Map return discrepancies list to real LineItem objects
      const itemsToUpdate: LineItem[] = result.discrepancies.map((d, index) => {
        return {
          id: `li-live-${Date.now()}-${index}`,
          invoice_id: inv.id,
          description: d.item_description,
          billed_amount: d.billed,
          expected_amount: d.expected,
          discrepancy: d.difference,
          ai_flag_reason: d.difference > 0 ? d.reason : undefined,
          confidence_score: result.confidence_score,
          status: d.difference > 0 ? 'disputed' : 'approved',
          created_at: new Date().toISOString()
        };
      });

      onAuditInvoice(inv.id, result, itemsToUpdate);
      onAddAuditLog({
        action: "AI Freight invoice audit executed",
        entity_type: "invoice",
        entity_id: inv.id,
        metadata: {
          invoice_number: inv.invoice_number,
          detected_overcharges: result.total_discrepancy,
          status_outcome: result.status
        }
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const parsedFile = e.dataTransfer.files[0];
      simulateInvoiceUpload(parsedFile.name);
    }
  };

  const simulateInvoiceUpload = (fileName: string) => {
    // Generate simulated billing metrics
    const invNum = `FDX-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomBill = 800 + Math.floor(Math.random() * 1000);
    
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      org_id: "org-101",
      carrier_name: "FedEx Freight",
      file_name: fileName,
      file_url: "#",
      invoice_number: invNum,
      invoice_date: new Date().toISOString().split('T')[0],
      shipment_date: new Date(Date.now() - 4 * 24 * 3600000).toISOString().split('T')[0],
      origin: "Dallas TX, USA",
      destination: "Charlotte NC, USA",
      weight_lbs: 1850,
      distance_miles: 930,
      status: 'pending',
      total_billed: randomBill + 215,
      total_approved: 0,
      total_savings: 0,
      uploaded_at: new Date().toISOString(),
      raw_extracted_text: `Uploaded Bill - Simulated. Invoice#: ${invNum}. Carrier: FedEx Freight. weight: 1850 lbs. Distance: 930 miles. Charges: Base rate $${randomBill}. Fuel Surcharge (24%): $${(randomBill * 0.24).toFixed(2)}. Accessory Liftgate charge: $115.`,
      extracted_data: {
        line_items: [
          { description: "Freight Transport Transit LTL Rate", billed: randomBill },
          { description: "Fuel Premium Adjustment (24.0%)", billed: randomBill * 0.24 },
          { description: "Liftgate Accessory Charge", billed: 115.00 },
          { description: "Residential Handling Fee", billed: 100.00 }
        ]
      }
    };
    
    // Auto add manual invoice
    onAddManualInvoice(newInvoice, [
      { description: "Freight Transport Transit LTL Rate", billed: randomBill },
      { description: "Fuel Premium Adjustment (24.0%)", billed: randomBill * 0.24 },
      { description: "Liftgate Accessory Charge", billed: 115.00 },
      { description: "Residential Handling Fee", billed: 100.00 }
    ]);
    setSelectedInvoiceId(newInvoice.id);
    onAddAuditLog({
      action: "Simulated Freight PDF Invoice Dropped",
      entity_type: "invoice",
      entity_id: newInvoice.id,
      metadata: { file_name: fileName }
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return;

    const rawTotal = itemRows.reduce((sum, row) => sum + (parseFloat(row.billed) || 0), 0);

    const newInvoice: Invoice = {
      id: `inv-custom-${Date.now()}`,
      org_id: "org-101",
      carrier_name: carrierName,
      file_name: `manual_${invoiceNumber.replace('/', '_')}.pdf`,
      file_url: "#",
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      shipment_date: shipmentDate,
      origin: origin,
      destination: destination,
      weight_lbs: parseFloat(weightLbs) || 1200,
      distance_miles: parseFloat(distanceMiles) || 400,
      status: 'pending',
      total_billed: rawTotal,
      total_approved: 0,
      total_savings: 0,
      uploaded_at: new Date().toISOString(),
      raw_extracted_text: `Invoice: ${invoiceNumber}. Created manually through interface dashboard. weight: ${weightLbs} lbs. Distance: ${distanceMiles} miles. Billed total: $${rawTotal}`,
      extracted_data: {
        line_items: itemRows.map(row => ({
          description: row.description,
          billed: parseFloat(row.billed) || 0
        }))
      }
    };

    onAddManualInvoice(newInvoice, itemRows.map(row => ({
      description: row.description,
      billed: parseFloat(row.billed) || 0
    })));
    setSelectedInvoiceId(newInvoice.id);
    setShowAddModal(false);
    onAddAuditLog({
      action: "New manual Invoice registered for Audit",
      entity_type: "invoice",
      entity_id: newInvoice.id,
      metadata: { invoice_number: invoiceNumber, amount: rawTotal }
    });
  };

  const handleApproveInvoice = (inv: Invoice) => {
    if (!inv) return;
    onUpdateInvoiceStatus(inv.id, 'approved');
    onAddAuditLog({
      action: "Freight Invoice manually approved and closed",
      entity_type: "invoice",
      entity_id: inv.id,
      metadata: { invoice_number: inv.invoice_number, value: inv.total_billed }
    });
  };

  const handleOpenDispute = (inv: Invoice) => {
    if (!inv) return;
    onUpdateInvoiceStatus(inv.id, 'disputed');
    onAddAuditLog({
      action: "Disputed shipping claimed logged",
      entity_type: "invoice",
      entity_id: inv.id,
      metadata: { invoice_number: inv.invoice_number, disputed_sum: inv.total_savings }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30';
      case 'flagged': return 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30';
      case 'disputed': return 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30';
      case 'auditing': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      default: return 'bg-zinc-500/15 text-[#94a3b8] border-zinc-500/30';
    }
  };

  const getFlagBadgeColor = (flag?: string) => {
    switch (flag) {
      case 'overcharged': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'not_in_contract': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'suspicious': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="invoices-ledger">
      
      {/* LEFT COLUMN: Invoices listing */}
      <div className="lg:col-span-5 space-y-6">
        <div className="flex justify-between items-center bg-[#111827] border border-[#1f2d45] rounded-xl p-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Landmark className="text-[#2dd4bf] h-5 w-5" /> Audit Queue
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">Manage and track your active bills</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/invoices/upload');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#2dd4bf] text-[#0a0f1e] hover:bg-[#14b8a4] shadow-[0_0_15px_rgba(45,212,191,0.2)] font-bold rounded-lg transition-all cursor-pointer font-mono uppercase text-center"
            >
              <UploadCloud size={14} /> AI Upload
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              id="open-manual-bill-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#2dd4bf]/10 border border-[#2dd4bf]/40 text-[#2dd4bf] hover:bg-[#2dd4bf] hover:text-[#0a0f1e] font-semibold rounded-lg transition-all"
            >
              <FilePlus2 size={14} /> New Bill
            </button>
          </div>
        </div>

        {/* Drop File Dropzone - redirecting to structured dashboard upload panel */}
        <div 
          onClick={() => {
            window.history.pushState({}, '', '/invoices/upload');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="border-2 border-dashed border-teal-950 hover:border-[#2dd4bf] rounded-xl p-5 text-center transition-all bg-[#111827]/40 cursor-pointer hover:bg-teal-950/10"
        >
          <div className="space-y-2.5 block">
            <UploadCloud className="mx-auto text-[#2dd4bf] animate-bounce" size={32} />
            <div>
              <span className="text-xs font-semibold text-white block">AI Digital Auditer Storage</span>
              <span className="text-[10px] text-zinc-500 mt-1 block">Click here to initiate structural pipeline parsing and automated compliance cross-checks</span>
            </div>
          </div>
        </div>

        {/* List Grid */}
        <div className="bg-[#111827] border border-[#1f2d45] rounded-xl overflow-hidden max-h-[500px] overflow-y-auto divide-y divide-[#1f2d45]/60">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">No freight invoices located. New logs will appear here.</div>
          ) : (
            invoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoiceId(inv.id)}
                className={`p-4 cursor-pointer transition-all flex justify-between items-center ${
                  selectedInvoiceId === inv.id ? 'bg-[#1c2537]' : 'hover:bg-zinc-950/20'
                }`}
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-tight">{inv.invoice_number}</span>
                    <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full border ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#94a3b8]">
                    <span className="font-semibold text-zinc-400">{inv.carrier_name}</span>
                    <span className="text-[#475569]">&bull;</span>
                    <span>{inv.invoice_date}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 flex gap-1">
                    <span>{inv.origin.split(',')[0]}</span>
                    <span>&rarr;</span>
                    <span>{inv.destination.split(',')[0]}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-sm font-bold text-[#f1f5f9] font-mono">${inv.total_billed.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  {inv.status === 'flagged' && (
                    <span className="block text-[10px] text-emerald-400 font-semibold font-mono">-${inv.total_savings.toFixed(2)} recovery</span>
                  )}
                  {inv.status === 'disputed' && (
                    <span className="block text-[10px] text-[#f59e0b] font-semibold font-mono">Disputed</span>
                  )}
                  {inv.status === 'approved' && (
                    <span className="block text-[10px] text-[#10b981] font-semibold font-mono">Cleared</span>
                  )}
                  <ChevronRight size={14} className="text-zinc-600 inline ml-1.5 align-middle" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Detail Review */}
      <div className="lg:col-span-7">
        {!selectedInvoice ? (
          <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-10 text-center text-[#475569] flex flex-col justify-center items-center h-full">
            <FileCheck2 size={42} className="text-zinc-600 mb-2" />
            <span className="text-sm font-semibold">No Invoice Selected</span>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">Provide or highlight an ongoing bill in the queue to examine audit data and generate claims.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Invoice metadata header */}
            <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#2dd4bf]/2 rounded-full blur-2xl mt-[-20px] mr-[-20px]" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <span className="text-teal-400 font-bold tracking-tight text-xl font-display">{selectedInvoice.invoice_number}</span>
                    <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full border ${getStatusColor(selectedInvoice.status)}`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-[#f1f5f9]">{selectedInvoice.carrier_name} Freight Bill</h3>
                  <p className="text-xs text-zinc-400 font-mono">Attached document: <span className="text-[#94a3b8] underline">{selectedInvoice.file_name}</span></p>
                </div>

                <div className="flex gap-2.5 flex-wrap">
                  {selectedInvoice.status === 'pending' && (
                    <button
                      onClick={() => handleTriggerAudit(selectedInvoice)}
                      disabled={isAuditing}
                      className="flex items-center gap-1.5 px-4.5 py-2 bg-[#2dd4bf] hover:bg-[#14b8a4] text-[#0a0f1e] font-bold rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(45,212,191,0.2)] disabled:opacity-50"
                    >
                      {isAuditing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Auditing...
                        </>
                      ) : (
                        <>
                          <Play size={15} /> Run AI Audit
                        </>
                      )}
                    </button>
                  )}

                  {selectedInvoice.status === 'flagged' && (
                    <>
                      <button
                        onClick={() => handleApproveInvoice(selectedInvoice)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1c2537] hover:bg-zinc-800 text-[#10b981] font-semibold border border-[#10b981]/30 rounded-lg text-xs transition-colors"
                      >
                        <Check size={14} className="mr-0.5" /> Approve Full Bill
                      </button>
                      <button
                        onClick={() => handleOpenDispute(selectedInvoice)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#2dd4bf] hover:bg-[#14b8a4] text-[#0a0f1e] font-semibold rounded-lg text-xs transition-all duration-200"
                      >
                        File Claims Dispute
                      </button>
                    </>
                  )}
                  
                  {selectedInvoice.status === 'approved' && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <CheckCircle size={14} /> Approved & Finalized
                    </div>
                  )}

                  {selectedInvoice.status === 'disputed' && (
                    <div className="flex items-center gap-1.5 text-[#f59e0b] text-xs font-semibold px-3.5 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg">
                      <AlertTriangle size={14} /> Claims Logged
                    </div>
                  )}
                </div>
              </div>

              {/* Transit Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#1f2d45]/60 text-xs bg-[#0a0f1e]/40 p-4 rounded-lg">
                <div>
                  <span className="text-[#94a3b8] block mb-1">Origin Facility</span>
                  <span className="font-bold text-white block">{selectedInvoice.origin}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block mb-1">Destination</span>
                  <span className="font-bold text-white block">{selectedInvoice.destination}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block mb-1">Weight Formula</span>
                  <span className="font-bold text-white block font-mono">{(Number(selectedInvoice.weight_lbs)).toLocaleString()} lbs</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block mb-1">Trip Distance</span>
                  <span className="font-bold text-white block font-mono">{selectedInvoice.distance_miles} miles</span>
                </div>
              </div>

              {/* Financial block stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-[#1c2537] rounded-lg p-3 text-center border border-[#1f2d45]">
                  <span className="text-[10px] text-[#94a3b8] block">TOTAL BILLED</span>
                  <span className="font-mono text-base font-bold text-[#f1f5f9]">${selectedInvoice.total_billed.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="bg-[#1c2537] rounded-lg p-3 text-center border border-[#1f2d45]">
                  <span className="text-[10px] text-[#94a3b8] block">CONTRACT EXPECTED</span>
                  <span className="font-mono text-base font-bold text-teal-400">
                    {selectedInvoice.total_approved > 0 ? `$${selectedInvoice.total_approved.toLocaleString('en-US', {minimumFractionDigits: 2})}` : 'Not Audited'}
                  </span>
                </div>
                <div className="bg-[#1c2537] rounded-lg p-3 text-center border border-teal-900/40">
                  <span className="text-[10px] text-[#94a3b8] block">AI DISCREPANCY</span>
                  <span className={`font-mono text-base font-bold ${selectedInvoice.total_savings > 0 ? 'text-rose-400' : 'text-[#94a3b8]'}`}>
                    {selectedInvoice.total_savings > 0 ? `$${selectedInvoice.total_savings.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '$0.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items billing results audit table */}
            <div className="bg-[#111827] border border-[#1f2d45] rounded-xl overflow-hidden">
              <div className="px-6 py-4.5 border-b border-[#1f2d45]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="text-[#2dd4bf]" size={16} /> Audited Bill Line Items
                </h3>
              </div>

              {selectedInvoice.status === 'pending' ? (
                <div className="p-8 text-center text-zinc-400 space-y-4">
                  <HelpCircle className="mx-auto text-[#f59e0b] opacity-70" size={36} />
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-white block">Audit Report Pending</span>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">This invoice is in raw extract stage. Press "Run AI Audit" to cross-reference with negotiated carrier contract rates.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-[#1f2d45]/60">
                    <thead className="bg-[#1c2537] text-[#94a3b8] font-semibold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Fee / Description</th>
                        <th className="px-6 py-3 text-right">Billed</th>
                        <th className="px-6 py-3 text-right">Negotiated</th>
                        <th className="px-6 py-3 text-right text-[#ef4444]">Overcharge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2d45]/40 text-[#f1f5f9]">
                      {currentInvoiceLines.map((li) => (
                        <React.Fragment key={li.id}>
                          <tr className={li.discrepancy > 0 ? 'bg-red-500/[0.02]' : ''}>
                            <td className="px-6 py-3.5 max-w-sm">
                              <span className="font-bold text-[#f1f5f9] block">{li.description}</span>
                            </td>
                            <td className="px-6 py-3.5 text-right font-mono font-medium">${li.billed_amount.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-mono text-emerald-400">${li.expected_amount.toFixed(2)}</td>
                            <td className={`px-6 py-3.5 text-right font-mono font-bold ${
                              li.discrepancy > 0 ? 'text-[#ef4444]' : 'text-zinc-500'
                            }`}>
                              {li.discrepancy > 0 ? `+$${li.discrepancy.toFixed(2)}` : '$0.00'}
                            </td>
                          </tr>
                          {li.ai_flag_reason && (
                            <tr className="bg-[#ef4444]/5">
                              <td colSpan={4} className="px-6 py-2.5 pb-3">
                                <div className="text-[10px] text-rose-400 flex items-start gap-1.5">
                                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                  <span>{li.ai_flag_reason}</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Manual invoice creator modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0a0f1e]/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1f2d45] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#1f2d45]">
              <h3 className="text-lg font-bold text-white">Manual Invoice Registration Form</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[#94a3b8] uppercase tracking-wider font-semibold mb-1">Carrier Provider</label>
                  <select 
                    value={carrierName} 
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded-lg focus:outline-none focus:border-[#2dd4bf]"
                  >
                    {contracts.map(c => (
                      <option key={c.id} value={c.carrier_name}>{c.carrier_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#94a3b8] uppercase tracking-wider font-semibold mb-1">Freight Bill Invoice #</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. FDX-001092"
                    value={invoiceNumber} 
                    onChange={(e) => setInvoiceNumber(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded-lg focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] uppercase tracking-wider font-semibold mb-1">Billing Date</label>
                  <input 
                    type="date" 
                    value={invoiceDate} 
                    onChange={(e) => setInvoiceDate(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded-lg focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] uppercase tracking-wider font-semibold mb-1">Shipment Date</label>
                  <input 
                    type="date" 
                    value={shipmentDate} 
                    onChange={(e) => setShipmentDate(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded-lg focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] uppercase tracking-wider font-semibold mb-1">Cargo weight (Lbs)</label>
                  <input 
                    type="number" 
                    value={weightLbs} 
                    onChange={(e) => setWeightLbs(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded-lg focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] uppercase tracking-wider font-semibold mb-1">Transit Route Miles</label>
                  <input 
                    type="number" 
                    value={distanceMiles} 
                    onChange={(e) => setDistanceMiles(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded-lg focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] uppercase tracking-wider font-semibold mb-1">Origin Hub</label>
                  <input 
                    type="text" 
                    value={origin} 
                    onChange={(e) => setOrigin(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded-lg focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] uppercase tracking-wider font-semibold mb-1">Destination Facility</label>
                  <input 
                    type="text" 
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded-lg focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>
              </div>

              {/* Items Table rows in modal */}
              <div className="space-y-3 pt-3 border-t border-[#1f2d45]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-teal-400">Drawn Bill Itemization Rows</span>
                  <button 
                    type="button" 
                    onClick={() => setItemRows([...itemRows, { description: '', billed: '0.00' }])}
                    className="px-2 py-1 text-[10px] bg-teal-500/10 border border-teal-500/20 text-[#2dd4bf] rounded hover:bg-[#2dd4bf]/20"
                  >
                    + Add Charge Row
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {itemRows.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Fuel Multiplier, Accessory Delivery"
                        value={row.description} 
                        onChange={(e) => {
                          const updated = [...itemRows];
                          updated[idx].description = e.target.value;
                          setItemRows(updated);
                        }} 
                        className="flex-1 px-2.5 py-1.5 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded"
                      />
                      <input 
                        type="number" 
                        required 
                        placeholder="0.00"
                        value={row.billed} 
                        onChange={(e) => {
                          const updated = [...itemRows];
                          updated[idx].billed = e.target.value;
                          setItemRows(updated);
                        }} 
                        className="w-24 px-2.5 py-1.5 bg-[#0a0f1e] text-white border border-[#1f2d45] rounded text-right font-mono"
                      />
                      <button 
                        type="button" 
                        onClick={() => setItemRows(itemRows.filter((_, i) => i !== idx))} 
                        className="text-red-400 hover:text-red-200 text-sm font-semibold px-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#1f2d45] flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#1c2537] text-zinc-400 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#2dd4bf] hover:bg-[#14b8a4] text-[#0a0f1e] font-semibold rounded-lg"
                >
                  Create Pending Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
