import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  Activity,
  ShieldAlert,
  Settings,
  ArrowLeft,
} from 'lucide-react';

const navItems = [
  { section: 'OVERVIEW', items: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  ]},
  { section: 'USERS', items: [
    { label: 'Organizations', path: '/admin/organizations', icon: Building2 },
    { label: 'Users', path: '/admin/users', icon: Users },
  ]},
  { section: 'FINANCIAL', items: [
    { label: 'Revenue', path: '/admin/revenue', icon: DollarSign },
  ]},
  { section: 'SYSTEM', items: [
    { label: 'Activity Logs', path: '/admin/activity', icon: Activity },
    { label: 'Abuse Monitor', path: '/admin/abuse', icon: ShieldAlert },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ]},
];

export default function AdminSidebar({ currentPath, user }: { currentPath: string; user: any }) {
  const isActive = (path: string) => {
    if (path === '/admin') return currentPath === '/admin' || currentPath === '/admin/overview';
    return currentPath.startsWith(path);
  };

  const userEmail = user?.email || 'admin@freightaudit.com';
  const initials = userEmail.charAt(0).toUpperCase();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[200px] bg-[#0A0A0A] flex flex-col z-50">
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/15">
            <span className="text-white text-[11px] font-bold">FA</span>
          </div>
          <div>
            <div className="text-zinc-100 font-semibold text-sm leading-tight">FreightAudit</div>
            <div className="text-zinc-600 text-[10px] uppercase tracking-[0.15em]">Admin Console</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-2 space-y-5 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="px-5 mb-1.5 text-[9px] font-semibold text-zinc-600 uppercase tracking-[0.15em]">
              {group.section}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', item.path);
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  className={`group flex items-center gap-2.5 px-5 py-2 text-sm transition-all duration-200 ${
                    active
                      ? 'text-zinc-100 bg-[#1A1A1A]'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#121212]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${active ? 'text-blue-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-xl bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {initials}
          </div>
          <span className="text-xs text-zinc-500 truncate">{userEmail}</span>
        </div>
        <a
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/dashboard');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="flex items-center gap-2 px-2 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to App</span>
        </a>
      </div>
    </aside>
  );
}
