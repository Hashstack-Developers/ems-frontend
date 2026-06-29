'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CnicInput } from '@/components/ui/CnicInput';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import {
  WIZARD_STEPS,
  validateStep,
  previewEmployeeCode,
  type EmployeeFormValues,
  type StepErrors,
  type WizardStepId,
} from './employee-form';
import type { ApiResponse, GpFundAdvance, GpFundScale } from '@/types';

interface EmployeeWizardProps {
  form: EmployeeFormValues;
  employeeId?: number;
  employeeCode?: string;
  isEditing: boolean;
  isViewing?: boolean;
  saving: boolean;
  isDirty: boolean;
  onUpdate: (patch: Partial<EmployeeFormValues>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function StepIndicator({ currentStep }: { currentStep: WizardStepId }) {
  return (
    <nav aria-label="Form progress" className="mb-4 shrink-0">
      <ol className="flex flex-wrap gap-1 sm:gap-2">
        {WIZARD_STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;
          return (
            <li
              key={step.id}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                isActive
                  ? 'bg-primary text-white'
                  : isComplete
                    ? 'bg-primary-soft text-primary'
                    : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold sm:h-6 sm:w-6 sm:text-xs">
                {step.id}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-sm font-medium text-neutral-700 sm:hidden">
        Step {currentStep}: {WIZARD_STEPS[currentStep - 1].title}
      </p>
    </nav>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

export function EmployeeWizard({
  form,
  employeeId,
  employeeCode,
  isEditing,
  isViewing = false,
  saving,
  isDirty,
  onUpdate,
  onSubmit,
  onCancel,
}: EmployeeWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [canCreate, setCanCreate] = useState(false);
  const [gpFundScaleOptions, setGpFundScaleOptions] = useState<Array<{ value: string; label: string }>>([
    { value: '', label: 'Select scale' },
  ]);
  const [gpFundAdvance, setGpFundAdvance] = useState<GpFundAdvance | null>(null);
  const readOnly = isViewing;

  useEffect(() => {
    if (currentStep !== 6) {
      setCanCreate(false);
      return;
    }
    setCanCreate(false);
    const timer = window.setTimeout(() => setCanCreate(true), 200);
    return () => window.clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    let ignore = false;

    const loadGpFundScales = async () => {
      try {
        const { data } = await api.get<ApiResponse<GpFundScale[]>>('/gp-fund/scales');
        if (ignore) return;
        setGpFundScaleOptions([
          { value: '', label: 'Select scale' },
          ...data.data.map((scale) => ({
            value: scale.code,
            label: scale.code,
          })),
        ]);
      } catch {
        if (!ignore) {
          setGpFundScaleOptions([{ value: '', label: 'Select scale' }]);
        }
      }
    };

    loadGpFundScales();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!employeeId || currentStep !== 5) {
      setGpFundAdvance(null);
      return;
    }

    let ignore = false;

    const loadGpFundAdvance = async () => {
      try {
        const { data } = await api.get<ApiResponse<GpFundAdvance | null>>(
          `/gp-fund/advances/employee/${employeeId}/active`,
        );
        if (!ignore) setGpFundAdvance(data.data);
      } catch {
        if (!ignore) setGpFundAdvance(null);
      }
    };

    loadGpFundAdvance();
    return () => {
      ignore = true;
    };
  }, [employeeId, currentStep]);

  const goNext = () => {
    if (!isViewing) {
      const stepErrors = validateStep(currentStep, form, { isEditing });
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, 6) as WizardStepId);
  };

  const goPrev = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1) as WizardStepId);
  };

  const handleCreate = () => {
    if (currentStep !== 6 || !canCreate || isViewing) return;

    const stepErrors = validateStep(currentStep, form, { isEditing });
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    onSubmit();
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (isViewing || e.key !== 'Enter') return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA') return;

    e.preventDefault();
    if (currentStep < 6) {
      goNext();
    }
  };

  const num = (key: keyof EmployeeFormValues) => ({
    type: 'number' as const,
    min: '0',
    step: '0.01',
    value: form[key] as string,
    onChange: readOnly ? undefined : (e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ [key]: e.target.value }),
    error: errors[key],
    readOnly,
    disabled: readOnly,
  });

  const text = (
    key: keyof EmployeeFormValues,
    props?: Partial<React.ComponentProps<typeof Input>>,
  ) => ({
    value: form[key] as string,
    onChange: readOnly ? undefined : (e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ [key]: e.target.value }),
    error: errors[key],
    readOnly,
    disabled: readOnly,
    ...props,
  });

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      onKeyDown={handleFormKeyDown}
      className="flex min-h-0 flex-1 flex-col"
    >
      <StepIndicator currentStep={currentStep} />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      {currentStep === 1 && (
        <FormGrid>
          {isEditing && form.srNo ? (
            <Input label="Sr No" value={form.srNo} readOnly disabled />
          ) : (
            <Input label="Sr No" value="Auto-generated on save" readOnly disabled />
          )}
          {(isEditing || isViewing) && employeeCode && (
            <Input label="Employee ID" value={employeeCode} readOnly disabled />
          )}
          {!isEditing && !isViewing && (
            <Input label="Employee ID" value={previewEmployeeCode(form.cnicNo)} readOnly disabled />
          )}
          <Input label="Name" {...text('name')} required={!readOnly} />
          <Input label="Father Name" {...text('fatherName')} />
          <Input label="Religion" {...text('religion')} />
          <Select
            label="Disability"
            value={form.disability}
            onChange={(e) => onUpdate({ disability: e.target.value as EmployeeFormValues['disability'] })}
            disabled={readOnly}
            options={[
              { value: '', label: 'Select' },
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ]}
          />
          <Input label="DOB" type="date" {...text('dateOfBirth')} />
          <Input label="Mobile" {...text('mobile')} placeholder="03XXXXXXXXX" />
          <div className="col-span-full sm:col-span-1">
            <CnicInput
              label="CNIC No"
              value={form.cnicNo}
              onChange={(value) => onUpdate({ cnicNo: value })}
              error={errors.cnicNo}
              disabled={readOnly}
            />
          </div>
          <Input label="E-Mail" type="email" {...text('email')} required={!readOnly} />
          <Input label="Account Number" {...text('accountNumber')} />
          <div className="col-span-full space-y-1">
            <label htmlFor="address" className="block text-sm font-medium text-neutral-700">
              Address
            </label>
            <textarea
              id="address"
              rows={3}
              value={form.address}
              onChange={readOnly ? undefined : (e) => onUpdate({ address: e.target.value })}
              readOnly={readOnly}
              disabled={readOnly}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Residential address"
            />
          </div>
        </FormGrid>
      )}

      {currentStep === 2 && (
        <FormGrid>
          <Input label="Designation" {...text('designation')} required={!readOnly} />
          <Input label="Basic Pay Scale" {...text('basicPayScale')} />
          <Input label="Date Of Joining" type="date" {...text('dateOfJoining')} required={!readOnly} />
          <Select
            label="Employment Type (Contract / Regular)"
            value={form.employmentType}
            onChange={(e) => onUpdate({ employmentType: e.target.value as EmployeeFormValues['employmentType'] })}
            disabled={readOnly}
            options={[
              { value: '', label: 'Select type' },
              { value: 'contract', label: 'Contract' },
              { value: 'regular', label: 'Regular' },
            ]}
          />
          {form.employmentType === 'contract' && (
            <Input label="Contract Expiry Date" type="date" {...text('contractExpiryDate')} />
          )}
          {form.employmentType === 'regular' && (
            <Input label="Date of Regularization" type="date" {...text('dateOfRegularization')} />
          )}
          <Input label="Date Of Retirement/Superannuation (Age 60)" type="date" value={form.dateOfRetirement} readOnly disabled />
          <Input label="Length Of Service" value={form.lengthOfService} readOnly disabled />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => onUpdate({ status: e.target.value as 'active' | 'inactive' })}
            disabled={readOnly}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </FormGrid>
      )}

      {currentStep === 3 && (
        <FormGrid>
          <Input label="Basic Pay 01-12-2025" {...num('basicPayDec2025')} />
          <Input label="Basic Pay 01-07-2026" {...num('basicPayJul2026')} />
          <Input label="Personal Allowance" {...num('personalAllowance')} />
          <Input label="H.R" {...num('hr')} />
          <Input label="C.A" {...num('ca')} />
          <Input label="M.A" {...num('ma')} />
          <Input label="Ad-hoc Allowance 2022 (15%)" {...num('adHocAllowance2022')} />
          <Input label="Ad-hoc Allowance 2023 (30% & 35%)" {...num('adHocAllowance2023')} />
          <Input label="Ad-hoc Allowance 2024 (20% & 25%)" {...num('adHocAllowance2024')} />
          <Input label="Ad-hoc Allowance 2025 (10%)" {...num('adHocAllowance2025')} />
          <Input label="Ad-hoc Allowance 2026 (07%)" {...num('adHocAllowance2026')} />
          <Input label="Overtime Allowance" {...num('overtimeAllowance')} />
          <Input label="Integrated Allowance" {...num('integratedAllowance')} />
          <Input label="Washing Allowance" {...num('wa')} />
          <Input label="Computer Allowance" {...num('computerAllowance')} />
          <Input label="Special Allowance" {...num('specialAllowance')} />
          <Input label="Social Security Benefit" {...num('socialSecurityBenefit')} />
          <Input label="Special Pay" {...num('specialPay')} />
          <Input label="M-Phil / PhD Special Allowance" {...num('mphilSpecialAllowance')} />
          <Input label="Personal Pay" {...num('personalPay')} />
        </FormGrid>
      )}

      {currentStep === 4 && (
        <FormGrid>
          <Input label="Basic pay scale" {...text('stage')} />
          <div>
            <Input
              label="Time Period (Payable Days)"
              type="number"
              min="1"
              max="30"
              value={form.timePeriod}
              onChange={readOnly ? undefined : (e) => onUpdate({ timePeriod: e.target.value })}
              placeholder="30 for full month"
              error={errors.timePeriod}
              readOnly={readOnly}
              disabled={readOnly}
            />
            <p className="mt-1 text-xs text-muted">
              Number of salary days for payroll (e.g. 27 pays 27/30 of monthly gross). Leave empty for a full 30-day month.
            </p>
          </div>
          <div>
            <Input
              label="Increment"
              value={form.increment || '—'}
              readOnly
              disabled
            />
            <p className="mt-1 text-xs text-muted">
              Auto-calculated in Salary Structure (Step 3) as: Basic Pay 01-07-2026 minus Basic Pay 01-12-2025.
            </p>
          </div>
        </FormGrid>
      )}

      {currentStep === 5 && (
        <FormGrid>
          <Input label="Loan / Advance" {...num('loanAdvance')} />
          <Input label="Deduction (If Any)" {...num('deduction')} />
          <Input label="Arrears (If Any)" {...num('arrears')} />
          <Input label="Deduct: Income Tax (May, 2026)" {...num('incomeTaxMay2026')} />
          <Input label="Previous Deduction" {...num('previousDeduction')} />
          <Input label="Total Deducted Income Tax 2025-26" {...num('totalDeductedIncomeTax202526')} />
          <Input label="Annual Income Tax 2025-26" {...num('annualIncomeTax202526')} />
          <Select
            label="GP fund scale"
            value={form.gpFund}
            onChange={(e) => onUpdate({ gpFund: e.target.value })}
            disabled={readOnly}
            options={gpFundScaleOptions}
          />
          {(isEditing || isViewing) && employeeId && (
            <div className="col-span-full rounded-xl border border-border bg-neutral-50 p-4 sm:col-span-2">
              <p className="text-sm font-medium text-neutral-800">GP Fund Advance</p>
              {gpFundAdvance ? (
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <p><span className="text-muted">Status:</span> <span className="capitalize">{gpFundAdvance.status}</span></p>
                  <p><span className="text-muted">Advance:</span> {formatCurrency(gpFundAdvance.advanceAmount)}</p>
                  <p><span className="text-muted">Monthly installment:</span> {formatCurrency(gpFundAdvance.monthlyInstallment)}</p>
                  <p><span className="text-muted">Repaid:</span> {formatCurrency(gpFundAdvance.amountRepaid)}</p>
                  <p><span className="text-muted">Remaining:</span> {formatCurrency(gpFundAdvance.remainingBalance)}</p>
                  <p><span className="text-muted">Progress:</span> {gpFundAdvance.installmentsPaid}/{gpFundAdvance.installmentMonths} months</p>
                  <p className="sm:col-span-2 text-xs text-muted">
                    Assign or manage advances from GP Fund → GP Advances. Regular GP fund still deducts each payroll month.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">No active GP Fund advance for this employee.</p>
              )}
            </div>
          )}
          <Input label="Previously Collected GP Fund" {...num('previouslyCollectedGpFund')} />
          <Input label="GPF Collection" {...num('gpfCollection')} />
        </FormGrid>
      )}

      {currentStep === 6 && (
        <FormGrid>
          <Input label="Gross Salary" {...num('grossSalary')} required={!readOnly} />
          <Input label="Gross Salary with Taxes" {...num('grossSalaryWithTaxes')} required={!readOnly} />
          <Input label="Net Payable" {...num('netPayable')} required={!readOnly} />
        </FormGrid>
      )}
      </div>

      <div className="mt-4 flex shrink-0 flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {isViewing ? 'Close' : 'Cancel'}
        </Button>
        <div className="flex min-w-[9rem] justify-end gap-2">
          {currentStep > 1 && (
            <Button type="button" variant="secondary" onClick={goPrev}>
              Previous
            </Button>
          )}
          {currentStep < 6 ? (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          ) : (
            !isViewing && (
              <Button
                type="button"
                loading={saving}
                disabled={!canCreate || (isEditing && !isDirty)}
                onClick={handleCreate}
              >
                {isEditing ? 'Update Employee' : 'Create Employee'}
              </Button>
            )
          )}
        </div>
      </div>
    </form>
  );
}
