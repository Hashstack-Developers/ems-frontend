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
import { getThemeTokens } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency } from '@/lib/format';
import type { GpFundOverviewData } from '@/types';

const GRADIENT_IDS = {
  collection: 'gpfCollection',
  employees: 'gpfEmployees',
  pie0: 'gpfPie0',
  pie1: 'gpfPie1',
  pie2: 'gpfPie2',
  pie3: 'gpfPie3',
  pie4: 'gpfPie4',
} as const;

const PIE_FILLS = [GRADIENT_IDS.pie0, GRADIENT_IDS.pie1, GRADIENT_IDS.pie2, GRADIENT_IDS.pie3, GRADIENT_IDS.pie4];

function ChartDefs({ mode }: { mode: 'light' | 'dark' }) {
  const shadowColor = mode === 'dark' ? '#000000' : '#0f172a';
  const extra = {
    gpfCollection: { from: '#0d9488', to: '#5eead4' },
    gpfEmployees: { from: '#059669', to: '#6ee7b7' },
    gpfPie0: { from: '#0d9488', to: '#2dd4bf' },
    gpfPie1: { from: '#0891b2', to: '#67e8f9' },
    gpfPie2: { from: '#059669', to: '#34d399' },
    gpfPie3: { from: '#0284c7', to: '#7dd3fc' },
    gpfPie4: { from: '#6366f1', to: '#a5b4fc' },
  };

  return (
    <defs>
      <filter id="gpfBarShadow" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={shadowColor} floodOpacity={mode === 'dark' ? 0.35 : 0.15} />
      </filter>
      {Object.entries(extra).map(([key, g]) => (
        <linearGradient key={key} id={key} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={g.from} stopOpacity={1} />
          <stop offset="100%" stopColor={g.to} stopOpacity={0.85} />
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
    background: mode === 'dark' ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)',
    color: tokens.foreground,
    boxShadow: mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(13,148,136,0.12)',
    backdropFilter: 'blur(8px)',
  };
  return { mode, tokens, tooltipStyle };
}

function currencyTooltip(value: unknown) {
  return [`PKR ${Number(value).toLocaleString()}`, ''];
}

export function GpFundMonthlyAreaChart({ data }: { data: GpFundOverviewData }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = data.byMonth.map((row) => ({
    name: row.label.replace(' ', '\n'),
    totalCollected: row.totalCollected,
    employeeCount: row.employeeCount,
  }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No GP Fund data for selected filters</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart key={mode} data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <ChartDefs mode={mode} />
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.muted }} stroke="transparent" interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={currencyTooltip} contentStyle={tooltipStyle} />
        <Legend />
        <Area
          type="monotone"
          dataKey="totalCollected"
          name="GP Fund Collected"
          stroke="#0d9488"
          strokeWidth={2.5}
          fill={`url(#${GRADIENT_IDS.collection})`}
          fillOpacity={0.45}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GpFundYearlyBarChart({ data }: { data: GpFundOverviewData }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = data.byYear.map((row) => ({
    name: String(row.year),
    totalCollected: row.totalCollected,
    employeeCount: row.employeeCount,
  }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No yearly GP Fund data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart key={mode} data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="22%">
        <ChartDefs mode={mode} />
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: tokens.muted }} stroke="transparent" />
        <YAxis tick={{ fontSize: 11, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={currencyTooltip} contentStyle={tooltipStyle} cursor={{ fill: 'rgba(13,148,136,0.08)' }} />
        <Legend />
        <Bar
          dataKey="totalCollected"
          name="Total Collected"
          fill={`url(#${GRADIENT_IDS.collection})`}
          radius={[10, 10, 0, 0]}
          style={{ filter: 'url(#gpfBarShadow)' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GpFundScaleDonutChart({ data }: { data: GpFundOverviewData }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = data.byScale
    .filter((row) => row.totalCollected > 0)
    .slice(0, 8)
    .map((row) => ({
      name: row.scaleCode,
      value: row.totalCollected,
      subscription: row.subscriptionValue,
    }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No scale breakdown</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart key={mode}>
        <ChartDefs mode={mode} />
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={62}
          outerRadius={96}
          paddingAngle={3}
          dataKey="value"
          stroke={tokens.surface}
          strokeWidth={2}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={`url(#${PIE_FILLS[i % PIE_FILLS.length]})`} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, _n, props) => [
            formatCurrency(Number(v)),
            `${props.payload?.name} (${formatCurrency(Number(props.payload?.subscription))}/mo)`,
          ]}
          contentStyle={tooltipStyle}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GpFundTopContributorsChart({ data }: { data: GpFundOverviewData }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = data.byEmployee.slice(0, 8).map((row) => ({
    name: row.employeeCode || row.name.split(' ')[0],
    amount: row.totalCollected,
    fullName: row.name,
    scale: row.gpFundScale,
  }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No contributor data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart key={mode} data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <ChartDefs mode={mode} />
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11, fill: tokens.muted }} stroke="transparent" />
        <Tooltip
          formatter={currencyTooltip}
          labelFormatter={(_, payload) => {
            const item = payload?.[0]?.payload;
            return item ? `${item.fullName} (${item.scale})` : '';
          }}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="amount" name="Total Contributed" fill={`url(#${GRADIENT_IDS.employees})`} radius={[0, 10, 10, 0]} style={{ filter: 'url(#gpfBarShadow)' }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GpFundDashboardMiniChart({ byMonth }: { byMonth: GpFundOverviewData['byMonth'] }) {
  const { mode, tokens, tooltipStyle } = useChartTheme();
  const chartData = byMonth.map((row) => ({
    name: `${row.month}/${row.year}`,
    totalCollected: row.totalCollected,
  }));

  if (chartData.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-light">No GP Fund collection data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart key={mode} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <ChartDefs mode={mode} />
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderLight} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.muted }} stroke="transparent" />
        <YAxis tick={{ fontSize: 10, fill: tokens.mutedLight }} stroke="transparent" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={currencyTooltip} contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="totalCollected"
          name="Collected"
          stroke="#0d9488"
          strokeWidth={2}
          fill={`url(#${GRADIENT_IDS.collection})`}
          fillOpacity={0.35}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
