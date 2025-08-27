'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Doctor, TimeSlot, AppointmentBooking, Appointment } from '@/types/appointment';
import { DoctorSelector } from '@/components/appointment/BookingFlow/DoctorSelector';
import { DatePicker } from '@/components/appointment/BookingFlow/DatePicker';
import { TimeSlotPicker } from '@/components/appointment/BookingFlow/TimeSlotPicker';
import { BookingForm } from '@/components/appointment/BookingFlow/BookingForm';
import { BookingConfirmation } from '@/components/appointment/BookingFlow/BookingConfirmation';
import { useAuth } from '@/lib/auth-context';

type BookingStep = 'doctor' | 'date' | 'time' | 'details' | 'confirmation';

export default function BookAppointmentPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedDoctorId = searchParams.get('doctorId');
  
  // Booking flow state
  const [currentStep, setCurrentStep] = useState<BookingStep>('doctor');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);
  
  // Data state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorAvailability, setDoctorAvailability] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handle pre-selected doctor
  useEffect(() => {
    if (preSelectedDoctorId && doctors.length > 0) {
      const doctor = doctors.find(d => d.uid === preSelectedDoctorId);
      if (doctor) {
        setSelectedDoctor(doctor);
        setCurrentStep('date');
      }
    }
  }, [preSelectedDoctorId, doctors]);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/doctor/verified`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      console.log('Fetched doctors:', data);
      
      // Transform the data to match our Doctor interface
      const transformedDoctors: Doctor[] = data.doctors?.map((doctor: {
        uid: string;
        name: string;
        specialization: string;
        consultationFees?: number;
        verification?: { isVerified: boolean };
      }) => ({
        uid: doctor.uid,
        name: doctor.name,
        specialization: doctor.specialization,
        consultationFees: doctor.consultationFees || 100, // Default fee
        rating: 4.5, // Default rating
        isAvailable: doctor.verification?.isVerified || false
      })) || [];

      setDoctors(transformedDoctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorAvailability = async (doctorUid: string) => {
    setAvailabilityLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/availability/doctor/${doctorUid}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch doctor availability');
        return;
      }

      const data = await response.json();
      console.log('Fetched doctor availability:', data);
      
      // Convert availability dates to Date objects
      const availableDates = (Array.isArray(data) ? data : []).map((availability: { date: string }) => 
        new Date(availability.date)
      );
      
      setDoctorAvailability(availableDates);
    } catch (err) {
      console.error('Error fetching doctor availability:', err);
      setDoctorAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(null);
    setSelectedSlot(null);
    setCurrentStep('date');
    
    // Fetch availability for the selected doctor
    fetchDoctorAvailability(doctor.uid);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentStep('time');
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setCurrentStep('details');
  };

  const handleBookingSubmit = async (bookingData: AppointmentBooking & { patientNotes: string; sharedDocumentIds?: string[] }) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Submitting booking:', bookingData);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/appointments/book`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book appointment');
      }

      const result = await response.json();
      console.log('Booking successful:', result);
      
      setBookedAppointment(result.appointment);
      setCurrentStep('confirmation');
    } catch (err) {
      console.error('Booking error:', err);
      setError(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleBackStep = () => {
    switch (currentStep) {
      case 'date':
        setCurrentStep('doctor');
        setSelectedDate(null);
        break;
      case 'time':
        setCurrentStep('date');
        setSelectedSlot(null);
        break;
      case 'details':
        setCurrentStep('time');
        break;
      default:
        break;
    }
  };

  const handleNewBooking = () => {
    setCurrentStep('doctor');
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookedAppointment(null);
    setError(null);
  };

  const handleViewAppointments = () => {
    router.push('/Patient/appointments');
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'doctor': return 'Select Doctor';
      case 'date': return 'Choose Date';
      case 'time': return 'Pick Time Slot';
      case 'details': return 'Appointment Details';
      case 'confirmation': return 'Booking Confirmed';
      default: return 'Book Appointment';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'doctor':
        return (
          <DoctorSelector
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            onDoctorSelect={handleDoctorSelect}
            loading={loading}
          />
        );

      case 'date':
        return (
          <div className="max-w-md mx-auto relative">
            {availabilityLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading doctor availability...</p>
                </div>
              </div>
            )}
            <DatePicker
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              availableDates={doctorAvailability}
            />
          </div>
        );

      case 'time':
        return selectedDoctor && selectedDate ? (
          <TimeSlotPicker
            doctorUid={selectedDoctor.uid}
            selectedDate={selectedDate}
            onSlotSelect={handleSlotSelect}
            selectedSlot={selectedSlot}
            token={token}
          />
        ) : null;

      case 'details':
        return selectedDoctor && selectedDate && selectedSlot ? (
          <BookingForm
            doctor={selectedDoctor}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            onBookingSubmit={handleBookingSubmit}
            loading={loading}
          />
        ) : null;

      case 'confirmation':
        return bookedAppointment ? (
          <BookingConfirmation
            appointment={bookedAppointment}
            onNewBooking={handleNewBooking}
            onViewAppointments={handleViewAppointments}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getStepTitle()}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Book your medical consultation with verified doctors
              </p>
            </div>
            
            {currentStep !== 'doctor' && currentStep !== 'confirmation' && (
              <button
                onClick={handleBackStep}
                className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            )}
          </div>

          {/* Progress Indicator */}
          {currentStep !== 'confirmation' && (
            <div className="mt-6">
              <div className="flex items-center space-x-4">
                {['doctor', 'date', 'time', 'details'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shadow-lg
                        ${
                          step === currentStep
                            ? 'bg-teal-600 text-white'
                            : ['doctor', 'date', 'time', 'details'].indexOf(currentStep) > index
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }
                      `}
                    >
                      {index + 1}
                    </div>
                    {index < 3 && (
                      <div
                        className={`
                          w-16 h-1 mx-2 rounded-full
                          ${
                            ['doctor', 'date', 'time', 'details'].indexOf(currentStep) > index
                              ? 'bg-green-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }
                        `}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
            <div className="text-red-800 dark:text-red-400 font-medium">Error</div>
            <div className="text-red-600 dark:text-red-300 text-sm">{error}</div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="p-6">
            {renderStepContent()}
          </div>
        </div>

        {/* Selected Information Summary */}
        {(selectedDoctor || selectedDate || selectedSlot) && currentStep !== 'confirmation' && (
          <div className="mt-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Current Selection</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              {selectedDoctor && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
                  <span className="font-medium text-gray-900 dark:text-white">Dr. {selectedDoctor.name}</span>
                  <span className="text-teal-600 dark:text-teal-400">({selectedDoctor.specialization})</span>
                </div>
              )}
              {selectedDate && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {selectedSlot && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 dark:text-gray-400">Time:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedSlot.startTime} - {selectedSlot.endTime}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
