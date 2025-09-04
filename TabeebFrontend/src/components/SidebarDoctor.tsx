"use client";

import Link from "next/link";
import Image from "next/image";
import { FaTachometerAlt, FaCalendarAlt, FaCalendarCheck, FaClock, FaSignOutAlt, FaBars, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Dashboard", href: "/Doctor/Dashboard", icon: <FaTachometerAlt /> },
  { label: "Appointments", href: "/Doctor/Appointments", icon: <FaCalendarAlt /> },
  { label: "Availability", href: "/Doctor/availability", icon: <FaClock /> },
  { label: "Calendar", href: "/Doctor/Calendar", icon: <FaCalendarCheck /> },
];

export default function SidebarDoctor() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // Clear any cached data
      localStorage.clear();
      // Redirect to landing page
      router.push('/landing-page');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    
    // Dispatch custom event for layout to listen to
    window.dispatchEvent(new CustomEvent('sidebarToggle', { 
      detail: { collapsed: newCollapsed } 
    }));
  };

  const SidebarContent = () => (
    <aside
      className={`h-screen flex flex-col justify-between py-8 relative ${
        !isMobile && isCollapsed ? 'w-20' : 'w-60'
      } overflow-y-auto custom-scrollbar-hide`}
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
            {isCollapsed ? <FaChevronRight className="text-sm" /> : <FaChevronLeft className="text-sm" />}
          </button>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className={`mb-10 flex flex-col items-center transition-all duration-300 ${
          !isMobile && isCollapsed ? 'scale-75' : 'scale-100'
        }`}>
          <Image 
            src="/tabeeb_logo.png" 
            alt="Tabeeb Logo" 
            width={!isMobile && isCollapsed ? 48 : 64} 
            height={!isMobile && isCollapsed ? 48 : 64} 
            className="mb-2 rounded-full shadow transition-all duration-300" 
          />
          {(isMobile || !isCollapsed) && (
            <>
              <span className="text-xl font-bold tracking-wide text-gray-800 dark:text-gray-200 transition-opacity duration-300">
                TABEEB
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 transition-opacity duration-300">
                Doctor Portal
              </span>
            </>
          )}
        </div>
        <nav className="w-full">
          <ul className="space-y-2 w-full">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (isMobile) {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200 w-full group ${
                    !isMobile && isCollapsed ? 'px-3 py-3 justify-center' : 'px-6 py-3'
                  }`}
                  title={!isMobile && isCollapsed ? item.label : ''}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {(isMobile || !isCollapsed) && (
                    <span className="transition-opacity duration-300">{item.label}</span>
                  )}
                  {!isMobile && isCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Sign Out Section */}
      <div className={`w-full transition-all duration-300 ${!isMobile && isCollapsed ? 'px-2' : 'px-4'}`}>
                {user && (isMobile || !isCollapsed) && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg transition-opacity duration-300">
            <p className="text-sm text-gray-600 dark:text-gray-400">Signed in as:</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {user.displayName || user.email}
            </p>
          </div>
        )}
        
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={`flex items-center gap-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed group ${
            !isMobile && isCollapsed ? 'px-3 py-3 justify-center' : 'px-6 py-3'
          }`}
          title={!isMobile && isCollapsed ? (isSigningOut ? 'Signing out...' : 'Sign Out') : ''}
        >
          <span className="text-lg flex-shrink-0">
            {isSigningOut ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <FaSignOutAlt />
            )}
          </span>
          {(isMobile || !isCollapsed) && (
            <span className="transition-opacity duration-300">
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </span>
          )}
          {!isMobile && isCollapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </span>
          )}
        </button>
      </div>
    </aside>
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
            <FaTimes className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <FaBars className="w-5 h-5 text-gray-700 dark:text-gray-300" />
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
          isCollapsed ? 'w-20' : 'w-60'
        }`}>
          <div className="w-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-700">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Mobile Sidebar - Only show on mobile */}
      {isMobile && (
        <div className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="bg-white dark:bg-slate-900 w-60">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
