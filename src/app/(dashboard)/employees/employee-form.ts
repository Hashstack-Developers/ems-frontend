import type { Employee } from '@/types';

export type EmployeeFormValues = {
  name: string;
  designation: string;
  basicPayScale: string;
  religion: string;
  salaryTill: string;
  dateOfJoining: string;
  contractExpiryDate: string;
  employmentType: '' | 'contract' | 'regular';
  dateOfRegularization: string;
  dateOfBirth: string;
  dateOfRetirement: string;
  lengthOfService: string;
  mobile: string;
  cnicNo: string;
  email: string;
  stage: string;
  basicPayDec2025: string;
  personalAllowance: string;
  hr: string;
  ca: string;
  ma: string;
  adHocAllowance2022: string;
  adHocAllowance2023: string;
  adHocAllowance2024: string;
  adHocAllowance2025: string;
  overtimeAllowance: string;
  integratedAllowance: string;
  wa: string;
  specialAllowance: string;
  specialPay: string;
  mphilSpecialAllowance: string;
  socialSecurityBenefit: string;
  grossSalary: string;
  deduction: string;
  arrears: string;
  grossSalaryWithTaxes: string;
  incomeTaxMay2026: string;
  gpFund: string;
  netPayable: string;
  accountNumber: string;
  status: 'active' | 'inactive';
};

export const NUMERIC_FORM_FIELDS = [
  'basicPayDec2025',
  'personalAllowance',
  'hr',
  'ca',
  'ma',
  'adHocAllowance2022',
  'adHocAllowance2023',
  'adHocAllowance2024',
  'adHocAllowance2025',
  'overtimeAllowance',
  'integratedAllowance',
  'wa',
  'specialAllowance',
  'specialPay',
  'mphilSpecialAllowance',
  'socialSecurityBenefit',
  'grossSalary',
  'deduction',
  'arrears',
  'grossSalaryWithTaxes',
  'incomeTaxMay2026',
  'gpFund',
  'netPayable',
] as const satisfies readonly (keyof EmployeeFormValues)[];

export const EDITABLE_FORM_FIELDS = [
  'name',
  'designation',
  'basicPayScale',
  'religion',
  'salaryTill',
  'dateOfJoining',
  'contractExpiryDate',
  'employmentType',
  'dateOfRegularization',
  'dateOfBirth',
  'dateOfRetirement',
  'lengthOfService',
  'mobile',
  'cnicNo',
  'email',
  'stage',
  ...NUMERIC_FORM_FIELDS,
  'accountNumber',
  'status',
] as const satisfies readonly (keyof EmployeeFormValues)[];

export const emptyForm: EmployeeFormValues = {
  name: '',
  designation: '',
  basicPayScale: '',
  religion: '',
  salaryTill: '',
  dateOfJoining: new Date().toISOString().slice(0, 10),
  contractExpiryDate: '',
  employmentType: '',
  dateOfRegularization: '',
  dateOfBirth: '',
  dateOfRetirement: '',
  lengthOfService: '',
  mobile: '',
  cnicNo: '',
  email: '',
  stage: '',
  basicPayDec2025: '',
  personalAllowance: '',
  hr: '',
  ca: '',
  ma: '',
  adHocAllowance2022: '',
  adHocAllowance2023: '',
  adHocAllowance2024: '',
  adHocAllowance2025: '',
  overtimeAllowance: '',
  integratedAllowance: '',
  wa: '',
  specialAllowance: '',
  specialPay: '',
  mphilSpecialAllowance: '',
  socialSecurityBenefit: '',
  grossSalary: '',
  deduction: '',
  arrears: '',
  grossSalaryWithTaxes: '',
  incomeTaxMay2026: '',
  gpFund: '',
  netPayable: '',
  accountNumber: '',
  status: 'active',
};

function computeRetirementDate(dateOfBirth: string): string {
  if (!dateOfBirth) return '';
  const dob = new Date(dateOfBirth);
  const retirement = new Date(dob);
  retirement.setFullYear(retirement.getFullYear() + 60);
  return retirement.toISOString().slice(0, 10);
}

function computeLengthOfService(dateOfJoining: string): string {
  if (!dateOfJoining) return '';
  const join = new Date(dateOfJoining);
  const now = new Date();
  let years = now.getFullYear() - join.getFullYear();
  let months = now.getMonth() - join.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(', ') : 'Less than 1 month';
}

export function applyDerivedFields(form: EmployeeFormValues): EmployeeFormValues {
  return {
    ...form,
    dateOfRetirement: form.dateOfBirth ? computeRetirementDate(form.dateOfBirth) : form.dateOfRetirement,
    lengthOfService: form.dateOfJoining ? computeLengthOfService(form.dateOfJoining) : form.lengthOfService,
  };
}

function str(value: string | number | null | undefined): string {
  if (value == null || value === '') return '';
  return String(value);
}

export function employeeToForm(emp: Employee): EmployeeFormValues {
  return {
    name: emp.name,
    designation: emp.designation,
    basicPayScale: emp.basicPayScale ?? '',
    religion: emp.religion ?? '',
    salaryTill: emp.salaryTill ?? '',
    dateOfJoining: emp.dateOfJoining,
    contractExpiryDate: emp.contractExpiryDate ?? '',
    employmentType: emp.employmentType ?? '',
    dateOfRegularization: emp.dateOfRegularization ?? '',
    dateOfBirth: emp.dateOfBirth ?? '',
    dateOfRetirement: emp.dateOfRetirement ?? '',
    lengthOfService: emp.lengthOfService ?? '',
    mobile: emp.mobile ?? '',
    cnicNo: emp.cnicNo ?? '',
    email: emp.email,
    stage: emp.stage ?? '',
    basicPayDec2025: str(emp.basicPayDec2025),
    personalAllowance: str(emp.personalAllowance),
    hr: str(emp.hr),
    ca: str(emp.ca),
    ma: str(emp.ma),
    adHocAllowance2022: str(emp.adHocAllowance2022),
    adHocAllowance2023: str(emp.adHocAllowance2023),
    adHocAllowance2024: str(emp.adHocAllowance2024),
    adHocAllowance2025: str(emp.adHocAllowance2025),
    overtimeAllowance: str(emp.overtimeAllowance),
    integratedAllowance: str(emp.integratedAllowance),
    wa: str(emp.wa),
    specialAllowance: str(emp.specialAllowance),
    specialPay: str(emp.specialPay),
    mphilSpecialAllowance: str(emp.mphilSpecialAllowance),
    socialSecurityBenefit: str(emp.socialSecurityBenefit),
    grossSalary: str(emp.grossSalary),
    deduction: str(emp.deduction),
    arrears: str(emp.arrears),
    grossSalaryWithTaxes: str(emp.grossSalaryWithTaxes),
    incomeTaxMay2026: str(emp.incomeTaxMay2026),
    gpFund: str(emp.gpFund),
    netPayable: str(emp.netPayable),
    accountNumber: emp.accountNumber ?? '',
    status: emp.status,
  };
}

function parseOptionalNumber(value: string): number | undefined {
  if (value === '' || value == null) return undefined;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseOptionalString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function buildEmployeePayload(form: EmployeeFormValues) {
  const derived = applyDerivedFields(form);
  const payload: Record<string, unknown> = {
    name: derived.name.trim(),
    designation: derived.designation.trim(),
    basicPayScale: parseOptionalString(derived.basicPayScale),
    religion: parseOptionalString(derived.religion),
    salaryTill: parseOptionalString(derived.salaryTill),
    dateOfJoining: derived.dateOfJoining,
    contractExpiryDate: parseOptionalString(derived.contractExpiryDate),
    employmentType: derived.employmentType || undefined,
    dateOfRegularization: parseOptionalString(derived.dateOfRegularization),
    dateOfBirth: parseOptionalString(derived.dateOfBirth),
    dateOfRetirement: parseOptionalString(derived.dateOfRetirement),
    lengthOfService: parseOptionalString(derived.lengthOfService),
    mobile: parseOptionalString(derived.mobile),
    cnicNo: parseOptionalString(derived.cnicNo),
    email: derived.email.trim(),
    stage: parseOptionalString(derived.stage),
    accountNumber: parseOptionalString(derived.accountNumber),
    status: derived.status,
  };

  for (const key of NUMERIC_FORM_FIELDS) {
    payload[key] = parseOptionalNumber(derived[key]);
  }

  return payload;
}
