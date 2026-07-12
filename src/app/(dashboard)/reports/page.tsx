'use client';

import { useState } from 'react';
import { getToken } from '@/lib/auth';
import { MONTHS } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PageContainer, PageHeader } from '@/components/layout/PageShell';

interface ReportTypeConfig {
  value: string;
  label: string;
  icon: string;
  description: string;
  fields: string[];
  requiresPeriod: boolean;
  color: string;
}

const reportTypes: ReportTypeConfig[] = [
  {
    value: 'employees',
    label: 'Employees Report',
    icon: '👥',
    description: 'Complete employee profiles with all personal, employment, salary, and bank details.',
    fields: ['Personal & CNIC details', 'Pay & allowances breakdown', 'GP Fund & bank info', 'Employment history'],
    requiresPeriod: false,
    color: 'blue',
  },
  {
    value: 'payrolls',
    label: 'Payrolls Report',
    icon: '💰',
    description: 'Monthly payroll records with gross salary, all deductions, and net pay per employee.',
    fields: ['Gross salary', 'Income tax & tax slab', 'GP Fund deductions', 'Net salary totals'],
    requiresPeriod: true,
    color: 'green',
  },
  {
    value: 'taxes',
    label: 'Taxes Report',
    icon: '📊',
    description: 'Tax slab configuration and applied income tax deductions for the selected period.',
    fields: ['Tax slab structure', 'Sub-taxes (EOBI / SS / PT)', 'Per-employee deductions', 'Period totals'],
    requiresPeriod: true,
    color: 'orange',
  },
  {
    value: 'gpFund',
    label: 'GP Fund Report',
    icon: '🏦',
    description: 'General Provident Fund collection summary with markup, advance installments, and monthly breakdown.',
    fields: ['GP fund scale & subscription', 'Base collected per employee', 'Annual markup', 'Monthly breakdown'],
    requiresPeriod: false,
    color: 'purple',
  },
  {
    value: 'pension',
    label: 'Pension Report',
    icon: '🏛️',
    description: 'Pension contribution deductions summary per employee with monthly breakdown.',
    fields: ['Per-employee pension totals', 'Monthly breakdown', 'Active enrollments', 'Period totals'],
    requiresPeriod: false,
    color: 'teal',
  },
];

const colorMap: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
  blue:   { border: 'border-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'bg-blue-100 dark:bg-blue-900/40',   badge: 'bg-blue-500' },
  green:  { border: 'border-green-500',  bg: 'bg-green-50 dark:bg-green-900/20', icon: 'bg-green-100 dark:bg-green-900/40', badge: 'bg-green-500' },
  orange: { border: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'bg-orange-100 dark:bg-orange-900/40', badge: 'bg-orange-500' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'bg-purple-100 dark:bg-purple-900/40', badge: 'bg-purple-500' },
  teal:   { border: 'border-teal-500',   bg: 'bg-teal-50 dark:bg-teal-900/20',   icon: 'bg-teal-100 dark:bg-teal-900/40',   badge: 'bg-teal-500' },
};

export default function ReportsPage() {
  const toast = useToast();
  const now = new Date();
  const [type, setType] = useState('employees');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [downloading, setDownloading] = useState('');

  const selected = reportTypes.find((r) => r.value === type)!;

  const downloadReport = async (format: 'csv' | 'pdf') => {
    setDownloading(format);
    try {
      const params = new URLSearchParams({ type, format });
      if (selected.requiresPeriod) {
        params.set('month', String(month));
        params.set('year', String(year));
      } else if (type === 'gpFund' || type === 'pension') {
        params.set('year', String(year));
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/reports/download?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(Array.isArray(err.message) ? err.message.join(', ') : err.message);
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      const filename = disposition?.match(/filename="(.+)"/)?.[1] ?? `${type}-report.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading('');
    }
  };

  const colors = colorMap[selected.color];

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        subtitle="Generate and download detailed reports in PDF or CSV format"
      />

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {reportTypes.map((rt) => {
          const isSelected = type === rt.value;
          const c = colorMap[rt.color];
          return (
            <button
              key={rt.value}
              type="button"
              onClick={() => setType(rt.value)}
              className={`group relative rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                isSelected
                  ? `${c.border} ${c.bg} shadow-md`
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm dark:border-neutral-700 dark:bg-neutral-800/40 dark:hover:border-neutral-600'
              }`}
            >
              {isSelected && (
                <span className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${c.badge}`} />
              )}
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-xl ${isSelected ? c.icon : 'bg-neutral-100 dark:bg-neutral-700'}`}>
                {rt.icon}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{rt.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{rt.description}</p>
              <ul className="mt-3 space-y-1">
                {rt.fields.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-muted">
                    <span className={`h-1 w-1 shrink-0 rounded-full ${isSelected ? c.badge : 'bg-neutral-400'}`} />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Period & Download Panel */}
      <div className={`mt-6 rounded-2xl border-2 p-6 transition-all duration-200 ${colors.border} ${colors.bg}`}>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1">
            <p className="text-base font-semibold text-foreground">{selected.icon} {selected.label}</p>
            <p className="mt-0.5 text-sm text-muted">{selected.description}</p>
          </div>

          {/* Period filter */}
          {(selected.requiresPeriod || selected.value === 'gpFund' || selected.value === 'pension') && (
            <div className="flex items-end gap-3">
              {selected.requiresPeriod && (
                <Select
                  label="Month"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
                />
              )}
              <Select
                label="Year"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                options={[year - 2, year - 1, year, year + 1].map((y) => ({ value: y, label: String(y) }))}
              />
            </div>
          )}

          {/* Download buttons */}
          {hasPermission('reports.export') && (
            <div className="flex gap-2">
              <Button
                onClick={() => downloadReport('pdf')}
                loading={downloading === 'pdf'}
                className="gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Download PDF
              </Button>
              <Button
                onClick={() => downloadReport('csv')}
                loading={downloading === 'csv'}
                variant="secondary"
                className="gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                Download CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info tiles */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: '🏛️', label: 'Organization', value: 'WCLA' },
          { icon: '📄', label: 'PDF Format', value: 'A4 with WCLA header & logos' },
          { icon: '📋', label: 'CSV Format', value: 'Full column labels, UTF-8' },
          { icon: '🔒', label: 'Permission', value: 'reports.export required' },
        ].map(({ icon, label, value }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800/40">
            <p className="text-lg">{icon}</p>
            <p className="mt-1 text-xs font-semibold text-muted">{label}</p>
            <p className="text-xs text-foreground">{value}</p>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
