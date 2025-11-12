'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaCalendarAlt, FaReceipt } from 'react-icons/fa';

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <FaCheckCircle className="text-6xl text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your appointment has been confirmed
          </p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-slate-700">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Amount Paid</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              PKR {parseFloat(amount).toLocaleString('en-PK')}
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  TXN{Date.now().toString().slice(-8)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                <span className="font-medium text-gray-900 dark:text-white">Online Payment</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                  <FaCheckCircle className="mr-1" />
                  Confirmed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">What&apos;s Next?</h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>You will receive a confirmation email shortly</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>The doctor will be notified of your appointment</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>You can view your appointment details anytime</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Please arrive 10 minutes early for your appointment</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/Patient/appointments')}
            className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
          >
            <FaCalendarAlt />
            <span>View My Appointments</span>
          </button>
          <button
            onClick={() => router.push('/Patient/dashboard')}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center space-x-2"
          >
            <FaReceipt />
            <span>Go to Dashboard</span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@tabeeb.com" className="text-teal-600 dark:text-teal-400 hover:underline">
              support@tabeeb.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
