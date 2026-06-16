'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  WIZARD_STEPS,
  validateStep,
  type EmployeeFormValues,
  type StepErrors,
  type WizardStepId,
} from './employee-form';

interface EmployeeWizardProps {
  form: EmployeeFormValues;
  employeeCode?: string;
  isEditing: boolean;
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
  employeeCode,
  isEditing,
  saving,
  isDirty,
  onUpdate,
  onSubmit,
  onCancel,
}: EmployeeWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    if (currentStep !== 6) {
      setCanCreate(false);
      return;
    }
    setCanCreate(false);
    const timer = window.setTimeout(() => setCanCreate(true), 200);
    return () => window.clearTimeout(timer);
  }, [currentStep]);

  const goNext = () => {
    const stepErrors = validateStep(currentStep, form, { isEditing });
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, 6) as WizardStepId);
  };

  const goPrev = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1) as WizardStepId);
  };

  const handleCreate = () => {
    if (currentStep !== 6 || !canCreate) return;

    const stepErrors = validateStep(currentStep, form, { isEditing });
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    onSubmit();
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return;
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
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ [key]: e.target.value }),
    error: errors[key],
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
          <Input label="Sr No" value={form.srNo} onChange={(e) => onUpdate({ srNo: e.target.value })} error={errors.srNo} />
          {isEditing && employeeCode && (
            <Input label="Employee ID" value={employeeCode} readOnly disabled />
          )}
          {!isEditing && (
            <Input label="Employee ID" value="Auto-generated on save" readOnly disabled />
          )}
          <Input label="Name" value={form.name} onChange={(e) => onUpdate({ name: e.target.value })} required error={errors.name} />
          <Input label="Father Name" value={form.fatherName} onChange={(e) => onUpdate({ fatherName: e.target.value })} error={errors.fatherName} />
          <Input label="Religion" value={form.religion} onChange={(e) => onUpdate({ religion: e.target.value })} />
          <Input label="DOB" type="date" value={form.dateOfBirth} onChange={(e) => onUpdate({ dateOfBirth: e.target.value })} />
          <Input label="Mobile" value={form.mobile} onChange={(e) => onUpdate({ mobile: e.target.value })} placeholder="03XXXXXXXXX" error={errors.mobile} />
          <Input label="CNIC No" value={form.cnicNo} onChange={(e) => onUpdate({ cnicNo: e.target.value })} placeholder="XXXXX-XXXXXXX-X" error={errors.cnicNo} />
          <Input label="E-Mail" type="email" value={form.email} onChange={(e) => onUpdate({ email: e.target.value })} required error={errors.email} />
          <Input label="Account Number" value={form.accountNumber} onChange={(e) => onUpdate({ accountNumber: e.target.value })} error={errors.accountNumber} />
        </FormGrid>
      )}

      {currentStep === 2 && (
        <FormGrid>
          <Input label="Designation" value={form.designation} onChange={(e) => onUpdate({ designation: e.target.value })} required error={errors.designation} />
          <Input label="Basic Pay Scale" value={form.basicPayScale} onChange={(e) => onUpdate({ basicPayScale: e.target.value })} />
          <Input label="Date Of Joining" type="date" value={form.dateOfJoining} onChange={(e) => onUpdate({ dateOfJoining: e.target.value })} required error={errors.dateOfJoining} />
          <Select
            label="Employment Type (Contract / Regular)"
            value={form.employmentType}
            onChange={(e) => onUpdate({ employmentType: e.target.value as EmployeeFormValues['employmentType'] })}
            options={[
              { value: '', label: 'Select type' },
              { value: 'contract', label: 'Contract' },
              { value: 'regular', label: 'Regular' },
            ]}
          />
          {form.employmentType === 'contract' && (
            <Input label="Contract Expiry Date" type="date" value={form.contractExpiryDate} onChange={(e) => onUpdate({ contractExpiryDate: e.target.value })} error={errors.contractExpiryDate} />
          )}
          {form.employmentType === 'regular' && (
            <Input label="Date of Regularization" type="date" value={form.dateOfRegularization} onChange={(e) => onUpdate({ dateOfRegularization: e.target.value })} error={errors.dateOfRegularization} />
          )}
          <Input label="Date Of Retirement (Age 60)" type="date" value={form.dateOfRetirement} readOnly disabled />
          <Input label="Length Of Service" value={form.lengthOfService} readOnly disabled />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => onUpdate({ status: e.target.value as 'active' | 'inactive' })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </FormGrid>
      )}

      {currentStep === 3 && (
        <FormGrid>
          <Input label="Stage" value={form.stage} onChange={(e) => onUpdate({ stage: e.target.value })} />
          <Input label="Salary Till" type="date" value={form.salaryTill} onChange={(e) => onUpdate({ salaryTill: e.target.value })} />
          <Input label="Time Period" value={form.timePeriod} readOnly disabled />
          <Input
            label="Increment"
            value={form.increment || '—'}
            readOnly
            disabled
          />
          <p className="col-span-full text-xs text-muted">
            Increment is auto-calculated in Salary Structure (Step 4) as: Basic Pay 01-07-2026 minus Basic Pay 01-12-2025.
          </p>
        </FormGrid>
      )}

      {currentStep === 4 && (
        <FormGrid>
          <Input label="Basic Pay 01-12-2025" {...num('basicPayDec2025')} />
          <Input label="Basic Pay 01-07-2026" {...num('basicPayJul2026')} />
          <Input
            label="Increment (Jul 2026 − Dec 2025)"
            value={form.increment || '—'}
            readOnly
            disabled
          />
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
          <Input label="Special Allowance" {...num('specialAllowance')} />
          <Input label="Social Security Benefit" {...num('socialSecurityBenefit')} />
          <Input label="Special Pay" {...num('specialPay')} />
          <Input label="M-Phil / PhD Special Allowance" {...num('mphilSpecialAllowance')} />
          <Input label="Personal Pay" {...num('personalPay')} />
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
          <Input label="GP Fund" {...num('gpFund')} />
          <Input label="Previously Collected GP Fund" {...num('previouslyCollectedGpFund')} />
          <Input label="GPF Collection" {...num('gpfCollection')} />
        </FormGrid>
      )}

      {currentStep === 6 && (
        <FormGrid>
          <Input label="Gross Salary" {...num('grossSalary')} required />
          <Input label="Gross Salary with Taxes" {...num('grossSalaryWithTaxes')} required />
          <Input label="Net Payable" {...num('netPayable')} required />
        </FormGrid>
      )}
      </div>

      <div className="mt-4 flex shrink-0 flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
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
            <Button
              type="button"
              loading={saving}
              disabled={!canCreate || (isEditing && !isDirty)}
              onClick={handleCreate}
            >
              {isEditing ? 'Update Employee' : 'Create Employee'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
