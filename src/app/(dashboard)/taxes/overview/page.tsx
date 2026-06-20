'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, MONTHS } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';
import { StatCard } from '@/components/dashboard/DashboardCards';
import {
  TaxDeductionBreakdownChart,
  TaxMonthlyCollectionChart,
  TaxSlabPieChart,
  TaxYearlyTrendChart,
} from '@/components/taxes/TaxOverviewCharts';
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
  Td,
  Th,
} from '@/components/layout/PageShell';
import { TableBodySkeleton } from '@/components/ui/Skeletons';
import { matchesSearch } from '@/lib/table-filter';
import type { ApiResponse, Employee, TaxOverviewData } from '@/types';

type TableView = 'records' | 'employees' | 'slabs';

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
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
      }`}
    >
      {label}
    </button>
  );
}

export default function TaxesOverviewPage() {
  const toast = useToast();
  const [data, setData] = useState<TaxOverviewData | null>(null);
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
      const { data: response } = await api.get<ApiResponse<TaxOverviewData>>(
        `/tax-slabs/overview${params.toString() ? `?${params.toString()}` : ''}`,
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

  const yearOptions = useMemo(() => {
    const years = data?.availableYears ?? [];
    return years;
  }, [data?.availableYears]);

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
      matchesSearch(search, row.name, row.employeeCode, row.designation, row.taxSlabName, row.label),
    );
  }, [data, search]);

  const filteredEmployees = useMemo(() => {
    if (!data) return [];
    return data.byEmployee.filter((row) =>
      matchesSearch(search, row.name, row.employeeCode, row.designation),
    );
  }, [data, search]);

  const filteredSlabs = useMemo(() => {
    if (!data) return [];
    return data.bySlab.filter((row) => matchesSearch(search, row.taxSlabName));
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
        title="Taxes Overview"
        subtitle="Track income tax and sub-tax collection from generated payrolls"
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="skeleton h-80 rounded-2xl" />
            <div className="skeleton h-80 rounded-2xl" />
          </div>
        </div>
      ) : !data || data.summary.payrollCount === 0 ? (
        <EmptyState
          icon="📈"
          title="No tax collection data yet"
          description="Generate payrolls first — tax amounts are captured from processed payroll records."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Total Collected"
              value={formatCurrency(data.summary.totalDeductions)}
              subtitle="Income tax + sub-taxes"
              icon="💰"
              color="purple"
              delay={0}
            />
            <StatCard
              title="Income Tax"
              value={formatCurrency(data.summary.totalIncomeTax)}
              subtitle="From payroll snapshots"
              icon="🧾"
              color="amber"
              delay={80}
            />
            <StatCard
              title="Sub-Taxes"
              value={formatCurrency(data.summary.totalSubTaxes)}
              subtitle="EOBI and other sub-taxes"
              icon="🏛️"
              color="indigo"
              delay={160}
            />
            <StatCard
              title="Payroll Records"
              value={data.summary.payrollCount}
              subtitle={`${data.summary.employeeCount} employee(s)`}
              icon="📋"
              color="green"
              delay={240}
            />
            <StatCard
              title="Taxable Gross"
              value={formatCurrency(data.summary.totalGross)}
              subtitle="Payable gross used for tax"
              icon="📊"
              color="indigo"
              delay={320}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <SectionCard title="Monthly Collection" subtitle="Stacked income tax and sub-taxes by month">
              <TaxMonthlyCollectionChart data={data} />
            </SectionCard>
            <SectionCard title="Yearly Trend" subtitle="Total collection trend across years">
              <TaxYearlyTrendChart data={data} />
            </SectionCard>
            <SectionCard title="By Tax Slab" subtitle="Share of total collection per slab">
              <TaxSlabPieChart data={data} />
            </SectionCard>
            <SectionCard title="Deduction Breakdown" subtitle="Collected amounts by deduction code">
              <TaxDeductionBreakdownChart data={data} />
            </SectionCard>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Detailed Breakdown</h2>
                <p className="text-sm text-muted">Drill into payroll records, employees, or slabs</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={tableView === 'records' ? 'primary' : 'secondary'} onClick={() => setTableView('records')}>
                  Payroll Records
                </Button>
                <Button size="sm" variant={tableView === 'employees' ? 'primary' : 'secondary'} onClick={() => setTableView('employees')}>
                  By Employee
                </Button>
                <Button size="sm" variant={tableView === 'slabs' ? 'primary' : 'secondary'} onClick={() => setTableView('slabs')}>
                  By Slab
                </Button>
              </div>
            </div>

            <TableFilters
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={
                tableView === 'records'
                  ? 'Search employee, code, slab, period…'
                  : tableView === 'employees'
                    ? 'Search employee or designation…'
                    : 'Search slab name…'
              }
            />

            {tableView === 'records' && (
              <DataTableCard
                fill={false}
                minWidth="min-w-[1180px]"
                header={
                  <>
                    <Th className="min-w-[160px]">Employee</Th>
                    <Th className="w-[130px]">Period</Th>
                    <Th className="min-w-[140px]">Tax Slab</Th>
                    <Th className="w-[120px]">Gross</Th>
                    <Th className="w-[110px]">Income Tax</Th>
                    <Th className="w-[110px]">Sub-Taxes</Th>
                    <Th className="w-[120px]">Total</Th>
                    <Th className="w-[110px]">Net Pay</Th>
                  </>
                }
              >
                {refetching ? (
                  <TableBodySkeleton rows={6} cols={8} />
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-light">No matching records</td></tr>
                ) : (
                  filteredRecords.map((row) => (
                    <tr key={row.payrollId}>
                      <Td>
                        <p className="font-medium">{row.name}</p>
                        <p className="font-mono text-xs text-muted-light">{row.employeeCode}</p>
                      </Td>
                      <Td>{row.label}</Td>
                      <Td>{row.taxSlabName ?? '—'}</Td>
                      <Td>{formatCurrency(row.grossSalary)}</Td>
                      <Td className="text-danger">{formatCurrency(row.incomeTax)}</Td>
                      <Td>{formatCurrency(row.subTaxes)}</Td>
                      <Td className="font-medium text-danger">{formatCurrency(row.totalDeductions)}</Td>
                      <Td>{formatCurrency(row.netSalary)}</Td>
                    </tr>
                  ))
                )}
              </DataTableCard>
            )}

            {tableView === 'employees' && (
              <DataTableCard
                fill={false}
                minWidth="min-w-[980px]"
                header={
                  <>
                    <Th className="min-w-[180px]">Employee</Th>
                    <Th className="min-w-[140px]">Designation</Th>
                    <Th className="w-[90px]">Records</Th>
                    <Th className="w-[120px]">Income Tax</Th>
                    <Th className="w-[120px]">Sub-Taxes</Th>
                    <Th className="w-[130px]">Total Collected</Th>
                    <Th className="w-[120px]">Gross</Th>
                  </>
                }
              >
                {refetching ? (
                  <TableBodySkeleton rows={6} cols={7} />
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-light">No matching employees</td></tr>
                ) : (
                  filteredEmployees.map((row) => (
                    <tr key={row.employeeId}>
                      <Td>
                        <p className="font-medium">{row.name}</p>
                        <p className="font-mono text-xs text-muted-light">{row.employeeCode}</p>
                      </Td>
                      <Td>{row.designation}</Td>
                      <Td>{row.payrollCount}</Td>
                      <Td className="text-danger">{formatCurrency(row.totalIncomeTax)}</Td>
                      <Td>{formatCurrency(row.totalSubTaxes)}</Td>
                      <Td className="font-medium text-danger">{formatCurrency(row.totalDeductions)}</Td>
                      <Td>{formatCurrency(row.totalGross)}</Td>
                    </tr>
                  ))
                )}
              </DataTableCard>
            )}

            {tableView === 'slabs' && (
              <DataTableCard
                fill={false}
                minWidth="min-w-[760px]"
                header={
                  <>
                    <Th className="min-w-[220px]">Tax Slab</Th>
                    <Th className="w-[100px]">Records</Th>
                    <Th className="w-[130px]">Income Tax</Th>
                    <Th className="w-[130px]">Sub-Taxes</Th>
                    <Th className="w-[140px]">Total Collected</Th>
                  </>
                }
              >
                {refetching ? (
                  <TableBodySkeleton rows={5} cols={5} />
                ) : filteredSlabs.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-light">No matching slabs</td></tr>
                ) : (
                  filteredSlabs.map((row) => (
                    <tr key={`${row.taxSlabId ?? 'none'}-${row.taxSlabName}`}>
                      <Td className="font-medium">{row.taxSlabName}</Td>
                      <Td>{row.payrollCount}</Td>
                      <Td className="text-danger">{formatCurrency(row.totalIncomeTax)}</Td>
                      <Td>{formatCurrency(row.totalSubTaxes)}</Td>
                      <Td className="font-medium text-danger">{formatCurrency(row.totalDeductions)}</Td>
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
