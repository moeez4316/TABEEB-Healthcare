'use client';

import { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

export default function AdminPageHeader({
  title,
  subtitle,
  eyebrow = 'Admin Workspace',
  actions,
  meta,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/70 dark:border-slate-700/70 pb-6 mb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400 mb-3">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {meta && <div className="flex flex-wrap items-center gap-3">{meta}</div>}
    </div>
  );
}
