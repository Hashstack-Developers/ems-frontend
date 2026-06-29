'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TableFilters } from '@/components/ui/TableFilters';
import {
  EmptyState,
  PageContainer,
  PageHeader,
} from '@/components/layout/PageShell';
import { SkeletonBar } from '@/components/ui/Skeletons';
import { matchesSearch } from '@/lib/table-filter';
import type { ApiResponse, GpFundScale } from '@/types';

export default function GpFundScalesPage() {
  const toast = useToast();
  const [scales, setScales] = useState<GpFundScale[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GpFundScale | null>(null);
  const [newScaleCode, setNewScaleCode] = useState('');
  const [newScaleValue, setNewScaleValue] = useState('');
  const [search, setSearch] = useState('');

  const fetchScales = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    try {
      const { data } = await api.get<ApiResponse<GpFundScale[]>>('/gp-fund/scales');
      setScales(data.data);
      setDrafts(
        Object.fromEntries(
          data.data.map((scale) => [scale.id, String(Number(scale.value))]),
        ),
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchScales();
  }, [fetchScales]);

  const filteredScales = useMemo(
    () => scales.filter((scale) => matchesSearch(search, scale.code, scale.value)),
    [scales, search],
  );

  const isDirty = (scale: GpFundScale) =>
    Number(drafts[scale.id] ?? scale.value) !== Number(scale.value);

  const handleSave = async (scale: GpFundScale) => {
    const raw = drafts[scale.id] ?? String(scale.value);
    const parsed = Number(raw);

    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error('Enter a valid GP scale value');
      return;
    }

    if (parsed === Number(scale.value)) {
      toast.info('No changes to save');
      return;
    }

    setSavingId(scale.id);
    try {
      const { data } = await api.patch<ApiResponse<GpFundScale>>(`/gp-fund/scales/${scale.id}`, {
        value: parsed,
      });
      setScales((current) =>
        current.map((item) => (item.id === scale.id ? data.data : item)),
      );
      setDrafts((current) => ({ ...current, [scale.id]: String(Number(data.data.value)) }));
      toast.success(`${scale.code} updated`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async () => {
    const code = newScaleCode.trim().toUpperCase();
    const rawValue = newScaleValue.trim();
    const parsedValue = rawValue === '' ? 0 : Number(rawValue);

    if (!/^B-\d+$/.test(code)) {
      toast.error('Scale code must be like B-1');
      return;
    }
    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      toast.error('Enter a valid monthly subscription');
      return;
    }

    setCreating(true);
    try {
      const { data } = await api.post<ApiResponse<GpFundScale>>('/gp-fund/scales', {
        code,
        value: parsedValue,
      });
      setScales((current) =>
        [...current, data.data].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
      );
      setDrafts((current) => ({
        ...current,
        [data.data.id]: String(Number(data.data.value)),
      }));
      setModalOpen(false);
      setNewScaleCode('');
      setNewScaleValue('');
      toast.success(`${code} added`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await api.delete(`/gp-fund/scales/${deleteTarget.id}`);
      setScales((current) => current.filter((scale) => scale.id !== deleteTarget.id));
      setDrafts((current) => {
        const next = { ...current };
        delete next[deleteTarget.id];
        return next;
      });
      toast.success(`${deleteTarget.code} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageContainer fill>
      <PageHeader
        title="GP Scales"
        subtitle="Manage monthly subscription values for B-1 to B-22 scales"
        onRefetch={() => fetchScales({ refetch: true })}
        refetching={refetching}
        actions={
          hasPermission('gpFund.create') ? (
            <Button onClick={() => setModalOpen(true)}>+ Add Scale</Button>
          ) : undefined
        }
      />

      <TableFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by scale code..."
      />

      {loading || refetching ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="card-modern space-y-4 p-4">
              <SkeletonBar className="h-5 w-16" />
              <SkeletonBar className="h-10 w-full" />
              <div className="flex gap-2">
                <SkeletonBar className="h-9 flex-1" />
                <SkeletonBar className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredScales.length === 0 ? (
        <EmptyState
          icon="🧮"
          title="No GP scales found"
          description="Try adjusting your search or add a new scale."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredScales.map((scale) => (
            <div key={scale.id} className="card-modern space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Scale</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{scale.code}</p>
                </div>
              </div>

              <div>
                <Input
                  label="Monthly Subscription"
                  value={drafts[scale.id] ?? ''}
                  type="number"
                  min="0"
                  step="0.01"
                  onChange={(e) =>
                    setDrafts((current) => ({
                      ...current,
                      [scale.id]: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  size="sm"
                  loading={savingId === scale.id}
                  disabled={!hasPermission('gpFund.update') || !isDirty(scale)}
                  onClick={() => handleSave(scale)}
                >
                  Save
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  variant="danger"
                  loading={deletingId === scale.id}
                  disabled={!hasPermission('gpFund.delete')}
                  onClick={() => setDeleteTarget(scale)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add GP Scale">
        <div className="space-y-3">
          <Input
            label="Scale"
            value={newScaleCode}
            onChange={(e) => setNewScaleCode(e.target.value)}
            placeholder="B-23"
          />
          <Input
            label="Monthly Subscription"
            type="number"
            min="0"
            step="0.01"
            value={newScaleValue}
            onChange={(e) => setNewScaleValue(e.target.value)}
            placeholder="600"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" loading={creating} onClick={handleCreate}>
              Add Scale
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete GP Scale"
        message={
          deleteTarget
            ? `Delete GP scale ${deleteTarget.code}? This action cannot be undone.`
            : ''
        }
        loading={deletingId != null}
      />
    </PageContainer>
  );
}
