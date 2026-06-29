'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';
import { DashboardContentSkeleton, DashboardSkeleton, SectionCard, StatCard } from '@/components/dashboard/DashboardCards';
import {
  CombinedDeductionsPieChart,
  DeductionsSplitChart,
  EmployeePieChart,
  PayrollBarChart,
  TaxCollectionMiniChart,
} from '@/components/dashboard/DashboardCharts';
import { GpFundDashboardMiniChart } from '@/components/gp-fund/GpFundOverviewCharts';
import { PayrollMonthsList } from '@/components/dashboard/PayrollMonthsList';
import { PageContainer, PageHeader, StatBannerItem } from '@/components/layout/PageShell';
import type { ApiResponse, DashboardStats } from '@/types';

function DashboardSectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 shrink-0">
      <h2 className="dashboard-section-title">{title}</h2>
      <p className="dashboard-section-subtitle">{subtitle}</p>
    </div>
  );
}

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

  const hasPayroll = (stats?.payrollTotals.monthsWithPayroll ?? 0) > 0;
  const hasTaxData = (stats?.taxCollection.payrollRecords ?? 0) > 0;
  const hasGpFundData = (stats?.gpFund.contributingRecords ?? 0) > 0;
  const hasDeductions = (stats?.combined.totalCombinedDeductions ?? 0) > 0;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Employees, payroll, taxes, and GP fund — separate and combined views"
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
            <StatCard title="Tax Slabs" value={stats.taxes.slabs} subtitle={`${stats.taxes.activeSlabs} active · ${stats.taxes.subTaxes} sub-taxes`} icon="📋" color="amber" delay={160} />
            <StatCard title="Payroll Records" value={stats.payrollTotals.count} subtitle={`${stats.payrollTotals.monthsWithPayroll} month(s) processed`} icon="💰" color="purple" delay={240} />
          </div>

          {hasPayroll && (
            <div className="banner-soft mt-6 shrink-0 rounded-2xl p-5 sm:p-6">
              <DashboardSectionHeader
                title="Payroll Summary"
                subtitle="All-time totals from processed payroll records"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                <StatBannerItem label="All-Time Gross" value={formatCurrency(stats.payrollTotals.totalGross)} valueClassName="text-primary-dark" />
                <StatBannerItem label="Total Net Paid" value={formatCurrency(stats.payrollTotals.totalNet)} valueClassName="text-success" />
                <StatBannerItem label="All Deductions" value={formatCurrency(stats.payrollTotals.totalDeductions)} valueClassName="text-accent-dark" />
              </div>
            </div>
          )}

          {hasDeductions && (
            <div className="banner-combined mt-6 shrink-0 rounded-2xl p-5 sm:p-6">
              <DashboardSectionHeader
                title="Combined Deductions"
                subtitle="Taxes and GP fund shown separately and as a combined total"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                <StatBannerItem label="Total Taxes" value={formatCurrency(stats.combined.totalTaxDeductions)} valueClassName="banner-tax-value" />
                <StatBannerItem label="Total GP Fund" value={formatCurrency(stats.combined.totalGpFund)} valueClassName="banner-gp-fund-value" />
                <StatBannerItem label="Combined Total" value={formatCurrency(stats.combined.totalCombinedDeductions)} valueClassName="banner-combined-value" />
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="shrink-0">
              <DashboardSectionHeader
                title="Tax Collection"
                subtitle="Income tax and sub-taxes only — GP fund excluded"
              />
              {hasTaxData ? (
                <>
                  <div className="banner-tax rounded-2xl p-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                      <StatBannerItem label="Total Collected" value={formatCurrency(stats.taxCollection.totalCollected)} valueClassName="banner-tax-value" />
                      <StatBannerItem label="Income Tax" value={formatCurrency(stats.taxCollection.totalIncomeTax)} valueClassName="banner-tax-value" />
                      <StatBannerItem label="Sub-Taxes" value={formatCurrency(stats.taxCollection.totalSubTaxes)} valueClassName="banner-tax-value" />
                      <StatBannerItem label="Payroll Records" value={stats.taxCollection.payrollRecords} valueClassName="banner-tax-value" />
                    </div>
                  </div>
                  {stats.taxCollection.byMonth.length > 0 && (
                    <div className="mt-4">
                      <SectionCard title="Recent Tax Collection" subtitle="Income tax + sub-taxes by month" delay={300}>
                        <TaxCollectionMiniChart stats={stats} />
                      </SectionCard>
                    </div>
                  )}
                </>
              ) : (
                <div className="card-modern p-6 text-sm text-muted">No tax collection data yet — generate payrolls to see tax stats.</div>
              )}
            </div>

            <div className="shrink-0">
              <DashboardSectionHeader
                title="GP Fund Collection"
                subtitle="Base subscriptions plus monthly and annual markups from payroll"
              />
              {hasGpFundData ? (
                <>
                  <div className="banner-gp-fund rounded-2xl p-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                      <StatBannerItem label="Total Collected" value={formatCurrency(stats.gpFund.totalCollected)} valueClassName="banner-gp-fund-value" />
                      <StatBannerItem label="Base Subscriptions" value={formatCurrency(stats.gpFund.totalBaseCollected)} valueClassName="banner-gp-fund-value" />
                      <StatBannerItem label="Monthly Markup" value={formatCurrency(stats.gpFund.totalMonthlyMarkup)} valueClassName="banner-gp-fund-value" />
                      <StatBannerItem label="Annual Markup" value={formatCurrency(stats.gpFund.totalAnnualMarkup)} valueClassName="banner-gp-fund-value" />
                      <StatBannerItem label="Advance Installments" value={formatCurrency(stats.gpFund.totalAdvanceInstallments)} valueClassName="banner-gp-fund-value" />
                      <StatBannerItem label="Outstanding Advances" value={formatCurrency(stats.gpFund.advances.totalOutstanding)} valueClassName="banner-gp-fund-value" />
                      <StatBannerItem label="Active Advances" value={stats.gpFund.advances.activeCount} valueClassName="banner-gp-fund-value" />
                      <StatBannerItem label="Enrolled Employees" value={stats.gpFund.enrolledEmployees} valueClassName="banner-gp-fund-value" />
                    </div>
                    <p className="banner-gp-fund-note mt-4 text-sm">
                      Markup rates: {Number(stats.gpFund.monthlyMarkupRate)}% monthly · {Number(stats.gpFund.annualMarkupRate)}% annual · {stats.gpFund.advances.activeCount} active advance(s)
                    </p>
                  </div>
                  {stats.gpFund.byMonth.length > 0 && (
                    <div className="mt-4">
                      <SectionCard title="Recent GP Fund" subtitle="Monthly subscriptions by period" delay={360}>
                        <GpFundDashboardMiniChart byMonth={stats.gpFund.byMonth} />
                      </SectionCard>
                    </div>
                  )}
                </>
              ) : (
                <div className="card-modern p-6 text-sm text-muted">No GP fund data yet — assign scales to employees and generate payrolls.</div>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <SectionCard title="Payroll Trends" subtitle="Gross, net, and all deductions (recent months)" delay={400}>
              <PayrollBarChart stats={stats} />
            </SectionCard>
            <SectionCard title="Deductions Split" subtitle="Taxes vs GP fund stacked by month" delay={420}>
              <DeductionsSplitChart stats={stats} />
            </SectionCard>
            <div className="lg:col-span-2 xl:col-span-1">
              <SectionCard title="Combined Share" subtitle="Taxes vs GP fund all-time split" delay={440}>
                <CombinedDeductionsPieChart stats={stats} />
              </SectionCard>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <SectionCard title="Employee Distribution" subtitle="Active vs inactive workforce" delay={460}>
              <EmployeePieChart stats={stats} />
            </SectionCard>
            <SectionCard title="Configuration Snapshot" subtitle="Tax slab setup at a glance" delay={480}>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="rounded-xl border border-border-light bg-neutral-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Tax Slabs</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stats.taxes.slabs}</p>
                  <p className="mt-1 text-xs text-muted-light">{stats.taxes.activeSlabs} active</p>
                </div>
                <div className="rounded-xl border border-border-light bg-neutral-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Sub-Taxes</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stats.taxes.subTaxes}</p>
                  <p className="mt-1 text-xs text-muted-light">{stats.taxes.activeSubTaxes} active</p>
                </div>
                <div className="rounded-xl border border-border-light bg-neutral-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">GP Fund Scales</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stats.gpFund.scaleCount}</p>
                  <p className="mt-1 text-xs text-muted-light">{stats.gpFund.enrolledEmployees} enrolled</p>
                </div>
                <div className="rounded-xl border border-border-light bg-neutral-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Payroll Months</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stats.payrollTotals.monthsWithPayroll}</p>
                  <p className="mt-1 text-xs text-muted-light">{stats.payrollTotals.count} records</p>
                </div>
              </div>
            </SectionCard>
          </div>

          {hasPayroll && (
            <div className="mt-6">
              <SectionCard
                title="Payroll by Month"
                subtitle="All processed payroll periods — latest first"
                delay={500}
                scrollable
              >
                <PayrollMonthsList months={stats.payrollByMonth} />
              </SectionCard>
            </div>
          )}
        </>
      ) : null}
    </PageContainer>
  );
}
