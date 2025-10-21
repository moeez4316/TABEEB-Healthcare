'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePatientPrescriptions } from '@/lib/prescription-api';
import { PrescriptionWithProgress } from '@/types/prescription';
import { 
  calculatePrescriptionProgress, 
  calculateMedicineProgress, 
  PrescriptionStatus,
  PrescriptionProgress,
  getStatusColorClasses 
} from '@/utils/prescriptionUtils';
import { 
  MedicineTrackingCard, 
  PrescriptionOverview,
  StatusBadge 
} from '@/components/prescription/MedicineTrackingComponents';
import { FaPrescriptionBottleAlt, FaUser, FaCalendarAlt, FaSearch, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function PatientPrescriptionsPage() {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithProgress | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tracking'>('tracking'); // Default to tracking view

  const { data: prescriptionsData, isLoading, error } = usePatientPrescriptions(
    token,
    currentPage,
    10
  );

  // Process prescriptions data to ensure progress calculations
  const processedPrescriptions: PrescriptionWithProgress[] = prescriptionsData?.data?.map(prescription => {
    // Cast prescription to include optional progress properties
    const prescriptionWithProgress = prescription as PrescriptionWithProgress;
    
    // If backend doesn't provide progress data, calculate it on frontend
    if (!prescriptionWithProgress.overallProgress && prescriptionWithProgress.prescriptionStartDate && prescriptionWithProgress.prescriptionEndDate) {
      const overallProgress = calculatePrescriptionProgress(
        prescriptionWithProgress.prescriptionStartDate,
        prescriptionWithProgress.prescriptionEndDate,
        prescriptionWithProgress.isActive
      );
      
      const medicinesWithProgress = prescriptionWithProgress.medicines.map(medicine => {
        if (medicine.durationDays && prescriptionWithProgress.prescriptionStartDate) {
          const medicineProgress = calculateMedicineProgress(
            prescriptionWithProgress.prescriptionStartDate,
            medicine.durationDays,
            prescriptionWithProgress.isActive
          );
          return { ...medicine, progress: medicineProgress };
        }
        return medicine;
      });

      return {
        ...prescriptionWithProgress,
        overallProgress,
        medicines: medicinesWithProgress,
        activeMedicinesCount: medicinesWithProgress.filter(m => 'progress' in m && m.progress && m.progress.status !== 'expired').length,
        totalMedicinesCount: prescriptionWithProgress.medicines.length
      };
    }
    return prescriptionWithProgress;
  }) || [];

  const filteredPrescriptions = processedPrescriptions.filter(prescription =>
    prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPrescription = (prescription: PrescriptionWithProgress) => {
    setSelectedPrescription(prescription);
    setShowModal(true);
  };

  // Convert backend progress data to frontend format
  const convertToFrontendProgress = (backendProgress: { status: string; daysRemaining: number; daysTotal: number; progressPercentage: number }): PrescriptionProgress => {
    const statusMap: Record<string, PrescriptionStatus> = {
      'active': PrescriptionStatus.ACTIVE,
      'expiring': PrescriptionStatus.EXPIRING,
      'expired': PrescriptionStatus.EXPIRED,
      'completed': PrescriptionStatus.COMPLETED
    };

    const status = statusMap[backendProgress.status] || PrescriptionStatus.ACTIVE;
    const statusColors = getStatusColorClasses(status);
    
    return {
      status,
      daysRemaining: backendProgress.daysRemaining,
      daysTotal: backendProgress.daysTotal,
      progressPercentage: backendProgress.progressPercentage,
      statusColor: statusColors.text,
      statusText: backendProgress.status.charAt(0).toUpperCase() + backendProgress.status.slice(1),
      canMarkCompleted: status !== PrescriptionStatus.EXPIRED
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your prescriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            Failed to load prescriptions. Please try again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FaPrescriptionBottleAlt className="w-8 h-8 text-teal-600 dark:text-teal-400 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Prescriptions
              </h1>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('tracking')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'tracking'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Medicine Tracking
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                List View
              </button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {viewMode === 'tracking' 
              ? 'Track your medicine progress and manage treatment schedules'
              : 'View and manage all your medical prescriptions'
            }
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by diagnosis or doctor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Prescriptions Content */}
        {filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12">
            <FaPrescriptionBottleAlt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No prescriptions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'You haven\'t received any prescriptions yet'}
            </p>
          </div>
        ) : viewMode === 'tracking' ? (
          /* Medicine Tracking View */
          <div className="space-y-8">
            {filteredPrescriptions.map((prescription) => (
              <div key={prescription.id} className="space-y-6">
                {/* Prescription Overview */}
                {prescription.overallProgress && (
                  <PrescriptionOverview
                    prescriptionId={prescription.id}
                    doctorName={prescription.doctor?.name || 'Unknown Doctor'}
                    appointmentDate={prescription.createdAt}
                    totalMedicines={prescription.totalMedicinesCount || prescription.medicines.length}
                    activeMedicines={prescription.activeMedicinesCount || 0}
                    overallProgress={convertToFrontendProgress(prescription.overallProgress)}
                  />
                )}
                
                {/* Medicine Tracking Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {prescription.medicines.map((medicine, index) => (
                    medicine.progress ? (
                      <MedicineTrackingCard
                        key={`${prescription.id}-${index}`}
                        medicineName={medicine.medicineName}
                        dosage={medicine.dosage}
                        frequency={medicine.frequency}
                        instructions={medicine.instructions}
                        progress={convertToFrontendProgress(medicine.progress)}
                        // TODO: Add mark completed functionality
                        // onMarkCompleted={() => handleMarkMedicineCompleted(prescription.id, medicine.id)}
                      />
                    ) : (
                      /* Fallback for medicines without progress data */
                      <div 
                        key={`${prescription.id}-${index}`}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {medicine.medicineName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {medicine.dosage} • {medicine.frequency}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Duration: {medicine.duration}
                        </p>
                        <StatusBadge 
                          status={prescription.isActive ? PrescriptionStatus.ACTIVE : PrescriptionStatus.COMPLETED} 
                          statusText={prescription.isActive ? 'Active' : 'Completed'}
                          className="mt-2"
                        />
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Traditional List View */
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header Info */}
                    <div className="flex items-center mb-3">
                      <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg mr-3">
                        <FaPrescriptionBottleAlt className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {prescription.diagnosis || 'General Prescription'}
                          </h3>
                          {prescription.overallProgress && (
                            <StatusBadge 
                              status={convertToFrontendProgress(prescription.overallProgress).status} 
                              statusText={convertToFrontendProgress(prescription.overallProgress).statusText}
                            />
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <FaUser className="w-3 h-3 mr-1" />
                          <span>Dr. {prescription.doctor?.name}</span>
                          <span className="mx-2">•</span>
                          <FaCalendarAlt className="w-3 h-3 mr-1" />
                          <span>{formatDate(prescription.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Medicine Summary */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Medicines ({prescription.medicines.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {prescription.medicines.slice(0, 3).map((medicine, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          >
                            {medicine.medicineName}
                          </span>
                        ))}
                        {prescription.medicines.length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400">
                            +{prescription.medicines.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notes Preview */}
                    {prescription.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Notes:</span>{' '}
                          {prescription.notes.length > 100
                            ? `${prescription.notes.substring(0, 100)}...`
                            : prescription.notes}
                        </p>
                      </div>
                    )}

                    {/* Progress Summary for List View */}
                    {prescription.overallProgress && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Treatment Progress</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {prescription.overallProgress.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              prescription.overallProgress.status === 'expired' ? 'bg-red-500' :
                              prescription.overallProgress.status === 'expiring' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${prescription.overallProgress.progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>{prescription.activeMedicinesCount} active medicines</span>
                          <span>{prescription.overallProgress.daysRemaining} days remaining</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleViewPrescription(prescription)}
                    className="flex items-center px-4 py-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 border border-teal-600 dark:border-teal-400 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors ml-4"
                  >
                    <FaEye className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {prescriptionsData?.pagination && prescriptionsData.pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing page {prescriptionsData.pagination.currentPage} of{' '}
              {prescriptionsData.pagination.totalPages} ({prescriptionsData.pagination.totalCount} total)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!prescriptionsData.pagination.hasPrevPage}
                className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft className="w-3 h-3 mr-1" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!prescriptionsData.pagination.hasNextPage}
                className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <FaChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Prescription Detail Modal */}
      {showModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg mr-4">
                    <FaPrescriptionBottleAlt className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Prescription Details
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Prescribed by Dr. {selectedPrescription.doctor?.name} on{' '}
                      {formatDate(selectedPrescription.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Patient Info */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedPrescription.patientName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Age:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedPrescription.patientAge} years
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedPrescription.patientGender}
                    </span>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              {selectedPrescription.diagnosis && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Diagnosis</h3>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                    {selectedPrescription.diagnosis}
                  </p>
                </div>
              )}

              {/* Medicines */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Prescribed Medicines</h3>
                <div className="space-y-4">
                  {selectedPrescription.medicines.map((medicine, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-slate-600 rounded-lg p-4"
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        {index + 1}. {medicine.medicineName}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 block">Dosage</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {medicine.dosage}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 block">Frequency</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {medicine.frequency}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 block">Duration</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {medicine.duration}
                          </span>
                        </div>
                        {medicine.timing && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400 block">Timing</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {medicine.timing}
                            </span>
                          </div>
                        )}
                      </div>
                      {medicine.instructions && (
                        <div className="mt-3">
                          <span className="text-gray-600 dark:text-gray-400 block text-sm">Instructions</span>
                          <p className="text-gray-700 dark:text-gray-300">
                            {medicine.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Doctor&apos;s Notes</h3>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                    {selectedPrescription.notes}
                  </p>
                </div>
              )}

              {/* Instructions */}
              {selectedPrescription.instructions && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">General Instructions</h3>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                    {selectedPrescription.instructions}
                  </p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-600">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Print Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}