import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Invoice, LineItem, Contract } from '@/types';
import StatCard from '@/components/dashboard/StatCard';
import SavingsChart from '@/components/dashboard/SavingsChart';
import FlaggedInvoicesQueue from '@/components/dashboard/FlaggedInvoicesQueue';
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge';
import { 
  FileText, Landmark, TrendingUp, AlertTriangle, 
  Upload, ArrowUpRight, HelpCircle
} from 'lucide-react';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        
        const [invRes, lineRes, contractRes] = await Promise.all([
          supabase.from('invoices').select('*').order('uploaded_at', { ascending: false }),
          supabase.from('line_items').select('*'),
          supabase.from('contracts').select('*')
        ]);

        if (!invRes.error && invRes.data) {
          setInvoices(invRes.data);
        }
        if (!lineRes.error && lineRes.data) {
          setLineItems(lineRes.data);
        }
        if (!contractRes.error && contractRes.data) {
          setContracts(contractRes.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handlePopstate = () => {
      fetchData();
    };
    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);

  const handleNavigateTo = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const currentYear = 2026;
  const currentMonthNum = 5; // 0-indexed May

  const invoicesThisMonth = invoices.filter(inv => {
    const uploadDate = new Date(inv.uploaded_at);
    return uploadDate.getFullYear() === currentYear && uploadDate.getMonth() === currentMonthNum;
  });

  const invoicesCount = invoicesThisMonth.length || invoices.length;
  const totalBilledVal = invoicesThisMonth.reduce((sum, inv) => sum + inv.total_billed, 0) || 
                         invoices.reduce((sum, inv) => sum + inv.total_billed, 0);
  const savingsCapturedVal = invoices.reduce((sum, inv) => sum + inv.total_savings, 0);
  const flaggedCount = invoices.filter(inv => inv.status === 'flagged').length;

  const chartData = (() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months: Record<string, { month: string; billed: number; approved: number; savings: number }> = {};
    invoices.forEach(inv => {
      const d = new Date(inv.uploaded_at);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (!months[key]) months[key] = { month: key, billed: 0, approved: 0, savings: 0 };
      months[key].billed += inv.total_billed || 0;
      months[key].approved += inv.total_approved || 0;
      months[key].savings += inv.total_savings || 0;
    });
    return Object.values(months).sort((a, b) => {
      const da = new Date(a.month);
      const db = new Date(b.month);
      return da.getTime() - db.getTime();
    });
  })();

  const formatMoney = (val: number) => {
    return val.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 animate-fade-in" id="dashboard-analytical-workspace">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Compare live shipping bills against negotiated bulk tariffs to instantly claim carrier refunds.
            </p>
          </div>

          <button
            onClick={(e) => handleNavigateTo('/invoices', e)}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors duration-150 inline-flex items-center gap-2 cursor-pointer"
          >
            <Upload size={14} />
            <span>Upload Freight Invoice</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-xs uppercase font-mono tracking-widest text-indigo-600">
              Querying secure ledger records...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard 
                  title="Invoices This Month" 
                  value={invoicesCount} 
                  icon={FileText}
                  trend={{ direction: 'up', pct: 12 }} 
                />
                <StatCard 
                  title="Total Billed" 
                  value={formatMoney(totalBilledVal)} 
                  icon={Landmark}
                  trend={{ direction: 'up', pct: 8 }} 
                />
                <StatCard 
                  title="Savings Captured" 
                  value={formatMoney(savingsCapturedVal)} 
                  icon={TrendingUp}
                  trend={{ direction: 'up', pct: 24 }}
                  valueColorClass="text-[#10B981]"
                />
                <StatCard 
                  title="Flagged for Review" 
                  value={flaggedCount} 
                  icon={AlertTriangle}
                  valueColorClass="text-[#F59E0B]"
                />
              </div>

              <SavingsChart data={chartData} />

              <div className="bg-white rounded-2xl border border-gray-100 p-6" id="dashboard-recent-invoices-card">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Recent Freight Bills
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono">
                      CHRONOLOGICAL TRANSACTIONS RECEIVED FROM AUTOMATED SCRAPERS
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleNavigateTo('/invoices', e)}
                    className="text-[10px] font-bold uppercase text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>See Ledger</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" role="table">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="py-2.5 px-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Invoice #
                        </th>
                        <th className="py-2.5 px-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Carrier
                        </th>
                        <th className="py-2.5 px-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Ship Date
                        </th>
                        <th className="py-2.5 px-4 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Billed Amt
                        </th>
                        <th className="py-2.5 px-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Status
                        </th>
                        <th className="py-2.5 px-4 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-medium text-indigo-600 text-sm hover:underline cursor-pointer">
                            {inv.invoice_number}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                            {inv.carrier_name}
                          </td>
                          <td className="py-3 px-4 text-sm font-mono text-gray-400">
                            {inv.shipment_date}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sm text-gray-900">
                            {inv.total_billed.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </td>
                          <td className="py-3 px-4">
                            <InvoiceStatusBadge status={inv.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => handleNavigateTo('/invoices', e)}
                              className="text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-lg transition-all bg-white hover:bg-gray-50 border border-gray-200 text-gray-900"
                            >
                              View Audit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-8 flex flex-col justify-start">
              
              <FlaggedInvoicesQueue 
                lineItems={lineItems} 
                invoices={invoices}
                onReview={(invId) => {
                  window.history.pushState({}, '', `/invoices`);
                  window.dispatchEvent(new Event('popstate'));
                }}
              />

              <div 
                onClick={(e) => handleNavigateTo('/invoices', e)}
                className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors duration-200 text-center cursor-pointer group shadow-none flex flex-col items-center justify-center py-8 space-y-4"
                id="dashboard-dropzone-banner"
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full group-hover:scale-105 transition-transform">
                  <Upload size={20} />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-gray-900 tracking-tight uppercase">
                    Quick Invoice Audit
                  </h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed max-w-[180px] mx-auto">
                    Drag & drop billing PDF files here or click to browse system directories.
                  </p>
                </div>

                <span className="text-[9px] font-bold font-mono uppercase bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100">
                  PDF / XLS • Max 10MB
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 text-left space-y-3">
                <span className="text-[10px] font-bold uppercase font-mono tracking-widest text-indigo-600 flex items-center gap-1">
                  <HelpCircle size={12} /> Pro tips of auditing
                </span>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Carrier accessorial charges (e.g. liftgate, inside delivery) are frequently overbilled. Keep contracts active to catch up to 25% average billing margins.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
