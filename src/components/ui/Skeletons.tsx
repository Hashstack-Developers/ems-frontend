'use client';

const widthPattern = ['w-[55%]', 'w-[75%]', 'w-[45%]', 'w-[65%]', 'w-[50%]', 'w-[70%]', 'w-[40%]'];

export function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 flex shrink-0 flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBar className="h-8 w-44 sm:w-52" />
        <SkeletonBar className="h-4 w-56 sm:w-72" />
      </div>
      <SkeletonBar className="h-10 w-28 sm:w-36" />
    </div>
  );
}

export function StatBannerSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className="banner-soft mb-6 grid shrink-0 grid-cols-1 gap-4 p-5 sm:grid-cols-3 sm:gap-6 sm:p-6">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-7 w-28 sm:h-8 sm:w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableBodySkeleton({
  rows = 8,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3.5">
              <SkeletonBar
                className={`h-4 ${widthPattern[(rowIndex + colIndex) % widthPattern.length]}`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function PayrollListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-modern space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBar className="h-5 w-44" />
              <SkeletonBar className="h-4 w-56" />
            </div>
            <div className="flex gap-2">
              <SkeletonBar className="h-6 w-16 rounded-full" />
              <SkeletonBar className="h-8 w-16" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <SkeletonBar className="h-3 w-12" />
                <SkeletonBar className="h-5 w-20" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <SkeletonBar className="h-6 w-24 rounded-lg" />
            <SkeletonBar className="h-6 w-28 rounded-lg" />
            <SkeletonBar className="h-6 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaxSlabsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-6 pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-modern overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBar className="h-6 w-40" />
              <SkeletonBar className="h-4 w-72 max-w-full" />
            </div>
            <div className="flex gap-2">
              <SkeletonBar className="h-8 w-20" />
              <SkeletonBar className="h-8 w-16" />
            </div>
          </div>
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-center justify-between">
              <SkeletonBar className="h-4 w-24" />
              <SkeletonBar className="h-8 w-28" />
            </div>
            <div className="space-y-2 rounded-lg border border-border-light p-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <SkeletonBar key={j} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SettingsProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card-modern space-y-4 p-5 sm:p-6">
        <SkeletonBar className="h-6 w-24" />
        <SkeletonBar className="h-4 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBar className="h-3 w-16" />
              <SkeletonBar className="h-5 w-40" />
            </div>
          ))}
        </div>
      </div>
      <div className="card-modern space-y-4 p-5 sm:p-6">
        <SkeletonBar className="h-6 w-36" />
        <SkeletonBar className="h-4 w-56" />
        <div className="max-w-md space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBar className="h-4 w-28" />
              <SkeletonBar className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <SkeletonBar className="h-10 w-36" />
        </div>
      </div>
    </div>
  );
}

export function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <SkeletonBar className="mx-auto h-14 w-14 rounded-2xl" />
        <SkeletonBar className="mx-auto h-5 w-40" />
        <SkeletonBar className="mx-auto h-4 w-56" />
      </div>
    </div>
  );
}

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden w-64 shrink-0 border-r border-border p-4 lg:block">
        <SkeletonBar className="mb-6 h-10 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBar key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
        <PageHeaderSkeleton />
        <StatBannerSkeleton />
        <div className="card-modern min-h-0 flex-1 overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <div className="flex gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBar key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>
          <div className="space-y-0 p-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-border-light px-4 py-3.5 last:border-0">
                {Array.from({ length: 5 }).map((_, j) => (
                  <SkeletonBar key={j} className={`h-4 flex-1 ${widthPattern[j % widthPattern.length]}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
