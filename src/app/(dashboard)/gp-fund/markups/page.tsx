'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageContainer, PageHeader, SectionCard } from '@/components/layout/PageShell';
import { SkeletonBar } from '@/components/ui/Skeletons';
import type { ApiResponse, GpFundMarkupSettings } from '@/types';

export default function GpFundMarkupsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<GpFundMarkupSettings | null>(null);
  const [annualRate, setAnnualRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMarkups = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    try {
      const { data } = await api.get<ApiResponse<GpFundMarkupSettings>>('/gp-fund/markups');
      setSettings(data.data);
      setAnnualRate(String(Number(data.data.annualMarkupRate)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMarkups();
  }, [fetchMarkups]);

  const isDirty = settings
    ? Number(annualRate) !== Number(settings.annualMarkupRate)
    : false;

  const handleSave = async () => {
    const annual = Number(annualRate);

    if (Number.isNaN(annual) || annual < 0 || annual > 100) {
      toast.error('Annual markup must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch<ApiResponse<GpFundMarkupSettings>>('/gp-fund/markups', {
        annualMarkupRate: annual,
      });
      setSettings(data.data);
      setAnnualRate(String(Number(data.data.annualMarkupRate)));
      toast.success('GP Fund markup rate updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="GP Fund Markups"
        subtitle="Configure the annual markup percentage applied on top of employee GP fund subscriptions"
        onRefetch={() => fetchMarkups({ refetch: true })}
        refetching={refetching}
      />

      {loading ? (
        <div className="space-y-4">
          <SkeletonBar className="h-48 rounded-2xl" />
        </div>
      ) : (
        <SectionCard
          title="Markup Rate"
          subtitle="This rate applies to all employees with an assigned GP fund scale"
        >
          <div className="max-w-sm">
            <Input
              label="Annual Markup (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              disabled={!hasPermission('gpFund.update')}
            />
          </div>

          <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
            <p className="font-medium text-neutral-800">How markup is calculated</p>
            <p className="mt-2">
              In December payroll, an annual markup is applied on the year total of base GP fund
              subscriptions collected in that calendar year.
            </p>
          </div>

          {hasPermission('gpFund.update') && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} loading={saving} disabled={!isDirty}>
                Save Markup Rate
              </Button>
            </div>
          )}
        </SectionCard>
      )}
    </PageContainer>
  );
}
