'use client';

import React, { useState } from 'react';

// Helper function to check if a date is today
const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

interface DatePickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  availableDates?: Date[];
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
  className = '',
  availableDates = []
}) => {
  // Set default minDate to today at 00:00:00 if not provided
  const defaultMinDate = minDate || (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  })();
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Allow today and future dates (date should be >= today, not > today)
    return checkDate < today || checkDate < defaultMinDate || checkDate > maxDate;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasAvailability = (date: Date) => {
    return availableDates.some(availableDate => 
      availableDate.getDate() === date.getDate() &&
      availableDate.getMonth() === date.getMonth() &&
      availableDate.getFullYear() === date.getFullYear()
    );
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const quickDateButtons = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { label: 'Next Week', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  ].filter(button => {
    const buttonDate = new Date(button.date);
    buttonDate.setHours(0, 0, 0, 0);
    return !isDateDisabled(buttonDate);
  }); // Only show non-disabled dates

  const days = getDaysInMonth(currentMonth);

  return (
    <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          type="button"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatMonthYear(currentMonth)}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          type="button"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Quick Date Selection - Only show if there are quick dates available */}
      {quickDateButtons.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Quick Selection:</div>
          <div className="flex flex-wrap gap-2">
            {quickDateButtons.map((button) => (
              <button
                key={button.label}
                onClick={() => onDateSelect(button.date)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  isDateSelected(button.date)
                    ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-md'
                    : hasAvailability(button.date)
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/40 border border-teal-300 dark:border-teal-600'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
                type="button"
              >
                {button.label}
                {hasAvailability(button.date) && (
                  <span className="ml-1 w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <div key={index} className="aspect-square">
            {date ? (
              <button
                onClick={() => onDateSelect(date)}
                disabled={isDateDisabled(date)}
                className={`
                  w-full h-full flex items-center justify-center text-sm rounded-lg transition-all duration-200 relative font-medium
                  ${
                    isDateSelected(date)
                      ? 'ring-2 ring-teal-500 dark:ring-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                      : isDateDisabled(date)
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-slate-700'
                      : isToday(date)
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-transparent hover:border-gray-200 dark:hover:border-slate-600'
                  }
                `}
                type="button"
              >
                <span className="relative z-10">{date.getDate()}</span>
                {/* Availability indicator (Doctor style) */}
                {hasAvailability(date) && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Available"></div>
                  </div>
                )}
              </button>
            ) : (
              <div></div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Date Display */}
      {selectedDate ? (
        <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg">
          <div className="text-sm font-medium text-teal-900 dark:text-teal-400">Selected Date</div>
          <div className="text-teal-700 dark:text-teal-300">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">👆</span>
            </div>
            <div className="text-sm font-medium text-blue-900 dark:text-blue-400">
              Select a date to continue
            </div>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 ml-7">
            Choose from highlighted dates with green dots for available appointments
          </div>
        </div>
      )}

      {/* Enhanced Legend */}
      <div className="mt-4 space-y-3">
        {availableDates.length > 0 && (
          <div className="p-3 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-400">Doctor Availability</h4>
              <span className="text-xs text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                {availableDates.length} dates available
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-teal-50 dark:bg-teal-900/30 border-2 border-teal-300 dark:border-teal-600 rounded flex items-center justify-center relative">
                    <span className="text-xs font-medium text-teal-700 dark:text-teal-300">13</span>
                    <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
                <span className="text-green-800 dark:text-green-300 font-medium">Available dates</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">15</span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">No availability</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 ring-2 ring-teal-500 dark:ring-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-300">16</span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">Selected date</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-green-700 dark:text-green-400">
              💡 Click on highlighted dates with green dots to see available time slots
            </div>
          </div>
        )}
        
        {availableDates.length === 0 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs text-yellow-800">!</span>
              </div>
              <span className="text-yellow-800 dark:text-yellow-400 font-medium text-sm">
                No availability found for this doctor
              </span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 ml-6">
              The doctor may not have set their availability yet. Please try selecting another doctor or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
