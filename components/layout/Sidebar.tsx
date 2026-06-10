"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, FileText, FileSignature, AlertCircle, 
  BarChart2, Settings, LogOut, Ship, X, User, Globe 
} from 'lucide-react';
import { useRole } from '@/lib/auth/RoleContext';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pathname, setPathname] = useState('/dashboard');
  const [userEmail, setUserEmail] = useState('audit@atlaslogistics.com');
  const [userName, setUserName] = useState('Atlas Audit Team');

  // Load pathname and setup popstate event listeners for routing synchronicity
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
      
      const handleLocationChange = () => {
        setPathname(window.location.pathname);
      };
      
      window.addEventListener('popstate', handleLocationChange);
      
      // Responsive Sidebar events dispatched by hamburger in TopBar
      const handleToggleSidebar = () => {
        setIsOpen(prev => !prev);
      };
      window.addEventListener('toggle-sidebar', handleToggleSidebar);

      return () => {
        window.removeEventListener('popstate', handleLocationChange);
        window.removeEventListener('toggle-sidebar', handleToggleSidebar);
      };
    }
  }, []);

  // Fetch Supabase authenticated meta details or fall back to mock profile
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder')) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUserEmail(session.user.email || 'user@company.com');
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Atlas Audit User');
        }
      });
    } else {
      // Local caching verification
      const cached = localStorage.getItem('fa_mock_session');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.user) {
            setUserEmail(parsed.user.email || 'audit@atlaslogistics.com');
            setUserName(parsed.user.user_metadata?.full_name || 'Atlas Audit User');
          }
        } catch (e) {}
      }
    }
  }, []);

  const navigateTo = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
    setPathname(path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    localStorage.removeItem('fa_mock_session');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder')) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase logout issue:', err);
      }
    }
    
    window.history.pushState({}, '', '/auth/login');
    window.dispatchEvent(new Event('popstate'));
  };

  const { role } = useRole();

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Invoices', path: '/invoices', icon: FileText },
    { label: 'Contracts', path: '/contracts', icon: FileSignature },
    { label: 'Disputes', path: '/disputes', icon: AlertCircle },
    { label: 'Reports', path: '/reports', icon: BarChart2 },
  ];

  if (role === 'admin') {
    navLinks.push({ label: 'Settings', path: '/settings', icon: Settings });
  }

  // Role display helpers
  const getRoleConfig = (currentRole: string) => {
    switch (currentRole) {
      case 'admin':
        return { label: 'Admin', style: 'bg-teal-500/10 text-[#2dd4bf] border-[#2dd4bf]/20' };
      case 'logistics_manager':
        return { label: 'Logistics Manager', style: 'bg-blue-500/10 text-[#3b82f6] border-[#3b82f6]/20' };
      case 'finance_clerk':
        return { label: 'Finance Clerk', style: 'bg-amber-500/10 text-[#f59e0b] border-[#f59e0b]/20' };
      case 'operations_coordinator':
        return { label: 'Operations Coord.', style: 'bg-slate-500/10 text-[#94a3b8] border-[#94a3b8]/20' };
      default:
        return { label: 'Auditor', style: 'bg-zinc-800 text-zinc-400 border border-zinc-700/60' };
    }
  };
  const roleConfig = getRoleConfig(role);

  return (
    <>
      {/* Mobile Back-drop overlay when responsive side-drawer is active */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Persistent Desktop + Mobile Slide-Out Drawer Sidebar */}
      <aside 
        id="side-navigation-panel"
        className={`fixed top-0 bottom-0 left-0 w-[240px] bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col justify-between z-50 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1">
          {/* Logo Branding and Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20">
                <Ship size={16} className="text-[var(--accent-color)]" />
              </div>
              <span className="text-sm font-bold tracking-tight text-[var(--text-primary)] font-display">
                FreightAudit <span className="text-[var(--accent-color)]">AI</span>
              </span>
            </div>
            
            {/* Close trigger (mobile only) */}
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation link block queue */}
          <nav className="p-4 space-y-1" role="navigation">
            {navLinks.map((link) => {
              const IconComp = link.icon;
              const isActive = pathname === link.path || (link.path !== '/dashboard' && pathname.startsWith(link.path));
              
              return (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={(e) => navigateTo(link.path, e)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive 
                      ? 'border-l-2 border-[var(--accent-color)] text-[var(--accent-color)] bg-[var(--accent-color)]/10' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <IconComp size={15} className="shrink-0" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* User Identity Profile Footer Area */}
        <div className="p-4 border-t border-[var(--border-color)] space-y-3.5 bg-[var(--bg-primary)]/40" id="sidebar-user-anchor">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--accent-color)] h-8 w-8 flex items-center justify-center shrink-0">
              <User size={14} />
            </div>
            <div className="overflow-hidden leading-snug text-left flex-1">
              <span className="text-[11px] font-bold text-[var(--text-primary)] block truncate leading-tight mb-0.5">{userName}</span>
              <span className="text-[9px] text-[var(--text-secondary)] block truncate font-mono mb-1.5 leading-tight">{userEmail}</span>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold font-mono border ${roleConfig.style}`}>
                {roleConfig.label}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[var(--danger-color)]/5 hover:bg-[var(--danger-color)]/10 border border-[var(--danger-color)]/10 hover:border-[var(--danger-color)]/20 text-[var(--danger-color)] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <LogOut size={11} />
            <span>Sign Out Auditor</span>
          </button>
        </div>
      </aside>
    </>
  );
}
