'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Activity, 
  ArrowLeft,
  UserCheck,
  Shield,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from 'lucide-react';

interface AnalyticsData {
  totalDoctors: number;
  totalPatients: number;
  totalVerifications: number;
  pendingVerifications: number;
  approvedVerifications: number;
  rejectedVerifications: number;
  recentActivity?: Array<{
    id: number;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-teal-200 dark:border-teal-800 opacity-20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Loading Analytics</h3>
          <p className="text-slate-600 dark:text-slate-300">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Analytics & Reports
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300">Comprehensive platform insights</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {analytics && (
          <>
            {/* Overview Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Doctors */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {analytics.totalDoctors}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Doctors</p>
              </div>

              {/* Total Patients */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900/30 dark:to-teal-800/30 rounded-xl">
                    <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {analytics.totalPatients}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Patients</p>
              </div>

              {/* Pending Verifications */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-800/30 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {analytics.pendingVerifications}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending Verifications</p>
              </div>

              {/* Approved Doctors */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {analytics.approvedVerifications}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Approved Doctors</p>
              </div>
            </div>

            {/* Verification Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Verification Status Breakdown */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl text-white">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verification Status</h2>
                </div>

                <div className="space-y-4">
                  {/* Approved */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Approved</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {analytics.approvedVerifications} ({calculatePercentage(analytics.approvedVerifications, analytics.totalVerifications)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${calculatePercentage(analytics.approvedVerifications, analytics.totalVerifications)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pending */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pending</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {analytics.pendingVerifications} ({calculatePercentage(analytics.pendingVerifications, analytics.totalVerifications)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${calculatePercentage(analytics.pendingVerifications, analytics.totalVerifications)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Rejected */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Rejected</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {analytics.rejectedVerifications} ({calculatePercentage(analytics.rejectedVerifications, analytics.totalVerifications)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-rose-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${calculatePercentage(analytics.rejectedVerifications, analytics.totalVerifications)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Growth */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Platform Growth</h2>
                </div>

                <div className="space-y-6">
                  {/* Total Users */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Platform Users</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                          {analytics.totalDoctors + analytics.totalPatients}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>

                  {/* User Ratio */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Patients</p>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                        {calculatePercentage(analytics.totalPatients, analytics.totalDoctors + analytics.totalPatients)}%
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Doctors</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {calculatePercentage(analytics.totalDoctors, analytics.totalDoctors + analytics.totalPatients)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Approval Rate */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Approval Rate</h3>
                  <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {(analytics.approvedVerifications + analytics.rejectedVerifications) > 0 
                    ? calculatePercentage(analytics.approvedVerifications, analytics.approvedVerifications + analytics.rejectedVerifications)
                    : 0}%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {analytics.approvedVerifications} approved of {analytics.approvedVerifications + analytics.rejectedVerifications} reviewed
                </p>
              </div>

              {/* Rejection Rate */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rejection Rate</h3>
                  <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                  {(analytics.approvedVerifications + analytics.rejectedVerifications) > 0 
                    ? calculatePercentage(analytics.rejectedVerifications, analytics.approvedVerifications + analytics.rejectedVerifications)
                    : 0}%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {analytics.rejectedVerifications} rejected of {analytics.approvedVerifications + analytics.rejectedVerifications} reviewed
                </p>
              </div>

              {/* Pending Review */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Awaiting Review</h3>
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                  {analytics.pendingVerifications}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Pending verification requests
                </p>
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/admin/verification')}
                  className="flex items-center justify-between p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 rounded-xl border border-amber-200 dark:border-amber-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-200 dark:bg-amber-900/50 rounded-lg">
                      <Shield className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 dark:text-white">Review Pending</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{analytics.pendingVerifications} waiting</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-200 dark:bg-blue-900/50 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 dark:text-white">Dashboard</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">View overview</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-200 dark:bg-emerald-900/50 rounded-lg">
                      <Activity className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 dark:text-white">Refresh Data</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Update analytics</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
