"use client";

import React, { useState, useEffect } from 'react';
import { Search, Calendar, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { InvoiceStatus } from '@/types';

interface FilterBarProps {
  initialSearch?: string;
  initialStatus?: string;
  initialFromDate?: string;
  initialToDate?: string;
  onFilterChange: (filters: {
    search: string;
    status: string;
    fromDate: string;
    toDate: string;
  }) => void;
}

export default function FilterBar({
  initialSearch = '',
  initialStatus = 'all',
  initialFromDate = '',
  initialToDate = '',
  onFilterChange
}: FilterBarProps) {
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);

  // Debounce search change by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search, status, fromDate, toDate });
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle immediate changes for other filters
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    onFilterChange({ search, status: newStatus, fromDate, toDate });
  };

  const handleFromDateChange = (newFromDate: string) => {
    setFromDate(newFromDate);
    onFilterChange({ search, status, fromDate: newFromDate, toDate });
  };

  const handleToDateChange = (newToDate: string) => {
    setToDate(newToDate);
    onFilterChange({ search, status, fromDate, toDate: newToDate });
  };

  const handleReset = () => {
    setSearch('');
    setStatus('all');
    setFromDate('');
    setToDate('');
    onFilterChange({ search: '', status: 'all', fromDate: '', toDate: '' });
  };

  return (
    <div 
      className="bg-[#111827] border border-teal-900/20 rounded-xl p-4 md:p-5 space-y-4"
      id="invoices-filter-bar"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <SlidersHorizontal size={14} className="text-[#2DD4BF]" />
        <span className="text-[10px] font-bold font-mono text-[#2DD4BF] uppercase tracking-widest">
          Audit Ledger Filters
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search Input - 4 cols */}
        <div className="md:col-span-4 relative">
          <label className="block text-[10px] font-bold font-mono text-[#94A3B8] uppercase tracking-wider mb-1.5">
            Search Invoices
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#475569]" />
            <input
              type="text"
              placeholder="Search ID, carrier code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg text-xs font-medium placeholder-[#475569] focus:outline-none focus:border-[#2DD4BF] transition-all"
              id="filter-search-input"
            />
          </div>
        </div>

        {/* Status Dropdown - 3 cols */}
        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold font-mono text-[#94A3B8] uppercase tracking-wider mb-1.5">
            Audit Status
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#2DD4BF] transition-all"
            id="filter-status-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="auditing">Auditing</option>
            <option value="flagged">Flagged</option>
            <option value="approved">Approved</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>

        {/* Date Ranges - 4 cols */}
        <div className="md:col-span-4 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold font-mono text-[#94A3B8] uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg text-xs font-mono focus:outline-none focus:border-[#2DD4BF] transition-all"
                id="filter-from-date"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold font-mono text-[#94A3B8] uppercase tracking-wider mb-1.5">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg text-xs font-mono focus:outline-none focus:border-[#2DD4BF] transition-all"
                id="filter-to-date"
              />
            </div>
          </div>
        </div>

        {/* Reset Trigger - 1 col */}
        <div className="md:col-span-1 flex items-end justify-end">
          <button
            onClick={handleReset}
            className="w-full md:w-auto p-2.5 bg-[#1C2537] hover:bg-[#2DD4BF] border border-[#1F2D45] text-[#94A3B8] hover:text-black rounded-lg transition-all flex items-center justify-center gap-1 text-xs font-bold cursor-pointer font-mono uppercase shrink-0"
            title="Reset Filters"
            id="filter-reset-action"
          >
            <RotateCcw size={14} />
            <span className="md:hidden">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
