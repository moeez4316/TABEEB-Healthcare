'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { verificationAPI } from '@/lib/verification/api';
import { validateVerificationForm, formatFileSize } from '@/lib/verification/utils';
import { VerificationFormData, FileUploadError } from '@/lib/verification/types';
import { formatCNIC } from '@/lib/profile-utils';
import { Toast } from '@/components/Toast';
import { User, Calendar, FileText, Camera, Upload, AlertCircle, CheckCircle, Info, X, Video } from 'lucide-react';

type FileFieldName = 'cnicFront' | 'cnicBack' | 'verificationPhoto' | 'degreeCertificate' | 'pmdcCertificate';

export default function DoctorVerificationPage() {
  const { user, verificationStatus, loading: authLoading, token, refreshVerificationStatus, verificationLoading, role } = useAuth();
  
  const [formData, setFormData] = useState<VerificationFormData>({
    pmdcNumber: '',
    pmdcRegistrationDate: '',
    cnicNumber: '',
    cnicFront: null,
    cnicBack: null,
    verificationPhoto: null,
    degreeCertificate: null,
    pmdcCertificate: null,
    graduationYear: '',
    degreeInstitution: '',
  });
  
  const [errors, setErrors] = useState<FileUploadError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{show: boolean; message: string; type: 'success' | 'error' | 'info'}>({
    show: false,
    message: '',
    type: 'info'
  });
  const [dragStates, setDragStates] = useState<Record<FileFieldName, boolean>>({
    cnicFront: false,
    cnicBack: false,
    verificationPhoto: false,
    degreeCertificate: false,
    pmdcCertificate: false,
  });
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
    let processedValue = value;
    
    // Format CNIC number as user types
    if (name === 'cnicNumber') {
      processedValue = formatCNIC(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
    
    // Clear errors for this field
    setErrors(prev => prev.filter(error => error.field !== name));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: FileFieldName) => {
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

  const handleDragEnter = (e: React.DragEvent, fieldName: FileFieldName) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, fieldName: FileFieldName) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [fieldName]: false }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, fieldName: FileFieldName) => {
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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      showToast('Unable to access camera. Please check permissions.', 'error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'verification-photo.jpg', { type: 'image/jpeg' });
            setFormData(prev => ({
              ...prev,
              verificationPhoto: file,
            }));
            setErrors(prev => prev.filter(error => error.field !== 'verificationPhoto'));
            stopCamera();
            showToast('Photo captured successfully!', 'success');
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateVerificationForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast('Please fix the errors below', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await verificationAPI.submitVerification(formData, token);
      
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
    fieldName: FileFieldName,
    label: string,
    description: string,
    icon: React.ReactNode,
    acceptedTypes: string = ".jpg,.jpeg,.png,.pdf"
  ) => {
    const file = formData[fieldName];
    const error = getFieldError(fieldName);
    const isDragging = dragStates[fieldName];

    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label} <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-slate-600 dark:text-slate-400 min-h-[40px]">{description}</p>
        
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 min-h-[200px] flex flex-col justify-center ${
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
                <CheckCircle className="w-6 h-6 text-teal-600 dark:text-teal-400" />
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
              <div className="flex justify-center">
                {icon}
              </div>
              <div className="text-center">
                <label htmlFor={fieldName} className="cursor-pointer">
                  <span className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors">Click to upload</span>
                  <span className="text-slate-600 dark:text-slate-400"> or drag and drop</span>
                </label>
                <input
                  id={fieldName}
                  type="file"
                  className="hidden"
                  accept={acceptedTypes}
                  onChange={(e) => handleFileChange(e, fieldName)}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {fieldName.includes('Photo') ? 'JPG, PNG up to 5MB' : 'PDF, JPG, PNG up to 10MB'}
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

          {/* Important Notice */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Verification Requirements</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>All documents must be clear and legible</li>
                  <li>CNIC images must show all four corners clearly</li>
                  <li>Verification photo must match your CNIC photo</li>
                  <li>Certificates must be from recognized Pakistani institutions</li>
                  <li>PMDC registration must be active and valid</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-10 space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cnicNumber" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    CNIC Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      id="cnicNumber"
                      name="cnicNumber"
                      value={formData.cnicNumber}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all duration-200 ${
                        getFieldError('cnicNumber') ? 'border-red-300 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="42401-1234567-8"
                    />
                  </div>
                  {getFieldError('cnicNumber') && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{getFieldError('cnicNumber')}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="graduationYear" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="number"
                      id="graduationYear"
                      name="graduationYear"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all duration-200 ${
                        getFieldError('graduationYear') ? 'border-red-300 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="2020"
                    />
                  </div>
                  {getFieldError('graduationYear') && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{getFieldError('graduationYear')}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="degreeInstitution" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Degree Institution <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="degreeInstitution"
                    name="degreeInstitution"
                    value={formData.degreeInstitution}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all duration-200 ${
                      getFieldError('degreeInstitution') ? 'border-red-300 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder="King Edward Medical University"
                  />
                </div>
                {getFieldError('degreeInstitution') && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{getFieldError('degreeInstitution')}</p>
                )}
              </div>
            </div>

            {/* PMDC Information Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                PMDC Registration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="pmdcNumber" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    PMDC License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="pmdcNumber"
                    name="pmdcNumber"
                    value={formData.pmdcNumber}
                    onChange={handleInputChange}
                    className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all duration-200 ${
                      getFieldError('pmdcNumber') ? 'border-red-300 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder="100327-P"
                  />
                  {getFieldError('pmdcNumber') && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{getFieldError('pmdcNumber')}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="pmdcRegistrationDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    PMDC Registration Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="pmdcRegistrationDate"
                    name="pmdcRegistrationDate"
                    value={formData.pmdcRegistrationDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all duration-200 ${
                      getFieldError('pmdcRegistrationDate') ? 'border-red-300 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                  {getFieldError('pmdcRegistrationDate') && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{getFieldError('pmdcRegistrationDate')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Document Uploads Section */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                Document Uploads
              </h2>

              {/* CNIC Documents */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">CNIC Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderFileUpload(
                    'cnicFront',
                    'CNIC Front Side',
                    'Upload a clear photo of the front side of your CNIC showing all details',
                    <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500" />,
                    ".jpg,.jpeg,.png"
                  )}

                  {renderFileUpload(
                    'cnicBack',
                    'CNIC Back Side',
                    'Upload a clear photo of the back side of your CNIC showing all details',
                    <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500" />,
                    ".jpg,.jpeg,.png"
                  )}
                </div>
              </div>

              {/* Verification Photo */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <Info className="w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Verification Photo Requirements</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Please provide a front-facing photo with proper lighting and plain background for verification. 
                      This photo should match your original CNIC photo and will be used for identity verification only.
                    </p>
                    <div className="mt-3 flex items-start space-x-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <strong>Recommended:</strong> Use the live camera option for best results, and reduces the chance of rejection.
                      </p>
                    </div>
                  </div>
                </div>

                {!showCamera ? (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Verification Photo <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Front-facing photo with good lighting and plain background matching your CNIC
                    </p>
                    
                    {formData.verificationPhoto ? (
                      <div className="border-2 border-dashed border-teal-300 bg-teal-50 dark:bg-teal-900/20 rounded-xl p-8 text-center min-h-[200px] flex flex-col justify-center">
                        <div className="space-y-3">
                          <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                            <span className="text-teal-600 dark:text-teal-400 font-medium">Photo selected</span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{formData.verificationPhoto.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(formData.verificationPhoto.size)}</p>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, verificationPhoto: null }))}
                            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                          >
                            Remove photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Camera and Upload Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Live Camera Option - Recommended */}
                          <button
                            type="button"
                            onClick={startCamera}
                            className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl p-8 text-center hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-200 group min-h-[220px] flex flex-col justify-center"
                          >
                            <div className="absolute top-3 right-3 bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              RECOMMENDED
                            </div>
                            <div className="space-y-4">
                              <div className="flex justify-center">
                                <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-full group-hover:scale-110 transition-transform">
                                  <Video className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-lg mb-2">
                                  Take Live Photo
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Use your camera for instant capture with proper guidance
                                </p>
                              </div>
                            </div>
                          </button>

                          {/* Upload Option */}
                          <div 
                            className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500 bg-white dark:bg-slate-800 rounded-xl p-8 text-center transition-all duration-200 min-h-[220px] flex flex-col justify-center"
                            onDragEnter={(e) => handleDragEnter(e, 'verificationPhoto')}
                            onDragLeave={(e) => handleDragLeave(e, 'verificationPhoto')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'verificationPhoto')}
                          >
                            <div className="space-y-4">
                              <div className="flex justify-center">
                                <Camera className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                              </div>
                              <div className="text-center">
                                <label htmlFor="verificationPhoto" className="cursor-pointer">
                                  <span className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors">
                                    Upload from device
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-400"> or drag and drop</span>
                                </label>
                                <input
                                  id="verificationPhoto"
                                  type="file"
                                  className="hidden"
                                  accept=".jpg,.jpeg,.png"
                                  onChange={(e) => handleFileChange(e, 'verificationPhoto')}
                                />
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                JPG, PNG up to 5MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {getFieldError('verificationPhoto') && (
                      <p className="text-sm text-red-500 dark:text-red-400 font-medium">{getFieldError('verificationPhoto')}</p>
                    )}
                  </div>
                ) : (
                  /* Camera View */
                  <div className="space-y-4">
                    <div className="bg-black rounded-xl overflow-hidden relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto"
                      />
                      <div className="absolute top-4 left-4 right-4">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 text-sm">
                          <p className="text-slate-700 dark:text-slate-300 font-medium">
                            📸 Position your face in the center with good lighting
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                      >
                        <Camera className="w-5 h-5" />
                        <span>Capture Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <X className="w-5 h-5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Hidden canvas for photo capture */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Certificates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFileUpload(
                  'degreeCertificate',
                  'Medical Degree Certificate',
                  'Upload your medical degree certificate (MBBS, BDS, etc.)',
                  <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                )}

                {renderFileUpload(
                  'pmdcCertificate',
                  'PMDC Registration Certificate',
                  'Upload your official PMDC registration certificate',
                  <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                )}
              </div>
            </div>

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
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {verificationStatus === 'rejected' ? 'Resubmit Application' : 'Submit for Verification'}
                  </div>
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center space-y-2">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Info className="w-5 h-5 text-teal-600 dark:text-teal-400" />
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