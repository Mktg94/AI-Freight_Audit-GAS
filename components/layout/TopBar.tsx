"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Menu, Bell, Shield } from 'lucide-react';

export default function TopBar() {
  const [initials, setInitials] = useState('AA');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch('/api/notifications', { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        const lastSeen = localStorage.getItem('fa_last_seen_notification');
        const count = (data.notifications || []).filter(
          (n: any) => !lastSeen || new Date(n.created_at).getTime() > parseInt(lastSeen),
        ).length;
        setUnreadCount(count);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const getInitials = (nameStr: string) => {
      const parts = nameStr.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    };

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder')) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata;
          const name = userMeta?.full_name || session.user.email || 'Admin';
          setInitials(getInitials(name));
        }
      });
    } else {
      const cached = localStorage.getItem('fa_mock_session');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.user) {
            const name = parsed.user.user_metadata?.full_name || parsed.user.email || 'Admin';
            setInitials(getInitials(name));
          }
        } catch (e) {}
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      localStorage.setItem('fa_last_seen_notification', Date.now().toString());
      setUnreadCount(0);
    }
  };

  const triggerMobileMenu = () => {
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
  };

  return (
    <header 
      id="workspace-top-navigation-bar"
      className="bg-white border-b border-gray-100 h-14 flex items-center justify-between px-6 sticky top-0 z-30"
    >
      
      <div className="flex items-center gap-4">
        <button
          onClick={triggerMobileMenu}
          className="md:hidden text-gray-600 hover:text-gray-900 p-1.5 rounded-lg border border-gray-200 bg-white transition-colors focus:outline-none cursor-pointer"
          aria-label="Toggle Navigation drawer"
        >
          <Menu size={18} />
        </button>
        
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-400 font-mono uppercase tracking-wider">
          <Shield size={12} className="text-indigo-500" />
          <span>Audit Engine Active</span>
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-lg transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-gray-100 rounded-xl p-4 shadow-lg z-50 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-900 tracking-wider">
                  {loading ? 'Loading...' : 'Notifications'}
                </span>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.length === 0 && !loading && (
                  <p className="text-[11px] text-gray-400 text-center py-4">No recent notifications</p>
                )}
                {notifications.map((notif: any) => (
                  <div key={notif.id} className="text-[11px] leading-relaxed text-left">
                     <p className="text-gray-700">{notif.text}</p>
                     <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <span className="w-px h-5 bg-gray-200" />

        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold font-mono flex items-center justify-center select-none">
          {initials}
        </div>

      </div>

    </header>
  );
}
