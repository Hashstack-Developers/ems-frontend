import { pageNavItems, pagesConfig, MODULE_NAV_PERMISSION } from '@/constants/pages.config';
import { getUser, isSuperRole } from './auth';

export type PageKey = keyof typeof pagesConfig;

export { pagesConfig, pageNavItems, MODULE_NAV_PERMISSION };

const SUPER_ONLY_PAGES = new Set(['users', 'roles']);

export function isPageEnabled(key: string): boolean {
  return pagesConfig[key] ?? false;
}

export function userHasPageAccess(key: string): boolean {
  if (!isPageEnabled(key)) {
    return false;
  }

  if (SUPER_ONLY_PAGES.has(key) && !isSuperRole()) {
    return false;
  }

  const requiredPermission = MODULE_NAV_PERMISSION[key];
  if (!requiredPermission) {
    return true;
  }

  const permissions = getUser()?.permissions ?? [];
  return permissions.includes(requiredPermission);
}

export function getEnabledNavItems() {
  return pageNavItems.filter((item) => userHasPageAccess(item.key));
}

export function getPageKeyFromPath(pathname: string): string | null {
  if (pathname.startsWith('/taxes')) {
    return 'taxes' in pagesConfig ? 'taxes' : null;
  }

  if (pathname.startsWith('/gp-fund')) {
    return 'gpFund' in pagesConfig ? 'gpFund' : null;
  }

  if (pathname.startsWith('/allowances')) {
    return 'allowances' in pagesConfig ? 'allowances' : null;
  }

  if (pathname.startsWith('/pension')) {
    return 'pension' in pagesConfig ? 'pension' : null;
  }

  if (pathname.startsWith('/increments')) {
    return 'increments' in pagesConfig ? 'increments' : null;
  }

  if (pathname.startsWith('/settings/users')) {
    return 'users' in pagesConfig ? 'users' : null;
  }

  if (pathname.startsWith('/settings/roles')) {
    return 'roles' in pagesConfig ? 'roles' : null;
  }

  if (pathname.startsWith('/settings')) {
    return 'settings' in pagesConfig ? 'settings' : null;
  }

  const match = pageNavItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.key ?? null;
}

export function getDefaultRoute(): string {
  const enabled = getEnabledNavItems();
  return enabled[0]?.href ?? '/settings/account';
}

const SETTINGS_PAGE_HREFS: Record<string, string> = {
  users: '/settings/users',
  roles: '/settings/roles',
};

export function getPageHref(key: string): string | null {
  if (!userHasPageAccess(key)) return null;
  const navHref = pageNavItems.find((item) => item.key === key)?.href;
  if (navHref) return navHref;
  return SETTINGS_PAGE_HREFS[key] ?? null;
}
