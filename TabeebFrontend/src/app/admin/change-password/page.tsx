'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, KeyRound, Lock } from 'lucide-react';
import { useAdminMe } from '@/lib/hooks/useAdminQueries';
import { apiFetchJson, ApiError } from '@/lib/api-client';
import AdminAuthShell from '@/components/admin/AdminAuthShell';
import AdminLoading from '@/components/admin/AdminLoading';

interface AdminProfilePayload {
  admin?: {
    id?: string;
    username?: string;
    name?: string;
    role?: string;
    email?: string;
    permissions?: string[];
    mustChangePassword?: boolean;
  };
}

const passwordRules = [
  'At least 10 characters',
  'At least one uppercase letter',
  'At least one lowercase letter',
  'At least one number',
  'At least one special character',
];

const readCachedAdminUser = (): Record<string, unknown> => {
  try {
    const raw = localStorage.getItem('adminUser');
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const apiBase = useMemo(() => `${process.env.NEXT_PUBLIC_API_URL}/api/admin`, []);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const { data: adminMe, isLoading, error: adminError } = useAdminMe(adminToken, !!adminToken);

  useEffect(() => {
    if (!adminToken) {
      router.push('/admin/login');
    }
  }, [adminToken, router]);

  useEffect(() => {
    const status = (adminError as ApiError | undefined)?.status;
    if (status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      router.push('/admin/login');
    }
    if (adminError) {
      setError(adminError instanceof Error ? adminError.message : 'Failed to verify admin session');
    }
  }, [adminError, router]);

  useEffect(() => {
    const payload = adminMe as AdminProfilePayload | undefined;
    const admin = payload?.admin || {};
    setMustChangePassword(Boolean(admin.mustChangePassword));

    const cached = readCachedAdminUser();
    if (payload?.admin) {
      localStorage.setItem(
        'adminUser',
        JSON.stringify({
          ...cached,
          ...admin,
          mustChangePassword: Boolean(admin.mustChangePassword),
        })
      );
    }
  }, [adminMe]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword.trim() || !newPassword.trim()) {
      setError('Current and new password are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    setSubmitting(true);

    try {
      if (!adminToken) {
        router.push('/admin/login');
        return;
      }

      await apiFetchJson(`${apiBase}/password/change`, {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword: confirmPassword,
        }),
      });

      const cached = readCachedAdminUser();
      localStorage.setItem(
        'adminUser',
        JSON.stringify({
          ...cached,
          mustChangePassword: false,
        })
      );

      setMustChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated successfully. Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1000);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLoading title="Checking Session" subtitle="Verifying admin access..." />
    );
  }

  return (
    <AdminAuthShell
      title="Change Password"
      subtitle={
        mustChangePassword
          ? 'You must update your password before continuing.'
          : 'Securely update your admin password.'
      }
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 flex items-center justify-center">
          <KeyRound className="w-5 h-5" />
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Secure Update
        </div>
      </div>

        {mustChangePassword && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200 text-sm">
            Password change is required for this account because a temporary password was assigned.
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-200 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-200 text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Current password</span>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">New password</span>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Confirm new password</span>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Password rules</p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              {passwordRules.map((rule) => (
                <li key={rule}>- {rule}</li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-medium text-sm"
          >
            {submitting ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
    </AdminAuthShell>
  );
}
