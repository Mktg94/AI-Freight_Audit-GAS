"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, CloudLightning, ShieldCheck, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Invoice } from '@/types';
import { initialInvoices } from '@/src/fakeData';
import FilterBar from '@/components/invoices/FilterBar';
import DataTable from '@/components/invoices/DataTable';
import EmptyState from '@/components/invoices/EmptyState';
import UsageLimitBanner from '@/components/shared/UsageLimitBanner';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealSupabase, setIsRealSupabase] = useState(false);

  // Filter States synced with URL
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Batch Filter tab state
  const [batchFilter, setBatchFilter] = useState<'all' | 'single' | 'batch'>('all');

  const fetchInvoices = async () => {
    setLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const hasSupabaseKeys = supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder');

    if (hasSupabaseKeys) {
      try {
        setIsRealSupabase(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .order('uploaded_at', { ascending: false });

        if (!error && data) {
          setInvoices(data);
        } else {
          console.warn("Supabase load error, running fallback:", error);
          loadFallbackData();
        }
      } catch (err) {
        console.error("Supabase connection failed, using offline fallback:", err);
        loadFallbackData();
      } finally {
        setLoading(false);
      }
    } else {
      loadFallbackData();
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    // Falls back to Express CRM cache endpoints OR global window mock invoices list
    if (typeof (window as any).memoryInvoicesStore !== 'undefined') {
      setInvoices((window as any).memoryInvoicesStore);
    } else {
      setInvoices(initialInvoices);
    }
  };

  // Sync state from query parameters on component load and whenever URL pops/updates
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
        setSearch(batchParam); // filter by batchId
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

    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
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
      
      // Update local state for reactive display immediately
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

  // Compute filtered dataset
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const query = search.trim().toLowerCase();
      
      // Match query inside invoice number, carrier, OR batch ID
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
      
      {/* Usage Limit Banner (Part 8) at Top of page */}
      <UsageLimitBanner />

      {/* PageHeader section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white font-display tracking-tight uppercase">
              Invoices
            </h1>
            {isRealSupabase ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                <ShieldCheck size={11} /> Live Secure Database
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#2DD4BF] bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-mono">
                <CloudLightning size={11} /> Sandbox Memory
              </span>
            )}
          </div>
          <p className="text-xs text-[#94A3B8]" id="invoice-total-count-subtitle">
            Showing {filteredInvoices.length} of {invoices.length} total freight bills ledgered for compliance.
          </p>
        </div>

        <button
          onClick={handleNavigateToUpload}
          className="py-2.5 px-4 bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_rgba(45,212,191,0.45)] flex items-center gap-2 cursor-pointer font-mono"
          id="invoice-header-upload-btn"
        >
          <Upload size={14} />
          <span>Upload & Audit</span>
        </button>
      </div>

      {/* Filter Options toolbar */}
      <FilterBar
        initialSearch={search}
        initialStatus={status}
        initialFromDate={fromDate}
        initialToDate={toDate}
        onFilterChange={handleFilterChange}
      />

      {/* All | Single | Batch filter tabs (Part 7) */}
      <div className="flex border-b border-[#1F2D45] w-full gap-5 font-mono text-[10px] tracking-widest font-black uppercase pb-0">
        <button 
          onClick={() => setBatchFilter('all')}
          className={`pb-3 px-1.5 transition-all outline-none cursor-pointer ${batchFilter === 'all' ? 'text-[#2DD4BF] border-b-2 border-[#2DD4BF]' : 'text-slate-500 hover:text-slate-300'}`}
        >
          All Uploads
        </button>
        <button 
          onClick={() => setBatchFilter('single')}
          className={`pb-3 px-1.5 transition-all outline-none cursor-pointer ${batchFilter === 'single' ? 'text-[#2DD4BF] border-b-2 border-[#2DD4BF]' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Single Files
        </button>
        <button 
          onClick={() => setBatchFilter('batch')}
          className={`pb-3 px-1.5 transition-all outline-none cursor-pointer ${batchFilter === 'batch' ? 'text-[#2DD4BF] border-b-2 border-[#2DD4BF]' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Batch Packs
        </button>
      </div>

      {/* Data visualizer */}
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
