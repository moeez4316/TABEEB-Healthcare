'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCreatePrescription, useAppointmentPrescriptions, useUpdatePrescription } from '@/lib/prescription-api';
import { PrescriptionFormData, MedicineFormData, Prescription } from '@/types/prescription';
import { Appointment } from '@/types/appointment';
import { FaArrowLeft, FaPlus, FaTrash, FaPrescriptionBottleAlt, FaUser, FaCalendarAlt, FaEdit, FaEye } from 'react-icons/fa';

export default function PrescribePage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [showExistingPrescriptions, setShowExistingPrescriptions] = useState(true);

  const [formData, setFormData] = useState<PrescriptionFormData>({
    patientUid: '',
    appointmentId: appointmentId,
    diagnosis: '',
    notes: '',
    instructions: '',
    medicines: [
      {
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        timing: ''
      }
    ]
  });

  const [formErrors, setFormErrors] = useState<any>({});
  const createPrescriptionMutation = useCreatePrescription();
  const updatePrescriptionMutation = useUpdatePrescription();
  
  // Fetch existing prescriptions for this appointment
  const { 
    data: existingPrescriptions, 
    isLoading: prescriptionsLoading, 
    error: prescriptionsError 
  } = useAppointmentPrescriptions(appointmentId, token);

  // Fetch appointment details
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!token || !appointmentId) return;

      try {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch appointment');
        }

        const data = await response.json();
        console.log('Fetched appointment:', data);
        
        setAppointment(data);
        setFormData(prev => ({
          ...prev,
          patientUid: data.patientUid
        }));
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('Failed to load appointment details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [token, appointmentId]);

  const handleEditPrescription = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setFormData({
      patientUid: prescription.patientUid,
      appointmentId: prescription.appointmentId,
      diagnosis: prescription.diagnosis || '',
      notes: prescription.notes || '',
      instructions: prescription.instructions || '',
      medicines: prescription.medicines.map(med => ({
        medicineName: med.medicineName,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || '',
        timing: med.timing || ''
      }))
    });
    setShowExistingPrescriptions(false);
  };

  const handleCancelEdit = () => {
    setEditingPrescription(null);
    setFormData({
      patientUid: appointment?.patientUid || '',
      appointmentId: appointmentId,
      diagnosis: '',
      notes: '',
      instructions: '',
      medicines: [
        {
          medicineName: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
          timing: ''
        }
      ]
    });
    setShowExistingPrescriptions(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleInputChange = (field: keyof PrescriptionFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev: any) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleMedicineChange = (index: number, field: keyof MedicineFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.map((medicine, i) => 
        i === index ? { ...medicine, [field]: value } : medicine
      )
    }));
    // Clear error when user starts typing
    if (formErrors.medicines?.[index]?.[field]) {
      setFormErrors((prev: any) => ({
        ...prev,
        medicines: {
          ...prev.medicines,
          [index]: {
            ...prev.medicines?.[index],
            [field]: ''
          }
        }
      }));
    }
  };

  const addMedicine = () => {
    setFormData(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          medicineName: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
          timing: ''
        }
      ]
    }));
  };

  const removeMedicine = (index: number) => {
    if (formData.medicines.length > 1) {
      setFormData(prev => ({
        ...prev,
        medicines: prev.medicines.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const errors: any = {};

    if (!formData.diagnosis.trim()) {
      errors.diagnosis = 'Diagnosis is required';
    }

    const medicineErrors: any = {};
    formData.medicines.forEach((medicine, index) => {
      const medErrors: any = {};
      if (!medicine.medicineName.trim()) {
        medErrors.medicineName = 'Medicine name is required';
      }
      if (!medicine.dosage.trim()) {
        medErrors.dosage = 'Dosage is required';
      }
      if (!medicine.frequency.trim()) {
        medErrors.frequency = 'Frequency is required';
      }
      if (!medicine.duration.trim()) {
        medErrors.duration = 'Duration is required';
      }
      if (Object.keys(medErrors).length > 0) {
        medicineErrors[index] = medErrors;
      }
    });

    if (Object.keys(medicineErrors).length > 0) {
      errors.medicines = medicineErrors;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      if (editingPrescription) {
        // Update existing prescription
        await updatePrescriptionMutation.mutateAsync({
          prescriptionId: editingPrescription.prescriptionId,
          data: {
            diagnosis: formData.diagnosis,
            notes: formData.notes,
            instructions: formData.instructions,
            medicines: formData.medicines
          },
          token
        });
      } else {
        // Create new prescription
        await createPrescriptionMutation.mutateAsync({
          data: {
            patientUid: formData.patientUid,
            appointmentId: formData.appointmentId,
            diagnosis: formData.diagnosis,
            notes: formData.notes,
            instructions: formData.instructions,
            medicines: formData.medicines
          },
          token
        });
      }

      // Success - navigate back to appointments
      router.push('/Doctor/Appointments');
    } catch (error) {
      console.error('Error saving prescription:', error);
      setError(`Failed to ${editingPrescription ? 'update' : 'create'} prescription. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button
            onClick={() => router.push('/Doctor/Appointments')}
            className="text-teal-600 dark:text-teal-400 hover:underline"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/Doctor/Appointments')}
            className="flex items-center text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-4"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Appointments
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <FaPrescriptionBottleAlt className="w-6 h-6 text-teal-600 dark:text-teal-400 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Write Prescription
              </h1>
            </div>

            {appointment && (
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <FaUser className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Patient:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {appointment.patient?.firstName} {appointment.patient?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Existing Prescriptions Section */}
        {showExistingPrescriptions && !prescriptionsError && existingPrescriptions?.data && existingPrescriptions.data.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Existing Prescriptions for this Appointment
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {existingPrescriptions.data.length} prescription(s) found
              </span>
            </div>

            <div className="space-y-4">
              {existingPrescriptions.data.map((prescription) => (
                <div
                  key={prescription.id}
                  className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <FaPrescriptionBottleAlt className="w-4 h-4 text-teal-600 dark:text-teal-400 mr-2" />
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {prescription.diagnosis || 'General Prescription'}
                        </h3>
                        <span className={`ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          prescription.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                        }`}>
                          {prescription.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Created: {formatDate(prescription.createdAt)}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {prescription.medicines.slice(0, 3).map((medicine, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          >
                            {medicine.medicineName} - {medicine.dosage}
                          </span>
                        ))}
                        {prescription.medicines.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400">
                            +{prescription.medicines.length - 3} more
                          </span>
                        )}
                      </div>

                      {prescription.notes && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Notes:</span> {prescription.notes.length > 100 ? `${prescription.notes.substring(0, 100)}...` : prescription.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditPrescription(prescription)}
                        className="flex items-center px-3 py-1.5 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 border border-teal-600 dark:border-teal-400 rounded-md hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                      >
                        <FaEdit className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
              <button
                onClick={() => setShowExistingPrescriptions(false)}
                className="flex items-center px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <FaPlus className="w-3 h-3 mr-2" />
                Write New Prescription
              </button>
            </div>
          </div>
        )}

        {/* No Existing Prescriptions or Write New */}
        {showExistingPrescriptions && (!existingPrescriptions?.data || existingPrescriptions.data.length === 0 || prescriptionsError) && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center">
              <FaPrescriptionBottleAlt className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {prescriptionsError 
                  ? 'Unable to load existing prescriptions' 
                  : 'No prescriptions found for this appointment'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {prescriptionsError 
                  ? 'There was an error loading prescriptions, but you can still create a new one.'
                  : 'This appointment doesn\'t have any prescriptions yet. Create the first one!'
                }
              </p>
              <button
                onClick={() => setShowExistingPrescriptions(false)}
                className="flex items-center px-4 py-2 mx-auto text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <FaPlus className="w-3 h-3 mr-2" />
                Write Prescription
              </button>
            </div>
          </div>
        )}

        {/* Prescription Form */}
        {!showExistingPrescriptions && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingPrescription ? 'Edit Prescription' : 'New Prescription Information'}
                </h2>
                {editingPrescription && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Diagnosis *
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white ${formErrors.diagnosis ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                  rows={3}
                  placeholder="Enter patient diagnosis..."
                />
                {formErrors.diagnosis && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.diagnosis}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  rows={3}
                  placeholder="Additional notes about the patient condition..."
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  General Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  rows={3}
                  placeholder="General instructions for the patient..."
                />
              </div>
            </div>
          </div>

          {/* Medicines */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Medicines
              </h2>
              <button
                type="button"
                onClick={addMedicine}
                className="flex items-center px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <FaPlus className="w-3 h-3 mr-2" />
                Add Medicine
              </button>
            </div>

            <div className="space-y-6">
              {formData.medicines.map((medicine, index) => (
                <div key={index} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">
                      Medicine {index + 1}
                    </h3>
                    {formData.medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Medicine Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Medicine Name *
                      </label>
                      <input
                        type="text"
                        value={medicine.medicineName}
                        onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${formErrors.medicines?.[index]?.medicineName ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                        placeholder="Enter medicine name"
                      />
                      {formErrors.medicines?.[index]?.medicineName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.medicines[index].medicineName}
                        </p>
                      )}
                    </div>

                    {/* Dosage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dosage *
                      </label>
                      <input
                        type="text"
                        value={medicine.dosage}
                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${formErrors.medicines?.[index]?.dosage ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                        placeholder="e.g., 500mg, 1 tablet"
                      />
                      {formErrors.medicines?.[index]?.dosage && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.medicines[index].dosage}
                        </p>
                      )}
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Frequency *
                      </label>
                      <input
                        type="text"
                        value={medicine.frequency}
                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${formErrors.medicines?.[index]?.frequency ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                        placeholder="e.g., 3 times daily, Twice a day"
                      />
                      {formErrors.medicines?.[index]?.frequency && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.medicines[index].frequency}
                        </p>
                      )}
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duration *
                      </label>
                      <input
                        type="text"
                        value={medicine.duration}
                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${formErrors.medicines?.[index]?.duration ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                        placeholder="e.g., 7 days, 2 weeks"
                      />
                      {formErrors.medicines?.[index]?.duration && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.medicines[index].duration}
                        </p>
                      )}
                    </div>

                    {/* Timing */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timing
                      </label>
                      <input
                        type="text"
                        value={medicine.timing}
                        onChange={(e) => handleMedicineChange(index, 'timing', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                        placeholder="e.g., Before meals, After meals"
                      />
                    </div>

                    {/* Instructions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Instructions
                      </label>
                      <input
                        type="text"
                        value={medicine.instructions}
                        onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                        placeholder="Special instructions for this medicine"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/Doctor/Appointments')}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPrescriptionMutation.isPending || updatePrescriptionMutation.isPending}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createPrescriptionMutation.isPending || updatePrescriptionMutation.isPending) 
                ? (editingPrescription ? 'Updating...' : 'Creating...') 
                : (editingPrescription ? 'Update Prescription' : 'Create Prescription')
              }
            </button>
          </div>
        </form>
        )}

        {(createPrescriptionMutation.error || updatePrescriptionMutation.error) && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">
              Error: {(createPrescriptionMutation.error || updatePrescriptionMutation.error)?.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}