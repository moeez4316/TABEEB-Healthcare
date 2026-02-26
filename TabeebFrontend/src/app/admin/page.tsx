'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLoading from '@/components/admin/AdminLoading';

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
    <AdminLoading
      title="Loading Admin Panel"
      subtitle="Redirecting you to the admin workspace..."
    />
  );
}
