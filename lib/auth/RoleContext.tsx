"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from './roles';

interface RoleContextType {
  role: UserRole;
  orgId: string;
  userId: string;
  isLoading: boolean;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('operations_coordinator');
  const [orgId, setOrgId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Allow setting the role (for testing inside Settings > Security & Roles)
  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('freight_audit_active_role', newRole);
    }
  };

  useEffect(() => {
    const initRole = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);

          // Check if there is an override in localStorage first
          const cachedRole = localStorage.getItem('freight_audit_active_role');
          if (cachedRole && ['admin', 'logistics_manager', 'finance_clerk', 'operations_coordinator'].includes(cachedRole)) {
            setRoleState(cachedRole as UserRole);
            setIsLoading(false);
            return;
          }

          // Fetch session token for API auth
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (token) {
            const res = await fetch('/api/team/my-role', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const result = await res.json();
              if (result.success && result.data) {
                setRoleState((result.data.role || 'operations_coordinator') as UserRole);
                setOrgId(result.data.org_id || '');
                setIsLoading(false);
                return;
              }
            }
          }

          // Fallback: direct Supabase query
          const { data: orgData } = await supabase
            .from('organizations')
            .select('id, owner_id')
            .limit(1)
            .maybeSingle();

          if (orgData) {
            setOrgId(orgData.id);

            const { data: memberData } = await supabase
              .from('org_members')
              .select('role')
              .eq('org_id', orgData.id)
              .eq('user_id', user.id)
              .maybeSingle();

            if (memberData?.role) {
              setRoleState(memberData.role as UserRole);
            } else if (orgData.owner_id === user.id) {
              setRoleState('admin');
            } else {
              setRoleState('operations_coordinator');
            }
          }
        } else {
          const cachedRole = localStorage.getItem('freight_audit_active_role');
          if (cachedRole) {
            setRoleState(cachedRole as UserRole);
          }
        }
      } catch (err) {
        console.warn("Role Context Init failure, running in sandbox fallback mode:", err);
        const cachedRole = localStorage.getItem('freight_audit_active_role');
        if (cachedRole) {
          setRoleState(cachedRole as UserRole);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initRole();
  }, []);

  return (
    <RoleContext.Provider value={{ role, orgId, userId, isLoading, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
