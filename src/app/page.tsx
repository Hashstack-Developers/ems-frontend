'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getDefaultRoute } from '@/lib/pages';
import { AppShellSkeleton } from '@/components/ui/Skeletons';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated() ? getDefaultRoute() : '/login');
  }, [router]);

  return (
    <AppShellSkeleton />
  );
}
