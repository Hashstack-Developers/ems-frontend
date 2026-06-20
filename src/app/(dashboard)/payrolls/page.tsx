'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, formatDeductionRate, MONTHS } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TableFilters } from '@/components/ui/TableFilters';
import {
  DataTableCard,
  EmptyState,
  PageContainer,
  PageHeader,
  ScrollableList,
  StatBanner,
  StatBannerItem,
  Th,
  Td,
} from '@/components/layout/PageShell';
import { PayrollListSkeleton, StatBannerSkeleton } from '@/components/ui/Skeletons';
import { matchesSearch } from '@/lib/table-filter';
import type { ApiResponse, Payroll, PayrollGenerationResult, PayrollGenerationStatus } from '@/types';

export default function PayrollsPage() {
  const toast = useToast();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [generationStatus, setGenerationStatus] = useState<PayrollGenerationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingEmployeeId, setGeneratingEmployeeId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payroll | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPayrolls = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);
    try {
      const [payrollsRes, statusRes] = await Promise.all([
        api.get<ApiResponse<Payroll[]>>('/payrolls', { params: { month, year } }),
        api.get<ApiResponse<PayrollGenerationStatus[]>>('/payrolls/generation-status', {
          params: { month, year },
        }),
      ]);
      setPayrolls(payrollsRes.data.data);
      setGenerationStatus(statusRes.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [month, year, toast]);

  useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

  const showGenerationToast = (result: PayrollGenerationResult, message?: string) => {
    if (result.summary.createdCount > 0) {
      toast.success(message ?? `Generated ${result.summary.createdCount} payroll(s)`);
      return;
    }
    toast.info(message ?? 'No new payroll records were created');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post<ApiResponse<PayrollGenerationResult>>(
        '/payrolls/generate',
        { month, year },
      );
      showGenerationToast(data.data, data.message);
      fetchPayrolls({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateForEmployee = async (item: PayrollGenerationStatus) => {
    if (!item.canGenerate) return;
    setGeneratingEmployeeId(item.employeeId);
    try {
      const { data } = await api.post<ApiResponse<PayrollGenerationResult>>(
        '/payrolls/generate',
        { month, year, employeeId: item.employeeId },
      );
      showGenerationToast(data.data, data.message);
      fetchPayrolls({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGeneratingEmployeeId(null);
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
  const missingCount = generationStatus.filter((item) => item.canGenerate).length;
  const coveredCount = generationStatus.length - missingCount;

  const filteredPayrolls = useMemo(
    () =>
      payrolls.filter((p) =>
        matchesSearch(
          search,
          p.employee?.name,
          p.employee?.employeeCode,
          p.employee?.designation,
          p.taxSlabName,
        ),
      ),
    [payrolls, search],
  );

  const getGpFundAmount = (payroll: Payroll) =>
    payroll.deductions?.find((d) => d.code === 'GP_FUND')?.amount ?? null;

  return (
    <PageContainer fill>
      <PageHeader
        title="Payrolls"
        subtitle="Generate and view payroll with automated tax and GP fund deductions"
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
            {generationStatus.length > 0 && (
              <div className="pb-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Coverage</p>
                <p className="text-xl font-bold text-primary-dark">
                  {coveredCount} / {generationStatus.length}
                </p>
              </div>
            )}
            {hasPermission('payrolls.generate') && (
              <Button onClick={handleGenerate} loading={generating}>
                {missingCount > 0 && coveredCount > 0
                  ? `Generate Missing (${missingCount})`
                  : 'Generate Payroll'}
              </Button>
            )}
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
          <StatBannerItem
            label="Missing"
            value={missingCount}
            valueClassName={missingCount > 0 ? 'text-warning' : 'text-success'}
          />
        </StatBanner>
      )}

      {!loading && !refetching && missingCount > 0 && (
        <DataTableCard
          fill={false}
          className="mb-4 shrink-0"
          header={
            <>
              <Th className="min-w-[200px]">Employee</Th>
              <Th className="min-w-[160px]">Stage</Th>
              <Th className="min-w-[260px]">Status</Th>
              {hasPermission('payrolls.generate') && <Th className="w-[180px]">Actions</Th>}
            </>
          }
        >
          {generationStatus
            .filter((item) => item.canGenerate)
            .map((item) => (
              <tr key={item.employeeId}>
                <Td>
                  <p className="font-medium">{item.fullName}</p>
                  <p className="font-mono text-xs text-muted-light">{item.employeeCode}</p>
                </Td>
                <Td>{item.department}</Td>
                <Td>
                  <span className="text-xs text-warning">{item.message}</span>
                </Td>
                {hasPermission('payrolls.generate') && (
                  <Td>
                    <Button
                      size="sm"
                      loading={generatingEmployeeId === item.employeeId}
                      onClick={() => handleGenerateForEmployee(item)}
                    >
                      Generate
                    </Button>
                  </Td>
                )}
              </tr>
            ))}
        </DataTableCard>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        {loading || refetching ? (
          <PayrollListSkeleton count={4} />
        ) : payrolls.length === 0 ? (
          <EmptyState
            icon="💰"
            title={`No payroll for ${MONTHS[month - 1]} ${year}`}
            description={
              missingCount > 0
                ? `Generate payroll for ${missingCount} employee(s) using the actions above.`
                : 'Click "Generate Payroll" to create records for all active employees.'
            }
          />
        ) : (
          <>
            <TableFilters
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Employee name, code, designation…"
            />
            {filteredPayrolls.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No matching payroll records"
                description="Try adjusting your search."
              />
            ) : (
          <ScrollableList className="space-y-4">
            {filteredPayrolls.map((p) => {
              const fullGross = Number(p.basicSalary);
              const payableGross = Number(p.grossSalary);
              const isProrated = p.salaryDays != null && payableGross !== fullGross;
              const gpFundAmount = getGpFundAmount(p);

              return (
              <div key={p.id} className="card-modern p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {p.employee?.name}
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
                    {hasPermission('payrolls.delete') && (
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(p)}>Delete</Button>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {isProrated ? (
                    <>
                      <div><p className="text-xs text-muted">Full Monthly Gross</p><p className="font-medium">{formatCurrency(fullGross)}</p></div>
                      <div>
                        <p className="text-xs text-muted">Payable Gross ({p.salaryDays} days)</p>
                        <p className="font-medium">{formatCurrency(payableGross)}</p>
                      </div>
                    </>
                  ) : (
                    <div><p className="text-xs text-muted">Gross With Taxes</p><p className="font-medium">{formatCurrency(payableGross)}</p></div>
                  )}
                  <div><p className="text-xs text-muted">Income Tax</p><p className="font-medium text-danger">{formatCurrency(Number(p.incomeTax))}</p></div>
                  {gpFundAmount != null && (
                    <div><p className="text-xs text-muted">GP Fund</p><p className="gp-fund-amount font-medium">{formatCurrency(Number(gpFundAmount))}</p></div>
                  )}
                  <div><p className="text-xs text-muted">Total Deductions</p><p className="font-medium text-danger">{formatCurrency(Number(p.totalDeductions))}</p></div>
                  <div><p className="text-xs text-muted">Net Salary</p><p className="font-medium text-success">{formatCurrency(Number(p.netSalary))}</p></div>
                </div>
                {p.deductions && p.deductions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.deductions.map((d) => {
                      const rateLabel = formatDeductionRate(d);
                      const isGpFund = d.code === 'GP_FUND';
                      return (
                        <span
                          key={d.id}
                          className={`rounded-lg px-2 py-1 text-xs ${
                            isGpFund ? 'gp-fund-chip font-medium' : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {d.code}
                          {rateLabel && <span className="text-muted-light"> ({rateLabel})</span>}
                          : {formatCurrency(Number(d.amount))}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
            })}
          </ScrollableList>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Payroll"
        message={
          deleteTarget
            ? `Delete payroll record for ${deleteTarget.employee?.name ?? ''}? This cannot be undone.`
            : ''
        }
        loading={deleting}
      />
    </PageContainer>
  );
}
