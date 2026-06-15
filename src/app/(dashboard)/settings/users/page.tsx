'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { getChangedFields, hasFieldChanges, NO_CHANGES_MESSAGE } from '@/lib/form-changes';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { DataTableCard, Th, Td } from '@/components/layout/PageShell';
import { TableBodySkeleton } from '@/components/ui/Skeletons';
import type { ApiResponse, RoleSummary, User } from '@/types';

const emptyForm = {
  email: '',
  fullName: '',
  password: '',
  roleId: '',
};

export default function UsersSettingsPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] = useState(emptyForm);
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [activateTarget, setActivateTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [activating, setActivating] = useState(false);

  const fetchData = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get<ApiResponse<User[]>>(`/users${roleFilter ? `?role=${roleFilter}` : ''}`),
        api.get<ApiResponse<RoleSummary[]>>('/roles'),
      ]);
      setUsers(usersRes.data.data);
      setRoles(rolesRes.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [roleFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    const nextForm = {
      ...emptyForm,
      roleId: roles[0] ? String(roles[0].id) : '',
    };
    setForm(nextForm);
    setOriginalForm(nextForm);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    const nextForm = {
      email: user.email,
      fullName: user.fullName,
      password: '',
      roleId: user.roleId ? String(user.roleId) : '',
    };
    setForm(nextForm);
    setOriginalForm(nextForm);
    setModalOpen(true);
  };

  const editFields = ['email', 'fullName', 'roleId'] as const;
  const isEditDirty = useMemo(() => {
    if (!editing) {
      return true;
    }

    return (
      hasFieldChanges(form, originalForm, editFields) ||
      form.password.trim().length > 0
    );
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
        const changes = getChangedFields(form, originalForm, editFields);
        const payload: Record<string, unknown> = { ...changes };
        if (form.password) {
          payload.password = form.password;
        }
        if (payload.roleId !== undefined) {
          payload.roleId = Number(payload.roleId);
        }
        await api.patch(`/users/${editing.id}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', {
          email: form.email,
          fullName: form.fullName,
          password: form.password,
          roleId: Number(form.roleId),
        });
        toast.success('User created successfully');
      }
      setModalOpen(false);
      fetchData({ refetch: true });
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
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('User deleted successfully');
      setDeleteTarget(null);
      fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await api.patch(`/users/${deactivateTarget.id}/deactivate`);
      toast.success('User deactivated successfully');
      setDeactivateTarget(null);
      fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeactivating(false);
    }
  };

  const confirmActivate = async () => {
    if (!activateTarget) return;
    setActivating(true);
    try {
      await api.patch(`/users/${activateTarget.id}/activate`);
      toast.success('User activated successfully');
      setActivateTarget(null);
      fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActivating(false);
    }
  };

  const showActionsColumn = hasAnyPermission('users.update', 'users.deactivate', 'users.delete');
  const columnCount = showActionsColumn ? 5 : 4;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">User Management</h2>
          <p className="mt-1 text-sm text-muted">Create users, assign roles, and manage access</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            label=""
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'All roles' },
              ...roles.map((role) => ({ value: role.name, label: role.label })),
            ]}
            className="min-w-[160px]"
          />
          {hasPermission('users.create') && (
            <Button onClick={openCreate}>+ Add User</Button>
          )}
        </div>
      </div>

      <DataTableCard
        minWidth={showActionsColumn ? 'min-w-[1040px]' : 'min-w-[760px]'}
        fill={false}
        header={
          <>
            <Th className="min-w-[160px]">Name</Th>
            <Th className="min-w-[220px]">Email</Th>
            <Th className="min-w-[140px]">Role</Th>
            <Th className="min-w-[90px]">Status</Th>
            {showActionsColumn && <Th className="min-w-[280px]">Actions</Th>}
          </>
        }
      >
        {loading || refetching ? (
          <TableBodySkeleton rows={6} cols={columnCount} />
        ) : users.length === 0 ? (
          <tr><td colSpan={columnCount} className="py-8 text-center text-muted-light">No users found</td></tr>
        ) : (
          users.map((user) => (
            <tr key={user.id}>
              <Td className="font-medium">{user.fullName}</Td>
              <Td>{user.email}</Td>
              <Td>
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium capitalize text-primary-hover">
                  {user.roleLabel ?? user.role}
                </span>
              </Td>
              <Td>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive !== false ? 'bg-success-soft text-success' : 'bg-neutral-100 text-neutral-600'}`}>
                  {user.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </Td>
              {showActionsColumn && (
              <Td className="whitespace-nowrap">
                <div className="flex flex-nowrap items-center gap-2">
                  {hasPermission('users.update') && (
                    <Button size="sm" variant="secondary" onClick={() => openEdit(user)}>Edit</Button>
                  )}
                  {hasPermission('users.deactivate') && user.isActive !== false && (
                    <Button size="sm" variant="secondary" onClick={() => setDeactivateTarget(user)}>Deactivate</Button>
                  )}
                  {hasPermission('users.deactivate') && user.isActive === false && (
                    <Button size="sm" variant="secondary" onClick={() => setActivateTarget(user)}>Activate</Button>
                  )}
                  {hasPermission('users.delete') && (
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(user)}>Delete</Button>
                  )}
                </div>
              </Td>
              )}
            </tr>
          ))
        )}
      </DataTableCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Select
            label="Role"
            value={form.roleId}
            onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            options={roles.map((role) => ({ value: String(role.id), label: role.label }))}
            required
          />
          <Input
            label={editing ? 'New Password (optional)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
            minLength={8}
            autoComplete="new-password"
          />
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
        title="Delete User"
        message={deleteTarget ? `Delete ${deleteTarget.fullName} (${deleteTarget.email})? This cannot be undone.` : ''}
        loading={deleting}
      />

      <ConfirmModal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={confirmDeactivate}
        title="Deactivate User"
        message={deactivateTarget ? `Deactivate ${deactivateTarget.fullName}? They will no longer be able to sign in.` : ''}
        loading={deactivating}
      />

      <ConfirmModal
        open={!!activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={confirmActivate}
        title="Activate User"
        message={activateTarget ? `Reactivate ${activateTarget.fullName}? They will be able to sign in again.` : ''}
        confirmLabel="Activate"
        loading={activating}
      />
    </div>
  );
}
