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
  const [monthlyRate, setMonthlyRate] = useState('');
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
      setMonthlyRate(String(Number(data.data.monthlyMarkupRate)));
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
    ? Number(monthlyRate) !== Number(settings.monthlyMarkupRate)
      || Number(annualRate) !== Number(settings.annualMarkupRate)
    : false;

  const handleSave = async () => {
    const monthly = Number(monthlyRate);
    const annual = Number(annualRate);

    if (Number.isNaN(monthly) || monthly < 0 || monthly > 100) {
      toast.error('Monthly markup must be between 0 and 100');
      return;
    }
    if (Number.isNaN(annual) || annual < 0 || annual > 100) {
      toast.error('Annual markup must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch<ApiResponse<GpFundMarkupSettings>>('/gp-fund/markups', {
        monthlyMarkupRate: monthly,
        annualMarkupRate: annual,
      });
      setSettings(data.data);
      setMonthlyRate(String(Number(data.data.monthlyMarkupRate)));
      setAnnualRate(String(Number(data.data.annualMarkupRate)));
      toast.success('GP Fund markup rates updated');
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
        subtitle="Configure monthly and annual markup percentages applied on top of employee GP fund subscriptions"
        onRefetch={() => fetchMarkups({ refetch: true })}
        refetching={refetching}
      />

      {loading ? (
        <div className="space-y-4">
          <SkeletonBar className="h-48 rounded-2xl" />
        </div>
      ) : (
        <SectionCard
          title="Markup Rates"
          subtitle="These rates apply to all employees with an assigned GP fund scale"
        >
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <Input
              label="Monthly Markup (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={monthlyRate}
              onChange={(e) => setMonthlyRate(e.target.value)}
              disabled={!hasPermission('gpFund.update')}
            />
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
            <p className="font-medium text-neutral-800">How markups are calculated</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Monthly:</strong> each payroll month adds markup on the base GP fund subscription
                (e.g. Rs. 600 at 12% → Rs. 72 markup, Rs. 672 total for that month).
              </li>
              <li>
                <strong>Annual:</strong> in December payroll, an extra markup is applied on the year total
                (base GP fund + monthly markups collected in that calendar year).
              </li>
            </ul>
          </div>

          {hasPermission('gpFund.update') && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} loading={saving} disabled={!isDirty}>
                Save Markup Rates
              </Button>
            </div>
          )}
        </SectionCard>
      )}
    </PageContainer>
  );
}
