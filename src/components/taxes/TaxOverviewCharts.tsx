'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getChartGradients, getThemeTokens } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency } from '@/lib/format';
import type { TaxOverviewData } from '@/types';

const GRADIENT_IDS = {
  incomeTax: 'taxIncomeTax',
  subTaxes: 'taxSubTaxes',
  deductions: 'taxDeductions',
  pie0: 'taxPie0',
  pie1: 'taxPie1',
  pie2: 'taxPie2',
  pie3: 'taxPie3',
} as const;

const PIE_FILLS = [GRADIENT_IDS.pie0, GRADIENT_IDS.pie1, GRADIENT_IDS.pie2, GRADIENT_IDS.pie3];

function ChartDefs({ mode }: { mode: 'light' | 'dark' }) {
  const gradients = getChartGradients(mode);
  const shadowColor = mode === 'dark' ? '#000000' : '#0f172a';
  const extra = {
    taxIncomeTax: { from: '#dc2626', to: '#f87171' },
    taxSubTaxes: { from: '#0284c7', to: '#7dd3fc' },
    taxDeductions: { from: gradients.deductions.from, to: gradients.deductions.to },
    taxPie0: { from: '#2563eb', to: '#60a5fa' },
    taxPie1: { from: '#dc2626', to: '#f87171' },
    taxPie2: { from: '#e8a045', to: '#fcd78a' },
    taxPie3: { from: '#10b981', to: '#6ee7b7' },
  };

  return (
    <defs>
      <filter id="taxBarShadow" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={shadowColor} floodOpacity={mode === 'dark' ? 0.35 : 0.15} />
      </filter>
      {Object.entries(extra).map(([key, g]) => (
        <linearGradient key={key} id={key} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={g.from} stopOpacity={1} />
          <stop offset="100%" stopColor={g.to} stopOpacity={1} />
        </linearGradient>
      ))}
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

function currencyTooltip(value: unknown) {
  return [`PKR ${Number(value).toLocaleString()}`, ''];
}

export function TaxMonthlyCollectionChart({ data }: { data: TaxOverviewData }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = data.byMonth.map((row) => ({
    name: row.label.replace(' ', '\n'),
    incomeTax: row.totalIncomeTax,
    subTaxes: row.totalSubTaxes,
  }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No tax data for selected filters</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart key={mode} data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
        <ChartDefs mode={mode} />
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.muted }} stroke="transparent" interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={currencyTooltip} contentStyle={tooltipStyle} cursor={{ fill: tokens.primaryLight, opacity: 0.35 }} />
        <Legend />
        <Bar dataKey="incomeTax" name="Income Tax" stackId="tax" fill={`url(#${GRADIENT_IDS.incomeTax})`} style={{ filter: 'url(#taxBarShadow)' }} />
        <Bar dataKey="subTaxes" name="Sub-Taxes" stackId="tax" fill={`url(#${GRADIENT_IDS.subTaxes})`} radius={[8, 8, 0, 0]} style={{ filter: 'url(#taxBarShadow)' }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TaxYearlyTrendChart({ data }: { data: TaxOverviewData }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = data.byYear.map((row) => ({
    name: String(row.year),
    incomeTax: row.totalIncomeTax,
    subTaxes: row.totalSubTaxes,
    totalDeductions: row.totalDeductions,
  }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No yearly tax data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart key={mode} data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <ChartDefs mode={mode} />
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: tokens.muted }} stroke="transparent" />
        <YAxis tick={{ fontSize: 11, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={currencyTooltip} contentStyle={tooltipStyle} />
        <Legend />
        <Line type="monotone" dataKey="totalDeductions" name="Total Collected" stroke={tokens.primary} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="incomeTax" name="Income Tax" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="subTaxes" name="Sub-Taxes" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TaxSlabPieChart({ data }: { data: TaxOverviewData }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = data.bySlab
    .filter((row) => row.totalDeductions > 0)
    .slice(0, 6)
    .map((row) => ({
      name: row.taxSlabName,
      value: row.totalDeductions,
    }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No slab breakdown</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart key={mode}>
        <ChartDefs mode={mode} />
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={54}
          outerRadius={92}
          paddingAngle={4}
          dataKey="value"
          stroke={tokens.surface}
          strokeWidth={2}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={`url(#${PIE_FILLS[i % PIE_FILLS.length]})`} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Collected']} contentStyle={tooltipStyle} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TaxDeductionBreakdownChart({ data }: { data: TaxOverviewData }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = data.byDeduction.slice(0, 8).map((row) => ({
    name: row.code,
    amount: row.amount,
    fullName: row.name,
  }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No deduction breakdown</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart key={mode} data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <ChartDefs mode={mode} />
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 11, fill: tokens.muted }} stroke="transparent" />
        <Tooltip
          formatter={currencyTooltip}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="amount" name="Amount" fill={`url(#${GRADIENT_IDS.deductions})`} radius={[0, 8, 8, 0]} style={{ filter: 'url(#taxBarShadow)' }} />
      </BarChart>
    </ResponsiveContainer>
  );
}
