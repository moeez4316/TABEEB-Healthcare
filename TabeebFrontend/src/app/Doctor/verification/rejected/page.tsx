'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { verificationAPI, VerificationData } from '@/lib/verification/api';
import { formatDate } from '@/lib/verification/utils';

export default function VerificationRejectedPage() {
  const { user, loading: authLoading, token } = useAuth();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVerificationData = useCallback(async () => {
    try {
      if (!token) return;

      const data = await verificationAPI.getVerificationStatus(token);
      setVerificationData(data);
    } catch (error) {
      console.error('Error fetching verification data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && user && token) {
      fetchVerificationData();
    }
  }, [user, authLoading, token, fetchVerificationData]);

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

  const handleResubmit = () => {
    window.location.href = '/Doctor/verification';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
          <div className="px-8 py-10 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Verification Rejected</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
                  Your verification application was not approved
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Details */}
          <div className="px-8 py-10">
            {verificationData && (
              <div className="space-y-8">
                {/* Admin Comments */}
                {verificationData.adminComments && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">Reason for Rejection</h3>
                        <p className="text-red-800 dark:text-red-300">{verificationData.adminComments}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Submission Details</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">PMDC Number</p>
                        <p className="text-slate-900 dark:text-white font-mono text-lg">{verificationData.pmdcNumber}</p>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Originally Submitted</p>
                        <p className="text-slate-900 dark:text-white">{formatDate(verificationData.submittedAt)}</p>
                      </div>
                      
                      {verificationData.reviewedAt && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reviewed On</p>
                          <p className="text-slate-900 dark:text-white">{formatDate(verificationData.reviewedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Documents Submitted</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">CNIC Document</span>
                      </div>
                      {verificationData.certificate && (
                        <div className="flex items-center text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Medical Certificate</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Common Rejection Reasons */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.184 0 2.046-1.184 1.563-2.23L13.563 4.77c-.482-1.044-1.785-1.044-2.267 0L4.358 15.77C3.875 16.816 4.737 18 5.921 18z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-3">Common Reasons for Rejection</h4>
                      <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                        <li className="flex items-start">
                          <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
                          Documents are not clear or readable
                        </li>
                        <li className="flex items-start">
                          <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
                          PMDC number does not match official records
                        </li>
                        <li className="flex items-start">
                          <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
                          CNIC document is expired or invalid
                        </li>
                        <li className="flex items-start">
                          <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
                          Medical certificate is not from an accredited institution
                        </li>
                        <li className="flex items-start">
                          <span className="text-amber-600 dark:text-amber-400 mr-2">•</span>
                          Information provided does not match documents
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-3">What to do next?</h4>
                      <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                        <li className="flex items-start">
                          <span className="text-blue-600 dark:text-blue-400 mr-2 font-semibold">1.</span>
                          Review the rejection reason above
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 dark:text-blue-400 mr-2 font-semibold">2.</span>
                          Ensure your documents are clear and valid
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 dark:text-blue-400 mr-2 font-semibold">3.</span>
                          Double-check your PMDC number
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 dark:text-blue-400 mr-2 font-semibold">4.</span>
                          Submit new documents using the button below
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleResubmit}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-200 font-semibold shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Submit New Documents
                  </button>
                </div>

                {/* Help Section */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
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
                        <p className="font-semibold text-slate-700 dark:text-slate-300">Phone Support</p>
                        <p className="text-slate-600 dark:text-slate-400">+92-XXX-XXXXXXX</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                      If you believe this rejection was made in error, please contact our support team.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
