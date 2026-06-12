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
      <div className="min-h-screen bg-gray-50 flex overflow-x-hidden" id="dashboard-app-layout">
        <Sidebar />

        <div className="flex-1 flex flex-col md:pl-[220px] min-h-screen w-full">
          <TopBar />

          <main className="flex-grow w-full">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}
