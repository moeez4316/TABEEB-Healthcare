'use client';

import React, { useState, useEffect } from 'react';
import { Appointment } from '@/types/appointment';
import { useAuth } from '@/lib/auth-context';
import { formatTime, formatDate } from '@/lib/dateUtils';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaUser, FaClock } from 'react-icons/fa';

interface Availability {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  slotDuration?: number;
}

export default function DoctorCalendarPage() {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, [token, currentDate]);

  const fetchData = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      // Fetch both appointments and availability
      const [appointmentsResponse, availabilityResponse] = await Promise.all([
        fetch(`${API_URL}/api/appointments/doctor`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_URL}/api/availability/doctor`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!appointmentsResponse.ok || !availabilityResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const appointmentsData = await appointmentsResponse.json();
      const availabilityData = await availabilityResponse.json();
      
      console.log('Fetched appointments for calendar:', appointmentsData);
      console.log('Fetched availability for calendar:', availabilityData);
      
      setAppointments(appointmentsData.appointments || []);
      setAvailabilities(Array.isArray(availabilityData) ? availabilityData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate.toDateString() === date.toDateString();
    });
  };

  const getAvailabilityForDate = (date: Date) => {
    return availabilities.find(availability => {
      const availabilityDate = new Date(availability.date);
      return availabilityDate.toDateString() === date.toDateString() && availability.isAvailable;
    });
  };

  const hasAvailability = (date: Date) => {
    return !!getAvailabilityForDate(date);
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateIteration = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateIteration));
      currentDateIteration.setDate(currentDateIteration.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const calendarDays = getCalendarDays();
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-64 mb-8"></div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="grid grid-cols-7 gap-4">
                  {Array(35).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  ))}
                </div>
              </div>
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
                  <FaCalendarAlt className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                    Calendar
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                    View your appointment schedule
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
              onClick={fetchData}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
              {/* Calendar Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-6">
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, index) => {
                    const dayAppointments = getAppointmentsForDate(date);
                    const hasAvailabilityToday = hasAvailability(date);
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`
                          p-2 h-24 border border-gray-200 dark:border-slate-600 cursor-pointer transition-all duration-200 relative
                          ${isToday(date) ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}
                          ${isSelected ? 'ring-2 ring-teal-500 dark:ring-teal-400 bg-teal-50 dark:bg-teal-900/20' : ''}
                          ${!isCurrentMonth(date) ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}
                        `}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday(date) ? 'text-teal-600 dark:text-teal-400' : ''}`}>
                          {date.getDate()}
                        </div>
                        
                        {/* Availability indicator */}
                        {hasAvailabilityToday && (
                          <div className="absolute top-1 right-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Available"></div>
                          </div>
                        )}
                        
                        {/* Appointment indicators */}
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((appointment, idx) => (
                            <div
                              key={idx}
                              className={`text-xs px-1 py-0.5 rounded text-white truncate ${getStatusColor(appointment.status)}`}
                            >
                              {formatTime(appointment.startTime)} - {appointment.patient?.name?.split(' ')[0] || 'Patient'}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{dayAppointments.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Date Appointments */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <FaCalendarAlt className="text-teal-600 dark:text-teal-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDate 
                      ? formatDate(selectedDate)
                      : 'Select a date'
                    }
                  </h3>
                </div>
              </div>
              
              <div className="p-6">
                {!selectedDate ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Click on a date to view appointments
                  </p>
                ) : (
                  <div>
                    {/* Availability Status */}
                    {(() => {
                      const availability = getAvailabilityForDate(selectedDate);
                      return availability ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-800 dark:text-green-300 font-medium">Available</span>
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-400 mt-1">
                            {availability.startTime} - {availability.endTime}
                            {availability.slotDuration && ` (${availability.slotDuration} min slots)`}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-400 font-medium">No availability set</span>
                          </div>
                        </div>
                      );
                    })()}

                    {selectedDateAppointments.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No appointments scheduled for this date
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDateAppointments.map(appointment => (
                          <div key={appointment.id} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <FaUser className="text-gray-500 dark:text-gray-400 text-sm" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {appointment.patient?.name || 'Unknown Patient'}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <FaClock className="text-gray-400 dark:text-gray-500" />
                              <span>
                                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                              </span>
                            </div>
                            
                            {appointment.patientNotes && (
                              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <strong>Notes:</strong> {appointment.patientNotes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Legend</h4>
              
              {/* Availability Legend */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Availability</h5>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Available for appointments</span>
                </div>
              </div>
              
              {/* Status Legend */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Appointment Status</h5>
                <div className="space-y-2 text-sm">
                  {[
                    { status: 'CONFIRMED', color: 'bg-green-500', label: 'Confirmed' },
                    { status: 'PENDING', color: 'bg-yellow-500', label: 'Pending' },
                    { status: 'IN_PROGRESS', color: 'bg-blue-500', label: 'In Progress' },
                    { status: 'COMPLETED', color: 'bg-gray-500', label: 'Completed' },
                    { status: 'CANCELLED', color: 'bg-red-500', label: 'Cancelled' }
                  ].map(item => (
                    <div key={item.status} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded ${item.color}`}></div>
                      <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
