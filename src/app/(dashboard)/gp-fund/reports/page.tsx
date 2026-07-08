'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency, MONTHS } from '@/lib/format';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import {
  downloadGpFundReportPdf,
  downloadGpFundReportsZip,
} from '@/lib/gp-fund-report-downloads';
import { useToast } from '@/contexts/ToastContext';
import { GpFundReportView } from '@/components/gp-fund/GpFundReportView';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { TableFilters } from '@/components/ui/TableFilters';
import {
  DataTableCard,
  PageContainer,
  PageHeader,
  Td,
  Th,
} from '@/components/layout/PageShell';
import { TableBodySkeleton } from '@/components/ui/Skeletons';
import { matchesSearch } from '@/lib/table-filter';
import type {
  ApiResponse,
  GpFundReport,
  GpFundReportAvailability,
  GpFundReportAvailabilityResponse,
} from '@/types';

function toggleInList(list: number[], value: number): number[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value].sort((a, b) => a - b);
}

export default function GpFundReportsPage() {
  const toast = useToast();
  const selectAllRef = useRef<HTMLInputElement>(null);
  const now = new Date();
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [stageFilter, setStageFilter] = useState('');
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState<GpFundReportAvailability[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([now.getFullYear()]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [generating, setGenerating] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState<'selected' | 'all' | null>(null);
  const [reportModal, setReportModal] = useState(false);
  const [currentReport, setCurrentReport] = useState<GpFundReport | null>(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedYears.length) params.set('years', selectedYears.join(','));
    if (selectedMonths.length) params.set('months', selectedMonths.join(','));
    return params.toString();
  }, [selectedMonths, selectedYears]);

  const fetchAvailability = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    try {
      const query = buildParams();
      const { data } = await api.get<ApiResponse<GpFundReportAvailabilityResponse>>(
        `/gp-fund/reports${query ? `?${query}` : ''}`,
      );
      setAvailability(data.data.rows);
      if (data.data.availableYears.length) {
        setAvailableYears(data.data.availableYears);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [buildParams, toast]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    setSelectedEmployeeIds(new Set());
  }, [selectedYears, selectedMonths, stageFilter]);

  const stages = useMemo(
    () => Array.from(new Set(availability.map((item) => item.stage).filter(Boolean))).sort(),
    [availability],
  );

  const visibleRows = useMemo(() => {
    return availability.filter((item) => {
      if (stageFilter && item.stage !== stageFilter) return false;
      return matchesSearch(search, item.fullName, item.employeeCode, item.stage, item.designation, item.gpFundScale ?? '');
    });
  }, [availability, stageFilter, search]);

  const downloadableRows = useMemo(
    () => visibleRows.filter((item) => item.canGenerateReport),
    [visibleRows],
  );

  const downloadableIds = useMemo(
    () => downloadableRows.map((item) => item.employeeId),
    [downloadableRows],
  );

  const selectedCount = useMemo(
    () => downloadableIds.filter((id) => selectedEmployeeIds.has(id)).length,
    [downloadableIds, selectedEmployeeIds],
  );

  const allSelected =
    downloadableIds.length > 0 &&
    downloadableIds.every((id) => selectedEmployeeIds.has(id));
  const someSelected = downloadableIds.some((id) => selectedEmployeeIds.has(id));
  const indeterminate = someSelected && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const toggleRowSelection = (employeeId: number) => {
    setSelectedEmployeeIds((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedEmployeeIds(new Set());
      return;
    }
    setSelectedEmployeeIds(new Set(downloadableIds));
  };

  const filterPayload = {
    years: selectedYears.length ? selectedYears : undefined,
    months: selectedMonths.length ? selectedMonths : undefined,
  };

  const showBulkDownloadToast = (
    summary: { added: number; failed: number; messages?: string[] } | null,
  ) => {
    if (!summary) {
      toast.success('ZIP downloaded successfully');
      return;
    }
    if (summary.failed > 0) {
      toast.success(`Downloaded ${summary.added} report(s); ${summary.failed} failed`);
      return;
    }
    toast.success(`Downloaded ${summary.added} report(s)`);
  };

  const handleDownloadSelected = async () => {
    if (selectedCount === 0) {
      toast.info('Select at least one report to download');
      return;
    }

    setBulkDownloading('selected');
    try {
      const summary = await downloadGpFundReportsZip({
        ...filterPayload,
        employeeIds: Array.from(selectedEmployeeIds),
        stage: stageFilter || undefined,
      });
      showBulkDownloadToast(summary);
      setSelectedEmployeeIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ZIP download failed');
    } finally {
      setBulkDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    if (downloadableRows.length === 0) {
      toast.info('No GP fund reports available to download for the current filters');
      return;
    }

    setBulkDownloading('all');
    try {
      const summary = await downloadGpFundReportsZip({
        ...filterPayload,
        stage: stageFilter || undefined,
      });
      showBulkDownloadToast(summary);
      setSelectedEmployeeIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ZIP download failed');
    } finally {
      setBulkDownloading(null);
    }
  };

  const handleGenerateReport = async (item: GpFundReportAvailability) => {
    if (!item.canGenerateReport) return;
    setGenerating(item.employeeId);
    try {
      const { data } = await api.post<ApiResponse<GpFundReport>>('/gp-fund/reports/generate', {
        employeeId: item.employeeId,
        ...filterPayload,
      });
      setCurrentReport(data.data);
      setReportModal(true);
      toast.success('GP fund report generated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadPdf = async (employeeId: number) => {
    setDownloading(employeeId);
    try {
      await downloadGpFundReportPdf(employeeId, filterPayload);
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

  const canExport = hasPermission('gpFund.export');
  const canGenerate = hasPermission('gpFund.generate');
  const showActionsColumn = hasAnyPermission('gpFund.generate', 'gpFund.export');
  const columnCount = (canExport ? 1 : 0) + 7 + (showActionsColumn ? 1 : 0);

  return (
    <PageContainer fill>
      <PageHeader
        title="GP Fund Reports"
        subtitle="View and download GP fund statements per employee or in bulk"
        onRefetch={() => fetchAvailability({ refetch: true })}
        refetching={refetching}
        actions={
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedYears([])}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${selectedYears.length === 0 ? 'bg-primary text-white' : 'filter-chip-inactive'}`}
              >
                All years
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYears(toggleInList(selectedYears, year))}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    selectedYears.includes(year) ? 'bg-primary text-white' : 'filter-chip-inactive'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedMonths([])}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${selectedMonths.length === 0 ? 'bg-primary text-white' : 'filter-chip-inactive'}`}
              >
                All months
              </button>
              {MONTHS.map((label, index) => {
                const month = index + 1;
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setSelectedMonths(toggleInList(selectedMonths, month))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      selectedMonths.includes(month) ? 'bg-primary text-white' : 'filter-chip-inactive'
                    }`}
                  >
                    {label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
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
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Available reports</p>
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

      <TableFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Employee name, code, scale, stage…"
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
                  onChange={toggleSelectAll}
                  disabled={downloadableIds.length === 0}
                  aria-label="Select all downloadable reports"
                />
              </Th>
            )}
            <Th>Employee</Th>
            <Th>Father Name</Th>
            <Th>Code</Th>
            <Th>Scale</Th>
            <Th>Stage</Th>
            <Th className="text-right">Months</Th>
            <Th className="text-right">Collected</Th>
            {showActionsColumn && <Th className="text-right">Actions</Th>}
          </>
        }
      >
        {loading ? (
          <TableBodySkeleton cols={columnCount} rows={8} />
        ) : visibleRows.length === 0 ? (
          <tr>
            <td colSpan={columnCount} className="py-8 text-center text-muted-light">
              No employees match the current filters
            </td>
          </tr>
        ) : (
          visibleRows.map((item) => {
            const isDownloadable = item.canGenerateReport;
            return (
              <tr key={item.employeeId}>
                {canExport && (
                  <Td>
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.has(item.employeeId)}
                      onChange={() => toggleRowSelection(item.employeeId)}
                      disabled={!isDownloadable}
                      aria-label={`Select ${item.fullName}`}
                    />
                  </Td>
                )}
                <Td>
                  <div>
                    <p className="font-medium">{item.fullName}</p>
                    <p className="text-xs text-muted">{item.designation}</p>
                  </div>
                </Td>
                <Td className="text-muted">{item.fatherName || '—'}</Td>
                <Td>{item.employeeCode}</Td>
                <Td>{item.gpFundScale ?? '—'}</Td>
                <Td>{item.stage || '—'}</Td>
                <Td className="text-right">{item.payrollCount}</Td>
                <Td className="text-right">{formatCurrency(item.totalCollected)}</Td>
                {showActionsColumn && (
                  <Td>
                    <div className="flex justify-end gap-2">
                      {canGenerate && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={generating === item.employeeId}
                          disabled={!isDownloadable}
                          onClick={() => handleGenerateReport(item)}
                        >
                          View
                        </Button>
                      )}
                      {canExport && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={downloading === item.employeeId}
                          disabled={!isDownloadable}
                          onClick={() => handleDownloadPdf(item.employeeId)}
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

      <Modal
        open={reportModal}
        onClose={() => {
          setReportModal(false);
          setCurrentReport(null);
        }}
        title="GP Fund Report"
        size="xl"
      >
        {currentReport && (
          <div>
            <GpFundReportView report={currentReport} />
            <div className="mt-4 flex justify-end gap-2 print:hidden">
              <Button variant="secondary" onClick={handlePrint}>Print</Button>
              {canExport && (
                <Button
                  onClick={() => handleDownloadPdf(currentReport.employee.id)}
                  loading={downloading === currentReport.employee.id}
                >
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
