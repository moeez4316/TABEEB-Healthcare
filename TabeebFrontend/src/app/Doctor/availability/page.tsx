'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FaClock, FaPlus, FaTimes, FaSave, FaCopy, FaCheck } from 'react-icons/fa';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
  }, [fetchWeeklyTemplate]);

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
      
      const response = await fetch(`${API_URL}/api/availability/template`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule: weeklySchedule }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save schedule');
      }

      const result = await response.json();
      setSuccess(result.message || 'Weekly schedule saved! Slots generated for next 30 days.');
      
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

        <div className="mt-6 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FaClock className="text-teal-600 dark:text-teal-400 mt-1 flex-shrink-0" />
            <div className="text-sm text-teal-800 dark:text-teal-300">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-teal-700 dark:text-teal-400">
                <li>Toggle days on/off like setting alarms</li>
                <li>Set start/end times and slot duration for each active day</li>
                <li>Add optional break times (lunch, prayers, etc.)</li>
                <li>Use "Copy to Weekdays" for quick setup</li>
                <li>Appointments will be available based on your weekly schedule</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
