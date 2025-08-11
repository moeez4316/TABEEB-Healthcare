'use client';

import { User, Mail, Calendar } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
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
                    Healthcare Platform
                  </p>
                </div>
              </div>
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>
          </div>
        </div>
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
                    alt={user.displayName || 'User avatar'}
                    width={48}
                    height={48}
                    onError={(e) => {
                      // Fallback to default avatar if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back to TABEEB{user.displayName ? `, ${user.displayName}` : ''}!
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You&apos;re successfully signed in to your healthcare platform.
                </p>
              </div>
            </div>
          </div>

          {/* User Information */}
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
                      {user.displayName}
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
