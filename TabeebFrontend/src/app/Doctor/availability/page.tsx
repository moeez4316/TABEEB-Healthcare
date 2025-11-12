'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadDoctorProfile } from '@/store/slices/doctorSlice';
import { FaClock, FaPlus, FaTimes, FaSave, FaCopy, FaCheck } from 'react-icons/fa';
import DoctorProfileEditModal from '@/components/profile/DoctorProfileEditModal';

interface BreakTime {
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  dayShort: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakTimes: BreakTime[];
}

export default function DoctorAvailabilityPage() {
  const { token } = useAuth();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.doctor || { profile: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([
    { dayOfWeek: 1, dayName: 'Monday', dayShort: 'Mon', isActive: false, startTime: '09:00', endTime: '17:00', slotDuration: 30, breakTimes: [] },
    { dayOfWeek: 2, dayName: 'Tuesday', dayShort: 'Tue', isActive: false, startTime: '09:00', endTime: '17:00', slotDuration: 30, breakTimes: [] },
    { dayOfWeek: 3, dayName: 'Wednesday', dayShort: 'Wed', isActive: false, startTime: '09:00', endTime: '17:00', slotDuration: 30, breakTimes: [] },
    { dayOfWeek: 4, dayName: 'Thursday', dayShort: 'Thu', isActive: false, startTime: '09:00', endTime: '17:00', slotDuration: 30, breakTimes: [] },
    { dayOfWeek: 5, dayName: 'Friday', dayShort: 'Fri', isActive: false, startTime: '09:00', endTime: '17:00', slotDuration: 30, breakTimes: [] },
    { dayOfWeek: 6, dayName: 'Saturday', dayShort: 'Sat', isActive: false, startTime: '09:00', endTime: '17:00', slotDuration: 30, breakTimes: [] },
    { dayOfWeek: 0, dayName: 'Sunday', dayShort: 'Sun', isActive: false, startTime: '09:00', endTime: '17:00', slotDuration: 30, breakTimes: [] },
  ]);

  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [newBreakTime, setNewBreakTime] = useState({ startTime: '', endTime: '' });

  // Specific day override states
  const [showSpecificDayModal, setShowSpecificDayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [specificDayData, setSpecificDayData] = useState<{
    startTime: string;
    endTime: string;
    slotDuration: number;
    breakTimes: BreakTime[];
    isAvailable: boolean;
  } | null>(null);
  const [loadingSpecificDay, setLoadingSpecificDay] = useState(false);
  const [savingSpecificDay, setSavingSpecificDay] = useState(false);
  const [customizedDates, setCustomizedDates] = useState<Set<string>>(new Set());

  // Helper to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch all availability for next 30 days to mark customized dates
  const fetchCustomizedDates = useCallback(async () => {
    if (!token) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await fetch(
        `${API_URL}/api/availability/doctor?startDate=${formatLocalDate(today)}&endDate=${formatLocalDate(futureDate)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Parse dates as local dates and format as YYYY-MM-DD
        const dates = new Set<string>(data.map((avail: { date: string | Date }) => {
          const d = new Date(avail.date);
          return formatLocalDate(d);
        }));
        setCustomizedDates(dates);
      }
    } catch (err) {
      console.error('Error fetching customized dates:', err);
    }
  }, [token]);

  const fetchWeeklyTemplate = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/availability/template`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          setWeeklySchedule(prevSchedule => 
            prevSchedule.map(day => {
              const loadedDay = data.find((d: DaySchedule) => d.dayOfWeek === day.dayOfWeek);
              return loadedDay ? { ...day, ...loadedDay } : day;
            })
          );
        }
      }
    } catch (err) {
      console.error('Error fetching template:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWeeklyTemplate();
    fetchCustomizedDates();
  }, [fetchWeeklyTemplate, fetchCustomizedDates]);

  const toggleDay = (index: number) => {
    setWeeklySchedule(prev => 
      prev.map((day, i) => 
        i === index ? { ...day, isActive: !day.isActive } : day
      )
    );
    setError(null);
    setSuccess(null);
  };

  const updateDayTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setWeeklySchedule(prev => 
      prev.map((day, i) => 
        i === index ? { ...day, [field]: value } : day
      )
    );
    setError(null);
    setSuccess(null);
  };

  const updateSlotDuration = (index: number, value: number) => {
    setWeeklySchedule(prev => 
      prev.map((day, i) => 
        i === index ? { ...day, slotDuration: value } : day
      )
    );
  };

  const copyToWeekdays = (sourceIndex: number) => {
    const sourceDay = weeklySchedule[sourceIndex];
    setWeeklySchedule(prev => 
      prev.map((day, i) => {
        if (day.dayOfWeek >= 1 && day.dayOfWeek <= 5 && i !== sourceIndex) {
          return {
            ...day,
            isActive: sourceDay.isActive,
            startTime: sourceDay.startTime,
            endTime: sourceDay.endTime,
            slotDuration: sourceDay.slotDuration,
            breakTimes: [...sourceDay.breakTimes]
          };
        }
        return day;
      })
    );
    setSuccess('Applied to all weekdays!');
  };

  const addBreakTime = (dayIndex: number) => {
    if (!newBreakTime.startTime || !newBreakTime.endTime) {
      setError('Please fill in both start and end time for break');
      return;
    }

    if (newBreakTime.startTime >= newBreakTime.endTime) {
      setError('Break start time must be before end time');
      return;
    }

    const day = weeklySchedule[dayIndex];
    
    if (newBreakTime.startTime < day.startTime || newBreakTime.endTime > day.endTime) {
      setError('Break time must be within working hours');
      return;
    }

    const hasOverlap = day.breakTimes.some(bt => 
      (newBreakTime.startTime < bt.endTime && newBreakTime.endTime > bt.startTime)
    );

    if (hasOverlap) {
      setError('Break times cannot overlap');
      return;
    }

    setWeeklySchedule(prev => 
      prev.map((d, i) => 
        i === dayIndex 
          ? { ...d, breakTimes: [...d.breakTimes, { ...newBreakTime }] }
          : d
      )
    );

    setNewBreakTime({ startTime: '', endTime: '' });
    setError(null);
  };

  const removeBreakTime = (dayIndex: number, breakIndex: number) => {
    setWeeklySchedule(prev => 
      prev.map((day, i) => 
        i === dayIndex 
          ? { ...day, breakTimes: day.breakTimes.filter((_, bi) => bi !== breakIndex) }
          : day
      )
    );
  };

  // Get next 30 days
  const getNext30Days = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Open specific day editor
  const openSpecificDayEditor = async (date: Date) => {
    if (!token) {
      setError('Please log in to edit specific days');
      return;
    }

    setSelectedDate(date);
    setShowSpecificDayModal(true);
    setLoadingSpecificDay(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const dateString = formatLocalDate(date);
      
      // Try to fetch existing availability for this specific date
      const response = await fetch(
        `${API_URL}/api/availability/doctor?date=${dateString}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          const availability = data[0];
          setSpecificDayData({
            startTime: availability.startTime,
            endTime: availability.endTime,
            slotDuration: availability.slotDuration,
            breakTimes: availability.breakTimes || [],
            isAvailable: availability.isAvailable
          });
        } else {
          // No existing data, use template default for this day
          const dayOfWeek = date.getDay();
          const templateDay = weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);
          setSpecificDayData({
            startTime: templateDay?.startTime || '09:00',
            endTime: templateDay?.endTime || '17:00',
            slotDuration: templateDay?.slotDuration || 30,
            breakTimes: [],
            isAvailable: true
          });
        }
      } else {
        // Response not ok, use template default
        const dayOfWeek = date.getDay();
        const templateDay = weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);
        setSpecificDayData({
          startTime: templateDay?.startTime || '09:00',
          endTime: templateDay?.endTime || '17:00',
          slotDuration: templateDay?.slotDuration || 30,
          breakTimes: [],
          isAvailable: true
        });
      }
    } catch (err) {
      console.error('Error fetching specific day:', err);
      // Use default values
      const dayOfWeek = date.getDay();
      const templateDay = weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);
      setSpecificDayData({
        startTime: templateDay?.startTime || '09:00',
        endTime: templateDay?.endTime || '17:00',
        slotDuration: templateDay?.slotDuration || 30,
        breakTimes: [],
        isAvailable: true
      });
    } finally {
      setLoadingSpecificDay(false);
    }
  };

  // Save specific day override
  const saveSpecificDay = async () => {
    if (!token || !selectedDate || !specificDayData) return;

    // Validate times
    if (specificDayData.isAvailable && specificDayData.startTime >= specificDayData.endTime) {
      setError('Start time must be before end time');
      return;
    }

    setSavingSpecificDay(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const dateString = formatLocalDate(selectedDate);

      // Check if availability exists for this date (including unavailable records)
      const checkResponse = await fetch(
        `${API_URL}/api/availability/doctor?date=${dateString}&includeUnavailable=true`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      let existingAvailability = null;
      if (checkResponse.ok) {
        const data = await checkResponse.json();
        if (data && data.length > 0) {
          existingAvailability = data[0];
        }
      }

      if (existingAvailability) {
        // Update existing availability
        const response = await fetch(
          `${API_URL}/api/availability/${existingAvailability.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date: dateString,
              startTime: specificDayData.startTime,
              endTime: specificDayData.endTime,
              slotDuration: specificDayData.slotDuration,
              breakTimes: specificDayData.breakTimes,
              isAvailable: specificDayData.isAvailable
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Update failed:', response.status, errorData);
          console.error('Request payload was:', {
            date: dateString,
            startTime: specificDayData.startTime,
            endTime: specificDayData.endTime,
            slotDuration: specificDayData.slotDuration,
            breakTimes: specificDayData.breakTimes,
            isAvailable: specificDayData.isAvailable
          });
          throw new Error(errorData.error || errorData.details || `Failed to update specific day (${response.status})`);
        }

        const updateResult = await response.json();
        
        // Show warning if there are existing appointments
        if (updateResult.warning) {
          setSuccess(`${updateResult.message}. ${updateResult.warning}`);
        } else {
          setSuccess(`${updateResult.message} - Time: ${updateResult.availability.startTime} to ${updateResult.availability.endTime}`);
        }
      } else {
        // Create new availability
        const response = await fetch(
          `${API_URL}/api/availability/set`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date: dateString,
              startTime: specificDayData.startTime,
              endTime: specificDayData.endTime,
              slotDuration: specificDayData.slotDuration,
              breakTimes: specificDayData.breakTimes,
              isAvailable: specificDayData.isAvailable
            }),
          }
        );

        console.log('Create response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create specific day (${response.status})`);
        }
        
        const result = await response.json();
        
        // Show warning if there are existing appointments
        if (result.warning) {
          setSuccess(`${result.message}. ${result.warning}`);
        } else {
          setSuccess(result.message || `Successfully ${specificDayData.isAvailable ? 'updated' : 'disabled'} availability for ${selectedDate.toLocaleDateString()}`);
        }
      }

      // Close modal and clear state
      setShowSpecificDayModal(false);
      setSelectedDate(null);
      setSpecificDayData(null);
      
      // Refresh customized dates to update calendar
      fetchCustomizedDates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save specific day');
    } finally {
      setSavingSpecificDay(false);
    }
  };

  const saveWeeklySchedule = async () => {
    const activeDays = weeklySchedule.filter(day => day.isActive);
    
    // Validate time ranges for active days only
    for (const day of activeDays) {
      if (day.startTime >= day.endTime) {
        setError(`${day.dayName}: Start time must be before end time`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      // Only send ACTIVE days to the backend
      // This ensures only toggled days are managed by the template
      // Other days (inactive/untouched) won't be affected
      const response = await fetch(`${API_URL}/api/availability/template`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule: activeDays }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save schedule');
      }

      const result = await response.json();
      setSuccess(result.message || 'Weekly schedule saved! Slots generated for next 30 days.');
      
      // Refresh customized dates to reflect changes in the calendar
      await fetchCustomizedDates();
      
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center">
                <FaClock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                  Weekly Availability
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                  Set your weekly schedule like setting alarms
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-red-800 dark:text-red-400">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-green-800 dark:text-green-400">{success}</div>
          </div>
        )}

        {/* Hourly Rate Display */}
        <div className="mb-6 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border-2 border-teal-200 dark:border-teal-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="h-5 w-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Consultation Fees
                </h3>
              </div>
              
              {profile?.hourlyConsultationRate && profile.hourlyConsultationRate > 0 ? (
                <div>
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                      PKR {profile.hourlyConsultationRate.toLocaleString('en-PK')}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">per hour</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p className="flex items-center space-x-2">
                      <span className="text-gray-500 dark:text-gray-400">•</span>
                      <span>30 min appointment: <strong className="text-teal-600 dark:text-teal-400">PKR {(profile.hourlyConsultationRate * 0.5).toLocaleString('en-PK')}</strong></span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <span className="text-gray-500 dark:text-gray-400">•</span>
                      <span>45 min appointment: <strong className="text-teal-600 dark:text-teal-400">PKR {(profile.hourlyConsultationRate * 0.75).toLocaleString('en-PK')}</strong></span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <span className="text-gray-500 dark:text-gray-400">•</span>
                      <span>60 min appointment: <strong className="text-teal-600 dark:text-teal-400">PKR {profile.hourlyConsultationRate.toLocaleString('en-PK')}</strong></span>
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="h-5 w-5 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-lg font-medium text-amber-700 dark:text-amber-400">
                      No hourly rate set
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Set your hourly consultation rate to automatically calculate appointment fees based on duration.
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowProfileEdit(true)}
              className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors whitespace-nowrap"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {profile?.hourlyConsultationRate && profile.hourlyConsultationRate > 0 ? 'Update Rate' : 'Set Rate'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Weekly Schedule</h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {weeklySchedule.filter(d => d.isActive).length} day(s) active
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {weeklySchedule.map((day, index) => (
              <div 
                key={day.dayOfWeek}
                className={`border-2 rounded-xl p-4 transition-all ${
                  day.isActive 
                    ? 'border-teal-300 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/20' 
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleDay(index)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        day.isActive 
                          ? 'bg-teal-600' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div 
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          day.isActive ? 'transform translate-x-6' : ''
                        }`}
                      />
                    </button>

                    <div>
                      <h3 className={`text-lg font-semibold ${
                        day.isActive 
                          ? 'text-teal-900 dark:text-teal-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {day.dayName}
                      </h3>
                      {!day.isActive && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Tap to enable</p>
                      )}
                    </div>
                  </div>

                  {day.isActive && day.dayOfWeek >= 1 && day.dayOfWeek <= 5 && (
                    <button
                      onClick={() => copyToWeekdays(index)}
                      className="flex items-center space-x-1 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 px-3 py-1 rounded-lg border border-teal-300 dark:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30"
                    >
                      <FaCopy className="w-3 h-3" />
                      <span>Copy to Weekdays</span>
                    </button>
                  )}
                </div>

                {day.isActive && (
                  <div className="space-y-4 pl-17">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateDayTime(index, 'startTime', e.target.value)}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateDayTime(index, 'endTime', e.target.value)}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Slot Duration
                        </label>
                        <select
                          value={day.slotDuration}
                          onChange={(e) => updateSlotDuration(index, parseInt(e.target.value))}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        >
                          <option value={15}>15 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Break Times (Optional)
                        </label>
                        {day.breakTimes.length === 0 && (
                          <button
                            onClick={() => setEditingDayIndex(editingDayIndex === index ? null : index)}
                            className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center space-x-1"
                          >
                            <FaPlus className="w-3 h-3" />
                            <span>Add Break</span>
                          </button>
                        )}
                      </div>

                      {day.breakTimes.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {day.breakTimes.map((breakTime, breakIndex) => (
                            <div key={breakIndex} className="flex items-center justify-between bg-gray-100 dark:bg-slate-600 rounded-lg p-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                <FaClock className="w-3 h-3 text-orange-500" />
                                <span>{breakTime.startTime} - {breakTime.endTime}</span>
                              </div>
                              <button
                                onClick={() => removeBreakTime(index, breakIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FaTimes className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {day.breakTimes.length < 2 && (
                            <button
                              onClick={() => setEditingDayIndex(editingDayIndex === index ? null : index)}
                              className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center space-x-1"
                            >
                              <FaPlus className="w-3 h-3" />
                              <span>Add Another Break</span>
                            </button>
                          )}
                        </div>
                      )}

                      {editingDayIndex === index && day.breakTimes.length < 2 && (
                        <div className="border border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-3">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="time"
                              value={newBreakTime.startTime}
                              onChange={(e) => setNewBreakTime(prev => ({ ...prev, startTime: e.target.value }))}
                              placeholder="Start"
                              className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                            <input
                              type="time"
                              value={newBreakTime.endTime}
                              onChange={(e) => setNewBreakTime(prev => ({ ...prev, endTime: e.target.value }))}
                              placeholder="End"
                              className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                            <button
                              onClick={() => addBreakTime(index)}
                              className="flex items-center justify-center space-x-1 bg-orange-500 text-white rounded px-2 py-1 text-sm hover:bg-orange-600"
                            >
                              <FaCheck className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Slots will be generated for the next 30 days based on this schedule.</p>
                <p className="text-xs mt-1">Your calendar will update automatically.</p>
              </div>
              <button
                onClick={saveWeeklySchedule}
                disabled={saving}
                className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Schedule'}</span>
              </button>
            </div>
            
            {/* Success message right below save button */}
            {success && (
              <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-800 dark:text-green-400">{success}</div>
                  <button
                    onClick={() => setSuccess(null)}
                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Specific Days Override Section */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Override Specific Days</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Click any date below to customize availability for that specific day
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 gap-2">
              {getNext30Days().map((date, index) => {
                const dayOfWeek = date.getDay();
                const isTemplateActive = weeklySchedule.find(d => d.dayOfWeek === dayOfWeek)?.isActive;
                const isToday = date.toDateString() === new Date().toDateString();
                const dateString = formatLocalDate(date);
                const isCustomized = customizedDates.has(dateString);
                
                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      openSpecificDayEditor(date);
                    }}
                    type="button"
                    className={`
                      relative p-3 rounded-lg transition-all text-center hover:shadow-md cursor-pointer
                      ${isToday ? 'ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-slate-900 border-2 border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/30 dark:to-blue-900/30 shadow-lg' : 'border-2'}
                      ${!isToday && isCustomized ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10 hover:border-blue-400' : ''}
                      ${!isToday && !isCustomized && isTemplateActive ? 'border-gray-300 bg-white dark:bg-slate-700 hover:border-gray-400' : ''}
                      ${!isToday && !isCustomized && !isTemplateActive ? 'border-gray-200 bg-gray-50 dark:bg-slate-700/50 hover:border-gray-300' : ''}
                    `}
                  >
                    {isToday && (
                      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-teal-500 text-white text-[10px] font-bold rounded-full shadow-md">
                        TODAY
                      </div>
                    )}
                    {isCustomized && !isToday && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    <div className={`text-xs font-medium ${isToday ? 'text-teal-700 dark:text-teal-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]}
                    </div>
                    <div className={`text-lg font-bold mt-1 ${isToday ? 'text-teal-600 dark:text-teal-400' : isCustomized ? 'text-blue-600 dark:text-blue-400' : isTemplateActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                      {date.getDate()}
                    </div>
                    <div className={`text-xs mt-1 ${isToday ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 flex items-center justify-center flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white dark:bg-slate-700"></div>
                <span>Template Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative w-4 h-4 rounded border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/10">
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <span>Customized</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded border-2 border-gray-200 bg-gray-50 dark:bg-slate-700/50"></div>
                <span>Template Inactive</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specific Day Editor Modal */}
        {showSpecificDayModal && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Edit Specific Day
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSpecificDayModal(false);
                      setSelectedDate(null);
                      setSpecificDayData(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {loadingSpecificDay || !specificDayData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
                  </div>
                ) : (
                  <>
                    {/* Availability Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Available on this day
                      </span>
                      <button
                        onClick={() => setSpecificDayData(prev => prev ? { ...prev, isAvailable: !prev.isAvailable } : null)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          specificDayData.isAvailable ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div 
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            specificDayData.isAvailable ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {specificDayData.isAvailable && (
                      <>
                        {/* Time Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={specificDayData.startTime}
                              onChange={(e) => setSpecificDayData(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={specificDayData.endTime}
                              onChange={(e) => setSpecificDayData(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Slot Duration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Slot Duration
                          </label>
                          <select
                            value={specificDayData.slotDuration}
                            onChange={(e) => setSpecificDayData(prev => prev ? { ...prev, slotDuration: parseInt(e.target.value) } : null)}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>1 hour</option>
                          </select>
                        </div>

                        {/* Break Times */}
                        {specificDayData.breakTimes.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Break Times
                            </label>
                            <div className="space-y-2">
                              {specificDayData.breakTimes.map((breakTime, idx) => (
                                <div key={idx} className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-700 p-2 rounded">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {breakTime.startTime} - {breakTime.endTime}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSpecificDayData(prev => prev ? {
                                        ...prev,
                                        breakTimes: prev.breakTimes.filter((_, i) => i !== idx)
                                      } : null);
                                    }}
                                    className="text-red-500 hover:text-red-700 ml-auto"
                                  >
                                    <FaTimes className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {specificDayData.breakTimes.length < 2 && (
                                <button
                                  onClick={() => {
                                    const startTime = prompt('Enter break start time (HH:MM):');
                                    const endTime = prompt('Enter break end time (HH:MM):');
                                    if (startTime && endTime) {
                                      setSpecificDayData(prev => prev ? {
                                        ...prev,
                                        breakTimes: [...prev.breakTimes, { startTime, endTime }]
                                      } : null);
                                    }
                                  }}
                                  className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center space-x-1"
                                >
                                  <FaPlus className="w-3 h-3" />
                                  <span>Add Break Time</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSpecificDayModal(false);
                    setSelectedDate(null);
                    setSpecificDayData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSpecificDay}
                  disabled={savingSpecificDay}
                  className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave className="w-4 h-4" />
                  <span>{savingSpecificDay ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FaClock className="text-teal-600 dark:text-teal-400 mt-1 flex-shrink-0" />
            <div className="text-sm text-teal-800 dark:text-teal-300">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-teal-700 dark:text-teal-400">
                <li>Toggle days on/off like setting alarms</li>
                <li>Set start/end times and slot duration for each active day</li>
                <li>Add optional break times (lunch, prayers, etc.)</li>
                <li>Use &quot;Copy to Weekdays&quot; for quick setup</li>
                <li><strong>Click any specific date below to customize just that day</strong></li>
                <li>Appointments will be available based on your weekly schedule</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Profile Edit Modal */}
      <DoctorProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => {
          setShowProfileEdit(false);
          // Reload profile to ensure we have the latest data from backend
          if (token) {
            dispatch(loadDoctorProfile(token));
          }
        }}
        initialTab="billing"
      />
    </div>
  );
}
