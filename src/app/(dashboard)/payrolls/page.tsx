'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, formatDeductionRate, MONTHS } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  EmptyState,
  PageContainer,
  PageHeader,
  ScrollableList,
  StatBanner,
  StatBannerItem,
} from '@/components/layout/PageShell';
import { PayrollListSkeleton, StatBannerSkeleton } from '@/components/ui/Skeletons';
import type { ApiResponse, Payroll } from '@/types';

export default function PayrollsPage() {
  const toast = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payroll | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPayrolls = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Payroll[]>>('/payrolls', { params: { month, year } });
      setPayrolls(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [month, year, toast]);

  useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post<ApiResponse<Payroll[]>>('/payrolls/generate', { month, year });
      toast.success(data.message ?? `Generated ${data.data.length} payroll(s)`);
      fetchPayrolls({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/payrolls/${deleteTarget.id}`);
      toast.success('Payroll deleted');
      setDeleteTarget(null);
      fetchPayrolls({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const totalGross = payrolls.reduce((s, p) => s + Number(p.grossSalary), 0);
  const totalNet = payrolls.reduce((s, p) => s + Number(p.netSalary), 0);

  return (
    <PageContainer fill>
      <PageHeader
        title="Payrolls"
        subtitle="Generate and view payroll with automated tax calculations"
        onRefetch={() => fetchPayrolls({ refetch: true })}
        refetching={refetching}
        actions={
          <>
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
            <Button onClick={handleGenerate} loading={generating}>Generate Payroll</Button>
          </>
        }
      />

      {loading || refetching ? (
        <StatBannerSkeleton />
      ) : (
        <StatBanner>
          <StatBannerItem label="Records" value={payrolls.length} />
          <StatBannerItem label="Total Gross" value={formatCurrency(totalGross)} valueClassName="text-primary-dark" />
          <StatBannerItem label="Total Net" value={formatCurrency(totalNet)} valueClassName="text-success" />
        </StatBanner>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        {loading || refetching ? (
          <PayrollListSkeleton count={4} />
        ) : payrolls.length === 0 ? (
          <EmptyState
            icon="💰"
            title={`No payroll for ${MONTHS[month - 1]} ${year}`}
            description='Click "Generate Payroll" to create records for all active employees.'
          />
        ) : (
          <ScrollableList className="space-y-4">
            {payrolls.map((p) => (
              <div key={p.id} className="card-modern p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {p.employee?.firstName} {p.employee?.lastName}
                      <span className="ml-2 font-mono text-xs text-muted-light">{p.employee?.employeeCode}</span>
                    </h3>
                    <p className="text-sm text-muted">
                      Tax Slab: {p.taxSlabName}
                      {p.appliedTaxRate != null && (
                        <span className="ml-1 text-muted-light">(@ {Number(p.appliedTaxRate)}% — snapshot)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-hover">{p.status}</span>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(p)}>Delete</Button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div><p className="text-xs text-muted">Gross</p><p className="font-medium">{formatCurrency(Number(p.grossSalary))}</p></div>
                  <div><p className="text-xs text-muted">Income Tax</p><p className="font-medium text-danger">{formatCurrency(Number(p.incomeTax))}</p></div>
                  <div><p className="text-xs text-muted">Total Deductions</p><p className="font-medium text-danger">{formatCurrency(Number(p.totalDeductions))}</p></div>
                  <div><p className="text-xs text-muted">Net Salary</p><p className="font-medium text-success">{formatCurrency(Number(p.netSalary))}</p></div>
                </div>
                {p.deductions && p.deductions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.deductions.map((d) => {
                      const rateLabel = formatDeductionRate(d);
                      return (
                        <span key={d.id} className="rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
                          {d.code}
                          {rateLabel && <span className="text-muted-light"> ({rateLabel})</span>}
                          : {formatCurrency(Number(d.amount))}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </ScrollableList>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Payroll"
        message={
          deleteTarget
            ? `Delete payroll record for ${deleteTarget.employee?.firstName ?? ''} ${deleteTarget.employee?.lastName ?? ''}? This action cannot be undone.`
            : ''
        }
        loading={deleting}
      />
    </PageContainer>
  );
}
