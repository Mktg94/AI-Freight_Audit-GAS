"use client";

import React, { useState, useEffect } from 'react';
import { Search, RotateCcw } from 'lucide-react';

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

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search, status, fromDate, toDate });
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

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
      className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4"
      id="invoices-filter-bar"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 relative">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID, carrier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all"
              id="filter-search-input"
            />
          </div>
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all"
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

        <div className="md:col-span-4 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all"
              id="filter-from-date"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => handleToDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all"
              id="filter-to-date"
            />
          </div>
        </div>

        <div className="md:col-span-1 flex items-end justify-end">
          <button
            onClick={handleReset}
            className="w-full md:w-auto p-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-700 rounded-xl transition-all flex items-center justify-center gap-1 text-sm font-medium cursor-pointer"
            title="Reset Filters"
            id="filter-reset-action"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
