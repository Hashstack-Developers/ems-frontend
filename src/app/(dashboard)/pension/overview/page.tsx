'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, MONTHS } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { TableFilters } from '@/components/ui/TableFilters';
import {
  DataTableCard,
  EmptyState,
  FilterBar,
  PageContainer,
  PageHeader,
  SectionCard,
  StatBannerItem,
  Td,
  Th,
} from '@/components/layout/PageShell';
import { TableBodySkeleton } from '@/components/ui/Skeletons';
import { matchesSearch } from '@/lib/table-filter';
import type { ApiResponse, PensionOverviewData } from '@/types';

type TableView = 'records' | 'employees' | 'months';

function toggleInList(list: number[], value: number): number[] {
  return list.includes(value) ? list.filter((i) => i !== value) : [...list, value].sort((a, b) => a - b);
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-primary text-white shadow-sm ring-1 ring-primary-soft' : 'filter-chip-inactive'
      }`}
    >
      {label}
    </button>
  );
}

export default function PensionOverviewPage() {
  const toast = useToast();
  const [data, setData] = useState<PensionOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [tableView, setTableView] = useState<TableView>('records');

  const fetchOverview = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    const params = new URLSearchParams();
    if (selectedYears.length) params.set('years', selectedYears.join(','));
    if (selectedMonths.length) params.set('months', selectedMonths.join(','));

    try {
      const { data: res } = await api.get<ApiResponse<PensionOverviewData>>(
        `/pension/overview${params.toString() ? `?${params.toString()}` : ''}`,
      );
      setData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [selectedYears, selectedMonths, toast]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const applyPreset = (preset: 'all' | 'currentYear' | 'lastYear') => {
    const y = new Date().getFullYear();
    if (preset === 'all') { setSelectedYears([]); setSelectedMonths([]); return; }
    if (preset === 'currentYear') { setSelectedYears([y]); setSelectedMonths([]); return; }
    setSelectedYears([y - 1]); setSelectedMonths([]);
  };

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    return data.records.filter((r) => matchesSearch(search, r.name, r.employeeCode, r.designation, r.label));
  }, [data, search]);

  const filteredEmployees = useMemo(() => {
    if (!data) return [];
    return data.byEmployee.filter((r) => matchesSearch(search, r.name, r.employeeCode, r.designation));
  }, [data, search]);

  const filteredMonths = useMemo(() => {
    if (!data) return [];
    return data.byMonth.filter((r) => matchesSearch(search, r.label));
  }, [data, search]);

  const showInitialLoading = loading && !data;

  return (
    <PageContainer fill>
      <PageHeader
        title="Pension Overview"
        subtitle="Pension contribution deductions from payroll across all employees"
        onRefetch={() => fetchOverview({ refetch: true })}
        refetching={refetching}
      />

      <FilterBar>
        <div className="grid w-full gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">Quick period</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={!selectedYears.length && !selectedMonths.length} label="All time" onClick={() => applyPreset('all')} />
              <FilterChip active={selectedYears.length === 1 && selectedYears[0] === new Date().getFullYear() && !selectedMonths.length} label="This year" onClick={() => applyPreset('currentYear')} />
              <FilterChip active={selectedYears.length === 1 && selectedYears[0] === new Date().getFullYear() - 1 && !selectedMonths.length} label="Last year" onClick={() => applyPreset('lastYear')} />
            </div>
          </div>
          <Button variant="secondary" onClick={() => { setSelectedYears([]); setSelectedMonths([]); setSearch(''); }}>
            Reset filters
          </Button>
        </div>

        {(data?.availableYears.length ?? 0) > 0 && (
          <div className="grid w-full gap-4 border-t border-border-light pt-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Months</p>
              <div className="flex flex-wrap gap-2">
                {MONTHS.map((month, i) => (
                  <FilterChip
                    key={month}
                    active={selectedMonths.includes(i + 1)}
                    label={month.slice(0, 3)}
                    onClick={() => setSelectedMonths((c) => toggleInList(c, i + 1))}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Years</p>
              <div className="flex flex-wrap gap-2">
                {(data?.availableYears ?? []).map((year) => (
                  <FilterChip
                    key={year}
                    active={selectedYears.includes(year)}
                    label={String(year)}
                    onClick={() => setSelectedYears((c) => toggleInList(c, year))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </FilterBar>

      {showInitialLoading ? (
        <div className="space-y-6">
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      ) : !data || data.summary.payrollCount === 0 ? (
        <EmptyState
          icon="🏛️"
          title="No pension data yet"
          description="Enroll employees and generate payrolls — pension deductions are computed at payroll generation time."
        />
      ) : (
        <>
          <div className="banner-soft mb-6 shrink-0 rounded-2xl p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
              <StatBannerItem label="Total Pension Deducted" value={formatCurrency(data.summary.totalPension)} valueClassName="text-primary-dark" />
              <StatBannerItem label="Employees Contributing" value={data.summary.employeeCount} valueClassName="text-primary-dark" />
              <StatBannerItem label="Active Enrollments" value={data.summary.activeEnrollments} valueClassName="text-success" />
              <StatBannerItem label="Payroll Records" value={data.summary.payrollCount} valueClassName="text-accent-dark" />
            </div>
          </div>

          {data.byYear.length > 0 && (
            <div className="mb-6 shrink-0">
              <SectionCard title="Yearly Totals" subtitle="Pension contributions by calendar year">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead>
                      <tr className="border-b border-border-light">
                        <th className="py-2 text-left font-medium text-muted">Year</th>
                        <th className="py-2 text-right font-medium text-muted">Total Pension</th>
                        <th className="py-2 text-right font-medium text-muted">Records</th>
                        <th className="py-2 text-right font-medium text-muted">Employees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byYear.map((row) => (
                        <tr key={row.year} className="border-b border-border-light/50 last:border-0">
                          <td className="py-2.5 font-medium">{row.year}</td>
                          <td className="py-2.5 text-right font-semibold text-primary-dark">{formatCurrency(row.total)}</td>
                          <td className="py-2.5 text-right text-muted">{row.count}</td>
                          <td className="py-2.5 text-right text-muted">{row.employeeCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Pension Details</h2>
                <p className="text-sm text-muted">Drill into payroll records, employees, or months</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={tableView === 'records' ? 'primary' : 'secondary'} onClick={() => setTableView('records')}>Records</Button>
                <Button size="sm" variant={tableView === 'employees' ? 'primary' : 'secondary'} onClick={() => setTableView('employees')}>By Employee</Button>
                <Button size="sm" variant={tableView === 'months' ? 'primary' : 'secondary'} onClick={() => setTableView('months')}>By Month</Button>
              </div>
            </div>

            <TableFilters search={search} onSearchChange={setSearch} searchPlaceholder={tableView === 'records' ? 'Search employee, period…' : tableView === 'employees' ? 'Search employee…' : 'Search month…'} />

            {tableView === 'records' && (
              <DataTableCard fill={false} minWidth="min-w-[760px]" header={<>
                <Th className="min-w-[180px]">Employee</Th>
                <Th className="min-w-[130px]">Designation</Th>
                <Th className="w-[130px]">Period</Th>
                <Th className="w-[140px]">Pension</Th>
                <Th className="w-[120px]">Gross</Th>
              </>}>
                {refetching ? <TableBodySkeleton rows={6} cols={5} /> : filteredRecords.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-light">No matching records</td></tr>
                ) : filteredRecords.map((r) => (
                  <tr key={r.payrollId}>
                    <Td><p className="font-medium">{r.name}</p><p className="font-mono text-xs text-muted">{r.employeeCode}</p></Td>
                    <Td className="text-muted">{r.designation}</Td>
                    <Td>{r.label}</Td>
                    <Td className="font-semibold text-primary-dark">{formatCurrency(r.pensionAmount)}</Td>
                    <Td>{formatCurrency(r.grossSalary)}</Td>
                  </tr>
                ))}
              </DataTableCard>
            )}

            {tableView === 'employees' && (
              <DataTableCard fill={false} minWidth="min-w-[700px]" header={<>
                <Th className="min-w-[180px]">Employee</Th>
                <Th className="min-w-[130px]">Designation</Th>
                <Th className="w-[90px]">Records</Th>
                <Th className="w-[150px]">Total Pension</Th>
              </>}>
                {refetching ? <TableBodySkeleton rows={6} cols={4} /> : filteredEmployees.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-light">No matching employees</td></tr>
                ) : filteredEmployees.map((r) => (
                  <tr key={r.employeeId}>
                    <Td><p className="font-medium">{r.name}</p><p className="font-mono text-xs text-muted">{r.employeeCode}</p></Td>
                    <Td className="text-muted">{r.designation}</Td>
                    <Td>{r.count}</Td>
                    <Td className="font-semibold text-primary-dark">{formatCurrency(r.total)}</Td>
                  </tr>
                ))}
              </DataTableCard>
            )}

            {tableView === 'months' && (
              <DataTableCard fill={false} minWidth="min-w-[640px]" header={<>
                <Th className="min-w-[160px]">Period</Th>
                <Th className="w-[90px]">Records</Th>
                <Th className="w-[100px]">Employees</Th>
                <Th className="w-[150px]">Total Pension</Th>
              </>}>
                {refetching ? <TableBodySkeleton rows={6} cols={4} /> : filteredMonths.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-light">No matching months</td></tr>
                ) : [...filteredMonths].reverse().map((r) => (
                  <tr key={`${r.year}-${r.month}`}>
                    <Td className="font-medium">{r.label}</Td>
                    <Td>{r.count}</Td>
                    <Td>{r.employeeCount}</Td>
                    <Td className="font-semibold text-primary-dark">{formatCurrency(r.total)}</Td>
                  </tr>
                ))}
              </DataTableCard>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
