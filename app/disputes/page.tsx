import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, Mail, Edit3, 
  CheckCircle2, XCircle, Eye, FileText
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Dispute } from '@/types';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<(Dispute & { invoice_number?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'resolved' | 'rejected'>('all');

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data: disputesData, error: dErr } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (dErr) throw dErr;

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('id, invoice_number');

      const invoiceMap = new Map();
      if (invoicesData) {
        invoicesData.forEach((inv) => invoiceMap.set(inv.id, inv.invoice_number));
      }

      const enriched = (disputesData || []).map((disp) => ({
        ...disp,
        invoice_number: invoiceMap.get(disp.invoice_id) || 'N/A'
      }));

      setDisputes(enriched);
    } catch (err) {
      console.warn("Supabase load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchDisputes();
    };
    const handleFocus = () => fetchDisputes();
    const handleCustom = () => fetchDisputes();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('invoices-updated', handleCustom);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('invoices-updated', handleCustom);
    };
  }, []);

  const stats = useMemo(() => {
    const draft = disputes.filter(d => d.status === 'draft');
    const sent = disputes.filter(d => d.status === 'sent');
    const resolved = disputes.filter(d => d.status === 'resolved');

    return {
      draftCount: draft.length,
      draftSum: draft.reduce((acc, curr) => acc + curr.total_disputed_amount, 0),
      sentCount: sent.length,
      sentSum: sent.reduce((acc, curr) => acc + curr.total_disputed_amount, 0),
      resolvedCount: resolved.length,
      resolvedSum: resolved.reduce((acc, curr) => acc + (curr.resolution_amount || 0), 0),
      totalDisputedAmt: disputes.reduce((acc, curr) => acc + curr.total_disputed_amount, 0)
    };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    if (activeTab === 'all') return disputes;
    return disputes.filter(d => d.status === activeTab);
  }, [disputes, activeTab]);

  const handleNavigateToDisputeDetail = (disputeId: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/disputes/${disputeId}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleNavigateToInvoices = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/invoices');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatMoney = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const renderDisputeStatusBadge = (status: Dispute['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-600 border-gray-200">
            <Edit3 size={10} />
            <span>Draft</span>
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
            <Mail size={10} />
            <span>Sent</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 size={10} />
            <span>Resolved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-600 border-red-200">
            <XCircle size={10} />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="disputes-page-workspace">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Disputes
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Manage and track carrier billing disputes.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3" id="dispute-total-sum-label">
          <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide block mb-0.5">Total Disputed</span>
          <p className="text-xl font-bold font-mono text-red-500 leading-none">
            {formatMoney(stats.totalDisputedAmt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="dispute-stats-dashboard-row">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Draft Claims</span>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold font-mono text-gray-900">{stats.draftCount}</p>
            <p className="text-sm font-mono text-gray-500">{formatMoney(stats.draftSum)}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Sent Claims</span>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold font-mono text-blue-600">{stats.sentCount}</p>
            <p className="text-sm font-mono text-gray-500">{formatMoney(stats.sentSum)}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Resolved</span>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold font-mono text-green-600">{stats.resolvedCount}</p>
            <p className="text-sm font-mono text-green-600 font-semibold">{formatMoney(stats.resolvedSum)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-5 font-mono text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
        {(['all', 'draft', 'sent', 'resolved', 'rejected'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 transition-all outline-none cursor-pointer ${
                isActive 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              id={`tab-filter-${tab}`}
            >
              {tab === 'all' ? 'All' : `${tab}s`}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4" id="disputes-table-loader">
          <div className="h-8 w-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-xs uppercase font-mono tracking-widest text-indigo-600">Loading...</span>
        </div>
      ) : disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 max-w-lg mx-auto" id="disputes-total-empty">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-900">No disputes yet</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Disputes are generated from audit reviews with carrier rate-sheet discrepancies.
            </p>
          </div>
          <button
            onClick={handleNavigateToInvoices}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <FileText size={14} />
            <span>Audit Invoices</span>
          </button>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400 border border-gray-100 rounded-2xl bg-white">
          No disputes found matching status '{activeTab}'.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm" id="disputes-datatable-deck">
          <div className="min-w-full overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] uppercase font-semibold tracking-widest font-mono">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Carrier</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Sent</th>
                  <th className="py-3 px-4 text-right">Resolved</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredDisputes.map((disp, index) => (
                  <tr 
                    key={disp.id}
                    onClick={() => handleNavigateToDisputeDetail(disp.id)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                      {disp.invoice_number || 'N/A'}
                    </td>

                    <td className="py-3 px-4 font-medium text-gray-900 uppercase truncate max-w-[150px]">
                      {disp.carrier_name}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-red-500">
                      {formatMoney(disp.total_disputed_amount)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {renderDisputeStatusBadge(disp.status)}
                    </td>

                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                      {formatDate(disp.created_at)}
                    </td>

                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                      {formatDate(disp.sent_at)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-green-600 font-semibold">
                      {formatMoney(disp.resolution_amount)}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleNavigateToDisputeDetail(disp.id)}
                        className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye size={11} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
