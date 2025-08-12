'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getDoctorRedirectPath } from '@/lib/doctorRedirect';

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
    if (role === 'doctor' && (verificationLoading || verificationStatus === null)) {
      return;
    }

    // Only apply verification guard to doctors
    if (role !== 'doctor') {
      return;
    }

    // Handle verification page access based on status
    if (pathname.startsWith('/Doctor/verification')) {
      const isMainVerificationPage = pathname === '/Doctor/verification';
      const isPendingPage = pathname === '/Doctor/verification/pending';
      const isRejectedPage = pathname === '/Doctor/verification/rejected';
      
      // Check if user is on the correct verification page for their status
      const isOnCorrectPage = 
        (isMainVerificationPage && (verificationStatus === 'not-submitted' || verificationStatus === 'rejected')) ||
        (isPendingPage && verificationStatus === 'pending') ||
        (isRejectedPage && verificationStatus === 'rejected');
      
      if (isOnCorrectPage) {
        return; // User is on correct page, no redirect needed
      }
      
      // Redirect to correct verification page based on status
      router.push(getDoctorRedirectPath(verificationStatus));
      return;
    }

    // For approved doctors, allow access to all doctor routes except verification pages
    if (verificationStatus === 'approved') {
      return; // No redirect needed for approved doctors on doctor routes
    }

    // For non-approved doctors on non-verification pages, redirect to appropriate verification page
    router.push(getDoctorRedirectPath(verificationStatus));
  }, [user, verificationStatus, loading, verificationLoading, role, pathname, router]);

  // Centralized loading component
  const LoadingScreen = ({ message }: { message: string }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );

  // Show loading while checking auth status, role, or verification status
  if (loading || !user || !role) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // Show loading if verification status is being checked for doctors
  if (role === 'doctor' && (verificationLoading || verificationStatus === null)) {
    return <LoadingScreen message="Loading verification status..." />;
  }

  // For non-doctors, always render children
  if (role !== 'doctor') {
    return <>{children}</>;
  }

  // For approved doctors, allow access to all doctor routes
  if (verificationStatus === 'approved') {
    return <>{children}</>;
  }

  // For non-approved doctors on verification pages, check if they're on the correct page
  if (pathname.startsWith('/Doctor/verification')) {
    const isOnCorrectPage = 
      (pathname === '/Doctor/verification' && (verificationStatus === 'not-submitted' || verificationStatus === 'rejected')) ||
      (pathname === '/Doctor/verification/pending' && verificationStatus === 'pending') ||
      (pathname === '/Doctor/verification/rejected' && verificationStatus === 'rejected');
    
    if (isOnCorrectPage) {
      return <>{children}</>;
    }
  }

  // Show loading while redirect is happening for non-approved doctors
  return <LoadingScreen message="Redirecting..." />;
}
