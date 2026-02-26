'use client';

import { ReactNode } from 'react';

interface AdminPageShellProps {
  children: ReactNode;
  className?: string;
}

export default function AdminPageShell({ children, className = '' }: AdminPageShellProps) {
  return (
    <div className={`px-4 py-8 sm:px-6 lg:px-10 ${className}`}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </div>
  );
}
