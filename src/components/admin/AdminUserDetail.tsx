import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { ArrowLeft, User, FileText, Clock } from 'lucide-react';

export default function AdminUserDetail() {
  const userId = window.location.pathname.split('/').pop() || '';
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);

  async function fetchData() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Fetch user info from org_members
      const res = await fetch('/api/admin/users?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const found = (data.data || []).find((u: any) => u.user_id === userId);
      setUserData(found || null);

      // Fetch activity for this user
      const actRes = await fetch(`/api/admin/activity?search=${userId}&limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const actData = await actRes.json();
      setActivity(actData.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [userId]);

  async function toggleSuspend() {
    if (!userData) return;
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const action = userData.status === 'active' ? 'suspend' : 'unsuspend';
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-20 justify-center">
        <div className="w-4 h-4 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-400 text-sm">Loading user...</span>
      </div>
    );
  }

  if (!userData) {
    return <div className="text-red-400 text-sm py-10 text-center">User not found</div>;
  }

  return (
    <div className="space-y-6">
      <a
        href="/admin/users"
        onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/admin/users'); window.dispatchEvent(new Event('popstate')); }}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Users
      </a>

      {/* Header card */}
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-fuchsia-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {userData.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-zinc-100 font-semibold text-base">{userData.name}</h2>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">{userData.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-zinc-500">Role: <span className="text-zinc-300">{userData.role}</span></span>
            <span className="text-xs text-zinc-500">Org: <a
              href={`/admin/organizations/${userData.org_id}`}
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/admin/organizations/${userData.org_id}`); window.dispatchEvent(new Event('popstate')); }}
              className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
            >{userData.org_name}</a></span>
            <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 border ${userData.status === 'active' ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
              {userData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Recent Activity</h3>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {activity.map((log: any) => (
            <div key={log.id} className="flex items-start gap-3 py-2 border-b border-[#1C1C1F] last:border-0">
              <span className="text-xs mt-0.5 text-zinc-600 font-mono">{new Date(log.created_at).toLocaleString()}</span>
              <span className="text-sm text-zinc-300">{log.action}</span>
            </div>
          ))}
          {activity.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-4">No activity found for this user</p>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#111113] border border-red-400/20 rounded-xl p-5 space-y-3">
        <h3 className="text-[10px] font-semibold text-red-400 uppercase tracking-widest">Danger Zone</h3>
        <button
          onClick={toggleSuspend}
          className="bg-transparent hover:bg-red-400/10 text-red-400 border border-red-400/20 hover:border-red-400/40 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
        >
          {userData.status === 'active' ? 'Suspend User' : 'Unsuspend User'}
        </button>
        <p className="text-[10px] text-zinc-600">
          {userData.status === 'active'
            ? 'When suspended, the user cannot log in and sees a "Your account has been suspended" message.'
            : 'Unsuspend to restore access for this user.'}
        </p>
      </div>
    </div>
  );
}
