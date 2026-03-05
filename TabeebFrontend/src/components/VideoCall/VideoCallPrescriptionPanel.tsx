'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  useCreatePrescription,
  useAppointmentPrescriptions,
  useUpdatePrescription,
  useDeletePrescription,
} from '@/lib/prescription-api';
import { useAppointmentById } from '@/lib/hooks/useAppointments';
import { PrescriptionFormData, MedicineFormData, Prescription } from '@/types/prescription';
import {
  FaTimes,
  FaPlus,
  FaTrash,
  FaPrescriptionBottleAlt,
  FaEdit,
  FaChevronRight,
  FaChevronLeft,
  FaCheck,
} from 'react-icons/fa';

interface VideoCallPrescriptionPanelProps {
  appointmentId: string;
  isOpen: boolean;
  onToggle: () => void;
}

const emptyMedicine: MedicineFormData = {
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '1 day',
  durationDays: 1,
  instructions: '',
  timing: '',
};

export default function VideoCallPrescriptionPanel({
  appointmentId,
  isOpen,
  onToggle,
}: VideoCallPrescriptionPanelProps) {
  const { token } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<Prescription | null>(null);

  const [formData, setFormData] = useState<PrescriptionFormData>({
    patientUid: '',
    appointmentId,
    diagnosis: '',
    notes: '',
    instructions: '',
    medicines: [{ ...emptyMedicine }],
  });

  interface FormErrors {
    [key: string]: string | Record<number, Partial<Record<keyof MedicineFormData, string>>> | undefined;
    diagnosis?: string;
    medicines?: Record<number, Partial<Record<keyof MedicineFormData, string>>>;
  }

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const createMutation = useCreatePrescription();
  const updateMutation = useUpdatePrescription();
  const deleteMutation = useDeletePrescription();

  const { data: existingPrescriptions, error: prescriptionsError } =
    useAppointmentPrescriptions(appointmentId, token);

  const { data: appointment } = useAppointmentById(token, appointmentId, true);

  useEffect(() => {
    if (appointment?.patientUid) {
      setFormData((prev) => ({ ...prev, patientUid: appointment.patientUid }));
    }
  }, [appointment?.patientUid]);

  // --- handlers ---

  const resetForm = () => {
    setEditingPrescription(null);
    setFormData({
      patientUid: appointment?.patientUid || '',
      appointmentId,
      diagnosis: '',
      notes: '',
      instructions: '',
      medicines: [{ ...emptyMedicine }],
    });
    setFormErrors({});
  };

  const handleEditPrescription = (p: Prescription) => {
    setEditingPrescription(p);
    setSuccessMessage(null);
    setFormData({
      patientUid: p.patientUid,
      appointmentId: p.appointmentId,
      diagnosis: p.diagnosis || '',
      notes: p.notes || '',
      instructions: p.instructions || '',
      medicines: p.medicines.map((m) => ({
        medicineName: m.medicineName,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        durationDays: m.durationDays || 1,
        instructions: m.instructions || '',
        timing: m.timing || '',
      })),
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    resetForm();
    setShowForm(false);
  };

  const handleDeletePrescription = (p: Prescription) => {
    setPrescriptionToDelete(p);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!prescriptionToDelete || !token) return;
    try {
      await deleteMutation.mutateAsync({
        prescriptionId: prescriptionToDelete.prescriptionId,
        token,
      });
      if (editingPrescription?.prescriptionId === prescriptionToDelete.prescriptionId) {
        handleCancelEdit();
      }
      setError(null);
    } catch {
      setError('Failed to delete prescription.');
    }
    setShowDeleteConfirm(false);
    setPrescriptionToDelete(null);
  };

  const handleInputChange = (field: keyof PrescriptionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleMedicineChange = (index: number, field: keyof MedicineFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
    if (formErrors.medicines?.[index]?.[field]) {
      setFormErrors((prev) => ({
        ...prev,
        medicines: { ...prev.medicines, [index]: { ...(prev.medicines?.[index] || {}), [field]: '' } },
      }));
    }
  };

  const addMedicine = () => {
    setFormData((prev) => ({ ...prev, medicines: [...prev.medicines, { ...emptyMedicine }] }));
  };

  const removeMedicine = (index: number) => {
    if (formData.medicines.length > 1) {
      setFormData((prev) => ({ ...prev, medicines: prev.medicines.filter((_, i) => i !== index) }));
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.diagnosis.trim()) errors.diagnosis = 'Diagnosis is required';

    const medErrors: Record<number, Partial<Record<keyof MedicineFormData, string>>> = {};
    formData.medicines.forEach((med, i) => {
      const e: Partial<Record<keyof MedicineFormData, string>> = {};
      if (!med.medicineName.trim()) e.medicineName = 'Required';
      if (!med.dosage.trim()) e.dosage = 'Required';
      if (!med.frequency.trim()) e.frequency = 'Required';
      if (!med.duration.trim()) e.duration = 'Required';
      if (!med.durationDays || med.durationDays < 1 || med.durationDays > 365) e.durationDays = '1-365 days';
      if (Object.keys(e).length) medErrors[i] = e;
    });
    if (Object.keys(medErrors).length) errors.medicines = medErrors;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !token) return;

    try {
      if (editingPrescription) {
        await updateMutation.mutateAsync({
          prescriptionId: editingPrescription.prescriptionId,
          data: {
            diagnosis: formData.diagnosis,
            notes: formData.notes,
            instructions: formData.instructions,
            medicines: formData.medicines,
          },
          token,
        });
      } else {
        await createMutation.mutateAsync({
          data: {
            patientUid: formData.patientUid,
            appointmentId: formData.appointmentId,
            diagnosis: formData.diagnosis,
            notes: formData.notes,
            instructions: formData.instructions,
            medicines: formData.medicines,
          },
          token,
        });
      }
      resetForm();
      setShowForm(false);
      setError(null);
      setSuccessMessage(`Prescription ${editingPrescription ? 'updated' : 'created'} successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      setError(`Failed to ${editingPrescription ? 'update' : 'create'} prescription.`);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // --- render ---

  return (
    <>
      {/* Toggle Tab (always visible on the right edge of the video call) */}
      <button
        onClick={onToggle}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 px-2 py-5 sm:px-1.5 sm:py-4 rounded-l-lg shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-teal-700 text-white hover:bg-teal-800'
            : 'bg-teal-600 text-white hover:bg-teal-700 animate-pulse hover:animate-none'
        }`}
        title={isOpen ? 'Close prescription panel' : 'Open prescription panel'}
      >
        {isOpen ? <FaChevronRight className="w-4 h-4" /> : <FaChevronLeft className="w-4 h-4" />}
        {!isOpen && (
          <span className="writing-mode-vertical text-xs font-semibold tracking-wide" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            Rx
          </span>
        )}
      </button>

      {/* Sliding Panel */}
      <div
        className={`absolute top-0 right-0 h-full z-20 transition-transform duration-300 ease-in-out w-full sm:w-[min(420px,45vw)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:py-3 bg-teal-600 dark:bg-teal-700 text-white shrink-0">
            <div className="flex items-center gap-2">
              <FaPrescriptionBottleAlt className="w-4 h-4" />
              <h3 className="font-semibold text-sm sm:text-base">Prescription</h3>
            </div>
            <button onClick={onToggle} className="p-1.5 hover:bg-white/20 rounded transition-colors">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Panel Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Success / Error Messages */}
            {successMessage && (
              <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-xs flex items-center gap-2">
                <FaCheck className="w-3 h-3 shrink-0" />
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-xs">
                {error}
                <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
              </div>
            )}

            {/* Patient Info */}
            {appointment && (
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 text-xs sm:text-sm">
                <span className="text-gray-500 dark:text-gray-400">Patient: </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </span>
              </div>
            )}

            {/* Existing Prescriptions */}
            {!showForm && !prescriptionsError && existingPrescriptions?.data && existingPrescriptions.data.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    Existing ({existingPrescriptions.data.length})
                  </h4>
                </div>
                {existingPrescriptions.data.map((p) => (
                  <div
                    key={p.id}
                    className={`border rounded-lg p-3 sm:p-3.5 text-xs sm:text-sm ${
                      p.isActive
                        ? 'border-gray-200 dark:border-slate-600'
                        : 'border-red-200 dark:border-red-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {p.diagnosis || 'General Prescription'}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(p.createdAt)}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {p.medicines.slice(0, 2).map((m, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              {m.medicineName}
                            </span>
                          ))}
                          {p.medicines.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                              +{p.medicines.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                      {p.isActive && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleEditPrescription(p)}
                            className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeletePrescription(p)}
                            className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Prescription Button */}
            {!showForm && (
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                <FaPlus className="w-3 h-3" />
                Write New Prescription
              </button>
            )}

            {/* Prescription Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    {editingPrescription ? 'Edit Prescription' : 'New Prescription'}
                  </h4>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Diagnosis *
                  </label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${
                      formErrors.diagnosis ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    rows={2}
                    placeholder="Enter diagnosis..."
                  />
                  {formErrors.diagnosis && (
                    <p className="mt-0.5 text-xs text-red-500">{formErrors.diagnosis}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recommended Tests
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    rows={2}
                    placeholder="Recommended tests..."
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    General Instructions
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    rows={2}
                    placeholder="General instructions..."
                  />
                </div>

                {/* Medicines */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Medicines</label>
                    <button
                      type="button"
                      onClick={addMedicine}
                      className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700"
                    >
                      <FaPlus className="w-2.5 h-2.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.medicines.map((med, index) => (
                      <div key={index} className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 sm:p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Medicine {index + 1}
                          </span>
                          {formData.medicines.length > 1 && (
                            <button type="button" onClick={() => removeMedicine(index)} className="text-red-500 hover:text-red-700">
                              <FaTrash className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Medicine Name */}
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={med.medicineName}
                              onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${
                                formErrors.medicines?.[index]?.medicineName ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                              }`}
                              placeholder="Medicine name *"
                            />
                          </div>
                          {/* Dosage */}
                          <div>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${
                                formErrors.medicines?.[index]?.dosage ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                              }`}
                              placeholder="Dosage *"
                            />
                          </div>
                          {/* Frequency */}
                          <div>
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${
                                formErrors.medicines?.[index]?.frequency ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                              }`}
                              placeholder="Frequency *"
                            />
                          </div>
                          {/* Duration Days */}
                          <div>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={med.durationDays || 1}
                              onChange={(e) => {
                                const days = parseInt(e.target.value) || 1;
                                handleMedicineChange(index, 'durationDays', days);
                                const txt =
                                  days === 1 ? '1 day' : days === 7 ? '1 week' : days === 14 ? '2 weeks' : days === 30 ? '1 month' : `${days} days`;
                                handleMedicineChange(index, 'duration', txt);
                              }}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${
                                formErrors.medicines?.[index]?.durationDays ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                              }`}
                              placeholder="Days *"
                            />
                          </div>
                          {/* Timing */}
                          <div>
                            <input
                              type="text"
                              value={med.timing}
                              onChange={(e) => handleMedicineChange(index, 'timing', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                              placeholder="Timing"
                            />
                          </div>
                          {/* Instructions */}
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={med.instructions}
                              onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                              placeholder="Special instructions"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-2 pb-4 sm:pb-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 px-3 py-2.5 sm:py-2 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 px-3 py-2.5 sm:py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : editingPrescription
                      ? 'Update'
                      : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && prescriptionToDelete && (
        <div className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-5 max-w-sm w-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <FaTrash className="w-3.5 h-3.5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Delete Prescription</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Delete &ldquo;{prescriptionToDelete.diagnosis || 'General Prescription'}&rdquo;?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {prescriptionToDelete.medicines.length} medicine(s) • {formatDate(prescriptionToDelete.createdAt)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setPrescriptionToDelete(null); }}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
