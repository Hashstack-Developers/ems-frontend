'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDefaultRoute, getPageKeyFromPath, userHasPageAccess } from '@/lib/pages';
import { SkeletonBar } from '@/components/ui/Skeletons';

export function PageGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const key = getPageKeyFromPath(pathname);
    if (key && !userHasPageAccess(key)) {
      setAllowed(false);
      router.replace(getDefaultRoute());
      return;
    }
    setAllowed(true);
  }, [pathname, router]);

  const key = getPageKeyFromPath(pathname);
  if (key && !userHasPageAccess(key) && !allowed) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 animate-fade-in">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="h-4 w-64" />
        <div className="card-modern min-h-0 flex-1 space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBar key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return children;
}
