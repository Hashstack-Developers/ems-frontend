'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageContainer, PageHeader } from '@/components/layout/PageShell';
import { userHasPageAccess } from '@/lib/pages';
import { SettingsActionsProvider, useSettingsActions } from './SettingsActionsContext';

const settingsLinks = [
  { href: '/settings/account', label: 'Account', icon: '👤', pageKey: 'settings' },
  { href: '/settings/users', label: 'Users', icon: '🛡️', pageKey: 'users' },
  { href: '/settings/roles', label: 'Roles', icon: '🔐', pageKey: 'roles' },
];

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { triggerRefetch, refetching } = useSettingsActions();
  const showRefetch = pathname === '/settings/account';
  const visibleLinks = settingsLinks.filter((link) => userHasPageAccess(link.pageKey));

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, users, and access control"
        onRefetch={showRefetch ? triggerRefetch : undefined}
        refetching={refetching}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav className="card-modern shrink-0 p-2 lg:w-44">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-light">
            Menu
          </p>
          {visibleLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-light text-primary shadow-sm ring-1 ring-primary-soft'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-foreground'
                }`}
              >
                <span className={`nav-icon-3d text-xs ${active ? 'nav-icon-3d-active' : ''}`}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 overflow-x-auto">{children}</div>
      </div>
    </PageContainer>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsActionsProvider>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </SettingsActionsProvider>
  );
}
