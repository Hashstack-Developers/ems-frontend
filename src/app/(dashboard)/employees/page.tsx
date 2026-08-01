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
import { Select } from '@/components/ui/Select';
import { TableFilters } from '@/components/ui/TableFilters';
import { DataTableCard, PageContainer, PageHeader, Th, Td } from '@/components/layout/PageShell';
import { TableBodySkeleton } from '@/components/ui/Skeletons';
import { matchesSearch } from '@/lib/table-filter';
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

type ModalMode = 'create' | 'edit' | 'view';

export default function EmployeesPage() {
  const toast = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormValues>(emptyForm);
  const [originalForm, setOriginalForm] = useState<EmployeeFormValues>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [disabilityFilter, setDisabilityFilter] = useState('');

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
    if (modalMode === 'view') return;
    setForm((current) => applyDerivedFields({ ...current, ...patch }));
  };

  const openCreate = () => {
    setModalMode('create');
    setEditing(null);
    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setModalMode('edit');
    setEditing(emp);
    const nextForm = employeeToForm(emp);
    setForm(nextForm);
    setOriginalForm(nextForm);
    setModalOpen(true);
  };

  const openView = (emp: Employee) => {
    setModalMode('view');
    setEditing(emp);
    const nextForm = employeeToForm(emp);
    setForm(nextForm);
    setOriginalForm(nextForm);
    setModalOpen(true);
  };

  const fieldComparator = (
    key: keyof EmployeeFormValues,
    current: unknown,
    original: unknown,
  ) => {
    if ((NUMERIC_FORM_FIELDS as readonly string[]).includes(key)) {
      const currentNum = current === '' ? null : Number(current);
      const originalNum = original === '' ? null : Number(original);
      return currentNum === originalNum;
    }
    if (key === 'mobile' || key === 'employmentType' || key === 'employeeType' || key === 'disability' || key === 'cnicNo' || key === 'address' || key === 'gpFund') {
      return optionalStringsEqual(String(current), String(original));
    }
    return current === original;
  };

  const isEditDirty = useMemo(() => {
    if (!editing || modalMode !== 'edit') return true;
    return hasFieldChanges(form, originalForm, EDITABLE_FORM_FIELDS, { isEqual: fieldComparator });
  }, [editing, modalMode, form, originalForm]);

  const isFormDirty = useMemo(() => {
    if (modalMode === 'view') return false;
    if (modalMode === 'edit') return isEditDirty;
    return hasFieldChanges(form, emptyForm, EDITABLE_FORM_FIELDS, { isEqual: fieldComparator });
  }, [modalMode, editing, form, isEditDirty]);

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
    if (modalMode !== 'edit' && modalMode !== 'create') return;
    if (modalMode === 'edit' && !isEditDirty) {
      toast.info(NO_CHANGES_MESSAGE);
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'edit' && editing) {
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

  const showActionsColumn = hasAnyPermission('employees.view', 'employees.update', 'employees.delete');
  const columnCount = showActionsColumn ? 9 : 8;

  const designationOptions = useMemo(() => {
    const unique = [...new Set(employees.map((emp) => emp.designation).filter(Boolean))].sort();
    return [
      { value: '', label: 'All designations' },
      ...unique.map((designation) => ({ value: designation, label: designation })),
    ];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (statusFilter && emp.status !== statusFilter) return false;
      if (employmentTypeFilter && emp.employmentType !== employmentTypeFilter) return false;
      if (designationFilter && emp.designation !== designationFilter) return false;
      if (disabilityFilter && emp.disability !== disabilityFilter) return false;
      return matchesSearch(
        search,
        emp.employeeCode,
        emp.name,
        emp.designation,
        emp.email,
        emp.cnicNo,
        emp.basicPayScale,
        emp.gpFund,
      );
    });
  }, [employees, search, statusFilter, employmentTypeFilter, designationFilter, disabilityFilter]);

  const employeeLabel = editing?.name?.trim() || form.name?.trim() || '';
  const modalTitle =
    modalMode === 'view'
      ? employeeLabel
        ? `View Employee — ${employeeLabel}`
        : 'View Employee'
      : modalMode === 'edit'
        ? employeeLabel
          ? `Edit Employee — ${employeeLabel}`
          : 'Edit Employee'
        : 'Add Employee';

  return (
    <PageContainer fill>
      <PageHeader
        title="Employees"
        subtitle="Manage employee records"
        onRefetch={() => fetchEmployees({ refetch: true })}
        refetching={refetching}
        actions={hasPermission('employees.create') ? <Button onClick={openCreate}>+ Add Employee</Button> : undefined}
      />

      <TableFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, code, designation, email…"
      >
        <div className="w-full sm:w-36">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
        <div className="w-full sm:w-36">
          <Select
            label="Employment"
            value={employmentTypeFilter}
            onChange={(e) => setEmploymentTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'All types' },
              { value: 'contract', label: 'Contract' },
              { value: 'regular', label: 'Regular' },
            ]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Designation"
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            options={designationOptions}
          />
        </div>
        <div className="w-full sm:w-36">
          <Select
            label="Disability"
            value={disabilityFilter}
            onChange={(e) => setDisabilityFilter(e.target.value)}
            options={[
              { value: '', label: 'All' },
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ]}
          />
        </div>
      </TableFilters>

      <DataTableCard
        header={
          <>
            <Th className="w-[80px]">Sr No</Th>
            <Th className="min-w-[160px] w-[160px]">Code</Th>
            <Th className="min-w-[180px]">Name</Th>
            <Th className="min-w-[150px]">Father Name</Th>
            <Th className="min-w-[150px]">Designation</Th>
            <Th className="w-[140px]">Gross w/ Taxes</Th>
            <Th className="w-[100px]">Status</Th>
            <Th className="w-[120px]">Joined</Th>
            {showActionsColumn && <Th className="w-[260px]">Actions</Th>}
          </>
        }
      >
        {loading || refetching ? (
          <TableBodySkeleton rows={8} cols={columnCount} />
        ) : filteredEmployees.length === 0 ? (
          <tr><td colSpan={columnCount} className="py-8 text-center text-muted-light">No employees found</td></tr>
        ) : (
          filteredEmployees.map((emp) => (
            <tr key={emp.id}>
              <Td className="font-mono text-xs">{emp.srNo ?? '—'}</Td>
              <Td className="whitespace-nowrap font-mono text-xs">{emp.employeeCode}</Td>
              <Td className="font-medium">{emp.name}</Td>
              <Td className="text-muted">{emp.fatherName ?? '—'}</Td>
              <Td>{emp.designation}</Td>
              <Td>{formatCurrency(Number(emp.grossSalaryWithTaxes ?? emp.basicPayDec2025 ?? 0))}</Td>
              <Td>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${emp.status === 'active' ? 'bg-success-soft text-success' : 'bg-neutral-100 text-neutral-600'}`}>
                  {emp.status}
                </span>
              </Td>
              <Td>{formatDate(emp.dateOfJoining)}</Td>
              {showActionsColumn && (
              <Td>
                <div className="flex flex-wrap gap-2">
                  {hasPermission('employees.view') && (
                    <Button size="sm" variant="secondary" onClick={() => openView(emp)}>View</Button>
                  )}
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
        title={modalTitle}
        size="xl"
        scrollBody={false}
      >
        <EmployeeWizard
          key={`${modalMode}-${editing?.id ?? 'create'}`}
          form={form}
          employeeId={editing?.id}
          employeeCode={editing?.employeeCode}
          isEditing={modalMode === 'edit'}
          isViewing={modalMode === 'view'}
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
