'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { APP_CONFIG } from '@/lib/config/appConfig';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'email_verified') {
      setStatus('success');
      setMessage('Your email has been verified successfully!');
      // Refresh auth state if user is logged in on this device
      if (user) {
        user.reload().then(() => user.getIdToken(true)).catch(() => {});
      }
      // Auto-redirect after delay
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } else if (success === 'otp_verified') {
      // Password reset OTP verified via magic link — redirect to set new password
      const email = searchParams.get('email') || '';
      const code = searchParams.get('code') || '';
      setStatus('success');
      setMessage('Code verified! Redirecting to set your new password...');
      setTimeout(() => {
        router.push(`/auth?reset=true&email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
      }, 2000);
    } else if (error) {
      setStatus('error');
      const errorType = searchParams.get('type');
      switch (error) {
        case 'missing_params':
          setMessage('Invalid verification link. Please request a new code.');
          break;
        case 'invalid_type':
          setMessage('Invalid verification type.');
          break;
        case 'invalid_code':
          setMessage(
            errorType === 'PASSWORD_RESET'
              ? 'This reset link has expired or already been used. Please request a new code.'
              : 'This verification link has expired or already been used. Please request a new code.'
          );
          break;
        case 'server_error':
          setMessage('Something went wrong. Please try again later.');
          break;
        default:
          setMessage('Verification failed. Please try again.');
      }
    } else {
      setStatus('error');
      setMessage('Invalid verification link.');
    }
  }, [searchParams, router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 space-y-6 border border-gray-200 dark:border-slate-700 text-center">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-1">
            <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={64} height={64} className="object-contain" />
            <div className="text-center">
              <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400 tracking-wide">TABEEB</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-0.5">Healthcare Platform</p>
            </div>
          </div>

          {status === 'loading' && (
            <div className="space-y-4 py-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
              <p className="text-gray-600 dark:text-gray-400">Verifying...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Success!</h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Redirecting automatically...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verification Failed</h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <a
                href="/auth"
                className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Back to Sign In
              </a>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; 2025 TABEEB Healthcare Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
