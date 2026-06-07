import { formatCurrency, formatDeductionRate, formatDate } from '@/lib/format';
import type { SalarySlip } from '@/types';

interface SalarySlipViewProps {
  slip: SalarySlip;
}

export function SalarySlipView({ slip }: SalarySlipViewProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 print:border-0 print:shadow-none" id="salary-slip-print">
      <div className="border-b border-border pb-4 text-center">
        <h2 className="text-lg font-bold text-primary-hover">Employee Management System</h2>
        <p className="text-sm font-semibold text-neutral-800">Salary Slip</p>
        <p className="mt-1 font-mono text-xs text-muted">{slip.slipNumber}</p>
        <p className="text-sm text-neutral-600">{slip.period.label}</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase text-muted-light">Employee</p>
          <p className="font-semibold text-foreground">{slip.employee.fullName}</p>
          <p className="text-sm text-neutral-600">{slip.employee.employeeCode}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-light">Department</p>
          <p className="text-sm text-neutral-800">{slip.employee.department}</p>
          <p className="text-sm text-neutral-600">{slip.employee.designation}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-800">Earnings</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Gross Salary</span>
              <span className="font-medium">{formatCurrency(slip.earnings.grossSalary)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-800">Deductions</h3>
          {slip.deductions.length === 0 ? (
            <p className="text-sm text-muted-light">No deductions</p>
          ) : (
            <div className="space-y-1 text-sm">
              {slip.deductions.map((d) => {
                const rate = formatDeductionRate(d);
                return (
                  <div key={d.code} className="flex justify-between gap-2">
                    <span className="text-neutral-600">
                      {d.name}
                      {rate && <span className="text-muted-light"> ({rate})</span>}
                    </span>
                    <span className="font-medium text-danger">{formatCurrency(d.amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-neutral-50 p-4">
        {slip.summary.taxSlabName && (
          <p className="mb-2 text-xs text-muted">
            Tax Slab: {slip.summary.taxSlabName}
            {slip.summary.appliedTaxRate != null && ` @ ${slip.summary.appliedTaxRate}%`}
          </p>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Total Deductions</span>
          <span className="font-medium text-danger">{formatCurrency(slip.summary.totalDeductions)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2">
          <span className="font-semibold text-foreground">Net Salary</span>
          <span className="text-lg font-bold text-success">{formatCurrency(slip.summary.netSalary)}</span>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-light">
        Generated from payroll #{slip.payrollId} · {formatDate(slip.generatedAt)} · Status: {slip.status}
      </p>
    </div>
  );
}
