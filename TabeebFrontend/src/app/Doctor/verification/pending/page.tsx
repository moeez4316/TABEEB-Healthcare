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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-yellow-50 px-6 py-8 border-b border-yellow-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Verification Under Review</h1>
                <p className="text-gray-600 mt-1">
                  Your documents are being reviewed by our verification team
                </p>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Submission Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Submission Details</h3>
                
                {verificationData && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">PMDC Number</p>
                      <p className="text-gray-900">{verificationData.pmdcNumber}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Submitted On</p>
                      <p className="text-gray-900">{formatDate(verificationData.submittedAt)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Documents Submitted</p>
                      <div className="space-y-1">
                        <div className="flex items-center text-green-600">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          CNIC Document
                        </div>
                        {verificationData.certificate && (
                          <div className="flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Medical Certificate
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Review Process</h3>
                
                <div className="space-y-4">
                  {/* Step 1 - Completed */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Documents Submitted</p>
                      <p className="text-xs text-gray-500">Your verification documents have been received</p>
                    </div>
                  </div>

                  {/* Step 2 - In Progress */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-yellow-600 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Under Review</p>
                      <p className="text-xs text-gray-500">Our team is verifying your credentials</p>
                    </div>
                  </div>

                  {/* Step 3 - Pending */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Verification Complete</p>
                      <p className="text-xs text-gray-400">You'll be notified once approved</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Estimated Review Time</p>
                  <p className="text-sm text-blue-700 mt-1">
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
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Status'}
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Need Help?</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Email Support</p>
                  <p className="text-gray-600">support@tabeeb.com</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Review Process</p>
                  <p className="text-gray-600">Mon-Fri, 9 AM - 6 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
