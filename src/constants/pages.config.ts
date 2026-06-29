export const pagesConfig: Record<string, boolean> = {
  dashboard: true,
  employees: true,
  payrolls: true,
  salarySlips: true,
  taxes: true,
  gpFund: true,
  reports: true,
  settings: true,
  users: true,
  roles: true,
};

export type PageKey = keyof typeof pagesConfig;

export type PageNavChild = {
  key: string;
  href: string;
  label: string;
  icon: string;
};

export const pageNavItems: ReadonlyArray<{
  key: string;
  href: string;
  label: string;
  icon: string;
  section?: 'main' | 'admin';
  children?: ReadonlyArray<PageNavChild>;
}> = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: '📊', section: 'main' },
  { key: 'employees', href: '/employees', label: 'Employees', icon: '👥', section: 'main' },
  { key: 'payrolls', href: '/payrolls', label: 'Payrolls', icon: '💰', section: 'main' },
  { key: 'salarySlips', href: '/salary-slips', label: 'Salary Slips', icon: '🧾', section: 'main' },
  {
    key: 'taxes',
    href: '/taxes/overview',
    label: 'Taxes',
    icon: '📋',
    section: 'main',
    children: [
      { key: 'taxesOverview', href: '/taxes/overview', label: 'Overview', icon: '📈' },
      { key: 'taxesSlabs', href: '/taxes/slabs', label: 'Slabs', icon: '📑' },
    ],
  },
  {
    key: 'gpFund',
    href: '/gp-fund/overview',
    label: 'GP Fund',
    icon: '🏦',
    section: 'main',
    children: [
      { key: 'gpFundOverview', href: '/gp-fund/overview', label: 'Overview', icon: '📘' },
      { key: 'gpFundScales', href: '/gp-fund/scales', label: 'GP Scales', icon: '🧮' },
      { key: 'gpFundMarkups', href: '/gp-fund/markups', label: 'GP Markups', icon: '📊' },
      { key: 'gpFundAdvances', href: '/gp-fund/advances', label: 'GP Advances', icon: '💳' },
    ],
  },
  { key: 'reports', href: '/reports', label: 'Reports', icon: '📄', section: 'main' },
  { key: 'settings', href: '/settings', label: 'Settings', icon: '⚙️', section: 'main' },
];

export { MODULE_NAV_PERMISSION } from './permissions';
