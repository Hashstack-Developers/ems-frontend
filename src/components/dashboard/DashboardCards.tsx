'use client';

import { ReactNode } from 'react';
import { SectionCard as BaseSectionCard } from '@/components/layout/PageShell';

const colorMap = {
  indigo: {
    bg: 'from-primary to-primary-dark',
    text: 'text-primary',
    glow: 'hover:shadow-[0_12px_32px_rgba(37,99,235,0.15)]',
  },
  green: {
    bg: 'from-success to-success-dark',
    text: 'text-success',
    glow: 'hover:shadow-[0_12px_32px_rgba(16,185,129,0.15)]',
  },
  amber: {
    bg: 'from-warning to-accent-dark',
    text: 'text-warning',
    glow: 'hover:shadow-[0_12px_32px_rgba(245,158,11,0.15)]',
  },
  purple: {
    bg: 'from-accent to-accent-dark',
    text: 'text-accent-dark',
    glow: 'hover:shadow-[0_12px_32px_rgba(232,160,69,0.2)]',
  },
  teal: {
    bg: 'from-teal-500 to-emerald-600',
    text: 'text-teal-600',
    glow: 'hover:shadow-[0_12px_32px_rgba(20,184,166,0.18)]',
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: keyof typeof colorMap;
  delay?: number;
}

export function StatCard({ title, value, subtitle, icon, color, delay = 0 }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      className={`animate-fade-in-up group card-modern relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 ${c.glow}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
          <p className="mt-1 text-xs text-muted-light">{subtitle}</p>
        </div>
        <div
          className={`icon-3d flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl text-white ring-1 ring-white/25 ${c.bg}`}
        >
          <span className="relative z-10 drop-shadow-sm">{icon}</span>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${c.bg} transition-all duration-500 group-hover:w-full`} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="skeleton h-10 w-48 rounded-lg" />
      <DashboardContentSkeleton />
    </div>
  );
}

export function DashboardContentSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-32 rounded-2xl" />
      <div className="skeleton h-28 rounded-2xl" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  );
}

export function SectionCard(props: React.ComponentProps<typeof BaseSectionCard>) {
  return <BaseSectionCard {...props} />;
}
