'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { getChangedFields, hasFieldChanges, NO_CHANGES_MESSAGE, optionalStringsEqual } from '@/lib/form-changes';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { DataTableCard, PageContainer, PageHeader, Th, Td } from '@/components/layout/PageShell';
import { TableBodySkeleton } from '@/components/ui/Skeletons';
import type { ApiResponse, Employee } from '@/types';
import {
  EDITABLE_FORM_FIELDS,
  NUMERIC_FORM_FIELDS,
  applyDerivedFields,
  buildEmployeePayload,
  employeeToForm,
  emptyForm,
  type EmployeeFormValues,
} from './employee-form';

function SectionTitle({ children }: { children: string }) {
  return <h3 className="border-b border-border pb-1 text-sm font-semibold text-neutral-800">{children}</h3>;
}

export default function EmployeesPage() {
  const toast = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormValues>(emptyForm);
  const [originalForm, setOriginalForm] = useState<EmployeeFormValues>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Employee[]>>('/employees');
      setEmployees(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [toast]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const updateForm = (patch: Partial<EmployeeFormValues>) => {
    setForm((current) => applyDerivedFields({ ...current, ...patch }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    const nextForm = employeeToForm(emp);
    setForm(nextForm);
    setOriginalForm(nextForm);
    setModalOpen(true);
  };

  const fieldComparator = (
    key: (typeof EDITABLE_FORM_FIELDS)[number],
    current: unknown,
    original: unknown,
  ) => {
    if ((NUMERIC_FORM_FIELDS as readonly string[]).includes(key)) {
      const currentNum = current === '' ? null : Number(current);
      const originalNum = original === '' ? null : Number(original);
      return currentNum === originalNum;
    }
    if (key === 'mobile' || key === 'employmentType') {
      return optionalStringsEqual(String(current), String(original));
    }
    return current === original;
  };

  const isEditDirty = useMemo(() => {
    if (!editing) return true;
    return hasFieldChanges(form, originalForm, EDITABLE_FORM_FIELDS, { isEqual: fieldComparator });
  }, [editing, form, originalForm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (editing && !isEditDirty) {
      toast.info(NO_CHANGES_MESSAGE);
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const changes = getChangedFields(form, originalForm, EDITABLE_FORM_FIELDS, { isEqual: fieldComparator });
        const merged = { ...originalForm, ...changes };
        await api.patch(`/employees/${editing.id}`, buildEmployeePayload(merged));
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', buildEmployeePayload(form));
        toast.success('Employee created successfully');
      }
      setModalOpen(false);
      fetchEmployees({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/employees/${deleteTarget.id}`);
      toast.success('Employee deleted successfully');
      setDeleteTarget(null);
      fetchEmployees({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const showActionsColumn = hasAnyPermission('employees.update', 'employees.delete');
  const columnCount = showActionsColumn ? 7 : 6;

  return (
    <PageContainer fill>
      <PageHeader
        title="Employees"
        subtitle="Manage employee records"
        onRefetch={() => fetchEmployees({ refetch: true })}
        refetching={refetching}
        actions={hasPermission('employees.create') ? <Button onClick={openCreate}>+ Add Employee</Button> : undefined}
      />

      <DataTableCard
        header={
          <>
            <Th className="w-[100px]">Code</Th>
            <Th className="min-w-[160px]">Name</Th>
            <Th className="min-w-[120px]">Designation</Th>
            <Th className="w-[120px]">Gross Salary</Th>
            <Th className="w-[90px]">Status</Th>
            <Th className="w-[110px]">Joined</Th>
            {showActionsColumn && <Th className="w-[160px]">Actions</Th>}
          </>
        }
      >
        {loading || refetching ? (
          <TableBodySkeleton rows={8} cols={columnCount} />
        ) : employees.length === 0 ? (
          <tr><td colSpan={columnCount} className="py-8 text-center text-muted-light">No employees found</td></tr>
        ) : (
          employees.map((emp) => (
            <tr key={emp.id}>
              <Td className="font-mono text-xs">{emp.employeeCode}</Td>
              <Td className="font-medium">{emp.name}</Td>
              <Td>{emp.designation}</Td>
              <Td>{formatCurrency(Number(emp.grossSalary ?? emp.basicPayDec2025 ?? 0))}</Td>
              <Td>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${emp.status === 'active' ? 'bg-success-soft text-success' : 'bg-neutral-100 text-neutral-600'}`}>
                  {emp.status}
                </span>
              </Td>
              <Td>{formatDate(emp.dateOfJoining)}</Td>
              {showActionsColumn && (
              <Td>
                <div className="flex flex-wrap gap-2">
                  {hasPermission('employees.update') && (
                    <Button size="sm" variant="secondary" onClick={() => openEdit(emp)}>Edit</Button>
                  )}
                  {hasPermission('employees.delete') && (
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(emp)}>Delete</Button>
                  )}
                </div>
              </Td>
              )}
            </tr>
          ))
        )}
      </DataTableCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {editing && (
            <Input label="Employee Code" value={editing.employeeCode} readOnly disabled />
          )}

          <SectionTitle>Personal & Employment</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} required />
            <Input label="Designation" value={form.designation} onChange={(e) => updateForm({ designation: e.target.value })} required />
            <Input label="Basic Pay Scale" value={form.basicPayScale} onChange={(e) => updateForm({ basicPayScale: e.target.value })} />
            <Input label="Religion" value={form.religion} onChange={(e) => updateForm({ religion: e.target.value })} />
            <Input label="Salary Till" type="date" value={form.salaryTill} onChange={(e) => updateForm({ salaryTill: e.target.value })} />
            <Input label="Date Of Joining" type="date" value={form.dateOfJoining} onChange={(e) => updateForm({ dateOfJoining: e.target.value })} required />
            <Input label="Contract Expiry Date" type="date" value={form.contractExpiryDate} onChange={(e) => updateForm({ contractExpiryDate: e.target.value })} />
            <Select
              label="Status Contract or Regular"
              value={form.employmentType}
              onChange={(e) => updateForm({ employmentType: e.target.value as EmployeeFormValues['employmentType'] })}
              options={[
                { value: '', label: 'Select type' },
                { value: 'contract', label: 'Contract' },
                { value: 'regular', label: 'Regular' },
              ]}
            />
            <Input label="Date of Regularization" type="date" value={form.dateOfRegularization} onChange={(e) => updateForm({ dateOfRegularization: e.target.value })} />
            <Input label="DOB" type="date" value={form.dateOfBirth} onChange={(e) => updateForm({ dateOfBirth: e.target.value })} />
            <Input label="Date Of Retirement (Age 60)" type="date" value={form.dateOfRetirement} onChange={(e) => updateForm({ dateOfRetirement: e.target.value })} />
            <Input label="Length Of Service" value={form.lengthOfService} onChange={(e) => updateForm({ lengthOfService: e.target.value })} />
            <Input label="Mobile" value={form.mobile} onChange={(e) => updateForm({ mobile: e.target.value })} />
            <Input label="CNIC No" value={form.cnicNo} onChange={(e) => updateForm({ cnicNo: e.target.value })} />
            <Input label="E-Mail" type="email" value={form.email} onChange={(e) => updateForm({ email: e.target.value })} required />
            <Input label="Stage" value={form.stage} onChange={(e) => updateForm({ stage: e.target.value })} />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => updateForm({ status: e.target.value as 'active' | 'inactive' })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          <SectionTitle>Salary & Allowances</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Basic Pay 01-12-2025" type="number" min="0" step="0.01" value={form.basicPayDec2025} onChange={(e) => updateForm({ basicPayDec2025: e.target.value })} />
            <Input label="Personal Allowance" type="number" min="0" step="0.01" value={form.personalAllowance} onChange={(e) => updateForm({ personalAllowance: e.target.value })} />
            <Input label="H.R" type="number" min="0" step="0.01" value={form.hr} onChange={(e) => updateForm({ hr: e.target.value })} />
            <Input label="C.A" type="number" min="0" step="0.01" value={form.ca} onChange={(e) => updateForm({ ca: e.target.value })} />
            <Input label="M.A" type="number" min="0" step="0.01" value={form.ma} onChange={(e) => updateForm({ ma: e.target.value })} />
            <Input label="Ad-hoc Allowance 2022 (15%)" type="number" min="0" step="0.01" value={form.adHocAllowance2022} onChange={(e) => updateForm({ adHocAllowance2022: e.target.value })} />
            <Input label="Ad-hoc Allowance 2023 (30% & 35%)" type="number" min="0" step="0.01" value={form.adHocAllowance2023} onChange={(e) => updateForm({ adHocAllowance2023: e.target.value })} />
            <Input label="Ad-hoc Allowance 2024 (20% & 25%)" type="number" min="0" step="0.01" value={form.adHocAllowance2024} onChange={(e) => updateForm({ adHocAllowance2024: e.target.value })} />
            <Input label="Ad-hoc Allowance 2025 (10%)" type="number" min="0" step="0.01" value={form.adHocAllowance2025} onChange={(e) => updateForm({ adHocAllowance2025: e.target.value })} />
            <Input label="Overtime Allowance" type="number" min="0" step="0.01" value={form.overtimeAllowance} onChange={(e) => updateForm({ overtimeAllowance: e.target.value })} />
            <Input label="Integrated Allowance" type="number" min="0" step="0.01" value={form.integratedAllowance} onChange={(e) => updateForm({ integratedAllowance: e.target.value })} />
            <Input label="W.A" type="number" min="0" step="0.01" value={form.wa} onChange={(e) => updateForm({ wa: e.target.value })} />
            <Input label="Special Allowance" type="number" min="0" step="0.01" value={form.specialAllowance} onChange={(e) => updateForm({ specialAllowance: e.target.value })} />
            <Input label="Special Pay" type="number" min="0" step="0.01" value={form.specialPay} onChange={(e) => updateForm({ specialPay: e.target.value })} />
            <Input label="M-Phil/Special Allowance" type="number" min="0" step="0.01" value={form.mphilSpecialAllowance} onChange={(e) => updateForm({ mphilSpecialAllowance: e.target.value })} />
            <Input label="Social Security Benefit" type="number" min="0" step="0.01" value={form.socialSecurityBenefit} onChange={(e) => updateForm({ socialSecurityBenefit: e.target.value })} />
            <Input label="Gross Salary" type="number" min="0" step="0.01" value={form.grossSalary} onChange={(e) => updateForm({ grossSalary: e.target.value })} />
          </div>

          <SectionTitle>Deductions & Net Pay</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Deduction (If Any)" type="number" min="0" step="0.01" value={form.deduction} onChange={(e) => updateForm({ deduction: e.target.value })} />
            <Input label="Arrears (if any)" type="number" min="0" step="0.01" value={form.arrears} onChange={(e) => updateForm({ arrears: e.target.value })} />
            <Input label="Gross Salary with taxes" type="number" min="0" step="0.01" value={form.grossSalaryWithTaxes} onChange={(e) => updateForm({ grossSalaryWithTaxes: e.target.value })} />
            <Input label="Deduct: Income Tax (May, 2026)" type="number" min="0" step="0.01" value={form.incomeTaxMay2026} onChange={(e) => updateForm({ incomeTaxMay2026: e.target.value })} />
            <Input label="GP Fund" type="number" min="0" step="0.01" value={form.gpFund} onChange={(e) => updateForm({ gpFund: e.target.value })} />
            <Input label="Net Payable" type="number" min="0" step="0.01" value={form.netPayable} onChange={(e) => updateForm({ netPayable: e.target.value })} />
            <Input label="Account Number" value={form.accountNumber} onChange={(e) => updateForm({ accountNumber: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!!editing && !isEditDirty}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name} (${deleteTarget.employeeCode})? This action cannot be undone.`
            : ''
        }
        loading={deleting}
      />
    </PageContainer>
  );
}
