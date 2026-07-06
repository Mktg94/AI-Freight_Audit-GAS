import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Building2, Search } from 'lucide-react';

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
      free: 'bg-zinc-800 text-zinc-400',
      starter: 'bg-orange-400/10 text-orange-400',
      professional: 'bg-blue-400/10 text-blue-400',
      enterprise: 'bg-blue-400/10 text-blue-400',
    };
    return <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${styles[plan.toLowerCase()] || styles.free}`}>{plan}</span>;
  };

  const statusBadge = (status: string) => {
    if (status === 'active') return <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-green-400/10 text-green-400">Active</span>;
    return <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-red-400/10 text-red-400">Suspended</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-20 justify-center">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
            className="w-full bg-[#1A1A1A] rounded-xl text-zinc-100 text-sm placeholder:text-zinc-600 pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-[#1A1A1A] rounded-xl text-zinc-100 text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50">
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1A1A1A] rounded-xl text-zinc-100 text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="bg-[#121212] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] py-3 px-5 text-left">Organization</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] py-3 px-5 text-left">Owner</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] py-3 px-5 text-left">Plan</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] py-3 px-5 text-left">Members</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] py-3 px-5 text-right">Invoices/Month</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] py-3 px-5 text-right">Total Savings</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] py-3 px-5 text-left">Created</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] py-3 px-5 text-left">Status</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] py-3 px-5 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org, i) => (
              <tr key={org.id} className="hover:bg-[#1A1A1A] transition-colors duration-200" style={i % 2 === 0 ? { background: '#161616' } : {}}>
                <td className="text-sm py-3 px-5">
                  <a
                    href={`/admin/organizations/${org.id}`}
                    onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/admin/organizations/${org.id}`); window.dispatchEvent(new Event('popstate')); }}
                    className="text-zinc-200 hover:text-blue-400 transition-colors flex items-center gap-2"
                  >
                    <Building2 className="w-3.5 h-3.5 text-zinc-600" />
                    {org.name}
                  </a>
                </td>
                <td className="text-sm py-3 px-5 font-mono text-xs text-zinc-500">{org.owner_email}</td>
                <td className="text-sm py-3 px-5">{planBadge(org.plan)}</td>
                <td className="text-sm py-3 px-5 font-mono text-xs text-zinc-400">{org.members}/{org.seat_limit}</td>
                <td className="text-sm py-3 px-5 font-mono text-right text-zinc-300">{org.invoices_this_month}</td>
                <td className="text-sm py-3 px-5 font-mono text-right text-green-400">${org.total_savings.toLocaleString()}</td>
                <td className="text-sm py-3 px-5 font-mono text-xs text-zinc-600">{new Date(org.created_at).toLocaleDateString()}</td>
                <td className="text-sm py-3 px-5">{statusBadge(org.status)}</td>
                <td className="text-sm py-3 px-5">
                  <a
                    href={`/admin/organizations/${org.id}`}
                    onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/admin/organizations/${org.id}`); window.dispatchEvent(new Event('popstate')); }}
                    className="text-xs text-zinc-600 hover:text-zinc-200 transition-colors"
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
