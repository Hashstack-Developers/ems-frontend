'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SettingsProfileSkeleton } from '@/components/ui/Skeletons';
import { useSettingsActions } from '../SettingsActionsContext';
import type { ApiResponse, User } from '@/types';

export default function AccountSettingsPage() {
  const toast = useToast();
  const { registerRefetch, setRefetching, refetching } = useSettingsActions();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async (options?: { refetch?: boolean }) => {
    const isRefetch = options?.refetch ?? false;
    if (isRefetch) setRefetching(true);
    else setLoading(true);

    try {
      const { data } = await api.get<ApiResponse<User>>('/auth/profile');
      setUser(data.data);
    } catch (err) {
      if (!isRefetch) {
        setUser(getUser());
      }
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [setRefetching, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    registerRefetch(() => fetchProfile({ refetch: true }));
    return () => registerRefetch(null);
  }, [fetchProfile, registerRefetch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return <SettingsProfileSkeleton />;
  }

  if (refetching) {
    return <SettingsProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="card-modern p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted">Your signed-in account details</p>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-light">Full name</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{user?.fullName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-light">Email</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-light">Role</dt>
            <dd className="mt-1">
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium capitalize text-primary-hover">
                {user?.role ?? '—'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="card-modern p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
        <p className="mt-1 text-sm text-muted">
          Use a strong password with at least 8 characters
        </p>

        <form onSubmit={handleSubmit} className="mt-5 max-w-md space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <div className="pt-2">
            <Button type="submit" loading={saving}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
