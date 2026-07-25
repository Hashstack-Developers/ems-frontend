'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { hasPermission } from '@/lib/permissions';
import { matchesSearch } from '@/lib/table-filter';
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
import { PERMISSIONS } from '@/constants/permissions';
import type { ApiResponse, BpsScale } from '@/types';

type ScaleDraft = {
  minSalary: string;
  maxSalary: string;
  incrementAmount: string;
  maxYears: string;
};

export default function IncrementsScalesPage() {
  const toast = useToast();
  const canUpdate = hasPermission(PERMISSIONS.INCREMENTS_UPDATE);
  const [scales, setScales] = useState<BpsScale[]>([]);
  const [drafts, setDrafts] = useState<Record<number, ScaleDraft>>({});
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const fetchScales = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    try {
      const { data } = await api.get<ApiResponse<BpsScale[]>>('/increments/scales');
      setScales(data.data);
      setDrafts(
        Object.fromEntries(
          data.data.map((scale) => [
            scale.id,
            {
              minSalary: String(Number(scale.minSalary)),
              maxSalary: String(Number(scale.maxSalary)),
              incrementAmount: String(Number(scale.incrementAmount)),
              maxYears: String(Number(scale.maxYears)),
            },
          ]),
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
    () => scales.filter((scale) => matchesSearch(search, scale.code, scale.level)),
    [scales, search],
  );

  const isDirty = (scale: BpsScale) => {
    const draft = drafts[scale.id];
    if (!draft) return false;
    return (
      Number(draft.minSalary) !== Number(scale.minSalary) ||
      Number(draft.maxSalary) !== Number(scale.maxSalary) ||
      Number(draft.incrementAmount) !== Number(scale.incrementAmount) ||
      Number(draft.maxYears) !== Number(scale.maxYears)
    );
  };

  const updateDraft = (id: number, patch: Partial<ScaleDraft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  };

  const handleSave = async (scale: BpsScale) => {
    const draft = drafts[scale.id];
    if (!draft) return;

    const minSalary = Number(draft.minSalary);
    const maxSalary = Number(draft.maxSalary);
    const incrementAmount = Number(draft.incrementAmount);
    const maxYears = Number(draft.maxYears);

    if (
      [minSalary, maxSalary, incrementAmount, maxYears].some((n) => Number.isNaN(n)) ||
      minSalary < 0 ||
      maxSalary < 0 ||
      incrementAmount < 0 ||
      maxYears < 1
    ) {
      toast.error('Enter valid min, max, increment, and years values');
      return;
    }

    if (maxSalary < minSalary) {
      toast.error('Max salary must be ≥ min salary');
      return;
    }

    if (!isDirty(scale)) {
      toast.info('No changes to save');
      return;
    }

    setSavingId(scale.id);
    try {
      const { data } = await api.patch<ApiResponse<BpsScale>>(`/increments/scales/${scale.id}`, {
        minSalary,
        maxSalary,
        incrementAmount,
        maxYears,
      });
      setScales((current) =>
        current.map((item) => (item.id === scale.id ? data.data : item)),
      );
      setDrafts((current) => ({
        ...current,
        [scale.id]: {
          minSalary: String(Number(data.data.minSalary)),
          maxSalary: String(Number(data.data.maxSalary)),
          incrementAmount: String(Number(data.data.incrementAmount)),
          maxYears: String(Number(data.data.maxYears)),
        },
      }));
      toast.success(`${scale.code} updated`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <PageContainer fill>
      <PageHeader
        title="BPS Scales"
        subtitle="Min, max, annual increment, and years for BPS-1 to BPS-22"
        onRefetch={() => fetchScales({ refetch: true })}
        refetching={refetching}
      />

      <TableFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by BPS code…"
      />

      {loading || refetching ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card-modern space-y-4 p-4">
              <SkeletonBar className="h-5 w-20" />
              <SkeletonBar className="h-10 w-full" />
              <SkeletonBar className="h-10 w-full" />
              <SkeletonBar className="h-9 w-24" />
            </div>
          ))}
        </div>
      ) : filteredScales.length === 0 ? (
        <EmptyState
          icon="🧮"
          title="No BPS scales found"
          description="Scales are seeded automatically on startup."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredScales.map((scale) => {
            const draft = drafts[scale.id];
            return (
              <div key={scale.id} className="card-modern space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">Scale</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{scale.code}</p>
                  </div>
                  {isDirty(scale) && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      Unsaved
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min"
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft?.minSalary ?? ''}
                    disabled={!canUpdate}
                    onChange={(e) => updateDraft(scale.id, { minSalary: e.target.value })}
                  />
                  <Input
                    label="Max"
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft?.maxSalary ?? ''}
                    disabled={!canUpdate}
                    onChange={(e) => updateDraft(scale.id, { maxSalary: e.target.value })}
                  />
                  <Input
                    label="Increment"
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft?.incrementAmount ?? ''}
                    disabled={!canUpdate}
                    onChange={(e) => updateDraft(scale.id, { incrementAmount: e.target.value })}
                  />
                  <Input
                    label="Years"
                    type="number"
                    min="1"
                    step="1"
                    value={draft?.maxYears ?? ''}
                    disabled={!canUpdate}
                    onChange={(e) => updateDraft(scale.id, { maxYears: e.target.value })}
                  />
                </div>

                {canUpdate && (
                  <Button
                    size="sm"
                    loading={savingId === scale.id}
                    disabled={!isDirty(scale)}
                    onClick={() => handleSave(scale)}
                  >
                    Save
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
