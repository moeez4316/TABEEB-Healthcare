'use client';

import { Loader2 } from 'lucide-react';

interface AdminLoadingProps {
  title?: string;
  subtitle?: string;
  variant?: 'page' | 'section';
}

export default function AdminLoading({
  title = 'Loading',
  subtitle = 'Preparing admin console...',
  variant = 'page',
}: AdminLoadingProps) {
  const containerClass =
    variant === 'section'
      ? 'w-full py-16 flex items-center justify-center'
      : 'min-h-[70vh] w-full flex items-center justify-center';

  return (
    <div className={containerClass}>
      <div className="relative flex flex-col items-center text-center max-w-md">
        <div className="relative w-16 h-16 mb-5">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-500/20 via-emerald-500/20 to-sky-500/20 blur-lg" />
          <div className="absolute inset-0 rounded-full border border-teal-500/30" />
          <div className="absolute inset-2 rounded-full border border-emerald-400/50 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400 mb-2">
          Admin Console
        </p>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
      </div>
    </div>
  );
}
