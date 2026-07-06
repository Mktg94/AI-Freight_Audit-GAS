import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import AdminStatCard from './AdminStatCard';
import { Building2, Activity } from 'lucide-react';

interface Stats {
  total_organizations: number;
  total_users: number;
  total_invoices: number;
  invoices_this_month: number;
  total_savings: number;
  new_orgs_this_week: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrgs, setRecentOrgs] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setError('Not authenticated'); setLoading(false); return; }

        const token = session.access_token;
        const [statsRes, orgsRes, activityRes] = await Promise.all([
          fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/orgs?sort=newest&limit=8', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/activity?limit=10', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!cancelled) {
          setStats(statsRes.ok ? await statsRes.json() : null);
          setRecentOrgs(orgsRes.ok ? (await orgsRes.json()).data || [] : []);
          setRecentActivity(activityRes.ok ? (await activityRes.json()).data || [] : []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setError('Network error'); setLoading(false); }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-20 justify-center">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-400 text-sm">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-sm py-10 text-center">{error}</div>;
  }

  const planBadge = (plan: string) => {
    const styles: Record<string, string> = {
      free: 'bg-zinc-800 text-zinc-400',
      starter: 'bg-orange-400/10 text-orange-400',
      professional: 'bg-blue-400/10 text-blue-400',
      enterprise: 'bg-blue-400/10 text-blue-400',
    };
    return <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${styles[plan.toLowerCase()] || styles.free}`}>{plan}</span>;
  };

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Organizations"
          value={stats?.total_organizations ?? 0}
          trend={`${stats?.new_orgs_this_week ?? 0} new this week`}
          trendPositive
        />
        <AdminStatCard
          label="Total Users"
          value={stats?.total_users ?? 0}
          trend="Across all organizations"
        />
        <AdminStatCard
          label="Invoices This Month"
          value={stats?.invoices_this_month ?? 0}
          trend={`${stats?.total_invoices ?? 0} all time`}
        />
        <AdminStatCard
          label="Overcharges Detected"
          value={`$${(stats?.total_savings ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend="Total savings recovered"
          trendPositive
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121212] rounded-2xl overflow-hidden">
          <div className="bg-[#1A1A1A] px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em]">Recent Organizations</span>
            </div>
            <a
              href="/admin/organizations"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/admin/organizations'); window.dispatchEvent(new Event('popstate')); }}
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >View all</a>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {recentOrgs.map((org: any) => (
              <div key={org.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#1A1A1A] transition-colors duration-200">
                <div>
                  <a
                    href={`/admin/organizations/${org.id}`}
                    onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/admin/organizations/${org.id}`); window.dispatchEvent(new Event('popstate')); }}
                    className="text-sm text-zinc-200 hover:text-blue-400 transition-colors"
                  >{org.name}</a>
                  <p className="text-[10px] font-mono text-zinc-600 mt-0.5">{org.owner_email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {planBadge(org.plan)}
                  <span className="text-[10px] font-mono text-zinc-600">{org.members} members</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121212] rounded-2xl overflow-hidden">
          <div className="bg-[#1A1A1A] px-5 py-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em]">Recent Activity</span>
          </div>
          <div className="divide-y divide-white/[0.03] max-h-[320px] overflow-y-auto">
            {recentActivity.map((log: any) => (
              <div key={log.id} className="px-5 py-3 hover:bg-[#1A1A1A] transition-colors duration-200">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-zinc-300">{log.action}</p>
                  <span className="text-[10px] font-mono text-zinc-600 shrink-0">{timeAgo(log.created_at)}</span>
                </div>
                <p className="text-[10px] text-zinc-600 mt-0.5">{log.org?.name || ''}</p>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-center py-6 text-xs text-zinc-600">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
