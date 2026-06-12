"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Menu, Bell, Check, Shield } from 'lucide-react';

export default function TopBar() {
  const [initials, setInitials] = useState('AA');
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);

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
  }, []);

  const triggerMobileMenu = () => {
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
  };

  const notificationList = [
    { id: 1, text: "Invoice #INV-2041 billing discrepancy of $240.00 audited & flag raised.", time: "10 mins ago" },
    { id: 2, text: "YRC Carrier representative downloaded approved settlement credit.", time: "2 hrs ago" },
  ];

  return (
    <header 
      id="workspace-top-navigation-bar"
      className="bg-white border-b border-gray-100 h-14 flex items-center justify-between px-6 sticky top-0 z-30"
    >
      
      {/* Left: Mobile hamburger + status */}
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

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-4 relative">
        
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasNotifications(false);
            }}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-lg transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell size={16} />
            {hasNotifications && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-72 bg-white border border-gray-100 rounded-xl p-4 shadow-lg z-50 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-900 tracking-wider">Carrier Billing Alerts</span>
                <span className="text-[9px] text-indigo-600 font-semibold flex items-center gap-0.5"><Check size={8} /> Sync Active</span>
              </div>
              
              <div className="space-y-3.5 max-h-48 overflow-y-auto">
                {notificationList.map((notif) => (
                  <div key={notif.id} className="text-[11px] leading-relaxed text-left">
                     <p className="text-gray-700">{notif.text}</p>
                     <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <span className="w-px h-5 bg-gray-200" />

        {/* User avatar initials */}
        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold font-mono flex items-center justify-center select-none">
          {initials}
        </div>

      </div>

    </header>
  );
}
