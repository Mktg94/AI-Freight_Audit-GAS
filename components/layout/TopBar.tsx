"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Menu, Bell, Shield, Sparkles, Check } from 'lucide-react';

export default function TopBar() {
  const [initials, setInitials] = useState('AA');
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);

  // Load name initials from auth session state or fallback cache
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
            const name = parsed.user.user_metadata?.full_name || parsed.user.email || 'Atlas Admin';
            setInitials(getInitials(name));
          }
        } catch (e) {}
      }
    }
  }, []);

  const triggerMobileMenu = () => {
    // Dispatch custom event to reactive Sidebar component 
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
      className="bg-[var(--bg-surface)] border-b border-[var(--border-color)] h-16 flex items-center justify-between px-6 sticky top-0 z-30"
    >
      
      {/* Left: Mobile hamburger menu toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={triggerMobileMenu}
          className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] transition-colors focus:outline-none"
          aria-label="Toggle Navigation drawer"
        >
          <Menu size={18} />
        </button>
        
        {/* Page status or sub-heading (hidden on narrow screens) */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-mono selection-transparent uppercase tracking-wider">
          <Shield size={12} className="text-[var(--accent-color)]" />
          <span>Audit Engine Active & Encrypted</span>
        </div>
      </div>

      {/* Right: Notification Alerts + Initials Avatar */}
      <div className="flex items-center gap-4 relative">
        
        {/* Notification Bell with alert dot indicator */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasNotifications(false); // cleared on click
            }}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors relative cursor-pointer"
            title="System Alert Reports"
          >
            <Bell size={16} />
            {hasNotifications && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-[var(--danger-color)] rounded-full animate-pulse" />
            )}
          </button>

          {/* Quick Notification Drops Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-72 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-4 shadow-xl z-50 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
                <span className="text-[10px] uppercase font-black text-[var(--text-primary)] px-0.5 tracking-wider">Carrier Billing Alerts</span>
                <span className="text-[9px] text-[var(--accent-color)] font-semibold flex items-center gap-0.5"><Check size={8} /> Sync Active</span>
              </div>
              
              <div className="space-y-3.5 max-h-48 overflow-y-auto">
                {notificationList.map((notif) => (
                  <div key={notif.id} className="text-[11px] leading-relaxed text-left">
                     <p className="text-[var(--text-primary)]">{notif.text}</p>
                     <span className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5 block">{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider line */}
        <span className="h-4 w-px bg-[var(--border-color)]" />

        {/* User initials circle avatar container */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center select-none cursor-pointer hover:bg-[var(--bg-surface)] transition-colors">
            <span className="text-[10px] font-bold text-[var(--accent-color)] font-sans tracking-tight">
              {initials}
            </span>
          </div>
        </div>

      </div>

    </header>
  );
}
