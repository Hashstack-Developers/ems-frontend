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
import type { ApiResponse, AllowanceOverviewData } from '@/types';

type TableView = 'records' | 'employees' | 'months';
type AllowanceType = 'all' | 'welfare' | 'management';

function toggleInList(list: number[], value: number): number[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value].sort((a, b) => a - b);
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
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
    </button>
  );
}

export default function AllowancesOverviewPage() {
  const toast = useToast();
  const [data, setData] = useState<AllowanceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [allowanceType, setAllowanceType] = useState<AllowanceType>('all');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [tableView, setTableView] = useState<TableView>('records');

  const fetchOverview = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    const params = new URLSearchParams();
    if (allowanceType !== 'all') params.set('type', allowanceType);
    if (selectedYears.length) params.set('years', selectedYears.join(','));
    if (selectedMonths.length) params.set('months', selectedMonths.join(','));

    try {
      const { data: response } = await api.get<ApiResponse<AllowanceOverviewData>>(
        `/allowances/overview${params.toString() ? `?${params.toString()}` : ''}`,
      );
      setData(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [allowanceType, selectedYears, selectedMonths, toast]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const applyPreset = (preset: 'all' | 'currentYear' | 'lastYear') => {
    const currentYear = new Date().getFullYear();
    if (preset === 'all') { setSelectedYears([]); setSelectedMonths([]); return; }
    if (preset === 'currentYear') { setSelectedYears([currentYear]); setSelectedMonths([]); return; }
    setSelectedYears([currentYear - 1]);
    setSelectedMonths([]);
  };

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    return data.records.filter((row) =>
      matchesSearch(search, row.name, row.employeeCode, row.designation, row.label),
    );
  }, [data, search]);

  const filteredEmployees = useMemo(() => {
    if (!data) return [];
    return data.byEmployee.filter((row) =>
      matchesSearch(search, row.name, row.employeeCode, row.designation),
    );
  }, [data, search]);

  const filteredMonths = useMemo(() => {
    if (!data) return [];
    return data.byMonth.filter((row) => matchesSearch(search, row.label));
  }, [data, search]);

  const showInitialLoading = loading && !data;

  return (
    <PageContainer fill>
      <PageHeader
        title="Allowances Overview"
        subtitle="Welfare and management allowances distributed through payroll"
        onRefetch={() => fetchOverview({ refetch: true })}
        refetching={refetching}
      />

      <FilterBar>
        <div className="grid w-full gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">Allowance Type</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={allowanceType === 'all'} label="All" onClick={() => setAllowanceType('all')} />
              <FilterChip active={allowanceType === 'welfare'} label="Welfare" onClick={() => setAllowanceType('welfare')} />
              <FilterChip active={allowanceType === 'management'} label="Management" onClick={() => setAllowanceType('management')} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">Quick period</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={!selectedYears.length && !selectedMonths.length} label="All time" onClick={() => applyPreset('all')} />
              <FilterChip active={selectedYears.length === 1 && selectedYears[0] === new Date().getFullYear() && !selectedMonths.length} label="This year" onClick={() => applyPreset('currentYear')} />
              <FilterChip active={selectedYears.length === 1 && selectedYears[0] === new Date().getFullYear() - 1 && !selectedMonths.length} label="Last year" onClick={() => applyPreset('lastYear')} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAllowanceType('all');
                setSelectedYears([]);
                setSelectedMonths([]);
                setSearch('');
              }}
            >
              Reset filters
            </Button>
          </div>
        </div>

        {(data?.availableYears.length ?? 0) > 0 && (
          <div className="grid w-full gap-4 border-t border-border-light pt-4 lg:grid-cols-2 lg:items-start lg:gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Months</p>
              <div className="flex flex-wrap gap-2">
                {MONTHS.map((month, index) => {
                  const monthNum = index + 1;
                  return (
                    <FilterChip
                      key={month}
                      active={selectedMonths.includes(monthNum)}
                      label={month.slice(0, 3)}
                      onClick={() => setSelectedMonths((current) => toggleInList(current, monthNum))}
                    />
                  );
                })}
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
                    onClick={() => setSelectedYears((current) => toggleInList(current, year))}
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
          icon="💼"
          title="No allowance data yet"
          description="Set welfare or management allowance rates and generate payrolls — allowance amounts are computed at payroll generation time."
        />
      ) : (
        <>
          <div className="banner-soft mb-6 shrink-0 rounded-2xl p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
              <StatBannerItem
                label="Total Allowances Paid"
                value={formatCurrency(data.summary.totalAllowanceAmount)}
                valueClassName="text-primary-dark"
              />
              <StatBannerItem
                label="Welfare Amount"
                value={formatCurrency(data.summary.totalWelfareAmount)}
                valueClassName="text-success"
              />
              <StatBannerItem
                label="Management Amount"
                value={formatCurrency(data.summary.totalManagementAmount)}
                valueClassName="text-accent-dark"
              />
              <StatBannerItem
                label="Employees Receiving"
                value={data.summary.employeeCount}
                valueClassName="text-primary-dark"
              />
            </div>
            <p className="mt-4 text-sm text-muted">
              {data.summary.payrollCount} payroll record(s) · avg welfare/payroll:{' '}
              {formatCurrency(data.summary.avgWelfarePerPayroll)} · avg management/payroll:{' '}
              {formatCurrency(data.summary.avgManagementPerPayroll)}
            </p>
          </div>

          {data.byYear.length > 0 && (
            <div className="mb-6 shrink-0">
              <SectionCard title="Yearly Totals" subtitle="Allowances distributed by calendar year">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="border-b border-border-light">
                        <th className="py-2 text-left font-medium text-muted">Year</th>
                        <th className="py-2 text-right font-medium text-muted">Welfare</th>
                        <th className="py-2 text-right font-medium text-muted">Management</th>
                        <th className="py-2 text-right font-medium text-muted">Total</th>
                        <th className="py-2 text-right font-medium text-muted">Records</th>
                        <th className="py-2 text-right font-medium text-muted">Employees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byYear.map((row) => (
                        <tr key={row.year} className="border-b border-border-light/50 last:border-0">
                          <td className="py-2.5 font-medium">{row.year}</td>
                          <td className="py-2.5 text-right text-success">{formatCurrency(row.welfareTotal)}</td>
                          <td className="py-2.5 text-right text-accent-dark">{formatCurrency(row.managementTotal)}</td>
                          <td className="py-2.5 text-right font-semibold text-primary-dark">{formatCurrency(row.totalAmount)}</td>
                          <td className="py-2.5 text-right text-muted">{row.payrollCount}</td>
                          <td className="py-2.5 text-right text-muted">{row.employeeCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Allowance Details</h2>
                <p className="text-sm text-muted">Drill into payroll records, employees, or months</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={tableView === 'records' ? 'primary' : 'secondary'} onClick={() => setTableView('records')}>
                  Payroll Records
                </Button>
                <Button size="sm" variant={tableView === 'employees' ? 'primary' : 'secondary'} onClick={() => setTableView('employees')}>
                  By Employee
                </Button>
                <Button size="sm" variant={tableView === 'months' ? 'primary' : 'secondary'} onClick={() => setTableView('months')}>
                  By Month
                </Button>
              </div>
            </div>

            <TableFilters
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={
                tableView === 'records'
                  ? 'Search employee, code, period…'
                  : tableView === 'employees'
                    ? 'Search employee or designation…'
                    : 'Search month…'
              }
            />

            {tableView === 'records' && (
              <DataTableCard
                fill={false}
                minWidth="min-w-[900px]"
                header={
                  <>
                    <Th className="min-w-[180px]">Employee</Th>
                    <Th className="min-w-[140px]">Designation</Th>
                    <Th className="w-[130px]">Period</Th>
                    <Th className="w-[130px]">Welfare</Th>
                    <Th className="w-[130px]">Management</Th>
                    <Th className="w-[130px]">Total</Th>
                    <Th className="w-[120px]">Gross</Th>
                  </>
                }
              >
                {refetching ? (
                  <TableBodySkeleton rows={6} cols={7} />
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-light">No matching records</td></tr>
                ) : (
                  filteredRecords.map((row) => (
                    <tr key={row.payrollId}>
                      <Td>
                        <p className="font-medium">{row.name}</p>
                        <p className="font-mono text-xs text-muted">{row.employeeCode}</p>
                      </Td>
                      <Td className="text-muted">{row.designation}</Td>
                      <Td>{row.label}</Td>
                      <Td className="text-success">{formatCurrency(row.welfareAmount)}</Td>
                      <Td className="text-accent-dark">{formatCurrency(row.managementAmount)}</Td>
                      <Td className="font-semibold text-primary-dark">{formatCurrency(row.totalAmount)}</Td>
                      <Td>{formatCurrency(row.grossSalary)}</Td>
                    </tr>
                  ))
                )}
              </DataTableCard>
            )}

            {tableView === 'employees' && (
              <DataTableCard
                fill={false}
                minWidth="min-w-[900px]"
                header={
                  <>
                    <Th className="min-w-[180px]">Employee</Th>
                    <Th className="min-w-[140px]">Designation</Th>
                    <Th className="w-[90px]">Records</Th>
                    <Th className="w-[140px]">Total Welfare</Th>
                    <Th className="w-[140px]">Total Management</Th>
                    <Th className="w-[140px]">Total Allowances</Th>
                  </>
                }
              >
                {refetching ? (
                  <TableBodySkeleton rows={6} cols={6} />
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-light">No matching employees</td></tr>
                ) : (
                  filteredEmployees.map((row) => (
                    <tr key={row.employeeId}>
                      <Td>
                        <p className="font-medium">{row.name}</p>
                        <p className="font-mono text-xs text-muted">{row.employeeCode}</p>
                      </Td>
                      <Td className="text-muted">{row.designation}</Td>
                      <Td>{row.payrollCount}</Td>
                      <Td className="text-success">{formatCurrency(row.welfareTotal)}</Td>
                      <Td className="text-accent-dark">{formatCurrency(row.managementTotal)}</Td>
                      <Td className="font-semibold text-primary-dark">{formatCurrency(row.totalAmount)}</Td>
                    </tr>
                  ))
                )}
              </DataTableCard>
            )}

            {tableView === 'months' && (
              <DataTableCard
                fill={false}
                minWidth="min-w-[800px]"
                header={
                  <>
                    <Th className="min-w-[160px]">Period</Th>
                    <Th className="w-[90px]">Records</Th>
                    <Th className="w-[100px]">Employees</Th>
                    <Th className="w-[140px]">Welfare</Th>
                    <Th className="w-[140px]">Management</Th>
                    <Th className="w-[140px]">Total</Th>
                  </>
                }
              >
                {refetching ? (
                  <TableBodySkeleton rows={6} cols={6} />
                ) : filteredMonths.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-light">No matching months</td></tr>
                ) : (
                  [...filteredMonths].reverse().map((row) => (
                    <tr key={`${row.year}-${row.month}`}>
                      <Td className="font-medium">{row.label}</Td>
                      <Td>{row.payrollCount}</Td>
                      <Td>{row.employeeCount}</Td>
                      <Td className="text-success">{formatCurrency(row.welfareTotal)}</Td>
                      <Td className="text-accent-dark">{formatCurrency(row.managementTotal)}</Td>
                      <Td className="font-semibold text-primary-dark">{formatCurrency(row.totalAmount)}</Td>
                    </tr>
                  ))
                )}
              </DataTableCard>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
