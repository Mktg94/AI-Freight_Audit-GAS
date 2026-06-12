import React from 'react';
import { LineItem, Invoice } from '@/types';
import { AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';


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
      className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col h-full"
      id="dashboard-exceptions-queue"
    >
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Exceptions Queue
          </h3>
        </div>
      </div>

      <div className="flex-grow space-y-3.5 overflow-y-auto max-h-[380px] pr-1">
        {flaggedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle className="w-5 h-5" />
            </span>
            <p className="text-sm text-gray-400">No exceptions — everything's clean</p>
          </div>
        ) : (
          flaggedItems.map((item) => {
            const carrier = getCarrierName(item.invoice_id);
            const invNum = getInvoiceNumber(item.invoice_id);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="text-xs font-mono text-gray-400">#{invNum}</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5 truncate" title={item.description}>
                    {item.description}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono font-semibold text-red-500">
                    +${item.discrepancy.toFixed(2)}
                  </span>

                  <button
                    onClick={() => handleReviewClick(item.invoice_id)}
                    className="text-xs text-indigo-600 hover:underline font-medium ml-3"
                    title={`Review Invoice #${invNum}`}
                  >
                    Review
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
