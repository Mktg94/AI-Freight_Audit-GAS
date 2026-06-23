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
    <aside className="fixed left-0 top-0 h-screen w-[200px] bg-[#09090B] border-r border-[#18181B] flex flex-col z-50">
      <div className="p-4 border-b border-[#18181B]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-fuchsia-500 rounded-md flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">FA</span>
          </div>
          <div>
            <div className="text-zinc-100 font-semibold text-sm leading-tight">FreightAudit</div>
            <div className="text-zinc-600 text-[10px] uppercase tracking-widest">Admin Console</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 space-y-4 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="px-4 mb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
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
                  className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-[#18181B] text-zinc-100 border-l-2 border-fuchsia-500 pl-[10px]'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#111113]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-[#18181B] p-3 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {initials}
          </div>
          <span className="text-xs text-zinc-400 truncate">{userEmail}</span>
        </div>
        <a
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/dashboard');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="flex items-center gap-2 px-3 py-2 mx-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-[#111113] transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Back to App</span>
        </a>
      </div>
    </aside>
  );
}
