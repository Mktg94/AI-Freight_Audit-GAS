import { useState, useEffect } from 'react';
import { useAdminAuth } from './useAdminAuth';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import AdminOverview from './AdminOverview';
import AdminOrganizations from './AdminOrganizations';
import AdminOrgDetail from './AdminOrgDetail';
import AdminUsers from './AdminUsers';
import AdminUserDetail from './AdminUserDetail';
import AdminRevenue from './AdminRevenue';
import AdminActivity from './AdminActivity';
import AdminAbuse from './AdminAbuse';
import AdminSettings from './AdminSettings';

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/overview': 'Dashboard',
  '/admin/organizations': 'Organizations',
  '/admin/users': 'Users',
  '/admin/revenue': 'Revenue',
  '/admin/activity': 'Activity Logs',
  '/admin/abuse': 'Abuse Monitor',
  '/admin/settings': 'Settings',
};

function getPageTitle(path: string): string {
  for (const [prefix, title] of Object.entries(pageTitles)) {
    if (path.startsWith(prefix)) return title;
  }
  return 'Dashboard';
}

export default function AdminApp() {
  const { isAdmin, isLoading, user } = useAdminAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-400 text-sm">Verifying access...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    window.location.href = '/auth/login';
    return null;
  }

  const pageTitle = getPageTitle(currentPath);

  const renderPage = () => {
    const path = currentPath;
    if (path === '/admin' || path === '/admin/overview') {
      return <AdminOverview />;
    }
    if (path === '/admin/organizations') {
      return <AdminOrganizations />;
    }
    if (path.startsWith('/admin/organizations/')) {
      return <AdminOrgDetail />;
    }
    if (path === '/admin/users') {
      return <AdminUsers />;
    }
    if (path.startsWith('/admin/users/')) {
      return <AdminUserDetail />;
    }
    if (path === '/admin/revenue') {
      return <AdminRevenue />;
    }
    if (path === '/admin/activity') {
      return <AdminActivity />;
    }
    if (path === '/admin/abuse') {
      return <AdminAbuse />;
    }
    if (path === '/admin/settings') {
      return <AdminSettings />;
    }
    return <AdminOverview />;
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AdminSidebar currentPath={currentPath} user={user} />
      <div className="ml-[200px]">
        <AdminTopBar title={pageTitle} user={user} />
        <main className="p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
