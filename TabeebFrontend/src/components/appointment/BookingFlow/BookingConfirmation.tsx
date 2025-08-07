'use client';

import React from 'react';
import { Appointment } from '@/types/appointment';
import { formatTime, formatDate } from '@/lib/dateUtils';
import { FaCheckCircle, FaClock, FaUserMd, FaDollarSign } from 'react-icons/fa';

interface BookingConfirmationProps {
  appointment: Appointment;
  onNewBooking: () => void;
  onViewAppointments: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  appointment,
  onNewBooking,
  onViewAppointments
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <FaCheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Appointment Booked!</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Your appointment has been successfully scheduled and is pending confirmation.
        </p>
      </div>

      {/* Appointment Details Card */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Appointment Details</h3>
        
        <div className="space-y-4">
          {/* Doctor Information */}
          <div className="flex items-center space-x-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800">
            <FaUserMd className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                Dr. {appointment.doctor?.name}
              </div>
              <div className="text-teal-600 dark:text-teal-400">{appointment.doctor?.specialization}</div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600">
              <FaClock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Date</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(new Date(appointment.appointmentDate))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600">
              <FaClock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{appointment.duration} minutes</div>
              </div>
            </div>
          </div>

          {/* Consultation Fee */}
          {appointment.consultationFees && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <FaDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Consultation Fee</div>
                <div className="font-semibold text-green-600 dark:text-green-400">${appointment.consultationFees}</div>
              </div>
            </div>
          )}

          {/* Patient Notes */}
          {appointment.patientNotes && (
            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Notes</div>
              <div className="text-gray-800 dark:text-gray-300">{appointment.patientNotes}</div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
              Pending Confirmation
            </span>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-teal-900 dark:text-teal-400 mb-2">What's Next?</h4>
        <ul className="text-sm text-teal-800 dark:text-teal-300 space-y-1">
          <li>• You'll receive a confirmation notification once the doctor approves your appointment</li>
          <li>• Please arrive 15 minutes before your scheduled time</li>
          <li>• Bring a valid ID and insurance card if applicable</li>
          <li>• You can reschedule or cancel up to 2 hours before the appointment</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">        
        <button
          onClick={onViewAppointments}
          className="flex-1 bg-teal-600 dark:bg-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          View My Appointments
        </button>
        
        <button
          onClick={onNewBooking}
          className="flex-1 bg-green-600 dark:bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Book Another Appointment
        </button>
      </div>

      {/* Appointment ID */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Appointment ID: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{appointment.id}</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Keep this ID for future reference
        </p>
      </div>
    </div>
  );
};
