'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { verificationAPI } from '@/lib/verification/api';
import { validateVerificationForm, formatFileSize, formatVerificationStatus } from '@/lib/verification/utils';
import { VerificationFormData, FileUploadError } from '@/lib/verification/types';
import { Toast } from '@/components/Toast';

export default function DoctorVerificationPage() {
  const { user, verificationStatus, loading: authLoading, token, refreshVerificationStatus, verificationLoading, role } = useAuth();
  const router = useRouter();
  
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

  // Redirect if user is not authenticated  
  if (!authLoading && !user) {
    router.push('/auth');
    return null;
  }

  // Redirect if user is not a doctor
  if (!authLoading && user && role && role !== 'doctor') {
    router.push('/select-role');
    return null;
  }

  // Show loading state while determining auth status, role, or verification status
  if (authLoading || !user || !role || (role === 'doctor' && (verificationLoading || verificationStatus === null))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Redirect based on verification status
  useEffect(() => {
    if (!authLoading && user && role === 'doctor' && verificationStatus) {
      if (verificationStatus === 'pending') {
        router.push('/Doctor/verification/pending');
        return;
      }
      
      if (verificationStatus === 'approved') {
        router.push('/Doctor/Dashboard');
        return;
      }
      
      // Allow access to verification form when rejected for resubmission
      // if (verificationStatus === 'rejected') {
      //   router.push('/Doctor/verification/rejected');
      //   return;
      // }
    }
  }, [authLoading, user, role, verificationStatus, router]);

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
    } catch (error: any) {
      console.error('Verification submission error:', error);
      
      // Handle specific error cases
      if (error.message.includes('already submitted')) {
        showToast('Verification already submitted. Redirecting...', 'info');
        setTimeout(() => {
          window.location.href = '/Doctor/verification/pending';
        }, 2000);
      } else {
        showToast(error.message || 'Failed to submit verification documents', 'error');
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : error
              ? 'border-red-300 bg-red-50'
              : file
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onDragEnter={(e) => handleDragEnter(e, fieldName)}
          onDragLeave={(e) => handleDragLeave(e, fieldName)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, fieldName)}
        >
          {file ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-600 font-medium">File selected</span>
              </div>
              <p className="text-sm text-gray-600">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, [fieldName]: null }))}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <label htmlFor={fieldName} className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-800 font-medium">Click to upload</span>
                  <span className="text-gray-600"> or drag and drop</span>
                </label>
                <input
                  id={fieldName}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, fieldName)}
                />
              </div>
              <p className="text-xs text-gray-500">
                PDF, PNG, JPG up to 10MB
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Doctor Verification</h1>
            <p className="mt-2 text-gray-600">
              {verificationStatus === 'rejected' 
                ? 'Your previous application was rejected. Please review the feedback and submit updated documents.'
                : 'Submit your documents for verification to start practicing on our platform.'
              }
            </p>
          </div>

          {/* Resubmission Notice for Rejected Applications */}
          {verificationStatus === 'rejected' && (
            <div className="px-6 py-4 bg-orange-50 border-b border-orange-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-orange-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.184 0 2.046-1.184 1.563-2.23L13.563 4.77c-.482-1.044-1.785-1.044-2.267 0L4.358 15.77C3.875 16.816 4.737 18 5.921 18z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-orange-800">Application Resubmission</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Submitting new documents will replace your previous application. Please ensure all documents meet the requirements.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            {/* PMDC Number */}
            <div>
              <label htmlFor="pmdcNumber" className="block text-sm font-medium text-gray-700">
                PMDC License Number <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Your Pakistan Medical Commission license number (format: 6 digits-P, e.g., 100327-P)
              </p>
              <input
                type="text"
                id="pmdcNumber"
                name="pmdcNumber"
                value={formData.pmdcNumber}
                onChange={handleInputChange}
                className={`mt-2 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('pmdcNumber') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="100327-P"
              />
              {getFieldError('pmdcNumber') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('pmdcNumber')}</p>
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
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                } transition-colors`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  verificationStatus === 'rejected' ? 'Resubmit Application' : 'Submit for Verification'
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-600">
              <p>
                By submitting, you agree that all information provided is accurate and authentic.
              </p>
              <p className="mt-1">
                Verification typically takes 24-48 hours to complete.
              </p>
            </div>
          </form>
        </div>
      </div>

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
