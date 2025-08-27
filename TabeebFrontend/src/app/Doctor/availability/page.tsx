'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatDateForAPI, getTodayForAPI } from '@/lib/dateUtils';
import { FaClock, FaPlus, FaTimes, FaSave, FaCalendarAlt } from 'react-icons/fa';

interface BreakTime {
  startTime: string;
  endTime: string;
}

interface Availability {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  slotDuration?: number;
  breakTimes?: BreakTime[];
}

export default function DoctorAvailabilityPage() {
  const { token } = useAuth();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form for adding new availability
  const [newAvailability, setNewAvailability] = useState<Availability>({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
    slotDuration: 30,
    breakTimes: []
  });

  // State for managing break times during form input
  const [newBreakTime, setNewBreakTime] = useState({ startTime: '', endTime: '' });
  const MAX_BREAK_TIMES = 4;

  const fetchAvailability = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    // Keep success message if it exists, only clear error
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/availability/doctor`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      console.log('Fetched availability:', data);
      
      // Backend returns the availability array directly, not wrapped in an object
      setAvailabilities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load availability. Please try again.');
      setAvailabilities([]);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const addAvailability = async () => {
    if (!token || !newAvailability.date) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/availability/set`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: newAvailability.date,
          startTime: newAvailability.startTime,
          endTime: newAvailability.endTime,
          slotDuration: newAvailability.slotDuration || 30,
          isAvailable: newAvailability.isAvailable,
          breakTimes: newAvailability.breakTimes || []
        }),
      });

      if (!response.ok) {
        // Extract specific error message from backend
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || 'Failed to add availability';
        throw new Error(errorMessage);
      }

      // Reset form and refresh list
      setNewAvailability({
        date: '',
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
        slotDuration: 30,
        breakTimes: []
      });
      
      setNewBreakTime({ startTime: '', endTime: '' });
      setSuccess('Availability added successfully!');
      
      fetchAvailability();
      console.log('Availability added successfully');
    } catch (err) {
      console.error('Error adding availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to add availability. Please try again.');
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const deleteAvailability = async (id: string) => {
    if (!token) return;

    setError(null);
    setSuccess(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/availability/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete availability');
      }

      const result = await response.json();
      
      // Show success message if there were existing appointments
      if (result.warning) {
        alert(`✅ ${result.message}\n\n⚠️ ${result.warning}`);
      } else {
        setSuccess(result.message || 'Availability deleted successfully');
        console.log(result.message);
      }

      fetchAvailability();
    } catch (err) {
      console.error('Error deleting availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete availability. Please try again.');
      setSuccess(null);
    }
  };

  // Generate next 30 days for quick selection
  const generateQuickDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(formatDateForAPI(date));
    }
    
    return dates;
  };

  const quickDates = generateQuickDates();

  // Functions for managing break times
  const addBreakTime = () => {
    // Clear any existing messages
    setError(null);
    setSuccess(null);

    if (!newBreakTime.startTime || !newBreakTime.endTime) {
      setError('Please fill in both start and end time for break');
      return;
    }

    if (newBreakTime.startTime >= newBreakTime.endTime) {
      setError('Break start time must be before end time');
      return;
    }

    // Check if break times are within working hours
    if (newAvailability.startTime && newAvailability.endTime) {
      if (newBreakTime.startTime < newAvailability.startTime || newBreakTime.endTime > newAvailability.endTime) {
        setError('Break times must be within working hours');
        return;
      }
    }

    const currentBreakTimes = newAvailability.breakTimes || [];
    if (currentBreakTimes.length >= MAX_BREAK_TIMES) {
      setError(`Maximum ${MAX_BREAK_TIMES} break times allowed per day`);
      return;
    }

    // Check for overlaps
    const newStart = newBreakTime.startTime;
    const newEnd = newBreakTime.endTime;
    const hasOverlap = currentBreakTimes.some(bt => 
      (newStart < bt.endTime && newEnd > bt.startTime)
    );

    if (hasOverlap) {
      setError('Break times cannot overlap');
      return;
    }

    // Check minimum gap between break times (15 minutes)
    const sortedBreaks = [...currentBreakTimes, newBreakTime].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );

    for (let i = 0; i < sortedBreaks.length - 1; i++) {
      const currentEnd = new Date(`2000-01-01T${sortedBreaks[i].endTime}:00`);
      const nextStart = new Date(`2000-01-01T${sortedBreaks[i + 1].startTime}:00`);
      const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (gapMinutes < 15 && gapMinutes > 0) {
        setError('Minimum 15 minutes gap required between break times');
        return;
      }
    }

    // If all validations pass, add the break time
    setNewAvailability(prev => ({
      ...prev,
      breakTimes: [...currentBreakTimes, { ...newBreakTime }]
    }));

    setNewBreakTime({ startTime: '', endTime: '' });
    setError(null);
  };

  const removeBreakTime = (index: number) => {
    // Clear any existing error/success messages when modifying break times
    setError(null);
    setSuccess(null);
    
    setNewAvailability(prev => ({
      ...prev,
      breakTimes: prev.breakTimes?.filter((_, i) => i !== index) || []
    }));
  };

  // Helper function to clear messages when user starts interacting
  const clearMessages = () => {
    if (error || success) {
      setError(null);
      setSuccess(null);
    }
  };

  // Helper function to check if a date already has availability
  const hasAvailabilityForDate = (date: string) => {
    if (!date) return false;
    return availabilities.some(availability => {
      const availabilityDate = new Date(availability.date).toISOString().split('T')[0];
      return availabilityDate === date;
    });
  };

  // Check if current selected date already has availability
  const selectedDateHasAvailability = hasAvailabilityForDate(newAvailability.date);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center">
                  <FaClock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                    Manage Availability
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                    Set your availability for specific dates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
            <div className="text-red-800 dark:text-red-400">{error}</div>
            <button
              onClick={fetchAvailability}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-lg">
            <div className="text-green-800 dark:text-green-400">{success}</div>
            <button
              onClick={() => setSuccess(null)}
              className="mt-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Add New Availability */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg mb-6 border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <FaPlus className="text-teal-600 dark:text-teal-400 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Availability</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={newAvailability.date}
                  onChange={(e) => {
                    clearMessages();
                    setNewAvailability(prev => ({ ...prev, date: e.target.value }));
                  }}
                  min={getTodayForAPI()}
                  className={`w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    selectedDateHasAvailability 
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                  } text-gray-900 dark:text-white`}
                />
                {selectedDateHasAvailability && (
                  <div className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>Availability already exists for this date</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={newAvailability.startTime}
                  onChange={(e) => {
                    clearMessages();
                    setNewAvailability(prev => ({ ...prev, startTime: e.target.value }));
                  }}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={newAvailability.endTime}
                  onChange={(e) => {
                    clearMessages();
                    setNewAvailability(prev => ({ ...prev, endTime: e.target.value }));
                  }}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slot Duration (min)
                </label>
                <select
                  value={newAvailability.slotDuration}
                  onChange={(e) => {
                    clearMessages();
                    setNewAvailability(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }));
                  }}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
            
            {/* Multiple Break Times Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Break Times (Optional)</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Max {MAX_BREAK_TIMES} breaks per day
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {newAvailability.breakTimes?.length || 0} of {MAX_BREAK_TIMES}
                </div>
              </div>

              {/* Existing break times */}
              {newAvailability.breakTimes && newAvailability.breakTimes.length > 0 && (
                <div className="space-y-2 mb-4">
                  {newAvailability.breakTimes.map((breakTime, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <FaClock className="text-orange-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Break {index + 1}: {breakTime.startTime} - {breakTime.endTime}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBreakTime(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new break time */}
              {(!newAvailability.breakTimes || newAvailability.breakTimes.length < MAX_BREAK_TIMES) && (
                <div className="border border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Break Start Time
                      </label>
                      <input
                        type="time"
                        value={newBreakTime.startTime}
                        onChange={(e) => {
                          clearMessages();
                          setNewBreakTime(prev => ({ ...prev, startTime: e.target.value }));
                        }}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        placeholder="e.g., 12:00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Break End Time
                      </label>
                      <input
                        type="time"
                        value={newBreakTime.endTime}
                        onChange={(e) => {
                          clearMessages();
                          setNewBreakTime(prev => ({ ...prev, endTime: e.target.value }));
                        }}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        placeholder="e.g., 13:00"
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={addBreakTime}
                        disabled={!newBreakTime.startTime || !newBreakTime.endTime}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaPlus className="text-sm" />
                        <span>Add Break</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Break times summary */}
              {newAvailability.breakTimes && newAvailability.breakTimes.length > 0 && (
                <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                  Total break time: {
                    newAvailability.breakTimes.reduce((total, bt) => {
                      const start = new Date(`2000-01-01T${bt.startTime}:00`);
                      const end = new Date(`2000-01-01T${bt.endTime}:00`);
                      return total + (end.getTime() - start.getTime()) / (1000 * 60);
                    }, 0)
                  } minutes
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Quick select:</span>
                {quickDates.slice(0, 7).map(date => {
                  const dateHasAvailability = hasAvailabilityForDate(date);
                  return (
                    <button
                      key={date}
                      onClick={() => setNewAvailability(prev => ({ ...prev, date }))}
                      disabled={dateHasAvailability}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        dateHasAvailability 
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 dark:bg-slate-700 hover:bg-teal-100 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-400 text-gray-700 dark:text-gray-300'
                      }`}
                      title={dateHasAvailability ? 'Availability already exists for this date' : ''}
                    >
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {dateHasAvailability && <span className="ml-1">✓</span>}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={addAvailability}
                disabled={saving || !newAvailability.date || selectedDateHasAvailability}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedDateHasAvailability
                    ? 'bg-gray-400 dark:bg-gray-600 text-white'
                    : 'bg-teal-600 dark:bg-teal-500 text-white hover:bg-teal-700 dark:hover:bg-teal-600'
                }`}
                title={selectedDateHasAvailability ? 'Cannot add availability - date already has availability set' : ''}
              >
                <FaSave className="w-4 h-4" />
                <span>
                  {saving ? 'Adding...' : selectedDateHasAvailability ? 'Date Already Set' : 'Add Availability'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Availabilities */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaCalendarAlt className="text-teal-600 dark:text-teal-400 text-xl" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Current Availability</h2>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {availabilities.length} scheduled day{availabilities.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {availabilities.length === 0 ? (
              <div className="text-center py-12">
                <FaClock className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Availability Set
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add your first availability to start accepting appointments.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availabilities.map((availability) => (
                  <div 
                    key={availability.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {new Date(availability.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                            <FaClock className="text-gray-400 dark:text-gray-500" />
                            <span>
                              {availability.startTime} - {availability.endTime}
                            </span>
                          </div>
                          
                          {availability.breakTimes && availability.breakTimes.length > 0 && (
                            <div className="space-y-1">
                              {availability.breakTimes.map((breakTime, index) => (
                                <div key={index} className="flex items-center space-x-2 text-gray-500 dark:text-gray-500 text-sm">
                                  <span className="w-4 h-4 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                  </span>
                                  <span>
                                    Break {index + 1}: {breakTime.startTime} - {breakTime.endTime}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          availability.isAvailable 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {availability.isAvailable ? 'Available' : 'Unavailable'}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => availability.id && deleteAvailability(availability.id)}
                        className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-3 py-2 rounded border border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                      >
                        <FaTimes className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-start space-x-3">
            <FaClock className="text-teal-600 dark:text-teal-400 mt-1" />
            <div>
              <h4 className="font-medium text-teal-900 dark:text-teal-300">Summary</h4>
              <p className="text-teal-700 dark:text-teal-400 text-sm mt-1">
                {availabilities.length > 0 
                  ? `You have ${availabilities.length} day(s) scheduled. Patients can book appointments during these times.`
                  : 'No availability set. Patients will not be able to book appointments until you set your availability.'
                }
              </p>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
