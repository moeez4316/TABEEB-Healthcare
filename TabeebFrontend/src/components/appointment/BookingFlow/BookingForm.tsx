'use client';

import React, { useState } from 'react';
import { Doctor, TimeSlot, AppointmentBooking } from '@/types/appointment';
import { formatTime, formatDate, formatDateForAPI } from '@/lib/dateUtils';
import { DocumentSelector } from '@/components/appointment/DocumentSelector';

interface BookingFormProps {
  doctor: Doctor;
  selectedDate: Date;
  selectedSlot: TimeSlot;
  onBookingSubmit: (booking: AppointmentBooking & { patientNotes: string; sharedDocumentIds?: string[] }) => Promise<void>;
  loading?: boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  doctor,
  selectedDate,
  selectedSlot,
  onBookingSubmit,
  loading = false
}) => {
  const [patientNotes, setPatientNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    const booking = {
      doctorUid: doctor.uid,
      appointmentDate: formatDateForAPI(selectedDate),
      startTime: selectedSlot.startTime,
      patientNotes: patientNotes || 'No specific notes provided',
      sharedDocumentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined
    };

    await onBookingSubmit(booking);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Appointment Details</h3>
      
      {/* Appointment Summary */}
      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-teal-900 dark:text-teal-400 mb-3">Booking Summary</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-teal-700 dark:text-teal-300">Doctor:</span>
            <div className="font-medium text-teal-900 dark:text-teal-200">Dr. {doctor.name}</div>
            <div className="text-teal-700 dark:text-teal-400">{doctor.specialization}</div>
          </div>
          
          <div>
            <span className="text-teal-700 dark:text-teal-300">Date & Time:</span>
            <div className="font-medium text-teal-900 dark:text-teal-200">
              {formatDate(selectedDate)}
            </div>
            <div className="text-teal-700 dark:text-teal-400">
              {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
            </div>
          </div>
          
          <div>
            <span className="text-teal-700 dark:text-teal-300">Duration:</span>
            <div className="font-medium text-teal-900 dark:text-teal-200">{selectedSlot.duration} minutes</div>
          </div>
          
          {doctor.consultationFees && (
            <div>
              <span className="text-teal-700 dark:text-teal-300">Consultation Fee:</span>
              <div className="font-medium text-green-600 dark:text-green-400">${doctor.consultationFees}</div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Notes */}
        <div>
          <label htmlFor="patientNotes" className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Visit / Symptoms
          </label>
          <textarea
            id="patientNotes"
            value={patientNotes}
            onChange={(e) => setPatientNotes(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please describe your symptoms or reason for the appointment..."
          />
          <p className="text-xs text-gray-500 mt-1">
            This information helps the doctor prepare for your consultation.
          </p>
        </div>

        {/* Emergency Contact */}
        <div>
          <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Contact (Optional)
          </label>
          <input
            type="text"
            id="emergencyContact"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Emergency contact name and phone number"
          />
        </div>

        {/* Document Sharing */}
        <div>
          <DocumentSelector
            selectedDocuments={selectedDocuments}
            onSelectionChange={setSelectedDocuments}
          />
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="agreeToTerms"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">
              Privacy Policy
            </a>
            . I understand that this appointment is subject to doctor&apos;s availability and confirmation.
          </label>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-medium text-yellow-800 mb-2">Important Notes:</h5>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Please arrive 15 minutes before your scheduled appointment</li>
            <li>• Bring a valid ID and insurance card if applicable</li>
            <li>• You will receive a confirmation notification once the doctor approves your appointment</li>
            <li>• Cancellations must be made at least 2 hours in advance</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !agreeToTerms}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
            ${
              loading || !agreeToTerms
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
            }
          `}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Booking Appointment...</span>
            </div>
          ) : (
            'Book Appointment'
          )}
        </button>
      </form>
    </div>
  );
};
