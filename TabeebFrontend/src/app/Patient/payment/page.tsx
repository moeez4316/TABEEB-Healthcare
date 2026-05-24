'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { FaLock, FaTimesCircle } from 'react-icons/fa';
import { apiFetchJson } from '@/lib/api-client';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const amount = searchParams.get('amount') || '0';
  const baseAmountParam = searchParams.get('baseAmount');
  const appointmentId = searchParams.get('appointmentId') || '';
  const doctorName = searchParams.get('doctorName') || 'Doctor';
  const appointmentDate = searchParams.get('date') || '';
  const appointmentTime = searchParams.get('time') || '';
  const followUpDiscountPct = Number.parseFloat(searchParams.get('followUpDiscountPct') || '0');
  const financialAidDiscountPct = Number.parseFloat(searchParams.get('financialAidDiscountPct') || '0');

  const finalAmount = Number.parseFloat(amount) || 0;
  const baseAmount = Number.parseFloat(baseAmountParam || amount) || finalAmount;

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!amount || !appointmentId) {
      router.push('/Patient/book-appointment');
    }
  }, [amount, appointmentId, router]);

  const handlePayNow = async () => {
    if (!appointmentId || !token) return;
    
    setError('');
    setProcessing(true); // Disable button to prevent double-clicks

    // 1. Open a blank popup immediately to bypass popup blockers (must be synchronous with the click)
    const popup = window.open('', 'SafePayCheckout', 'width=500,height=700');
    if (popup) {
      popup.document.write('<html><head><title>Loading SafePay...</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background-color:#f8fafc;color:#334155;"><h2>Connecting to SafePay securely...</h2></body></html>');
    }

    try {
      const response = await apiFetchJson<{ success: boolean; redirectUrl?: string; message?: string }>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/safepay/create-session`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ appointmentId })
        }
      );

      if (response.success && response.redirectUrl) {
        if (popup) {
          // 2. Redirect the existing popup to SafePay
          popup.location.href = response.redirectUrl;
        } else {
          // Fallback just in case the popup was still blocked (extremely strict settings)
          window.location.href = response.redirectUrl;
          return;
        }

        // 3. Poll our backend every 3 seconds to check if the webhook marked it as PAID
        const pollInterval = setInterval(async () => {
          try {
            const check = await apiFetchJson<{ success: boolean; status?: string; data?: { state?: string } }>(
              `${process.env.NEXT_PUBLIC_API_URL}/api/safepay/verify-payment/${appointmentId}`,
              { token, method: 'GET' }
            );
            
            // Check both possible response structures (status or data.state)
            const paymentState = check.status || check.data?.state;
            
            if (check.success && paymentState === 'PAID') {
              clearInterval(pollInterval);
              if (popup && !popup.closed) {
                popup.close();
              }
              // Forcefully take the user to the success page!
              router.push(`/Patient/payment/success?appointmentId=${appointmentId}`);
            }
          } catch (e: any) {
            console.warn('Polling check failed (ignoring until next tick):', e.message);
          }
        }, 3000);

        // Also handle the case where the user manually closes the popup
        const checkClosed = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(checkClosed);
            clearInterval(pollInterval);
            setProcessing(false);
          }
        }, 1000);

      } else {
        if (popup) popup.close();
        setError(response.message || 'Failed to initiate payment session.');
        setProcessing(false); // Re-enable if it failed so user can try again
      }
    } catch (err) {
      if (popup) popup.close();
      console.error('SafePay session error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while connecting to SafePay.');
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    router.push('/Patient/book-appointment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 sm:py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Secure Checkout
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Complete your booking via SafePay
          </p>
        </div>

        {/* Appointment Summary Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">
            Order Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-400">Doctor</span>
              <span className="font-medium text-gray-900 dark:text-white">Dr. {doctorName}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-400">Date</span>
              <span className="font-medium text-gray-900 dark:text-white">{appointmentDate}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-400">Time</span>
              <span className="font-medium text-gray-900 dark:text-white">{appointmentTime}</span>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-600 pt-3 mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Base Fee</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  PKR {baseAmount.toLocaleString('en-PK')}
                </span>
              </div>
              {followUpDiscountPct > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Follow-up Discount ({followUpDiscountPct}%)</span>
                  <span>Applied</span>
                </div>
              )}
              {financialAidDiscountPct > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Financial Aid ({financialAidDiscountPct}%)</span>
                  <span>Applied</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  PKR {finalAmount.toLocaleString('en-PK')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <FaTimesCircle className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handlePayNow}
            disabled={processing}
            className="w-full px-6 py-4 bg-[#0066FF] text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-md"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting to SafePay...</span>
              </>
            ) : (
              <>
                <FaLock className="text-sm" />
                <span>Pay PKR {finalAmount.toLocaleString('en-PK')}</span>
              </>
            )}
          </button>

          <button
            onClick={handleCancel}
            disabled={processing}
            className="w-full text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-2"
          >
            Cancel and return to booking
          </button>
        </div>

        {/* SafePay Branding footer */}
        <div className="mt-8 text-center flex items-center justify-center gap-2 text-gray-400 text-sm">
          <FaLock className="text-xs" />
          <span>Payments processed securely by <strong className="text-gray-500 dark:text-gray-300">SafePay</strong></span>
        </div>
      </div>
    </div>
  );
}
