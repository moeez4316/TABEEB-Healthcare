'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaCalendarAlt, FaReceipt, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '@/lib/auth-context';
import { apiFetchJson } from '@/lib/api-client';

type VisiblePaymentStatus = 'UNPAID' | 'IN_PROGRESS' | 'CONFIRMED' | 'DISPUTED';

interface PaymentStatusResponse {
  appointmentId: string;
  payment: {
    status: VisiblePaymentStatus;
    isDisputed: boolean;
    proofUrl?: string | null;
    proofUploadedAt?: string | null;
    patientReference?: string | null;
  };
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const appointmentId = searchParams.get('appointmentId') || '';
  const amount = searchParams.get('amount') || '0';
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [visibleStatus, setVisibleStatus] = useState<VisiblePaymentStatus>('UNPAID');
  const [isDisputed, setIsDisputed] = useState(false);

  useEffect(() => {
    // Redirect if no data
    if (!appointmentId) {
      router.push('/Patient/appointments');
    }
  }, [appointmentId, router]);

  const loadStatus = useCallback(async () => {
    if (!appointmentId || !token) return;

    setStatusLoading(true);
    setStatusError('');
    try {
      const data = await apiFetchJson<PaymentStatusResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/payment-status`,
        { token }
      );

      setVisibleStatus(data.payment.status || 'UNPAID');
      setIsDisputed(Boolean(data.payment.isDisputed));
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Failed to load payment status');
    } finally {
      setStatusLoading(false);
    }
  }, [appointmentId, token]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const statusLabel =
    visibleStatus === 'IN_PROGRESS'
      ? 'In Progress'
      : visibleStatus === 'CONFIRMED'
        ? 'Confirmed'
        : visibleStatus === 'DISPUTED'
          ? 'Disputed'
          : 'Unpaid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <FaCheckCircle className="text-4xl sm:text-6xl text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment In Process
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400">
            Your screenshot has been submitted and is under review.
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
                <span className="text-gray-600 dark:text-gray-400">Payment Progress:</span>
                {statusLoading ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    Loading...
                  </span>
                ) : isDisputed ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300">
                    Disputed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                    {statusLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {isDisputed && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <p className="text-rose-800 dark:text-rose-300 text-sm">
              Your payment is currently marked as disputed. Please contact support to resolve this appointment payment.
            </p>
          </div>
        )}

        {/* Minimal Next Steps */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-3 text-sm sm:text-base">
                Next Steps
              </h3>
              <ul className="text-amber-800 dark:text-amber-400 text-xs sm:text-sm space-y-2">
                <li>• We will review your payment screenshot shortly.</li>
                <li>• You can track payment progress from My Appointments.</li>
              </ul>
            </div>
          </div>
        </div>

        {statusError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 sm:mb-6">
            <p className="text-sm text-red-700 dark:text-red-300">{statusError}</p>
          </div>
        )}

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
