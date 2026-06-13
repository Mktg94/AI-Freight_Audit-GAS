import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Invoice } from '@/types';
import FilterBar from '@/components/invoices/FilterBar';
import DataTable from '@/components/invoices/DataTable';
import EmptyState from '@/components/invoices/EmptyState';
import UsageLimitBanner from '@/components/shared/UsageLimitBanner';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [batchFilter, setBatchFilter] = useState<'all' | 'single' | 'batch'>('all');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error("Invoices query error:", error);
      }
      if (data) {
        console.log(`InvoicesPage: loaded ${data.length} invoices`);
        setInvoices(data);
      }
    } catch (err) {
      console.error("Supabase connection failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncParamsFromURL = () => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setSearch(searchParams.get('search') || '');
      setStatus(searchParams.get('status') || 'all');
      setFromDate(searchParams.get('fromDate') || '');
      setToDate(searchParams.get('toDate') || '');

      const batchParam = searchParams.get('batch');
      if (batchParam) {
        setBatchFilter('batch');
        setSearch(batchParam);
      }
    }
  };

  useEffect(() => {
    fetchInvoices();
    syncParamsFromURL();

    const handlePopstate = () => {
      syncParamsFromURL();
      fetchInvoices();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchInvoices();
      }
    };

    const handleFocus = () => {
      fetchInvoices();
    };

    const handleCustom = () => fetchInvoices();
    window.addEventListener('popstate', handlePopstate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('invoices-updated', handleCustom);

    return () => {
      window.removeEventListener('popstate', handlePopstate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('invoices-updated', handleCustom);
    };
  }, []);

  const handleFilterChange = (newFilters: {
    search: string;
    status: string;
    fromDate: string;
    toDate: string;
  }) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.status && newFilters.status !== 'all') params.set('status', newFilters.status);
      if (newFilters.fromDate) params.set('fromDate', newFilters.fromDate);
      if (newFilters.toDate) params.set('toDate', newFilters.toDate);

      const newRelativePathQuery = window.location.pathname + '?' + params.toString();
      window.history.pushState({}, '', newRelativePathQuery);
      
      setSearch(newFilters.search);
      setStatus(newFilters.status);
      setFromDate(newFilters.fromDate);
      setToDate(newFilters.toDate);
    }
  };

  const handleNavigateToUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/invoices/upload');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const query = search.trim().toLowerCase();
      
      const matchSearch = !query || 
        inv.invoice_number.toLowerCase().includes(query) || 
        inv.carrier_name.toLowerCase().includes(query) ||
        (inv.batch_id && inv.batch_id.toLowerCase().includes(query));

      const matchStatus = status === 'all' || inv.status === status;

      let matchDates = true;
      if (fromDate) {
        matchDates = matchDates && inv.invoice_date >= fromDate;
      }
      if (toDate) {
        matchDates = matchDates && inv.invoice_date <= toDate;
      }

      return matchSearch && matchStatus && matchDates;
    });
  }, [invoices, search, status, fromDate, toDate]);

  return (
    <div className="space-y-6 animate-fade-in" id="invoices-page-root">
      
      <UsageLimitBanner />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Invoices
            </h1>
          </div>
          <p className="text-sm text-gray-500" id="invoice-total-count-subtitle">
            Showing {filteredInvoices.length} of {invoices.length} total freight bills.
          </p>
        </div>

        <button
          onClick={handleNavigateToUpload}
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors duration-150 inline-flex items-center gap-2 cursor-pointer"
          id="invoice-header-upload-btn"
        >
          <Upload size={14} />
          <span>Upload & Audit</span>
        </button>
      </div>

      <FilterBar
        initialSearch={search}
        initialStatus={status}
        initialFromDate={fromDate}
        initialToDate={toDate}
        onFilterChange={handleFilterChange}
      />

      <div className="flex gap-5 font-mono text-xs font-semibold uppercase tracking-wider pb-0 border-b border-gray-100">
        <button 
          onClick={() => setBatchFilter('all')}
          className={`pb-3 px-1 transition-all outline-none cursor-pointer ${batchFilter === 'all' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          All Uploads
        </button>
        <button 
          onClick={() => setBatchFilter('single')}
          className={`pb-3 px-1 transition-all outline-none cursor-pointer ${batchFilter === 'single' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Single Files
        </button>
        <button 
          onClick={() => setBatchFilter('batch')}
          className={`pb-3 px-1 transition-all outline-none cursor-pointer ${batchFilter === 'batch' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Batch Packs
        </button>
      </div>

      {loading ? (
        <DataTable data={[]} loading={true} />
      ) : invoices.length === 0 ? (
        <EmptyState />
      ) : (
        <DataTable 
          data={filteredInvoices} 
          batchFilter={batchFilter} 
        />
      )}

    </div>
  );
}
