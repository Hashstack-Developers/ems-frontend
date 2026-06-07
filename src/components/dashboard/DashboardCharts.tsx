'use client';

import {
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
import type { DashboardStats } from '@/types';

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
    { key: 'deductions', name: 'Deductions', gradient: GRADIENT_IDS.deductions },
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
          formatter={(value) => [`PKR ${Number(value).toLocaleString()}`, '']}
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
