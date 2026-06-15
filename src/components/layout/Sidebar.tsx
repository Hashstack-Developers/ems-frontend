'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { clearAuth, getUser } from '@/lib/auth';
import { getEnabledNavItems, getPageHref } from '@/lib/pages';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const navItems = getEnabledNavItems();
  const mainItems = navItems.filter((item) => item.section !== 'admin');
  const adminItems = navItems.filter((item) => item.section === 'admin');

  const renderLink = (item: (typeof navItems)[number]) => {
    const active =
      pathname === item.href ||
      (item.key === 'settings' && pathname.startsWith('/settings') && item.href === '/settings') ||
      (item.key !== 'settings' && pathname.startsWith(`${item.href}/`));

    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={onNavigate}
        className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:gap-3 ${
          active
            ? 'bg-primary-light text-primary shadow-sm ring-1 ring-primary-soft'
            : 'text-neutral-600 hover:bg-neutral-50 hover:text-foreground hover:translate-x-0.5'
        }`}
      >
        <span className={`nav-icon-3d ${active ? 'nav-icon-3d-active' : ''}`}>{item.icon}</span>
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {mainItems.map(renderLink)}
      {adminItems.length > 0 && (
        <>
          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-light">
            Administration
          </p>
          {adminItems.map(renderLink)}
        </>
      )}
    </>
  );
}

export function Sidebar() {
  const user = getUser();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const settingsAccountHref = getPageHref('settings') ? '/settings/account' : null;

  const handleLogout = () => {
    setLogoutOpen(false);
    setMobileOpen(false);
    clearAuth();
    router.push('/login');
  };

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div>
          <h1 className="text-base font-bold text-primary-hover">EMS</h1>
          <p className="text-[10px] text-muted">Employee Management</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="cursor-pointer rounded-lg border border-border p-2 text-neutral-600 transition-all hover:bg-neutral-50 hover:border-primary-soft hover:text-primary active:scale-95"
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 cursor-pointer bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed top-14 left-0 z-[45] flex h-[calc(100dvh-3.5rem)] w-64 flex-col border-r border-border bg-surface transition-transform duration-300 lg:top-0 lg:z-40 lg:h-screen ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="hidden border-b border-border px-6 py-5 lg:block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-primary-hover">EMS</h1>
              <p className="text-xs text-muted">Employee Management</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 lg:py-4 lg:pt-4">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
        </nav>

        <div className="shrink-0 border-t border-border p-4">
          <p className="truncate text-sm font-medium text-neutral-800">{user?.fullName ?? '—'}</p>
          <p className="truncate text-xs text-muted">{user?.email ?? ''}</p>
          {user?.role && (
            <p className="mt-1 truncate text-[11px] capitalize text-muted-light">{user.roleLabel ?? user.role}</p>
          )}
          {settingsAccountHref && (
            <Link
              href={settingsAccountHref}
              onClick={() => setMobileOpen(false)}
              className="mt-3 block w-full cursor-pointer rounded-xl border border-border px-3 py-2 text-center text-sm text-neutral-600 transition-all hover:border-primary-soft hover:bg-neutral-50 hover:text-primary"
            >
              Account settings
            </Link>
          )}
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="mt-3 w-full cursor-pointer rounded-xl border border-border px-3 py-2 text-sm text-neutral-600 transition-all hover:border-primary-soft hover:bg-neutral-50 hover:text-primary active:scale-[0.99]"
          >
            Sign out
          </button>
        </div>
      </aside>

      <ConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Sign out"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign out"
      />
    </>
  );
}
