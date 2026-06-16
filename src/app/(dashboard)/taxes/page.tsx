'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { getChangedFields, hasFieldChanges, NO_CHANGES_MESSAGE, optionalStringsEqual } from '@/lib/form-changes';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState, PageContainer, PageHeader, Th, Td } from '@/components/layout/PageShell';
import { TaxSlabsSkeleton } from '@/components/ui/Skeletons';
import type { ApiResponse, SubTax, TaxSlab } from '@/types';

export default function TaxesPage() {
  const toast = useToast();

  const [slabs, setSlabs] = useState<TaxSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [slabModal, setSlabModal] = useState(false);
  const [subTaxModal, setSubTaxModal] = useState(false);
  const [editingSlab, setEditingSlab] = useState<TaxSlab | null>(null);
  const [editingSubTax, setEditingSubTax] = useState<SubTax | null>(null);
  const [activeSlabId, setActiveSlabId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'slab'; id: number; name: string }
    | { type: 'subTax'; slabId: number; id: number; name: string }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const [slabForm, setSlabForm] = useState({ name: '', minSalary: '', maxSalary: '', taxRate: '', fixedTaxAmount: '', description: '', isActive: true });
  const [originalSlabForm, setOriginalSlabForm] = useState(slabForm);
  const [subTaxForm, setSubTaxForm] = useState({ name: '', code: '', type: 'percentage' as 'percentage' | 'fixed', rate: '', amount: '', description: '', isActive: true });
  const [originalSubTaxForm, setOriginalSubTaxForm] = useState(subTaxForm);

  const fetchData = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<TaxSlab[]>>('/tax-slabs');
      setSlabs(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openSlabModal = (slab?: TaxSlab) => {
    setEditingSlab(slab ?? null);
    const nextForm = slab ? {
      name: slab.name, minSalary: String(slab.minSalary),
      maxSalary: slab.maxSalary ? String(slab.maxSalary) : '',
      taxRate: slab.taxRate != null ? String(slab.taxRate) : '',
      fixedTaxAmount: slab.fixedTaxAmount != null ? String(slab.fixedTaxAmount) : '',
      description: slab.description ?? '', isActive: slab.isActive,
    } : { name: '', minSalary: '', maxSalary: '', taxRate: '', fixedTaxAmount: '', description: '', isActive: true };
    setSlabForm(nextForm);
    setOriginalSlabForm(nextForm);
    setSlabModal(true);
  };

  const openSubTaxModal = (slabId: number, subTax?: SubTax) => {
    setActiveSlabId(slabId);
    setEditingSubTax(subTax ?? null);
    const nextForm = subTax ? {
      name: subTax.name, code: subTax.code, type: subTax.type,
      rate: subTax.rate ? String(subTax.rate) : '',
      amount: subTax.amount ? String(subTax.amount) : '',
      description: subTax.description ?? '', isActive: subTax.isActive,
    } : { name: '', code: '', type: 'percentage' as const, rate: '', amount: '', description: '', isActive: true };
    setSubTaxForm(nextForm);
    setOriginalSubTaxForm(nextForm);
    setSubTaxModal(true);
  };

  const slabEditFields = ['name', 'minSalary', 'maxSalary', 'taxRate', 'fixedTaxAmount', 'description', 'isActive'] as const;
  const subTaxEditFields = ['name', 'code', 'type', 'rate', 'amount', 'description', 'isActive'] as const;

  const slabFieldComparator = (
    key: (typeof slabEditFields)[number],
    current: unknown,
    original: unknown,
  ) => {
    if (key === 'maxSalary' || key === 'description' || key === 'taxRate' || key === 'fixedTaxAmount') {
      return optionalStringsEqual(String(current), String(original));
    }
    if (key === 'minSalary') {
      return Number(current) === Number(original);
    }
    return current === original;
  };

  const subTaxFieldComparator = (
    key: (typeof subTaxEditFields)[number],
    current: unknown,
    original: unknown,
  ) => {
    if (key === 'description') {
      return optionalStringsEqual(String(current), String(original));
    }
    if (key === 'rate' || key === 'amount') {
      return Number(current || 0) === Number(original || 0);
    }
    return current === original;
  };

  const isSlabEditDirty = useMemo(() => {
    if (!editingSlab) return true;
    return hasFieldChanges(slabForm, originalSlabForm, slabEditFields, { isEqual: slabFieldComparator });
  }, [editingSlab, slabForm, originalSlabForm]);

  const isSubTaxEditDirty = useMemo(() => {
    if (!editingSubTax) return true;
    return hasFieldChanges(subTaxForm, originalSubTaxForm, subTaxEditFields, { isEqual: subTaxFieldComparator });
  }, [editingSubTax, subTaxForm, originalSubTaxForm]);

  const handleSlabSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingSlab && !isSlabEditDirty) {
      toast.info(NO_CHANGES_MESSAGE);
      return;
    }
    setSaving(true);
    const payload = {
      name: slabForm.name,
      minSalary: parseFloat(slabForm.minSalary),
      maxSalary: slabForm.maxSalary ? parseFloat(slabForm.maxSalary) : undefined,
      taxRate: slabForm.taxRate ? parseFloat(slabForm.taxRate) : null,
      fixedTaxAmount: slabForm.fixedTaxAmount ? parseFloat(slabForm.fixedTaxAmount) : null,
      description: slabForm.description || undefined,
      isActive: slabForm.isActive,
    };
    try {
      if (editingSlab) {
        await api.patch(`/tax-slabs/${editingSlab.id}`, payload);
        toast.success('Tax slab updated');
      } else {
        await api.post('/tax-slabs', payload);
        toast.success('Tax slab created');
      }
      setSlabModal(false);
      fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSubTaxSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeSlabId) return;
    if (editingSubTax && !isSubTaxEditDirty) {
      toast.info(NO_CHANGES_MESSAGE);
      return;
    }
    setSaving(true);
    const payload = {
      name: subTaxForm.name,
      code: subTaxForm.code,
      type: subTaxForm.type,
      rate: subTaxForm.type === 'percentage' ? parseFloat(subTaxForm.rate) : undefined,
      amount: subTaxForm.type === 'fixed' ? parseFloat(subTaxForm.amount) : undefined,
      description: subTaxForm.description || undefined,
      isActive: subTaxForm.isActive,
    };
    try {
      if (editingSubTax) {
        await api.patch(`/tax-slabs/${activeSlabId}/sub-taxes/${editingSubTax.id}`, payload);
        toast.success('Sub-tax updated');
      } else {
        await api.post(`/tax-slabs/${activeSlabId}/sub-taxes`, payload);
        toast.success('Sub-tax created');
      }
      setSubTaxModal(false);
      fetchData({ refetch: true });
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
      if (deleteTarget.type === 'slab') {
        await api.delete(`/tax-slabs/${deleteTarget.id}`);
        toast.success('Tax slab deleted');
      } else {
        await api.delete(`/tax-slabs/${deleteTarget.slabId}/sub-taxes/${deleteTarget.id}`);
        toast.success('Sub-tax deleted');
      }
      setDeleteTarget(null);
      fetchData({ refetch: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const formatSlabTaxSummary = (slab: TaxSlab) => {
    const parts: string[] = [];
    if (slab.taxRate != null && Number(slab.taxRate) > 0) {
      parts.push(`${Number(slab.taxRate)}% on amount exceeding ${formatCurrency(Math.max(0, Number(slab.minSalary) - 1))}`);
    }
    if (slab.fixedTaxAmount != null && Number(slab.fixedTaxAmount) > 0) {
      parts.push(`Fixed ${formatCurrency(Number(slab.fixedTaxAmount))} / year`);
    }
    return parts.length > 0 ? parts.join(' + ') : 'No tax';
  };
  const activeSlab = slabs.find((s) => s.id === activeSlabId);
  const showSubTaxActionsColumn = hasAnyPermission('taxes.update', 'taxes.delete');
  const showSlabActions = hasAnyPermission('taxes.update', 'taxes.delete');

  return (
    <PageContainer fill>
      <PageHeader
        title="Taxes"
        subtitle="Annual income slabs — annual tax is divided by 12 and deducted on each monthly payroll"
        onRefetch={() => fetchData({ refetch: true })}
        refetching={refetching}
        actions={hasPermission('taxes.create') ? <Button onClick={() => openSlabModal()}>+ Add Slab</Button> : undefined}
      />

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto pr-1">
        {loading || refetching ? (
          <TaxSlabsSkeleton count={2} />
        ) : slabs.length === 0 ? (
          <EmptyState icon="📋" title="No tax slabs yet" description='Click "+ Add Slab" to create one.' />
        ) : (
          <div className="space-y-6 pb-2">
            {slabs.map((slab) => (
              <div key={slab.id} className="card-modern overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary-light/40 to-surface px-5 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{slab.name}</h2>
                    <p className="text-sm text-muted">
                      Annual: {formatCurrency(Number(slab.minSalary))} – {slab.maxSalary ? formatCurrency(Number(slab.maxSalary)) : '∞'}
                      {' · '}{formatSlabTaxSummary(slab)}
                      {' · '}
                      <span className={slab.isActive ? 'text-success' : 'text-muted-light'}>
                        {slab.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  {showSlabActions && (
                  <div className="flex gap-2">
                    {hasPermission('taxes.update') && (
                      <Button size="sm" variant="secondary" onClick={() => openSlabModal(slab)}>Edit Slab</Button>
                    )}
                    {hasPermission('taxes.delete') && (
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget({ type: 'slab', id: slab.id, name: slab.name })}>Delete</Button>
                    )}
                  </div>
                  )}
                </div>

                <div className="px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-700">Sub-Taxes</h3>
                    {hasPermission('taxes.create') && (
                      <Button size="sm" onClick={() => openSubTaxModal(slab.id)}>+ Add Sub-Tax</Button>
                    )}
                  </div>

                  {(slab.subTaxes?.length ?? 0) === 0 ? (
                    <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-light">
                      No sub-taxes for this slab. Use &quot;+ Add Sub-Tax&quot; to add one.
                    </p>
                  ) : (
                    <div className="scroll-area max-h-[280px] overflow-auto rounded-lg border border-border-light">
                      <table className="data-table w-full min-w-[640px]">
                        <thead>
                          <tr>
                            <Th className="w-[80px]">Code</Th>
                            <Th className="min-w-[160px]">Name</Th>
                            <Th className="w-[100px]">Type</Th>
                            <Th className="w-[100px]">Value</Th>
                            <Th className="w-[90px]">Status</Th>
                            {showSubTaxActionsColumn && <Th className="w-[160px]">Actions</Th>}
                          </tr>
                        </thead>
                        <tbody>
                          {slab.subTaxes!.map((st) => (
                            <tr key={st.id}>
                              <Td className="font-mono text-xs font-bold">{st.code}</Td>
                              <Td>{st.name}</Td>
                              <Td className="capitalize">{st.type}</Td>
                              <Td>
                                {st.type === 'percentage' ? `${Number(st.rate)}%` : formatCurrency(Number(st.amount))}
                              </Td>
                              <Td>
                                <span className={`rounded-full px-2 py-0.5 text-xs ${st.isActive ? 'bg-success-soft text-success' : 'bg-neutral-100 text-muted'}`}>
                                  {st.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </Td>
                              {showSubTaxActionsColumn && (
                              <Td>
                                <div className="flex flex-wrap gap-2">
                                  {hasPermission('taxes.update') && (
                                    <Button size="sm" variant="secondary" onClick={() => openSubTaxModal(slab.id, st)}>Edit</Button>
                                  )}
                                  {hasPermission('taxes.delete') && (
                                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget({ type: 'subTax', slabId: slab.id, id: st.id, name: st.name })}>Delete</Button>
                                  )}
                                </div>
                              </Td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={slabModal} onClose={() => setSlabModal(false)} title={editingSlab ? 'Edit Tax Slab' : 'Add Tax Slab'}>
        <form onSubmit={handleSlabSubmit} className="space-y-3">
          <Input label="Name" value={slabForm.name} onChange={(e) => setSlabForm({ ...slabForm, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min Annual Salary" type="number" min="0" value={slabForm.minSalary} onChange={(e) => setSlabForm({ ...slabForm, minSalary: e.target.value })} required />
            <Input label="Max Annual Salary (empty = unlimited)" type="number" min="0" value={slabForm.maxSalary} onChange={(e) => setSlabForm({ ...slabForm, maxSalary: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tax Rate (%) — optional" type="number" min="0" max="100" step="0.01" value={slabForm.taxRate} onChange={(e) => setSlabForm({ ...slabForm, taxRate: e.target.value })} />
            <Input label="Fixed Annual Tax — optional" type="number" min="0" step="0.01" value={slabForm.fixedTaxAmount} onChange={(e) => setSlabForm({ ...slabForm, fixedTaxAmount: e.target.value })} />
          </div>
          <p className="text-xs text-muted">Both fields are optional — leave empty to skip that tax component.</p>
          <Input label="Description" value={slabForm.description} onChange={(e) => setSlabForm({ ...slabForm, description: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSlabModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!!editingSlab && !isSlabEditDirty}>
              {editingSlab ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={subTaxModal}
        onClose={() => setSubTaxModal(false)}
        title={editingSubTax ? `Edit Sub-Tax — ${activeSlab?.name}` : `Add Sub-Tax — ${activeSlab?.name}`}
      >
        <form onSubmit={handleSubTaxSubmit} className="space-y-3">
          <Input label="Name" value={subTaxForm.name} onChange={(e) => setSubTaxForm({ ...subTaxForm, name: e.target.value })} required />
          <Input label="Code (e.g. EOBI)" value={subTaxForm.code} onChange={(e) => setSubTaxForm({ ...subTaxForm, code: e.target.value })} required />
          <Select label="Type" value={subTaxForm.type} onChange={(e) => setSubTaxForm({ ...subTaxForm, type: e.target.value as 'percentage' | 'fixed' })} options={[{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed Amount' }]} />
          {subTaxForm.type === 'percentage' ? (
            <Input label="Rate (%)" type="number" min="0" max="100" step="0.01" value={subTaxForm.rate} onChange={(e) => setSubTaxForm({ ...subTaxForm, rate: e.target.value })} required />
          ) : (
            <Input label="Fixed Amount" type="number" min="0" step="0.01" value={subTaxForm.amount} onChange={(e) => setSubTaxForm({ ...subTaxForm, amount: e.target.value })} required />
          )}
          <Input label="Description" value={subTaxForm.description} onChange={(e) => setSubTaxForm({ ...subTaxForm, description: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSubTaxModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!!editingSubTax && !isSubTaxEditDirty}>
              {editingSubTax ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={deleteTarget?.type === 'subTax' ? 'Delete Sub-Tax' : 'Delete Tax Slab'}
        message={
          deleteTarget?.type === 'slab'
            ? `Delete tax slab "${deleteTarget.name}" and all its sub-taxes? This action cannot be undone.`
            : deleteTarget?.type === 'subTax'
              ? `Delete sub-tax "${deleteTarget.name}"? This action cannot be undone.`
              : ''
        }
        loading={deleting}
      />
    </PageContainer>
  );
}
