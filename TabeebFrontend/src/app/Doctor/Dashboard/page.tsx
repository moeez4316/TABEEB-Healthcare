"use client";

import { LogOut, User, Mail, Calendar, AlertTriangle, Stethoscope, Clock, Users, Activity } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import Link from 'next/link';

export default function DoctorDashboard() {
  const { user, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState<string>('');

  const handleSignOut = async () => {
    try {
      setSignOutError('');
      await signOut();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out. Please try again.';
      setSignOutError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign-out error:', error);
      }
    }
  };

  if (!user) return null;

  // Mock data for dashboard cards - replace with real data from your API
  const dashboardStats = [
    {
      title: "Today's Appointments",
      value: "8",
      icon: <Calendar className="h-6 w-6" />,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      href: "/Doctor/Appointments"
    },
    {
      title: "This Week",
      value: "32",
      icon: <Clock className="h-6 w-6" />,
      color: "text-green-600 dark:text-green-400", 
      bgColor: "bg-green-50 dark:bg-green-900/20",
      href: "/Doctor/Calendar"
    },
    {
      title: "Total Patients",
      value: "156",
      icon: <Users className="h-6 w-6" />,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      href: "/Doctor/Appointments"
    },
    {
      title: "Active Cases",
      value: "24",
      icon: <Activity className="h-6 w-6" />,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      href: "/Doctor/Appointments"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Image src="/tabeeb_logo.png" alt="TABEEB Logo" width={40} height={40} className="object-contain" />
                <div>
                  <h1 className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                    TABEEB
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                    Doctor Portal
                  </p>
                </div>
              </div>
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
        
        {/* Error Banner */}
        {signOutError && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-600 dark:text-red-400">{signOutError}</p>
                  <button
                    onClick={() => setSignOutError('')}
                    className="text-xs text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100 mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user.photoURL ? (
                  <Image
                    className="rounded-full"
                    src={user.photoURL}
                    alt={user.displayName || 'Doctor avatar'}
                    width={48}
                    height={48}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back, Dr.{user.displayName ? ` ${user.displayName}` : ''}!
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ready to help your patients today. Here&apos;s your practice overview.
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {dashboardStats.map((stat, index) => (
              <Link key={index} href={stat.href}>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-200 cursor-pointer">
                  <div className="flex items-center">
                    <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                      {stat.icon}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Link href="/Doctor/Appointments">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Manage Appointments
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View, schedule, and manage patient appointments
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/Doctor/Calendar">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Calendar View
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Check your schedule and availability
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Doctor Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Account Information
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Email
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>

              {user.displayName && (
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Display Name
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dr. {user.displayName}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Account Created
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.metadata.creationTime ? 
                      new Date(user.metadata.creationTime).toLocaleDateString() : 
                      'Unknown'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Last Sign In
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.metadata.lastSignInTime ? 
                      new Date(user.metadata.lastSignInTime).toLocaleDateString() : 
                      'Unknown'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
