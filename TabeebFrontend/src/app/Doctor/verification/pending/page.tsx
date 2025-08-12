'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { verificationAPI } from '@/lib/verification/api';
import { formatDate, getEstimatedReviewTime } from '@/lib/verification/utils';

export default function VerificationPendingPage() {
  const { user, verificationStatus, loading: authLoading, token, refreshVerificationStatus } = useAuth();
  const router = useRouter();
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && user && token) {
      fetchVerificationData();
    }
  }, [user, authLoading, token]);

  const fetchVerificationData = async () => {
    try {
      if (!token) return;

      const data = await verificationAPI.getVerificationStatus(token);
      setVerificationData(data);
    } catch (error) {
      console.error('Error fetching verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      // Refresh both the global verification status and local data
      await refreshVerificationStatus();
      await fetchVerificationData();
    } catch (error) {
      console.error('Error refreshing verification status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                  TABEEB
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Verification Status</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Header Section */}
          <div className="px-8 py-10 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Verification Under Review</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
                  Your documents are being reviewed by our verification team
                </p>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="px-8 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Submission Details */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Submission Details</h3>
                
                {verificationData && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">PMDC Number</p>
                      <p className="text-slate-900 dark:text-white font-mono text-lg">{verificationData.pmdcNumber}</p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Submitted On</p>
                      <p className="text-slate-900 dark:text-white">{formatDate(verificationData.submittedAt)}</p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Documents Submitted</p>
                      <div className="space-y-2">
                        <div className="flex items-center text-teal-600 dark:text-teal-400">
                          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">CNIC Document</span>
                        </div>
                        {verificationData.certificate && (
                          <div className="flex items-center text-teal-600 dark:text-teal-400">
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Medical Certificate</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Review Process</h3>
                
                <div className="space-y-6">
                  {/* Step 1 - Completed */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Documents Submitted</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Your verification documents have been received</p>
                    </div>
                  </div>

                  {/* Step 2 - In Progress */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <div className="w-4 h-4 bg-amber-600 dark:bg-amber-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Under Review</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Our team is verifying your credentials</p>
                    </div>
                  </div>

                  {/* Step 3 - Pending */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                        <div className="w-4 h-4 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Verification Complete</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500">You'll be notified once approved</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Estimated Review Time</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {getEstimatedReviewTime()} - We'll email you once the review is complete.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  refreshing
                    ? 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {refreshing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500 mr-2"></div>
                    Refreshing...
                  </div>
                ) : (
                  'Refresh Status'
                )}
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-8">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 text-teal-600 dark:text-teal-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Need Help?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Email Support</p>
                    <p className="text-slate-600 dark:text-slate-400">support@tabeeb.com</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Review Process</p>
                    <p className="text-slate-600 dark:text-slate-400">Mon-Fri, 9 AM - 6 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
