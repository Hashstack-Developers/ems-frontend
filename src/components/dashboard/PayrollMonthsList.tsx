'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/format';
import { getPageHref } from '@/lib/pages';
import type { PayrollMonthSummary } from '@/types';

export function PayrollMonthsList({ months }: { months: PayrollMonthSummary[] }) {
  const payrollsHref = getPageHref('payrolls');

  if (months.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center">
        <p className="text-4xl">📋</p>
        <p className="mt-2 text-sm text-muted">No payrolls generated yet</p>
        {payrollsHref && (
          <Link href={payrollsHref} className="mt-3 inline-block text-sm font-medium text-primary transition hover:text-primary-hover hover:underline">
            Go to Payrolls →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {months.map((p, idx) => (
        <div
          key={`${p.year}-${p.month}`}
          className="animate-fade-in-up group rounded-xl border border-border-light bg-gradient-to-r from-neutral-50 to-surface p-4 transition-all duration-300 hover:border-primary-muted hover:shadow-md sm:p-5"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-3d flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-muted to-primary text-xs font-bold text-white">
                <span className="relative z-10">{p.month}/{String(p.year).slice(-2)}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{p.label}</p>
                <p className="text-xs text-muted">{p.count} employee record{p.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              <div className="text-center sm:text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-light">Gross</p>
                <p className="text-sm font-semibold text-neutral-800">{formatCurrency(p.totalGross)}</p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-light">Deductions</p>
                <p className="text-sm font-semibold text-warning">{formatCurrency(p.totalDeductions)}</p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-light">Net Pay</p>
                <p className="text-sm font-bold text-success">{formatCurrency(p.totalNet)}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
