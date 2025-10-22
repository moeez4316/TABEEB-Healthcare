'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FaPills, FaTimes, FaCalendarAlt, FaClock, FaExclamationCircle } from 'react-icons/fa';

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

interface CurrentMedicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrentMedicationsModal: React.FC<CurrentMedicationsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { token } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentMedications = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/prescriptions/patient?page=1&limit=50`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch medications');
      }

      const data = await response.json();
      
      // Filter only active prescriptions
      const activePrescriptions = data.data?.filter(
        (p: Prescription) => p.isActive
      ) || [];
      
      setPrescriptions(activePrescriptions);
    } catch (err) {
      console.error('Error fetching current medications:', err);
      setError('Unable to load your current medications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCurrentMedications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaPills className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Current Medications</h2>
                <p className="text-sm text-teal-100">Active prescriptions and treatments</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-teal-800 dark:hover:bg-teal-900 rounded-full p-2 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading your medications...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <FaExclamationCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <button
                    onClick={fetchCurrentMedications}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
                    You don&apos;t have any active prescriptions at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Info Banner */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-1">Important Information</p>
                        <p>Please inform your doctor about all medications you&apos;re currently taking to avoid potential drug interactions.</p>
                      </div>
                    </div>
                  </div>

                  {/* Prescriptions List */}
                  {prescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
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
                          Medications ({prescription.medicines.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {prescription.medicines.map((medicine) => (
                            <div
                              key={medicine.id}
                              className="bg-gray-50 dark:bg-slate-600 rounded-lg p-3 border border-gray-200 dark:border-slate-500"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {medicine.name}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {medicine.dosage}
                                  </p>
                                </div>
                                {medicine.progress && (
                                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(medicine.progress.status)}`}>
                                    {medicine.progress.daysRemaining}d
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                <FaClock className="w-3 h-3" />
                                <span>{medicine.frequency}</span>
                              </div>
                              {medicine.instructions && (
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                                  {medicine.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-900 px-6 py-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total active prescriptions: <span className="font-semibold text-gray-900 dark:text-white">{prescriptions.length}</span>
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
