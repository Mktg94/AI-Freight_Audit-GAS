import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Search, User } from 'lucide-react';

interface UserItem {
  id: string;
  user_id: string;
  email: string;
  name: string;
  org_name: string;
  org_id: string;
  role: string;
  status: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function fetchUsers() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams({ search, limit: '100' });
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUsers(data.data || []);
    } catch { setUsers([]); }
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, [search]);

  async function toggleSuspend(userId: string, currentStatus: string) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const action = currentStatus === 'active' ? 'suspend' : 'unsuspend';
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    fetchUsers();
  }

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-fuchsia-400/10 text-fuchsia-400 border-fuchsia-400/20',
      logistics_manager: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
      finance_clerk: 'bg-green-400/10 text-green-400 border-green-400/20',
      operations_coordinator: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
    };
    return <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 border ${styles[role] || styles.admin}`}>{role.replace(/_/g, ' ')}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-20 justify-center">
        <div className="w-4 h-4 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-400 text-sm">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          type="text"
          placeholder="Search users by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#18181B] border border-[#3F3F46] rounded-lg text-zinc-100 text-sm placeholder:text-zinc-600 pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50"
        />
      </div>

      <div className="bg-[#111113] border border-[#27272A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#18181B] border-b border-[#27272A]">
            <tr>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">User</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Email</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Organization</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Role</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Status</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2.5 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[#1C1C1F] hover:bg-[#18181B] transition-colors">
                <td className="text-sm py-3 px-4">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-200">{u.name}</span>
                  </div>
                </td>
                <td className="text-sm py-3 px-4 font-mono text-xs text-zinc-400">{u.email}</td>
                <td className="text-sm py-3 px-4">
                  <a
                    href={`/admin/organizations/${u.org_id}`}
                    onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/admin/organizations/${u.org_id}`); window.dispatchEvent(new Event('popstate')); }}
                    className="text-zinc-300 hover:text-fuchsia-400 transition-colors"
                  >
                    {u.org_name}
                  </a>
                </td>
                <td className="text-sm py-3 px-4">{roleBadge(u.role)}</td>
                <td className="text-sm py-3 px-4">
                  {u.status === 'active'
                    ? <span className="text-[11px] font-medium rounded-full px-2 py-0.5 border bg-green-400/10 text-green-400 border-green-400/20">Active</span>
                    : <span className="text-[11px] font-medium rounded-full px-2 py-0.5 border bg-red-400/10 text-red-400 border-red-400/20">Suspended</span>}
                </td>
                <td className="text-sm py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSuspend(u.user_id, u.status)}
                      className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      {u.status === 'active' ? 'Suspend' : 'Unsuspend'}
                    </button>
                    <span className="text-zinc-700">|</span>
                    <a
                      href={`/admin/users/${u.user_id}`}
                      onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/admin/users/${u.user_id}`); window.dispatchEvent(new Event('popstate')); }}
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                    >
                      View
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-zinc-500 text-sm">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
