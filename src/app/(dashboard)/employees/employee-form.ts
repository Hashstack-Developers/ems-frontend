import type { Employee } from '@/types';

export const WIZARD_STEPS = [
  { id: 1, title: 'Personal Information' },
  { id: 2, title: 'Employment Information' },
  { id: 3, title: 'Salary Structure' },
  { id: 4, title: 'Stage / Service Progression' },
  { id: 5, title: 'Deductions & Taxation' },
  { id: 6, title: 'Salary Summary' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

export type EmployeeFormValues = {
  srNo: string;
  name: string;
  fatherName: string;
  address: string;
  religion: string;
  disability: '' | 'no' | 'yes';
  dateOfBirth: string;
  mobile: string;
  cnicNo: string;
  email: string;
  accountNumber: string;
  nomineeName: string;
  nomineeRelation: string;
  gpfAccountNumber: string;
  designation: string;
  basicPayScale: string;
  dateOfJoining: string;
  contractExpiryDate: string;
  employmentType: '' | 'contract' | 'regular';
  employeeType: '' | 'employee' | 'employer';
  dateOfRegularization: string;
  dateOfRetirement: string;
  lengthOfService: string;
  status: 'active' | 'inactive';
  stage: string;
  timePeriod: string;
  increment: string;
  basicPayDec2025: string;
  basicPayJul2026: string;
  personalAllowance: string;
  hr: string;
  ca: string;
  ma: string;
  adHocAllowance2022: string;
  adHocAllowance2023: string;
  adHocAllowance2024: string;
  adHocAllowance2025: string;
  adHocAllowance2026: string;
  overtimeAllowance: string;
  integratedAllowance: string;
  wa: string;
  computerAllowance: string;
  welfareAllowance: string;
  managementAllowance: string;
  specialAllowance: string;
  socialSecurityBenefit: string;
  specialPay: string;
  mphilSpecialAllowance: string;
  personalPay: string;
  loanAdvance: string;
  deduction: string;
  arrears: string;
  incomeTaxMay2026: string;
  previousDeduction: string;
  totalDeductedIncomeTax202526: string;
  annualIncomeTax202526: string;
  gpFund: string;
  previouslyCollectedGpFund: string;
  gpfCollection: string;
  grossSalary: string;
  grossSalaryWithTaxes: string;
  netPayable: string;
};

export const NUMERIC_FORM_FIELDS = [
  'basicPayDec2025',
  'basicPayJul2026',
  'personalAllowance',
  'hr',
  'ca',
  'ma',
  'adHocAllowance2022',
  'adHocAllowance2023',
  'adHocAllowance2024',
  'adHocAllowance2025',
  'adHocAllowance2026',
  'personalPay',
  'overtimeAllowance',
  'integratedAllowance',
  'wa',
  'computerAllowance',
  'welfareAllowance',
  'managementAllowance',
  'specialAllowance',
  'specialPay',
  'mphilSpecialAllowance',
  'socialSecurityBenefit',
  'grossSalary',
  'loanAdvance',
  'deduction',
  'arrears',
  'previousDeduction',
  'totalDeductedIncomeTax202526',
  'annualIncomeTax202526',
  'grossSalaryWithTaxes',
  'incomeTaxMay2026',
  'previouslyCollectedGpFund',
  'gpfCollection',
  'netPayable',
  'increment',
] as const satisfies readonly (keyof EmployeeFormValues)[];

export const EDITABLE_FORM_FIELDS = [
  'name',
  'fatherName',
  'address',
  'religion',
  'disability',
  'dateOfBirth',
  'mobile',
  'cnicNo',
  'email',
  'accountNumber',
  'nomineeName',
  'nomineeRelation',
  'gpfAccountNumber',
  'designation',
  'basicPayScale',
  'dateOfJoining',
  'contractExpiryDate',
  'employmentType',
  'employeeType',
  'dateOfRegularization',
  'dateOfRetirement',
  'lengthOfService',
  'status',
  'stage',
  'timePeriod',
  'gpFund',
  ...NUMERIC_FORM_FIELDS,
] as const satisfies readonly (keyof EmployeeFormValues)[];

export type StepErrors = Partial<Record<keyof EmployeeFormValues, string>>;

export const emptyForm: EmployeeFormValues = {
  srNo: '',
  name: '',
  fatherName: '',
  address: '',
  religion: '',
  disability: '',
  dateOfBirth: '',
  mobile: '',
  cnicNo: '',
  email: '',
  accountNumber: '',
  nomineeName: '',
  nomineeRelation: '',
  gpfAccountNumber: '',
  designation: '',
  basicPayScale: '',
  dateOfJoining: new Date().toISOString().slice(0, 10),
  contractExpiryDate: '',
  employmentType: '',
  employeeType: '',
  dateOfRegularization: '',
  dateOfRetirement: '',
  lengthOfService: '',
  status: 'active',
  stage: '',
  timePeriod: '',
  increment: '',
  basicPayDec2025: '',
  basicPayJul2026: '',
  personalAllowance: '',
  hr: '',
  ca: '',
  ma: '',
  adHocAllowance2022: '',
  adHocAllowance2023: '',
  adHocAllowance2024: '',
  adHocAllowance2025: '',
  adHocAllowance2026: '',
  overtimeAllowance: '',
  integratedAllowance: '',
  wa: '',
  computerAllowance: '',
  welfareAllowance: '',
  managementAllowance: '',
  specialAllowance: '',
  socialSecurityBenefit: '',
  specialPay: '',
  mphilSpecialAllowance: '',
  personalPay: '',
  loanAdvance: '',
  deduction: '',
  arrears: '',
  incomeTaxMay2026: '',
  previousDeduction: '',
  totalDeductedIncomeTax202526: '',
  annualIncomeTax202526: '',
  gpFund: '',
  previouslyCollectedGpFund: '',
  gpfCollection: '',
  grossSalary: '',
  grossSalaryWithTaxes: '',
  netPayable: '',
};

const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;
const MOBILE_REGEX = /^(\+92|0)?3\d{9}$/;
const TIME_PERIOD_REGEX = /^(?:[1-9]|[12][0-9]|30)?$/;
const EMPLOYEE_CODE_PREFIX = 'WCLA';

export function previewEmployeeCode(cnicNo: string): string {
  const digits = cnicNo.replace(/\D/g, '');
  if (digits.length !== 13) return 'Auto-generated from CNIC on save';
  return `${EMPLOYEE_CODE_PREFIX}-${digits.slice(5, 12)}`;
}

function computeRetirementDate(dateOfBirth: string): string {
  if (!dateOfBirth) return '';
  const dob = new Date(dateOfBirth);
  const retirement = new Date(dob);
  retirement.setFullYear(retirement.getFullYear() + 60);
  retirement.setDate(retirement.getDate() - 1);
  return retirement.toISOString().slice(0, 10);
}

function formatDuration(start: Date, end: Date): string {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(', ') : 'Less than 1 month';
}

function computeLengthOfService(dateOfJoining: string): string {
  if (!dateOfJoining) return '';
  return formatDuration(new Date(dateOfJoining), new Date());
}

function computeIncrement(basicPayDec2025: string, basicPayJul2026: string): string {
  const dec = parseFloat(basicPayDec2025);
  const jul = parseFloat(basicPayJul2026);
  if (Number.isNaN(dec) || Number.isNaN(jul)) return '';
  if (jul <= dec) return '0.00';
  return (jul - dec).toFixed(2);
}

function parseMoney(value: string): number {
  if (!value.trim()) return 0;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Same components as salary-slip Pay & Allowances (excl. payroll-only welfare/management/pension). */
export function computeGrossSalaryLikeSlip(form: EmployeeFormValues): number {
  const basicPay =
    parseMoney(form.basicPayJul2026) > 0
      ? parseMoney(form.basicPayJul2026)
      : parseMoney(form.basicPayDec2025);

  return (
    basicPay +
    parseMoney(form.hr) +
    parseMoney(form.ca) +
    parseMoney(form.ma) +
    parseMoney(form.adHocAllowance2022) +
    parseMoney(form.adHocAllowance2023) +
    parseMoney(form.adHocAllowance2024) +
    parseMoney(form.adHocAllowance2025) +
    parseMoney(form.adHocAllowance2026) +
    parseMoney(form.socialSecurityBenefit) +
    parseMoney(form.specialPay) +
    parseMoney(form.personalAllowance) +
    parseMoney(form.mphilSpecialAllowance) +
    parseMoney(form.personalPay) +
    parseMoney(form.overtimeAllowance) +
    parseMoney(form.integratedAllowance) +
    parseMoney(form.wa) +
    parseMoney(form.computerAllowance) +
    parseMoney(form.specialAllowance) +
    parseMoney(form.arrears)
  );
}

export function applyDerivedFields(form: EmployeeFormValues): EmployeeFormValues {
  const dateOfRetirement = form.dateOfBirth
    ? computeRetirementDate(form.dateOfBirth)
    : form.dateOfRetirement;
  const lengthOfService = form.dateOfJoining
    ? computeLengthOfService(form.dateOfJoining)
    : form.lengthOfService;
  const hasBasicPays =
    form.basicPayDec2025.trim() !== '' && form.basicPayJul2026.trim() !== '';
  const increment = hasBasicPays
    ? computeIncrement(form.basicPayDec2025, form.basicPayJul2026)
    : form.increment;

  const gross = computeGrossSalaryLikeSlip(form);
  const grossDisplay = gross > 0 ? gross.toFixed(2) : '';

  return {
    ...form,
    dateOfRetirement,
    lengthOfService,
    increment,
    // Same value as salary-slip Pay & Allowances total; also used as tax base.
    grossSalary: grossDisplay,
    grossSalaryWithTaxes: grossDisplay,
  };
}

function validateNumericField(value: string, label: string): string | undefined {
  if (value === '') return undefined;
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed)) return `${label} must be a valid number`;
  if (parsed < 0) return `${label} cannot be negative`;
  return undefined;
}

function normalizeMobile(value: string): string {
  return value.trim().replace(/[\s-]/g, '');
}

export function validateStep(
  step: WizardStepId,
  form: EmployeeFormValues,
  options?: { isEditing?: boolean },
): StepErrors {
  const derived = applyDerivedFields(form);
  const errors: StepErrors = {};

  if (step === 1) {
    if (!derived.name.trim()) errors.name = 'Name is required';
    if (!derived.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(derived.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    const mobile = normalizeMobile(derived.mobile);
    if (mobile && !MOBILE_REGEX.test(mobile)) {
      errors.mobile = 'Enter a valid Pakistani mobile number (e.g. 03XXXXXXXXX)';
    }
    if (!derived.cnicNo.trim()) {
      errors.cnicNo = 'CNIC is required';
    } else if (!CNIC_REGEX.test(derived.cnicNo.trim())) {
      errors.cnicNo = 'CNIC must be in format XXXXX-XXXXXXX-X';
    }
  }

  if (step === 2) {
    if (!derived.designation.trim()) errors.designation = 'Designation is required';
    if (!derived.dateOfJoining) errors.dateOfJoining = 'Date of joining is required';
  }

  if (step === 3) {
    for (const key of NUMERIC_FORM_FIELDS) {
      if (['deduction', 'arrears', 'loanAdvance', 'previousDeduction', 'totalDeductedIncomeTax202526', 'annualIncomeTax202526', 'grossSalaryWithTaxes', 'incomeTaxMay2026', 'previouslyCollectedGpFund', 'gpfCollection', 'netPayable', 'grossSalary'].includes(key)) {
        continue;
      }
      const err = validateNumericField(derived[key], key);
      if (err) errors[key] = err;
    }
  }

  if (step === 4) {
    if (derived.timePeriod.trim() && !TIME_PERIOD_REGEX.test(derived.timePeriod.trim())) {
      errors.timePeriod = 'Enter payable days between 1 and 30 (leave empty for full month)';
    }
  }

  if (step === 5) {
    const step5Numeric: (keyof EmployeeFormValues)[] = [
      'loanAdvance', 'deduction', 'arrears', 'previousDeduction',
      'totalDeductedIncomeTax202526', 'annualIncomeTax202526',
      'incomeTaxMay2026', 'previouslyCollectedGpFund', 'gpfCollection',
    ];
    for (const key of step5Numeric) {
      const err = validateNumericField(derived[key], key);
      if (err) errors[key] = err;
    }
  }

  if (step === 6) {
    const requiredStep6: { key: keyof EmployeeFormValues; label: string }[] = [
      { key: 'grossSalary', label: 'Gross salary' },
      { key: 'grossSalaryWithTaxes', label: 'Gross salary with taxes' },
    ];
    for (const { key, label } of requiredStep6) {
      if (!options?.isEditing && !derived[key].trim()) {
        errors[key] = `${label} is required`;
        continue;
      }
      if (derived[key].trim()) {
        const err = validateNumericField(derived[key], label);
        if (err) errors[key] = err;
      }
    }
  }

  return errors;
}

function str(value: string | number | null | undefined): string {
  if (value == null || value === '') return '';
  return String(value);
}

export function employeeToForm(emp: Employee): EmployeeFormValues {
  return applyDerivedFields({
    srNo: emp.srNo ?? '',
    name: emp.name,
    fatherName: emp.fatherName ?? '',
    address: emp.address ?? '',
    religion: emp.religion ?? '',
    disability: emp.disability ?? '',
    dateOfBirth: emp.dateOfBirth ?? '',
    mobile: emp.mobile ?? '',
    cnicNo: emp.cnicNo ?? '',
    email: emp.email,
    accountNumber: emp.accountNumber ?? '',
    nomineeName: emp.nomineeName ?? '',
    nomineeRelation: emp.nomineeRelation ?? '',
    gpfAccountNumber: emp.gpfAccountNumber ?? '',
    designation: emp.designation,
    basicPayScale: emp.basicPayScale ?? '',
    dateOfJoining: emp.dateOfJoining,
    contractExpiryDate: emp.contractExpiryDate ?? '',
    employmentType: emp.employmentType ?? '',
    employeeType: emp.employeeType ?? '',
    dateOfRegularization: emp.dateOfRegularization ?? '',
    dateOfRetirement: emp.dateOfRetirement ?? '',
    lengthOfService: emp.lengthOfService ?? '',
    status: emp.status,
    stage: emp.stage ?? '',
    timePeriod: emp.timePeriod ?? '',
    increment: str(emp.increment),
    basicPayDec2025: str(emp.basicPayDec2025),
    basicPayJul2026: str(emp.basicPayJul2026),
    personalAllowance: str(emp.personalAllowance),
    hr: str(emp.hr),
    ca: str(emp.ca),
    ma: str(emp.ma),
    adHocAllowance2022: str(emp.adHocAllowance2022),
    adHocAllowance2023: str(emp.adHocAllowance2023),
    adHocAllowance2024: str(emp.adHocAllowance2024),
    adHocAllowance2025: str(emp.adHocAllowance2025),
    adHocAllowance2026: str(emp.adHocAllowance2026),
    personalPay: str(emp.personalPay),
    overtimeAllowance: str(emp.overtimeAllowance),
    integratedAllowance: str(emp.integratedAllowance),
    wa: str(emp.wa),
    computerAllowance: str(emp.computerAllowance),
    welfareAllowance: str(emp.welfareAllowance),
    managementAllowance: str(emp.managementAllowance),
    specialAllowance: str(emp.specialAllowance),
    socialSecurityBenefit: str(emp.socialSecurityBenefit),
    specialPay: str(emp.specialPay),
    mphilSpecialAllowance: str(emp.mphilSpecialAllowance),
    loanAdvance: str(emp.loanAdvance),
    deduction: str(emp.deduction),
    arrears: str(emp.arrears),
    previousDeduction: str(emp.previousDeduction),
    totalDeductedIncomeTax202526: str(emp.totalDeductedIncomeTax202526),
    annualIncomeTax202526: str(emp.annualIncomeTax202526),
    incomeTaxMay2026: str(emp.incomeTaxMay2026),
    gpFund: emp.gpFund ?? '',
    previouslyCollectedGpFund: str(emp.previouslyCollectedGpFund),
    gpfCollection: str(emp.gpfCollection),
    grossSalary: str(emp.grossSalary),
    grossSalaryWithTaxes: str(emp.grossSalaryWithTaxes),
    netPayable: str(emp.netPayable),
  });
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
    fatherName: parseOptionalString(derived.fatherName),
    address: parseOptionalString(derived.address),
    religion: parseOptionalString(derived.religion),
    disability: derived.disability || undefined,
    dateOfBirth: parseOptionalString(derived.dateOfBirth),
    mobile: (() => {
      const normalized = normalizeMobile(derived.mobile);
      return normalized ? normalized : undefined;
    })(),
    cnicNo: parseOptionalString(derived.cnicNo),
    email: derived.email.trim(),
    accountNumber: parseOptionalString(derived.accountNumber),
    nomineeName: parseOptionalString(derived.nomineeName),
    nomineeRelation: parseOptionalString(derived.nomineeRelation),
    gpfAccountNumber: parseOptionalString(derived.gpfAccountNumber),
    designation: derived.designation.trim(),
    basicPayScale: parseOptionalString(derived.basicPayScale),
    dateOfJoining: derived.dateOfJoining,
    contractExpiryDate: parseOptionalString(derived.contractExpiryDate),
    employmentType: derived.employmentType || undefined,
    employeeType: derived.employeeType || undefined,
    dateOfRegularization: parseOptionalString(derived.dateOfRegularization),
    dateOfRetirement: parseOptionalString(derived.dateOfRetirement),
    lengthOfService: parseOptionalString(derived.lengthOfService),
    status: derived.status,
    stage: parseOptionalString(derived.stage),
    timePeriod: parseOptionalString(derived.timePeriod),
    gpFund: parseOptionalString(derived.gpFund),
  };

  for (const key of NUMERIC_FORM_FIELDS) {
    payload[key] = parseOptionalNumber(derived[key]);
  }

  return payload;
}
