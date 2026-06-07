'use client';

import { useState } from 'react';
import { getToken } from '@/lib/auth';
import { MONTHS } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { InfoPanel, PageContainer, PageHeader } from '@/components/layout/PageShell';

const reportTypes = [
  { value: 'employees', label: 'Employees Report' },
  { value: 'payrolls', label: 'Payrolls Report' },
  { value: 'taxes', label: 'Taxes Report' },
];

export default function ReportsPage() {
  const toast = useToast();
  const now = new Date();
  const [type, setType] = useState('employees');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [downloading, setDownloading] = useState('');

  const downloadReport = async (format: 'csv' | 'pdf') => {
    setDownloading(format);

    try {
      const params = new URLSearchParams({ type, format });
      if (type !== 'employees') {
        params.set('month', String(month));
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

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        subtitle="Generate and download detailed reports in PDF or CSV format"
      />

      <div className="card-modern max-w-lg p-6">
        <div className="space-y-4">
          <Select
            label="Report Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={reportTypes}
          />

          {type !== 'employees' && (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Month"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
              />
              <Select
                label="Year"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                options={[year - 1, year, year + 1].map((y) => ({ value: y, label: String(y) }))}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={() => downloadReport('csv')} loading={downloading === 'csv'} className="flex-1">
              Download CSV
            </Button>
            <Button onClick={() => downloadReport('pdf')} loading={downloading === 'pdf'} variant="secondary" className="flex-1">
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <InfoPanel title="Report Contents">
        <ul className="space-y-2">
          <li><strong>Employees:</strong> Code, name, department, salary, status, and join date</li>
          <li><strong>Payrolls:</strong> Gross salary, income tax, deductions breakdown, and net pay per employee</li>
          <li><strong>Taxes:</strong> Tax slab configuration, sub-taxes (EOBI, SS, PT), and applied deduction summary</li>
        </ul>
      </InfoPanel>
    </PageContainer>
  );
}
