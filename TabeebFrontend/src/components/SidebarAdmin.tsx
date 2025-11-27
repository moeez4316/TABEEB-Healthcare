'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  UserCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/config/appConfig';

interface SidebarAdminProps {
  className?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description: string;
  disabled?: boolean;
}

export default function SidebarAdmin({ className = '' }: SidebarAdminProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics'
    },
    {
      name: 'Doctor Verification',
      href: '/admin/verification',
      icon: UserCheck,
      description: 'Review Applications'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      description: 'Manage Accounts'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      description: 'Platform Insights'
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    
    // Dispatch custom event for layout to listen to
    window.dispatchEvent(new CustomEvent('adminSidebarToggle', { 
      detail: { collapsed: newCollapsed } 
    }));
  };

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const SidebarContent = () => (
    <div
      className="flex flex-col h-full relative"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Hide scrollbar with custom CSS */}
      <style jsx>{`
        .custom-scrollbar-hide {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE 10+ */
        }
        .custom-scrollbar-hide::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
      {/* Toggle Button - Only show on desktop */}
      {!isMobile && (
        <div className="absolute -right-3 top-8 z-10">
          <button
            onClick={toggleSidebar}
            className="bg-white dark:bg-slate-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="text-sm w-4 h-4" /> : <ChevronLeft className="text-sm w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Header */}
      <div className={`border-b border-slate-200 dark:border-slate-700 transition-all duration-300 ${
        !isMobile && isCollapsed ? 'p-4' : 'p-6'
      }`}>
        <div className={`flex items-center transition-all duration-300 ${
          !isMobile && isCollapsed ? 'justify-center' : 'space-x-3'
        }`}>
          <div className={`rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 ${
            !isMobile && isCollapsed ? 'w-8 h-8' : 'w-10 h-10'
          }`}>
            <Image
              src={APP_CONFIG.ASSETS.LOGO}
              alt="TABEEB Logo"
              width={!isMobile && isCollapsed ? 24 : 32}
              height={!isMobile && isCollapsed ? 24 : 32}
              className="object-contain transition-all duration-300"
            />
          </div>
          {(isMobile || !isCollapsed) && (
            <div className="transition-opacity duration-300">
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                TABEEB
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Admin Console
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Badge */}
      {(isMobile || !isCollapsed) && (
        <div className="p-4 transition-opacity duration-300">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  Administrator
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  Full Access
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

  {/* Navigation - scrollable area, with bottom padding for sticky logout and safe area */}
  <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar-hide" style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}>
        <nav className={`space-y-2 transition-all duration-300 mt-6 ${!isMobile && isCollapsed ? 'px-2' : 'px-4'}`}>{/* margin-top so first item starts lower */}
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (!item.disabled) {
                    router.push(item.href);
                    if (isMobile) {
                      setIsMobileMenuOpen(false);
                    }
                  }
                }}
                disabled={item.disabled}
                className={`w-full group flex items-center text-sm font-medium rounded-xl transition-all duration-200 relative ${
                  !isMobile && isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                    : item.disabled
                    ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={!isMobile && isCollapsed ? item.name : ''}
              >
                <Icon className={`transition-transform duration-200 flex-shrink-0 ${
                  !isMobile && isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'
                } ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`} />
                {(isMobile || !isCollapsed) && (
                  <div className="flex-1 text-left transition-opacity duration-300">
                    <div className="font-semibold">{item.name}</div>
                    <div className={`text-xs ${
                      isActive 
                        ? 'text-white/80' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                )}
                {(isMobile || !isCollapsed) && item.disabled && (
                  <span className="ml-2 px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md font-medium">
                    Soon
                  </span>
                )}
                {!isMobile && isCollapsed && (
                  <span className="absolute left-full ml-2 px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        {/* Stats */}
        {(isMobile || !isCollapsed) && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 transition-opacity duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <Users className="w-4 h-4 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Online</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">127</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">89</div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Logout - sticky bottom, safe area */}
      <div className={`border-t border-slate-200 dark:border-slate-700 transition-all duration-300 ${
        !isMobile && isCollapsed ? 'p-2' : 'p-4'
      } sticky bottom-0 bg-white dark:bg-slate-900 z-10 pt-2 pb-4`} style={{paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'}}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group ${
            !isMobile && isCollapsed ? 'justify-center px-3 py-3' : 'justify-center px-4 py-3'
          }`}
          title={!isMobile && isCollapsed ? 'Sign Out' : ''}
        >
          <LogOut className={`group-hover:scale-110 transition-transform duration-200 ${
            !isMobile && isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-2'
          }`} />
          {(isMobile || !isCollapsed) && (
            <span className="transition-opacity duration-300">Sign Out</span>
          )}
          {!isMobile && isCollapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button - Only show on mobile */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      )}

      {/* Mobile Backdrop - Only show on mobile */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar - Only show on desktop */}
      {!isMobile && (
        <div className={`hidden lg:flex lg:flex-shrink-0 fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-80'
        } ${className}`}>
          <div className="w-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-700">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Mobile Sidebar - Only show on mobile */}
      {isMobile && (
        <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <SidebarContent />
        </div>
      )}
    </>
  );
}
