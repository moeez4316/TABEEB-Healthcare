'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function RouteGuard({ 
  children, 
  requireAuth = false, 
  redirectTo 
}: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User is not authenticated but route requires auth
        router.replace('/auth');
      } else if (!requireAuth && user && redirectTo) {
        // User is authenticated but trying to access public routes
        router.replace(redirectTo);
      }
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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

  return <>{children}</>;
}
