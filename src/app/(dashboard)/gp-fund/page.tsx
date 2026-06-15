'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { hasFieldChanges, NO_CHANGES_MESSAGE } from '@/lib/form-changes';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  DataTableCard,
  InfoPanel,
  PageContainer,
  PageHeader,
  StatBanner,
  StatBannerItem,
  Th,
  Td,
} from '@/components/layout/PageShell';
import { StatBannerSkeleton, TableBodySkeleton } from '@/components/ui/Skeletons';
import type { ApiResponse, GpFundRecord } from '@/types';

const emptyForm = {
  year: String(new Date().getFullYear()),
  yearlyTaxCollection: '',
  markupRate: '',
  markupTaxAmount: '0',
};

export default function GpFundPage() {
  const toast = useToast();

  const [records, setRecords] = useState<GpFundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GpFundRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] = useState(emptyForm);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GpFundRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRecords = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<GpFundRecord[]>>('/gp-fund');
      setRecords(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [toast]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (record: GpFundRecord) => {
    setEditing(record);
    const nextForm = {
      year: String(record.year),
      yearlyTaxCollection: String(record.yearlyTaxCollection),
      markupRate: record.markupRate != null ? String(record.markupRate) : '',
      markupTaxAmount: String(record.markupTaxAmount ?? 0),
    };
    setForm(nextForm);
    setOriginalForm(nextForm);
    setModalOpen(true);
  };

  const editFields = ['year', 'yearlyTaxCollection', 'markupRate', 'markupTaxAmount'] as const;

  const gpFundFieldComparator = (
    key: (typeof editFields)[number],
    current: unknown,
    original: unknown,
  ) => {
    if (key === 'markupRate') {
      const currentValue = String(current).trim();
      const originalValue = String(original).trim();
      if (currentValue === '' && originalValue === '') return true;
      return Number(currentValue || 0) === Number(originalValue || 0);
    }
    return Number(current) === Number(original);
  };

  const isEditDirty = useMemo(() => {
    if (!editing) return true;
    return hasFieldChanges(form, originalForm, editFields, { isEqual: gpFundFieldComparator });
  }, [editing, form, originalForm]);

  const loadFromPayrolls = async () => {
    const year = parseInt(form.year, 10);
    if (isNaN(year)) {
      toast.error('Enter a valid year first');
      return;
    }
    setLoadingSuggestion(true);
    try {
      const { data } = await api.get<ApiResponse<{ suggestedAmount: number; payrollCount: number }>>(
        `/gp-fund/suggested-collection/${year}`,
      );
      setForm((f) => ({ ...f, yearlyTaxCollection: String(data.data.suggestedAmount) }));
      toast.success(`Loaded ${formatCurrency(data.data.suggestedAmount)} from ${data.data.payrollCount} payroll record(s)`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editing && !isEditDirty) {
      toast.info(NO_CHANGES_MESSAGE);
      return;
    }
    setSaving(true);
    const payload = {
      year: parseInt(form.year, 10),
      yearlyTaxCollection: parseFloat(form.yearlyTaxCollection),
      markupRate: form.markupRate ? parseFloat(form.markupRate) : undefined,
      markupTaxAmount: form.markupTaxAmount ? parseFloat(form.markupTaxAmount) : 0,
    };
    try {
      if (editing) {
        await api.patch(`/gp-fund/${editing.id}`, payload);
        toast.success('GP Fund record updated — balances recalculated');
      } else {
        await api.post('/gp-fund', payload);
        toast.success('GP Fund record created — balances calculated');
      }
      setModalOpen(false);
      fetchRecords({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/gp-fund/${deleteTarget.id}`);
      toast.success('Record deleted — balances recalculated');
      setDeleteTarget(null);
      fetchRecords({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const latestClosing = records.length > 0 ? Number(records[records.length - 1].closingBalance) : 0;
  const showActionsColumn = hasAnyPermission('gpFund.update', 'gpFund.delete');
  const columnCount = showActionsColumn ? 7 : 6;

  return (
    <PageContainer fill>
      <PageHeader
        title="GP Fund Records"
        subtitle="Annual tax collection tracking with auto-calculated opening & closing balances"
        onRefetch={() => fetchRecords({ refetch: true })}
        refetching={refetching}
        actions={hasPermission('gpFund.create') ? <Button onClick={openCreate}>+ Add Year</Button> : undefined}
      />

      {loading || refetching ? (
        <StatBannerSkeleton columns={3} />
      ) : (
        <StatBanner>
          <StatBannerItem label="Current Fund Balance" value={formatCurrency(latestClosing)} valueClassName="text-primary-dark" />
          <StatBannerItem label="Formula" value="Opening + Collection + Markup" valueClassName="text-sm font-medium text-muted sm:text-base" />
          <StatBannerItem label="Records" value={records.length} valueClassName="text-accent-dark" />
        </StatBanner>
      )}

      <DataTableCard
        minWidth="min-w-[960px]"
        header={
          <>
            <Th className="w-[100px]">Year</Th>
            <Th className="w-[140px]">Opening Balance</Th>
            <Th className="w-[150px]">Yearly Collection</Th>
            <Th className="w-[110px]">Markup Rate</Th>
            <Th className="w-[130px]">Markup Amount</Th>
            <Th className="w-[140px]">Closing Balance</Th>
            {showActionsColumn && <Th className="w-[160px]">Actions</Th>}
          </>
        }
      >
        {loading || refetching ? (
          <TableBodySkeleton rows={6} cols={columnCount} />
        ) : records.length === 0 ? (
          <tr><td colSpan={columnCount} className="py-8 text-center text-muted-light">No GP Fund records yet</td></tr>
        ) : (
          records.map((r, idx) => (
            <tr key={r.id}>
              <Td className="font-semibold">
                {r.year}
                {idx === 0 && <span className="ml-2 text-xs font-normal text-muted-light">(first year)</span>}
              </Td>
              <Td>{formatCurrency(Number(r.openingBalance))}</Td>
              <Td className="text-success">{formatCurrency(Number(r.yearlyTaxCollection))}</Td>
              <Td>{r.markupRate != null ? `${Number(r.markupRate)}%` : '—'}</Td>
              <Td>{formatCurrency(Number(r.markupTaxAmount))}</Td>
              <Td className="font-bold text-primary-hover">{formatCurrency(Number(r.closingBalance))}</Td>
              {showActionsColumn && (
              <Td>
                <div className="flex flex-wrap gap-2">
                  {hasPermission('gpFund.update') && (
                    <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
                  )}
                  {hasPermission('gpFund.delete') && (
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(r)}>Delete</Button>
                  )}
                </div>
              </Td>
              )}
            </tr>
          ))
        )}
      </DataTableCard>

      <InfoPanel title="Balance Calculation">
        <ul className="list-inside list-disc space-y-1">
          <li><strong>First year:</strong> Opening balance = 0</li>
          <li><strong>Subsequent years:</strong> Opening balance = Previous year&apos;s closing balance</li>
          <li><strong>Closing balance</strong> = Opening + Yearly Tax Collection + Markup Tax Amount</li>
          <li><strong>Markup rate:</strong> Reserved for future auto-calculation of markup amount</li>
        </ul>
      </InfoPanel>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${editing.year}` : 'Add GP Fund Record'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Year" type="number" min="2000" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required disabled={!!editing} />
          <div>
            <Input label="Yearly Tax Collection" type="number" min="0" step="0.01" value={form.yearlyTaxCollection} onChange={(e) => setForm({ ...form, yearlyTaxCollection: e.target.value })} required />
            <Button type="button" size="sm" variant="ghost" className="mt-1" loading={loadingSuggestion} onClick={loadFromPayrolls}>
              Load from payroll deductions
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Markup Rate (%) — future use" type="number" min="0" max="100" step="0.01" value={form.markupRate} onChange={(e) => setForm({ ...form, markupRate: e.target.value })} />
            <Input label="Markup Tax Amount" type="number" min="0" step="0.01" value={form.markupTaxAmount} onChange={(e) => setForm({ ...form, markupTaxAmount: e.target.value })} />
          </div>
          <p className="text-xs text-muted">Closing balance is calculated automatically after save.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!!editing && !isEditDirty}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete GP Fund Record"
        message={deleteTarget ? `Delete GP Fund record for ${deleteTarget.year}? Subsequent year balances will be recalculated. This action cannot be undone.` : ''}
        loading={deleting}
      />
    </PageContainer>
  );
}
