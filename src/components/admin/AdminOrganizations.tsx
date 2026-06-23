import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Building2, Search, ChevronDown } from 'lucide-react';

interface Org {
  id: string;
  name: string;
  owner_email: string;
  plan: string;
  status: string;
  members: number;
  seat_limit: number;
  invoices_this_month: number;
  total_invoices: number;
  total_savings: number;
  created_at: string;
}

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  async function fetchOrgs() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams({ search, plan: planFilter, status: statusFilter, limit: '100' });
      const res = await fetch(`/api/admin/orgs?${params}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setOrgs(data.data || []);
    } catch { setOrgs([]); }
    setLoading(false);
  }

  useEffect(() => { fetchOrgs(); }, [search, planFilter, statusFilter]);

  const planBadge = (plan: string) => {
    const styles: Record<string, string> = {
      free: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      starter: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
      professional: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
      enterprise: 'bg-fuchsia-400/10 text-fuchsia-400 border-fuchsia-400/20',
    };
    return (
      <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 border ${styles[plan.toLowerCase()] || styles.free}`}>
        {plan}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    if (status === 'active') return <span className="text-[11px] font-medium rounded-full px-2 py-0.5 border bg-green-400/10 text-green-400 border-green-400/20">Active</span>;
    return <span className="text-[11px] font-medium rounded-full px-2 py-0.5 border bg-red-400/10 text-red-400 border-red-400/20">Suspended</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-20 justify-center">
        <div className="w-4 h-4 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-400 text-sm">Loading organizations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#18181B] border border-[#3F3F46] rounded-lg text-zinc-100 text-sm placeholder:text-zinc-600 pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50"
          />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-[#18181B] border border-[#3F3F46] rounded-lg text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50">
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#18181B] border border-[#3F3F46] rounded-lg text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="bg-[#111113] border border-[#27272A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#18181B] border-b border-[#27272A]">
            <tr>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Organization</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Owner</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Plan</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Members</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-right">Invoices/Month</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-right">Total Savings</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Created</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Status</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-b border-[#1C1C1F] hover:bg-[#18181B] transition-colors">
                <td className="text-sm py-3 px-4">
                  <a
                    href={`/admin/organizations/${org.id}`}
                    onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/admin/organizations/${org.id}`); window.dispatchEvent(new Event('popstate')); }}
                    className="text-zinc-200 hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                  >
                    <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                    {org.name}
                  </a>
                </td>
                <td className="text-sm py-3 px-4 font-mono text-xs text-zinc-400">{org.owner_email}</td>
                <td className="text-sm py-3 px-4">{planBadge(org.plan)}</td>
                <td className="text-sm py-3 px-4 font-mono text-xs text-zinc-300">{org.members}/{org.seat_limit}</td>
                <td className="text-sm py-3 px-4 font-mono text-right text-zinc-200">{org.invoices_this_month}</td>
                <td className="text-sm py-3 px-4 font-mono text-right text-green-400">${org.total_savings.toLocaleString()}</td>
                <td className="text-sm py-3 px-4 font-mono text-xs text-zinc-500">{new Date(org.created_at).toLocaleDateString()}</td>
                <td className="text-sm py-3 px-4">{statusBadge(org.status)}</td>
                <td className="text-sm py-3 px-4">
                  <a
                    href={`/admin/organizations/${org.id}`}
                    onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/admin/organizations/${org.id}`); window.dispatchEvent(new Event('popstate')); }}
                    className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-zinc-500 text-sm">No organizations found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
