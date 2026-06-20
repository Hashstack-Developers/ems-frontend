'use client';

import { ReactNode } from 'react';
import { RefetchButton } from '@/components/ui/RefetchButton';

export function PageContainer({
  children,
  className = '',
  fill = false,
}: {
  children: ReactNode;
  className?: string;
  fill?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-none ${fill ? 'flex min-h-0 flex-1 flex-col' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  onRefetch,
  refetching = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onRefetch?: () => void;
  refetching?: boolean;
}) {
  return (
    <div className="animate-fade-in-up mb-6 flex shrink-0 flex-wrap items-start justify-between gap-4 sm:mb-6">
      <div>
        <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      {(onRefetch || actions) && (
        <div className="ml-auto flex flex-wrap items-end justify-end gap-3">
          {onRefetch && <RefetchButton onClick={onRefetch} loading={refetching} />}
          {actions}
        </div>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  delay = 0,
  scrollable = false,
  fill = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  delay?: number;
  scrollable?: boolean;
  fill?: boolean;
}) {
  return (
    <div
      className={`animate-fade-in-up card-modern p-5 sm:p-6 ${fill ? 'flex min-h-0 flex-1 flex-col' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-5 shrink-0">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {scrollable ? (
        <div className={`scroll-area min-h-0 flex-1 overflow-y-auto pr-1 ${fill ? '' : 'max-h-[420px]'}`}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function DataTableCard({
  header,
  children,
  minWidth = 'min-w-[1080px]',
  className = '',
  fill = true,
}: {
  header: ReactNode;
  children: ReactNode;
  minWidth?: string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <div
      className={`card-modern flex min-h-0 flex-col overflow-hidden ${fill ? 'flex-1' : ''} ${className}`}
    >
      <div className="scroll-area min-h-0 flex-1 overflow-auto">
        <table className={`data-table w-full ${minWidth}`}>
          <thead>
            <tr>{header}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function ScrollableList({
  children,
  className = '',
  fill = true,
}: {
  children: ReactNode;
  className?: string;
  fill?: boolean;
}) {
  return (
    <div
      className={`scroll-area min-h-0 overflow-y-auto pr-1 ${fill ? 'flex-1' : 'max-h-[520px]'} ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  icon = '📋',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border py-12 text-center">
      <p className="text-4xl">{icon}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card-modern mt-6 shrink-0 p-5 text-sm text-neutral-600 sm:p-6">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="card-modern mb-6 flex shrink-0 flex-wrap items-end gap-4 p-4 sm:p-5">{children}</div>
  );
}

export function StatBanner({ children }: { children: ReactNode }) {
  return (
    <div className="banner-soft mb-6 grid shrink-0 grid-cols-1 gap-4 p-5 sm:grid-cols-3 sm:gap-6 sm:p-6">
      {children}
    </div>
  );
}

export function StatBannerItem({
  label,
  value,
  valueClassName = 'text-foreground',
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold sm:text-2xl ${valueClassName}`}>{value}</p>
    </div>
  );
}

export function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={className}>{children}</th>;
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={className}>{children}</td>;
}
