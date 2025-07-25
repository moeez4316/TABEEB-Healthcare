"use client";

import Link from "next/link";
import Image from "next/image";
import { FaTachometerAlt, FaCalendarAlt, FaCalendarCheck, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/Doctor/Dashboard", icon: <FaTachometerAlt /> },
  { label: "Appointments", href: "/Doctor/Appointments", icon: <FaCalendarAlt /> },
  { label: "Calendar", href: "/Doctor/Calendar", icon: <FaCalendarCheck /> },
];

export default function SidebarDoctor() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  return (
    <aside className="sticky top-0 h-screen w-60 flex flex-col justify-between py-8 shadow-lg border-r border-gray-200 dark:border-gray-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-col items-center">
        <div className="mb-10 flex flex-col items-center">
          <Image src="/tabeeb_logo.png" alt="Tabeeb Logo" width={64} height={64} className="mb-2 rounded-full shadow" />
          <span className="text-xl font-bold tracking-wide text-[#1e293b] dark:text-[#ededed]">TABEEB</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Doctor Portal</span>
        </div>
        <nav className="w-full">
          <ul className="space-y-2 w-full">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-6 py-3 rounded-lg text-base font-medium text-[#1e293b] dark:text-[#ededed] hover:bg-[#f1f5f9] dark:hover:bg-[#171717] transition-colors w-full"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Sign Out Section */}
      <div className="w-full px-4">
        {user && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Signed in as:</p>
            <p className="text-sm font-medium text-[#1e293b] dark:text-[#ededed] truncate">
              {user.displayName || user.email}
            </p>
          </div>
        )}
        
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-3 px-6 py-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg">
            {isSigningOut ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <FaSignOutAlt />
            )}
          </span>
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
