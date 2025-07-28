'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { getDoctorRedirectPath } from '../lib/doctorRedirect';

export default function Home() {
  const { user, role, loading, roleLoading, verificationStatus, verificationLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to be fully initialized
    if (loading) {
      console.log("[Root] Auth still loading...");
      return;
    }
    
    if (!user) {
      // User is not authenticated
      console.log("[Root] No user, redirecting to landing page");
      router.replace('/landing-page');
      return;
    }

    // User is authenticated - handle role-based routing
    if (roleLoading) {
      console.log("[Root] Role still loading...");
      return;
    }

    if (role === 'doctor') {
      // Wait for verification status before redirecting doctors
      if (verificationLoading) {
        console.log("[Root] Verification status loading...");
        return;
      }
      
      console.log("[Root] Redirecting doctor based on verification status");
      router.replace(getDoctorRedirectPath(verificationStatus));
    } else if (role === 'patient') {
      console.log("[Root] Redirecting to Patient dashboard");
      router.replace('/Patient/dashboard');
    } else if (role === 'no-role' || role === null) {
      // User is authenticated but has no role
      console.log("[Root] User has no role, redirecting to select-role");
      router.replace('/select-role');
    }
  }, [user, role, loading, roleLoading, verificationStatus, verificationLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
