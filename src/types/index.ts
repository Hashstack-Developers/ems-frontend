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
  srNo?: string | null;
  name: string;
  fatherName?: string | null;
  address?: string | null;
  designation: string;
  basicPayScale?: string | null;
  religion?: string | null;
  disability?: 'no' | 'yes' | null;
  salaryTill?: string | null;
  dateOfJoining: string;
  contractExpiryDate?: string | null;
  employmentType?: 'contract' | 'regular' | null;
  employeeType?: 'employee' | 'employer';
  dateOfRegularization?: string | null;
  dateOfBirth?: string | null;
  dateOfRetirement?: string | null;
  lengthOfService?: string | null;
  mobile?: string | null;
  cnicNo?: string | null;
  email: string;
  stage?: string | null;
  timePeriod?: string | null;
  increment?: number | null;
  basicPayDec2025?: number | null;
  basicPayJul2026?: number | null;
  personalAllowance?: number | null;
  hr?: number | null;
  ca?: number | null;
  ma?: number | null;
  adHocAllowance2022?: number | null;
  adHocAllowance2023?: number | null;
  adHocAllowance2024?: number | null;
  adHocAllowance2025?: number | null;
  adHocAllowance2026?: number | null;
  personalPay?: number | null;
  overtimeAllowance?: number | null;
  integratedAllowance?: number | null;
  wa?: number | null;
  computerAllowance?: number | null;
  welfareAllowance?: number | null;
  managementAllowance?: number | null;
  specialAllowance?: number | null;
  specialPay?: number | null;
  mphilSpecialAllowance?: number | null;
  socialSecurityBenefit?: number | null;
  grossSalary?: number | null;
  loanAdvance?: number | null;
  deduction?: number | null;
  arrears?: number | null;
  previousDeduction?: number | null;
  totalDeductedIncomeTax202526?: number | null;
  annualIncomeTax202526?: number | null;
  grossSalaryWithTaxes?: number | null;
  incomeTaxMay2026?: number | null;
  gpFund?: string | null;
  previouslyCollectedGpFund?: number | null;
  gpfCollection?: number | null;
  netPayable?: number | null;
  accountNumber?: string | null;
  nomineeName?: string | null;
  nomineeRelation?: string | null;
  gpfAccountNumber?: string | null;
  status: 'active' | 'inactive';
  payrollOnHold: boolean;
  payrollHeldFrom?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollHoldEmployee {
  id: number;
  employeeCode: string;
  name: string;
  designation: string;
  payrollOnHold: boolean;
  payrollHeldFrom: string | null;
}

export interface TaxSlab {
  id: number;
  name: string;
  minSalary: number;
  maxSalary: number | null;
  taxRate: number | null;
  fixedTaxAmount: number | null;
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
  category: 'income_tax' | 'sub_tax' | 'gp_fund';
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
  salaryDays?: number | null;
  incomeTax: number;
  totalDeductions: number;
  netSalary: number;
  welfareAllowanceAmount?: number;
  managementAllowanceAmount?: number;
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
  fatherName: string;
  stage: string;
  designation: string;
  payrollId: number | null;
  payrollStatus: 'draft' | 'processed' | 'paid' | null;
  canGenerateSlip: boolean;
  message: string;
}

export interface SalarySlipInfoField {
  label: string;
  value: string;
}

export interface SalarySlipLineItem {
  label: string;
  amount: number;
}

export interface SalarySlipRecoverySection {
  title: string;
  payable: number;
  recoveredTill: number;
  recoverable: number;
}

export interface SalarySlip {
  payrollId: number;
  slipNumber: string;
  period: { month: number; year: number; label: string };
  dated: string;
  organization: {
    title: string;
    subtitle: string;
    documentTitle: string;
  };
  employee: {
    id: number;
    employeeCode: string;
    fullName: string;
    fatherName: string;
    designation: string;
    basicPayScale: string;
    cnicNo: string;
    mobile: string;
    email: string;
    dateOfBirth: string;
    dateOfRetirement: string;
    dateOfJoining: string;
    lengthOfService: string;
    stage: string;
    employmentType: string;
    bankName: string;
    bankBranch: string;
    accountNumber: string;
  };
  employeeInfoFields: SalarySlipInfoField[];
  allowances: SalarySlipLineItem[];
  deductions: SalarySlipLineItem[];
  loanRecovery: SalarySlipRecoverySection | null;
  taxRecovery: SalarySlipRecoverySection | null;
  earnings: { basicSalary: number; grossSalary: number; salaryDays?: number | null };
  rawDeductions: Array<{
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
  notes: string[];
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

export interface GpFundScale {
  id: number;
  code: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface GpFundMarkupSettings {
  id: number;
  annualMarkupRate: number;
  updatedAt: string;
}

export type GpFundAdvanceStatus = 'active' | 'completed' | 'cancelled';

export interface GpFundAdvancePayment {
  id: number;
  payrollId: number | null;
  amount: number;
  month: number;
  year: number;
}

export interface GpFundAdvance {
  id: number;
  employeeId: number;
  employeeCode: string;
  name: string;
  fatherName: string;
  designation: string;
  gpFundScale: string | null;
  advanceAmount: number;
  installmentMonths: number;
  monthlyInstallment: number;
  amountRepaid: number;
  remainingBalance: number;
  installmentsPaid: number;
  installmentsRemaining: number;
  status: GpFundAdvanceStatus;
  takenDate: string;
  notes: string | null;
  payments: GpFundAdvancePayment[];
}

export interface GpFundAdvanceEligibility {
  totalGpFundBalance: number;
  maxAdvancePercentage: number;
  maxAdvanceAmount: number;
}

export interface GpFundAdvanceSummary {
  totalAdvances: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  totalAdvanced: number;
  totalRepaid: number;
  totalOutstanding: number;
  monthlyInstallmentsDue: number;
  totalInstallmentsCollected: number;
  advances: GpFundAdvance[];
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

export interface DashboardDeductionsMonthRow {
  month: number;
  year: number;
  label: string;
  totalTaxes: number;
  totalGpFund: number;
  totalCombined: number;
}

export interface DashboardTaxCollection {
  totalCollected: number;
  totalIncomeTax: number;
  totalSubTaxes: number;
  payrollRecords: number;
  employeeCount: number;
  byMonth: TaxOverviewMonthRow[];
}

export interface DashboardStats {
  employees: { total: number; active: number; inactive: number };
  taxes: {
    slabs: number;
    activeSlabs: number;
    subTaxes: number;
    activeSubTaxes: number;
  };
  taxCollection: DashboardTaxCollection;
  gpFund: {
    totalCollected: number;
    totalBaseCollected: number;
    totalAnnualMarkup: number;
    totalAdvanceInstallments: number;
    annualMarkupRate: number;
    advances: GpFundAdvanceSummary;
    enrolledEmployees: number;
    contributingRecords: number;
    avgMonthlyContribution: number;
    scaleCount: number;
    byMonth: GpFundOverviewMonthRow[];
  };
  pension: PensionDashboardSummary;
  combined: {
    totalTaxDeductions: number;
    totalGpFund: number;
    totalCombinedDeductions: number;
  };
  payrollByMonth: PayrollMonthSummary[];
  deductionsByMonth: DashboardDeductionsMonthRow[];
  payrollTotals: {
    monthsWithPayroll: number;
    count: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    totalTaxDeductions: number;
    totalGpFund: number;
    totalCombinedDeductions: number;
  };
}

export interface TaxOverviewSummary {
  payrollCount: number;
  employeeCount: number;
  totalGross: number;
  totalIncomeTax: number;
  totalSubTaxes: number;
  totalDeductions: number;
  totalNet: number;
}

export interface TaxOverviewMonthRow {
  year: number;
  month: number;
  label: string;
  payrollCount: number;
  employeeCount: number;
  totalGross: number;
  totalIncomeTax: number;
  totalSubTaxes: number;
  totalDeductions: number;
  totalNet: number;
}

export interface TaxOverviewYearRow {
  year: number;
  payrollCount: number;
  employeeCount: number;
  totalGross: number;
  totalIncomeTax: number;
  totalSubTaxes: number;
  totalDeductions: number;
  totalNet: number;
}

export interface TaxOverviewSlabRow {
  taxSlabId: number | null;
  taxSlabName: string;
  payrollCount: number;
  totalIncomeTax: number;
  totalSubTaxes: number;
  totalDeductions: number;
}

export interface TaxOverviewEmployeeRow {
  employeeId: number;
  employeeCode: string;
  name: string;
  fatherName: string;
  designation: string;
  payrollCount: number;
  totalIncomeTax: number;
  totalSubTaxes: number;
  totalDeductions: number;
  totalGross: number;
}

export interface TaxOverviewDeductionRow {
  code: string;
  name: string;
  category: string;
  amount: number;
  count: number;
}

export interface TaxOverviewRecordRow {
  payrollId: number;
  employeeId: number;
  employeeCode: string;
  name: string;
  fatherName: string;
  designation: string;
  month: number;
  year: number;
  label: string;
  grossSalary: number;
  incomeTax: number;
  subTaxes: number;
  totalDeductions: number;
  netSalary: number;
  taxSlabName: string | null;
  appliedTaxRate: number | null;
}

export interface TaxOverviewData {
  summary: TaxOverviewSummary;
  byMonth: TaxOverviewMonthRow[];
  byYear: TaxOverviewYearRow[];
  bySlab: TaxOverviewSlabRow[];
  byEmployee: TaxOverviewEmployeeRow[];
  byDeduction: TaxOverviewDeductionRow[];
  records: TaxOverviewRecordRow[];
  availableYears: number[];
  filters: {
    employeeId: number | null;
    years: number[];
    months: number[];
  };
}

export interface GpFundOverviewSummary {
  payrollCount: number;
  employeeCount: number;
  enrolledEmployeeCount: number;
  totalBaseCollected: number;
  totalAnnualMarkup: number;
  totalAdvanceInstallments: number;
  totalCollected: number;
  avgMonthlyContribution: number;
  scaleCount: number;
  annualMarkupRate: number;
}

export interface GpFundOverviewMonthRow {
  year: number;
  month: number;
  label: string;
  payrollCount: number;
  employeeCount: number;
  totalBaseCollected: number;
  totalAnnualMarkup: number;
  totalCollected: number;
}

export interface GpFundOverviewYearRow {
  year: number;
  payrollCount: number;
  employeeCount: number;
  totalBaseCollected: number;
  totalAnnualMarkup: number;
  totalCollected: number;
}

export interface GpFundOverviewScaleRow {
  scaleCode: string;
  subscriptionValue: number;
  payrollCount: number;
  employeeCount: number;
  totalBaseCollected: number;
  totalAnnualMarkup: number;
  totalCollected: number;
}

export interface GpFundOverviewEmployeeRow {
  employeeId: number;
  employeeCode: string;
  name: string;
  fatherName: string;
  designation: string;
  gpFundScale: string | null;
  subscriptionValue: number;
  payrollCount: number;
  totalBaseCollected: number;
  totalAnnualMarkup: number;
  totalCollected: number;
}

export interface GpFundOverviewRecordRow {
  payrollId: number;
  employeeId: number;
  employeeCode: string;
  name: string;
  fatherName: string;
  designation: string;
  month: number;
  year: number;
  label: string;
  gpFundScale: string | null;
  subscriptionValue: number;
  gpFundBaseAmount: number;
  monthlyMarkupAmount: number;
  annualMarkupAmount: number;
  advanceInstallmentAmount: number;
  gpFundAmount: number;
  grossSalary: number;
}

export interface GpFundOverviewData {
  summary: GpFundOverviewSummary;
  byMonth: GpFundOverviewMonthRow[];
  byYear: GpFundOverviewYearRow[];
  byScale: GpFundOverviewScaleRow[];
  byEmployee: GpFundOverviewEmployeeRow[];
  records: GpFundOverviewRecordRow[];
  advances: GpFundAdvanceSummary;
  availableYears: number[];
  filters: {
    employeeId: number | null;
    years: number[];
    months: number[];
  };
}

export interface GpFundReportAvailability {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  fatherName: string;
  stage: string;
  designation: string;
  gpFundScale: string | null;
  payrollCount: number;
  totalCollected: number;
  canGenerateReport: boolean;
  message: string;
}

export interface GpFundReportAvailabilityResponse {
  rows: GpFundReportAvailability[];
  availableYears: number[];
}

export interface GpFundReportContributionRow {
  label: string;
  month: number;
  year: number;
  subscriptionValue: number;
  gpFundBaseAmount: number;
  monthlyMarkupAmount: number;
  annualMarkupAmount: number;
  advanceInstallmentAmount: number;
  gpFundAmount: number;
}

export interface GpFundSlipTableRow {
  srNo: number;
  subscriptionPerMonth: number;
  tenure: string;
  closingBalance: number;
  yearlyCollection: number;
  currentBalance: number;
  collectionRate: string;
  markupAmount: number;
  totalBalanceInclusiveMarkup: number;
}

export interface GpFundLoanRecovery {
  totalPayable: number;
  recoveredTill: number;
  balancePayable: number;
}

export interface GpFundReport {
  reportNumber: string;
  dated: string;
  periodLabel: string;
  organization: {
    title: string;
    subtitle: string;
    documentTitle: string;
  };
  employee: {
    id: number;
    employeeCode: string;
  };
  employeeInfoFields: Array<{ label: string; value: string }>;
  fundTableRows: GpFundSlipTableRow[];
  loanRecovery: GpFundLoanRecovery;
  totalGpfBalance: number;
  notes: string[];
  generatedAt: string;
}

// ── Allowances ────────────────────────────────────────────────────────────────

export interface AllowanceSettings {
  id: number;
  welfareRate: number;
  managementRate: number;
  updatedAt: string;
}

export interface AllowanceByMonth {
  year: number;
  month: number;
  label: string;
  payrollCount: number;
  employeeCount: number;
  welfareTotal: number;
  managementTotal: number;
  totalAmount: number;
}

export interface AllowanceByYear {
  year: number;
  payrollCount: number;
  employeeCount: number;
  welfareTotal: number;
  managementTotal: number;
  totalAmount: number;
}

export interface AllowanceByEmployee {
  employeeId: number;
  employeeCode: string;
  name: string;
  designation: string;
  payrollCount: number;
  welfareTotal: number;
  managementTotal: number;
  totalAmount: number;
}

export interface AllowanceRecord {
  payrollId: number;
  employeeId: number;
  employeeCode: string;
  name: string;
  designation: string;
  month: number;
  year: number;
  label: string;
  welfareAmount: number;
  managementAmount: number;
  totalAmount: number;
  grossSalary: number;
}

export interface AllowanceOverviewSummary {
  payrollCount: number;
  employeeCount: number;
  totalWelfareAmount: number;
  totalManagementAmount: number;
  totalAllowanceAmount: number;
  avgWelfarePerPayroll: number;
  avgManagementPerPayroll: number;
}

export interface AllowanceOverviewData {
  summary: AllowanceOverviewSummary;
  byMonth: AllowanceByMonth[];
  byYear: AllowanceByYear[];
  byEmployee: AllowanceByEmployee[];
  records: AllowanceRecord[];
  availableYears: number[];
}

export interface AllowanceDashboardSummary {
  totalWelfareAmount: number;
  totalManagementAmount: number;
  totalAllowanceAmount: number;
  enrolledEmployees: number;
  payrollCount: number;
  byMonth: AllowanceByMonth[];
}

export interface PensionSettings {
  id: number;
  employeeRate: number;
  employerRate: number;
  updatedAt: string;
}

export interface PensionEnrollment {
  id: number;
  employeeId: number;
  employee?: Employee;
  isActive: boolean;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PensionOverviewRecord {
  payrollId: number;
  employeeId: number;
  employeeCode: string;
  name: string;
  designation: string;
  month: number;
  year: number;
  label: string;
  pensionAmount: number;
  grossSalary: number;
}

export interface PensionByMonth {
  year: number;
  month: number;
  label: string;
  employeePension: number;
  employerPension: number;
  total: number;
  count: number;
  employeeCount: number;
}

export interface PensionByYear {
  year: number;
  employeePension: number;
  employerPension: number;
  total: number;
  count: number;
  employeeCount: number;
}

export interface PensionByEmployee {
  employeeId: number;
  employeeCode: string;
  name: string;
  designation: string;
  employeePension: number;
  employerPension: number;
  total: number;
  count: number;
}

export interface PensionOverviewSummary {
  payrollCount: number;
  employeeCount: number;
  totalPension: number;
  totalEmployeePension: number;
  totalEmployerPension: number;
  activeEnrollments: number;
  totalEnrollments: number;
}

export interface PensionOverviewData {
  summary: PensionOverviewSummary;
  byMonth: PensionByMonth[];
  byYear: PensionByYear[];
  byEmployee: PensionByEmployee[];
  records: PensionOverviewRecord[];
  availableYears: number[];
}

export interface PensionDashboardSummary {
  totalPension: number;
  activeEnrollments: number;
  enrolledEmployees: number;
  byMonth: PensionByMonth[];
}
