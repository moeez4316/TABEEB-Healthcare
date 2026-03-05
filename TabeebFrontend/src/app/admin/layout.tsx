'use client';

import SidebarAdmin from '@/components/SidebarAdmin';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminMe } from '@/lib/hooks/useAdminQueries';
import { ApiError } from '@/lib/api-client';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const isLoginRoute = pathname === '/admin/login';
  const isPasswordChangeRoute = pathname === '/admin/change-password';
  const shouldCheckAuth = !isLoginRoute;

  const { data: adminMe, error: adminMeError } = useAdminMe(adminToken, shouldCheckAuth);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed);
    };

    window.addEventListener('adminSidebarToggle', handleSidebarToggle as EventListener);

    return () => {
      window.removeEventListener('adminSidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isLoginRoute) return;
    if (!adminToken) {
      router.push('/admin/login');
    }
  }, [adminToken, isLoginRoute, router]);

  useEffect(() => {
    if (!adminMeError) return;
    const status = (adminMeError as ApiError)?.status;
    if (status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      router.push('/admin/login');
    }
  }, [adminMeError, router]);

  useEffect(() => {
    if (!adminMe?.admin) return;
    const mustChangePassword = Boolean(adminMe.admin.mustChangePassword);
    if (mustChangePassword && !isPasswordChangeRoute) {
      router.push('/admin/change-password');
    }
  }, [adminMe, isPasswordChangeRoute, router]);

  useEffect(() => {
    if (!adminMe?.admin || typeof adminMe.admin !== 'object') return;
    try {
      const raw = localStorage.getItem('adminUser');
      const cachedUser = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      const mergedUser = {
        ...cachedUser,
        ...adminMe.admin,
      };
      if (adminMe.admin.role) {
        mergedUser.role = adminMe.admin.role;
      }
      localStorage.setItem('adminUser', JSON.stringify(mergedUser));
    } catch {
      localStorage.setItem('adminUser', JSON.stringify(adminMe.admin));
    }
  }, [adminMe]);

  const getMainMargin = () => {
    if (isMobile) return 'ml-0';
    return sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';
  };

  const hideAdminChrome = isLoginRoute || isPasswordChangeRoute;

  if (hideAdminChrome) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-[#f6f4ef] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(14,116,144,0.12),_transparent_45%)] opacity-70 dark:opacity-40" />
      <SidebarAdmin adminRole={adminMe?.admin?.role} />
      
      {/* Main Content */}
      <div className={`${getMainMargin()} relative transition-all duration-300 ease-in-out min-h-screen flex flex-col`}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200/70 dark:border-slate-800/70">
          <div className="px-4 sm:px-6 lg:px-10">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center lg:hidden">
                {/* Mobile menu button is now in SidebarAdmin */}
              </div>
              
              <div className="flex items-center space-x-4 ml-auto">
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Live
                  </span>
                </div>
                
                <div className="h-6 w-px bg-slate-300/60 dark:bg-slate-700/60"></div>
                
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  TABEEB Admin Suite
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
