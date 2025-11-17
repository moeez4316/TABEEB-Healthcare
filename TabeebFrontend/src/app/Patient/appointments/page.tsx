'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Appointment } from '@/types/appointment';
import { useAuth } from '@/lib/auth-context';
import { formatTime, formatDate } from '@/lib/dateUtils';
import { FaCalendarPlus, FaTimes, FaClock, FaUserMd, FaVideo, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import PatientVideoCallModal from '@/components/VideoCall/PatientVideoCallModal';
import { Toast } from '@/components/Toast';

export default function PatientAppointmentsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'pending' | 'completed'>('upcoming');
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

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
      
      // Backend returns the appointments array directly, not wrapped in an object
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleVideoCallClick = (appointment: Appointment, canStart: boolean) => {
    if (!canStart) {
      showNotification(
        'Video call is available 15 minutes before appointment time',
        'info'
      );
    } else {
      setSelectedAppointmentId(appointment.id);
      setShowVideoCall(true);
    }
  };

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
          // Only CONFIRMED appointments that are today or in the future
          return appointmentDate >= today && appointment.status === 'CONFIRMED';
        case 'pending':
          return appointment.status === 'PENDING';
        case 'completed':
          return appointment.status === 'COMPLETED';
        default:
          return true;
      }
    });
  };

  const filteredAppointments = filterAppointments();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { 
                label: 'Upcoming', 
                value: appointments.filter(a => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const aptDate = new Date(a.appointmentDate);
                  aptDate.setHours(0, 0, 0, 0);
                  return aptDate.getTime() >= today.getTime() && a.status === 'CONFIRMED';
                }).length,
                color: 'text-teal-600 dark:text-teal-400',
                bgColor: 'bg-teal-50 dark:bg-teal-900/20',
                borderColor: 'border-teal-200 dark:border-teal-800'
              },
              { 
                label: 'Pending', 
                value: appointments.filter(a => a.status === 'PENDING').length,
                color: 'text-yellow-600 dark:text-yellow-400',
                bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                borderColor: 'border-yellow-200 dark:border-yellow-800'
              },
              { 
                label: 'Completed', 
                value: appointments.filter(a => a.status === 'COMPLETED').length,
                color: 'text-purple-600 dark:text-purple-400',
                bgColor: 'bg-purple-50 dark:bg-purple-900/20',
                borderColor: 'border-purple-200 dark:border-purple-800'
              },
              { 
                label: 'Confirmed', 
                value: appointments.filter(a => a.status === 'CONFIRMED').length,
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
                borderColor: 'border-green-200 dark:border-green-800'
              }
            ].map((stat, index) => (
              <div key={index} className={`bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg border ${stat.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <div className={`w-3 h-3 rounded-full ${stat.color.replace('text-', 'bg-')}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 flex justify-center space-x-1 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-lg border border-gray-200 dark:border-slate-700">
            {[
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'pending', label: 'Pending' },
              { key: 'completed', label: 'Completed' },
              { key: 'all', label: 'All' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`
                  flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200
                  ${filter === tab.key 
                    ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
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
               filter === 'pending' ? 'No Pending Appointments' :
               filter === 'completed' ? 'No Completed Appointments' : 'No Appointments Found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'upcoming' 
                ? 'You don\'t have any confirmed appointments scheduled.'
                : filter === 'pending'
                ? 'No appointments awaiting doctor confirmation.'
                : filter === 'completed'
                ? 'No completed appointments to display.'
                : 'No appointments found for the selected filter.'}
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
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center overflow-hidden">
                      {appointment.doctor?.profileImageUrl ? (
                        <Image 
                          src={appointment.doctor.profileImageUrl} 
                          alt="Doctor" 
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUserMd className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      )}
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
                              PKR {appointment.consultationFees.toLocaleString('en-PK')}
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
                  <div className="flex flex-col space-y-2 mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 min-w-[160px]">
                    {appointment.status === 'CONFIRMED' && (() => {
                      // Check timing restrictions
                      const now = new Date();
                      
                      // Parse appointment date and time properly
                      const dateStr = appointment.appointmentDate;
                      const timeStr = appointment.startTime;
                      
                      // Extract just the date part if it's a full ISO timestamp
                      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                      
                      // Ensure time has seconds (HH:MM:SS format)
                      const timeWithSeconds = timeStr.includes(':') && timeStr.split(':').length === 2 
                        ? `${timeStr}:00` 
                        : timeStr;
                      
                      // Create appointment date time by combining date and time
                      const appointmentDateTime = new Date(`${datePart}T${timeWithSeconds}`);
                      
                      const minutesUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);
                      const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                      
                      // Video call only available 15 minutes before appointment start
                      const canStartVideoCall = minutesUntilAppointment <= 15 && minutesUntilAppointment >= -60; // 15 min before to 60 min after
                      
                      // Can cancel only if appointment is at least 2 hours away
                      const canCancel = hoursUntilAppointment >= 2;
                      
                      return (
                        <>
                          <button
                            onClick={() => handleVideoCallClick(appointment, canStartVideoCall)}
                            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-500 dark:to-teal-600 text-white hover:from-teal-700 hover:to-teal-800 dark:hover:from-teal-600 dark:hover:to-teal-700 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaVideo className="w-4 h-4" />
                            <span className="text-sm">Start Consultation</span>
                          </button>
                          
                          {canCancel && (
                            <button
                              className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-4 py-2 rounded-lg border border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <FaTimes className="w-4 h-4" />
                              <span className="text-sm font-medium">Cancel</span>
                            </button>
                          )}
                        </>
                      );
                    })()}
                    
                    <button
                      onClick={() => setExpandedAppointment(
                        expandedAppointment === appointment.id ? null : appointment.id
                      )}
                      className="flex items-center justify-center space-x-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 px-4 py-2 rounded-lg border border-teal-600 dark:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                    >
                      {expandedAppointment === appointment.id ? (
                        <>
                          <FaChevronUp className="w-4 h-4" />
                          <span className="text-sm font-medium">Hide Details</span>
                        </>
                      ) : (
                        <>
                          <FaChevronDown className="w-4 h-4" />
                          <span className="text-sm font-medium">View Details</span>
                        </>
                      )}
                    </button>
                    
                    {appointment.status === 'PENDING' && (() => {
                      // Check if appointment is at least 2 hours away for cancellation
                      const now = new Date();
                      
                      // Parse appointment date and time properly
                      const dateStr = appointment.appointmentDate;
                      const timeStr = appointment.startTime;
                      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                      const timeWithSeconds = timeStr.includes(':') && timeStr.split(':').length === 2 
                        ? `${timeStr}:00` 
                        : timeStr;
                      const appointmentDateTime = new Date(`${datePart}T${timeWithSeconds}`);
                      
                      const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                      const canCancel = hoursUntilAppointment >= 2;
                      
                      return (
                        <button
                          disabled={!canCancel}
                          className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-4 py-2 rounded-lg border border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!canCancel ? 'Cannot cancel within 2 hours of appointment time' : ''}
                        >
                          <FaTimes className="w-4 h-4" />
                          <span className="text-sm font-medium">Cancel</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Expanded Details Section */}
                {expandedAppointment === appointment.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Appointment Information</h5>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Appointment ID:</span>
                            <span className="ml-2 text-gray-800 dark:text-gray-200">{appointment.id}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {appointment.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Created:</span>
                            <span className="ml-2 text-gray-800 dark:text-gray-200">
                              {new Date(appointment.createdAt || appointment.appointmentDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Doctor Information</h5>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                            <span className="ml-2 text-gray-800 dark:text-gray-200">
                              Dr. {appointment.doctor?.name || 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Specialization:</span>
                            <span className="ml-2 text-gray-800 dark:text-gray-200">
                              {appointment.doctor?.specialization || 'N/A'}
                            </span>
                          </div>
                          {appointment.doctor?.experience && (
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">Experience:</span>
                              <span className="ml-2 text-gray-800 dark:text-gray-200">
                                {appointment.doctor.experience}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {appointment.patientNotes && (
                      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                          <span className="mr-2">📝</span>
                          Your Notes
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{appointment.patientNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
      
      {/* Video Call Modal */}
      {showVideoCall && selectedAppointmentId && token && (
        <PatientVideoCallModal
          appointmentId={selectedAppointmentId}
          isOpen={showVideoCall}
          onClose={() => {
            setShowVideoCall(false);
            setSelectedAppointmentId(null);
            // Refresh appointments to update status
            fetchAppointments();
          }}
          firebaseToken={token}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
