'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, formatDeductionRate, MONTHS } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
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
import { getGpFundBreakdownFromPayroll, isGpFundDeductionCode } from '@/constants/gp-fund';
import type { ApiResponse, Payroll, PayrollGenerationResult, PayrollGenerationStatus, PayrollHoldEmployee } from '@/types';

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
  const [showHoldsModal, setShowHoldsModal] = useState(false);
  const [holdEmployees, setHoldEmployees] = useState<PayrollHoldEmployee[]>([]);
  const [holdsFetching, setHoldsFetching] = useState(false);
  const [togglingHoldId, setTogglingHoldId] = useState<number | null>(null);
  const [holdsSearch, setHoldsSearch] = useState('');

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
      console.log('[Payroll] Generation result:', data);
      showGenerationToast(data.data, data.message);
      fetchPayrolls({ refetch: true });
    } catch (err) {
      console.error('[Payroll] Generation failed:', err);
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

  const fetchEmployeeHolds = async () => {
    setHoldsFetching(true);
    try {
      const { data } = await api.get<ApiResponse<PayrollHoldEmployee[]>>('/payrolls/employee-holds');
      setHoldEmployees(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setHoldsFetching(false);
    }
  };

  const openHoldsModal = () => {
    setShowHoldsModal(true);
    fetchEmployeeHolds();
  };

  const toggleHold = async (employee: PayrollHoldEmployee) => {
    setTogglingHoldId(employee.id);
    try {
      await api.patch(`/employees/${employee.id}/payroll-hold`, { onHold: !employee.payrollOnHold });
      setHoldEmployees((prev) =>
        prev.map((e) => e.id === employee.id ? { ...e, payrollOnHold: !e.payrollOnHold } : e),
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingHoldId(null);
    }
  };

  const totalGross = payrolls.reduce((s, p) => s + Number(p.grossSalary), 0);
  const totalNet = payrolls.reduce((s, p) => s + Number(p.netSalary), 0);
  const missingCount = generationStatus.filter((item) => item.canGenerate).length;
  const coveredCount = generationStatus.length - missingCount;
  const heldCount = holdEmployees.filter((e) => e.payrollOnHold).length;

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

  const getGpFundBreakdown = (payroll: Payroll) =>
    getGpFundBreakdownFromPayroll(payroll.deductions);

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
              <>
                <Button variant="secondary" onClick={openHoldsModal}>
                  Payroll Holds{heldCount > 0 ? ` (${heldCount})` : ''}
                </Button>
                <Button onClick={handleGenerate} loading={generating}>
                  {missingCount > 0 && coveredCount > 0
                    ? `Generate Missing (${missingCount})`
                    : 'Generate Payroll'}
                </Button>
              </>
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
              const gpFund = getGpFundBreakdown(p);
              const hasGpFund = gpFund.totalAmount > 0;

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
                  {hasGpFund && (
                    <div>
                      <p className="text-xs text-muted">GP Fund Total</p>
                      <p className="gp-fund-amount font-medium">{formatCurrency(gpFund.totalAmount)}</p>
                      {(gpFund.annualMarkupAmount > 0 || gpFund.advanceInstallmentAmount > 0) && (
                        <p className="mt-0.5 text-[11px] text-muted-light">
                          Base {formatCurrency(gpFund.baseAmount)}
                          {gpFund.annualMarkupAmount > 0 && ` · Y ${formatCurrency(gpFund.annualMarkupAmount)}`}
                          {gpFund.advanceInstallmentAmount > 0 && ` · Adv ${formatCurrency(gpFund.advanceInstallmentAmount)}`}
                        </p>
                      )}
                    </div>
                  )}
                  <div><p className="text-xs text-muted">Total Deductions</p><p className="font-medium text-danger">{formatCurrency(Number(p.totalDeductions))}</p></div>
                  <div><p className="text-xs text-muted">Net Salary</p><p className="font-medium text-success">{formatCurrency(Number(p.netSalary))}</p></div>
                </div>
                {p.deductions && p.deductions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.deductions.map((d) => {
                      const rateLabel = formatDeductionRate(d);
                      const isGpFund = isGpFundDeductionCode(d.code);
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

      <Modal
        open={showHoldsModal}
        onClose={() => { setShowHoldsModal(false); setHoldsSearch(''); }}
        title="Payroll Hold Management"
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Employees on hold are skipped during payroll generation. When hold is removed and payroll is next generated, all missed months will be automatically caught up.
          </p>

          {!holdsFetching && holdEmployees.length > 0 && (
            <input
              type="text"
              value={holdsSearch}
              onChange={(e) => setHoldsSearch(e.target.value)}
              placeholder="Search by name, code, or designation…"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary dark:border-neutral-300"
              style={{ background: 'var(--ems-surface)' }}
            />
          )}

          {holdsFetching ? (
            <div className="space-y-2 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-neutral-100" />
              ))}
            </div>
          ) : holdEmployees.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No active employees found.</p>
          ) : (
            <div className="max-h-[420px] divide-y divide-neutral-200 overflow-y-auto rounded-lg border border-neutral-200">
              {holdEmployees.filter((emp) => matchesSearch(holdsSearch, emp.name, emp.employeeCode, emp.designation)).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No employees match your search.</p>
              ) : holdEmployees
                .filter((emp) => matchesSearch(holdsSearch, emp.name, emp.employeeCode, emp.designation))
                .map((emp) => (
                <div
                  key={emp.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${emp.payrollOnHold ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-neutral-100'}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{emp.name}</p>
                    <p className="font-mono text-xs text-muted">
                      {emp.employeeCode}
                      {emp.designation ? ` · ${emp.designation}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {emp.payrollOnHold && (
                      <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-medium text-white">
                        On Hold
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={togglingHoldId === emp.id}
                      onClick={() => toggleHold(emp)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 ${emp.payrollOnHold ? 'bg-danger' : 'bg-neutral-300'}`}
                      aria-label={emp.payrollOnHold ? 'Remove hold' : 'Enable hold'}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${emp.payrollOnHold ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!holdsFetching && holdsSearch === '' && holdEmployees.filter((e) => e.payrollOnHold).length > 0 && (
            <p className="text-xs text-danger">
              {holdEmployees.filter((e) => e.payrollOnHold).length} employee(s) currently on hold — their payroll will be skipped on next generation.
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => { setShowHoldsModal(false); setHoldsSearch(''); }}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
