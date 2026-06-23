import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminRevenue() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchRevenue() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/admin/revenue', {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (!res.ok) throw new Error('Failed');
        const d = await res.json();
        if (!cancelled) setData(d);
      } catch {}
      if (!cancelled) setLoading(false);
    }
    fetchRevenue();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-20 justify-center">
        <div className="w-4 h-4 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-400 text-sm">Loading revenue data...</span>
      </div>
    );
  }

  const statCard = (label: string, value: string | number, sub?: string) => (
    <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-mono font-bold text-zinc-50">{value}</div>
      {sub && <div className="text-xs font-mono text-zinc-500 mt-1">{sub}</div>}
    </div>
  );

  const planColors: Record<string, string> = {
    starter: '#FB923C',
    professional: '#22D3EE',
    enterprise: '#E879F9',
    free: '#52525B',
  };

  const pieData = data?.plan_distribution
    ? Object.entries(data.plan_distribution).map(([name, value]) => ({ name, value, color: planColors[name] || '#52525B' }))
    : [];

  return (
    <div className="space-y-6">
      <div className="text-xs text-zinc-500 bg-[#111113] border border-[#27272A] rounded-lg px-4 py-2">
        Revenue estimates based on plan data. Connect Stripe for accurate billing data.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCard('Estimated MRR', `$${(data?.estimated_mrr || 0).toLocaleString()}`)}
        {statCard('Estimated ARR', `$${(data?.estimated_arr || 0).toLocaleString()}`)}
        {statCard('Paying Organizations', data?.paying_orgs || 0)}
        {statCard('Free Organizations', data?.free_orgs || 0)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
          <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-4">Monthly Revenue (12 months)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthly_revenue || []}>
                <XAxis dataKey="month" tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="starter" fill="#FB923C" stackId="a" />
                <Bar dataKey="professional" fill="#22D3EE" stackId="a" />
                <Bar dataKey="enterprise" fill="#E879F9" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
          <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-4">Plan Distribution</h3>
          <div className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                  {pieData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((entry: any) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                <span className="text-xs text-zinc-400 capitalize">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-org breakdown */}
      <div className="bg-[#111113] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="bg-[#18181B] border-b border-[#27272A] px-4 py-2.5">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Organizations by Plan</span>
        </div>
        <table className="w-full">
          <thead className="bg-[#18181B] border-b border-[#27272A]">
            <tr>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Organization</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Plan</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-right">Est. Monthly</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-right">Invoices/Mo</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-right">Limit</th>
            </tr>
          </thead>
          <tbody>
            {(data?.orgs || []).map((org: any) => {
              const usagePct = org.invoice_limit ? Math.round((org.invoices_this_month / org.invoice_limit) * 100) : 0;
              return (
                <tr key={org.id} className="border-b border-[#1C1C1F] hover:bg-[#18181B] transition-colors">
                  <td className="text-sm py-3 px-4 text-zinc-200">{org.name}</td>
                  <td className="text-sm py-3 px-4">
                    <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 border ${
                      org.plan === 'Free' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                      org.plan === 'Starter' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' :
                      org.plan === 'Professional' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                      'bg-fuchsia-400/10 text-fuchsia-400 border-fuchsia-400/20'
                    }`}>{org.plan}</span>
                  </td>
                  <td className="text-sm py-3 px-4 font-mono text-right text-zinc-200">
                    ${org.estimated_monthly_value}
                  </td>
                  <td className="text-sm py-3 px-4 font-mono text-right text-zinc-200">{org.invoices_this_month}</td>
                  <td className="text-sm py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono text-xs text-zinc-500">{org.invoice_limit}</span>
                      <div className="w-16 h-1.5 bg-[#27272A] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${usagePct > 80 ? 'bg-red-400' : usagePct > 50 ? 'bg-orange-400' : 'bg-fuchsia-500'}`}
                          style={{ width: `${Math.min(usagePct, 100)}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
