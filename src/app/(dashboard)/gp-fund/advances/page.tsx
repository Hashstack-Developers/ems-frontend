'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate, MONTHS, roundAmount } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DateInput } from '@/components/ui/DateInput';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TableFilters } from '@/components/ui/TableFilters';
import {
  DataTableCard,
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
  StatBannerItem,
  Td,
  Th,
} from '@/components/layout/PageShell';
import { SkeletonBar, TableBodySkeleton } from '@/components/ui/Skeletons';
import { GP_FUND_ADVANCE_MAX_MONTHS } from '@/constants/gp-fund';
import { matchesSearch } from '@/lib/table-filter';
import type {
  ApiResponse,
  Employee,
  GpFundAdvance,
  GpFundAdvanceEligibility,
  GpFundAdvanceSummary,
} from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function StatusBadge({ status }: { status: GpFundAdvance['status'] }) {
  const classes =
    status === 'active'
      ? 'bg-success-soft text-success'
      : status === 'completed'
        ? 'bg-primary-soft text-primary'
        : 'bg-neutral-100 text-neutral-600';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}>
      {status}
    </span>
  );
}

export default function GpFundAdvancesPage() {
  const toast = useToast();
  const [summary, setSummary] = useState<GpFundAdvanceSummary | null>(null);
  const [advances, setAdvances] = useState<GpFundAdvance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<GpFundAdvance | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GpFundAdvance | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newMonths, setNewMonths] = useState('36');
  const [newTakenDate, setNewTakenDate] = useState(new Date().toISOString().slice(0, 10));
  const [newNotes, setNewNotes] = useState('');
  const [eligibility, setEligibility] = useState<GpFundAdvanceEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const previewInstallment = useMemo(() => {
    const amount = Number(newAmount);
    const months = Number(newMonths);
    if (Number.isNaN(amount) || Number.isNaN(months) || amount <= 0 || months <= 0) return null;
    return roundAmount(amount / months);
  }, [newAmount, newMonths]);

  const amountExceedsMax =
    eligibility != null && Number(newAmount) > eligibility.maxAdvanceAmount;

  useEffect(() => {
    if (!newEmployeeId) {
      setEligibility(null);
      return;
    }
    let ignore = false;
    setEligibilityLoading(true);
    api
      .get<ApiResponse<GpFundAdvanceEligibility>>(
        `/gp-fund/advances/employee/${newEmployeeId}/eligibility`,
      )
      .then(({ data }) => {
        if (!ignore) setEligibility(data.data);
      })
      .catch(() => {
        if (!ignore) setEligibility(null);
      })
      .finally(() => {
        if (!ignore) setEligibilityLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [newEmployeeId]);

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Employee[]>>('/employees');
      setEmployees(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [toast]);

  const fetchData = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    const params = new URLSearchParams();
    if (employeeFilter) params.set('employeeId', employeeFilter);
    if (statusFilter) params.set('status', statusFilter);

    try {
      const [summaryRes, advancesRes] = await Promise.all([
        api.get<ApiResponse<GpFundAdvanceSummary>>('/gp-fund/advances/summary'),
        api.get<ApiResponse<GpFundAdvance[]>>(`/gp-fund/advances${params.toString() ? `?${params.toString()}` : ''}`),
      ]);
      setSummary(summaryRes.data.data);
      setAdvances(advancesRes.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [employeeFilter, statusFilter, toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAdvances = useMemo(
    () =>
      advances.filter((row) =>
        matchesSearch(search, row.name, row.employeeCode, row.designation, row.gpFundScale, row.status),
      ),
    [advances, search],
  );

  const resetForm = () => {
    setNewEmployeeId('');
    setNewAmount('');
    setNewMonths('36');
    setNewTakenDate(new Date().toISOString().slice(0, 10));
    setNewNotes('');
    setEligibility(null);
  };

  const handleCreate = async () => {
    const amount = Number(newAmount);
    const months = Number(newMonths);
    if (!newEmployeeId) {
      toast.error('Select an employee');
      return;
    }
    if (eligibility && amount > eligibility.maxAdvanceAmount) {
      toast.error(
        `Advance amount cannot exceed ${eligibility.maxAdvancePercentage}% of the employee's total GP fund balance (${formatCurrency(eligibility.maxAdvanceAmount)})`,
      );
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid advance amount');
      return;
    }
    if (Number.isNaN(months) || months < 1 || months > GP_FUND_ADVANCE_MAX_MONTHS) {
      toast.error(`Repayment period must be between 1 and ${GP_FUND_ADVANCE_MAX_MONTHS} months`);
      return;
    }

    setCreating(true);
    try {
      await api.post('/gp-fund/advances', {
        employeeId: Number(newEmployeeId),
        advanceAmount: amount,
        installmentMonths: months,
        takenDate: newTakenDate,
        notes: newNotes.trim() || undefined,
      });
      toast.success('GP Fund advance assigned');
      setModalOpen(false);
      resetForm();
      fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.patch(`/gp-fund/advances/${cancelTarget.id}/cancel`);
      toast.success('Advance cancelled');
      setCancelTarget(null);
      fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/gp-fund/advances/${deleteTarget.id}`);
      toast.success('Advance deleted');
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const canRemoveAdvance = (row: GpFundAdvance) =>
    row.amountRepaid === 0 && row.installmentsPaid === 0 && row.payments.length === 0;

  const employeesWithoutActiveAdvance = useMemo(() => {
    const activeIds = new Set(
      (summary?.advances ?? []).filter((a) => a.status === 'active').map((a) => a.employeeId),
    );
    return employees.filter((emp) => !activeIds.has(emp.id));
  }, [employees, summary?.advances]);

  return (
    <PageContainer fill>
      <PageHeader
        title="GP Fund Advances"
        subtitle="Assign GP fund advances and track installment repayments from monthly payroll"
        onRefetch={() => fetchData({ refetch: true })}
        refetching={refetching}
        actions={
          hasPermission('gpFund.create') && (
            <Button onClick={() => setModalOpen(true)}>Assign Advance</Button>
          )
        }
      />

      {loading ? (
        <div className="space-y-4">
          <SkeletonBar className="h-32 rounded-2xl" />
          <SkeletonBar className="h-80 rounded-2xl" />
        </div>
      ) : (
        <>
          {summary && (
            <div className="banner-gp-fund mb-6 shrink-0 rounded-2xl p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
                <StatBannerItem label="Total Advanced" value={formatCurrency(summary.totalAdvanced)} valueClassName="banner-gp-fund-value" />
                <StatBannerItem label="Outstanding" value={formatCurrency(summary.totalOutstanding)} valueClassName="banner-gp-fund-value" />
                <StatBannerItem label="Total Repaid" value={formatCurrency(summary.totalRepaid)} valueClassName="banner-gp-fund-value" />
                <StatBannerItem label="Active Advances" value={summary.activeCount} valueClassName="banner-gp-fund-value" />
                <StatBannerItem label="Monthly Installments Due" value={formatCurrency(summary.monthlyInstallmentsDue)} valueClassName="banner-gp-fund-value" />
                <StatBannerItem label="Completed" value={summary.completedCount} valueClassName="banner-gp-fund-value" />
                <StatBannerItem label="Installments Collected" value={summary.totalInstallmentsCollected} valueClassName="banner-gp-fund-value" />
                <StatBannerItem label="Total Records" value={summary.totalAdvances} valueClassName="banner-gp-fund-value" />
              </div>
              <p className="banner-gp-fund-note mt-4 text-sm">
                Regular GP fund subscription still deducts every month. Advance installments are deducted separately until fully repaid (max {GP_FUND_ADVANCE_MAX_MONTHS} months).
              </p>
            </div>
          )}

          <SectionCard title="Advance Records" subtitle="Filter, search, and review repayment progress">
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Employee"
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                options={[
                  { value: '', label: 'All employees' },
                  ...employees.map((emp) => ({
                    value: String(emp.id),
                    label: `${emp.name} (${emp.employeeCode})`,
                  })),
                ]}
              />
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={STATUS_OPTIONS}
              />
            </div>

            <TableFilters
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search employee, code, scale, status…"
            />

            <DataTableCard
              fill={false}
              minWidth="min-w-[1200px]"
              header={
                <>
                  <Th className="min-w-[180px]">Employee</Th>
                  <Th className="min-w-[150px]">Father Name</Th>
                  <Th className="w-[100px]">Scale</Th>
                  <Th className="w-[120px]">Advance</Th>
                  <Th className="w-[100px]">Months</Th>
                  <Th className="w-[120px]">Monthly</Th>
                  <Th className="w-[120px]">Repaid</Th>
                  <Th className="w-[120px]">Remaining</Th>
                  <Th className="w-[100px]">Progress</Th>
                  <Th className="w-[100px]">Status</Th>
                  <Th className="w-[120px]">Taken</Th>
                  <Th className="w-[120px]">Actions</Th>
                </>
              }
            >
              {refetching ? (
                <TableBodySkeleton rows={6} cols={12} />
              ) : filteredAdvances.length === 0 ? (
                <tr><td colSpan={12} className="py-8 text-center text-muted-light">No GP Fund advances found</td></tr>
              ) : (
                filteredAdvances.map((row) => (
                  <Fragment key={row.id}>
                    <tr className="cursor-pointer hover:bg-neutral-50" onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}>
                      <Td>
                        <p className="font-medium">{row.name}</p>
                        <p className="font-mono text-xs text-muted-light">{row.employeeCode}</p>
                      </Td>
                      <Td className="text-muted">{row.fatherName || '—'}</Td>
                      <Td>{row.gpFundScale ?? '—'}</Td>
                      <Td>{formatCurrency(row.advanceAmount)}</Td>
                      <Td>{row.installmentMonths}</Td>
                      <Td>{formatCurrency(row.monthlyInstallment)}</Td>
                      <Td>{formatCurrency(row.amountRepaid)}</Td>
                      <Td className="gp-fund-amount">{formatCurrency(row.remainingBalance)}</Td>
                      <Td>{row.installmentsPaid}/{row.installmentMonths}</Td>
                      <Td><StatusBadge status={row.status} /></Td>
                      <Td>{formatDate(row.takenDate)}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()} role="presentation">
                          {row.status === 'active' && canRemoveAdvance(row) && hasPermission('gpFund.update') && (
                            <Button size="sm" variant="secondary" onClick={() => setCancelTarget(row)}>Cancel</Button>
                          )}
                          {canRemoveAdvance(row) && hasPermission('gpFund.delete') && (
                            <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>Delete</Button>
                          )}
                        </div>
                      </Td>
                    </tr>
                    {expandedId === row.id && (
                      <tr>
                        <td colSpan={12} className="bg-neutral-50 px-4 py-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <p className="text-sm font-medium text-neutral-800">Repayment schedule</p>
                              <p className="mt-1 text-sm text-muted">
                                {formatCurrency(row.monthlyInstallment)} per month for up to {row.installmentMonths} months.
                                Regular GP fund deduction continues separately each payroll.
                              </p>
                              {row.notes && (
                                <p className="mt-2 text-sm text-muted">Notes: {row.notes}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-800">Payroll installments collected</p>
                              {row.payments.length === 0 ? (
                                <p className="mt-1 text-sm text-muted-light">No installments collected yet</p>
                              ) : (
                                <ul className="mt-2 space-y-1 text-sm">
                                  {row.payments.map((payment) => (
                                    <li key={payment.id} className="flex justify-between gap-3">
                                      <span>{MONTHS[payment.month - 1]} {payment.year}</span>
                                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </DataTableCard>
          </SectionCard>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Assign GP Fund Advance">
        <div className="space-y-4">
          <Select
            label="Employee"
            value={newEmployeeId}
            onChange={(e) => setNewEmployeeId(e.target.value)}
            options={[
              { value: '', label: 'Select employee' },
              ...employeesWithoutActiveAdvance.map((emp) => ({
                value: String(emp.id),
                label: `${emp.name} (${emp.employeeCode})`,
              })),
            ]}
          />
          <div>
            <Input
              label="Advance Amount (Rs.)"
              type="number"
              min="0"
              step="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              error={amountExceedsMax ? `Exceeds maximum allowed advance` : undefined}
            />
            {newEmployeeId && (
              <p className={`mt-1 text-xs ${amountExceedsMax ? 'text-danger' : 'text-muted'}`}>
                {eligibilityLoading
                  ? 'Loading GP fund balance…'
                  : eligibility
                    ? `Total GP fund: ${formatCurrency(eligibility.totalGpFundBalance)} — max advance (${eligibility.maxAdvancePercentage}%): ${formatCurrency(eligibility.maxAdvanceAmount)}`
                    : 'GP fund balance unavailable'}
              </p>
            )}
          </div>
          <Input
            label={`Repayment Months (max ${GP_FUND_ADVANCE_MAX_MONTHS})`}
            type="number"
            min="1"
            max={GP_FUND_ADVANCE_MAX_MONTHS}
            value={newMonths}
            onChange={(e) => setNewMonths(e.target.value)}
          />
          <DateInput
            label="Taken Date"
            value={newTakenDate}
            onChange={(e) => setNewTakenDate(e.target.value)}
          />
          <Input
            label="Notes (optional)"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
          />
          {previewInstallment != null && (
            <p className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              Estimated monthly installment: <strong>{formatCurrency(previewInstallment)}</strong>
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={amountExceedsMax}>Assign Advance</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel GP Fund Advance"
        message={
          cancelTarget
            ? `Cancel the advance of ${formatCurrency(cancelTarget.advanceAmount)} for ${cancelTarget.name}? The record will be marked cancelled.`
            : ''
        }
        loading={cancelling}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete GP Fund Advance"
        message={
          deleteTarget
            ? `Permanently delete the advance of ${formatCurrency(deleteTarget.advanceAmount)} for ${deleteTarget.name}? This cannot be undone.`
            : ''
        }
        loading={deleting}
      />
    </PageContainer>
  );
}
