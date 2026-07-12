'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getChartGradients, getThemeTokens } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { AllowanceDashboardSummary, DashboardStats, PensionByMonth } from '@/types';

const GRADIENT_IDS = {
  gross: 'gradGross',
  net: 'gradNet',
  deductions: 'gradDeductions',
  pieActive: 'gradPieActive',
  pieInactive: 'gradPieInactive',
} as const;

function ChartDefs({ mode }: { mode: 'light' | 'dark' }) {
  const gradients = getChartGradients(mode);
  const shadowColor = mode === 'dark' ? '#000000' : '#0f172a';

  return (
    <defs>
      <filter id="barShadow" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={shadowColor} floodOpacity={mode === 'dark' ? 0.35 : 0.15} />
      </filter>
      <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={shadowColor} floodOpacity={mode === 'dark' ? 0.3 : 0.12} />
      </filter>
      {(Object.keys(gradients) as (keyof typeof gradients)[]).map((key) => {
        const g = gradients[key];
        const id = GRADIENT_IDS[key as keyof typeof GRADIENT_IDS] ?? `grad-${key}`;
        return (
          <linearGradient key={key} id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={g.from} stopOpacity={1} />
            <stop offset="100%" stopColor={g.to} stopOpacity={1} />
          </linearGradient>
        );
      })}
    </defs>
  );
}

function useChartTheme() {
  const { mode } = useTheme();
  const tokens = getThemeTokens(mode);
  const tooltipStyle = {
    borderRadius: 12,
    border: `1px solid ${tokens.border}`,
    background: mode === 'dark' ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
    color: tokens.foreground,
    boxShadow: mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(15,23,42,0.12)',
    backdropFilter: 'blur(8px)',
  };
  return { mode, tokens, tooltipStyle };
}

export function EmployeePieChart({ stats }: { stats: DashboardStats }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const data = [
    { name: 'Active', value: stats.employees.active },
    { name: 'Inactive', value: stats.employees.inactive },
  ].filter((d) => d.value > 0);

  const pieFills = [GRADIENT_IDS.pieActive, GRADIENT_IDS.pieInactive];

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No employee data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart key={mode}>
        <ChartDefs mode={mode} />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={88}
          paddingAngle={5}
          dataKey="value"
          animationBegin={200}
          animationDuration={900}
          stroke={tokens.surface}
          strokeWidth={3}
          style={{ filter: 'url(#pieShadow)' }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#${pieFills[i % pieFills.length]})`} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, 'Employees']} contentStyle={tooltipStyle} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

const DASHBOARD_GRADIENT_IDS = {
  ...GRADIENT_IDS,
  taxes: 'dashTaxes',
  gpFund: 'dashGpFund',
} as const;

function DashboardChartDefs({ mode }: { mode: 'light' | 'dark' }) {
  const shadowColor = mode === 'dark' ? '#000000' : '#0f172a';
  const extra = {
    dashTaxes: { from: '#dc2626', to: '#f87171' },
    dashGpFund: { from: '#0d9488', to: '#5eead4' },
  };

  return (
    <>
      <ChartDefs mode={mode} />
      <defs>
        {Object.entries(extra).map(([key, g]) => (
          <linearGradient key={key} id={key} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={g.from} stopOpacity={1} />
            <stop offset="100%" stopColor={g.to} stopOpacity={0.9} />
          </linearGradient>
        ))}
      </defs>
    </>
  );
}

function currencyTooltip(value: unknown) {
  return [`PKR ${Number(value).toLocaleString()}`, ''];
}

export function PayrollBarChart({ stats }: { stats: DashboardStats }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = [...stats.payrollByMonth]
    .reverse()
    .slice(-6)
    .map((p) => ({
      name: `${p.month}/${p.year}`,
      gross: p.totalGross,
      net: p.totalNet,
      deductions: p.totalDeductions,
    }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No payroll data yet</p>;
  }

  const bars = [
    { key: 'gross', name: 'Gross', gradient: GRADIENT_IDS.gross },
    { key: 'net', name: 'Net Pay', gradient: GRADIENT_IDS.net },
    { key: 'deductions', name: 'All Deductions', gradient: GRADIENT_IDS.deductions },
  ] as const;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart key={mode} data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="18%">
        <ChartDefs mode={mode} />
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: tokens.muted }} stroke="transparent" />
        <YAxis
          tick={{ fontSize: 11, fill: tokens.mutedLight }}
          stroke="transparent"
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={currencyTooltip}
          contentStyle={tooltipStyle}
          cursor={{ fill: tokens.primaryLight, opacity: 0.4 }}
        />
        <Legend />
        {bars.map(({ key, name, gradient }) => (
          <Bar
            key={key}
            dataKey={key}
            name={name}
            fill={`url(#${gradient})`}
            radius={[8, 8, 0, 0]}
            animationDuration={900}
            style={{ filter: 'url(#barShadow)' }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DeductionsSplitChart({ stats }: { stats: DashboardStats }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = [...stats.deductionsByMonth]
    .reverse()
    .slice(-6)
    .map((row) => ({
      name: `${row.month}/${row.year}`,
      taxes: row.totalTaxes,
      gpFund: row.totalGpFund,
      combined: row.totalCombined,
    }));

  if (chartData.length === 0 || chartData.every((row) => row.combined === 0)) {
    return <p className="py-12 text-center text-sm text-muted-light">No deduction data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart key={mode} data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
        <DashboardChartDefs mode={mode} />
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: tokens.muted }} stroke="transparent" />
        <YAxis tick={{ fontSize: 11, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={currencyTooltip} contentStyle={tooltipStyle} cursor={{ fill: tokens.primaryLight, opacity: 0.35 }} />
        <Legend />
        <Bar dataKey="taxes" name="Taxes" stackId="deductions" fill={`url(#${DASHBOARD_GRADIENT_IDS.taxes})`} style={{ filter: 'url(#barShadow)' }} />
        <Bar dataKey="gpFund" name="GP Fund" stackId="deductions" fill={`url(#${DASHBOARD_GRADIENT_IDS.gpFund})`} radius={[8, 8, 0, 0]} style={{ filter: 'url(#barShadow)' }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TaxCollectionMiniChart({ stats }: { stats: DashboardStats }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = stats.taxCollection.byMonth.map((row) => ({
    name: `${row.month}/${row.year}`,
    incomeTax: row.totalIncomeTax,
    subTaxes: row.totalSubTaxes,
  }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No tax collection data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart key={mode} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
        <DashboardChartDefs mode={mode} />
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.muted }} stroke="transparent" />
        <YAxis tick={{ fontSize: 10, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={currencyTooltip} contentStyle={tooltipStyle} />
        <Legend />
        <Bar dataKey="incomeTax" name="Income Tax" stackId="tax" fill={`url(#${DASHBOARD_GRADIENT_IDS.taxes})`} style={{ filter: 'url(#barShadow)' }} />
        <Bar dataKey="subTaxes" name="Sub-Taxes" stackId="tax" fill={`url(#${GRADIENT_IDS.deductions})`} radius={[8, 8, 0, 0]} style={{ filter: 'url(#barShadow)' }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CombinedDeductionsPieChart({
  stats,
  pensionTotal = 0,
}: {
  stats: DashboardStats;
  pensionTotal?: number;
}) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const { totalTaxDeductions, totalGpFund } = stats.combined;

  if (totalTaxDeductions === 0 && totalGpFund === 0 && pensionTotal === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No deductions recorded yet</p>;
  }

  const PIE_FILLS_COMBINED = [
    DASHBOARD_GRADIENT_IDS.taxes,
    DASHBOARD_GRADIENT_IDS.gpFund,
    'dashPension',
  ];

  const data = [
    { name: 'Taxes', value: totalTaxDeductions },
    { name: 'GP Fund', value: totalGpFund },
    { name: 'Pension', value: pensionTotal },
  ].filter((item) => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart key={mode}>
        <DashboardChartDefs mode={mode} />
        <defs>
          <linearGradient id="dashPension" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={88}
          paddingAngle={4}
          dataKey="value"
          stroke={tokens.surface}
          strokeWidth={3}
          style={{ filter: 'url(#pieShadow)' }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#${PIE_FILLS_COMBINED[i] ?? PIE_FILLS_COMBINED[0]})`} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`, '']} contentStyle={tooltipStyle} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PensionMiniChart({ byMonth }: { byMonth: PensionByMonth[] }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = byMonth.map((row) => ({
    name: `${row.month}/${row.year}`,
    pension: row.total,
  }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No pension data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart key={mode} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="pensionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.muted }} stroke="transparent" />
        <YAxis tick={{ fontSize: 10, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={currencyTooltip} contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="pension"
          name="Pension"
          stroke="#7c3aed"
          strokeWidth={2.5}
          fill="url(#pensionGrad)"
          fillOpacity={1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AllowancesMiniChart({ stats }: { stats: AllowanceDashboardSummary }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = [...stats.byMonth]
    .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year)
    .slice(-6)
    .map((row) => ({
      name: `${row.month}/${row.year}`,
      welfare: row.welfareTotal,
      management: row.managementTotal,
    }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No allowance data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart key={mode} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="22%">
        <defs>
          <linearGradient id="welfareGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0891b2" stopOpacity={1} />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity={0.9} />
          </linearGradient>
          <linearGradient id="managementGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity={1} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.muted }} stroke="transparent" />
        <YAxis tick={{ fontSize: 10, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={currencyTooltip} contentStyle={tooltipStyle} />
        <Legend />
        <Bar dataKey="welfare" name="Welfare" stackId="a" fill="url(#welfareGrad)" />
        <Bar dataKey="management" name="Management" stackId="a" fill="url(#managementGrad)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
