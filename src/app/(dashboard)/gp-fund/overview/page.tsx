'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, MONTHS } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';
import {
  GpFundMonthlyAreaChart,
  GpFundScaleDonutChart,
  GpFundTopContributorsChart,
  GpFundYearlyBarChart,
} from '@/components/gp-fund/GpFundOverviewCharts';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
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
import type { ApiResponse, Employee, GpFundOverviewData } from '@/types';

type TableView = 'records' | 'employees' | 'scales';

function toggleInList(list: number[], value: number): number[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value].sort((a, b) => a - b);
}

function FilterChip({
  active,
  label,
  onClick,
  variant = 'default',
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'teal';
}) {
  const activeClass =
    variant === 'teal'
      ? 'filter-chip-gp-fund-active ring-1 ring-success-soft'
      : 'bg-primary text-white shadow-sm ring-1 ring-primary-soft';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? activeClass : 'filter-chip-inactive'
      }`}
    >
      {label}
    </button>
  );
}

export default function GpFundOverviewPage() {
  const toast = useToast();
  const [data, setData] = useState<GpFundOverviewData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [tableView, setTableView] = useState<TableView>('records');

  const fetchEmployees = useCallback(async () => {
    try {
      const { data: response } = await api.get<ApiResponse<Employee[]>>('/employees');
      setEmployees(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [toast]);

  const fetchOverview = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    const params = new URLSearchParams();
    if (employeeId) params.set('employeeId', employeeId);
    if (selectedYears.length) params.set('years', selectedYears.join(','));
    if (selectedMonths.length) params.set('months', selectedMonths.join(','));

    try {
      const { data: response } = await api.get<ApiResponse<GpFundOverviewData>>(
        `/gp-fund/overview${params.toString() ? `?${params.toString()}` : ''}`,
      );
      setData(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [employeeId, selectedMonths, selectedYears, toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const yearOptions = useMemo(() => data?.availableYears ?? [], [data?.availableYears]);

  const applyPreset = (preset: 'all' | 'currentYear' | 'lastYear') => {
    const currentYear = new Date().getFullYear();
    if (preset === 'all') {
      setSelectedYears([]);
      setSelectedMonths([]);
      return;
    }
    if (preset === 'currentYear') {
      setSelectedYears([currentYear]);
      setSelectedMonths([]);
      return;
    }
    setSelectedYears([currentYear - 1]);
    setSelectedMonths([]);
  };

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    return data.records.filter((row) =>
      matchesSearch(search, row.name, row.employeeCode, row.designation, row.gpFundScale, row.label),
    );
  }, [data, search]);

  const filteredEmployees = useMemo(() => {
    if (!data) return [];
    return data.byEmployee.filter((row) =>
      matchesSearch(search, row.name, row.employeeCode, row.designation, row.gpFundScale),
    );
  }, [data, search]);

  const filteredScales = useMemo(() => {
    if (!data) return [];
    return data.byScale.filter((row) => matchesSearch(search, row.scaleCode));
  }, [data, search]);

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];
    if (employeeId) {
      const emp = employees.find((e) => String(e.id) === employeeId);
      parts.push(emp ? emp.name : 'Selected employee');
    } else {
      parts.push('All employees');
    }
    if (selectedYears.length) parts.push(`Years: ${selectedYears.join(', ')}`);
    else parts.push('All years');
    if (selectedMonths.length) {
      parts.push(`Months: ${selectedMonths.map((m) => MONTHS[m - 1]?.slice(0, 3)).join(', ')}`);
    }
    return parts.join(' · ');
  }, [employeeId, employees, selectedMonths, selectedYears]);

  const showInitialLoading = loading && !data;

  return (
    <PageContainer fill>
      <PageHeader
        title="GP Fund Overview"
        subtitle="Monthly GP Fund subscriptions collected from payroll periods by employee scale"
        onRefetch={() => fetchOverview({ refetch: true })}
        refetching={refetching}
      />

      <FilterBar>
        <div className="grid w-full gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] xl:items-end">
          <Select
            label="Employee"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={[
              { value: '', label: 'All employees' },
              ...employees.map((emp) => ({
                value: String(emp.id),
                label: `${emp.name} (${emp.employeeCode})`,
              })),
            ]}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">Quick period</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip variant="teal" active={!selectedYears.length && !selectedMonths.length} label="All time" onClick={() => applyPreset('all')} />
              <FilterChip variant="teal" active={selectedYears.length === 1 && selectedYears[0] === new Date().getFullYear() && !selectedMonths.length} label="This year" onClick={() => applyPreset('currentYear')} />
              <FilterChip variant="teal" active={selectedYears.length === 1 && selectedYears[0] === new Date().getFullYear() - 1 && !selectedMonths.length} label="Last year" onClick={() => applyPreset('lastYear')} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEmployeeId('');
                setSelectedYears([]);
                setSelectedMonths([]);
                setSearch('');
              }}
            >
              Reset filters
            </Button>
          </div>
        </div>

        <div className="grid w-full gap-4 border-t border-border-light pt-4 lg:grid-cols-2 lg:items-start lg:gap-6">
          <div className={`space-y-2 ${yearOptions.length === 0 ? 'lg:col-span-2' : ''}`}>
            <p className="text-sm font-medium text-neutral-700">Months</p>
            <div className="flex flex-wrap gap-2">
              {MONTHS.map((month, index) => (
                <FilterChip
                  key={month}
                  variant="teal"
                  active={selectedMonths.includes(index + 1)}
                  label={month.slice(0, 3)}
                  onClick={() => setSelectedMonths((current) => toggleInList(current, index + 1))}
                />
              ))}
            </div>
          </div>

          {yearOptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Years</p>
              <div className="flex flex-wrap gap-2">
                {yearOptions.map((year) => (
                  <FilterChip
                    key={year}
                    variant="teal"
                    active={selectedYears.includes(year)}
                    label={String(year)}
                    onClick={() => setSelectedYears((current) => toggleInList(current, year))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="w-full border-t border-border-light pt-3 text-xs text-muted">{activeFilterSummary}</p>
      </FilterBar>

      {showInitialLoading ? (
        <div className="space-y-6">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-80 rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-72 rounded-2xl" />
          </div>
        </div>
      ) : !data || data.summary.payrollCount === 0 ? (
        <EmptyState
          icon="📘"
          title="No GP Fund collection data yet"
          description="Assign GP fund scales to employees and generate payrolls — monthly subscriptions are calculated from each employee's scale."
        />
      ) : (
        <>
          <div className="banner-gp-fund mb-6 shrink-0 rounded-2xl p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
              <StatBannerItem
                label="Total GP Fund Collected"
                value={formatCurrency(data.summary.totalCollected)}
                valueClassName="banner-gp-fund-value"
              />
              <StatBannerItem
                label="Enrolled Employees"
                value={data.summary.enrolledEmployeeCount}
                valueClassName="banner-gp-fund-value"
              />
              <StatBannerItem
                label="Avg Monthly"
                value={formatCurrency(data.summary.avgMonthlyContribution)}
                valueClassName="banner-gp-fund-value"
              />
              <StatBannerItem
                label="Payroll Records"
                value={data.summary.payrollCount}
                valueClassName="banner-gp-fund-value"
              />
            </div>
            <p className="banner-gp-fund-note mt-4 text-sm">
              {data.summary.scaleCount} active scale(s) · deductions applied at payroll generation from employee GP fund scale
            </p>
          </div>

          <div className="mt-6 shrink-0">
            <SectionCard title="Monthly Subscriptions" subtitle="GP Fund collected across payroll periods">
              <GpFundMonthlyAreaChart data={data} />
            </SectionCard>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <SectionCard title="Yearly Totals" subtitle="Collection by calendar year">
              <GpFundYearlyBarChart data={data} />
            </SectionCard>
            <SectionCard title="By Scale" subtitle="Share of collection per GP fund scale">
              <GpFundScaleDonutChart data={data} />
            </SectionCard>
            <SectionCard title="Top Contributors" subtitle="Employees with highest total contribution">
              <GpFundTopContributorsChart data={data} />
            </SectionCard>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Contribution Details</h2>
                <p className="text-sm text-muted">Drill into payroll records, employees, or scales</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={tableView === 'records' ? 'primary' : 'secondary'} onClick={() => setTableView('records')}>
                  Payroll Records
                </Button>
                <Button size="sm" variant={tableView === 'employees' ? 'primary' : 'secondary'} onClick={() => setTableView('employees')}>
                  By Employee
                </Button>
                <Button size="sm" variant={tableView === 'scales' ? 'primary' : 'secondary'} onClick={() => setTableView('scales')}>
                  By Scale
                </Button>
              </div>
            </div>

            <TableFilters
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={
                tableView === 'records'
                  ? 'Search employee, code, scale, period…'
                  : tableView === 'employees'
                    ? 'Search employee or scale…'
                    : 'Search scale code…'
              }
            />

            {tableView === 'records' && (
              <DataTableCard
                fill={false}
                minWidth="min-w-[1100px]"
                header={
                  <>
                    <Th className="min-w-[160px]">Employee</Th>
                    <Th className="w-[130px]">Period</Th>
                    <Th className="w-[100px]">Scale</Th>
                    <Th className="w-[140px]">Subscription</Th>
                    <Th className="w-[130px]">GP Fund</Th>
                    <Th className="w-[120px]">Gross</Th>
                  </>
                }
              >
                {refetching ? (
                  <TableBodySkeleton rows={6} cols={6} />
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-light">No matching records</td></tr>
                ) : (
                  filteredRecords.map((row) => (
                    <tr key={row.payrollId}>
                      <Td>
                        <p className="font-medium">{row.name}</p>
                        <p className="font-mono text-xs text-muted-light">{row.employeeCode}</p>
                      </Td>
                      <Td>{row.label}</Td>
                      <Td>
                        <span className="gp-fund-chip px-2 py-0.5 text-xs font-semibold">
                          {row.gpFundScale}
                        </span>
                      </Td>
                      <Td>{formatCurrency(row.subscriptionValue)}</Td>
                      <Td className="gp-fund-amount">{formatCurrency(row.gpFundAmount)}</Td>
                      <Td>{formatCurrency(row.grossSalary)}</Td>
                    </tr>
                  ))
                )}
              </DataTableCard>
            )}

            {tableView === 'employees' && (
              <DataTableCard
                fill={false}
                minWidth="min-w-[960px]"
                header={
                  <>
                    <Th className="min-w-[180px]">Employee</Th>
                    <Th className="min-w-[140px]">Designation</Th>
                    <Th className="w-[90px]">Scale</Th>
                    <Th className="w-[120px]">Subscription</Th>
                    <Th className="w-[90px]">Records</Th>
                    <Th className="w-[140px]">Total Contributed</Th>
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
                        <p className="font-mono text-xs text-muted-light">{row.employeeCode}</p>
                      </Td>
                      <Td>{row.designation}</Td>
                      <Td>{row.gpFundScale}</Td>
                      <Td>{formatCurrency(row.subscriptionValue)}</Td>
                      <Td>{row.payrollCount}</Td>
                      <Td className="gp-fund-amount">{formatCurrency(row.totalCollected)}</Td>
                    </tr>
                  ))
                )}
              </DataTableCard>
            )}

            {tableView === 'scales' && (
              <DataTableCard
                fill={false}
                minWidth="min-w-[760px]"
                header={
                  <>
                    <Th className="min-w-[120px]">Scale</Th>
                    <Th className="w-[150px]">Monthly Subscription</Th>
                    <Th className="w-[100px]">Employees</Th>
                    <Th className="w-[100px]">Records</Th>
                    <Th className="w-[150px]">Total Collected</Th>
                  </>
                }
              >
                {refetching ? (
                  <TableBodySkeleton rows={5} cols={5} />
                ) : filteredScales.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-light">No matching scales</td></tr>
                ) : (
                  filteredScales.map((row) => (
                    <tr key={row.scaleCode}>
                      <Td>
                        <span className="gp-fund-chip px-2.5 py-1 text-sm font-semibold">
                          {row.scaleCode}
                        </span>
                      </Td>
                      <Td>{formatCurrency(row.subscriptionValue)}</Td>
                      <Td>{row.employeeCount}</Td>
                      <Td>{row.payrollCount}</Td>
                      <Td className="gp-fund-amount">{formatCurrency(row.totalCollected)}</Td>
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
