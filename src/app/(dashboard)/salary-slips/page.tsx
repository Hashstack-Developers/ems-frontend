'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { MONTHS } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { SalarySlipView } from '@/components/salary-slip/SalarySlipView';
import {
  DataTableCard,
  PageContainer,
  PageHeader,
  Th,
  Td,
} from '@/components/layout/PageShell';
import { StatBannerSkeleton, TableBodySkeleton } from '@/components/ui/Skeletons';
import type { ApiResponse, SalarySlip, SalarySlipAvailability } from '@/types';

export default function SalarySlipsPage() {
  const toast = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [availability, setAvailability] = useState<SalarySlipAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [generating, setGenerating] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [slipModal, setSlipModal] = useState(false);
  const [currentSlip, setCurrentSlip] = useState<SalarySlip | null>(null);

  const fetchAvailability = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<SalarySlipAvailability[]>>(
        '/salary-slips',
        { params: { month, year } },
      );
      setAvailability(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [month, year, toast]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const handleGenerateSlip = async (item: SalarySlipAvailability) => {
    if (!item.canGenerateSlip) return;
    setGenerating(item.employeeId);
    try {
      const { data } = await api.post<ApiResponse<SalarySlip>>(
        '/salary-slips/generate',
        { month, year, employeeId: item.employeeId },
      );
      setCurrentSlip(data.data);
      setSlipModal(true);
      toast.success('Salary slip generated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadPdf = async (payrollId: number) => {
    setDownloading(payrollId);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
      const response = await fetch(
        `${baseUrl}/salary-slips/${payrollId}/pdf`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(Array.isArray(err.message) ? err.message.join(', ') : err.message);
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      const filename = disposition?.match(/filename="(.+)"/)?.[1] ?? `salary-slip-${payrollId}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF download failed');
    } finally {
      setDownloading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const eligibleCount = availability.filter((a) => a.canGenerateSlip).length;

  return (
    <PageContainer fill>
      <PageHeader
        title="Salary Slips"
        subtitle="Generated from processed payroll records — single source of truth"
        onRefetch={() => fetchAvailability({ refetch: true })}
        refetching={refetching}
        actions={
          <>
            <Select
              label="Month"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
            />
            <Select
              label="Year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              options={[year - 1, year, year + 1].map((y) => ({ value: y, label: String(y) }))}
            />
            <div className="pb-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Available slips</p>
              <p className="text-xl font-bold text-primary-dark">{eligibleCount} / {availability.length}</p>
            </div>
          </>
        }
      />

      <DataTableCard
        header={
          <>
            <Th className="min-w-[180px]">Employee</Th>
            <Th className="min-w-[140px]">Department</Th>
            <Th className="w-[120px]">Payroll Status</Th>
            <Th className="min-w-[200px]">Slip Status</Th>
            <Th className="w-[200px]">Actions</Th>
          </>
        }
      >
        {loading || refetching ? (
          <TableBodySkeleton rows={8} cols={5} />
        ) : availability.length === 0 ? (
          <tr><td colSpan={5} className="py-8 text-center text-muted-light">No active employees found</td></tr>
        ) : (
          availability.map((item) => (
            <tr key={item.employeeId}>
              <Td>
                <p className="font-medium">{item.fullName}</p>
                <p className="font-mono text-xs text-muted-light">{item.employeeCode}</p>
              </Td>
              <Td>{item.department}</Td>
              <Td>
                {item.payrollStatus ? (
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-hover capitalize">
                    {item.payrollStatus}
                  </span>
                ) : (
                  <span className="text-xs text-muted-light">Not created</span>
                )}
              </Td>
              <Td>
                <span className={`text-xs ${item.canGenerateSlip ? 'text-success' : 'text-warning'}`}>
                  {item.message}
                </span>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!item.canGenerateSlip}
                    loading={generating === item.employeeId}
                    onClick={() => handleGenerateSlip(item)}
                  >
                    View Slip
                  </Button>
                  {item.payrollId && item.canGenerateSlip && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={downloading === item.payrollId}
                      onClick={() => handleDownloadPdf(item.payrollId!)}
                    >
                      PDF
                    </Button>
                  )}
                </div>
              </Td>
            </tr>
          ))
        )}
      </DataTableCard>

      {!loading && !refetching && eligibleCount === 0 && availability.length > 0 && (
        <div className="mt-4 shrink-0 rounded-xl border border-warning/30 bg-warning-light px-4 py-3 text-sm text-warning">
          No salary slips available for {MONTHS[month - 1]} {year}. Process payroll first from the Payrolls section.
        </div>
      )}

      <Modal
        open={slipModal}
        onClose={() => { setSlipModal(false); setCurrentSlip(null); }}
        title="Salary Slip"
      >
        {currentSlip && (
          <div>
            <SalarySlipView slip={currentSlip} />
            <div className="mt-4 flex justify-end gap-2 print:hidden">
              <Button variant="secondary" onClick={handlePrint}>Print</Button>
              <Button onClick={() => handleDownloadPdf(currentSlip.payrollId)} loading={downloading === currentSlip.payrollId}>
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
