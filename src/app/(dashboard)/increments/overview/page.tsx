'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { matchesSearch } from '@/lib/table-filter';
import { useToast } from '@/contexts/ToastContext';
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
import { SkeletonBar, TableBodySkeleton } from '@/components/ui/Skeletons';
import type { ApiResponse, IncrementsOverviewData, IncrementsOverviewEmployee } from '@/types';

type StatusFilter = 'all' | 'eligible' | 'nearMax' | 'atMax';

function StatusBadge({ row }: { row: IncrementsOverviewEmployee }) {
  if (row.wouldExceedMax) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning-light px-2.5 py-1 text-xs font-semibold text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        At max
      </span>
    );
  }
  if (row.nearMax) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Near max
      </span>
    );
  }
  if (row.eligible) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success-dark">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        On track
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
      {row.reason ?? 'Not eligible'}
    </span>
  );
}

function YearsProgress({ applied, max }: { applied: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((applied / max) * 100)) : 0;
  return (
    <div className="min-w-[110px]">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {applied}/{max}
        </span>
        <span className="text-muted">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-primary text-white shadow-sm ring-1 ring-primary-soft'
          : 'filter-chip-inactive'
      }`}
    >
      {label}
      <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-muted'}`}>{count}</span>
    </button>
  );
}

export default function IncrementsOverviewPage() {
  const toast = useToast();
  const [data, setData] = useState<IncrementsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchOverview = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    try {
      const { data: response } = await api.get<ApiResponse<IncrementsOverviewData>>(
        '/increments/overview',
      );
      setData(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const counts = useMemo(() => {
    const rows = data?.employees ?? [];
    return {
      all: rows.length,
      eligible: rows.filter((r) => r.eligible).length,
      nearMax: rows.filter((r) => r.nearMax && !r.wouldExceedMax).length,
      atMax: rows.filter((r) => r.wouldExceedMax).length,
    };
  }, [data?.employees]);

  const filteredEmployees = useMemo(() => {
    let rows = data?.employees ?? [];
    if (statusFilter === 'eligible') rows = rows.filter((r) => r.eligible);
    if (statusFilter === 'nearMax') rows = rows.filter((r) => r.nearMax && !r.wouldExceedMax);
    if (statusFilter === 'atMax') rows = rows.filter((r) => r.wouldExceedMax);
    return rows.filter((row) =>
      matchesSearch(search, row.employeeCode, row.fullName, row.designation, row.bpsCode),
    );
  }, [data?.employees, search, statusFilter]);

  const activeScales = useMemo(
    () => (data?.byScale ?? []).filter((s) => s.employeeCount > 0),
    [data?.byScale],
  );

  const maxEmployeesOnScale = useMemo(
    () => Math.max(1, ...activeScales.map((s) => s.employeeCount)),
    [activeScales],
  );

  const summary = data?.summary;
  const showSkeleton = loading && !data;

  return (
    <PageContainer>
      <PageHeader
        title="Increments Overview"
        subtitle="BPS ladders auto-apply on employee create — monitor bands, progress, and max alerts here"
        onRefetch={() => fetchOverview({ refetch: true })}
        refetching={refetching}
      />

      <div className="mb-5 rounded-2xl border border-primary-soft/60 bg-gradient-to-r from-primary-soft/40 via-surface to-accent-light/30 px-4 py-3 sm:px-5">
        <p className="text-sm font-medium text-foreground">Auto-applied with employees</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted sm:text-sm">
          When an employee is added (with BPS + joining date), annual increments backfill through
          the last December cycle automatically. No manual apply needed.
        </p>
      </div>

      {showSkeleton ? (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-modern space-y-3 p-4">
              <SkeletonBar className="h-3 w-20" />
              <SkeletonBar className="h-8 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="card-modern relative overflow-hidden p-4 sm:p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted">BPS scales</p>
            <p className="mt-2 text-2xl font-bold text-primary-dark sm:text-3xl">
              {summary?.totalScales ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">BPS-1 through BPS-22</p>
          </div>
          <div className="card-modern relative overflow-hidden p-4 sm:p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-accent" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted">On a BPS</p>
            <p className="mt-2 text-2xl font-bold text-accent-dark sm:text-3xl">
              {summary?.employeesWithBps ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">Active employees assigned</p>
          </div>
          <div className="card-modern relative overflow-hidden p-4 sm:p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-success" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted">On track</p>
            <p className="mt-2 text-2xl font-bold text-success-dark sm:text-3xl">
              {summary?.eligibleForIncrement ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">Within band & years left</p>
          </div>
          <div className="card-modern relative overflow-hidden p-4 sm:p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-warning" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Near / at max</p>
            <p className="mt-2 text-2xl font-bold text-warning sm:text-3xl">
              {summary?.nearOrAtMax ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">
              {summary?.totalIncrementsApplied ?? 0} increments recorded
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <SectionCard
          title="Assigned BPS bands"
          subtitle="Scales that currently have employees — band range, annual increment, and headcount"
        >
          {showSkeleton ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-border-light p-4">
                  <SkeletonBar className="h-4 w-16" />
                  <SkeletonBar className="h-3 w-full" />
                  <SkeletonBar className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : activeScales.length === 0 ? (
            <EmptyState
              icon="📈"
              title="No BPS assignments yet"
              description="Assign a Basic Pay Scale on the employee form to see coverage here."
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
              {activeScales.map((scale) => {
                const share = Math.round((scale.employeeCount / maxEmployeesOnScale) * 100);
                return (
                  <div
                    key={scale.code}
                    className="flex flex-col rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-foreground">{scale.code}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {scale.maxYears}-year ladder
                        </p>
                      </div>
                      <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-dark">
                        {scale.employeeCount} emp
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-muted">
                      <div className="flex justify-between gap-2">
                        <span>Min – Max</span>
                        <span className="text-right font-medium text-foreground">
                          {formatCurrency(scale.minSalary)} – {formatCurrency(scale.maxSalary)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Annual increment</span>
                        <span className="font-medium text-success-dark">
                          +{formatCurrency(scale.incrementAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>On track</span>
                        <span className="font-medium text-foreground">{scale.eligibleCount}</span>
                      </div>
                      {scale.nearMaxCount > 0 && (
                        <div className="flex justify-between gap-2">
                          <span>Near / at max</span>
                          <span className="font-medium text-warning">{scale.nearMaxCount}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-3">
                      <div className="mb-1 flex justify-between text-[10px] text-muted">
                        <span>Share of assigned staff</span>
                        <span>{share}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-primary-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${Math.max(12, share)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Employees</h2>
          <p className="text-sm text-muted">Live BPS progress for each assigned employee</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={statusFilter === 'all'}
            label="All"
            count={counts.all}
            onClick={() => setStatusFilter('all')}
          />
          <FilterChip
            active={statusFilter === 'eligible'}
            label="On track"
            count={counts.eligible}
            onClick={() => setStatusFilter('eligible')}
          />
          <FilterChip
            active={statusFilter === 'nearMax'}
            label="Near max"
            count={counts.nearMax}
            onClick={() => setStatusFilter('nearMax')}
          />
          <FilterChip
            active={statusFilter === 'atMax'}
            label="At max"
            count={counts.atMax}
            onClick={() => setStatusFilter('atMax')}
          />
        </div>
      </div>

      <div className="mb-4">
        <TableFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search employee, code, or BPS…"
        />
      </div>

      <DataTableCard
        fill={false}
        minWidth="min-w-[980px]"
        header={
          <>
            <Th>Employee</Th>
            <Th>BPS</Th>
            <Th>Basic pay</Th>
            <Th>Next step</Th>
            <Th>Years used</Th>
            <Th>Status</Th>
          </>
        }
      >
        {loading || refetching ? (
          <TableBodySkeleton rows={8} cols={6} />
        ) : filteredEmployees.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-8">
              <EmptyState
                title="No matching employees"
                description="Try another filter, or assign BPS on the employee wizard."
              />
            </td>
          </tr>
        ) : (
          filteredEmployees.map((row) => (
            <tr key={row.employeeId}>
              <Td>
                <div className="font-medium text-foreground">{row.fullName}</div>
                <div className="text-xs text-muted">
                  {row.employeeCode}
                  {row.designation ? ` · ${row.designation}` : ''}
                </div>
              </Td>
              <Td>
                <span className="rounded-lg bg-primary-soft/70 px-2 py-1 text-xs font-bold text-primary-dark">
                  {row.bpsCode}
                </span>
              </Td>
              <Td className="font-medium">{formatCurrency(row.basicPay)}</Td>
              <Td>
                {row.eligible && row.nextBasicPay != null ? (
                  <div className="text-sm">
                    <span className="text-success-dark">+{formatCurrency(row.incrementAmount)}</span>
                    <span className="mx-1 text-muted">→</span>
                    <span className="font-medium">{formatCurrency(row.nextBasicPay)}</span>
                  </div>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Td>
              <Td>
                <YearsProgress applied={row.yearsApplied} max={row.maxYears} />
              </Td>
              <Td>
                <StatusBadge row={row} />
              </Td>
            </tr>
          ))
        )}
      </DataTableCard>
    </PageContainer>
  );
}
