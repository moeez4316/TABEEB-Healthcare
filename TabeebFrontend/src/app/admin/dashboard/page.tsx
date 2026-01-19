'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Clock,
  CheckCircle,
  Activity,
  FileText,
  Shield,
  AlertCircle,
  BarChart3,
  Settings,
  Calendar,
  ArrowUp,
  ArrowDown,
  Flag,
  PenSquare,
  TrendingUp,
  UserCheck,
  XCircle,
  ChevronRight
} from 'lucide-react';

interface DashboardStats {
  totalDoctors: number;
  pendingVerifications: number;
  approvedDoctors: number;
  rejectedApplications: number;
  totalPatients: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // For now, set demo data
      setStats({
        totalDoctors: 25,
        pendingVerifications: 8,
        approvedDoctors: 17,
        rejectedApplications: 3,
        totalPatients: 150,
        recentActivity: [
          {
            id: '1',
            type: 'verification_submitted',
            message: 'Dr. Sarah Ahmed submitted verification documents',
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'verification_approved',
            message: 'Dr. Muhammad Ali verification approved',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '3',
            type: 'doctor_registered',
            message: 'New doctor registration: Dr. Fatima Khan',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    fetchDashboardStats();
  }, [fetchDashboardStats, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <div className="w-full h-full border-4 border-teal-200 dark:border-teal-800 border-t-teal-500 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400">Preparing admin control center...</p>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'verification_submitted':
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'verification_approved':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'doctor_registered':
        return <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Platform Overview & Management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                  <ArrowUp className="w-3 h-3" />
                  +12%
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Doctors</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats?.totalDoctors || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active medical professionals</p>
              </div>
            </div>

            <Link href="/admin/verification">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    Action needed
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending Verifications</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats?.pendingVerifications || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Awaiting review</p>
                </div>
              </div>
            </Link>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                  <ArrowUp className="w-3 h-3" />
                  +8%
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Approved Doctors</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats?.approvedDoctors || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Verified professionals</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                  <ArrowUp className="w-3 h-3" />
                  +23%
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats?.totalPatients || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Registered users</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/admin/verification">
                <div className="bg-gradient-to-br from-teal-50 to-white dark:from-teal-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  {stats && stats.pendingVerifications > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                      {stats.pendingVerifications}
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                      <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-teal-400 dark:text-teal-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Review Verifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage doctor verification requests</p>
                </div>
              </Link>

              <Link href="/admin/blogs">
                <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <PenSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-400 dark:text-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Blog Management</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage articles and content</p>
                </div>
              </Link>

              <Link href="/admin/complaints">
                <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                      <Flag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-amber-400 dark:text-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Review Complaints</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View and respond to complaints</p>
                </div>
              </Link>

              <Link href="/admin/users">
                <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-400 dark:text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">User Management</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage users and permissions</p>
                </div>
              </Link>

              <Link href="/admin/analytics">
                <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-green-400 dark:text-green-500 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">View Analytics</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Platform insights and metrics</p>
                </div>
              </Link>

              <button
                disabled
                className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">System Settings</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="p-6 space-y-4">
                {stats?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    <div className="p-2 bg-white dark:bg-slate-600 rounded-lg flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-slate-400">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
