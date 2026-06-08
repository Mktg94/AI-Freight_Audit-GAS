"use client";

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { RoleProvider } from '@/lib/auth/RoleContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProvider>
      <div className="min-h-screen bg-[#0A0F1E] flex text-[#F1F5F9] overflow-x-hidden" id="dashboard-app-layout">
        {/* Navigation sidebar */}
        <Sidebar />

        {/* Main workspace arena */}
        <div className="flex-1 flex flex-col md:pl-[240px] min-h-screen w-full">
          {/* Persistent contextual header navigation */}
          <TopBar />

          {/* Core application content routing */}
          <main className="flex-grow p-4 md:p-8 w-full max-w-7xl mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}

