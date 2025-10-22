'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FaPills, FaTimes, FaCalendarAlt, FaClock, FaExclamationCircle, FaCheckCircle, FaBan, FaEye, FaEyeSlash } from 'react-icons/fa';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  instructions?: string;
  progress?: {
    status: string;
    daysRemaining: number;
  };
}

interface Prescription {
  id: string;
  diagnosis: string;
  prescriptionStartDate: string;
  prescriptionEndDate: string;
  isActive: boolean;
  doctor?: {
    name: string;
    specialization: string;
  };
  medicines: Medicine[];
  overallProgress?: {
    status: string;
    daysRemaining: number;
  };
}

interface MedicationAction {
  prescriptionId: string;
  medicineId: string;
  action: 'stop' | 'continue';
  reason?: string;
}

interface PatientMedicationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  appointmentId: string;
  appointmentDateTime: string;
  isEnabled: boolean;
}

export const PatientMedicationViewModal: React.FC<PatientMedicationViewModalProps> = ({
  isOpen,
  onClose,
  patientId,
  appointmentId,
  appointmentDateTime,
  isEnabled
}) => {
  const { token } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicationActions, setMedicationActions] = useState<Map<string, MedicationAction>>(new Map());
  const [showStoppedMeds, setShowStoppedMeds] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPatientMedications = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/prescriptions/patient/${patientId}?page=1&limit=50`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch patient medications');
      }

      const data = await response.json();
      
      // Filter only active prescriptions
      const activePrescriptions = data.data?.filter(
        (p: Prescription) => p.isActive
      ) || [];
      
      setPrescriptions(activePrescriptions);
    } catch (err) {
      console.error('Error fetching patient medications:', err);
      setError('Unable to load patient medications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isEnabled) {
      fetchPatientMedications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEnabled]);

  const handleMedicationAction = (prescriptionId: string, medicineId: string, action: 'stop' | 'continue') => {
    const key = `${prescriptionId}-${medicineId}`;
    const newActions = new Map(medicationActions);
    
    if (action === 'continue') {
      // Remove the action (means continue as is)
      newActions.delete(key);
    } else {
      // Mark as stopped
      newActions.set(key, {
        prescriptionId,
        medicineId,
        action,
      });
    }
    
    setMedicationActions(newActions);
  };

  const getMedicationStatus = (prescriptionId: string, medicineId: string): 'active' | 'stopped' => {
    const key = `${prescriptionId}-${medicineId}`;
    const action = medicationActions.get(key);
    return action?.action === 'stop' ? 'stopped' : 'active';
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      // Convert Map to array
      const actions = Array.from(medicationActions.values());
      
      const response = await fetch(
        `${API_URL}/api/appointments/${appointmentId}/medication-review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            actions,
            reviewDate: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save medication changes');
      }

      // Show success message
      alert('Medication review saved successfully!');
      onClose();
    } catch (err) {
      console.error('Error saving medication changes:', err);
      alert('Failed to save medication review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      expiring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      expired: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
      completed: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
    };
    
    return colors[status] || colors.active;
  };

  if (!isOpen) return null;

  // Calculate if button should be enabled (15 minutes before appointment)
  const now = new Date();
  const appointmentDate = new Date(appointmentDateTime);
  const minutesUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60);
  const isAccessible = minutesUntilAppointment <= 15 && minutesUntilAppointment >= -60;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <FaPills className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Patient Medication Review</h2>
                <p className="text-sm text-blue-100">Review and manage patient&apos;s current medications</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 dark:hover:bg-blue-900 rounded-full p-2 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-160px)]">
            <div className="p-6">
              {!isEnabled || !isAccessible ? (
                <div className="text-center py-12">
                  <FaClock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Not Yet Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Medication review is available 15 minutes before the scheduled appointment time.
                  </p>
                </div>
              ) : loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading patient medications...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <FaExclamationCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <button
                    onClick={fetchPatientMedications}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <FaPills className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No active medications
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    This patient doesn&apos;t have any active prescriptions at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Control Bar */}
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Total Prescriptions:</span>
                        <span className="text-gray-900 dark:text-white">{prescriptions.length}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Actions Taken:</span>
                        <span className="text-gray-900 dark:text-white">{medicationActions.size}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowStoppedMeds(!showStoppedMeds)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors"
                    >
                      {showStoppedMeds ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                      <span>{showStoppedMeds ? 'Hide' : 'Show'} Stopped Meds</span>
                    </button>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-1">Medication Review Instructions</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Click &quot;Stop&quot; to discontinue a medication</li>
                          <li>Click &quot;Continue&quot; to keep the medication active</li>
                          <li>Stopped medications will be hidden from view unless toggled</li>
                          <li>Remember to save your changes before closing</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Prescriptions List */}
                  {prescriptions.map((prescription) => {
                    // Filter medicines based on show stopped toggle
                    const visibleMedicines = prescription.medicines.filter(medicine => {
                      if (showStoppedMeds) return true;
                      return getMedicationStatus(prescription.id, medicine.id) !== 'stopped';
                    });

                    if (visibleMedicines.length === 0 && !showStoppedMeds) return null;

                    return (
                      <div
                        key={prescription.id}
                        className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-5 shadow-sm"
                      >
                        {/* Prescription Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {prescription.diagnosis}
                              </h3>
                              {prescription.overallProgress && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(prescription.overallProgress.status)}`}>
                                  {prescription.overallProgress.status === 'active' && `${prescription.overallProgress.daysRemaining} days left`}
                                  {prescription.overallProgress.status === 'expiring' && 'Expiring soon'}
                                  {(prescription.overallProgress.status === 'expired' || prescription.overallProgress.status === 'completed') && 'Completed'}
                                </span>
                              )}
                            </div>
                            {prescription.doctor && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Prescribed by Dr. {prescription.doctor.name} • {prescription.doctor.specialization}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <FaCalendarAlt className="w-4 h-4" />
                            <span>{formatDate(prescription.prescriptionStartDate)}</span>
                          </div>
                          <span>→</span>
                          <div className="flex items-center space-x-2">
                            <FaCalendarAlt className="w-4 h-4" />
                            <span>{formatDate(prescription.prescriptionEndDate)}</span>
                          </div>
                        </div>

                        {/* Medicines */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            Medications ({visibleMedicines.length})
                          </h4>
                          <div className="space-y-3">
                            {visibleMedicines.map((medicine) => {
                              const status = getMedicationStatus(prescription.id, medicine.id);
                              const isStopped = status === 'stopped';

                              return (
                                <div
                                  key={medicine.id}
                                  className={`bg-gray-50 dark:bg-slate-600 rounded-lg p-4 border-2 transition-all ${
                                    isStopped 
                                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 opacity-75' 
                                      : 'border-gray-200 dark:border-slate-500'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {medicine.name}
                                        </p>
                                        {isStopped && (
                                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-400 text-xs font-semibold rounded">
                                            STOPPED
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                        {medicine.dosage}
                                      </p>
                                      <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                                        <FaClock className="w-3 h-3" />
                                        <span>{medicine.frequency}</span>
                                      </div>
                                      {medicine.instructions && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                          {medicine.instructions}
                                        </p>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col space-y-2 ml-4">
                                      <button
                                        onClick={() => handleMedicationAction(prescription.id, medicine.id, 'continue')}
                                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                          !isStopped
                                            ? 'bg-green-600 text-white shadow-sm'
                                            : 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 border border-green-600 dark:border-green-500 hover:bg-green-50 dark:hover:bg-slate-600'
                                        }`}
                                      >
                                        <FaCheckCircle className="w-3 h-3" />
                                        <span>Continue</span>
                                      </button>
                                      <button
                                        onClick={() => handleMedicationAction(prescription.id, medicine.id, 'stop')}
                                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                          isStopped
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-500 hover:bg-red-50 dark:hover:bg-slate-600'
                                        }`}
                                      >
                                        <FaBan className="w-3 h-3" />
                                        <span>Stop</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {isEnabled && isAccessible && prescriptions.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-900 px-6 py-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {medicationActions.size > 0 ? (
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      ⚠️ You have unsaved changes ({medicationActions.size} actions)
                    </span>
                  ) : (
                    <span>No changes made</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={medicationActions.size === 0 || saving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
