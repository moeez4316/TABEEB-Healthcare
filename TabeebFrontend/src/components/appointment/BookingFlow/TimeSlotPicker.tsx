'use client';

import React, { useState, useEffect } from 'react';
import { TimeSlot, SlotResponse } from '@/types/appointment';
import { StatCard } from '@/components/shared/StatCard';
import { LoadingCard } from '@/components/shared/LoadingSpinner';
import { formatDateForAPI } from '@/lib/dateUtils';

interface TimeSlotPickerProps {
  doctorUid: string;
  selectedDate: Date;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot | null;
  className?: string;
  token?: string | null;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  doctorUid,
  selectedDate,
  onSlotSelect,
  selectedSlot,
  className = '',
  token
}) => {
  const [slotData, setSlotData] = useState<SlotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async () => {
    if (!doctorUid || !selectedDate) return;

    setLoading(true);
    setError(null);

    try {
      const dateStr = formatDateForAPI(selectedDate);
      const response = await fetch(
        `http://localhost:5002/api/availability/slots/${doctorUid}?date=${dateStr}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch slots: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched slot data:', data); // Debug log
      setSlotData(data);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [doctorUid, selectedDate]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingCard className={className} />;
  }

  if (error) {
    return (
      <div className={`border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-900/20 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 font-medium">Error Loading Slots</div>
          <div className="text-red-500 dark:text-red-300 text-sm mt-1">{error}</div>
          <button
            onClick={fetchSlots}
            className="mt-3 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!slotData) {
    return (
      <div className={`border border-gray-200 dark:border-slate-700 rounded-lg p-6 bg-gray-50 dark:bg-slate-800 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Select a date to view available slots
        </div>
      </div>
    );
  }

  // Handle case when doctor has no availability set for the selected date
  if (!slotData.availableSlots || slotData.availableSlots.length === 0) {
    return (
      <div className={`border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 bg-yellow-50 dark:bg-yellow-900/20 ${className}`}>
        <div className="text-center">
          <div className="text-yellow-800 dark:text-yellow-400 font-medium">No Availability</div>
          <div className="text-yellow-600 dark:text-yellow-300 text-sm mt-1">
            Dr. {slotData.doctor?.name || 'This doctor'} is not available on {formatDate(selectedDate)}. 
            Please select another date or doctor.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Time Slots</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div>{formatDate(selectedDate)}</div>
          {slotData.doctor && (
            <div className="flex items-center space-x-2 mt-1">
              <span>Dr. {slotData.doctor.name}</span>
              <span>•</span>
              <span>{slotData.doctor.specialization}</span>
              {slotData.doctor.consultationFees && (
                <>
                  <span>•</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ${slotData.doctor.consultationFees}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Information */}
      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg p-4">
        <h4 className="font-medium text-teal-900 dark:text-teal-400 mb-2">Schedule Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {slotData.schedule && (
            <>
              <div>
                <span className="text-teal-700 dark:text-teal-300">Working Hours:</span>
                <div className="font-medium text-teal-900 dark:text-teal-200">
                  {formatTime(slotData.schedule.startTime)} - {formatTime(slotData.schedule.endTime)}
                </div>
              </div>
              <div>
                <span className="text-teal-700 dark:text-teal-300">Consultation Duration:</span>
                <div className="font-medium text-teal-900 dark:text-teal-200">
                  {slotData.schedule.slotDuration} minutes
                </div>
              </div>
              {slotData.schedule.breakTime && (
                <div className="col-span-2">
                  <span className="text-teal-700 dark:text-teal-300">Break Time:</span>
                  <div className="font-medium text-teal-900 dark:text-teal-200">{slotData.schedule.breakTime}</div>
                </div>
              )}
            </>
          )}
          {!slotData.schedule && (
            <div className="col-span-2 text-gray-500 dark:text-gray-400 text-center py-2">
              Schedule information not available
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {slotData.statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard 
            label="Total Slots" 
            value={slotData.statistics.totalSlots} 
            color="default"
          />
          <StatCard 
            label="Available" 
            value={slotData.statistics.availableSlots} 
            color="green"
          />
          <StatCard 
            label="Booked" 
            value={slotData.statistics.bookedSlots} 
            color="red"
          />
          <StatCard 
            label="Utilization" 
            value={slotData.statistics.utilization} 
            color="blue"
          />
        </div>
      )}

      {/* Available Slots */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Select a Time Slot ({slotData.availableSlots.length} available)
        </h4>
        
        {slotData.availableSlots.length === 0 ? (
          <div className="border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 bg-yellow-50 dark:bg-yellow-900/20 text-center">
            <div className="text-yellow-800 dark:text-yellow-400 font-medium">No Available Slots</div>
            <div className="text-yellow-600 dark:text-yellow-300 text-sm mt-1">
              All slots are booked for this date. Please select another date.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {slotData.availableSlots.map((slot, index) => (
              <button
                key={`${slot.startTime}-${index}`}
                onClick={() => onSlotSelect(slot)}
                className={`
                  border rounded-lg p-3 text-center transition-all duration-200 shadow-sm
                  ${
                    selectedSlot?.startTime === slot.startTime
                      ? 'bg-teal-600 dark:bg-teal-500 text-white border-teal-600 dark:border-teal-500 shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 dark:hover:border-teal-500'
                  }
                  ${!slot.isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                `}
                disabled={!slot.isAvailable}
              >
                <div className="font-medium text-sm">
                  {formatTime(slot.startTime)}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {slot.duration}min
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Slot Summary */}
      {selectedSlot && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <h4 className="font-medium text-green-900 dark:text-green-400 mb-2">Selected Time Slot</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700 dark:text-green-300">Time:</span>
              <div className="font-medium text-green-900 dark:text-green-200">
                {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
              </div>
            </div>
            <div>
              <span className="text-green-700 dark:text-green-300">Duration:</span>
              <div className="font-medium text-green-900 dark:text-green-200">
                {selectedSlot.duration} minutes
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
