import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { ArrowLeft, Building2, Users, FileText, AlertTriangle } from 'lucide-react';

export default function AdminOrgDetail() {
  const orgId = window.location.pathname.split('/').pop() || '';
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');

  async function fetchOrg() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/orgs/${orgId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setOrg(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchOrg(); }, [orgId]);

  async function handleAction(action: string, plan?: string) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/admin/orgs/${orgId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, plan }),
    });
    fetchOrg();
  }

  async function saveNote() {
    if (!noteText.trim()) return;
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/admin/notes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, note_text: noteText }),
    });
    setNoteText('');
    fetchOrg();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-20 justify-center">
        <div className="w-4 h-4 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-400 text-sm">Loading organization...</span>
      </div>
    );
  }

  if (!org) {
    return <div className="text-red-400 text-sm py-10 text-center">Organization not found</div>;
  }

  const { org: orgInfo, members = [], recent_invoices = [], admin_notes = [], usage } = org;
  const usagePercent = usage?.invoice_limit ? Math.round((usage.invoices_this_month / usage.invoice_limit) * 100) : 0;

  return (
    <div className="space-y-6">
      <a
        href="/admin/organizations"
        onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/admin/organizations'); window.dispatchEvent(new Event('popstate')); }}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Organizations
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Org info card */}
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-fuchsia-400" />
              <h2 className="text-zinc-100 font-semibold text-base">{orgInfo.name}</h2>
              <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 border ${orgInfo.status === 'active' ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
                {orgInfo.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-zinc-500">Plan:</span> <span className="text-zinc-200">{orgInfo.plan}</span></div>
              <div><span className="text-zinc-500">Created:</span> <span className="text-zinc-200 font-mono text-xs">{new Date(orgInfo.created_at).toLocaleDateString()}</span></div>
              <div><span className="text-zinc-500">Owner ID:</span> <span className="text-zinc-200 font-mono text-xs">{orgInfo.owner_id}</span></div>
              <div><span className="text-zinc-500">Seat limit:</span> <span className="text-zinc-200">{usage?.invoice_limit || 'N/A'}</span></div>
            </div>
          </div>

          {/* Members table */}
          <div className="bg-[#111113] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="bg-[#18181B] border-b border-[#27272A] px-4 py-2.5 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Members ({members.length})</span>
            </div>
            <table className="w-full">
              <thead className="bg-[#18181B] border-b border-[#27272A]">
                <tr>
                  <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-left">Email</th>
                  <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-left">Role</th>
                  <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-left">Status</th>
                  <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any) => (
                  <tr key={m.id} className="border-b border-[#1C1C1F] hover:bg-[#18181B] transition-colors">
                    <td className="text-sm py-2.5 px-4 font-mono text-xs text-zinc-300">{m.email || m.user?.email || 'N/A'}</td>
                    <td className="text-sm py-2.5 px-4 text-zinc-300">{m.role}</td>
                    <td className="text-sm py-2.5 px-4">
                      {m.status === 'active' ? <span className="text-[11px] font-medium rounded-full px-2 py-0.5 border bg-green-400/10 text-green-400 border-green-400/20">Active</span> : <span className="text-[11px] font-medium rounded-full px-2 py-0.5 border bg-red-400/10 text-red-400 border-red-400/20">Suspended</span>}
                    </td>
                    <td className="text-sm py-2.5 px-4">
                      <button
                        onClick={() => handleAction(m.status === 'active' ? 'suspend' : 'unsuspend')}
                        className="text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        {m.status === 'active' ? 'Suspend' : 'Unsuspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent invoices */}
          <div className="bg-[#111113] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="bg-[#18181B] border-b border-[#27272A] px-4 py-2.5 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Recent Invoices (last 20)</span>
            </div>
            <table className="w-full">
              <thead className="bg-[#18181B] border-b border-[#27272A]">
                <tr>
                  <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-left">Invoice #</th>
                  <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-left">Carrier</th>
                  <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-left">Date</th>
                  <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-left">Status</th>
                  <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-right">Billed</th>
                  <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-right">Savings</th>
                </tr>
              </thead>
              <tbody>
                {recent_invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-[#1C1C1F] hover:bg-[#18181B] transition-colors">
                    <td className="text-sm py-2.5 px-4 font-mono text-xs text-zinc-300">{inv.invoice_number}</td>
                    <td className="text-sm py-2.5 px-4 text-zinc-300">{inv.carrier_name}</td>
                    <td className="text-sm py-2.5 px-4 font-mono text-xs text-zinc-500">{new Date(inv.uploaded_at).toLocaleDateString()}</td>
                    <td className="text-sm py-2.5 px-4">
                      <span className="text-[11px] font-medium rounded-full px-2 py-0.5 border text-zinc-300 border-zinc-700">{inv.status}</span>
                    </td>
                    <td className="text-sm py-2.5 px-4 font-mono text-right text-zinc-200">${parseFloat(inv.total_billed || 0).toLocaleString()}</td>
                    <td className="text-sm py-2.5 px-4 font-mono text-right text-green-400">${parseFloat(inv.total_savings || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Admin notes */}
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-3">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Admin Notes</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {admin_notes.map((n: any) => (
                <div key={n.id} className="text-xs text-zinc-400 border-l-2 border-zinc-700 pl-3 py-1">
                  <p>{n.note_text}</p>
                  <span className="text-[10px] text-zinc-600 font-mono">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              ))}
              {admin_notes.length === 0 && <p className="text-xs text-zinc-600">No notes yet</p>}
            </div>
            <div className="flex gap-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a private note about this organization..."
                className="flex-1 bg-[#18181B] border border-[#3F3F46] rounded-lg text-zinc-100 text-xs placeholder:text-zinc-600 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 min-h-[60px] resize-none"
              />
              <button
                onClick={saveNote}
                className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors self-end"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Usage stats */}
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-4">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Usage Stats</h3>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Invoices this month</span>
                <span className="text-zinc-200 font-mono">{usage?.invoices_this_month || 0} / {usage?.invoice_limit || 100}</span>
              </div>
              <div className="h-1.5 bg-[#27272A] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-red-400' : usagePercent > 50 ? 'bg-orange-400' : 'bg-fuchsia-500'}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Disputes sent</span>
              <span className="text-zinc-200 font-mono">{usage?.disputes_sent || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Total savings</span>
              <span className="text-green-400 font-mono">${(usage?.total_savings || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-[#111113] border border-red-400/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <h3 className="text-[10px] font-semibold uppercase tracking-widest">Danger Zone</h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleAction(orgInfo.status === 'active' ? 'suspend' : 'unsuspend')}
                className="w-full bg-transparent hover:bg-red-400/10 text-red-400 border border-red-400/20 hover:border-red-400/40 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              >
                {orgInfo.status === 'active' ? 'Suspend Organization' : 'Unsuspend Organization'}
              </button>
              <div className="flex gap-2">
                <select id="plan-select" defaultValue="" className="flex-1 bg-[#18181B] border border-[#3F3F46] rounded-lg text-zinc-100 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50">
                  <option value="" disabled>Change plan...</option>
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <button
                  onClick={() => {
                    const select = document.getElementById('plan-select') as HTMLSelectElement;
                    if (select.value) handleAction('change_plan', select.value);
                  }}
                  className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
