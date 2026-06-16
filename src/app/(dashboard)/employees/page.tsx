'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { getChangedFields, hasFieldChanges, NO_CHANGES_MESSAGE, optionalStringsEqual } from '@/lib/form-changes';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
import { EmployeeWizard } from './EmployeeWizard';

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
  const [discardConfirm, setDiscardConfirm] = useState(false);

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
    if (key === 'mobile' || key === 'employmentType' || key === 'cnicNo' || key === 'srNo') {
      return optionalStringsEqual(String(current), String(original));
    }
    return current === original;
  };

  const isEditDirty = useMemo(() => {
    if (!editing) return true;
    return hasFieldChanges(form, originalForm, EDITABLE_FORM_FIELDS, { isEqual: fieldComparator });
  }, [editing, form, originalForm]);

  const isFormDirty = useMemo(() => {
    if (editing) return isEditDirty;
    return hasFieldChanges(form, emptyForm, EDITABLE_FORM_FIELDS, { isEqual: fieldComparator });
  }, [editing, form, isEditDirty]);

  const closeModal = () => {
    if (isFormDirty) {
      setDiscardConfirm(true);
      return;
    }
    setModalOpen(false);
  };

  const confirmDiscard = () => {
    setDiscardConfirm(false);
    setModalOpen(false);
  };

  const handleSubmit = async () => {
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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Employee' : 'Add Employee'}
        size="xl"
        scrollBody={false}
      >
        <EmployeeWizard
          key={editing?.id ?? 'create'}
          form={form}
          employeeCode={editing?.employeeCode}
          isEditing={!!editing}
          saving={saving}
          isDirty={isEditDirty}
          onUpdate={updateForm}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmModal
        open={discardConfirm}
        onClose={() => setDiscardConfirm(false)}
        onConfirm={confirmDiscard}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirmLabel="Discard"
      />

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
