/**
 * ═══════════════════════════════════════════════════════════════
 *  EMS — Page Visibility Config
 * ═══════════════════════════════════════════════════════════════
 *
 *  Yahan se control karein ke kaunsa page show ho aur kaunsa hide.
 *
 *  true  → Sidebar mein dikhe + page open ho sake
 *  false → Sidebar se hide + direct URL se bhi block (dashboard par redirect)
 *
 *  Example: employees: false  → Employees page poori tarah band
 *
 *  Note: Kam az kam ek page true hona chahiye (dashboard recommended).
 */

export const pagesConfig = {
  dashboard: true,
  employees: true,
  payrolls: false,
  salarySlips: false,
  taxes: false,
  gpFund: false,
  reports: false,
  settings: true,
} as const;

export type PageKey = keyof typeof pagesConfig;

/** Nav labels & routes — inhe change karne ki zaroorat nahi, sirf pagesConfig upar edit karein */
export const pageNavItems: ReadonlyArray<{
  key: PageKey;
  href: string;
  label: string;
  icon: string;
}> = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'employees', href: '/employees', label: 'Employees', icon: '👥' },
  { key: 'payrolls', href: '/payrolls', label: 'Payrolls', icon: '💰' },
  { key: 'salarySlips', href: '/salary-slips', label: 'Salary Slips', icon: '🧾' },
  { key: 'taxes', href: '/taxes', label: 'Taxes', icon: '📋' },
  { key: 'gpFund', href: '/gp-fund', label: 'GP Fund', icon: '🏦' },
  { key: 'reports', href: '/reports', label: 'Reports', icon: '📄' },
  { key: 'settings', href: '/settings', label: 'Settings', icon: '⚙️' },
];
