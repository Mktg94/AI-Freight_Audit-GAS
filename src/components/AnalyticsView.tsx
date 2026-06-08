import { Invoice, Dispute } from '../../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { DollarSign, ShieldAlert, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface AnalyticsViewProps {
  invoices: Invoice[];
  disputes: Dispute[];
}

export default function AnalyticsView({ invoices, disputes }: AnalyticsViewProps) {
  // Aggregate total metrics
  const totalBilledSpend = invoices.reduce((sum, i) => sum + i.total_billed, 0);
  
  // Audited (approved + flagged + disputed) expected values
  const auditedInvoices = invoices.filter(i => i.status !== 'pending' && i.status !== 'auditing');
  const totalApprovedSpend = auditedInvoices.reduce((sum, i) => sum + i.total_approved, 0);
  
  // Total potential savings (flagged discrepancies)
  const potentialSavings = invoices.reduce((sum, i) => sum + i.total_savings, 0);
  
  // Total actual recovered cash (resolved disputes)
  const actualRecovered = disputes
    .filter(d => d.status === 'resolved')
    .reduce((sum, d) => sum + (d.resolution_amount || 0), 0);

  // 1. Data representation: carrier-specific expense billing
  const carriersDataMap: Record<string, { carrier: string; billed: number; approved: number; savings: number }> = {};
  invoices.forEach(inv => {
    const c = inv.carrier_name;
    if (!carriersDataMap[c]) {
      carriersDataMap[c] = { carrier: c, billed: 0, approved: 0, savings: 0 };
    }
    carriersDataMap[c].billed += inv.total_billed;
    carriersDataMap[c].approved += inv.status !== 'pending' && inv.status !== 'auditing' ? inv.total_approved : inv.total_billed;
    carriersDataMap[c].savings += inv.total_savings;
  });
  const carriersData = Object.values(carriersDataMap);

  // 2. Data representation: billing timelines over past shipments
  const timelineData = invoices
    .slice()
    .sort((a,b) => new Date(a.shipment_date).getTime() - new Date(b.shipment_date).getTime())
    .map(inv => ({
      date: inv.shipment_date,
      billed: inv.total_billed,
      contract_expected: inv.status !== 'pending' && inv.status !== 'auditing' ? inv.total_approved : inv.total_billed,
      discrepancy: inv.total_savings,
      invoiceNum: inv.invoice_number
    }));

  return (
    <div className="space-y-6" id="analytics-portal-section">
      
      {/* Cards aggregate widgets row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-bold">Total Audited Freight Spend</span>
            <span className="block font-mono text-2xl font-bold text-white">${totalBilledSpend.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-3 pt-2.5 border-t border-[#1f2d45]/60">Cumulative invoice balances in scope</p>
          <div className="absolute right-4 top-4 text-[#94a3b8]/10"><DollarSign size={52} /></div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#111827] border border-emerald-950 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Negotiated Approved Rates</span>
            <span className="block font-mono text-2xl font-bold text-emerald-400">${(totalBilledSpend - potentialSavings).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
          <p className="text-[10px] text-emerald-500/80 mt-3 pt-2.5 border-t border-emerald-900/40 font-semibold flex items-center gap-1">
            <CheckCircle2 size={10} /> Perfect contract alignment
          </p>
          <div className="absolute right-4 top-4 text-[#10b981]/15"><DollarSign size={52} /></div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#111827] border border-rose-950 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider font-bold">Unreconciled Billing Discrepancies</span>
            <span className="block font-mono text-2xl font-bold text-rose-400">${potentialSavings.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-3 pt-2.5 border-t border-[#1f2d45]/60 flex items-center gap-1">
            <ShieldAlert size={10} className="text-rose-400" /> Errors flagged automatically
          </p>
          <div className="absolute right-4 top-4 text-[#ef4444]/15"><Sparkles size={52} /></div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#111827] border border-teal-900/40 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-[0_0_15px_rgba(45,212,191,0.04)]">
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] text-[#2dd4bf] uppercase tracking-wider font-bold">Net Claims Credit Approved</span>
            <span className="block font-mono text-2xl font-bold text-[#2dd4bf] shadow-[0_0_20px_rgba(45,212,191,0.15)] bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">${actualRecovered.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
          <p className="text-[10px] text-teal-400 mt-3 pt-2.5 border-t border-teal-950 font-semibold flex items-center gap-1">
            <TrendingUp size={10} /> Hard savings returned
          </p>
          <div className="absolute right-4 top-4 text-[#2dd4bf]/20"><DollarSign size={52} /></div>
        </div>

      </div>

      {/* Visual Analytics graphs grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Timeline spending graph */}
        <div className="lg:col-span-8 bg-[#111827] border border-[#1f2d45] rounded-xl p-6 flex flex-col space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">Audit Timeline & Cost Divergence</h3>
            <span className="text-[11px] text-[#94a3b8] block mt-0.5">Continuous comparison of billed shipping invoices vs contract formulas</span>
          </div>

          <div className="h-[280px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorContract" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" opacity={0.3} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} unit="$" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2d45', color: '#f1f5f9', borderRadius: '8px' }}
                  labelStyle={{ fontSize: '10px', color: '#94a3b8' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="billed" name="Tariff Billed Amount" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBilled)" />
                <Area type="monotone" dataKey="contract_expected" name="Negotiated Contract Cap" stroke="#2dd4bf" strokeWidth={2} fillOpacity={1} fill="url(#colorContract)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carrier distribution chart */}
        <div className="lg:col-span-4 bg-[#111827] border border-[#1f2d45] rounded-xl p-6 flex flex-col space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">Carrier Savings Outlay</h3>
            <span className="text-[11px] text-[#94a3b8] block mt-0.5">Billed vs Savings per registered partner carrier</span>
          </div>

          <div className="h-[280px] w-full text-xs flex justify-center items-center">
            {carriersData.length === 0 ? (
              <span className="text-zinc-500 text-xs">Awaiting data aggregation logs.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={carriersData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" opacity={0.3} />
                  <XAxis dataKey="carrier" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2d45', color: '#f1f5f9', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="billed" name="Billed tariff ($)" fill="#1c2537" stroke="#1f2d45" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="savings" name="Recoveries Flagged ($)" fill="#2dd4bf" radius={[4, 4, 0, 0]}>
                    {carriersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.savings > 100 ? '#2dd4bf' : '#14b8a4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
