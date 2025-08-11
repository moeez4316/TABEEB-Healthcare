'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatDateForAPI, getTodayForAPI } from '@/lib/dateUtils';
import { FaClock, FaPlus, FaTimes, FaSave, FaCalendarAlt } from 'react-icons/fa';

interface Availability {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  slotDuration?: number;
  breakStartTime?: string;
  breakEndTime?: string;
}

export default function DoctorAvailabilityPage() {
  const { token } = useAuth();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form for adding new availability
  const [newAvailability, setNewAvailability] = useState<Availability>({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
    slotDuration: 30,
    breakStartTime: '',
    breakEndTime: ''
  });

  useEffect(() => {
    fetchAvailability();
  }, [token]);

  const fetchAvailability = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5002/api/availability/doctor', {
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
    } finally {
      setLoading(false);
    }
  };

  const addAvailability = async () => {
    if (!token || !newAvailability.date) return;
    
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5002/api/availability/set', {
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
          breakStartTime: newAvailability.breakStartTime || null,
          breakEndTime: newAvailability.breakEndTime || null
        }),
      });

      if (!response.ok) {
        // Extract specific error message from backend
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to add availability';
        throw new Error(errorMessage);
      }

      // Reset form and refresh list
      setNewAvailability({
        date: '',
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
        slotDuration: 30,
        breakStartTime: '',
        breakEndTime: ''
      });
      
      fetchAvailability();
      console.log('Availability added successfully');
    } catch (err) {
      console.error('Error adding availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to add availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteAvailability = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5002/api/availability/${id}`, {
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
        console.log(result.message);
      }

      fetchAvailability();
    } catch (err) {
      console.error('Error deleting availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete availability. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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
                  onChange={(e) => setNewAvailability(prev => ({ ...prev, date: e.target.value }))}
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
                  onChange={(e) => setNewAvailability(prev => ({ ...prev, startTime: e.target.value }))}
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
                  onChange={(e) => setNewAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slot Duration (min)
                </label>
                <select
                  value={newAvailability.slotDuration}
                  onChange={(e) => setNewAvailability(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
            
            {/* Break Time Section */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Break Time (Optional)</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Set lunch break or other unavailable periods
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Break Start Time
                  </label>
                  <input
                    type="time"
                    value={newAvailability.breakStartTime || ''}
                    onChange={(e) => setNewAvailability(prev => ({ ...prev, breakStartTime: e.target.value }))}
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
                    value={newAvailability.breakEndTime || ''}
                    onChange={(e) => setNewAvailability(prev => ({ ...prev, breakEndTime: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 13:00"
                  />
                </div>
              </div>
              {newAvailability.breakStartTime && newAvailability.breakEndTime && (
                <div className="mt-2 text-xs text-teal-600 dark:text-teal-400">
                  Break time: {newAvailability.breakStartTime} - {newAvailability.breakEndTime}
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
                          
                          {availability.breakStartTime && availability.breakEndTime && (
                            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-500 text-sm">
                              <span className="w-4 h-4 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                              </span>
                              <span>
                                Break: {availability.breakStartTime} - {availability.breakEndTime}
                              </span>
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
