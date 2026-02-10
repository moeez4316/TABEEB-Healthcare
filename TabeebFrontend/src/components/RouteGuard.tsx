'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { getDoctorRedirectPath } from '@/lib/doctorRedirect';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
  requireRole?: boolean;
}

export default function RouteGuard({ 
  children, 
  requireAuth = false, 
  redirectTo,
  allowedRoles = [],
  requireRole = true
}: RouteGuardProps) {
  const { user, role, loading, roleLoading, verificationStatus, verificationLoading, backendError, clearBackendError, fetchUserRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to be fully loaded
    if (loading) {
      console.log("[RouteGuard] Auth loading...");
      return;
    }

    // Don't redirect if there's a backend error - we'll show an error UI instead
    if (backendError) {
      console.log("[RouteGuard] Backend error, not redirecting");
      return;
    }

    // Check authentication first
    if (requireAuth && !user) {
      console.log("[RouteGuard] Redirecting unauthenticated user to /auth");
      router.replace('/auth');
      return;
    } 
    
    if (!requireAuth && user && redirectTo) {
      // Don't redirect email users who haven't verified yet — let auth page show verification screen
      const isPhoneUser = user.email?.endsWith('@tabeeb.phone');
      const isGoogleUser = user.providerData?.some((p: { providerId: string }) => p.providerId === 'google.com');
      if (!user.emailVerified && !isPhoneUser && !isGoogleUser) {
        console.log("[RouteGuard] Email user not verified, staying on auth page");
      } else {
        console.log("[RouteGuard] Redirecting authenticated user to", redirectTo);
        router.replace(redirectTo);
        return;
      }
    }

    // If user is authenticated and we need to check roles
    if (user && requireAuth) {
      // Wait for role loading to complete if we need role info
      if ((requireRole || allowedRoles.length > 0) && roleLoading) {
        console.log("[RouteGuard] Role loading...");
        return;
      }

      // If role is required but user has no role (and no backend error)
      if (requireRole && (!role || role === 'no-role') && !backendError) {
        console.log("[RouteGuard] User has no role, redirecting to /select-role");
        router.replace('/select-role');
        return;
      }

      // If specific roles are required and user doesn't have the right role
      if (allowedRoles.length > 0 && role && role !== 'no-role' && !allowedRoles.includes(role)) {
        console.log("[RouteGuard] User role", role, "not allowed. Allowed:", allowedRoles);
        // Redirect based on user's actual role
        if (role === 'doctor') {
          // For doctors, check verification status to redirect to appropriate page
          if (verificationLoading || verificationStatus === null) {
            console.log("[RouteGuard] Verification loading for doctor, waiting...");
            return;
          }
          
          router.replace(getDoctorRedirectPath(verificationStatus));
        } else if (role === 'patient') {
          router.replace('/Patient/dashboard');
        } else {
          router.replace('/select-role');
        }
        return;
      }
    }
  }, [user, role, loading, roleLoading, verificationStatus, verificationLoading, backendError, requireAuth, requireRole, allowedRoles, redirectTo, router]);

  // Show backend error UI
  if (backendError && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-200 dark:border-red-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connection Problem
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {backendError}
          </p>
          <button
            onClick={() => {
              clearBackendError();
              fetchUserRole();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            If the problem persists, please check your internet connection or contact support.
          </p>
        </div>
      </div>
    );
  }

  // Show loading while authentication or role is being determined
  if (loading || (user && requireAuth && (requireRole || allowedRoles.length > 0) && (roleLoading || (role === 'doctor' && verificationLoading)))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? 'Authenticating...' : roleLoading ? 'Loading role...' : 'Loading verification status...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render children while redirecting
  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user && redirectTo) {
    // Allow rendering for unverified email users so verification screen can show
    const isPhoneUser = user.email?.endsWith('@tabeeb.phone');
    const isGoogleUser = user.providerData?.some((p: { providerId: string }) => p.providerId === 'google.com');
    if (user.emailVerified || isPhoneUser || isGoogleUser) {
      return null;
    }
  }

  // Don't render if role is required but user has no role (and no backend error)
  if (user && requireAuth && requireRole && (!role || role === 'no-role') && !backendError) {
    return null;
  }

  // Don't render if user doesn't have the required role
  if (user && requireAuth && allowedRoles.length > 0 && role && role !== 'no-role' && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
