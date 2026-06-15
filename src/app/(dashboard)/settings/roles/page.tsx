'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { NO_CHANGES_MESSAGE, stringArraysEqualAsSet } from '@/lib/form-changes';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { DataTableCard, Th, Td } from '@/components/layout/PageShell';
import { SkeletonBar } from '@/components/ui/Skeletons';
import { ACTION_LABELS, MODULE_LABELS } from '@/constants/permissions';
import type { ApiResponse, PermissionDefinition, RoleDetail, RoleSummary } from '@/types';

export default function RolesSettingsPage() {
  const toast = useToast();
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [roleDetail, setRoleDetail] = useState<RoleDetail | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get<ApiResponse<RoleSummary[]>>('/roles'),
        api.get<ApiResponse<PermissionDefinition[]>>('/roles/permissions'),
      ]);
      setRoles(rolesRes.data.data);
      setPermissions(permissionsRes.data.data);
      if (!selectedRoleId && rolesRes.data.data.length > 0) {
        setSelectedRoleId(rolesRes.data.data[0].id);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedRoleId, toast]);

  const fetchRoleDetail = useCallback(async (roleId: number) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get<ApiResponse<RoleDetail>>(`/roles/${roleId}`);
      setRoleDetail(data.data);
      setDraftPermissions(data.data.permissions);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRoleDetail(selectedRoleId);
    }
  }, [selectedRoleId, fetchRoleDetail]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, PermissionDefinition[]>>((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});
  }, [permissions]);

  const togglePermission = (key: string) => {
    setDraftPermissions((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  const savePermissions = async () => {
    if (!selectedRoleId || !roleDetail) return;
    if (!permissionsDirty) {
      toast.info(NO_CHANGES_MESSAGE);
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/roles/${selectedRoleId}/permissions`, {
        permissions: draftPermissions,
      });
      toast.success('Role permissions updated');
      await fetchRoleDetail(selectedRoleId);
      await fetchRoles();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;
  const canEdit = hasPermission('roles.update') && selectedRole?.name !== 'super';
  const permissionsDirty = useMemo(
    () => roleDetail ? !stringArraysEqualAsSet(draftPermissions, roleDetail.permissions) : false,
    [draftPermissions, roleDetail],
  );
  const panelMaxHeight = 'max-h-[calc(100dvh-12rem)]';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Role Management</h2>
        <p className="mt-1 text-sm text-muted">Review roles, assign permissions, and see affected users</p>
      </div>

      <div className={`grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start ${panelMaxHeight}`}>
        <div className={`card-modern flex flex-col overflow-hidden p-3 ${panelMaxHeight}`}>
          <p className="shrink-0 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-light">Roles</p>
          {loading ? (
            <div className="space-y-2 overflow-y-auto p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-neutral-100" />
              ))}
            </div>
          ) : (
            <div className="scroll-area min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-1">
                {roles.map((role) => {
                const active = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full cursor-pointer rounded-xl px-3 py-3 text-left transition-all ${
                      active
                        ? 'bg-primary-light text-primary shadow-sm ring-1 ring-primary-soft'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <p className="text-sm font-medium">{role.label}</p>
                    <p className="mt-0.5 text-xs text-muted">{role.permissionCount} permissions</p>
                  </button>
                );
              })}
              </div>
            </div>
          )}
        </div>

        <div className={`flex min-h-0 flex-col gap-6 overflow-hidden ${panelMaxHeight}`}>
          {detailLoading || !roleDetail ? (
            <div className={`card-modern space-y-4 overflow-y-auto p-5 sm:p-6 ${panelMaxHeight}`}>
              <SkeletonBar className="h-6 w-40" />
              <SkeletonBar className="h-4 w-72 max-w-full" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBar key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="card-modern flex min-h-0 flex-1 flex-col overflow-hidden p-5 sm:p-6">
                <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{roleDetail.label}</h3>
                    <p className="mt-1 text-sm text-muted">{roleDetail.description ?? 'No description'}</p>
                    <p className="mt-2 text-xs text-muted-light">
                      {roleDetail.isSystem ? 'System role' : 'Custom role'} · {roleDetail.users.length} assigned user(s)
                    </p>
                  </div>
                  {canEdit && (
                    <Button onClick={savePermissions} loading={saving} disabled={!permissionsDirty}>
                      Save Permissions
                    </Button>
                  )}
                </div>

                <div className="scroll-area mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                    <div key={module} className="rounded-xl border border-border p-4">
                      <h4 className="text-sm font-semibold text-foreground">
                        {MODULE_LABELS[module] ?? module}
                      </h4>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {modulePermissions.map((permission) => {
                          const checked = draftPermissions.includes(permission.key);
                          const disabled = !canEdit;
                          return (
                            <label
                              key={permission.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                                checked ? 'border-primary-soft bg-primary-light/40' : 'border-border'
                              } ${disabled ? 'opacity-70' : 'hover:border-primary-soft'}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => togglePermission(permission.key)}
                                className="mt-0.5"
                              />
                              <span>
                                <span className="block text-sm font-medium text-foreground">
                                  {ACTION_LABELS[permission.action] ?? permission.action}
                                </span>
                                <span className="block text-xs text-muted">{permission.description}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>

              <DataTableCard
                fill={false}
                className="max-h-[220px] shrink-0"
                header={
                  <>
                    <Th className="min-w-[180px]">User</Th>
                    <Th className="min-w-[200px]">Email</Th>
                    <Th className="w-[120px]">Status</Th>
                  </>
                }
              >
                {roleDetail.users.length === 0 ? (
                  <tr><td colSpan={3} className="py-8 text-center text-muted-light">No users assigned to this role</td></tr>
                ) : (
                  roleDetail.users.map((user) => (
                    <tr key={user.id}>
                      <Td className="font-medium">{user.fullName}</Td>
                      <Td>{user.email}</Td>
                      <Td>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive !== false ? 'bg-success-soft text-success' : 'bg-neutral-100 text-neutral-600'}`}>
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </Td>
                    </tr>
                  ))
                )}
              </DataTableCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
