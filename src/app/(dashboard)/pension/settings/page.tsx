'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageContainer, PageHeader, SectionCard } from '@/components/layout/PageShell';
import { SkeletonBar } from '@/components/ui/Skeletons';
import type { ApiResponse, PensionSettings } from '@/types';

export default function PensionSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<PensionSettings | null>(null);
  const [employeeRate, setEmployeeRate] = useState('');
  const [employerRate, setEmployerRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<PensionSettings>>('/pension/settings');
      setSettings(data.data);
      setEmployeeRate(String(Number(data.data.employeeRate)));
      setEmployerRate(String(Number(data.data.employerRate)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [toast]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const isDirty = settings
    ? Number(employeeRate) !== Number(settings.employeeRate) ||
      Number(employerRate) !== Number(settings.employerRate)
    : false;

  const handleSave = async () => {
    const eRate = Number(employeeRate);
    const erRate = Number(employerRate);
    if (Number.isNaN(eRate) || eRate < 0 || eRate > 100) {
      toast.error('Employee rate must be between 0 and 100');
      return;
    }
    if (Number.isNaN(erRate) || erRate < 0 || erRate > 100) {
      toast.error('Employer rate must be between 0 and 100');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.patch<ApiResponse<PensionSettings>>('/pension/settings', {
        employeeRate: eRate,
        employerRate: erRate,
      });
      setSettings(data.data);
      setEmployeeRate(String(Number(data.data.employeeRate)));
      setEmployerRate(String(Number(data.data.employerRate)));
      toast.success('Pension rates updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Pension Settings"
        subtitle="Configure default pension contribution rates for employee and employer types"
        onRefetch={() => fetchSettings({ refetch: true })}
        refetching={refetching}
      />

      {loading ? (
        <div className="space-y-4">
          <SkeletonBar className="h-48 rounded-2xl" />
        </div>
      ) : (
        <SectionCard
          title="Contribution Rates"
          subtitle="Rates are applied as a percentage of the employee's Basic Pay (Dec 2025)"
        >
          <div className="grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Employee Rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={employeeRate}
              onChange={(e) => setEmployeeRate(e.target.value)}
              disabled={!hasPermission('pension.update')}
            />
            <Input
              label="Employer Rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={employerRate}
              onChange={(e) => setEmployerRate(e.target.value)}
              disabled={!hasPermission('pension.update')}
            />
          </div>

          <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
            <p className="font-medium text-neutral-800">How pension is calculated</p>
            <p className="mt-2">
              When a payroll is generated for an employee with an active pension enrollment, the
              pension amount is deducted from their net salary. The rate used depends on the
              employee&apos;s type: <strong>Employee Rate</strong> for employee-type persons,
              <strong> Employer Rate</strong> for employer-type persons.
            </p>
            <p className="mt-1 text-xs text-muted">Formula: Basic Pay (Dec 2025) × Rate%</p>
          </div>

          {hasPermission('pension.update') && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} loading={saving} disabled={!isDirty}>
                Save Pension Rates
              </Button>
            </div>
          )}
        </SectionCard>
      )}
    </PageContainer>
  );
}
