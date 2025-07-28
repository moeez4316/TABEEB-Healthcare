'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { verificationAPI } from '@/lib/verification/api';
import { formatDate } from '@/lib/verification/utils';

export default function VerificationRejectedPage() {
  const { user, verificationStatus, loading: authLoading, token } = useAuth();
  const router = useRouter();
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const handleResubmit = () => {
    router.push('/Doctor/verification');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 px-6 py-8 border-b border-red-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Verification Rejected</h1>
                <p className="text-gray-600 mt-1">
                  Your verification application was not approved
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Details */}
          <div className="px-6 py-8">
            {verificationData && (
              <div className="space-y-6">
                {/* Admin Comments */}
                {verificationData.adminComments && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Reason for Rejection</h3>
                    <p className="text-red-800">{verificationData.adminComments}</p>
                  </div>
                )}

                {/* Review Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Submission Details</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">PMDC Number</p>
                        <p className="text-gray-900">{verificationData.pmdcNumber}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Originally Submitted</p>
                        <p className="text-gray-900">{formatDate(verificationData.submittedAt)}</p>
                      </div>
                      
                      {verificationData.reviewedAt && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Reviewed On</p>
                          <p className="text-gray-900">{formatDate(verificationData.reviewedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Documents Submitted</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                        </svg>
                        CNIC Document
                      </div>
                      {verificationData.certificate && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                          </svg>
                          Medical Certificate
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Common Rejection Reasons */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-3">Common Reasons for Rejection</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Documents are not clear or readable</li>
                    <li>• PMDC number does not match official records</li>
                    <li>• CNIC document is expired or invalid</li>
                    <li>• Medical certificate is not from an accredited institution</li>
                    <li>• Information provided does not match documents</li>
                  </ul>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">What to do next?</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Review the rejection reason above</li>
                    <li>2. Ensure your documents are clear and valid</li>
                    <li>3. Double-check your PMDC number</li>
                    <li>4. Submit new documents using the button below</li>
                  </ol>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleResubmit}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Submit New Documents
                  </button>
                </div>

                {/* Help Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Need Help?</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Email Support</p>
                      <p className="text-gray-600">support@tabeeb.com</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Phone Support</p>
                      <p className="text-gray-600">+92-XXX-XXXXXXX</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    If you believe this rejection was made in error, please contact our support team.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
