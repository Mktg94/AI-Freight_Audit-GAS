import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, DollarSign, TrendingUp, 
  Percent, Eye, ShieldAlert, CheckCircle2,
  Edit3, Mail, XCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Invoice, Dispute, LineItem } from '@/types';
import StatCard from '@/components/dashboard/StatCard';
import SavingsAreaChart from '@/components/dashboard/SavingsAreaChart';
import CarrierDiscrepancyChart from '@/components/dashboard/CarrierDiscrepancyChart';
import ErrorTypeChart from '@/components/dashboard/ErrorTypeChart';

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const [rangeType, setRangeType] = useState<'30' | '90' | '12m' | 'custom'>('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const dateLimits = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (rangeType === '30') {
      const d = new Date(today.getTime());
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString().split('T')[0], to: todayStr };
    } else if (rangeType === '90') {
      const d = new Date(today.getTime());
      d.setDate(d.getDate() - 90);
      return { from: d.toISOString().split('T')[0], to: todayStr };
    } else if (rangeType === '12m') {
      const d = new Date(today.getTime());
      d.setDate(d.getDate() - 365);
      return { from: d.toISOString().split('T')[0], to: todayStr };
    } else {
      return {
        from: customFrom || "2026-01-01",
        to: customTo || todayStr
      };
    }
  }, [rangeType, customFrom, customTo]);

  const fetchDataset = async () => {
    setLoading(true);
    const { from: fromDate, to: toDate } = dateLimits;

    try {
      const supabase = createClient();

      const { data: invData, error: invErr } = await supabase
        .from('invoices')
        .select('*')
        .gte('invoice_date', fromDate)
        .lte('invoice_date', toDate)
        .order('invoice_date', { ascending: true });

      if (invErr) throw invErr;

      const { data: liData, error: liErr } = await supabase
        .from('line_items')
        .select('*');

      if (liErr) throw liErr;

      const { data: dispData, error: dispErr } = await supabase
        .from('disputes')
        .select('*')
        .gte('created_at', `${fromDate}T00:00:00.000Z`)
        .lte('created_at', `${toDate}T23:59:59.999Z`)
        .order('created_at', { ascending: false });

      if (dispErr) throw dispErr;

      setInvoices(invData || []);
      setLineItems(liData || []);
      setDisputes(dispData || []);
    } catch (err) {
      console.warn("Supabase fetch error in reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncParamsFromURL = () => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const r = searchParams.get('range') || '30';
      if (['30', '90', '12m', 'custom'].includes(r)) {
        setRangeType(r as any);
      }
      setCustomFrom(searchParams.get('fromDate') || '');
      setCustomTo(searchParams.get('toDate') || '');
    }
  };

  useEffect(() => {
    syncParamsFromURL();
    
    const handlePopstate = () => {
      syncParamsFromURL();
    };

    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      params.set('range', rangeType);
      if (rangeType === 'custom') {
        if (customFrom) params.set('fromDate', customFrom);
        if (customTo) params.set('toDate', customTo);
      }
      
      const newQuery = window.location.pathname + '?' + params.toString();
      window.history.pushState({}, '', newQuery);
    }
    fetchDataset();
  }, [rangeType, customFrom, customTo]);

  const handleRangeChoose = (type: '30' | '90' | '12m' | 'custom') => {
    setRangeType(type);
  };

  const metrics = useMemo(() => {
    const audited = invoices.filter(i => i.status !== 'pending' && i.status !== 'auditing');
    const auditedCount = audited.length;

    const invoiceIds = new Set(invoices.map(i => i.id));
    const activeLineItems = lineItems.filter(li => invoiceIds.has(li.invoice_id));
    
    let overcharges = activeLineItems
      .filter(li => li.discrepancy > 0)
      .reduce((sum, li) => sum + li.discrepancy, 0);

    if (overcharges === 0) {
      overcharges = invoices.reduce((sum, i) => sum + (i.total_savings || 0), 0);
    }

    const totalSavings = invoices.reduce((sum, i) => sum + (i.total_savings || 0), 0);

    const errorRateInvoices = audited.filter(i => i.total_billed > 0);
    let avgErrorRate = 0;
    if (errorRateInvoices.length > 0) {
      const sumOfRates = errorRateInvoices.reduce((sum, i) => {
        const errorPct = ((i.total_savings || 0) / i.total_billed) * 100;
        return sum + errorPct;
      }, 0);
      avgErrorRate = sumOfRates / errorRateInvoices.length;
    }

    return {
      auditedCount,
      overcharges,
      totalSavings,
      avgErrorRate
    };
  }, [invoices, lineItems]);

  const monthlyTimelineData = useMemo(() => {
    const { from: fromDate, to: toDate } = dateLimits;
    
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const buckets: { monthKey: string; month: string; billed: number; approved: number }[] = [];
    
    const curr = new Date(start.getFullYear(), start.getMonth(), 1);
    const stop = new Date(end.getFullYear(), end.getMonth(), 1);
    
    let safetyCounter = 0;
    while (curr <= stop && safetyCounter < 24) {
      const year = curr.getFullYear();
      const monthIdx = curr.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const label = `${monthNames[monthIdx]} ${String(year).slice(-2)}`;
      
      buckets.push({
        monthKey: key,
        month: label,
        billed: 0,
        approved: 0
      });
      curr.setMonth(curr.getMonth() + 1);
      safetyCounter++;
    }

    buckets.forEach(b => {
      const matchInvs = invoices.filter(inv => inv.invoice_date.startsWith(b.monthKey));
      matchInvs.forEach(inv => {
        b.billed += inv.total_billed || 0;
        const appVal = (inv.status === 'pending' || inv.status === 'auditing') 
          ? inv.total_billed 
          : (inv.total_approved || 0);
        b.approved += appVal;
      });
    });

    if (buckets.length === 0 || buckets.reduce((acc, c) => acc + c.billed, 0) === 0) {
      return [];
    }

    return buckets;
  }, [invoices, dateLimits]);

  const carrierChartData = useMemo(() => {
    const carrierGroups: Record<string, { carrier: string; discrepancy: number; disputed: number }> = {};
    
    invoices.forEach(inv => {
      const c = inv.carrier_name;
      if (!carrierGroups[c]) {
        carrierGroups[c] = { carrier: c, discrepancy: 0, disputed: 0 };
      }
      carrierGroups[c].discrepancy += inv.total_savings || 0;
      if (inv.status === 'disputed') {
        carrierGroups[c].disputed += 1;
      }
    });

    return Object.values(carrierGroups)
      .sort((a, b) => b.discrepancy - a.discrepancy)
      .slice(0, 6)
      .map(cg => ({
        carrier: cg.carrier,
        discrepancy: cg.discrepancy,
        disputedInvoiceCount: cg.disputed
      }));
  }, [invoices]);

  const errorTypeBreakdown = useMemo(() => {
    const invoiceIds = new Set(invoices.map(i => i.id));
    const activeLineItems = lineItems.filter(li => invoiceIds.has(li.invoice_id));

    let fuelTotal = 0;
    let weightTotal = 0;
    let accessorialTotal = 0;
    let otherTotal = 0;

    activeLineItems.forEach(li => {
      if (li.discrepancy > 0) {
        const desc = li.description.toLowerCase();
        if (desc.includes('fuel')) {
          fuelTotal += li.discrepancy;
        } else if (desc.includes('weight') || desc.includes('lb')) {
          weightTotal += li.discrepancy;
        } else if (
          desc.includes('liftgate') || 
          desc.includes('detention') || 
          desc.includes('residential') || 
          desc.includes('accessory') || 
          desc.includes('inside delivery') || 
          desc.includes('redelivery') || 
          desc.includes('handling') || 
          desc.includes('weekend')
        ) {
          accessorialTotal += li.discrepancy;
        } else {
          otherTotal += li.discrepancy;
        }
      }
    });

    const currentOverchargesSum = fuelTotal + weightTotal + accessorialTotal + otherTotal;
    if (currentOverchargesSum === 0) {
      const totalSavingsSum = invoices.reduce((sum, i) => sum + (i.total_savings || 0), 0);
    }

    return [
      { name: "Fuel Surcharge errors", value: fuelTotal },
      { name: "Weight errors", value: weightTotal },
      { name: "Accessorial errors", value: accessorialTotal },
      { name: "Other", value: otherTotal }
    ];
  }, [invoices, lineItems]);

  const recentDisputes = useMemo(() => {
    return disputes.slice().slice(0, 10);
  }, [disputes]);

  const handleNavigateToDisputeDetail = (disputeId: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/disputes/${disputeId}`);
      window.dispatchEvent(new Event('popstate'));
    }
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
            <span>Sent Claim</span>
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatMoney = (val?: number) => {
    if (val === undefined || val === null) return '$0.00';
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="reports-analytics-view-root">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Audit Intelligence Reports
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Explore organization-wide shipping metrics, overcharge histories, carrier rate sheets comparison, and recoveries statistics.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4" id="date-range-filter-row">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold font-mono text-gray-500 uppercase tracking-wider mr-2">Audit Filter Scope:</span>
          <button
            onClick={() => handleRangeChoose('30')}
            className={`py-1.5 px-4 font-mono text-xs uppercase font-semibold rounded-lg border tracking-wide transition-all cursor-pointer ${
              rangeType === '30'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-transparent border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => handleRangeChoose('90')}
            className={`py-1.5 px-4 font-mono text-xs uppercase font-semibold rounded-lg border tracking-wide transition-all cursor-pointer ${
              rangeType === '90'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-transparent border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => handleRangeChoose('12m')}
            className={`py-1.5 px-4 font-mono text-xs uppercase font-semibold rounded-lg border tracking-wide transition-all cursor-pointer ${
              rangeType === '12m'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-transparent border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
          >
            12 Months
          </button>
          <button
            onClick={() => handleRangeChoose('custom')}
            className={`py-1.5 px-4 font-mono text-xs uppercase font-semibold rounded-lg border tracking-wide transition-all cursor-pointer ${
              rangeType === 'custom'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-transparent border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
          >
            Custom Range
          </button>
        </div>

        {rangeType === 'custom' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in shrink-0" id="custom-dates-pickers-box">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold font-mono text-gray-500 uppercase">From:</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 font-mono text-xs rounded-lg p-2 font-medium focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold font-mono text-gray-500 uppercase">To:</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 font-mono text-xs rounded-lg p-2 font-medium focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>
        )}

        <div className="font-mono text-[9px] text-gray-400 font-semibold max-w-[200px] truncate leading-none pt-1">
          Currently showing:<br/>
          <span className="text-gray-700 font-bold">{formatDate(dateLimits.from)} &rarr; {formatDate(dateLimits.to)}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4" id="reports-main-loading">
          <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-600 font-semibold">Aggregating Freight Ledgers...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="reports-kpi-deck">
            <StatCard
              title="Total Invoices Audited"
              value={metrics.auditedCount}
              icon={BarChart3}
              valueColorClass="text-gray-900"
            />
            <StatCard
              title="Total Overcharges Detected"
              value={formatMoney(metrics.overcharges)}
              icon={ShieldAlert}
              valueColorClass="text-red-500"
            />
            <StatCard
              title="Total Savings Recovered"
              value={formatMoney(metrics.totalSavings)}
              icon={TrendingUp}
              valueColorClass="text-green-600"
            />
            <StatCard
              title="Average Error Rate"
              value={`${metrics.avgErrorRate.toFixed(1)}%`}
              icon={Percent}
              valueColorClass="text-amber-600"
            />
          </div>

          <div className="grid grid-cols-1" id="reports-primary-chart">
            <SavingsAreaChart data={monthlyTimelineData} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="reports-subcomponents-grid">
            <CarrierDiscrepancyChart data={carrierChartData} />
            <ErrorTypeChart data={errorTypeBreakdown} />
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4" id="reports-recent-disputes-table-deck">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Recent Disputes Dossiers</h3>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Top 10 disputed claims originating from billing discrepancies in filter scope</p>
              </div>
            </div>

            {recentDisputes.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-mono border border-gray-100 rounded-xl bg-gray-50" id="recent-disputes-empty">
                No active carrier claims registered during this timeline.
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden" id="reports-claims-subtable">
                <div className="min-w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse" role="table">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-[9px] uppercase font-semibold tracking-wider font-mono">
                        <th className="py-3 px-5">Invoice #</th>
                        <th className="py-3 px-4">Carrier Name</th>
                        <th className="py-3 px-4 text-right">Claim Amount</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Raised Date</th>
                        <th className="py-3 px-5 text-right font-mono">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-sans text-xs">
                      {recentDisputes.map((disp, index) => (
                        <tr 
                          key={disp.id}
                          onClick={() => handleNavigateToDisputeDetail(disp.id)}
                          className={`group hover:bg-gray-50 cursor-pointer transition-colors ${
                            index % 2 === 1 ? 'bg-gray-50/50' : 'bg-transparent'
                          }`}
                        >
                          <td className="py-3.5 px-5 font-mono font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                            {disp.invoice_id?.slice(-8).toUpperCase() || 'N/A'}
                          </td>

                          <td className="py-3.5 px-4 font-medium text-gray-700 uppercase truncate max-w-[130px]">
                            {disp.carrier_name}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold text-red-500">
                            {formatMoney(disp.total_disputed_amount)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {renderDisputeStatusBadge(disp.status)}
                          </td>

                          <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                            {formatDate(disp.created_at)}
                          </td>

                          <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleNavigateToDisputeDetail(disp.id)}
                              className="p-1 px-2.5 bg-white hover:bg-indigo-50 border border-gray-200 text-indigo-600 font-mono text-[10px] items-center gap-1 font-medium rounded-lg uppercase tracking-wide inline-flex transition-all pointer-events-auto cursor-pointer"
                            >
                              <Eye size={10} />
                              <span>Manage</span>
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
        </>
      )}

    </div>
  );
}
