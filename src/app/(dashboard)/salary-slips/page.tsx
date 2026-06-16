'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { MONTHS } from '@/lib/format';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import {
  downloadSalarySlipPdf,
  downloadSalarySlipsZip,
} from '@/lib/salary-slip-downloads';
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
import { TableBodySkeleton } from '@/components/ui/Skeletons';
import type { ApiResponse, SalarySlip, SalarySlipAvailability } from '@/types';

export default function SalarySlipsPage() {
  const toast = useToast();
  const selectAllRef = useRef<HTMLInputElement>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [stageFilter, setStageFilter] = useState('');
  const [availability, setAvailability] = useState<SalarySlipAvailability[]>([]);
  const [selectedPayrollIds, setSelectedPayrollIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [generating, setGenerating] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState<'selected' | 'all' | null>(null);
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

  useEffect(() => {
    setSelectedPayrollIds(new Set());
  }, [month, year, stageFilter]);

  const stages = useMemo(
    () => Array.from(new Set(availability.map((item) => item.stage).filter(Boolean))).sort(),
    [availability],
  );

  const visibleRows = useMemo(() => {
    if (!stageFilter) {
      return availability;
    }
    return availability.filter((item) => item.stage === stageFilter);
  }, [availability, stageFilter]);

  const downloadableRows = useMemo(
    () => visibleRows.filter((item) => item.canGenerateSlip && item.payrollId),
    [visibleRows],
  );

  const downloadableIds = useMemo(
    () => downloadableRows.map((item) => item.payrollId!),
    [downloadableRows],
  );

  const selectedCount = useMemo(
    () => downloadableIds.filter((id) => selectedPayrollIds.has(id)).length,
    [downloadableIds, selectedPayrollIds],
  );

  const allSelected =
    downloadableIds.length > 0 &&
    downloadableIds.every((id) => selectedPayrollIds.has(id));
  const someSelected = downloadableIds.some((id) => selectedPayrollIds.has(id));
  const indeterminate = someSelected && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const toggleRowSelection = (payrollId: number) => {
    setSelectedPayrollIds((current) => {
      const next = new Set(current);
      if (next.has(payrollId)) {
        next.delete(payrollId);
      } else {
        next.add(payrollId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedPayrollIds(new Set());
      return;
    }

    setSelectedPayrollIds(new Set(downloadableIds));
  };

  const showBulkDownloadToast = (summary: { added: number; failed: number; messages?: string[] } | null) => {
    if (!summary) {
      toast.success('ZIP downloaded successfully');
      return;
    }

    if (summary.failed > 0) {
      toast.success(`Downloaded ${summary.added} salary slip(s); ${summary.failed} failed`);
      return;
    }

    toast.success(`Downloaded ${summary.added} salary slip(s)`);
  };

  const handleDownloadSelected = async () => {
    if (selectedCount === 0) {
      toast.info('Select at least one salary slip to download');
      return;
    }

    setBulkDownloading('selected');
    try {
      const summary = await downloadSalarySlipsZip({
        month,
        year,
        payrollIds: Array.from(selectedPayrollIds),
        department: stageFilter || undefined,
      });
      showBulkDownloadToast(summary);
      setSelectedPayrollIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ZIP download failed');
    } finally {
      setBulkDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    if (downloadableRows.length === 0) {
      toast.info('No salary slips available to download for the current filters');
      return;
    }

    setBulkDownloading('all');
    try {
      const summary = await downloadSalarySlipsZip({
        month,
        year,
        department: stageFilter || undefined,
      });
      showBulkDownloadToast(summary);
      setSelectedPayrollIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ZIP download failed');
    } finally {
      setBulkDownloading(null);
    }
  };

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
      await downloadSalarySlipPdf(payrollId);
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
  const canExport = hasPermission('salarySlips.export');
  const showActionsColumn = hasAnyPermission('salarySlips.generate', 'salarySlips.export');
  const columnCount = (canExport ? 1 : 0) + 4 + (showActionsColumn ? 1 : 0);

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
            <Select
              label="Stage"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              options={[
                { value: '', label: 'All stages' },
                ...stages.map((stage) => ({ value: stage, label: stage })),
              ]}
            />
            <div className="pb-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Available slips</p>
              <p className="text-xl font-bold text-primary-dark">
                {downloadableRows.length} / {visibleRows.length}
              </p>
            </div>
            {canExport && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleDownloadSelected}
                  loading={bulkDownloading === 'selected'}
                  disabled={selectedCount === 0 || bulkDownloading === 'all'}
                >
                  Download Selected{selectedCount > 0 ? ` (${selectedCount})` : ''}
                </Button>
                <Button
                  onClick={handleDownloadAll}
                  loading={bulkDownloading === 'all'}
                  disabled={downloadableRows.length === 0 || bulkDownloading === 'selected'}
                >
                  Download All{downloadableRows.length > 0 ? ` (${downloadableRows.length})` : ''}
                </Button>
              </>
            )}
          </>
        }
      />

      <DataTableCard
        header={
          <>
            {canExport && (
              <Th className="w-[44px]">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  disabled={downloadableRows.length === 0}
                  onChange={toggleSelectAll}
                  aria-label="Select all downloadable salary slips"
                  className="h-4 w-4 rounded border-border"
                />
              </Th>
            )}
            <Th className="min-w-[180px]">Employee</Th>
            <Th className="min-w-[140px]">Stage</Th>
            <Th className="w-[120px]">Payroll Status</Th>
            <Th className="min-w-[200px]">Slip Status</Th>
            {showActionsColumn && <Th className="w-[200px]">Actions</Th>}
          </>
        }
      >
        {loading || refetching ? (
          <TableBodySkeleton rows={8} cols={columnCount} />
        ) : visibleRows.length === 0 ? (
          <tr><td colSpan={columnCount} className="py-8 text-center text-muted-light">No active employees found</td></tr>
        ) : (
          visibleRows.map((item) => {
            const isDownloadable = item.canGenerateSlip && !!item.payrollId;
            const isSelected = item.payrollId ? selectedPayrollIds.has(item.payrollId) : false;

            return (
              <tr key={item.employeeId}>
                {canExport && (
                  <Td>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isDownloadable}
                      onChange={() => item.payrollId && toggleRowSelection(item.payrollId)}
                      aria-label={`Select ${item.fullName}`}
                      className="h-4 w-4 rounded border-border disabled:opacity-40"
                    />
                  </Td>
                )}
                <Td>
                  <p className="font-medium">{item.fullName}</p>
                  <p className="font-mono text-xs text-muted-light">{item.employeeCode}</p>
                </Td>
                <Td>{item.stage}</Td>
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
                {showActionsColumn && (
                <Td>
                  <div className="flex flex-wrap gap-2">
                    {hasPermission('salarySlips.generate') && (
                      <Button
                        size="sm"
                        disabled={!item.canGenerateSlip}
                        loading={generating === item.employeeId}
                        onClick={() => handleGenerateSlip(item)}
                      >
                        View Slip
                      </Button>
                    )}
                    {canExport && isDownloadable && (
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
                )}
              </tr>
            );
          })
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
              {canExport && (
                <Button onClick={() => handleDownloadPdf(currentSlip.payrollId)} loading={downloading === currentSlip.payrollId}>
                  Download PDF
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
