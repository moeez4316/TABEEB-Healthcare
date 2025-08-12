'use client';

import SidebarDoctor from "@/components/SidebarDoctor";
import RouteGuard from "@/components/RouteGuard";
import VerificationGuard from "@/components/VerificationGuard";
import { useState, useEffect } from 'react';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  const getMainMargin = () => {
    if (isMobile) return 'ml-0';
    return sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-60';
  };

  return (
    <RouteGuard requireAuth={true} allowedRoles={['doctor']}>
      <VerificationGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
          <SidebarDoctor />
          <main className={`${getMainMargin()} transition-all duration-300 ease-in-out min-h-screen`}>
            {children}
          </main>
        </div>
      </VerificationGuard>
    </RouteGuard>
  );
}
