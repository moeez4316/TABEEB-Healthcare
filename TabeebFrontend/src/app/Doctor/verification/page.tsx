'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { verificationAPI } from '@/lib/verification/api';
import { validateVerificationForm, formatFileSize } from '@/lib/verification/utils';
import { VerificationFormData, FileUploadError } from '@/lib/verification/types';
import { Toast } from '@/components/Toast';

export default function DoctorVerificationPage() {
  const { user, verificationStatus, loading: authLoading, token, refreshVerificationStatus, verificationLoading, role } = useAuth();
  
  const [formData, setFormData] = useState<VerificationFormData>({
    pmdcNumber: '',
    cnic: null,
    certificate: null,
  });
  
  const [errors, setErrors] = useState<FileUploadError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{show: boolean; message: string; type: 'success' | 'error' | 'info'}>({
    show: false,
    message: '',
    type: 'info'
  });
  const [dragStates, setDragStates] = useState({
    cnic: false,
    certificate: false,
  });

  // Show loading state while determining auth status, role, or verification status
  if (authLoading || !user || !role || (role === 'doctor' && (verificationLoading || verificationStatus === null))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading verification status...</p>
        </div>
      </div>
    );
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'info' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear errors for this field
    setErrors(prev => prev.filter(error => error.field !== name));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'cnic' | 'certificate') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: file,
      }));
      
      // Clear errors for this field
      setErrors(prev => prev.filter(error => error.field !== fieldName));
    }
  };

  const handleDragEnter = (e: React.DragEvent, fieldName: 'cnic' | 'certificate') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, fieldName: 'cnic' | 'certificate') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [fieldName]: false }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, fieldName: 'cnic' | 'certificate') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [fieldName]: false }));
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: file,
      }));
      
      // Clear errors for this field
      setErrors(prev => prev.filter(error => error.field !== fieldName));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateVerificationForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast('Please fix the errors below: ' + validation.errors.map(e => `${e.field}: ${e.message}`).join(', '), 'error');
      return;
    }

    // Ensure required files are present
    if (!formData.cnic) {
      showToast('CNIC document is required', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare submission data with required files
      const submissionData = {
        pmdcNumber: formData.pmdcNumber,
        cnic: formData.cnic,
        ...(formData.certificate && { certificate: formData.certificate }),
      };

      await verificationAPI.submitVerification(submissionData, token);
      
      showToast('Verification documents submitted successfully!', 'success');
      
      // Refresh verification status and then redirect
      await refreshVerificationStatus();
      
      // Use window.location to force a fresh load
      window.location.href = '/Doctor/verification/pending';
    } catch (error: unknown) {
      console.error('Verification submission error:', error);
      
      // Handle specific error cases
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage.includes('already submitted')) {
        showToast('Verification already submitted. Redirecting...', 'info');
        setTimeout(() => {
          window.location.href = '/Doctor/verification/pending';
        }, 2000);
      } else {
        showToast(errorMessage || 'Failed to submit verification documents', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  const renderFileUpload = (
    fieldName: 'cnic' | 'certificate',
    label: string,
    required: boolean = true,
    description?: string
  ) => {
    const file = formData[fieldName];
    const error = getFieldError(fieldName);
    const isDragging = dragStates[fieldName];

    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        )}
        
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            isDragging
              ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20'
              : error
              ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
              : file
              ? 'border-teal-300 bg-teal-50 dark:bg-teal-900/20'
              : 'border-slate-300 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500 bg-white dark:bg-slate-800'
          }`}
          onDragEnter={(e) => handleDragEnter(e, fieldName)}
          onDragLeave={(e) => handleDragLeave(e, fieldName)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, fieldName)}
        >
          {file ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-8 h-8 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-teal-600 dark:text-teal-400 font-medium">File selected</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{file.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</p>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, [fieldName]: null }))}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <svg className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <label htmlFor={fieldName} className="cursor-pointer">
                  <span className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors">Click to upload</span>
                  <span className="text-slate-600 dark:text-slate-400"> or drag and drop</span>
                </label>
                <input
                  id={fieldName}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, fieldName)}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PDF, PNG, JPG up to 10MB
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 font-medium">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                <svg className="w-8 h-8 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                  TABEEB
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Doctor Verification</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Header Section */}
          <div className="px-8 py-10 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Doctor Verification</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
                  {verificationStatus === 'rejected' 
                    ? 'Your previous application was rejected. Please review the feedback and submit updated documents.'
                    : 'Submit your documents for verification to start practicing on our platform.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Resubmission Notice for Rejected Applications */}
          {verificationStatus === 'rejected' && (
            <div className="px-8 py-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-orange-200 dark:border-orange-800">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.184 0 2.046-1.184 1.563-2.23L13.563 4.77c-.482-1.044-1.785-1.044-2.267 0L4.358 15.77C3.875 16.816 4.737 18 5.921 18z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Application Resubmission</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Submitting new documents will replace your previous application. Please ensure all documents meet the requirements.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-8 py-10 space-y-8">
            {/* PMDC Number */}
            <div className="space-y-3">
              <label htmlFor="pmdcNumber" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                PMDC License Number <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your Pakistan Medical Commission license number (format: 6 digits-P, e.g., 100327-P)
              </p>
              <input
                type="text"
                id="pmdcNumber"
                name="pmdcNumber"
                value={formData.pmdcNumber}
                onChange={handleInputChange}
                className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all duration-200 ${
                  getFieldError('pmdcNumber') ? 'border-red-300 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="100327-P"
              />
              {getFieldError('pmdcNumber') && (
                <p className="text-sm text-red-500 dark:text-red-400 font-medium">{getFieldError('pmdcNumber')}</p>
              )}
            </div>

            {/* CNIC Upload */}
            {renderFileUpload(
              'cnic',
              'CNIC Document',
              true,
              'Upload a clear photo or scan of your National Identity Card'
            )}

            {/* Certificate Upload */}
            {renderFileUpload(
              'certificate',
              'Medical Degree Certificate',
              false,
              'Upload your medical degree certificate (optional but recommended)'
            )}

            {/* Submit Button */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {verificationStatus === 'rejected' ? 'Resubmit Application' : 'Submit for Verification'}
                  </div>
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center space-y-2">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">Important Information</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  By submitting, you agree that all information provided is accurate and authentic.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Verification typically takes 24-48 hours to complete.
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
