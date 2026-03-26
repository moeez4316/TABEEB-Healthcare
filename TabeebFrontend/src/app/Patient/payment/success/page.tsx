'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaCalendarAlt, FaReceipt, FaClock, FaInfoCircle } from 'react-icons/fa';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const appointmentId = searchParams.get('appointmentId') || '';
  const amount = searchParams.get('amount') || '0';

  useEffect(() => {
    // Redirect if no data
    if (!appointmentId) {
      router.push('/Patient/appointments');
    }
  }, [appointmentId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <FaCheckCircle className="text-4xl sm:text-6xl text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Appointment Confirmed!
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400">
            Payment instructions have been received
          </p>
        </div>

        {/* Amount Display Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-8 mb-4 sm:mb-6 border border-gray-200 dark:border-slate-700">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Amount to Transfer</p>
            <p className="text-4xl sm:text-5xl font-bold text-green-600 dark:text-green-400">
              PKR {parseFloat(amount).toLocaleString('en-PK')}
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-4 sm:pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Appointment ID:</span>
                <span className="font-mono text-gray-900 dark:text-white">{appointmentId}</span>
              </div>
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                  <FaClock className="text-xs" />
                  Awaiting Payment
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Instructions Card */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-3 text-sm sm:text-base">
                Next Steps
              </h3>
              <ol className="text-amber-800 dark:text-amber-400 text-xs sm:text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-semibold flex-shrink-0">1.</span>
                  <span>Your appointment has been confirmed by the system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold flex-shrink-0">2.</span>
                  <span>Complete your appointment with the doctor at the scheduled date and time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold flex-shrink-0">3.</span>
                  <span>After the appointment, transfer the payment amount <strong>within 24 hours</strong> to the TABEEB Healthcare JazzCash account provided above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold flex-shrink-0">4.</span>
                  <span>Keep your transaction receipt as proof of payment</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Important Information Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 text-sm sm:text-base flex items-center gap-2">
            <FaClock className="text-blue-600 dark:text-blue-400" />
            Payment Deadline & Details
          </h3>
          <p className="text-blue-800 dark:text-blue-400 text-xs sm:text-sm mb-3">
            You have <strong>24 hours after your appointment ends</strong> to complete the payment transfer to TABEEB Healthcare.
          </p>
          <ul className="text-blue-800 dark:text-blue-400 text-xs sm:text-sm space-y-2">
            <li>• JazzCash Number: <strong>+92 302 4400906</strong></li>
            <li>• Account Name: <strong>TABEEB Healthcare</strong></li>
            <li>• Use the appointment ID as reference in your payment transfer</li>
            <li>• Late payments may result in additional charges and account suspensions</li>
          </ul>
        </div>

        {/* What to Expect Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">
            What to Expect
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5">✓</span>
              <span>Your appointment is confirmed and scheduled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5">✓</span>
              <span>You will receive an appointment reminder before the scheduled time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5">✓</span>
              <span>The doctor will be available for your consultation at the scheduled time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5">✓</span>
              <span>After the appointment, you'll have 24 hours to complete the payment transfer</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={() => router.push('/Patient/appointments')}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <FaCalendarAlt className="text-sm" />
            <span>View My Appointments</span>
          </button>
          <button
            onClick={() => router.push('/Patient/dashboard')}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <FaReceipt className="text-sm" />
            <span>Go to Dashboard</span>
          </button>
        </div>

        {/* Support Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-slate-700 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
            Need assistance or have questions?
          </p>
          <a
            href="mailto:support@tabeebemail.me"
            className="text-teal-600 dark:text-teal-400 hover:underline font-medium text-xs sm:text-sm"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </div>
  );
}
