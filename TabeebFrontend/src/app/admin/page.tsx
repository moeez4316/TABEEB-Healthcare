'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminHomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is already logged in
    const adminToken = localStorage.getItem('adminToken');
    
    if (adminToken) {
      // Redirect to dashboard if already logged in
      router.push('/admin/dashboard');
    } else {
      // Redirect to login if not logged in
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-teal-200 dark:border-teal-800 opacity-20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loading Admin Panel</h3>
        <p className="text-slate-600 dark:text-slate-300">Redirecting you to the admin dashboard...</p>
      </div>
    </div>
  );
}
