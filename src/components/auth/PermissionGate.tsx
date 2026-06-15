'use client';

import { hasPermission } from '@/lib/permissions';

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}
