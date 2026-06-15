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

export const pageNavItems: ReadonlyArray<{
  key: string;
  href: string;
  label: string;
  icon: string;
  section?: 'main' | 'admin';
}> = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: '📊', section: 'main' },
  { key: 'employees', href: '/employees', label: 'Employees', icon: '👥', section: 'main' },
  { key: 'payrolls', href: '/payrolls', label: 'Payrolls', icon: '💰', section: 'main' },
  { key: 'salarySlips', href: '/salary-slips', label: 'Salary Slips', icon: '🧾', section: 'main' },
  { key: 'taxes', href: '/taxes', label: 'Taxes', icon: '📋', section: 'main' },
  { key: 'gpFund', href: '/gp-fund', label: 'GP Fund', icon: '🏦', section: 'main' },
  { key: 'reports', href: '/reports', label: 'Reports', icon: '📄', section: 'main' },
  { key: 'settings', href: '/settings', label: 'Settings', icon: '⚙️', section: 'main' },
  { key: 'users', href: '/settings/users', label: 'Users', icon: '🛡️', section: 'admin' },
  { key: 'roles', href: '/settings/roles', label: 'Roles', icon: '🔐', section: 'admin' },
];

export { MODULE_NAV_PERMISSION } from './permissions';
