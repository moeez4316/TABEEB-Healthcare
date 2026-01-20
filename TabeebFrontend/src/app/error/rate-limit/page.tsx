'use client';

import { Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function RateLimitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const retryAfter = searchParams.get('retry') || '1 minute';
  const returnTo = searchParams.get('return') || '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-amber-200 dark:border-amber-800">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Slow Down
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          You&apos;ve made too many requests. Please wait before trying again.
        </p>
        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-6">
          Try again in: {retryAfter}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <button
            onClick={() => router.push(returnTo)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
          This limit helps protect our service. If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}

export default function RateLimitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <RateLimitContent />
    </Suspense>
  );
}
