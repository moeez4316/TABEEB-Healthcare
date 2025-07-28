'use client';

import SidebarAdmin from '@/components/SidebarAdmin';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex h-screen">
        <SidebarAdmin />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center lg:hidden">
                  {/* Mobile menu button is now in SidebarAdmin */}
                </div>
                
                <div className="flex items-center space-x-4 ml-auto">
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      System Online
                    </span>
                  </div>
                  
                  <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
                  
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Admin Console v2.0
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
    </div>
  );
}
