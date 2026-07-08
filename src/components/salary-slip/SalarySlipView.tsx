import type { SalarySlip, SalarySlipLineItem, SalarySlipRecoverySection } from '@/types';
import { SALARY_SLIP_LOGO_PATHS } from '@/constants/salary-slip';
import { formatSlipAmount } from '@/lib/format';

function padRows(
  allowances: SalarySlipLineItem[],
  deductions: SalarySlipLineItem[],
): Array<{ allowance?: SalarySlipLineItem; deduction?: SalarySlipLineItem }> {
  const count = Math.max(allowances.length, deductions.length);
  if (count === 0) return [{ allowance: undefined, deduction: undefined }];
  return Array.from({ length: count }, (_, index) => ({
    allowance: allowances[index],
    deduction: deductions[index],
  }));
}

function formatDeductionAmount(item: SalarySlipLineItem | undefined): string {
  if (!item) return '';
  if (item.label === 'Other' && item.amount <= 0) return '';
  return formatSlipAmount(item.amount);
}

function RecoveryTable({ section }: { section: SalarySlipRecoverySection }) {
  return (
    <table className="wcla-slip-table mt-2 w-full border-collapse text-xs">
      <thead>
        <tr>
          <th colSpan={3} className="wcla-slip-th text-left font-bold">
            {section.title}
          </th>
        </tr>
        <tr>
          <th className="wcla-slip-th">Payable</th>
          <th className="wcla-slip-th">Recovered till</th>
          <th className="wcla-slip-th">Recoverable</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="wcla-slip-td text-center">{formatSlipAmount(section.payable)}</td>
          <td className="wcla-slip-td text-center">{formatSlipAmount(section.recoveredTill)}</td>
          <td className="wcla-slip-td text-center">{formatSlipAmount(section.recoverable)}</td>
        </tr>
      </tbody>
    </table>
  );
}

interface SalarySlipViewProps {
  slip: SalarySlip;
}

export function SalarySlipView({ slip }: SalarySlipViewProps) {
  const rows = padRows(slip.allowances, slip.deductions);
  const employeeFields = slip.employeeInfoFields ?? [];

  return (
    <div className="wcla-salary-slip" id="salary-slip-print">
      <div className="wcla-slip-header">
        <img
          src={SALARY_SLIP_LOGO_PATHS.left}
          alt="Government of the Punjab"
          className="wcla-slip-logo-img"
        />
        <div className="wcla-slip-header-text">
          <h1>{slip.organization.title}</h1>
          <p>{slip.organization.subtitle}</p>
          <h2>{slip.organization.documentTitle}</h2>
        </div>
        <img
          src={SALARY_SLIP_LOGO_PATHS.right}
          alt="Walled City of Lahore Authority"
          className="wcla-slip-logo-img"
        />
      </div>

      <div className="wcla-slip-meta">
        <span>Dated: {slip.dated}</span>
        <span>For the Month of {slip.period.year}: {slip.period.label.split(' ')[0]}</span>
      </div>

      <div className="wcla-slip-employee-grid">
        {employeeFields.map((field) => (
          <div key={field.label} className="wcla-slip-field">
            <span className="wcla-slip-field-label">{field.label}</span>
            <span className="wcla-slip-field-value">{field.value}</span>
          </div>
        ))}
      </div>

      <table className="wcla-slip-pay-table mt-3 w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="wcla-slip-th wcla-slip-col-label">Pay &amp; Allowances</th>
            <th className="wcla-slip-th wcla-slip-col-amount text-right">Amount (Rs.)</th>
            <th className="wcla-slip-th wcla-slip-col-label">Deductions</th>
            <th className="wcla-slip-th wcla-slip-col-amount text-right">Amounts (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="wcla-slip-td wcla-slip-col-label">{row.allowance?.label ?? ''}</td>
              <td className="wcla-slip-td wcla-slip-col-amount text-right">
                {row.allowance ? formatSlipAmount(row.allowance.amount) : ''}
              </td>
              <td className="wcla-slip-td wcla-slip-col-label">{row.deduction?.label ?? ''}</td>
              <td className="wcla-slip-td wcla-slip-col-amount text-right">
                {formatDeductionAmount(row.deduction)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {slip.loanRecovery && <RecoveryTable section={slip.loanRecovery} />}
      {slip.taxRecovery && <RecoveryTable section={slip.taxRecovery} />}

      <table className="wcla-slip-table mt-3 w-full border-collapse text-sm">
        <tbody>
          <tr className="font-bold">
            <td className="wcla-slip-td">Gross Salary: {formatSlipAmount(slip.summary.grossSalary)}</td>
            <td className="wcla-slip-td text-center">Deduction: {formatSlipAmount(slip.summary.totalDeductions)}</td>
            <td className="wcla-slip-td text-right">Net Pay: {formatSlipAmount(slip.summary.netSalary)}</td>
          </tr>
        </tbody>
      </table>

      {slip.earnings.salaryDays != null &&
        slip.earnings.basicSalary !== slip.earnings.grossSalary && (
          <p className="mt-2 text-xs text-neutral-600">
            Payable gross for {slip.earnings.salaryDays} day(s): {formatSlipAmount(slip.earnings.grossSalary)}
          </p>
      )}

      <div className="wcla-slip-notes mt-4">
        <p className="font-bold">NOTE</p>
        <ul className="mt-1 list-disc pl-5">
          {slip.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-center text-[10px] text-neutral-500">
        {slip.slipNumber} · Payroll #{slip.payrollId} · Generated {new Date(slip.generatedAt).toLocaleString('en-GB')}
      </p>
    </div>
  );
}
