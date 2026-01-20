'use client';

import { FaShieldAlt, FaClipboardCheck, FaUserShield, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { APP_CONFIG } from '@/lib/config/appConfig';

export default function ComplaintPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={40} height={40} className="object-contain" />
              <div>
                <h1 className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                  TABEEB
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                  Healthcare Platform
                </p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <FaShieldAlt className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Complaint Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your concerns matter to us. Learn how we handle complaints.
          </p>
        </div>

        {/* Policy Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Introduction */}
          <div className="p-8 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Overview
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              At TABEEB, we are committed to maintaining the highest standards of healthcare service. 
              If you have experienced any issues during your consultation, our complaint system allows 
              you to report concerns that require administrative review and action.
            </p>
          </div>

          {/* What is a Complaint */}
          <div className="p-8 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-start space-x-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <FaExclamationTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  What is a Complaint?
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  A complaint is a formal report about serious concerns regarding professional conduct, 
                  medical ethics, or quality of care that requires administrative intervention. 
                  Complaints are different from regular reviews and should only be filed for significant issues.
                </p>
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Examples of valid complaints:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li>Unprofessional behavior or misconduct</li>
                    <li>Violation of medical ethics</li>
                    <li>Breach of patient confidentiality</li>
                    <li>Significant quality of care issues</li>
                    <li>Misdiagnosis or medical negligence</li>
                    <li>Doctor no-show or failure to attend scheduled appointment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* How Complaints are Handled */}
          <div className="p-8 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-start space-x-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <FaClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Complaint Process
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-full flex items-center justify-center">
                      <span className="text-teal-700 dark:text-teal-400 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Submission
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        You submit a complaint through the review system after a completed appointment. 
                        You must provide detailed comments explaining your concerns.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-full flex items-center justify-center">
                      <span className="text-teal-700 dark:text-teal-400 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Admin Review
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Your complaint is immediately forwarded to our administrative team for thorough review. 
                        The admin will investigate the matter by reviewing appointment records and relevant documentation.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-full flex items-center justify-center">
                      <span className="text-teal-700 dark:text-teal-400 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Admin Response
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        After investigation, the admin will provide a response detailing the findings and any 
                        actions taken. This response will be visible to you in your reviews section on your dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-full flex items-center justify-center">
                      <span className="text-teal-700 dark:text-teal-400 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Resolution
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Based on the severity and findings, appropriate action may be taken, including counseling, 
                        warnings, additional training requirements, or in serious cases, suspension of the doctor&apos;s account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className="p-8 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-start space-x-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Important Information
                </h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                      📊 Impact on Doctor&apos;s Rating
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      Complaints do <strong>NOT</strong> affect the doctor&apos;s public rating score. They are kept 
                      separate from regular reviews to ensure fair assessment while addressing serious concerns.
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                      👁️ Visibility
                    </p>
                    <p className="text-sm text-purple-800 dark:text-purple-400">
                      You can view all your submitted complaints and admin responses by visiting the 
                      <strong> My Reviews</strong> section on your dashboard. Admin responses will be clearly displayed.
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-300 mb-2">
                      ⚠️ Requirements
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-400">
                      A detailed comment is <strong>mandatory</strong> when filing a complaint. Please provide 
                      specific information about the incident, including dates, times, and nature of the concern.
                    </p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                      🚫 Misuse Policy
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-400">
                      Filing false or frivolous complaints may result in action against your account. 
                      Please use the complaint system responsibly and only for genuine concerns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confidentiality */}
          <div className="p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                <FaUserShield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Confidentiality & Privacy
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  All complaints are handled with strict confidentiality. Your personal information and 
                  complaint details are only accessible to authorized administrative staff. We are committed 
                  to protecting your privacy while ensuring thorough investigation of all concerns.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Have questions about our complaint policy?
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-teal-600 dark:bg-teal-500 text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors font-medium"
          >
            Return to Home
          </Link>
        </div>

        {/* Last Updated */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Last updated: January 14, 2026
        </div>
      </main>
    </div>
  );
}
