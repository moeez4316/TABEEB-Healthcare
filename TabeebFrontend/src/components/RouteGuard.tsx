'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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
  const { user, role, loading, roleLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to be fully loaded
    if (loading) {
      console.log("[RouteGuard] Auth loading...");
      return;
    }

    // Check authentication first
    if (requireAuth && !user) {
      console.log("[RouteGuard] Redirecting unauthenticated user to /auth");
      router.replace('/auth');
      return;
    } 
    
    if (!requireAuth && user && redirectTo) {
      console.log("[RouteGuard] Redirecting authenticated user to", redirectTo);
      router.replace(redirectTo);
      return;
    }

    // If user is authenticated and we need to check roles
    if (user && requireAuth) {
      // Wait for role loading to complete if we need role info
      if ((requireRole || allowedRoles.length > 0) && roleLoading) {
        console.log("[RouteGuard] Role loading...");
        return;
      }

      // If role is required but user has no role
      if (requireRole && (!role || role === 'no-role')) {
        console.log("[RouteGuard] User has no role, redirecting to /select-role");
        router.replace('/select-role');
        return;
      }

      // If specific roles are required and user doesn't have the right role
      if (allowedRoles.length > 0 && role && role !== 'no-role' && !allowedRoles.includes(role)) {
        console.log("[RouteGuard] User role", role, "not allowed. Allowed:", allowedRoles);
        // Redirect based on user's actual role
        if (role === 'doctor') {
          router.replace('/Doctor/Dashboard');
        } else if (role === 'patient') {
          router.replace('/Patient/dashboard');
        } else {
          router.replace('/select-role');
        }
        return;
      }
    }
  }, [user, role, loading, roleLoading, requireAuth, requireRole, allowedRoles, redirectTo, router]);

  // Show loading while authentication or role is being determined
  if (loading || (user && requireAuth && (requireRole || allowedRoles.length > 0) && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? 'Authenticating...' : 'Loading...'}
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
    return null;
  }

  // Don't render if role is required but user has no role
  if (user && requireAuth && requireRole && (!role || role === 'no-role')) {
    return null;
  }

  // Don't render if user doesn't have the required role
  if (user && requireAuth && allowedRoles.length > 0 && role && role !== 'no-role' && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
