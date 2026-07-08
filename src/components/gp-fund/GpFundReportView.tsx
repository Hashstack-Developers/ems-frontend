import type { GpFundReport } from '@/types';
import { SALARY_SLIP_LOGO_PATHS } from '@/constants/salary-slip';
import { formatSlipAmount } from '@/lib/format';

interface GpFundReportViewProps {
  report: GpFundReport;
}

export function GpFundReportView({ report }: GpFundReportViewProps) {
  return (
    <div className="wcla-salary-slip gpf-slip" id="gp-fund-report-print">
      <div className="wcla-slip-header">
        <img
          src={SALARY_SLIP_LOGO_PATHS.left}
          alt="Government of the Punjab"
          className="wcla-slip-logo-img"
        />
        <div className="wcla-slip-header-text">
          <h1>{report.organization.title}</h1>
          <p>{report.organization.subtitle}</p>
          <h2>{report.organization.documentTitle}</h2>
        </div>
        <img
          src={SALARY_SLIP_LOGO_PATHS.right}
          alt="Walled City of Lahore Authority"
          className="wcla-slip-logo-img"
        />
      </div>

      <div className="wcla-slip-employee-grid">
        {report.employeeInfoFields.map((field) => (
          <div key={field.label} className="wcla-slip-field">
            <span className="wcla-slip-field-label">{field.label}</span>
            <span className="wcla-slip-field-value">{field.value}</span>
          </div>
        ))}
      </div>

      <table className="wcla-slip-pay-table gpf-slip-table mt-3 w-full border-collapse text-[10px]">
        <thead>
          <tr>
            <th className="wcla-slip-th w-[5%] text-center">Sr. No.</th>
            <th className="wcla-slip-th w-[11%] text-right">Subscription of GP Fund per Month</th>
            <th className="wcla-slip-th w-[12%]">Tenure</th>
            <th className="wcla-slip-th w-[10%] text-right">Closing Balance</th>
            <th className="wcla-slip-th w-[10%] text-right">Yearly Collection</th>
            <th className="wcla-slip-th w-[10%] text-right">Accumulated Amount</th>
            <th className="wcla-slip-th w-[10%] text-right">Mark-Up Rate</th>
            <th className="wcla-slip-th w-[10%] text-right">Mark-up Amount</th>
            <th className="wcla-slip-th w-[22%] text-right">Total Balance (Inclusive Mark-UP)</th>
          </tr>
        </thead>
        <tbody>
          {report.fundTableRows.length === 0 ? (
            <tr>
              <td colSpan={9} className="wcla-slip-td text-center text-muted">
                No contributions in selected period
              </td>
            </tr>
          ) : (
            report.fundTableRows.map((row) => (
              <tr key={row.srNo}>
                <td className="wcla-slip-td text-center">{row.srNo}</td>
                <td className="wcla-slip-td text-right">{formatSlipAmount(row.subscriptionPerMonth)}</td>
                <td className="wcla-slip-td">{row.tenure}</td>
                <td className="wcla-slip-td text-right">{formatSlipAmount(row.closingBalance)}</td>
                <td className="wcla-slip-td text-right">{formatSlipAmount(row.yearlyCollection)}</td>
                <td className="wcla-slip-td text-right">{formatSlipAmount(row.currentBalance)}</td>
                <td className="wcla-slip-td text-right">{row.collectionRate}</td>
                <td className="wcla-slip-td text-right">{formatSlipAmount(row.markupAmount)}</td>
                <td className="wcla-slip-td text-right">{formatSlipAmount(row.totalBalanceInclusiveMarkup)}</td>
              </tr>
            ))
          )}
          <tr className="font-bold">
            <td className="wcla-slip-td" colSpan={2}>Loans and Advance</td>
            <td className="wcla-slip-td" colSpan={2}>Total Payable: {formatSlipAmount(report.loanRecovery.totalPayable)}</td>
            <td className="wcla-slip-td" colSpan={2}>
              Recovered till: {report.loanRecovery.recoveredTill > 0 ? formatSlipAmount(report.loanRecovery.recoveredTill) : ''}
            </td>
            <td className="wcla-slip-td" colSpan={3}>
              Balance Payable: {report.loanRecovery.balancePayable > 0 ? formatSlipAmount(report.loanRecovery.balancePayable) : ''}
            </td>
          </tr>
          <tr className="font-bold">
            <td className="wcla-slip-td" colSpan={7}>Total GPF Balance</td>
            <td className="wcla-slip-td text-right" colSpan={2}>{formatSlipAmount(report.totalGpfBalance)}</td>
          </tr>
        </tbody>
      </table>

      <div className="wcla-slip-notes mt-4">
        <p className="font-bold">NOTE:</p>
        <ul className="mt-1 list-disc pl-5">
          {report.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
