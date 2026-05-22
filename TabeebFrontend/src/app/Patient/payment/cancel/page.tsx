'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaTimesCircle, FaCalendarAlt, FaRedo } from 'react-icons/fa';

export default function PaymentCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId') || '';

  useEffect(() => {
    if (!appointmentId) {
      router.push('/Patient/appointments');
    }
  }, [appointmentId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto text-center">
        {/* Cancel Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-red-100 dark:bg-red-900/30 rounded-full mb-6 mt-8">
          <FaTimesCircle className="text-4xl sm:text-6xl text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Cancelled
        </h1>
        
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-8">
          Your payment was cancelled or failed to process. Your appointment is currently <strong className="text-red-600 dark:text-red-400">UNPAID</strong> and will be cancelled if payment is not received within 30 minutes of booking.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => router.push('/Patient/appointments')}
            className="w-full px-6 py-4 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <FaRedo className="text-sm" />
            <span>Try Again (Go to Appointments)</span>
          </button>
          
          <button
            onClick={() => router.push('/Patient/dashboard')}
            className="w-full text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-2"
          >
            Return to Dashboard
          </button>
        </div>
        
        {/* Support Section */}
        <div className="mt-12 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
            Are you facing issues with payment?
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
