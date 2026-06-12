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
  const [role, setRoleState] = useState<UserRole>('admin');
  const [orgId, setOrgId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Allow setting the role (great for testing inside Settings/Appearance)
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

          // Find organization
          let activeOrgId = '';
          try {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('id')
              .limit(1)
              .maybeSingle();
            if (orgData?.id) {
              setOrgId(orgData.id);
              activeOrgId = orgData.id;
            }
          } catch {
            // organizations table may not exist yet
          }

          if (!activeOrgId) {
            setRoleState('admin');
            return;
          }

          // Check if there is an override in localStorage first for demonstration/evaluation
          const cachedRole = localStorage.getItem('freight_audit_active_role');
          if (cachedRole && ['admin', 'logistics_manager', 'finance_clerk', 'operations_coordinator'].includes(cachedRole)) {
            setRoleState(cachedRole as UserRole);
          } else {
            // Find role in org_members
            try {
              const { data: memberData } = await supabase
                .from('org_members')
                .select('role')
                .eq('org_id', activeOrgId)
                .eq('user_id', user.id)
                .maybeSingle();

              if (memberData?.role) {
                setRoleState(memberData.role as UserRole);
                return;
              }
            } catch {
              // org_members table may not exist yet
            }

            try {
              const { data: orgOwnerData } = await supabase
                .from('organizations')
                .select('owner_id')
                .eq('id', activeOrgId)
                .maybeSingle();

              if (orgOwnerData?.owner_id === user.id) {
                setRoleState('admin');
              } else {
                setRoleState('admin');
              }
            } catch {
              setRoleState('admin');
            }
          }
        } else {
          // No user, check local storage for demo
          const cachedRole = localStorage.getItem('freight_audit_active_role');
          if (cachedRole) {
            setRoleState(cachedRole as UserRole);
          }
        }
      } catch (err) {
        console.warn("Role Context Init failure, running in sandbox fallback mode:", err);
        // Sandbox default fallback values
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
