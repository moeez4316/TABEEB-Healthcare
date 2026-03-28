'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { FaCheckCircle, FaTimesCircle, FaClock, FaInfoCircle, FaCopy } from 'react-icons/fa';
import { apiFetchJson } from '@/lib/api-client';
import { LinearProgress, useUploadProgress } from '@/components/shared/UploadProgress';
import { uploadFile, validateFile } from '@/lib/cloudinary-upload';

type VisiblePaymentStatus = 'UNPAID' | 'IN_PROGRESS' | 'CONFIRMED' | 'DISPUTED';

interface PaymentStatusResponse {
  appointmentId: string;
  payment: {
    status: VisiblePaymentStatus;
    isDisputed: boolean;
    canPayNow: boolean;
    dueAt?: string | null;
    isOverdue?: boolean;
    isWindowStarted?: boolean;
    proofUrl?: string | null;
    proofUploadedAt?: string | null;
  };
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  // Get payment details from URL params
  const amount = searchParams.get('amount') || '0';
  const baseAmountParam = searchParams.get('baseAmount');
  const amountAfterFollowUpParam = searchParams.get('amountAfterFollowUp');
  const followUpDiscountPctParam = searchParams.get('followUpDiscountPct');
  const financialAidDiscountPctParam = searchParams.get('financialAidDiscountPct');
  const appointmentId = searchParams.get('appointmentId') || '';
  const doctorName = searchParams.get('doctorName') || 'Doctor';
  const appointmentDate = searchParams.get('date') || '';
  const appointmentTime = searchParams.get('time') || '';

  const finalAmount = Number.parseFloat(amount) || 0;
  const baseAmount = Number.parseFloat(baseAmountParam || amount) || finalAmount;
  const followUpDiscountPct = Number.parseFloat(followUpDiscountPctParam || '0') || 0;
  const financialAidDiscountPct = Number.parseFloat(financialAidDiscountPctParam || '0') || 0;
  const amountAfterFollowUp = Number.parseFloat(amountAfterFollowUpParam || `${baseAmount}`) || baseAmount;
  const followUpDiscountAmount = Math.max(0, baseAmount - amountAfterFollowUp);
  const financialAidDiscountAmount = Math.max(0, amountAfterFollowUp - finalAmount);
  const showBreakdown = followUpDiscountPct > 0 || financialAidDiscountPct > 0 || baseAmount > finalAmount;

  // Clinic payment details
  const CLINIC_JAZZCASH = '+92 302 4400906';
  const CLINIC_NAME = 'TABEEB Healthcare';

  const [selectedProof, setSelectedProof] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deferring, setDeferring] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<VisiblePaymentStatus>('UNPAID');
  const [isDisputed, setIsDisputed] = useState(false);
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);
  const [isWindowStarted, setIsWindowStarted] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const uploadProgress = useUploadProgress();

  const hasSubmittedProof = Boolean(proofUrl);

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

  const loadStatus = async () => {
    if (!appointmentId || !token) return;
    setStatusLoading(true);
    try {
      const data = await apiFetchJson<PaymentStatusResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/payment-status`,
        { token }
      );
      setPaymentStatus(data.payment.status || 'UNPAID');
      setIsDisputed(Boolean(data.payment.isDisputed));
      setDueAt(data.payment.dueAt || null);
      setIsOverdue(Boolean(data.payment.isOverdue));
      setIsWindowStarted(Boolean(data.payment.isWindowStarted));
      setProofUrl(data.payment.proofUrl || null);
    } catch {
      // Keep page usable even if status load fails.
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (!appointmentId || !token) return;
    void loadStatus();
  }, [appointmentId, token]);

  const handleConfirm = async () => {
    setError('');
    setSuccess('');

    if (!selectedProof) {
      setError('Please select a payment screenshot first');
      return;
    }

    if (hasSubmittedProof) {
      setError('Payment screenshot already submitted for this appointment');
      return;
    }

    const validation = validateFile(selectedProof, {
      maxSizeMB: 5,
      allowedTypes: ['image/*'],
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid screenshot file');
      return;
    }

    setProcessing(true);
    uploadProgress.startUpload();

    try {
      const uploaded = await uploadFile(selectedProof, 'payment-proof', token!, {
        docType: appointmentId,
        onProgress: (progress) => {
          uploadProgress.updateProgress(progress.percentage || 0);
        },
      });

      uploadProgress.startProcessing();

      await apiFetchJson(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/payment-proof`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          publicId: uploaded.publicId,
          resourceType: uploaded.resourceType,
        }),
      });

      uploadProgress.complete();
      setProofUrl(uploaded.secureUrl || uploaded.url);
      setSelectedProof(null);
      router.replace(`/Patient/payment/success?appointmentId=${appointmentId}&amount=${amount}`);
      return;
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      uploadProgress.fail(err instanceof Error ? err.message : 'Upload failed');
      setProcessing(false);
      return;
    }

    setProcessing(false);
  };

  const handlePayLater = () => {
    if (hasSubmittedProof) {
      router.push('/Patient/appointments');
      return;
    }
    setDeferring(true);
    router.push('/Patient/appointments?payment=deferred');
  };

  const handleCancel = () => {
    router.push('/Patient/book-appointment');
  };

  const statusLabel =
    paymentStatus === 'IN_PROGRESS'
      ? 'In Progress'
      : paymentStatus === 'CONFIRMED'
        ? 'Confirmed'
        : paymentStatus === 'DISPUTED'
          ? 'Disputed'
          : 'Unpaid';

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
              {showBreakdown && (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600 dark:text-gray-400">Base Fee:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      PKR {baseAmount.toLocaleString('en-PK')}
                    </span>
                  </div>

                  {followUpDiscountPct > 0 && (
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600 dark:text-gray-400">
                        Follow-up Discount ({followUpDiscountPct}%):
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        - PKR {followUpDiscountAmount.toLocaleString('en-PK')}
                      </span>
                    </div>
                  )}

                  {financialAidDiscountPct > 0 && (
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600 dark:text-gray-400">
                        Financial Aid Discount ({financialAidDiscountPct}%):
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        - PKR {financialAidDiscountAmount.toLocaleString('en-PK')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                <span className="text-xl sm:text-2xl font-bold text-teal-600 dark:text-teal-400">
                  PKR {finalAmount.toLocaleString('en-PK')}
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
                You can pay immediately or later. Final deadline is <strong>24 hours after appointment completion</strong>.
              </p>
              <div className="mt-3 text-xs sm:text-sm text-blue-900 dark:text-blue-300">
                <p>
                  Payment Status: <strong>{statusLoading ? 'Loading...' : statusLabel}</strong>
                </p>
                {dueAt && (
                  <p>
                    Due By: <strong>{new Date(dueAt).toLocaleString('en-PK')}</strong>
                  </p>
                )}
                {isWindowStarted && isOverdue && (
                  <p className="mt-1 text-rose-700 dark:text-rose-300 font-semibold">Payment is overdue.</p>
                )}
                {isDisputed && (
                  <p className="mt-1 text-rose-700 dark:text-rose-300 font-semibold">Payment is disputed. Contact support immediately.</p>
                )}
              </div>
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
              <FaInfoCircle className="text-teal-600 dark:text-teal-400" />
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

        {/* Screenshot Upload */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-slate-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Upload Payment Screenshot (required)
          </label>
          <input
            type="file"
            accept="image/*"
            disabled={hasSubmittedProof || processing}
            onChange={(e) => setSelectedProof(e.target.files?.[0] || null)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Only screenshot images are accepted. Max size: 5MB.
          </p>

          {proofUrl && (
            <p className="text-xs mt-2 text-teal-700 dark:text-teal-300">
              Proof already uploaded. Submission is locked for security.
            </p>
          )}
        </div>

        {/* Warning */}
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
                <li>• Upload payment screenshot after transfer for admin verification</li>
              </ul>
            </div>
          </div>
        </div>

        {processing && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-slate-700">
            <div className="max-w-xl mx-auto">
              <LinearProgress
                progress={uploadProgress.progress}
                status={uploadProgress.status}
                fileName={selectedProof?.name || 'payment-screenshot'}
                errorMessage={uploadProgress.error || undefined}
                size="md"
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <FaTimesCircle className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-300 text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <FaCheckCircle className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-800 dark:text-emerald-300 text-sm sm:text-base">{success}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={handlePayLater}
            disabled={processing || deferring || hasSubmittedProof}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {hasSubmittedProof ? 'Already Submitted' : deferring ? 'Saving...' : 'Pay Later'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !selectedProof || hasSubmittedProof}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <FaCheckCircle />
                <span>Submit Payment Screenshot</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={handleCancel}
            disabled={processing || deferring}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline"
          >
            Back to booking
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
