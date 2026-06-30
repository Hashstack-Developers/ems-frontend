import { getToken } from './auth';

export interface GpFundReportFilters {
  years?: number[];
  months?: number[];
}

export interface GpFundReportZipDownloadPayload extends GpFundReportFilters {
  employeeIds?: number[];
  stage?: string;
}

export interface GpFundReportZipDownloadSummary {
  added: number;
  failed: number;
  messages?: string[];
}

function buildQueryString(filters: GpFundReportFilters): string {
  const params = new URLSearchParams();
  if (filters.years?.length) params.set('years', filters.years.join(','));
  if (filters.months?.length) params.set('months', filters.months.join(','));
  const query = params.toString();
  return query ? `?${query}` : '';
}

function parseDownloadSummary(header: string | null): GpFundReportZipDownloadSummary | null {
  if (!header) return null;
  try {
    return JSON.parse(header) as GpFundReportZipDownloadSummary;
  } catch {
    return null;
  }
}

export async function downloadGpFundReportsZip(
  payload: GpFundReportZipDownloadPayload,
): Promise<GpFundReportZipDownloadSummary | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const response = await fetch(`${baseUrl}/gp-fund/reports/download/zip`, {
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
  const yearToken = payload.years?.length === 1 ? String(payload.years[0]) : 'all-years';
  const filename =
    disposition?.match(/filename="(.+)"/)?.[1] ??
    `gp-fund-reports-${yearToken}.zip`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);

  return parseDownloadSummary(response.headers.get('X-Download-Summary'));
}

export async function downloadGpFundReportPdf(
  employeeId: number,
  filters: GpFundReportFilters = {},
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const response = await fetch(
    `${baseUrl}/gp-fund/reports/${employeeId}/pdf${buildQueryString(filters)}`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );

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
    disposition?.match(/filename="(.+)"/)?.[1] ?? `gp-fund-report-${employeeId}.pdf`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
