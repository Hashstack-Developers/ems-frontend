export const GP_FUND_DEDUCTION_CODE = 'GP_FUND';
export const GP_FUND_MONTHLY_MARKUP_CODE = 'GP_FUND_MONTHLY_MARKUP';
export const GP_FUND_ANNUAL_MARKUP_CODE = 'GP_FUND_ANNUAL_MARKUP';
export const GP_FUND_ADVANCE_CODE = 'GP_FUND_ADVANCE';
export const GP_FUND_ADVANCE_MAX_MONTHS = 36;

export const GP_FUND_DEDUCTION_CODES = [
  GP_FUND_DEDUCTION_CODE,
  GP_FUND_MONTHLY_MARKUP_CODE,
  GP_FUND_ANNUAL_MARKUP_CODE,
  GP_FUND_ADVANCE_CODE,
] as const;

export function isGpFundDeductionCode(code: string): boolean {
  return (GP_FUND_DEDUCTION_CODES as readonly string[]).includes(code);
}

export interface GpFundDeductionBreakdown {
  baseAmount: number;
  monthlyMarkupAmount: number;
  annualMarkupAmount: number;
  advanceInstallmentAmount: number;
  totalAmount: number;
}

export function getGpFundBreakdownFromPayroll(
  deductions: Array<{ code: string; amount: number }> | undefined,
): GpFundDeductionBreakdown {
  const baseAmount = Number(
    deductions?.find((d) => d.code === GP_FUND_DEDUCTION_CODE)?.amount ?? 0,
  );
  const monthlyMarkupAmount = Number(
    deductions?.find((d) => d.code === GP_FUND_MONTHLY_MARKUP_CODE)?.amount ?? 0,
  );
  const annualMarkupAmount = Number(
    deductions?.find((d) => d.code === GP_FUND_ANNUAL_MARKUP_CODE)?.amount ?? 0,
  );
  const advanceInstallmentAmount = Number(
    deductions?.find((d) => d.code === GP_FUND_ADVANCE_CODE)?.amount ?? 0,
  );

  return {
    baseAmount,
    monthlyMarkupAmount,
    annualMarkupAmount,
    advanceInstallmentAmount,
    totalAmount: baseAmount + monthlyMarkupAmount + annualMarkupAmount + advanceInstallmentAmount,
  };
}
