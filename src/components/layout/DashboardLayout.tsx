'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { AppShellSkeleton, DashboardLayoutSkeleton } from '@/components/ui/Skeletons';
import { PageGuard } from './PageGuard';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setAuthed(authenticated);
    setReady(true);
    if (!authenticated) {
      router.replace('/login');
    }
  }, [router]);

  if (!ready) {
    return <DashboardLayoutSkeleton />;
  }

  if (!authed) {
    return <AppShellSkeleton />;
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex h-screen flex-col overflow-hidden pt-14 lg:ml-64 lg:pt-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-5 lg:p-6">
          <PageGuard>{children}</PageGuard>
        </div>
      </main>
    </div>
  );
}
