import React from 'react';
import { FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { AvailabilityDay } from '@/types/doctor-profile';
import { format } from 'date-fns';

interface AvailabilityPreviewProps {
  availability: AvailabilityDay[];
  onViewFullCalendar?: () => void;
}

export const AvailabilityPreview: React.FC<AvailabilityPreviewProps> = ({
  availability,
  onViewFullCalendar
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Availability (Next 7 Days)
        </h2>
        {onViewFullCalendar && (
          <button
            onClick={onViewFullCalendar}
            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold transition-colors"
          >
            View Full Calendar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {availability.map((day) => (
          <div
            key={day.date}
            className={`rounded-xl p-5 shadow-lg border transition-all duration-300 ${
              day.isAvailable && day.availableSlots > 0
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:shadow-xl'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(day.date), 'MMM d')}
                </p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {day.dayOfWeek}
                </p>
              </div>
              {day.isAvailable && day.availableSlots > 0 ? (
                <FaCheckCircle className="text-green-500 text-2xl" />
              ) : (
                <FaTimesCircle className="text-gray-400 text-2xl" />
              )}
            </div>

            {day.isAvailable && day.availableSlots > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <FaClock />
                  <span>
                    {day.startTime} - {day.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaCalendarAlt className="text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {day.availableSlots} slot{day.availableSlots !== 1 ? 's' : ''} available
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Not available
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
