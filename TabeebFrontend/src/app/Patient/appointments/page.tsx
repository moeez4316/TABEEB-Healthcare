'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Appointment } from '@/types/appointment';
import { useAuth } from '@/lib/auth-context';
import { formatTime, formatDate } from '@/lib/dateUtils';
import { FaCalendarPlus, FaEye, FaTimes, FaClock, FaUserMd } from 'react-icons/fa';

export default function PatientAppointmentsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/appointments/patient`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      console.log('Fetched appointments:', data);
      
      // Backend returns the appointments array directly, not wrapped in an object
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      appointmentDate.setHours(0, 0, 0, 0); // Set to start of appointment day
      
      switch (filter) {
        case 'upcoming':
          // Include today's appointments and future appointments, exclude cancelled/completed
          return appointmentDate >= today && appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED';
        case 'past':
          // Include past dates OR completed/cancelled appointments
          return appointmentDate < today || appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED';
        default:
          return true;
      }
    });
  };

  const filteredAppointments = filterAppointments();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your medical appointments
              </p>
            </div>
            
            <button
              onClick={() => router.push('/Patient/book-appointment')}
              className="flex items-center space-x-2 bg-teal-600 dark:bg-teal-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors shadow-lg text-base sm:text-lg"
            >
              <FaCalendarPlus className="w-4 h-4" />
              <span>Book New Appointment</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 flex space-x-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            {[
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'past', label: 'Past' },
              { key: 'all', label: 'All' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`
                  px-4 py-2 rounded-md font-medium transition-colors
                  ${filter === tab.key 
                    ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
            <div className="text-red-800 dark:text-red-400">{error}</div>
            <button
              onClick={fetchAppointments}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
            <FaCalendarPlus className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filter === 'upcoming' ? 'No Upcoming Appointments' : 
               filter === 'past' ? 'No Past Appointments' : 'No Appointments Found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'upcoming' 
                ? 'You don\'t have any upcoming appointments scheduled.'
                : 'No appointments found for the selected filter.'
              }
            </p>
            <button
              onClick={() => router.push('/Patient/book-appointment')}
              className="bg-teal-600 dark:bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors shadow-lg"
            >
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map(appointment => (
              <div key={appointment.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Doctor Avatar */}
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center">
                      <FaUserMd className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    
                    {/* Appointment Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-teal-600 dark:text-teal-400 font-medium mb-3">
                        {appointment.doctor?.specialization || 'General Practice'}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <FaCalendarPlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatDate(new Date(appointment.appointmentDate))}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <FaClock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </span>
                        </div>
                        
                        {appointment.consultationFees && (
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              ${appointment.consultationFees}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {appointment.patientNotes && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Your Notes:</p>
                          <p className="text-sm text-gray-800 dark:text-gray-300">{appointment.patientNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <button
                      className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 px-3 py-1 rounded border border-teal-600 dark:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                    >
                      <FaEye className="w-3 h-3" />
                      <span className="text-sm">View</span>
                    </button>
                    
                    {appointment.status === 'PENDING' && (
                      <button
                        className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-3 py-1 rounded border border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                        <span className="text-sm">Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
