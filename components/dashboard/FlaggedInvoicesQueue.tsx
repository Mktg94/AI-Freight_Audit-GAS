import React from 'react';
import { LineItem, Invoice } from '@/types';
import { AlertCircle, ChevronRight } from 'lucide-react';

interface FlaggedInvoicesQueueProps {
  lineItems: LineItem[];
  invoices: Invoice[];
  onReview?: (invoiceId: string) => void;
}

export default function FlaggedInvoicesQueue({
  lineItems,
  invoices,
  onReview
}: FlaggedInvoicesQueueProps) {
  // Filter for: status = 'pending' AND discrepancy > 0 (or some flag is present)
  // Let's grab up to 8 items
  const flaggedItems = lineItems
    .filter(item => item.discrepancy > 0)
    .slice(0, 8);

  const getInvoiceNumber = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    return inv ? inv.invoice_number : 'N/A';
  };

  const getCarrierName = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    return inv ? inv.carrier_name : 'Carrier';
  };

  const handleReviewClick = (invoiceId: string) => {
    if (onReview) {
      onReview(invoiceId);
    } else {
      // Fallback SPA custom event logic or routing
      window.history.pushState({}, '', `/invoices`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div 
      className="bg-[#111827] border border-teal-900/40 rounded-xl p-6 flex flex-col h-full"
      id="dashboard-exceptions-queue"
    >
      <div className="flex items-center gap-2 pb-4 border-b border-[#1F2D45] mb-4">
        <AlertCircle className="text-[#F59E0B] h-5 w-5 animate-pulse" />
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white font-display uppercase">
            Exceptions Queue
          </h3>
          <p className="text-[9px] text-[#94A3B8] font-mono uppercase tracking-wider">
            Detected Carrier Overcharges Pending Audit Action
          </p>
        </div>
      </div>

      <div className="flex-grow space-y-3.5 overflow-y-auto max-h-[380px] pr-1">
        {flaggedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <span className="text-[10px] text-[#2DD4BF] font-mono tracking-widest uppercase bg-teal-500/5 px-2.5 py-1 rounded-full">
              Ledger Clear
            </span>
            <p className="text-[11px] text-[#94A3B8] max-w-[200px] leading-relaxed">
              No outstanding contract discrepancies detected in pending status.
            </p>
          </div>
        ) : (
          flaggedItems.map((item) => {
            const carrier = getCarrierName(item.invoice_id);
            const invNum = getInvoiceNumber(item.invoice_id);
            
            return (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 bg-[#0A0F1E]/60 border border-[#1F2D45] rounded-xl hover:border-teal-900/30 transition-all group"
              >
                <div className="space-y-1 text-left min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold text-zinc-500 font-mono">
                      #{invNum}
                    </span>
                    <span className="h-1 w-1 bg-[#1F2D45] rounded-full" />
                    <span className="text-[10px] font-semibold text-[#2DD4BF] font-sans truncate max-w-[120px]">
                      {carrier}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-[#F1F5F9] truncate" title={item.description}>
                    {item.description}
                  </p>
                  {item.ai_flag_reason && (
                    <p className="text-[9px] text-zinc-400 font-sans italic leading-none truncate max-w-[200px]">
                      Reason: {item.ai_flag_reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-[#EF4444] bg-red-950/20 px-2 py-0.5 rounded-md border border-red-950/30">
                    +${item.discrepancy.toFixed(2)}
                  </span>
                  
                  <button
                    onClick={() => handleReviewClick(item.invoice_id)}
                    className="p-1 px-2 bg-[#1C2537] hover:bg-teal-950/30 text-[10px] font-black uppercase text-[#2DD4BF] rounded-lg border border-[#1F2D45] hover:border-[#2DD4BF]/40 transition-all flex items-center gap-0.5"
                    title={`Handle overcharge for Invoice #${invNum}`}
                  >
                    <span>Audit</span>
                    <ChevronRight size={10} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
