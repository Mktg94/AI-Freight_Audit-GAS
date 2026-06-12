"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, FileText, FileSignature, AlertCircle, 
  BarChart2, Settings, LogOut, X, User
} from 'lucide-react';
import { useRole } from '@/lib/auth/RoleContext';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pathname, setPathname] = useState('/dashboard');
  const [userEmail, setUserEmail] = useState('audit@atlaslogistics.com');
  const [userName, setUserName] = useState('Atlas Audit Team');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
      
      const handleLocationChange = () => {
        setPathname(window.location.pathname);
      };
      
      window.addEventListener('popstate', handleLocationChange);
      
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

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder')) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUserEmail(session.user.email || 'user@company.com');
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User');
        }
      });
    } else {
      const cached = localStorage.getItem('fa_mock_session');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.user) {
            setUserEmail(parsed.user.email || 'audit@atlaslogistics.com');
            setUserName(parsed.user.user_metadata?.full_name || 'User');
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

  const getRoleConfig = (currentRole: string) => {
    switch (currentRole) {
      case 'admin':
        return { label: 'Admin', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'logistics_manager':
        return { label: 'Logistics Manager', style: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'finance_clerk':
        return { label: 'Finance Clerk', style: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'operations_coordinator':
        return { label: 'Operations Coord.', style: 'bg-gray-100 text-gray-600 border-gray-200' };
      default:
        return { label: 'Auditor', style: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
  };
  const roleConfig = getRoleConfig(role);

  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        id="side-navigation-panel"
        className={`fixed top-0 bottom-0 left-0 w-[220px] bg-white border-r border-gray-100 flex flex-col justify-between z-50 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1">
          {/* Logo Branding */}
          <div className="px-5 pt-5 pb-4">
            <a href="/dashboard" onClick={(e) => navigateTo('/dashboard', e)} className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-sm text-white">F</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">
                FreightAudit <span className="text-indigo-600">AI</span>
              </span>
            </a>
            <span className="inline-block mt-1.5 bg-indigo-50 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-semibold">
              Beta
            </span>
          </div>

          {/* Close button (mobile) */}
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Navigation */}
          <nav className="px-3 space-y-0.5" role="navigation">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mt-4 mb-2 block">
              Main
            </span>
            {navLinks.map((link) => {
              const IconComp = link.icon;
              const isActive = pathname === link.path || (link.path !== '/dashboard' && pathname.startsWith(link.path));
              
              return (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={(e) => navigateTo(link.path, e)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg mx-0 text-sm font-medium transition-colors duration-150 ${
                    isActive 
                      ? 'text-indigo-600 bg-indigo-50 border-l-2 border-indigo-600 -ml-[1px] pl-[13px]' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconComp size={16} className="shrink-0" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-gray-100 p-3 mt-auto">
          <div className="flex items-center gap-3 px-1 mb-3">
            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-mono font-semibold flex items-center justify-center shrink-0">
              {getInitials(userName)}
            </div>
            <div className="overflow-hidden leading-snug text-left flex-1 min-w-0">
              <span className="text-sm text-gray-900 font-medium block truncate">{userName}</span>
              <span className="text-xs text-gray-500 block truncate">{userEmail}</span>
            </div>
          </div>
          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold font-mono border mx-1 mb-2 ${roleConfig.style}`}>
            {roleConfig.label}
          </span>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-gray-400 hover:text-gray-700 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer mt-2"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
