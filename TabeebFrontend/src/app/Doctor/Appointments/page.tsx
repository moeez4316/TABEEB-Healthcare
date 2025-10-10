'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Appointment } from '@/types/appointment';
import { useAuth } from '@/lib/auth-context';
import { formatTime, formatDate, formatAge } from '@/lib/dateUtils';
import { FaCalendarCheck, FaUser, FaClock, FaCheckCircle, FaTimesCircle, FaChevronDown, FaChevronUp, FaPrescriptionBottleAlt } from 'react-icons/fa';
import { SharedDocumentsView } from '@/components/appointment/SharedDocumentsView';
import { useRouter } from 'next/navigation';

export default function DoctorAppointmentsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'pending' | 'confirmed'>('upcoming');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/appointments/doctor?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      console.log('Fetched doctor appointments:', data);
      
      setAppointments(data.appointments || []);
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

  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'CONFIRMED' | 'CANCELLED', cancelReason?: string) => {
    setUpdating(appointmentId);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          ...(newStatus === 'CANCELLED' && cancelReason && { cancelReason })
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }

      // Refresh appointments
      fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Failed to update appointment. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancelClick = (appointmentId: string) => {
    setAppointmentToCancel(appointmentId);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel || !cancelReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }

    await updateAppointmentStatus(appointmentToCancel, 'CANCELLED', cancelReason);
    setShowCancelModal(false);
    setAppointmentToCancel(null);
    setCancelReason('');
  };

  const handleCancelClose = () => {
    setShowCancelModal(false);
    setAppointmentToCancel(null);
    setCancelReason('');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'completed': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-800';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-800';
    }
  };

  const filterAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const filtered = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      appointmentDate.setHours(0, 0, 0, 0);
      
      switch (filter) {
        case 'today':
          return appointmentDate.getTime() === today.getTime();
        case 'upcoming':
          return appointmentDate.getTime() >= tomorrow.getTime();
        case 'pending':
          return appointment.status === 'PENDING';
        case 'confirmed':
          return appointment.status === 'CONFIRMED';
        default:
          return true;
      }
    });

    // Sort filtered appointments by date and time
    return filtered.sort((a, b) => {
      const dateA = new Date(a.appointmentDate);
      const dateB = new Date(b.appointmentDate);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // If dates are the same, sort by start time
      return a.startTime.localeCompare(b.startTime);
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
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center">
                  <FaCalendarCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                    Patient Appointments
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                    Manage your scheduled appointments
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{appointments.length}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Total Appointments</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { 
                label: 'Today\'s Appointments', 
                value: appointments.filter(a => {
                  const today = new Date();
                  const aptDate = new Date(a.appointmentDate);
                  return aptDate.toDateString() === today.toDateString();
                }).length,
                color: 'text-blue-600 dark:text-blue-400',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                borderColor: 'border-blue-200 dark:border-blue-800'
              },
              { 
                label: 'Upcoming', 
                value: appointments.filter(a => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const aptDate = new Date(a.appointmentDate);
                  aptDate.setHours(0, 0, 0, 0);
                  return aptDate.getTime() >= tomorrow.getTime();
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
                label: 'Confirmed', 
                value: appointments.filter(a => a.status === 'CONFIRMED').length,
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
                borderColor: 'border-green-200 dark:border-green-800'
              },
              { 
                label: 'Completed', 
                value: appointments.filter(a => a.status === 'COMPLETED').length,
                color: 'text-purple-600 dark:text-purple-400',
                bgColor: 'bg-purple-50 dark:bg-purple-900/20',
                borderColor: 'border-purple-200 dark:border-purple-800'
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
          <div className="mb-6 flex flex-wrap justify-center space-x-1 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-lg border border-gray-200 dark:border-slate-700">
            {[
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'today', label: 'Today' },
              { key: 'pending', label: 'Pending' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'all', label: 'All' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`
                  px-4 py-2 rounded-md font-medium transition-all duration-200 flex-1 min-w-[90px] text-center
                  ${filter === tab.key 
                    ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                  }
                `}
                style={{maxWidth: '100%'}}
              >
                {tab.label}
              </button>
            ))}
          </div>

        {/* Info Message for Upcoming Filter */}
        {filter === 'upcoming' && filteredAppointments.length > 0 && (
          <div className="mb-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-teal-500"></div>
              <p className="text-teal-700 dark:text-teal-300 text-sm font-medium">
                Showing appointments scheduled for tomorrow and beyond. These are future appointment requests from patients.
              </p>
            </div>
          </div>
        )}

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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
            <FaCalendarCheck className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filter === 'today' ? 'No Appointments Today' :
               filter === 'upcoming' ? 'No Upcoming Appointments' :
               filter === 'pending' ? 'No Pending Appointments' :
               filter === 'confirmed' ? 'No Confirmed Appointments' :
               'No Appointments Found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'upcoming' 
                ? 'No appointments are scheduled for tomorrow or later. New appointment requests will appear here.'
                : filter === 'today'
                ? 'You don\'t have any appointments scheduled for today.'
                : `No appointments match the ${filter} filter criteria.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map(appointment => (
              <div key={appointment.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Patient Avatar */}
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center overflow-hidden">
                      {appointment.patient?.profileImageUrl ? (
                        <Image 
                          src={appointment.patient.profileImageUrl} 
                          alt="Patient" 
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    
                    {/* Appointment Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {appointment.patient?.firstName && appointment.patient?.lastName 
                            ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                            : (appointment.patient?.name || 'Unknown Patient')
                          }
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div className="flex items-center space-x-2">
                          <FaCalendarCheck className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {formatDate(new Date(appointment.appointmentDate))}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <FaClock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
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

                      {/* Patient Contact Info */}
                      <div className="mb-3 space-y-1">
                        {appointment.patient?.email && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Email:</span> {appointment.patient.email}
                          </p>
                        )}
                        {appointment.patient?.phone && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Phone:</span> {appointment.patient.phone}
                          </p>
                        )}
                        {appointment.patient?.gender && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Gender:</span> {appointment.patient.gender.charAt(0).toUpperCase() + appointment.patient.gender.slice(1)}
                          </p>
                        )}
                        {appointment.patient?.dateOfBirth && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Age:</span> {formatAge(appointment.patient.dateOfBirth)}
                          </p>
                        )}
                      </div>
                      
                      {appointment.patientNotes && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Patient Notes:</p>
                          <p className="text-sm text-gray-800 dark:text-gray-300">{appointment.patientNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 w-full sm:w-auto items-stretch sm:items-end">
                    <button
                      onClick={() => setExpandedAppointment(expandedAppointment === appointment.id ? null : appointment.id)}
                      className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 px-2 py-1 rounded border border-teal-600 dark:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-xs sm:text-sm max-w-full"
                      style={{wordBreak: 'break-word'}}
                    >
                      {expandedAppointment === appointment.id ? (
                        <>
                          <FaChevronUp className="w-3 h-3" />
                          <span className="">Hide Details</span>
                        </>
                      ) : (
                        <>
                          <FaChevronDown className="w-3 h-3" />
                          <span className="">View Details</span>
                        </>
                      )}
                    </button>
                    {appointment.status === 'PENDING' && (
                      <div className="flex flex-col space-y-2 w-full">
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'CONFIRMED')}
                          disabled={updating === appointment.id}
                          className="flex items-center space-x-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 px-2 py-1 rounded border border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50 text-xs sm:text-sm max-w-full"
                          style={{wordBreak: 'break-word'}}
                        >
                          <FaCheckCircle className="w-3 h-3" />
                          <span className="">
                            {updating === appointment.id ? 'Confirming...' : 'Confirm'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleCancelClick(appointment.id)}
                          disabled={updating === appointment.id}
                          className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-1 rounded border border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 text-xs sm:text-sm max-w-full"
                          style={{wordBreak: 'break-word'}}
                        >
                          <FaTimesCircle className="w-3 h-3" />
                          <span className="">
                            {updating === appointment.id ? 'Cancelling...' : 'Cancel'}
                          </span>
                        </button>
                      </div>
                    )}
                    {(appointment.status === 'COMPLETED' || appointment.status === 'CONFIRMED') && (
                      <div className="flex flex-col space-y-2 w-full">
                        <button
                          onClick={() => router.push(`/Doctor/Appointments/prescribe/${appointment.id}`)}
                          className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 px-2 py-1 rounded border border-teal-600 dark:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-xs sm:text-sm max-w-full"
                          style={{wordBreak: 'break-word'}}
                        >
                          <FaPrescriptionBottleAlt className="w-3 h-3" />
                          <span className="">Assign Prescription</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Expanded Content - Shared Documents */}
                {expandedAppointment === appointment.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                    <SharedDocumentsView 
                      appointmentId={appointment.id}
                      className="mb-4"
                    />
                    
                    {/* Additional Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Appointment Information</h5>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Appointment ID:</span>
                            <span className="ml-2 text-gray-800 dark:text-gray-200">{appointment.id}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Created:</span>
                            <span className="ml-2 text-gray-800 dark:text-gray-200">
                              {new Date(appointment.createdAt || appointment.appointmentDate).toLocaleDateString()}
                            </span>
                          </div>
                          {appointment.updatedAt && appointment.updatedAt !== appointment.createdAt && (
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">Last Updated:</span>
                              <span className="ml-2 text-gray-800 dark:text-gray-200">
                                {new Date(appointment.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Patient Contact</h5>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                            <span className="ml-2 text-gray-800 dark:text-gray-200">{appointment.patient?.name || 'N/A'}</span>
                          </div>
                          {appointment.patient?.phone && (
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">Phone:</span>
                              <span className="ml-2 text-gray-800 dark:text-gray-200">{appointment.patient.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full mx-4 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cancel Appointment
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for cancelling this appointment:
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mb-4">
              {cancelReason.length}/500 characters
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={!cancelReason.trim() || updating === appointmentToCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating === appointmentToCancel ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
