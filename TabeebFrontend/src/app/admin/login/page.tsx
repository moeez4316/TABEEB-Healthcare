'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Home,
  KeyRound,
} from 'lucide-react';

interface LoginResponse {
  token: string;
  mustChangePassword?: boolean;
  admin: {
    id: string;
    username: string;
    name: string;
    role: string;
    email: string;
    mustChangePassword?: boolean;
  };
  permissions: string[];
}

interface TotpSetupPayload {
  issuer: string;
  accountName: string;
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);
  const [totpSetup, setTotpSetup] = useState<TotpSetupPayload | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const requiresPasswordChange = (payload: LoginResponse) =>
    Boolean(payload.mustChangePassword || payload.admin?.mustChangePassword);

  const persistSession = (payload: LoginResponse) => {
    localStorage.setItem('adminToken', payload.token);
    localStorage.setItem(
      'adminUser',
      JSON.stringify({
        id: payload.admin.id,
        username: payload.admin.username,
        name: payload.admin.name || payload.admin.username,
        role: payload.admin.role,
        email: payload.admin.email,
        permissions: payload.permissions || [],
        mustChangePassword: requiresPasswordChange(payload),
      })
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handlePrimaryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.status === 202 && data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setChallengeToken(data.challengeToken);
        setSetupRequired(Boolean(data.setupRequired));
        setTotpSetup(data.setup || null);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      persistSession(data);
      if (requiresPasswordChange(data)) {
        router.push('/admin/change-password');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/login/verify-2fa`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeToken,
          code: twoFactorCode.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '2FA verification failed');
      }

      persistSession(data);
      if (requiresPasswordChange(data)) {
        router.push('/admin/change-password');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '2FA verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resetTwoFactor = () => {
    setRequiresTwoFactor(false);
    setChallengeToken('');
    setTwoFactorCode('');
    setSetupRequired(false);
    setTotpSetup(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl mb-6 shadow-lg">
            {requiresTwoFactor ? (
              <KeyRound className="w-8 h-8 text-white" />
            ) : (
              <Shield className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {requiresTwoFactor ? 'Two-Factor Verification' : 'Admin Access'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {requiresTwoFactor
              ? 'Enter the 6-digit code from your Google Authenticator app'
              : 'Secure login to administrative dashboard'}
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-xl p-8 mb-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {!requiresTwoFactor ? (
            <form onSubmit={handlePrimaryLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Username or Official Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="Enter username or @tabeebemail.me address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyTwoFactor} className="space-y-5">
              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4">
                <div className="text-sm text-teal-800 dark:text-teal-200">
                  <p className="font-semibold">
                    {setupRequired ? 'Authenticator setup required' : 'Authenticator verification required'}
                  </p>
                  <p>Use your TOTP app (Google Authenticator) to generate a 6-digit code.</p>
                </div>
              </div>

              {setupRequired && totpSetup && (
                <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    Step 1: Scan this QR in Google Authenticator
                  </p>
                  <div className="flex justify-center mb-3">
                    <img
                      src={totpSetup.qrCodeUrl}
                      alt="TOTP QR code"
                      className="w-40 h-40 rounded-lg border border-slate-200 dark:border-slate-600 bg-white p-1"
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 break-all">
                    Secret: <span className="font-mono font-semibold">{totpSetup.secret}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 break-all">
                    Account: <span className="font-mono">{totpSetup.accountName}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 break-all">
                    Issuer: <span className="font-mono">{totpSetup.issuer}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Step 2: Enter the generated 6-digit code below to complete setup.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Authenticator code
                </label>
                <input
                  id="twoFactorCode"
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 text-center text-lg tracking-[0.4em] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="------"
                />
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.trim().length < 6}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify and Continue'}
              </button>

              <button
                type="button"
                onClick={resetTwoFactor}
                className="w-full text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                Use different credentials
              </button>
            </form>
          )}

          <div className="mt-6">
            <button
              onClick={() => router.push('/landing-page')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
