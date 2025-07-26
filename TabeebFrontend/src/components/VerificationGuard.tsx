'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface VerificationGuardProps {
  children: React.ReactNode;
}

export default function VerificationGuard({ children }: VerificationGuardProps) {
  const { user, verificationStatus, loading, verificationLoading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !user || !role) return;

    // Wait for verification status to be loaded for doctors
    if (role === 'doctor' && verificationLoading) {
      console.log('[VerificationGuard] Still loading verification status, waiting...');
      return;
    }

    console.log('[VerificationGuard] Current status:', verificationStatus);
    console.log('[VerificationGuard] Current pathname:', pathname);
    console.log('[VerificationGuard] User role:', role);

    // Only apply verification guard to doctors
    if (role !== 'doctor') {
      console.log('[VerificationGuard] User is not a doctor, allowing access');
      return;
    }

    // Don't redirect if already on verification pages
    if (pathname.startsWith('/Doctor/verification')) {
      console.log('[VerificationGuard] Already on verification page, no redirect needed');
      return;
    }

    // Only redirect if we have a definitive status
    if (verificationStatus === null) {
      console.log('[VerificationGuard] Verification status is null, waiting...');
      return;
    }

    // Redirect based on verification status
    switch (verificationStatus) {
      case 'not-submitted':
        console.log('[VerificationGuard] Redirecting to verification upload');
        router.push('/Doctor/verification');
        break;
      case 'pending':
        console.log('[VerificationGuard] Redirecting to pending page');
        router.push('/Doctor/verification/pending');
        break;
      case 'rejected':
        console.log('[VerificationGuard] Redirecting to rejected page');
        router.push('/Doctor/verification/rejected');
        break;
      case 'approved':
        console.log('[VerificationGuard] User is verified, allowing access');
        // Allow access to all doctor pages
        break;
      default:
        console.log('[VerificationGuard] Unknown status:', verificationStatus, 'redirecting to verification');
        // Unknown status, redirect to verification
        router.push('/Doctor/verification');
        break;
    }
  }, [user, verificationStatus, loading, verificationLoading, role, pathname, router]);

  // Show loading while checking auth status, role, or verification status
  if (loading || !user || !role || (role === 'doctor' && verificationLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  // Show loading if verification status is being checked for doctors
  if (role === 'doctor' && !verificationStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Only render children if:
  // 1. User is not a doctor (no verification needed), OR
  // 2. User is a doctor with approved verification, OR  
  // 3. User is on verification pages (to allow navigation within verification flow)
  if (role !== 'doctor' || verificationStatus === 'approved' || pathname.startsWith('/Doctor/verification')) {
    return <>{children}</>;
  }

  // Show loading while redirect is happening
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
