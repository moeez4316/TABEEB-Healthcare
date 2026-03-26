'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { FaUniversity, FaMobileAlt, FaCheckCircle, FaTimesCircle, FaClock, FaInfoCircle, FaCopy } from 'react-icons/fa';
import { fetchWithRateLimit } from '@/lib/api-utils';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  // Get payment details from URL params
  const amount = searchParams.get('amount') || '0';
  const appointmentId = searchParams.get('appointmentId') || '';
  const doctorName = searchParams.get('doctorName') || 'Doctor';
  const appointmentDate = searchParams.get('date') || '';
  const appointmentTime = searchParams.get('time') || '';

  // Clinic payment details
  const CLINIC_JAZZCASH = '+92 302 4400906';
  const CLINIC_NAME = 'TABEEB Healthcare';

  const [patientMobileNumber, setPatientMobileNumber] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if no amount or appointment data
    if (!amount || !appointmentId) {
      router.push('/Patient/book-appointment');
    }
  }, [amount, appointmentId, router]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirm = async () => {
    setError('');

    // Validate mobile number
    if (!patientMobileNumber) {
      setError('Please enter your mobile number');
      return;
    }

    if (patientMobileNumber.length < 11) {
      setError('Please enter a valid 11-digit mobile number');
      return;
    }

    if (!acknowledged) {
      setError('Please acknowledge that you understand the payment instructions');
      return;
    }

    setProcessing(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetchWithRateLimit(`${API_URL}/api/appointments/${appointmentId}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: 'manual_bank_transfer',
          phoneNumber: patientMobileNumber,
          amount: parseFloat(amount),
          transactionId: `MAN${Date.now()}`,
        }),
      });

      if (response.ok) {
        router.push(`/Patient/payment/success?appointmentId=${appointmentId}&amount=${amount}`);
      } else {
        setError('Failed to process payment. Please try again.');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred. Please try again.');
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    router.push('/Patient/book-appointment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Instructions
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            JazzCash transfer for your appointment
          </p>
        </div>

        {/* Appointment Summary Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Appointment Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
              <span className="font-medium text-gray-900 dark:text-white">Dr. {doctorName}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="font-medium text-gray-900 dark:text-white">{appointmentDate}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-400">Time:</span>
              <span className="font-medium text-gray-900 dark:text-white">{appointmentTime}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-600 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                <span className="text-xl sm:text-2xl font-bold text-teal-600 dark:text-teal-400">
                  PKR {parseFloat(amount).toLocaleString('en-PK')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Instructions Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 text-sm sm:text-base">
                Payment Deadline
              </h3>
              <p className="text-blue-800 dark:text-blue-400 text-xs sm:text-sm leading-relaxed">
                Please transfer the payment within <strong>24 hours after your appointment is completed</strong> to the TABEEB Healthcare account details provided below.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Instructions Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Send Payment via JazzCash
          </h2>

          {/* JazzCash Number Section */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <FaMobileAlt className="text-teal-600 dark:text-teal-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                JazzCash Number
              </label>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-3 font-mono text-sm sm:text-base text-gray-900 dark:text-white">
                  {CLINIC_JAZZCASH}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(CLINIC_JAZZCASH, 'jazzcash')}
                className="p-2 sm:p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors flex-shrink-0"
                title="Copy to clipboard"
              >
                <FaCopy className="text-sm" />
              </button>
            </div>
            {copiedField === 'jazzcash' && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">Copied to clipboard!</p>
            )}
          </div>

          {/* Account Name */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
              Account Name
            </label>
            <div className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-sm sm:text-base text-gray-900 dark:text-white">
              {CLINIC_NAME}
            </div>
          </div>
        </div>

        {/* Patient Mobile Number Input */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-slate-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Your Mobile Number (for verification)
          </label>
          <input
            type="tel"
            value={patientMobileNumber}
            onChange={(e) => setPatientMobileNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
            placeholder="03001234567"
            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Enter your 11-digit mobile number where you can be reached
          </p>
        </div>

        {/* Warning & Acknowledgement */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-start gap-3">
            <FaClock className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2 text-sm sm:text-base">
                Important Reminders
              </h3>
              <ul className="text-amber-800 dark:text-amber-400 text-xs sm:text-sm space-y-1">
                <li>• Payment must be completed within 24 hours after your appointment</li>
                <li>• Transfer payment to TABEEB Healthcare account provided above</li>
                <li>• Keep the transaction receipt for your records</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Acknowledgement Checkbox */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-slate-700">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 mt-1 cursor-pointer dark:border-slate-600"
            />
            <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              I acknowledge that I understand the payment instructions and will transfer the payment within 24 hours after my appointment is completed
            </span>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <FaTimesCircle className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-300 text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={handleCancel}
            disabled={processing}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !acknowledged}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FaCheckCircle />
                <span>I Acknowledge & Continue</span>
              </>
            )}
          </button>
        </div>

        {/* Support Info */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Need help? Contact us at{' '}
            <a href="mailto:support@tabeebemail.me" className="text-teal-600 dark:text-teal-400 hover:underline">
              support@tabeebemail.me
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
