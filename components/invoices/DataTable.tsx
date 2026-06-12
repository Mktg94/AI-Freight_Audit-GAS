"use client";

import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, ChevronUp, ChevronDown, Eye, 
  ChevronRight, Folder, FileText 
} from 'lucide-react';
import { Invoice } from '@/types';
import InvoiceStatusBadge from './InvoiceStatusBadge';

interface DataTableProps {
  data: Invoice[];
  loading?: boolean;
  onViewInvoice?: (id: string) => void;
  batchFilter?: string;
}

type SortField = 'invoice_number' | 'carrier_name' | 'uploaded_at' | 'total_billed' | 'total_savings' | 'status';
type SortDirection = 'asc' | 'desc';

export default function DataTable({ 
  data, 
  loading = false, 
  onViewInvoice,
  batchFilter = 'all' 
}: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>('uploaded_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 35;

  const filteredAndSortedData = useMemo(() => {
    let list = [...data];

    if (batchFilter === 'single') {
      list = list.filter(inv => !inv.batch_id && (!inv.source || !inv.source.startsWith('Batch —')));
    } else if (batchFilter === 'batch') {
      list = list.filter(inv => !!inv.batch_id || (inv.source && inv.source.startsWith('Batch —')));
    }

    return list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [data, sortField, sortDirection, batchFilter]);

  const toggleBatch = (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBatches(prev => ({
      ...prev,
      [batchId]: prev[batchId] === false ? true : false
    }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderedTableItems = useMemo(() => {
    const items: Array<{
      type: 'single' | 'batch_header' | 'batch_child';
      invoice?: Invoice;
      batchId?: string;
      batchFilename?: string;
      childInvoices?: Invoice[];
    }> = [];

    const processedBatchIds = new Set<string>();

    filteredAndSortedData.forEach((invoice) => {
      const bId = invoice.batch_id;
      
      if (!bId) {
        items.push({ type: 'single', invoice });
      } else {
        if (processedBatchIds.has(bId)) return;
        processedBatchIds.add(bId);

        const siblings = filteredAndSortedData.filter(i => i.batch_id === bId);
        const filename = invoice.source?.replace('Batch — ', '') || 'Bulk Load Dataset';

        items.push({
          type: 'batch_header',
          batchId: bId,
          batchFilename: filename,
          childInvoices: siblings
        });

        siblings.forEach((sib) => {
          items.push({
            type: 'batch_child',
            invoice: sib,
            batchId: bId
          });
        });
      }
    });

    return items;
  }, [filteredAndSortedData]);

  const totalItems = renderedTableItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const displayPage = Math.min(currentPage, totalPages);
  const startOffset = totalItems === 0 ? 0 : (displayPage - 1) * itemsPerPage + 1;
  const endOffset = Math.min(displayPage * itemsPerPage, totalItems);

  const paginatedItems = useMemo(() => {
    const start = (displayPage - 1) * itemsPerPage;
    return renderedTableItems.slice(start, start + itemsPerPage);
  }, [renderedTableItems, displayPage]);

  const handleRowClick = (invoiceId: string) => {
    if (onViewInvoice) {
      onViewInvoice(invoiceId);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/invoices/${invoiceId}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-gray-300 group-hover:text-gray-400 transition-all ml-1.5" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp size={12} className="text-indigo-600 ml-1.5" />
      : <ChevronDown size={12} className="text-indigo-600 ml-1.5" />;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between" id="invoices-data-table-deck">
      <div className="min-w-full overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] uppercase font-semibold tracking-widest font-mono">
              <th 
                className="py-3 px-4 cursor-pointer group hover:text-gray-600 transition-all select-none"
                onClick={() => handleSort('invoice_number')}
              >
                <div className="flex items-center">
                  <span>Invoice #</span>
                  {renderSortIndicator('invoice_number')}
                </div>
              </th>
              
              <th 
                className="py-3 px-4 cursor-pointer group hover:text-gray-600 transition-all select-none"
                onClick={() => handleSort('carrier_name')}
              >
                <div className="flex items-center">
                  <span>Carrier</span>
                  {renderSortIndicator('carrier_name')}
                </div>
              </th>

              <th 
                className="py-3 px-4 cursor-pointer group hover:text-gray-600 transition-all select-none"
                onClick={() => handleSort('uploaded_at')}
              >
                <div className="flex items-center">
                  <span>Upload Date</span>
                  {renderSortIndicator('uploaded_at')}
                </div>
              </th>

              <th className="py-3 px-4 text-gray-400 font-semibold">
                Source
              </th>

              <th 
                className="py-3 px-4 cursor-pointer group hover:text-gray-600 transition-all select-none text-right"
                onClick={() => handleSort('total_billed')}
              >
                <div className="flex items-center justify-end">
                  <span>Total Billed</span>
                  {renderSortIndicator('total_billed')}
                </div>
              </th>

              <th 
                className="py-3 px-4 cursor-pointer group hover:text-gray-600 transition-all select-none text-right"
                onClick={() => handleSort('total_savings')}
              >
                <div className="flex items-center justify-end">
                  <span>Discrepancy</span>
                  {renderSortIndicator('total_savings')}
                </div>
              </th>

              <th 
                className="py-3 px-4 cursor-pointer group hover:text-gray-600 transition-all select-none text-center"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center">
                  <span>Status</span>
                  {renderSortIndicator('status')}
                </div>
              </th>

              <th className="py-3 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3, 4, 5].map((idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 px-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                  <td className="py-3 px-4"><div className="h-4 bg-gray-100 rounded w-28"></div></td>
                  <td className="py-3 px-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                  <td className="py-3 px-4"><div className="h-4 bg-gray-100 rounded w-28"></div></td>
                  <td className="py-3 px-4 text-right"><div className="h-4 bg-gray-100 rounded w-16 ml-auto"></div></td>
                  <td className="py-3 px-4 text-right"><div className="h-4 bg-gray-100 rounded w-16 ml-auto"></div></td>
                  <td className="py-3 px-4 text-center"><div className="h-5 bg-gray-100 rounded-full w-20 mx-auto"></div></td>
                  <td className="py-3 px-4 text-right"><div className="h-7 bg-gray-100 rounded w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                  No invoices found matching filter options.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, index) => {
                if (item.type === 'batch_header') {
                  const bId = item.batchId!;
                  const isCollapsed = expandedBatches[bId] === false;
                  const totalCount = item.childInvoices?.length || 0;
                  const totalBilledVal = item.childInvoices?.reduce((sum, i) => sum + i.total_billed, 0) || 0;
                  const totalSavingsVal = item.childInvoices?.reduce((sum, i) => sum + i.total_savings, 0) || 0;

                  return (
                    <tr 
                      key={`header-${bId}`} 
                      onClick={(e) => toggleBatch(bId, e)}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-900 text-sm cursor-pointer transition-colors border-b border-gray-100 select-none"
                    >
                      <td colSpan={4} className="py-3 px-4 font-semibold">
                        <div className="flex items-center gap-3">
                          <span className="p-0.5 rounded text-indigo-600">
                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          </span>
                          <Folder size={14} className="text-indigo-500 shrink-0" />
                          <span className="font-semibold text-gray-900 text-sm">
                            {item.batchFilename}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-200 text-[10px] text-gray-500 font-mono font-semibold">
                            {totalCount} Invoices
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                        {totalBilledVal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-red-500">
                        {totalSavingsVal > 0 ? totalSavingsVal.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold font-mono border border-indigo-200">
                          Batch
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs text-gray-400 font-mono">
                          {isCollapsed ? 'Expand' : 'Collapse'}
                        </span>
                      </td>
                    </tr>
                  );
                }

                if (item.type === 'batch_child' && item.batchId && expandedBatches[item.batchId] === false) {
                  return null;
                }

                const invoice = item.invoice!;
                const isChild = item.type === 'batch_child';

                let rowBg = 'hover:bg-gray-50';
                if (invoice.status === 'flagged') rowBg = 'bg-amber-50/40 hover:bg-amber-50';
                else if (invoice.status === 'approved') rowBg = 'bg-green-50/40 hover:bg-green-50';
                else if (invoice.status === 'disputed') rowBg = 'bg-red-50/40 hover:bg-red-50';

                return (
                  <tr 
                    key={invoice.id} 
                    onClick={() => handleRowClick(invoice.id)}
                    className={`group text-sm text-gray-900 cursor-pointer transition-colors ${rowBg} ${
                      isChild 
                        ? 'border-l-2 border-indigo-300 bg-indigo-50/20' 
                        : ''
                    }`}
                  >
                    <td className={`py-3 px-4 font-mono font-medium text-indigo-600 hover:underline ${isChild ? 'pl-10' : ''}`}>
                      <div className="flex items-center gap-2">
                        {isChild && (
                          <span className="text-indigo-400 shrink-0 select-none">↳</span>
                        )}
                        <span>{invoice.invoice_number}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-gray-900">
                      {invoice.carrier_name}
                    </td>

                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                      {invoice.uploaded_at ? new Date(invoice.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </td>

                    <td className="py-3 px-4 text-gray-400 text-xs font-mono max-w-[140px] truncate">
                      {isChild ? (
                        <span className="text-indigo-500 font-semibold">Batch Sub-PDF</span>
                      ) : (
                        invoice.source || 'Single Upload'
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-gray-900">
                      {invoice.total_billed.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {invoice.total_savings > 0 ? (
                        <span className="text-red-500 font-semibold">
                          {invoice.total_savings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(invoice.id)}
                        className="inline-flex items-center gap-1 py-1 px-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-medium transition-all cursor-pointer"
                      >
                        <Eye size={11} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div 
          className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4"
          id="table-pagination-nav"
        >
          <span className="text-xs font-mono text-gray-500">
            Showing <strong className="text-gray-900 font-semibold">{startOffset}</strong> to{' '}
            <strong className="text-gray-900 font-semibold">{endOffset}</strong> of{' '}
            <strong className="text-gray-900 font-semibold">{totalItems}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={displayPage === 1}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              id="pagination-prev"
            >
              Prev
            </button>
            <span className="text-xs font-semibold px-2 text-gray-500 font-mono">
              Page {displayPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={displayPage === totalPages}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              id="pagination-next"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
