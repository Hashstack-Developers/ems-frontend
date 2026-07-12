'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageContainer, PageHeader, SectionCard } from '@/components/layout/PageShell';
import { SkeletonBar } from '@/components/ui/Skeletons';
import type { ApiResponse, AllowanceSettings } from '@/types';

export default function ManagementAllowancePage() {
  const toast = useToast();
  const [settings, setSettings] = useState<AllowanceSettings | null>(null);
  const [managementRate, setManagementRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    try {
      const { data } = await api.get<ApiResponse<AllowanceSettings>>('/allowances/settings');
      setSettings(data.data);
      setManagementRate(String(Number(data.data.managementRate)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isDirty = settings ? Number(managementRate) !== Number(settings.managementRate) : false;

  const handleSave = async () => {
    const rate = Number(managementRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Management rate must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch<ApiResponse<AllowanceSettings>>('/allowances/settings', {
        welfareRate: Number(settings?.welfareRate ?? 0),
        managementRate: rate,
      });
      setSettings(data.data);
      setManagementRate(String(Number(data.data.managementRate)));
      toast.success('Management allowance rate updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Management Allowance"
        subtitle="Set the default management allowance percentage applied to each employee's basic pay"
        onRefetch={() => fetchSettings({ refetch: true })}
        refetching={refetching}
      />

      {loading ? (
        <div className="space-y-4">
          <SkeletonBar className="h-48 rounded-2xl" />
        </div>
      ) : (
        <SectionCard
          title="Default Management Rate"
          subtitle="Applies to all employees unless a custom rate is set on the employee record"
        >
          <div className="max-w-sm">
            <Input
              label="Management Rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={managementRate}
              onChange={(e) => setManagementRate(e.target.value)}
              disabled={!hasPermission('allowances.update')}
            />
          </div>

          <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
            <p className="font-medium text-neutral-800">How management allowance is calculated</p>
            <p className="mt-2">
              At payroll generation time, the management allowance amount is computed as{' '}
              <strong>Basic Pay (Dec 2025) × Management Rate%</strong>. The resulting amount is
              added to the employee&apos;s net salary. If an employee has a custom rate set on
              their profile, that rate overrides this default.
            </p>
          </div>

          {hasPermission('allowances.update') && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} loading={saving} disabled={!isDirty}>
                Save Management Rate
              </Button>
            </div>
          )}
        </SectionCard>
      )}
    </PageContainer>
  );
}
