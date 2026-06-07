import { pageNavItems, pagesConfig, type PageKey } from '@/constants/pages.config';

export { pagesConfig, pageNavItems, type PageKey };

export function isPageEnabled(key: PageKey): boolean {
  return pagesConfig[key];
}

export function getEnabledNavItems() {
  return pageNavItems.filter((item) => pagesConfig[item.key]);
}

export function getPageKeyFromPath(pathname: string): PageKey | null {
  if (pathname.startsWith('/settings')) {
    return 'settings' in pagesConfig ? 'settings' : null;
  }

  const match = pageNavItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.key ?? null;
}

/** First enabled page — used after login & when a disabled route is opened */
export function getDefaultRoute(): string {
  const enabled = getEnabledNavItems();
  return enabled[0]?.href ?? '/dashboard';
}

export function getPageHref(key: PageKey): string | null {
  if (!isPageEnabled(key)) return null;
  return pageNavItems.find((item) => item.key === key)?.href ?? null;
}
