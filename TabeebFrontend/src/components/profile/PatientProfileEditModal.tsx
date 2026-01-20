'use client';

import { useState, useEffect } from 'react';
import { X, Save, User, Heart, Settings, Phone, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfile, savePatientProfile, PatientProfile } from '@/store/slices/patientSlice';
import { resetProfile } from '@/store/slices/patientSlice';
import ProfileImageUpload from '../shared/ProfileImageUpload';
import HeightInput from '../shared/HeightInput';
import { formatCNIC, formatPhoneNumber, pakistaniProvinces, bloodGroups, pakistaniLanguages } from '@/lib/profile-utils';
import { ValidationErrors, getFieldError } from '@/lib/profile-validation';
import { Toast } from '../Toast';
import { useRouter } from 'next/navigation';
import { uploadFile } from '@/lib/cloudinary-upload';
import { LinearProgress } from '../shared/UploadProgress';

// Delete Account Section Component
interface DeleteAccountSectionProps {
    userType: 'doctor' | 'patient';
    token: string;
}

function DeleteAccountSection({ userType, token }: DeleteAccountSectionProps) {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { signOut } = useAuth();

    const handleDeleteAccount = async () => {
        if (confirmText !== 'DELETE') {
            setError('Please type DELETE to confirm');
            return;
        }

        setDeleting(true);
        setError('');

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${API_URL}/api/${userType}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || 'Failed to delete account');
            }

            // Sign out from Firebase and redirect
            await signOut();
            router.push('/auth/login?deleted=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete account');
            setDeleting(false);
        }
    };

    const accountTypeMessage = userType === 'doctor' 
        ? 'Patients will no longer be able to book appointments with you' 
        : 'You will no longer be able to book appointments';

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Delete Account</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                            Warning: This action cannot be undone
                        </h4>
                        <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                            <li>Your profile will be permanently deactivated</li>
                            <li>All your appointments history will be preserved but inaccessible</li>
                            <li>{accountTypeMessage}</li>
                            <li>You will be logged out immediately</li>
                        </ul>
                    </div>
                </div>
            </div>

            {!showConfirmation ? (
                <button
                    onClick={() => setShowConfirmation(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete My Account</span>
                </button>
            ) : (
                <div className="space-y-4 border border-red-300 dark:border-red-700 rounded-lg p-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => {
                                setConfirmText(e.target.value);
                                setError('');
                            }}
                            placeholder="Type DELETE here"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleDeleteAccount}
                            disabled={deleting || confirmText !== 'DELETE'}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>{deleting ? 'Deleting...' : 'Yes, Delete My Account'}</span>
                        </button>
                        <button
                            onClick={() => {
                                setShowConfirmation(false);
                                setConfirmText('');
                                setError('');
                            }}
                            disabled={deleting}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface PatientProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string; // optional starting tab
}

export default function PatientProfileEditModal({ isOpen, onClose, initialTab }: PatientProfileEditModalProps) {
  const dispatch = useAppDispatch();
  const { profile, isLoading } = useAppSelector((state) => state.patient || { profile: null, isLoading: false });
  const hasUnsavedChanges = useAppSelector((state) => {
    const patientState = state.patient;
    if (!patientState) return false;
    return JSON.stringify(patientState.profile) !== JSON.stringify(patientState.originalProfile);
  });
  
  // Get token from auth context
  const { token } = useAuth();

  const handleUpdateProfile = (updates: Partial<PatientProfile>) => {
    dispatch(updateProfile(updates));
  };

  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  
  // Image upload progress state
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageUploadStatus, setImageUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');

  // Reset upload progress when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setImageUploadProgress(0);
      setImageUploadStatus('idle');
    }
  }, [isOpen]);

  // Set initial tab when opening
  // Set initial tab when opening (explicit initialTab overrides saved state)
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else {
        const saved = typeof window !== 'undefined' ? sessionStorage.getItem('patientProfileLastTab') : null;
        if (saved) setActiveTab(saved);
      }
    }
  }, [isOpen, initialTab]);

  // Persist active tab while open
  useEffect(() => {
    if (isOpen && activeTab) {
      try {
        sessionStorage.setItem('patientProfileLastTab', activeTab);
      } catch {}
    }
  }, [isOpen, activeTab]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !profile) return null;

  const handleSave = async () => {
    if (!token) return;
    
    console.log('Save button clicked');
    setSaving(true);
    setErrors({});
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      let updatedImageUrl: string | undefined;
      
      // Step 1: Upload profile image FIRST if it's a base64 image
      if (profile.profileImage && profile.profileImage.startsWith('data:image')) {
        const blob = await fetch(profile.profileImage).then(r => r.blob());
        
        // Validate file size (2MB limit for profile images)
        if (blob.size > 2 * 1024 * 1024) {
          setToastMessage('Profile image must be less than 2MB');
          setToastType('error');
          setShowToast(true);
          setSaving(false);
          return;
        }
        
        const file = new File([blob], 'profile-image.jpg', { type: blob.type });
        
        try {
          // Start progress tracking
          setImageUploadStatus('uploading');
          setImageUploadProgress(0);
          
          // Step 1a: Upload to Cloudinary using client-side upload
          const cloudinaryResult = await uploadFile(file, 'profile-image', token, {
            onProgress: (p) => setImageUploadProgress(p.percentage)
          });
          
          // Step 1b: Update backend with the publicId
          setImageUploadStatus('processing');
          const uploadRes = await fetch(`${API_URL}/api/patient/profile-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              publicId: cloudinaryResult.publicId,
              url: cloudinaryResult.secureUrl,
            }),
          });
          
          if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            console.error('Profile image save error:', errorData);
            setImageUploadStatus('error');
            setToastMessage(errorData.error || 'Failed to save profile image');
            setToastType('error');
            setShowToast(true);
            setSaving(false);
            return;
          }
          
          // Get the Cloudinary URL from response
          const uploadResult = await uploadRes.json();
          updatedImageUrl = uploadResult.imageUrl;
          setImageUploadStatus('success');
          console.log('Image uploaded, new URL:', updatedImageUrl);
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          setImageUploadStatus('error');
          setToastMessage(uploadError instanceof Error ? uploadError.message : 'Failed to upload profile image');
          setToastType('error');
          setShowToast(true);
          setSaving(false);
          return;
        }
      }
      
      // Step 2: Save the profile with the Cloudinary URL (not base64)
      const profileToSave = { ...profile };
      
      // Replace base64 with Cloudinary URL if we just uploaded
      if (updatedImageUrl) {
        profileToSave.profileImage = updatedImageUrl;
      } else if (profileToSave.profileImage && profileToSave.profileImage.startsWith('data:image')) {
        // If somehow we still have base64, remove it
        delete profileToSave.profileImage;
      }
      
      const result = await dispatch(savePatientProfile({ profileData: profileToSave, token }));
      
      if (savePatientProfile.rejected.match(result)) {
        const errorMessage = result.payload as string;
        setToastMessage(errorMessage || 'Failed to save profile');
        setToastType('error');
        setShowToast(true);
        return;
      }
      
      setToastMessage('Profile saved successfully!');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      setToastMessage('Failed to save profile. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset to original profile if there are unsaved changes
    if (hasUnsavedChanges) {
      dispatch(resetProfile());
    }
    setShowToast(false);
    onClose();
  };

  const handleInputChange = (field: string, value: unknown) => {
    handleUpdateProfile({ [field]: value });
  };

  const handleAddressChange = (field: string, value: string) => {
    handleUpdateProfile({
      address: {
        ...profile.address,
        [field]: value
      }
    });
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    handleUpdateProfile({
      emergencyContact: {
        ...profile.emergencyContact,
        [field]: value
      }
    });
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    handleUpdateProfile({
      notifications: {
        ...profile.notifications,
        [field]: value
      }
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      style={{
        height: '100dvh', // Dynamic viewport height for mobile
        overflow: 'hidden',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.5rem)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0.5rem)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onTouchMove={(e) => {
        // Prevent scrolling on the overlay background
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full overflow-hidden flex flex-col"
        style={{
          maxWidth: '56rem', // max-w-4xl
          maxHeight: '100%',
          margin: '0.5rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Edit Profile</h2>
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Unsaved changes</span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            aria-label="Close edit profile"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 -m-2 rounded-md"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Sidebar */}
          <div className="md:w-64 bg-gray-50 dark:bg-slate-700 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-600 flex-shrink-0">
            <nav className="flex md:flex-col md:space-y-2 space-x-2 md:space-x-0 overflow-x-auto md:overflow-x-visible">
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'personal'
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Personal Info</span>
              </button>
              
              <button
                onClick={() => setActiveTab('medical')}
                className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'medical'
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <Heart className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Medical Info</span>
              </button>

              <button
                onClick={() => setActiveTab('contact')}
                className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'contact'
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Contact</span>
              </button>

              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'preferences'
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Preferences</span>
              </button>

              <button
                onClick={() => setActiveTab('danger')}
                className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'danger'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Delete Account</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personal Information</h3>
                
                {/* Profile Image */}
                <div className="flex justify-center">
                  <ProfileImageUpload
                    currentImage={profile.profileImage}
                    onImageChange={(imageUrl) => handleInputChange('profileImage', imageUrl)}
                    size="lg"
                  />
                </div>
                
                {/* Image Upload Progress - Compact bar below profile image */}
                {imageUploadStatus !== 'idle' && (
                  <div className="max-w-xs mx-auto">
                    <LinearProgress
                      progress={imageUploadProgress}
                      status={imageUploadStatus}
                      fileName="Profile image"
                      size="sm"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${
                        getFieldError(errors, 'firstName') 
                          ? 'border-red-500 dark:border-red-400' 
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder="Enter first name"
                    />
                    {getFieldError(errors, 'firstName') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'firstName')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${
                        getFieldError(errors, 'lastName') 
                          ? 'border-red-500 dark:border-red-400' 
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder="Enter last name"
                    />
                    {getFieldError(errors, 'lastName') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'lastName')}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white ${
                      getFieldError(errors, 'email') 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter email address"
                  />
                  {getFieldError(errors, 'email') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'email')}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CNIC
                    </label>
                    <input
                      type="text"
                      value={profile.cnic || ''}
                      onChange={(e) => handleInputChange('cnic', formatCNIC(e.target.value))}
                      placeholder="42401-1234567-8"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender *
                  </label>
                  <select
                    value={profile.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'medical' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Medical Information</h3>
                
                {/* Height - Full Width Row */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Height
                    </label>
                    <HeightInput
                      value={profile.height}
                      onChange={(heightInCm) => handleInputChange('height', heightInCm)}
                      placeholder="Enter your height"
                      error={getFieldError(errors, 'height') || undefined}
                    />
                  </div>
                </div>

                {/* Weight and Blood Group - Two Column Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={profile.weight || ''}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="70"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Blood Group
                    </label>
                    <select
                      value={profile.bloodType || ''}
                      onChange={(e) => handleInputChange('bloodType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">Select blood type</option>
                      {bloodGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Known Allergies
                  </label>
                  <textarea
                    value={Array.isArray(profile.allergies) ? profile.allergies.join(', ') : ''}
                    onChange={(e) => handleInputChange('allergies', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    placeholder="List any allergies separated by commas..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Medications
                  </label>
                  <textarea
                    value={Array.isArray(profile.medications) ? profile.medications.join(', ') : ''}
                    onChange={(e) => handleInputChange('medications', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    placeholder="List current medications separated by commas..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medical Conditions
                  </label>
                  <textarea
                    value={Array.isArray(profile.medicalConditions) ? profile.medicalConditions.join(', ') : ''}
                    onChange={(e) => handleInputChange('medicalConditions', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    placeholder="List any medical conditions separated by commas..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={profile.emergencyContact.name || ''}
                        onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                        placeholder="Emergency contact name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={profile.emergencyContact.relationship || ''}
                        onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                        placeholder="e.g., Father, Spouse"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profile.emergencyContact.phone || ''}
                        onChange={(e) => handleEmergencyContactChange('phone', formatPhoneNumber(e.target.value))}
                        placeholder="+92-300-1234567"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => handleInputChange('phone', formatPhoneNumber(e.target.value))}
                    placeholder="+92-300-1234567"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Street Address
                  </label>
                  <textarea
                    value={profile.address.street || ''}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    placeholder="House/Flat number, Street name"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={profile.address.city || ''}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="Islamabad"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Province
                    </label>
                    <select
                      value={profile.address.province || ''}
                      onChange={(e) => handleAddressChange('province', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">Select province</option>
                      {pakistaniProvinces.map(province => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={profile.address.postalCode || ''}
                      onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                      placeholder="44000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preferences</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Language
                  </label>
                  <select
                    value={profile.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  >
                    {pakistaniLanguages.map(language => (
                      <option key={language} value={language}>{language}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Notifications</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={profile.notifications.email}
                        onChange={(e) => handleNotificationChange('email', e.target.checked)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={profile.notifications.sms}
                        onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">SMS notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={profile.notifications.push}
                        onChange={(e) => handleNotificationChange('push', e.target.checked)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Push notifications</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Privacy</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={profile.privacy.shareDataForResearch}
                        onChange={(e) => handleUpdateProfile({
                          privacy: {
                            ...profile.privacy,
                            shareDataForResearch: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Share data for medical research</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={profile.privacy.allowMarketing}
                        onChange={(e) => handleUpdateProfile({
                          privacy: {
                            ...profile.privacy,
                            allowMarketing: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Receive marketing communications</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Account Tab */}
            {activeTab === 'danger' && (
              <DeleteAccountSection userType="patient" token={token || ''} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700 flex-shrink-0 gap-3 sm:gap-0"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        >
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {hasUnsavedChanges && 'You have unsaved changes'}
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 ml-auto w-full sm:w-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Save button click event triggered');
                handleSave();
              }}
              disabled={saving || isLoading || imageUploadStatus === 'uploading' || imageUploadStatus === 'processing'}
              className="flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving || isLoading || imageUploadStatus === 'uploading' ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}