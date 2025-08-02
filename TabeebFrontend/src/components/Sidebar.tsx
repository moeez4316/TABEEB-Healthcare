"use client";

import Link from "next/link";
import Image from "next/image";
import { FaTachometerAlt, FaCalendarAlt, FaFileMedical, FaPills, FaRobot, FaImage, FaSignOutAlt, FaUserMd, FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/Patient/dashboard", icon: <FaTachometerAlt /> },
  { label: "Find Doctors", href: "/Patient/doctors", icon: <FaUserMd /> },
  { label: "Appointments", href: "/Patient/appointments", icon: <FaCalendarAlt /> },
  { label: "Medical Records", href: "/Patient/medical-records", icon: <FaFileMedical /> },
  { label: "Medication", href: "/Patient/medication", icon: <FaPills /> },
  { label: "AI Chat", href: "/Patient/ai-chat", icon: <FaRobot /> },
  { label: "Image Analysis", href: "/Patient/image-analysis", icon: <FaImage /> },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`sticky top-0 h-screen flex flex-col justify-between py-8 shadow-lg border-r border-gray-200 dark:border-gray-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-20' : 'w-60'
    }`}>
      {/* Toggle Button */}
      <div className="absolute -right-3 top-8 z-10">
        <button
          onClick={toggleSidebar}
          className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 text-[#1e293b] dark:text-[#ededed] hover:bg-gray-50 dark:hover:bg-[#23232a]"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <FaBars className="text-sm" /> : <FaTimes className="text-sm" />}
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className={`mb-10 flex flex-col items-center transition-all duration-300 ${
          isCollapsed ? 'scale-75' : 'scale-100'
        }`}>
          <Image 
            src="/tabeeb_logo.png" 
            alt="Tabeeb Logo" 
            width={isCollapsed ? 48 : 64} 
            height={isCollapsed ? 48 : 64} 
            className="mb-2 rounded-full shadow transition-all duration-300" 
          />
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-wide text-[#1e293b] dark:text-[#ededed] transition-opacity duration-300">
              TABEEB
            </span>
          )}
        </div>
        <nav className="w-full">
          <ul className="space-y-2 w-full">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg text-base font-medium text-[#1e293b] dark:text-[#ededed] hover:bg-[#f1f5f9] dark:hover:bg-[#171717] transition-all duration-200 w-full group ${
                    isCollapsed ? 'px-3 py-3 justify-center' : 'px-6 py-3'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="transition-opacity duration-300">{item.label}</span>
                  )}
                  {isCollapsed && (
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
      <div className={`w-full transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {user && !isCollapsed && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg transition-opacity duration-300">
            <p className="text-sm text-gray-600 dark:text-gray-400">Signed in as:</p>
            <p className="text-sm font-medium text-[#1e293b] dark:text-[#ededed] truncate">
              {user.displayName || user.email}
            </p>
          </div>
        )}
        
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={`flex items-center gap-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed group ${
            isCollapsed ? 'px-3 py-3 justify-center' : 'px-6 py-3'
          }`}
          title={isCollapsed ? (isSigningOut ? 'Signing out...' : 'Sign Out') : ''}
        >
          <span className="text-lg flex-shrink-0">
            {isSigningOut ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <FaSignOutAlt />
            )}
          </span>
          {!isCollapsed && (
            <span className="transition-opacity duration-300">
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </span>
          )}
          {isCollapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </span>
          )}
        </button>
      </div>
      
    </aside>
  );
}
