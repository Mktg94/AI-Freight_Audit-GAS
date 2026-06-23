import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Download, Shield } from 'lucide-react';

export default function AdminSettings() {
  const [adminInfo, setAdminInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchAdminInfo() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setAdminInfo({ user_id: session.user.id, email: session.user.email });
        }
      } catch {}
    }
    fetchAdminInfo();
  }, []);

  async function exportCSV(type: 'orgs' | 'users') {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/admin/${type === 'orgs' ? 'orgs' : 'users'}?limit=10000`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    const items = data.data || [];
    let csv = '';
    if (type === 'orgs') {
      csv = 'name,owner_email,plan,status,created_at\n' +
        items.map((o: any) => `"${o.name}","${o.owner_email}","${o.plan}","${o.status}","${o.created_at}"`).join('\n');
    } else {
      csv = 'email,name,org_name,role,status\n' +
        items.map((u: any) => `"${u.email}","${u.name}","${u.org_name}","${u.role}","${u.status}"`).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${type}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-4">
        <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Platform Plan Limits</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'Free', invoiceLimit: 10, seats: 1, price: '$0' },
            { name: 'Starter', invoiceLimit: 100, seats: 3, price: '$99/mo' },
            { name: 'Professional', invoiceLimit: 500, seats: 10, price: '$299/mo' },
          ].map((plan) => (
            <div key={plan.name} className="bg-[#18181B] rounded-lg p-3 space-y-1">
              <div className="text-sm font-medium text-zinc-200">{plan.name}</div>
              <div className="text-xs text-zinc-500">Invoices: {plan.invoiceLimit}/mo</div>
              <div className="text-xs text-zinc-500">Seats: {plan.seats}</div>
              <div className="text-xs text-zinc-500">{plan.price}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600">To change plan limits, update the PLANS constant in your codebase.</p>
      </div>

      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-fuchsia-400" />
          <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Super Admins</h3>
        </div>
        <table className="w-full">
          <thead className="bg-[#18181B] border-b border-[#27272A]">
            <tr>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-left">User ID</th>
              <th className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest py-2 px-4 text-left">Email</th>
            </tr>
          </thead>
          <tbody>
            {adminInfo && (
              <tr className="border-b border-[#1C1C1F]">
                <td className="text-sm py-2.5 px-4 font-mono text-xs text-zinc-300">{adminInfo.user_id}</td>
                <td className="text-sm py-2.5 px-4 font-mono text-xs text-zinc-500">{adminInfo.email}</td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="text-[10px] text-zinc-600">To add a super admin, insert directly in Supabase.</p>
      </div>

      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-3">
        <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Data Export</h3>
        <div className="flex gap-3">
          <button onClick={() => exportCSV('orgs')}
            className="bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Download className="w-3 h-3" /> Export Organizations CSV
          </button>
          <button onClick={() => exportCSV('users')}
            className="bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Download className="w-3 h-3" /> Export Users CSV
          </button>
        </div>
      </div>

      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-2">
        <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Announcements</h3>
        <p className="text-xs text-zinc-600">System-wide announcement banner — coming soon</p>
        <p className="text-[10px] text-zinc-700">This will let you show a banner to all users in the main app.</p>
      </div>
    </div>
  );
}
