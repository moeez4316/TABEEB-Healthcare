'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { FaUniversity, FaMobileAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
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

  const [paymentMethod, setPaymentMethod] = useState('jazzcash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if no amount or appointment data
    if (!amount || !appointmentId) {
      router.push('/Patient/book-appointment');
    }
  }, [amount, appointmentId, router]);

  const handlePayment = async () => {
    setError('');
    setProcessing(true);

    // Basic validation
    if (paymentMethod === 'bank' && !accountNumber) {
      setError('Please enter your IBAN or Account Number');
      setProcessing(false);
      return;
    }

    if ((paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && !phoneNumber) {
      setError('Please enter your phone number');
      setProcessing(false);
      return;
    }

    if (phoneNumber && phoneNumber.length < 11) {
      setError('Please enter a valid 11-digit phone number');
      setProcessing(false);
      return;
    }

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // TODO: Integrate with GoFast Pay or other Pakistani payment gateway
        // For now, just confirm the appointment
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetchWithRateLimit(`${API_URL}/api/appointments/${appointmentId}/confirm-payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethod,
            phoneNumber: phoneNumber || null,
            accountNumber: accountNumber || null,
            amount: parseFloat(amount),
            transactionId: `TXN${Date.now()}`, // Dummy transaction ID
          }),
        });

        if (response.ok) {
          // Payment successful - redirect to success page
          router.push(`/Patient/payment/success?appointmentId=${appointmentId}&amount=${amount}`);
        } else {
          setError('Payment processing failed. Please try again.');
          setProcessing(false);
        }
      } catch (err) {
        console.error('Payment error:', err);
        setError('An error occurred. Please try again.');
        setProcessing(false);
      }
    }, 2000);
  };

  const handleCancel = () => {
    // Cancel payment and return to booking
    router.push('/Patient/book-appointment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Payment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Secure payment for your appointment
          </p>
        </div>

        {/* Appointment Summary Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Appointment Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
              <span className="font-medium text-gray-900 dark:text-white">Dr. {doctorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="font-medium text-gray-900 dark:text-white">{appointmentDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Time:</span>
              <span className="font-medium text-gray-900 dark:text-white">{appointmentTime}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-600 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  PKR {parseFloat(amount).toLocaleString('en-PK')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Payment Method
          </h2>

          <div className="space-y-3">
            {/* JazzCash */}
            <button
              onClick={() => setPaymentMethod('jazzcash')}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'jazzcash'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FaMobileAlt className="text-2xl text-red-600" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">JazzCash</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pay with JazzCash Mobile Account</div>
                </div>
                {paymentMethod === 'jazzcash' && (
                  <FaCheckCircle className="text-teal-500 text-xl" />
                )}
              </div>
            </button>

            {/* Easypaisa */}
            <button
              onClick={() => setPaymentMethod('easypaisa')}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'easypaisa'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FaMobileAlt className="text-2xl text-green-600" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">Easypaisa</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pay with Easypaisa Mobile Account</div>
                </div>
                {paymentMethod === 'easypaisa' && (
                  <FaCheckCircle className="text-teal-500 text-xl" />
                )}
              </div>
            </button>

            {/* Bank Transfer */}
            <button
              onClick={() => setPaymentMethod('bank')}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'bank'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FaUniversity className="text-2xl text-blue-600" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">Bank Transfer</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Direct bank account transfer</div>
                </div>
                {paymentMethod === 'bank' && (
                  <FaCheckCircle className="text-teal-500 text-xl" />
                )}
              </div>
            </button>

          </div>

          {/* Payment Details Input - Mobile Number for JazzCash/Easypaisa */}
          {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                placeholder="03001234567"
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your 11-digit mobile number
              </p>
            </div>
          )}

          {/* IBAN/Account Number for Bank Transfer */}
          {paymentMethod === 'bank' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                IBAN / Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.toUpperCase())}
                placeholder="PK36ABCD0123456789012345"
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your IBAN or bank account number
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <FaTimesCircle className="text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCancel}
            disabled={processing}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Confirm Payment</span>
                <span className="font-bold">PKR {parseFloat(amount).toLocaleString('en-PK')}</span>
              </>
            )}
          </button>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            🔒 Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
