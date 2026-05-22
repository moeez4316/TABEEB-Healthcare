'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaCalendarAlt, FaReceipt, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '@/lib/auth-context';
import { apiFetchJson } from '@/lib/api-client';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const appointmentId = searchParams.get('appointmentId') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appointmentId) {
      router.push('/Patient/appointments');
    }
  }, [appointmentId, router]);

  useEffect(() => {
    // Optionally trigger a manual verify from frontend just to ensure the UI updates instantly
    // even if webhook is slightly delayed.
    const verifyPayment = async () => {
      if (!appointmentId || !token) return;
      try {
        await apiFetchJson(
          `${process.env.NEXT_PUBLIC_API_URL}/api/safepay/verify-payment/${appointmentId}`,
          { token }
        );
      } catch (err) {
        console.error('Frontend verification error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    void verifyPayment();
  }, [appointmentId, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <FaCheckCircle className="text-4xl sm:text-6xl text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400">
            Your payment was successful and your appointment is confirmed.
          </p>
        </div>

        {/* Amount Display Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-8 mb-4 sm:mb-6 border border-gray-200 dark:border-slate-700">
          <div className="border-t border-gray-200 dark:border-slate-600 pt-4 sm:pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Appointment ID:</span>
                <span className="font-mono text-gray-900 dark:text-white">{appointmentId}</span>
              </div>
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                {loading ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    Verifying...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                    Paid
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Next Steps */}
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-teal-600 dark:text-teal-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-teal-900 dark:text-teal-300 mb-3 text-sm sm:text-base">
                Next Steps
              </h3>
              <ul className="text-teal-800 dark:text-teal-400 text-xs sm:text-sm space-y-2">
                <li>• The doctor will review and prepare for your consultation.</li>
                <li>• You can join the video call from the appointments page at the scheduled time.</li>
              </ul>
            </div>
          </div>
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
