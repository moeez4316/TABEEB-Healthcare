'use client';

import { BarChart3, TrendingUp, Users, Clock, Activity, ArrowLeft } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Analytics & Reports
              </h1>
            </div>
            <p className="text-slate-600 ml-12">Platform statistics and insights</p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="text-center py-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-lg max-w-2xl mx-auto">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-12 h-12 text-purple-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Analytics Coming Soon</h2>
            <p className="text-slate-600 mb-8 text-lg">
              We&apos;re building comprehensive analytics and reporting features for the admin panel.
            </p>
            
            {/* Planned Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-800">Registration Trends</h3>
                </div>
                <p className="text-sm text-emerald-700">Track doctor and patient registration patterns over time</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">User Engagement</h3>
                </div>
                <p className="text-sm text-blue-700">Monitor patient engagement and platform usage metrics</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Processing Times</h3>
                </div>
                <p className="text-sm text-amber-700">Analyze verification and approval processing efficiency</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-800">System Health</h3>
                </div>
                <p className="text-sm text-purple-700">Monitor platform performance and system metrics</p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Development Progress</span>
                <span className="text-sm text-slate-600">25%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-600 h-3 rounded-full transition-all duration-500" style={{ width: '25%' }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Analytics dashboard is currently in development</p>
            </div>

            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
