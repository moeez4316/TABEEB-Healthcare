'use client';
import { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Loader2, CheckCircle, AlertTriangle, Eye, EyeOff, Phone, ArrowLeft } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import Image from 'next/image';

import { useAuth } from '../../lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { APP_CONFIG } from '@/lib/config/appConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

// ========================================
// OTP Input Component — 6 individual digit boxes
// ========================================
function OtpInput({ value, onChange, length = 6, autoFocus = true }: { value: string; onChange: (val: string) => void; length?: number; autoFocus?: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return;
    const chars = value.padEnd(length, ' ').split('');
    chars[index] = digit || ' ';
    const result = chars.join('').replace(/\s+$/, '');
    onChange(result);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        e.preventDefault();
        const chars = value.padEnd(length, ' ').split('');
        chars[index - 1] = ' ';
        onChange(chars.join('').replace(/\s+$/, ''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={autoFocus && i === 0}
          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        />
      ))}
    </div>
  );
}

type AuthMode = 'signin' | 'signup' | 'reset';
type ResetStep = 'method' | 'email-input' | 'phone-input' | 'otp' | 'new-password' | 'success';

export default function AuthPage() {
  // Use react-phone-number-input for country code and phone input
  const [fullPhone, setFullPhone] = useState('');
  // Remove top toggle, default to phone sign in, allow switching to email sign in via link
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('phone');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPhonePassword, setShowPhonePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, signUp, signIn, signInWithGoogle, signUpWithPhone, signInWithPhonePassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Password reset state
  const [resetStep, setResetStep] = useState<ResetStep>('method');
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetPhoneEmail, setResetPhoneEmail] = useState(''); // Real email for phone users
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification state (after signup)
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyOtpCode, setVerifyOtpCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    // Check if user was redirected due to deactivated account
    if (searchParams.get('deactivated') === 'true') {
      setError('Your account has been deactivated. Please contact support if you believe this is an error.');
    } else if (searchParams.get('deleted') === 'true') {
      setSuccess('Your account has been successfully deleted.');
    } else if (searchParams.get('reset') === 'true') {
      // Coming from magic link — OTP already verified, jump to new password step
      const resetEmailParam = searchParams.get('email') || '';
      const resetCodeParam = searchParams.get('code') || '';
      setMode('reset');
      setResetMethod('email');
      setResetEmail(resetEmailParam);
      setOtpCode(resetCodeParam);
      setResetStep('new-password');
      setSuccess('Code verified! Set your new password.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      // Skip verification check for phone users (fake email) and Google OAuth users (already verified)
      const isPhoneUser = user.email?.endsWith('@tabeeb.phone');
      const isGoogleUser = user.providerData?.some(p => p.providerId === 'google.com');
      if (!user.emailVerified && !isPhoneUser && !isGoogleUser) {
        // Email user hasn't verified yet — show verification screen
        setVerifyEmail(user.email || '');
        setShowEmailVerify(true);
        return;
      }
      router.replace('/'); // Let root page handle role-based redirect
    }
  }, [user, router]);

  const getFirebaseErrorMessage = (error: unknown): string => {
    if (!(error instanceof Error)) return 'An unexpected error occurred';
    const errorCode = (error as { code?: string })?.code;
    if (typeof errorCode === 'string' && errorCode.startsWith('auth/')) {
      return errorCode;
    }
    return error.message || 'An unexpected error occurred';
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      if (mode === 'signup') {
        await signUp(email, password, '');
        // Send verification OTP
        try {
          await fetch(`${API_URL}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, type: 'EMAIL_VERIFY' }),
          });
        } catch {
          // Non-critical, user can resend from verification screen
        }
        setVerifyEmail(email);
        setShowEmailVerify(true);
        setSuccess('Account created! Please verify your email.');
      } else {
        await signIn(email, password);
        // Redirect will happen via useEffect when user state updates
      }
    } catch (error) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate phone number and password
    if (!fullPhone || !isValidPhoneNumber(fullPhone)) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (!phonePassword.trim()) {
      setError('Please enter a password.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (mode === 'signup') {
        await signUpWithPhone(fullPhone, phonePassword);
        setSuccess('Account created successfully!');
      } else {
        await signInWithPhonePassword(fullPhone, phonePassword);
        setSuccess('Signed in successfully!');
      }
    } catch (error) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      if (resetMethod === 'email') {
        // Email user: send OTP to their email
        const res = await fetch(`${API_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, type: 'PASSWORD_RESET' }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to send reset code.');
          return;
        }
        setSuccess('Verification code sent to your email.');
        setResetStep('otp');
      } else {
        // Phone user: send OTP to their real email
        if (!resetPhone || !isValidPhoneNumber(resetPhone)) {
          setError('Please enter a valid phone number.');
          return;
        }
        if (!resetPhoneEmail.trim()) {
          setError('Please enter your email address.');
          return;
        }
        const res = await fetch(`${API_URL}/api/auth/phone/send-reset-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: resetPhone, email: resetPhoneEmail }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to send reset code.');
          return;
        }
        setSuccess('If a matching account exists, a reset code has been sent to your email.');
        setResetStep('otp');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }
    // OTP will be verified together with password reset
    setError('');
    setSuccess('');
    setResetStep('new-password');
  };

  const handleSetNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let res;
      if (resetMethod === 'email') {
        res = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, code: otpCode, newPassword }),
        });
      } else {
        res = await fetch(`${API_URL}/api/auth/phone/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: resetPhone, code: otpCode, newPassword, email: resetPhoneEmail }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        // If OTP was invalid, go back to OTP step
        if (data.error?.toLowerCase().includes('otp') || data.error?.toLowerCase().includes('expired') || data.error?.toLowerCase().includes('invalid')) {
          setResetStep('otp');
          setOtpCode('');
        }
        setError(data.error || 'Failed to reset password.');
        return;
      }

      setResetStep('success');
      setSuccess('Password reset successfully! You can now sign in.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google') => {
    try {
      setLoading(true);
      setError('');
      
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          // Redirect will happen via useEffect when user state updates
          break;
      }
    } catch (error) {
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    // Only clear error/success messages, keep user input
    setError('');
    setSuccess('');
    // Reset password flow state
    if (newMode === 'reset') {
      setResetStep('method');
      setResetEmail('');
      setResetPhone('');
      setResetPhoneEmail('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // ========================================
  // EMAIL VERIFICATION SCREEN (after signup or unverified sign-in)
  // ========================================

  const handleSendVerifyOtp = async () => {
    try {
      setVerifyLoading(true);
      setError('');
      setSuccess('');
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, type: 'EMAIL_VERIFY' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send verification code.');
        return;
      }
      setError('');
      setSuccess('Verification code sent to your email.');
    } catch {
      setSuccess('');
      setError('Network error. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (verifyOtpCode.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }
    try {
      setVerifyLoading(true);
      setError('');
      setSuccess('');
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, code: verifyOtpCode, type: 'EMAIL_VERIFY' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid verification code.');
        return;
      }
      // OTP verified on backend — emailVerified is now true in Firebase Admin
      // Refresh client-side auth state to pick up the change
      if (user) {
        try {
          await user.reload(); // Updates user.emailVerified locally
          await user.getIdToken(true); // Refreshes the auth token
        } catch {
          // Even if refresh fails, verification succeeded on the backend
          // Full page reload below will trigger onAuthStateChanged with fresh state
        }
      }
      // Force full page reload to get fresh auth state
      window.location.href = '/';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (showEmailVerify) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Verify Your Email</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the 6-digit code sent to <strong>{verifyEmail}</strong>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-6 border border-gray-200 dark:border-slate-700">
            <div className="flex flex-col items-center space-y-1">
              <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={64} height={64} className="object-contain" />
              <div className="text-center">
                <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400 tracking-wide">TABEEB</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-0.5">Healthcare Platform</p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <OtpInput value={verifyOtpCode} onChange={setVerifyOtpCode} />
              <button
                type="submit"
                disabled={verifyLoading || verifyOtpCode.length !== 6}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Email'}
              </button>
            </form>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleSendVerifyOtp}
                disabled={verifyLoading}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
              >
                Resend verification code
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              &copy; 2025 TABEEB Healthcare Platform. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reset Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {resetStep === 'method' && 'Choose how you signed up'}
              {resetStep === 'email-input' && 'Enter your email to receive a reset code'}
              {resetStep === 'phone-input' && 'Enter your phone number and email'}
              {resetStep === 'otp' && 'Enter the 6-digit code sent to your email'}
              {resetStep === 'new-password' && 'Set your new password'}
              {resetStep === 'success' && 'Your password has been reset'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-6 border border-gray-200 dark:border-slate-700">
            {/* TABEEB Logo */}
            <div className="flex flex-col items-center space-y-1">
              <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={64} height={64} className="object-contain" />
              <div className="text-center">
                <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400 tracking-wide">TABEEB</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-0.5">Healthcare Platform</p>
              </div>
            </div>

            {/* Progress indicator */}
            {resetStep !== 'method' && resetStep !== 'success' && (
              <div className="flex items-center justify-center space-x-2">
                {['email-input', 'otp', 'new-password'].map((step, i) => {
                  const steps = resetMethod === 'email' 
                    ? ['email-input', 'otp', 'new-password'] 
                    : ['phone-input', 'otp', 'new-password'];
                  const currentIndex = steps.indexOf(resetStep);
                  const stepIndex = resetMethod === 'phone' && step === 'email-input' ? -1 : i;
                  const activeStep = resetMethod === 'phone' && i === 0 ? steps.indexOf('phone-input') <= currentIndex : stepIndex <= currentIndex;
                  return (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${activeStep ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-gray-400'}`}>
                        {i + 1}
                      </div>
                      {i < 2 && <div className={`w-8 h-0.5 ${activeStep && i < currentIndex ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'}`} />}
                    </div>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
              </div>
            )}

            {/* Step 1: Choose method */}
            {resetStep === 'method' && (
              <div className="space-y-3">
                <button
                  onClick={() => { setResetMethod('email'); setResetStep('email-input'); setError(''); setSuccess(''); }}
                  className="w-full flex items-center px-4 py-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
                >
                  <Mail className="h-5 w-5 text-blue-500 mr-3" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">I signed up with Email</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reset code will be sent to your email</p>
                  </div>
                </button>
                <button
                  onClick={() => { setResetMethod('phone'); setResetStep('phone-input'); setError(''); setSuccess(''); }}
                  className="w-full flex items-center px-4 py-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
                >
                  <Phone className="h-5 w-5 text-green-500 mr-3" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">I signed up with Phone</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reset code will be sent to your profile email</p>
                  </div>
                </button>
              </div>
            )}

            {/* Step 2a: Email input */}
            {resetStep === 'email-input' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email address"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !resetEmail.trim()}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setResetStep('method'); setError(''); setSuccess(''); }}
                  className="w-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </button>
              </form>
            )}

            {/* Step 2b: Phone input */}
            {resetStep === 'phone-input' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="relative">
                  <PhoneInput
                    international
                    defaultCountry="PK"
                    value={resetPhone}
                    onChange={value => setResetPhone(value || '')}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={resetPhoneEmail}
                    onChange={(e) => setResetPhoneEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Email address on your profile"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  The reset code will be sent to the email address linked to your profile.
                </p>
                <button
                  type="submit"
                  disabled={loading || !resetPhone || !resetPhoneEmail.trim()}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setResetStep('method'); setError(''); setSuccess(''); }}
                  className="w-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </button>
              </form>
            )}

            {/* Step 3: OTP input */}
            {resetStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    We sent a 6-digit code to <strong>{resetMethod === 'email' ? resetEmail : resetPhoneEmail}</strong>
                  </p>
                </div>
                <OtpInput value={otpCode} onChange={setOtpCode} />
                <button
                  type="submit"
                  disabled={otpCode.length !== 6}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify Code
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setResetStep(resetMethod === 'email' ? 'email-input' : 'phone-input'); 
                    setOtpCode(''); 
                    setError(''); 
                    setSuccess(''); 
                  }}
                  className="w-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Resend Code
                </button>
              </form>
            )}

            {/* Step 4: New password */}
            {resetStep === 'new-password' && (
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="New password (min 6 characters)"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {showNewPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm new password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match.</p>
                )}
                <button
                  type="submit"
                  disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset Password'}
                </button>
              </form>
            )}

            {/* Step 5: Success */}
            {resetStep === 'success' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <p className="text-gray-700 dark:text-gray-300">Your password has been reset successfully.</p>
                <button
                  onClick={() => switchMode('signin')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Sign In
                </button>
              </div>
            )}

            {resetStep !== 'success' && (
              <button
                onClick={() => switchMode('signin')}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Back to Sign In
              </button>
            )}
          </div>

          {/* Footer Branding */}
          <div className="text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              &copy; 2025 TABEEB Healthcare Platform. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {mode === 'signup' 
              ? 'Join TABEEB to access healthcare services'
              : 'Sign in to your TABEEB account to continue'
            }
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-6 border border-gray-200 dark:border-slate-700">
          {/* No top toggle, default to phone sign in, allow switching to email sign in via link at bottom */}
          {/* TABEEB Logo - Inside the card */}
          <div className="flex flex-col items-center space-y-1">
            <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={64} height={64} className="object-contain" />
            <div className="text-center">
              <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                TABEEB
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-0.5">
                Healthcare Platform
              </p>
            </div>
          </div>

          {/* Mode Switcher */}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
              </div>
            </div>
          )}

          {/* OAuth Providers */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaGoogle className="h-5 w-5 mr-3 text-red-500" />
              Continue with Google
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Only show phone sign in by default, with link to switch to email sign in */}
          {authMethod === 'phone' ? (
            <form onSubmit={handlePhoneAuth} className="space-y-4">
              <div className="relative">
                <PhoneInput
                  international
                  defaultCountry="PK"
                  value={fullPhone}
                  onChange={value => setFullPhone(value || '')}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type={showPhonePassword ? 'text' : 'password'}
                  required
                  value={phonePassword}
                  onChange={(e) => setPhonePassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPhonePassword(!showPhonePassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPhonePassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || !fullPhone || !isValidPhoneNumber(fullPhone) || !phonePassword.trim()}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  mode === 'signup' ? 'Sign Up with Phone' : 'Sign In with Phone'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  mode === 'signup' ? 'Sign Up with Email' : 'Sign In with Email'
                )}
              </button>
            </form>
          )}


          {mode === 'signin' && (
            <div>
              {/* Show 'Forgot your password?' for both email and phone */}
              <button
                onClick={() => switchMode('reset')}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-2"
              >
                Forgot your password?
              </button>
              {/* Link to switch between phone and email sign in */}
              <div className="text-center mt-2">
                {authMethod === 'phone' ? (
                  <button
                    type="button"
                    onClick={() => setAuthMethod('email')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Sign in with Email instead
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthMethod('phone')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Continue with Phone instead
                  </button>
                )}
              </div>
              {/* Show Sign up option for both phone and email */}
              <div className="text-center mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Don&apos;t have an account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-1"
                >
                  Sign up
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="text-center mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Already have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                Sign in
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            By {mode === 'signup' ? 'creating an account' : 'signing in'}, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* Footer Branding */}
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © 2025 TABEEB Healthcare Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
