"use client";

import React from 'react';
import { useRole } from '@/lib/auth/RoleContext';
import { hasPermission, PermissionAction } from '@/lib/auth/roles';

interface PermissionGateProps {
  action: PermissionAction;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function PermissionGate({
  action,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { role, isLoading } = useRole();

  if (isLoading) {
    // Optionally return nothing or a minimal loading indicator during evaluation
    return null;
  }

  const allowed = hasPermission(role, action);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
