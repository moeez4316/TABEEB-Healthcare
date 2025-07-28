'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Users,
  Activity
} from 'lucide-react';

interface SidebarAdminProps {
  className?: string;
}

export default function SidebarAdmin({ className = '' }: SidebarAdminProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
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
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      description: 'Platform Insights',
      disabled: true
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500">
            <Image
              src="/tabeeb_logo.png"
              alt="TABEEB Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              TABEEB
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Admin Console
            </p>
          </div>
        </div>
      </div>

      {/* Admin Badge */}
      <div className="p-4">
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

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);
          
          return (
            <button
              key={item.name}
              onClick={() => {
                if (!item.disabled) {
                  router.push(item.href);
                  setIsMobileMenuOpen(false);
                }
              }}
              disabled={item.disabled}
              className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                  : item.disabled
                  ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${
                isActive ? 'scale-110' : 'group-hover:scale-105'
              }`} />
              <div className="flex-1 text-left">
                <div className="font-semibold">{item.name}</div>
                <div className={`text-xs ${
                  isActive 
                    ? 'text-white/80' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {item.description}
                </div>
              </div>
              {item.disabled && (
                <span className="ml-2 px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md font-medium">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Stats */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
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

      {/* Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        ) : (
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        )}
      </button>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-shrink-0 ${className}`}>
        <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-xl">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-xl transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>
    </>
  );
}
