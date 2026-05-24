'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Doctor, TimeSlot, AppointmentBooking } from '@/types/appointment';
import { formatTime, formatDate, formatDateForAPI } from '@/lib/dateUtils';
import { DocumentSelector } from '@/components/appointment/DocumentSelector';
import { CurrentMedicationsModal } from '@/components/appointment/CurrentMedicationsModal';
import { FaPills } from 'react-icons/fa';
import { useAuth } from '@/lib/auth-context';
import { financialAidAPI } from '@/lib/financial-aid-api';

interface BookingFormProps {
  doctor: Doctor;
  selectedDate: Date;
  selectedSlot: TimeSlot;
  onBookingSubmit: (booking: AppointmentBooking & { patientNotes: string; sharedDocumentIds?: string[] }) => Promise<void>;
  isFollowUp?: boolean;
  loading?: boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  doctor,
  selectedDate,
  selectedSlot,
  onBookingSubmit,
  isFollowUp = false,
  loading = false
}) => {
  const { token } = useAuth();
  const [patientNotes, setPatientNotes] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showMedicationsModal, setShowMedicationsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [financialAidDiscountPct, setFinancialAidDiscountPct] = useState(0);

  // Combined loading state to prevent double-clicks
  const isLoading = loading || isSubmitting;

  useEffect(() => {
    let isMounted = true;

    const loadFinancialAidStatus = async () => {
      if (!token) {
        if (isMounted) setFinancialAidDiscountPct(0);
        return;
      }

      try {
        const response = await financialAidAPI.getMyFinancialAidRequest(token);
        if (!isMounted) return;

        if (response.request?.status === 'APPROVED') {
          setFinancialAidDiscountPct(response.request.requestedDiscountPercent ?? response.discountPercent ?? 80);
        } else {
          setFinancialAidDiscountPct(0);
        }
      } catch {
        if (isMounted) setFinancialAidDiscountPct(0);
      }
    };

    void loadFinancialAidStatus();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const pricing = useMemo(() => {
    if (!doctor.consultationFees) {
      return null;
    }

    const roundCurrency = (value: number) => Number(value.toFixed(2));
    const baseFee = roundCurrency(doctor.consultationFees * (selectedSlot.duration / 60));
    const followUpDiscount = isFollowUp ? Math.max(0, Math.min(100, doctor.followUpPercentage ?? 50)) : 0;
    const amountAfterFollowUp = roundCurrency(baseFee * ((100 - followUpDiscount) / 100));
    const financialAidDiscountAmount = roundCurrency(amountAfterFollowUp * (financialAidDiscountPct / 100));
    const finalEstimate = roundCurrency(amountAfterFollowUp - financialAidDiscountAmount);

    return {
      baseFee,
      followUpDiscount,
      amountAfterFollowUp,
      financialAidDiscountPct,
      financialAidDiscountAmount,
      finalEstimate,
    };
  }, [doctor.consultationFees, doctor.followUpPercentage, selectedSlot.duration, isFollowUp, financialAidDiscountPct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    if (!agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const booking = {
        doctorUid: doctor.uid,
        appointmentDate: formatDateForAPI(selectedDate),
        startTime: selectedSlot.startTime,
        patientNotes: patientNotes || 'No specific notes provided',
        sharedDocumentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined
      };

      await onBookingSubmit(booking);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Appointment Details</h3>
      
      {/* Appointment Summary */}
      <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Booking Summary</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-300">Doctor:</span>
            <div className="font-medium text-slate-900 dark:text-slate-100">Dr. {doctor.name}</div>
            <div className="text-teal-700 dark:text-teal-300">{doctor.specialization}</div>
          </div>
          
          <div>
            <span className="text-slate-600 dark:text-slate-300">Date & Time:</span>
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {formatDate(selectedDate)}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
            </div>
          </div>
          
          <div>
            <span className="text-slate-600 dark:text-slate-300">Duration:</span>
            <div className="font-medium text-slate-900 dark:text-slate-100">{selectedSlot.duration} minutes</div>
          </div>
          
          {pricing && (
            <div>
              <span className="text-slate-600 dark:text-slate-300">Estimated Final Fee:</span>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                PKR {pricing.finalEstimate.toLocaleString('en-PK')}
              </div>
            </div>
          )}
        </div>

        {pricing && (
          <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Fee Breakdown</h5>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Base consultation fee</span>
                <span>PKR {pricing.baseFee.toLocaleString('en-PK')}</span>
              </div>

              {pricing.followUpDiscount > 0 && (
                <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                  <span>Follow-up discount ({pricing.followUpDiscount}%)</span>
                  <span>- PKR {(pricing.baseFee - pricing.amountAfterFollowUp).toLocaleString('en-PK')}</span>
                </div>
              )}

              {pricing.financialAidDiscountPct > 0 && (
                <div className="flex items-center justify-between text-teal-700 dark:text-teal-300">
                  <span>Financial aid discount ({pricing.financialAidDiscountPct}%)</span>
                  <span>- PKR {pricing.financialAidDiscountAmount.toLocaleString('en-PK')}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-100">
                <span>Estimated payable</span>
                <span>PKR {pricing.finalEstimate.toLocaleString('en-PK')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Notes */}
        <div>
          <label htmlFor="patientNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Reason for Visit / Symptoms
          </label>
          <textarea
            id="patientNotes"
            value={patientNotes}
            onChange={(e) => setPatientNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Describe your symptoms or reason for the appointment..."
          />
        </div>

        {/* Document Sharing */}
        <DocumentSelector
          selectedDocuments={selectedDocuments}
          onSelectionChange={setSelectedDocuments}
        />

        {/* Current Medications */}
        <button
          type="button"
          onClick={() => setShowMedicationsModal(true)}
          className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium text-sm transition-colors"
        >
          <FaPills className="w-4 h-4" />
          <span>View Current Medications</span>
        </button>

        {/* Terms */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="agreeToTerms"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-teal-600 border-gray-300 dark:border-slate-600 rounded focus:ring-teal-500"
          />
          <label htmlFor="agreeToTerms" className="text-sm text-gray-700 dark:text-gray-300">
            I agree to the{' '}
            <a href="/complaint-policy" className="text-teal-600 dark:text-teal-400 hover:underline">
              Terms
            </a>{' '}and{' '}
            <a href="/privacy-policy" className="text-teal-600 dark:text-teal-400 hover:underline">
              Privacy Policy
            </a>. Appointment subject to confirmation.
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !agreeToTerms}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
            ${
              isLoading || !agreeToTerms
                ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                : 'bg-teal-600 dark:bg-teal-500 text-white hover:bg-teal-700 dark:hover:bg-teal-600 shadow-md hover:shadow-lg'
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Booking...</span>
            </div>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </form>

      {/* Current Medications Modal */}
      <CurrentMedicationsModal
        isOpen={showMedicationsModal}
        onClose={() => setShowMedicationsModal(false)}
      />
    </div>
  );
};
