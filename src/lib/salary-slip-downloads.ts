import { getToken } from './auth';

export interface SalarySlipZipDownloadPayload {
  month: number;
  year: number;
  payrollIds?: number[];
  department?: string;
}

export interface SalarySlipZipDownloadSummary {
  added: number;
  failed: number;
  messages?: string[];
}

function parseDownloadSummary(header: string | null): SalarySlipZipDownloadSummary | null {
  if (!header) {
    return null;
  }

  try {
    return JSON.parse(header) as SalarySlipZipDownloadSummary;
  } catch {
    return null;
  }
}

export async function downloadSalarySlipsZip(
  payload: SalarySlipZipDownloadPayload,
): Promise<SalarySlipZipDownloadSummary | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const response = await fetch(`${baseUrl}/salary-slips/download/zip`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    const message = Array.isArray(err?.message)
      ? err.message.join(', ')
      : err?.message ?? 'ZIP download failed';
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const filename =
    disposition?.match(/filename="(.+)"/)?.[1] ??
  `salary-slips-${payload.year}-${String(payload.month).padStart(2, '0')}.zip`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);

  return parseDownloadSummary(response.headers.get('X-Download-Summary'));
}

export async function downloadSalarySlipPdf(payrollId: number): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const response = await fetch(`${baseUrl}/salary-slips/${payrollId}/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    const message = Array.isArray(err?.message)
      ? err.message.join(', ')
      : err?.message ?? 'PDF download failed';
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const filename =
    disposition?.match(/filename="(.+)"/)?.[1] ?? `salary-slip-${payrollId}.pdf`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
