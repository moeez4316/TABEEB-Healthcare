"use client";

import Link from "next/link";
import Image from "next/image";
import { FaTachometerAlt, FaCalendarAlt, FaFileMedical, FaRobot, FaSignOutAlt, FaUserMd, FaBars, FaTimes, FaChevronLeft, FaChevronRight, FaPrescriptionBottleAlt } from "react-icons/fa";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { APP_CONFIG } from "@/lib/config/appConfig";

const navItems = [
  { label: "Dashboard", href: "/Patient/dashboard", icon: <FaTachometerAlt /> },
  { label: "Find Doctors", href: "/Patient/doctors", icon: <FaUserMd /> },
  { label: "Book Appointment", href: "/Patient/book-appointment", icon: <FaCalendarAlt /> },
  { label: "My Appointments", href: "/Patient/appointments", icon: <FaCalendarAlt /> },
  { label: "My Prescriptions", href: "/Patient/prescriptions", icon: <FaPrescriptionBottleAlt /> },
  { label: "Medical Records", href: "/Patient/medical-records", icon: <FaFileMedical /> },
  //{ label: "Medication", href: "/Patient/medication", icon: <FaPills /> },
  { label: "AI Chat", href: "/Patient/ai-chat", icon: <FaRobot /> },
  //{ label: "Image Analysis", href: "/Patient/image-analysis", icon: <FaImage /> },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const { profile } = useAppSelector((state) => state.patient || { profile: null });
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

  // Prevent background scroll on mobile when sidebar is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    // Clean up on unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isMobile, isMobileMenuOpen]);

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
      className={`h-full flex flex-col relative ${!isMobile && isCollapsed ? 'w-20' : 'w-60'}`}
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

      {/* Header/logo fixed at top */}
      <div className={`flex flex-col items-center py-8 transition-all duration-300 ${!isMobile && isCollapsed ? 'scale-75' : 'scale-100'}`} style={{ flexShrink: 0 }}>
        <Image 
          src={APP_CONFIG.ASSETS.LOGO} 
          alt="Tabeeb Logo" 
          width={!isMobile && isCollapsed ? 48 : 64} 
          height={!isMobile && isCollapsed ? 48 : 64} 
          className="mb-2 rounded-full shadow transition-all duration-300" 
        />
        {(isMobile || !isCollapsed) && (
          <span className="text-xl font-bold tracking-wide text-gray-800 dark:text-gray-200 transition-opacity duration-300">
            TABEEB
          </span>
        )}
      </div>

      {/* Scrollable nav items: flex-1, overflow-y-auto */}
      <div
        className="flex-1 w-full overflow-y-auto custom-scrollbar-hide min-h-0"
        style={{
          paddingBottom: isMobile
            ? 'calc(120px + env(safe-area-inset-bottom, 0px))'
            : 'calc(96px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <nav className="w-full">
          <ul className="space-y-2 w-full px-2">
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
                    !isMobile && isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
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

      {/* Sign Out Section - absolutely positioned at bottom */}
      <div 
        className={`w-full transition-all duration-300 ${!isMobile && isCollapsed ? 'px-2' : 'px-4'} bg-white dark:bg-slate-900 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700`}
        style={{
          flexShrink: 0,
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {user && (isMobile || !isCollapsed) && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg transition-opacity duration-300">
            <p className="text-sm text-gray-600 dark:text-gray-400">Signed in as:</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {profile?.email || (user.email && !user.email.endsWith('@tabeeb.phone') ? user.email : (user.displayName || 'User'))}
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
        <div
          className={`lg:hidden fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ height: '100dvh' }}
        >
          <div className="bg-white dark:bg-slate-900 w-60 h-full">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
