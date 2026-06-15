export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  roleId?: number;
  roleLabel?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface RoleSummary {
  id: number;
  name: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  permissionCount: number;
}

export interface RoleDetail extends RoleSummary {
  users: User[];
}

export interface PermissionDefinition {
  id: number;
  key: string;
  module: string;
  action: string;
  description: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  basicSalary: number;
  joinDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface TaxSlab {
  id: number;
  name: string;
  minSalary: number;
  maxSalary: number | null;
  taxRate: number;
  description?: string;
  isActive: boolean;
  subTaxes?: SubTax[];
}

export interface SubTax {
  id: number;
  taxSlabId: number;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  rate: number | null;
  amount: number | null;
  description?: string;
  isActive: boolean;
}

export interface PayrollDeduction {
  id: number;
  name: string;
  code: string;
  category: 'income_tax' | 'sub_tax';
  amount: number;
  calculationType?: 'percentage' | 'fixed' | null;
  appliedRate?: number | null;
  appliedFixedAmount?: number | null;
  sourceSubTaxId?: number | null;
}

export interface Payroll {
  id: number;
  employeeId: number;
  employee?: Employee;
  month: number;
  year: number;
  basicSalary: number;
  grossSalary: number;
  incomeTax: number;
  totalDeductions: number;
  netSalary: number;
  taxSlabId: number | null;
  taxSlabName: string | null;
  appliedTaxRate?: number | null;
  taxSlabMinSalary?: number | null;
  taxSlabMaxSalary?: number | null;
  status: 'draft' | 'processed' | 'paid';
  deductions?: PayrollDeduction[];
}

export interface PayrollGenerationSkip {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  reason: string;
}

export interface PayrollGenerationResult {
  created: Payroll[];
  skipped: PayrollGenerationSkip[];
  errors: Array<{
    employeeId: number;
    employeeCode: string;
    fullName: string;
    message: string;
  }>;
  summary: {
    totalEligible: number;
    createdCount: number;
    skippedCount: number;
    errorCount: number;
  };
}

export interface PayrollGenerationStatus {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  department: string;
  designation: string;
  hasPayroll: boolean;
  payrollId: number | null;
  payrollStatus: 'draft' | 'processed' | 'paid' | null;
  canGenerate: boolean;
  message: string;
}

export interface SalarySlipAvailability {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  department: string;
  designation: string;
  payrollId: number | null;
  payrollStatus: 'draft' | 'processed' | 'paid' | null;
  canGenerateSlip: boolean;
  message: string;
}

export interface SalarySlip {
  payrollId: number;
  slipNumber: string;
  period: { month: number; year: number; label: string };
  employee: {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    department: string;
    designation: string;
    email: string;
    joinDate: string;
  };
  earnings: { basicSalary: number; grossSalary: number };
  deductions: Array<{
    name: string;
    code: string;
    category: string;
    calculationType: 'percentage' | 'fixed' | null;
    appliedRate: number | null;
    appliedFixedAmount: number | null;
    amount: number;
  }>;
  summary: {
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    incomeTax: number;
    taxSlabName: string | null;
    appliedTaxRate: number | null;
  };
  status: string;
  generatedAt: string;
}

export interface GpFundRecord {
  id: number;
  year: number;
  openingBalance: number;
  yearlyTaxCollection: number;
  markupRate: number | null;
  markupTaxAmount: number;
  closingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollMonthSummary {
  month: number;
  year: number;
  label: string;
  count: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
}

export interface DashboardStats {
  employees: { total: number; active: number; inactive: number };
  taxes: {
    slabs: number;
    activeSlabs: number;
    subTaxes: number;
    activeSubTaxes: number;
  };
  payrollByMonth: PayrollMonthSummary[];
  payrollTotals: {
    monthsWithPayroll: number;
    count: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
  };
}
