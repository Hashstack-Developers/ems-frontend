'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';
import { DashboardContentSkeleton, DashboardSkeleton, SectionCard, StatCard } from '@/components/dashboard/DashboardCards';
import { EmployeePieChart, PayrollBarChart } from '@/components/dashboard/DashboardCharts';
import { PayrollMonthsList } from '@/components/dashboard/PayrollMonthsList';
import { PageContainer, PageHeader } from '@/components/layout/PageShell';
import type { ApiResponse, DashboardStats } from '@/types';

export default function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);

  const fetchStats = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    try {
      const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      setStats(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of employees, payrolls, and taxes"
        onRefetch={() => fetchStats({ refetch: true })}
        refetching={refetching}
      />

      {refetching ? (
        <DashboardContentSkeleton />
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Employees" value={stats.employees.total} subtitle={`${stats.employees.active} active · ${stats.employees.inactive} inactive`} icon="👥" color="indigo" delay={0} />
            <StatCard title="Active Employees" value={stats.employees.active} subtitle="Currently on payroll" icon="✅" color="green" delay={80} />
            <StatCard title="Tax Slabs" value={stats.taxes.slabs} subtitle={`${stats.taxes.activeSlabs} active slabs`} icon="📋" color="amber" delay={160} />
            <StatCard title="Payroll Months" value={stats.payrollTotals.monthsWithPayroll} subtitle={`${stats.payrollTotals.count} total records`} icon="💰" color="purple" delay={240} />
          </div>

          {stats.payrollTotals.monthsWithPayroll > 0 && (
            <div
              className="animate-fade-in-up banner-soft mt-6 grid grid-cols-1 gap-3 rounded-2xl p-5 sm:grid-cols-3 sm:gap-6 sm:p-6"
              style={{ animationDelay: '300ms' }}
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">All-Time Gross</p>
                <p className="mt-1 text-xl font-bold text-primary-dark sm:text-2xl">{formatCurrency(stats.payrollTotals.totalGross)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Total Deductions</p>
                <p className="mt-1 text-xl font-bold text-accent-dark sm:text-2xl">{formatCurrency(stats.payrollTotals.totalDeductions)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Total Net Paid</p>
                <p className="mt-1 text-xl font-bold text-success sm:text-2xl">{formatCurrency(stats.payrollTotals.totalNet)}</p>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <SectionCard title="Payroll Trends" subtitle="Gross vs Net vs Deductions (recent months)" delay={350}>
              <PayrollBarChart stats={stats} />
            </SectionCard>
            <SectionCard title="Employee Distribution" subtitle="Active vs inactive workforce" delay={420}>
              <EmployeePieChart stats={stats} />
            </SectionCard>
          </div>

          <div className="mt-6" style={{ animationDelay: '480ms' }}>
            <SectionCard
              title="Payroll by Month"
              subtitle="All processed payroll periods — latest first"
              delay={480}
              scrollable
            >
              <PayrollMonthsList months={stats.payrollByMonth} />
            </SectionCard>
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}
