import { getUser } from './auth';

export function getUserPermissions(): string[] {
  return getUser()?.permissions ?? [];
}

export function hasPermission(permission: string): boolean {
  return getUserPermissions().includes(permission);
}

export function hasAnyPermission(...permissions: string[]): boolean {
  const userPermissions = new Set(getUserPermissions());
  return permissions.some((permission) => userPermissions.has(permission));
}

export function hasAllPermissions(...permissions: string[]): boolean {
  const userPermissions = new Set(getUserPermissions());
  return permissions.every((permission) => userPermissions.has(permission));
}
