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
  // Batch filtering option: 'all' | 'single' | 'batch'
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
  const itemsPerPage = 35; // Larger page size to accommodate grouped batches and child list nodes

  // Sort and filter data
  const filteredAndSortedData = useMemo(() => {
    let list = [...data];

    // Apply batchFilter logic
    if (batchFilter === 'single') {
      list = list.filter(inv => !inv.batch_id && (!inv.source || !inv.source.startsWith('Batch —')));
    } else if (batchFilter === 'batch') {
      list = list.filter(inv => !!inv.batch_id || (inv.source && inv.source.startsWith('Batch —')));
    }

    // Sort original
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

  // Expand / collapse helper
  const toggleBatch = (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBatches(prev => ({
      ...prev,
      [batchId]: prev[batchId] === false ? true : false // default is expanded (true)
    }));
  };

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Group invoices structure
  // Formats rows list to either simple elements or batches!
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
        // Standard single invoice
        items.push({ type: 'single', invoice });
      } else {
        // Batch item
        if (processedBatchIds.has(bId)) return; // already compiled
        processedBatchIds.add(bId);

        // Fetch all elements inside this batch
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

  // Pagination bounds
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
      return <ArrowUpDown size={12} className="text-zinc-600 group-hover:text-zinc-400 transition-all ml-1.5" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp size={12} className="text-[#2DD4BF] ml-1.5 font-bold" />
      : <ChevronDown size={12} className="text-[#2DD4BF] ml-1.5 font-bold" />;
  };

  return (
    <div className="bg-[#111827] border border-teal-900/40 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between" id="invoices-data-table-deck">
      <div className="min-w-full overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="border-b border-[#1F2D45] bg-[#0A0F1E]/80 text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider font-mono">
              <th 
                className="py-4 px-6 cursor-pointer group hover:text-white transition-all select-none"
                onClick={() => handleSort('invoice_number')}
              >
                <div className="flex items-center font-bold">
                  <span>Invoice #</span>
                  {renderSortIndicator('invoice_number')}
                </div>
              </th>
              
              <th 
                className="py-4 px-3 cursor-pointer group hover:text-white transition-all select-none"
                onClick={() => handleSort('carrier_name')}
              >
                <div className="flex items-center font-bold">
                  <span>Carrier Name</span>
                  {renderSortIndicator('carrier_name')}
                </div>
              </th>

              <th 
                className="py-4 px-3 cursor-pointer group hover:text-white transition-all select-none"
                onClick={() => handleSort('uploaded_at')}
              >
                <div className="flex items-center font-bold">
                  <span>Upload Date</span>
                  {renderSortIndicator('uploaded_at')}
                </div>
              </th>

              <th className="py-4 px-3 text-[#94A3B8] font-bold">
                Source Document
              </th>

              <th 
                className="py-4 px-3 cursor-pointer group hover:text-white transition-all select-none text-right"
                onClick={() => handleSort('total_billed')}
              >
                <div className="flex items-center justify-end font-bold">
                  <span>Total Billed</span>
                  {renderSortIndicator('total_billed')}
                </div>
              </th>

              <th 
                className="py-4 px-3 cursor-pointer group hover:text-white transition-all select-none text-right"
                onClick={() => handleSort('total_savings')}
              >
                <div className="flex items-center justify-end font-bold font-mono">
                  <span>Discrepancy</span>
                  {renderSortIndicator('total_savings')}
                </div>
              </th>

              <th 
                className="py-4 px-3 cursor-pointer group hover:text-white transition-all select-none text-center"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center font-bold">
                  <span>Status</span>
                  {renderSortIndicator('status')}
                </div>
              </th>

              <th className="py-4 px-6 text-right font-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2D45]/30">
            {loading ? (
              [1, 2, 3, 4, 5].map((idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-6"><div className="h-4 bg-[#1C2537] rounded w-24"></div></td>
                  <td className="py-4 px-3"><div className="h-4 bg-[#1C2537] rounded w-28"></div></td>
                  <td className="py-4 px-3"><div className="h-4 bg-[#1C2537] rounded w-20"></div></td>
                  <td className="py-4 px-3"><div className="h-4 bg-[#1C2537] rounded w-28"></div></td>
                  <td className="py-4 px-3 text-right"><div className="h-4 bg-[#1C2537] rounded w-16 ml-auto"></div></td>
                  <td className="py-4 px-3 text-right"><div className="h-4 bg-[#1C2537] rounded w-16 ml-auto"></div></td>
                  <td className="py-4 px-3 text-center"><div className="h-5 bg-[#1C2537] rounded-full w-20 mx-auto"></div></td>
                  <td className="py-4 px-6 text-right"><div className="h-7 bg-[#1C2537] rounded w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-[#94A3B8] font-mono leading-normal">
                  No freight audit sheets found matching filter options.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, index) => {
                // RENDER 1: Batch header row
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
                      className="group bg-[#152033] hover:bg-[#1C2D47] text-white text-xs cursor-pointer transition-colors border-b border-[#1F2D45] select-none font-sans"
                    >
                      <td colSpan={4} className="py-4 px-6 font-semibold">
                        <div className="flex items-center gap-3">
                          <span className="p-1 rounded bg-teal-500/10 text-[#2DD4BF] hover:scale-105 transition-all">
                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          </span>
                          <Folder size={14} className="text-teal-400 shrink-0" />
                          <span className="font-extrabold tracking-tight font-display text-xs text-white uppercase group-hover:text-teal-300">
                            {item.batchFilename}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[9px] text-[#94A3B8] font-mono uppercase font-black tracking-wide border border-slate-700/60 shrink-0">
                            {totalCount} Invoices
                          </span>
                        </div>
                      </td>

                      {/* Aggregate totals columns for batch rows */}
                      <td className="py-4 px-3 text-right font-mono font-extrabold text-[#2DD4BF]">
                        {totalBilledVal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                      <td className="py-4 px-3 text-right font-mono font-extrabold text-[#EF4444]">
                        {totalSavingsVal > 0 ? totalSavingsVal.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold font-mono uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          Batch Package
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                          {isCollapsed ? 'Expand Bulk' : 'Collapse Bulk'}
                        </span>
                      </td>
                    </tr>
                  );
                }

                // If this is a child invoice under a collapsed batch header row, do not render it!
                if (item.type === 'batch_child' && item.batchId && expandedBatches[item.batchId] === false) {
                  return null;
                }

                // RENDER 2: Single invoice row OR Child invoice row
                const invoice = item.invoice!;
                const isChild = item.type === 'batch_child';

                return (
                  <tr 
                    key={invoice.id} 
                    onClick={() => handleRowClick(invoice.id)}
                    className={`group text-xs text-[#F1F5F9] cursor-pointer transition-colors hover:bg-[#1C2537] ${
                      isChild 
                        ? 'bg-[#0E1524]/60 border-l-2 border-teal-500/40' 
                        : (index % 2 === 1 ? 'bg-[#0f1624]' : 'bg-transparent')
                    }`}
                  >
                    {/* Invoice ID/Number column */}
                    <td className={`py-4 px-6 font-mono font-bold text-white group-hover:text-[#2DD4BF] transition-all duration-300 ${isChild ? 'pl-11' : ''}`}>
                      <div className="flex items-center gap-2">
                        {isChild && (
                          <span className="text-teal-500 shrink-0 select-none">↳</span>
                        )}
                        <span>{invoice.invoice_number}</span>
                      </div>
                    </td>

                    {/* Carrier name */}
                    <td className="py-4 px-3 font-semibold text-zinc-300">
                      {invoice.carrier_name}
                    </td>

                    {/* Upload date */}
                    <td className="py-4 px-3 text-[#94A3B8] font-mono text-[11px]">
                      {invoice.uploaded_at ? new Date(invoice.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </td>

                    {/* Source file name column */}
                    <td className="py-4 px-3 text-[#94A3B8] text-[10px] font-mono max-w-[140px] truncate leading-normal italic">
                      {isChild ? (
                        <span className="text-teal-400 font-extrabold capitalize">Batch Sub-PDF</span>
                      ) : (
                        invoice.source || 'Single Upload'
                      )}
                    </td>

                    {/* Total billed price */}
                    <td className="py-4 px-3 text-right font-mono font-bold text-white">
                      {invoice.total_billed.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </td>

                    {/* Discrepancy savings */}
                    <td className="py-4 px-3 text-right font-mono">
                      {invoice.total_savings > 0 ? (
                        <span className="text-[#EF4444] font-black">
                          {invoice.total_savings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                      ) : (
                        <span className="text-[#475569] font-medium">-</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-3 text-center">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>

                    {/* Detail panel triggers */}
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(invoice.id)}
                        className="inline-flex items-center gap-1.5 py-1 px-3 bg-[#1C2537] hover:bg-[#2DD4BF] hover:text-black border border-[#1F2D45] text-[#2DD4BF] rounded-lg text-[10px] uppercase font-bold font-mono tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                        id={`view-action-${invoice.id}`}
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

      {/* Pagination control bar */}
      {totalPages > 1 && (
        <div 
          className="border-t border-[#1F2D45] bg-[#0A0F1E]/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4"
          id="table-pagination-nav"
        >
          <span className="text-[11px] font-mono text-[#94A3B8]">
            Showing <strong className="text-white font-semibold">{startOffset}</strong> to{' '}
            <strong className="text-white font-semibold">{endOffset}</strong> of{' '}
            <strong className="text-white font-semibold">{totalItems}</strong> lines
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={displayPage === 1}
              className="px-4 py-1.5 bg-[#1C2537] hover:bg-[#2DD4BF] hover:text-black hover:border-transparent text-zinc-300 border border-[#1F2D45] rounded-lg text-xs font-mono font-bold tracking-wide uppercase disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              id="pagination-prev"
            >
              Prev
            </button>
            <span className="text-xs font-semibold px-2 text-[#2DD4BF] font-mono">
              Page {displayPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={displayPage === totalPages}
              className="px-4 py-1.5 bg-[#1C2537] hover:bg-[#2DD4BF] hover:text-black hover:border-transparent text-zinc-300 border border-[#1F2D45] rounded-lg text-xs font-mono font-bold tracking-wide uppercase disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
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
