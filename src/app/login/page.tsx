'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { getErrorMessage } from '@/lib/api';
import { isAuthenticated, setAuth } from '@/lib/auth';
import { getDefaultRoute } from '@/lib/pages';
import { useToast } from '@/contexts/ToastContext';
import { LoginScene } from '@/components/login/LoginScene';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { ApiResponse, LoginResponse } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      router.replace(getDefaultRoute());
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
        email,
        password,
      });
      setAuth(data.data.accessToken, data.data.user);
      toast.success(`Welcome back, ${data.data.user.fullName}!`);
      router.push(getDefaultRoute());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <LoginScene />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div
        className={`login-card relative z-10 w-full max-w-[420px] ${mounted ? 'login-card-visible' : ''}`}
      >
        <div className="login-card-shine" aria-hidden />

        <div className="mb-8 text-center">
          <div className="login-logo-wrap mx-auto mb-5">
            <div className="login-logo icon-3d flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-2xl text-white">
              <span className="relative z-10">EMS</span>
            </div>
          </div>
          <h1 className="bg-gradient-to-r from-primary via-primary-dark to-accent bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
            Employee Management
          </h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to manage payrolls, taxes &amp; employees
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="login-input"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="login-input"
          />
          <Button type="submit" className="login-submit w-full" loading={loading}>
            Sign In
          </Button>
        </form>
      </div>

      <p className="login-footer absolute bottom-4 left-0 right-0 z-10 text-center text-xs text-muted-light">
        Secure payroll &amp; Employee management platform
      </p>
    </div>
  );
}
