'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { APP_CONFIG } from '@/lib/config/appConfig';

interface AdminAuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  sideContent?: ReactNode;
}

export default function AdminAuthShell({
  title,
  subtitle,
  children,
  sideContent,
}: AdminAuthShellProps) {
  return (
    <div className="relative min-h-screen bg-[#f6f4ef] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(14,116,144,0.12),_transparent_45%)] opacity-70 dark:opacity-40" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:flex flex-col gap-6">
          {sideContent ?? (
            <>
              <div className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <Image
                    src={APP_CONFIG.ASSETS.LOGO}
                    alt="TABEEB"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">TABEEB</p>
                  <h2 className="text-2xl font-semibold">Admin Suite</h2>
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold leading-tight">{title}</h1>
                <p className="text-base text-slate-600 dark:text-slate-300">{subtitle}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/60 p-6 backdrop-blur">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Secure administrative access with enforced two-factor authentication,
                  role-based permissions, and session monitoring.
                </p>
              </div>
            </>
          )}
        </div>
        <div className="w-full max-w-lg justify-self-center lg:justify-self-end">
          <div className="rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
