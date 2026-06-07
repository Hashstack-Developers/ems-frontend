export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDeductionRate(d: {
  calculationType?: 'percentage' | 'fixed' | null;
  appliedRate?: number | null;
  appliedFixedAmount?: number | null;
}): string {
  if (d.calculationType === 'percentage' && d.appliedRate != null) {
    return `${Number(d.appliedRate)}%`;
  }
  if (d.calculationType === 'fixed' && d.appliedFixedAmount != null) {
    return formatCurrency(Number(d.appliedFixedAmount));
  }
  return '';
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
