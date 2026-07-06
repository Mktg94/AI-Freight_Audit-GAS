import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Search, Download } from 'lucide-react';

const actionIcons: Record<string, { icon: string; color: string }> = {
  invoice_uploaded: { icon: '↑', color: 'text-cyan-400' },
  line_item_approved: { icon: '✓', color: 'text-green-400' },
  line_item_disputed: { icon: '⚡', color: 'text-orange-400' },
  dispute_sent: { icon: '→', color: 'text-orange-400' },
  dispute_resolved: { icon: '●', color: 'text-blue-400' },
  contract_created: { icon: '✦', color: 'text-blue-400' },
  user_invited: { icon: '+', color: 'text-zinc-400' },
  user_removed: { icon: '✕', color: 'text-red-400' },
};

function describeAction(log: any): string {
  const actionMap: Record<string, string> = {
    invoice_uploaded: `Uploaded an invoice${log.metadata?.invoice_number ? ` (#${log.metadata.invoice_number})` : ''}`,
    line_item_approved: `Approved a line item${log.metadata?.description ? `: ${log.metadata.description}` : ''}`,
    line_item_disputed: `Flagged a line item for dispute${log.metadata?.description ? `: ${log.metadata.description}` : ''}`,
    dispute_sent: `Sent a dispute letter${log.metadata?.carrier_name ? ` to ${log.metadata.carrier_name}` : ''}${log.metadata?.amount ? ` for $${log.metadata.amount}` : ''}`,
    dispute_resolved: `Resolved a dispute${log.metadata?.outcome ? `: ${log.metadata.outcome}` : ''}`,
    contract_created: `Created a contract${log.metadata?.carrier_name ? ` with ${log.metadata.carrier_name}` : ''}`,
    user_invited: `Invited a user to the organization`,
    user_removed: `Removed a user from the organization`,
  };
  return actionMap[log.action] || log.action;
}

export default function AdminActivity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');

  async function fetchLogs() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams({ page: String(page), limit: '20', action: actionFilter, search });
      const res = await fetch(`/api/admin/activity?${params}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch { setLogs([]); }
    setLoading(false);
  }

  useEffect(() => { fetchLogs(); }, [page, actionFilter, search]);
  useEffect(() => { setPage(1); }, [actionFilter, search]);

  async function exportCSV() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const params = new URLSearchParams({ limit: '10000', action: actionFilter, search });
    const res = await fetch(`/api/admin/activity?${params}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    const rows = (data.data || []).map((l: any) =>
      `"${l.action}","${l.org?.name || ''}","${new Date(l.created_at).toISOString()}"`
    ).join('\n');
    const csv = `action,org,timestamp\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'activity-log.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1A1A1A] rounded-xl text-zinc-100 text-sm placeholder:text-zinc-600 pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="bg-[#1A1A1A] rounded-xl text-zinc-100 text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50">
          <option value="all">All Actions</option>
          <option value="invoice_uploaded">Uploads</option>
          <option value="line_item_approved">Approvals</option>
          <option value="line_item_disputed">Disputes</option>
          <option value="dispute_sent">Sent</option>
          <option value="dispute_resolved">Resolved</option>
          <option value="contract_created">Contracts</option>
          <option value="user_invited">Invites</option>
        </select>
        <button onClick={exportCSV}
          className="bg-[#1A1A1A] hover:bg-[#222] text-zinc-400 hover:text-zinc-200 text-xs font-medium px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-1.5"
        >
          <Download className="w-3 h-3" /> Export CSV
        </button>
      </div>

      <div className="bg-[#121212] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-3 py-20 justify-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-zinc-400 text-sm">Loading activity...</span>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {logs.map((log: any) => {
              const action = actionIcons[log.action] || { icon: '•', color: 'text-zinc-500' };
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[#1A1A1A] transition-colors duration-200">
                  <span className={`text-xs font-mono mt-0.5 ${action.color}`}>{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300">
                      <span className="font-mono text-xs text-zinc-600">{log.user_email || 'unknown'}</span>
                      {' '}{describeAction(log)}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{log.org?.name || 'Unknown org'}</p>
                  </div>
                  <div className="text-xs font-mono text-zinc-600 shrink-0" title={new Date(log.created_at).toLocaleString()}>
                    {timeAgo(log.created_at)}
                  </div>
                </div>
              );
            })}
            {logs.length === 0 && (
              <div className="text-center py-10 text-zinc-500 text-sm">No activity found</div>
            )}
          </div>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{total} total entries</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] disabled:opacity-30 hover:bg-[#222] transition-colors duration-200">Previous</button>
            <button onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#222] transition-colors duration-200">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
