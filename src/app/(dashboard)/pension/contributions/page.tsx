'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { matchesSearch } from '@/lib/table-filter';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { TableFilters } from '@/components/ui/TableFilters';
import {
  DataTableCard,
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
  Td,
  Th,
} from '@/components/layout/PageShell';
import { TableBodySkeleton } from '@/components/ui/Skeletons';
import type { ApiResponse, Employee, PensionEnrollment, PensionSettings } from '@/types';

interface EnrollForm {
  employeeId: string;
  enrolledAt: string;
}

const emptyForm: EnrollForm = {
  employeeId: '',
  enrolledAt: new Date().toISOString().slice(0, 10),
};

export default function PensionContributionsPage() {
  const toast = useToast();
  const [enrollments, setEnrollments] = useState<PensionEnrollment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<PensionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [search, setSearch] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState<EnrollForm>(emptyForm);
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<PensionEnrollment | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PensionEnrollment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);
    try {
      const [enrollRes, empRes, settingsRes] = await Promise.all([
        api.get<ApiResponse<PensionEnrollment[]>>('/pension/enrollments'),
        api.get<ApiResponse<Employee[]>>('/employees'),
        api.get<ApiResponse<PensionSettings>>('/pension/settings'),
      ]);
      setEnrollments(enrollRes.data.data);
      setEmployees(empRes.data.data);
      setSettings(settingsRes.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.employeeId)), [enrollments]);

  const unenrolledEmployees = useMemo(
    () => employees.filter((e) => !enrolledIds.has(e.id)),
    [employees, enrolledIds],
  );

  const selectedEmployee = useMemo(
    () => employees.find((e) => String(e.id) === enrollForm.employeeId) ?? null,
    [employees, enrollForm.employeeId],
  );

  const previewPension = useMemo(() => {
    if (!selectedEmployee || !settings) return null;
    const rate = selectedEmployee.employeeType === 'employer'
      ? Number(settings.employerRate)
      : Number(settings.employeeRate);
    const basicPay = Number(selectedEmployee.basicPayDec2025 ?? 0);
    return basicPay > 0 && rate > 0 ? (basicPay * rate / 100) : null;
  }, [selectedEmployee, settings]);

  const filteredEnrollments = useMemo(() =>
    enrollments.filter((e) =>
      matchesSearch(search, e.employee?.name, e.employee?.employeeCode, e.employee?.designation)
    ),
    [enrollments, search],
  );

  const handleEnroll = async () => {
    if (!enrollForm.employeeId) { toast.error('Select an employee'); return; }
    if (!enrollForm.enrolledAt) { toast.error('Select enrollment date'); return; }

    setEnrollSaving(true);
    try {
      await api.post('/pension/enrollments', {
        employeeId: Number(enrollForm.employeeId),
        enrolledAt: enrollForm.enrolledAt,
      });
      toast.success('Pension enrollment activated');
      setShowEnrollModal(false);
      setEnrollForm(emptyForm);
      await fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnrollSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      await api.patch(`/pension/enrollments/${deactivateTarget.employeeId}/deactivate`);
      toast.success('Pension enrollment deactivated');
      setDeactivateTarget(null);
      await fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/pension/enrollments/${removeTarget.employeeId}`);
      toast.success('Pension enrollment removed');
      setRemoveTarget(null);
      await fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const canManage = hasPermission('pension.manage');

  return (
    <PageContainer fill>
      <PageHeader
        title="Pension Contributions"
        subtitle="Manage which employees have pension contribution active"
        onRefetch={() => fetchData({ refetch: true })}
        refetching={refetching}
        actions={
          canManage ? (
            <Button onClick={() => { setEnrollForm(emptyForm); setShowEnrollModal(true); }}>
              + Enroll Employee
            </Button>
          ) : undefined
        }
      />

      <SectionCard
        title="Active Enrollments"
        subtitle="Employees with pension deductions applied at payroll generation"
      >
        <TableFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search employee, code, designation…"
        />

        {loading ? (
          <DataTableCard fill={false} minWidth="min-w-[700px]" header={
            <>
              <Th className="min-w-[180px]">Employee</Th>
              <Th className="min-w-[130px]">Designation</Th>
              <Th className="w-[100px]">Type</Th>
              <Th className="w-[120px]">Enrolled On</Th>
              <Th className="w-[110px]">Status</Th>
              <Th className="w-[120px]">Actions</Th>
            </>
          }>
            <TableBodySkeleton rows={4} cols={6} />
          </DataTableCard>
        ) : enrollments.length === 0 ? (
          <EmptyState
            icon="🏛️"
            title="No pension enrollments yet"
            description="Enroll employees to activate pension contribution deductions from their payroll."
          />
        ) : (
          <DataTableCard fill={false} minWidth="min-w-[700px]" header={
            <>
              <Th className="min-w-[180px]">Employee</Th>
              <Th className="min-w-[130px]">Designation</Th>
              <Th className="w-[100px]">Type</Th>
              <Th className="w-[120px]">Enrolled On</Th>
              <Th className="w-[110px]">Status</Th>
              {canManage && <Th className="w-[120px]">Actions</Th>}
            </>
          }>
            {refetching ? (
              <TableBodySkeleton rows={4} cols={canManage ? 6 : 5} />
            ) : filteredEnrollments.length === 0 ? (
              <tr><td colSpan={canManage ? 6 : 5} className="py-8 text-center text-muted-light">No matching enrollments</td></tr>
            ) : (
              filteredEnrollments.map((e) => (
                <tr key={e.id}>
                  <Td>
                    <p className="font-medium">{e.employee?.name ?? '—'}</p>
                    <p className="font-mono text-xs text-muted">{e.employee?.employeeCode}</p>
                  </Td>
                  <Td className="text-muted">{e.employee?.designation ?? '—'}</Td>
                  <Td>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.employee?.employeeType === 'employer'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {e.employee?.employeeType ?? 'employee'}
                    </span>
                  </Td>
                  <Td>{formatDate(e.enrolledAt)}</Td>
                  <Td>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-neutral-100 text-muted'
                    }`}>
                      {e.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </Td>
                  {canManage && (
                    <Td>
                      <div className="flex gap-2">
                        {e.isActive && (
                          <Button size="sm" variant="secondary" onClick={() => setDeactivateTarget(e)}>
                            Deactivate
                          </Button>
                        )}
                        {!e.isActive && (
                          <Button size="sm" variant="danger" onClick={() => setRemoveTarget(e)}>
                            Remove
                          </Button>
                        )}
                      </div>
                    </Td>
                  )}
                </tr>
              ))
            )}
          </DataTableCard>
        )}
      </SectionCard>

      {/* Enroll Modal */}
      <Modal
        open={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title="Enroll Employee in Pension"
      >
        <div className="space-y-4">
          <Select
            label="Employee"
            value={enrollForm.employeeId}
            onChange={(e) => setEnrollForm((f) => ({ ...f, employeeId: e.target.value }))}
            options={[
              { value: '', label: 'Select employee…' },
              ...unenrolledEmployees.map((emp) => ({
                value: String(emp.id),
                label: `${emp.name} (${emp.employeeCode}) — ${emp.employeeType ?? 'employee'}`,
              })),
            ]}
          />

          {selectedEmployee && settings && (
            <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--ems-surface)' }}>
              <p className="font-medium text-foreground">
                Type: <span className="capitalize">{selectedEmployee.employeeType ?? 'employee'}</span>
                {' · '}
                Rate: {selectedEmployee.employeeType === 'employer'
                  ? Number(settings.employerRate)
                  : Number(settings.employeeRate)}%
              </p>
              {previewPension !== null && (
                <p className="mt-1 text-muted">
                  Monthly deduction preview: <strong className="text-foreground">{formatCurrency(previewPension)}</strong>
                </p>
              )}
            </div>
          )}

          <Input
            label="Enrollment Date"
            type="date"
            value={enrollForm.enrolledAt}
            onChange={(e) => setEnrollForm((f) => ({ ...f, enrolledAt: e.target.value }))}
          />

          <p className="text-xs text-muted">
            Pension deductions will be retroactively applied to all existing payrolls from the enrollment date onwards.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>Cancel</Button>
            <Button onClick={handleEnroll} loading={enrollSaving}>Enroll</Button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmModal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        loading={actionLoading}
        title="Deactivate Pension"
        message={`Stop pension deductions for ${deactivateTarget?.employee?.name ?? 'this employee'} from the next payroll? Past deductions are not reversed.`}
        confirmLabel="Deactivate"
      />

      {/* Remove Confirm */}
      <ConfirmModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        loading={actionLoading}
        title="Remove Enrollment"
        message={`Remove the pension enrollment record for ${removeTarget?.employee?.name ?? 'this employee'}? This cannot be undone.`}
        confirmLabel="Remove"
      />
    </PageContainer>
  );
}
