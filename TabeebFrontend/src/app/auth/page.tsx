'use client';
import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import Image from 'next/image';

import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import type { ConfirmationResult } from 'firebase/auth';

type AuthMode = 'signin' | 'signup' | 'reset';

declare global {
  interface Window {
    recaptchaVerifier?: import('firebase/auth').ApplicationVerifier;
  }
}

export default function AuthPage() {
  // Use react-phone-number-input for country code and phone input
  const [fullPhone, setFullPhone] = useState('');
  // Use dynamic import for firebase auth
  const [firebaseAuth, setFirebaseAuth] = useState<null | typeof import('../../lib/firebase').auth>(null);
  useEffect(() => {
    import('../../lib/firebase').then(mod => setFirebaseAuth(mod.auth));
  }, []);
  // Remove top toggle, default to phone sign in, allow switching to email sign in via link
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('phone');
  // Removed unused phone and setPhone
  const [otp, setOtp] = useState('');
  // Use a more specific type for confirmationResult
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, signUp, signIn, signInWithGoogle, resetPassword, signInWithPhone, verifyPhoneOtp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
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
        setSuccess('Account created successfully!');
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
    // Validate phone number before reCAPTCHA
    if (!fullPhone || !isValidPhoneNumber(fullPhone)) {
      setError('Please enter a valid phone number.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      // Ensure recaptcha container exists before initializing
      const recaptchaElem = document.getElementById('recaptcha-container');
      if (!recaptchaElem) {
        setError('reCAPTCHA container not found. Please reload the page and try again.');
        setLoading(false);
        return;
      }
      // Only initialize if not already present
      if (!window.recaptchaVerifier) {
        const { RecaptchaVerifier } = await import('firebase/auth');
        if (firebaseAuth) {
          window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
            size: 'invisible',
          });
        }
      }
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) {
        setError('Failed to initialize reCAPTCHA. Please reload and try again.');
        setLoading(false);
        return;
      }
      const result = await signInWithPhone(fullPhone, appVerifier);
      setConfirmationResult(result);
      setSuccess('OTP sent to your phone');
    } catch (error) {
      // Handle Firebase invalid phone error gracefully
      if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'auth/invalid-phone-number') {
        setError('The phone number is too short or invalid. Please check and try again.');
      } else {
        setError((error instanceof Error ? error.message : 'Failed to send OTP'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp.trim() || !confirmationResult) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await verifyPhoneOtp(confirmationResult, otp);
      setSuccess('Phone verified and signed in!');
    } catch (error) {
      setError((error instanceof Error ? error.message : 'OTP verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await resetPassword(email);
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (error) {
      setError(getFirebaseErrorMessage(error));
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

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
    setShowPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  if (mode === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reset Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your email address and we&apos;ll send you a reset link
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-6 border border-gray-200 dark:border-slate-700">
            {/* TABEEB Logo - Inside the card */}
            <div className="flex flex-col items-center space-y-1">
              <Image src="/tabeeb_logo.png" alt="TABEEB Logo" width={64} height={64} className="object-contain" />
              <div className="text-center">
                <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                  TABEEB
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-0.5">
                  Healthcare Platform
                </p>
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

            <form onSubmit={handlePasswordReset} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <button
              onClick={() => switchMode('signin')}
              className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Back to Sign In
            </button>
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
            <Image src="/tabeeb_logo.png" alt="TABEEB Logo" width={64} height={64} className="object-contain" />
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
            <form onSubmit={confirmationResult ? handleVerifyOtp : handlePhoneAuth} className="space-y-4">
              <div className="relative">
                <PhoneInput
                  international
                  defaultCountry="PK"
                  value={fullPhone}
                  onChange={value => setFullPhone(value || '')}
                  disabled={!!confirmationResult}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter phone number"
                />
              </div>
              {confirmationResult !== null && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter OTP"
                  />
                </div>
              )}
              <div id="recaptcha-container"></div>
              <button
                type="submit"
                disabled={loading || (confirmationResult === null && !isValidPhoneNumber(fullPhone)) || (confirmationResult !== null && !otp.trim())}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  confirmationResult ? 'Verify OTP' : 'Continue with Phone'
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
              {/* Only show 'Forgot your password?' on email sign in screen */}
              {authMethod === 'email' && (
                <button
                  onClick={() => switchMode('reset')}
                  className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-2"
                >
                  Forgot your password?
                </button>
              )}
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
              {/* Only show Sign up option on email sign in screen */}
              {authMethod === 'email' && (
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
              )}
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
