'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldPlus, Trash2, UserCog, Users } from 'lucide-react';
import { Toast } from '@/components/Toast';

interface AdminSessionUser {
  id: string;
  username: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AdminDirectoryEntry {
  id: string;
  username: string;
  displayName: string;
  role: string;
  email: string;
  isBlocked: boolean;
}

type TotpPendingAction =
  | {
      type: 'create';
      payload: {
        username: string;
        displayName: string;
        email: string;
        role: string;
        password: string;
      };
    }
  | {
      type: 'delete';
      admin: AdminDirectoryEntry;
    };

const roleOptions = [
  'SUPER_ADMIN',
  'VERIFICATION_TEAM',
  'SUPPORT_TEAM',
  'OPERATIONS_TEAM',
  'CONTENT_TEAM',
];

export default function AdminManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [totpPendingAction, setTotpPendingAction] = useState<TotpPendingAction | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpSubmitting, setTotpSubmitting] = useState(false);
  const [sessionUser, setSessionUser] = useState<AdminSessionUser | null>(null);
  const [admins, setAdmins] = useState<AdminDirectoryEntry[]>([]);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SUPPORT_TEAM');
  const [password, setPassword] = useState('');

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [toastMessage, setToastMessage] = useState('');
  const [centerFailMessage, setCenterFailMessage] = useState('');
  const [showCenterFailMessage, setShowCenterFailMessage] = useState(false);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const showCenteredFailure = useCallback((message: string) => {
    setCenterFailMessage(message);
    setShowCenterFailMessage(true);
  }, []);

  useEffect(() => {
    if (!showCenterFailMessage) return;

    const timer = setTimeout(() => {
      setShowCenterFailMessage(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [showCenterFailMessage]);

  const apiRequest = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
        throw new Error('Session expired');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    },
    [router]
  );

  const loadAdmins = useCallback(async () => {
    const response = await apiRequest('/admins');
    setAdmins(response.admins || []);
  }, [apiRequest]);

  const loadSessionUser = useCallback(async (): Promise<AdminSessionUser | null> => {
    const token = localStorage.getItem('adminToken');
    if (!token) return null;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    const payload = await response.json();
    const admin = payload?.admin;
    if (!admin || typeof admin !== 'object') return null;

    const normalized: AdminSessionUser = {
      id: String(admin.id || ''),
      username: String(admin.username || ''),
      name: String(admin.name || admin.username || ''),
      role: String(admin.role || ''),
      permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
    };

    if (!normalized.id || !normalized.username || !normalized.role) return null;

    localStorage.setItem('adminUser', JSON.stringify(normalized));
    return normalized;
  }, []);

  useEffect(() => {
    const rawUser = localStorage.getItem('adminUser');
    const initialize = async () => {
      let parsedUser: AdminSessionUser | null = null;

      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser) as AdminSessionUser;
          if (parsed?.id && parsed?.username && parsed?.role) {
            parsedUser = parsed;
          }
        } catch {
          parsedUser = null;
        }
      }

      if (!parsedUser) {
        parsedUser = await loadSessionUser();
      }

      if (!parsedUser) {
        router.push('/admin/login');
        return;
      }

      setSessionUser(parsedUser);

      await loadAdmins();
    };

    initialize()
      .catch(() => {
        setAdmins([]);
      })
      .finally(() => setLoading(false));
  }, [loadAdmins, loadSessionUser, router]);

  const isSuperAdmin = useMemo(() => sessionUser?.role === 'SUPER_ADMIN', [sessionUser?.role]);

  const handleCreateAdmin = () => {
    if (!isSuperAdmin) return;
    if (!username.trim() || !email.trim() || !password.trim()) {
      showCenteredFailure('Username, email, and password are required');
      return;
    }

    setTotpCode('');
    setTotpPendingAction({
      type: 'create',
      payload: {
        username: username.trim(),
        displayName: displayName.trim(),
        email: email.trim(),
        role,
        password: password.trim(),
      },
    });
  };

  const handleDeleteAdmin = async (admin: AdminDirectoryEntry) => {
    if (!isSuperAdmin) return;

    if (sessionUser?.id === admin.id) {
      showCenteredFailure('You cannot delete your own account');
      return;
    }

    const confirmed = window.confirm(
      `Delete admin "${admin.displayName}" (@${admin.username})? This action cannot be undone.`
    );
    if (!confirmed) return;

    setTotpCode('');
    setDeletingAdminId(admin.id);
    setTotpPendingAction({
      type: 'delete',
      admin,
    });
  };

  const closeTotpModal = () => {
    setTotpPendingAction(null);
    setTotpCode('');
    setTotpSubmitting(false);
    setDeletingAdminId(null);
  };

  const handleConfirmTotpAction = async () => {
    if (!totpPendingAction) return;

    const trimmedCode = totpCode.trim();
    if (trimmedCode.length !== 6) {
      showCenteredFailure('Enter a valid 6-digit TOTP code');
      return;
    }

    setTotpSubmitting(true);
    setSubmitting(totpPendingAction.type === 'create');
    try {
      if (totpPendingAction.type === 'create') {
        const createResponse = await apiRequest('/admins', {
          method: 'POST',
          body: JSON.stringify({
            ...totpPendingAction.payload,
            totpCode: trimmedCode,
          }),
        });

        setPassword('');
        setUsername('');
        setDisplayName('');
        setEmail('');
        setRole('SUPPORT_TEAM');
        if (createResponse?.emailDelivery === 'failed') {
          showFeedback(
            createResponse?.emailWarning || 'Admin created, but credential email failed to send.',
            'info'
          );
        } else {
          showFeedback('Admin account created and credentials emailed successfully', 'success');
        }
      } else {
        await apiRequest(`/admins/${totpPendingAction.admin.id}`, {
          method: 'DELETE',
          body: JSON.stringify({ totpCode: trimmedCode }),
        });

        showFeedback('Admin account deleted successfully', 'success');
      }

      await loadAdmins();
      closeTotpModal();
    } catch (error) {
      showCenteredFailure(error instanceof Error ? error.message : 'Action failed');
      setTotpSubmitting(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8 text-sm text-gray-600 dark:text-gray-300">
        Loading admin management...
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Only Super Admin can create admin accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create or delete admin accounts. TOTP is requested in a popup when you confirm the action.
          </p>
        </div>
        <button
          onClick={loadAdmins}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            <ShieldPlus className="w-4 h-4 inline mr-2" />
            Add New Admin
          </h2>

          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Display name (optional)"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Admin email (required)"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          >
            {roleOptions.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Temporary password"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Password must be 10+ chars with uppercase, lowercase, number, and special character.
          </p>

          <button
            onClick={handleCreateAdmin}
            disabled={submitting || !username.trim() || !email.trim() || !password.trim()}
            className="w-full px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Admin (TOTP)'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
            <Users className="w-4 h-4 inline mr-2" />
            Active Admins
          </h2>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="border border-gray-200 dark:border-slate-700 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {admin.displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{admin.username} | {admin.role}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{admin.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        admin.isBlocked
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}
                    >
                      {admin.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAdmin(admin)}
                      disabled={
                        totpSubmitting ||
                        deletingAdminId === admin.id ||
                        sessionUser?.id === admin.id
                      }
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                      title={sessionUser?.id === admin.id ? 'You cannot delete your own account' : 'Delete admin'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingAdminId === admin.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {admins.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No admin accounts found.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Logged in as <span className="font-semibold">{sessionUser?.name || sessionUser?.username}</span> (
          {sessionUser?.role}) <UserCog className="w-4 h-4 inline ml-1" />
        </p>
      </div>

      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />

      {showCenterFailMessage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
          <div className="max-w-md mx-4 px-6 py-4 rounded-xl bg-red-600/95 text-white text-sm font-medium shadow-2xl border border-red-400">
            {centerFailMessage}
          </div>
        </div>
      )}

      {totpPendingAction && (
        <div className="fixed inset-0 z-[65] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Enter TOTP Code
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {totpPendingAction.type === 'create'
                ? 'Enter your 6-digit authenticator code to create this admin.'
                : `Enter your 6-digit authenticator code to delete @${totpPendingAction.admin.username}.`}
            </p>

            <input
              autoFocus
              value={totpCode}
              onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="------"
              title="Enter the current 6-digit code from your authenticator app"
              className="w-full px-4 py-3 text-center tracking-[0.35em] rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Hover hint: use the latest 6-digit code from Google Authenticator.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeTotpModal}
                disabled={totpSubmitting}
                className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTotpAction}
                disabled={totpSubmitting || totpCode.trim().length < 6}
                className="px-4 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                {totpSubmitting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
