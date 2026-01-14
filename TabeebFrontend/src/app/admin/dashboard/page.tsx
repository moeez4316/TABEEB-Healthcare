'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Flag
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
      <div className="h-full bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-teal-200 dark:border-teal-800 opacity-20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Loading Dashboard</h3>
          <p className="text-slate-600 dark:text-slate-300">Preparing your admin control center...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Doctors',
      value: stats?.totalDoctors || 0,
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
      description: 'Active medical professionals',
      color: 'blue'
    },
    {
      title: 'Pending Verifications',
      value: stats?.pendingVerifications || 0,
      icon: Clock,
      change: '-5%',
      changeType: 'negative' as const,
      description: 'Awaiting review',
      color: 'amber',
      clickable: true,
      onClick: () => router.push('/admin/verification')
    },
    {
      title: 'Approved Doctors',
      value: stats?.approvedDoctors || 0,
      icon: CheckCircle,
      change: '+8%',
      changeType: 'positive' as const,
      description: 'Verified professionals',
      color: 'emerald'
    },
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: Activity,
      change: '+23%',
      changeType: 'positive' as const,
      description: 'Registered users',
      color: 'purple'
    },
  ];

  const quickActions = [
    {
      title: 'Review Verifications',
      description: 'Manage doctor verification requests',
      icon: Shield,
      action: () => router.push('/admin/verification'),
      color: 'teal',
      count: stats?.pendingVerifications || 0
    },
    {
      title: 'Review Complaints',
      description: 'View and respond to patient complaints',
      icon: Flag,
      action: () => router.push('/admin/complaints'),
      color: 'amber'
    },
    {
      title: 'View Analytics',
      description: 'Platform insights and metrics',
      icon: BarChart3,
      action: () => router.push('/admin/analytics'),
      color: 'blue',
      isNew: true
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings',
      icon: Settings,
      action: () => alert('Settings coming soon!'),
      color: 'slate',
      disabled: true
    },
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      action: () => router.push('/admin/users'),
      color: 'purple',
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        icon: 'text-blue-600 dark:text-blue-400',
        accent: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:bg-blue-200 dark:hover:bg-blue-800/50'
      },
      amber: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        icon: 'text-amber-600 dark:text-amber-400',
        accent: 'border-amber-200 dark:border-amber-800',
        hover: 'hover:bg-amber-200 dark:hover:bg-amber-800/50'
      },
      emerald: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        icon: 'text-emerald-600 dark:text-emerald-400',
        accent: 'border-emerald-200 dark:border-emerald-800',
        hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-800/50'
      },
      purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        icon: 'text-purple-600 dark:text-purple-400',
        accent: 'border-purple-200 dark:border-purple-800',
        hover: 'hover:bg-purple-200 dark:hover:bg-purple-800/50'
      },
      teal: {
        bg: 'bg-teal-100 dark:bg-teal-900/30',
        icon: 'text-teal-600 dark:text-teal-400',
        accent: 'border-teal-200 dark:border-teal-800',
        hover: 'hover:bg-teal-200 dark:hover:bg-teal-800/50'
      },
      slate: {
        bg: 'bg-slate-100 dark:bg-slate-700/50',
        icon: 'text-slate-600 dark:text-slate-400',
        accent: 'border-slate-200 dark:border-slate-600',
        hover: 'hover:bg-slate-200 dark:hover:bg-slate-600/50'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'verification_submitted':
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'verification_approved':
        return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'doctor_registered':
        return <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
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
    <div className="h-full bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 overflow-auto">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Welcome back, manage your healthcare platform
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-xl px-4 py-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const colors = getColorClasses(card.color);
            return (
              <div
                key={index}
                className={`
                  bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl p-6 
                  hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 group shadow-lg hover:shadow-xl
                  ${card.clickable ? 'cursor-pointer hover:scale-105' : ''}
                `}
                onClick={card.onClick}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-3 ${colors.bg} ${colors.accent} border rounded-xl`}>
                    <card.icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                    card.changeType === 'positive' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}>
                    {card.changeType === 'positive' ? 
                      <ArrowUp className="w-3 h-3" /> : 
                      <ArrowDown className="w-3 h-3" />
                    }
                    {card.change}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {card.title}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      {card.value.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="xl:col-span-2">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-xl">
                  <Settings className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const colors = getColorClasses(action.color);
                  return (
                    <button
                      key={index}
                      onClick={action.action}
                      disabled={action.disabled}
                      className={`
                        relative p-6 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-left
                        transition-all duration-300 group hover:shadow-lg
                        ${!action.disabled ? 'hover:bg-slate-100 dark:hover:bg-slate-700/70 hover:scale-105' : 'opacity-50 cursor-not-allowed'}
                      `}
                    >
                      {action.count && action.count > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {action.count}
                        </div>
                      )}
                      {action.isNew && (
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          NEW
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className={`p-3 ${colors.bg} ${colors.accent} border rounded-xl flex-shrink-0`}>
                          <action.icon className={`w-6 h-6 ${colors.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {action.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="xl:col-span-1">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="space-y-4">
                {stats?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                    <div className="p-2 bg-white dark:bg-slate-600 rounded-lg flex-shrink-0 border border-slate-200 dark:border-slate-500">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1 leading-relaxed">
                        {activity.message}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
