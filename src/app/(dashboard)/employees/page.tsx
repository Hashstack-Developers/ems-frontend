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

const emptyForm = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  basicSalary: '',
  joinDate: new Date().toISOString().slice(0, 10),
  status: 'active' as 'active' | 'inactive',
};

export default function EmployeesPage() {
  const toast = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] = useState(emptyForm);
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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    const nextForm = {
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone ?? '',
      department: emp.department,
      designation: emp.designation,
      basicSalary: String(emp.basicSalary),
      joinDate: emp.joinDate,
      status: emp.status,
    };
    setForm(nextForm);
    setOriginalForm(nextForm);
    setModalOpen(true);
  };

  const editFields = [
    'employeeCode',
    'firstName',
    'lastName',
    'email',
    'phone',
    'department',
    'designation',
    'basicSalary',
    'joinDate',
    'status',
  ] as const;

  const fieldComparator = (
    key: (typeof editFields)[number],
    current: unknown,
    original: unknown,
  ) => {
    if (key === 'phone') {
      return optionalStringsEqual(String(current), String(original));
    }
    if (key === 'basicSalary') {
      return Number(current) === Number(original);
    }
    return current === original;
  };

  const isEditDirty = useMemo(() => {
    if (!editing) {
      return true;
    }
    return hasFieldChanges(form, originalForm, editFields, { isEqual: fieldComparator });
  }, [editing, form, originalForm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (editing && !isEditDirty) {
      toast.info(NO_CHANGES_MESSAGE);
      return;
    }

    setSaving(true);
    const buildPayload = (source: typeof form) => ({
      ...source,
      basicSalary: parseFloat(source.basicSalary),
      phone: source.phone || undefined,
    });

    try {
      if (editing) {
        const changes = getChangedFields(form, originalForm, editFields, { isEqual: fieldComparator });
        const payload = buildPayload({ ...originalForm, ...changes });
        await api.patch(`/employees/${editing.id}`, payload);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', buildPayload(form));
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
            <Th className="min-w-[140px]">Department</Th>
            <Th className="w-[120px]">Salary</Th>
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
              <Td className="font-medium">{emp.firstName} {emp.lastName}</Td>
              <Td>{emp.department}</Td>
              <Td>{formatCurrency(Number(emp.basicSalary))}</Td>
              <Td>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${emp.status === 'active' ? 'bg-success-soft text-success' : 'bg-neutral-100 text-neutral-600'}`}>
                  {emp.status}
                </span>
              </Td>
              <Td>{formatDate(emp.joinDate)}</Td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Employee Code" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} required />
              <Input label="Join Date" type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
              <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Basic Salary" type="number" min="0" step="0.01" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} required />
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
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
            ? `Are you sure you want to delete ${deleteTarget.firstName} ${deleteTarget.lastName} (${deleteTarget.employeeCode})? This action cannot be undone.`
            : ''
        }
        loading={deleting}
      />
    </PageContainer>
  );
}
