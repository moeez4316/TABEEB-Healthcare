'use client';

import { useState, useEffect } from 'react';
import { X, Save, User, Stethoscope, MapPin, Settings, AlertCircle, Trash2, DollarSign } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfile, saveDoctorProfile, DoctorProfile, resetProfile } from '@/store/slices/doctorSlice';
import ProfileImageUpload from '../shared/ProfileImageUpload';
import { formatPhoneNumber, pakistaniProvinces } from '@/lib/profile-utils';
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
                            <li>Patients will no longer be able to book appointments with you</li>
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

// Pakistani medical specializations
const medicalSpecializations = [
    'General Medicine', 'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
    'Hematology', 'Nephrology', 'Neurology', 'Oncology', 'Pulmonology',
    'Rheumatology', 'General Surgery', 'Cardiac Surgery', 'Neurosurgery', 'Orthopedic Surgery',
    'Plastic Surgery', 'Urology', 'Anesthesiology', 'Emergency Medicine', 'Family Medicine',
    'Internal Medicine', 'Pediatrics', 'Psychiatry', 'Radiology', 'Pathology',
    'Obstetrics & Gynecology', 'Ophthalmology', 'ENT', 'Dentistry'
];

const medicalQualifications = [
    'MBBS', 'MD', 'MS', 'FCPS', 'FRCS', 'MRCP', 'MCPS', 'FACS', 'FICS',
    'Diploma', 'Certificate', 'Fellowship', 'PhD', 'MPhil', 'Other'
];

interface DoctorProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: string; // Optional prop to set initial tab
}

export default function DoctorProfileEditModal({ isOpen, onClose, initialTab }: DoctorProfileEditModalProps) {
    const dispatch = useAppDispatch();
    const { profile } = useAppSelector((state) => state.doctor || { profile: null });
    const hasUnsavedChanges = useAppSelector((state) => {
        const doctorState = state.doctor;
        if (!doctorState) return false;
        return JSON.stringify(doctorState.profile) !== JSON.stringify(doctorState.originalProfile);
    });

    // Get token from auth context
    const { token } = useAuth();

    const handleUpdateProfile = (updates: Partial<DoctorProfile>) => {
        dispatch(updateProfile(updates));
    };

    const [activeTab, setActiveTab] = useState('personal');
    const [saving, setSaving] = useState(false);
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

    // Update activeTab ONLY when modal opens AND initialTab is explicitly provided
    // Set initial tab when opening (explicit initialTab overrides saved state)
    useEffect(() => {
        if (isOpen) {
            if (initialTab) {
                setActiveTab(initialTab);
            } else {
                const saved = typeof window !== 'undefined' ? sessionStorage.getItem('doctorProfileLastTab') : null;
                if (saved) setActiveTab(saved);
            }
        }
    }, [isOpen, initialTab]);

    // Persist active tab while modal open
    useEffect(() => {
        if (isOpen && activeTab) {
            try {
                sessionStorage.setItem('doctorProfileLastTab', activeTab);
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
                    const uploadRes = await fetch(`${API_URL}/api/doctor/profile-image`, {
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
            
            const result = await dispatch(saveDoctorProfile({ profileData: profileToSave, token }));
            
            if (saveDoctorProfile.rejected.match(result)) {
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
                ...(profile.address || { street: '', city: '', province: '', postalCode: '' }),
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
                                <Stethoscope className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-medium">Medical Info</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('billing')}
                                className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap flex-shrink-0 ${
                                    activeTab === 'billing'
                                        ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                                }`}
                            >
                                <DollarSign className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-medium">Billing & Fees</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('address')}
                                className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap flex-shrink-0 ${
                                    activeTab === 'address'
                                        ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                                }`}
                            >
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-medium">Address</span>
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
                        {/* Personal Information Tab */}
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.firstName}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.lastName}
                                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profile.email || ''}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Phone
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.phone || ''}
                                            onChange={(e) => handleInputChange('phone', formatPhoneNumber(e.target.value))}
                                            placeholder="+92 300 1234567"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            CNIC (Verified)
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.cnic || ''}
                                            readOnly
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            value={profile.dateOfBirth || ''}
                                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Gender
                                        </label>
                                        <select
                                            value={profile.gender || ''}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Medical Information Tab */}
                        {activeTab === 'medical' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Medical Credentials</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Specialization
                                        </label>
                                        <select
                                            value={profile.specialization || ''}
                                            onChange={(e) => handleInputChange('specialization', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Select Specialization</option>
                                            {medicalSpecializations.map((spec) => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Qualification
                                        </label>
                                        <select
                                            value={profile.qualification || ''}
                                            onChange={(e) => handleInputChange('qualification', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Select Qualification</option>
                                            {medicalQualifications.map((qual) => (
                                                <option key={qual} value={qual}>{qual}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            PMDC Registration Number (Verified)
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.pmdcNumber || ''}
                                            readOnly
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Years of Experience
                                        </label>
                                        <input
                                            type="number"
                                            value={profile.experience || ''}
                                            onChange={(e) => handleInputChange('experience', e.target.value)}
                                            min="0"
                                            max="50"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Billing & Fees Tab */}
                        {activeTab === 'billing' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Consultation Fees</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Set your hourly consultation rate. Appointment fees will be automatically calculated based on appointment duration.
                                    </p>
                                </div>

                                <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-teal-900 dark:text-teal-100 mb-2">
                                                Hourly Consultation Rate (PKR)
                                            </h4>
                                            <input
                                                type="number"
                                                value={profile.hourlyConsultationRate ?? ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '') {
                                                        handleInputChange('hourlyConsultationRate', null);
                                                    } else {
                                                        const numValue = parseFloat(value);
                                                        // Realistic maximum for Pakistani doctors: PKR 50,000/hour
                                                        if (numValue > 50000) {
                                                            return; // Don't update if exceeds realistic max
                                                        }
                                                        handleInputChange('hourlyConsultationRate', numValue);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    // Prevent minus sign, plus sign, and 'e' (scientific notation)
                                                    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                min="0"
                                                max="50000"
                                                step="100"
                                                placeholder="e.g., 3000"
                                                className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-lg font-semibold"
                                            />
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                Enter your rate per hour in Pakistani Rupees (PKR). Maximum: PKR 50,000
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Fee Calculation Preview */}
                                {profile.hourlyConsultationRate && profile.hourlyConsultationRate > 0 && (
                                    <div className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                            📊 Appointment Fee Calculator
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                            Fees will be automatically calculated based on appointment duration:
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-600">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">15 minutes</span>
                                                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                                                    PKR {(profile.hourlyConsultationRate * 0.25).toLocaleString('en-PK')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-600">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">30 minutes</span>
                                                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                                                    PKR {(profile.hourlyConsultationRate * 0.5).toLocaleString('en-PK')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-600">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">45 minutes</span>
                                                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                                                    PKR {(profile.hourlyConsultationRate * 0.75).toLocaleString('en-PK')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">60 minutes (1 hour)</span>
                                                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                                                    PKR {profile.hourlyConsultationRate.toLocaleString('en-PK')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Follow-up Percentage */}
                                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                                                Follow-up Discount (%)
                                            </h4>
                                            <input
                                                type="number"
                                                value={profile.followUpPercentage ?? 50}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '') {
                                                        handleInputChange('followUpPercentage', 50);
                                                    } else {
                                                        const numValue = parseInt(value);
                                                        if (numValue < 0 || numValue > 100) return;
                                                        handleInputChange('followUpPercentage', numValue);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                min="0"
                                                max="100"
                                                step="5"
                                                placeholder="e.g., 50"
                                                className="w-full md:w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-lg font-semibold"
                                            />
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                Percentage of consultation fee for follow-up appointments (0-100%). Default: 50%
                                            </p>
                                            {profile.hourlyConsultationRate && profile.hourlyConsultationRate > 0 && (
                                                <p className="text-sm text-purple-700 dark:text-purple-300 mt-2 font-medium">
                                                    Follow-up fee (30 min): PKR {((profile.hourlyConsultationRate * 0.5) * ((profile.followUpPercentage ?? 50) / 100)).toLocaleString('en-PK')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Help Text */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                Important Information
                                            </h4>
                                            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                                                <li>Your rate is visible to patients when they book appointments</li>
                                                <li>Fees are automatically calculated based on appointment slot duration</li>
                                                <li>You can update your rate anytime from this settings page</li>
                                                <li>Leave blank if you don&apos;t want to display consultation fees</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Address Tab */}
                        {activeTab === 'address' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Address Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Street Address
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.address?.street || ''}
                                            onChange={(e) => handleAddressChange('street', e.target.value)}
                                            placeholder="123 Main Street"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.address?.city || ''}
                                            onChange={(e) => handleAddressChange('city', e.target.value)}
                                            placeholder="Lahore"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Province
                                        </label>
                                        <select
                                            value={profile.address?.province || ''}
                                            onChange={(e) => handleAddressChange('province', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Select Province</option>
                                            {pakistaniProvinces.map((province) => (
                                                <option key={province} value={province}>{province}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.address?.postalCode || ''}
                                            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                                            placeholder="54000"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preferences</h3>

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
                                                checked={profile.privacy?.shareDataForResearch || false}
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
                                                checked={profile.privacy?.allowMarketing || false}
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
                            <DeleteAccountSection userType="doctor" token={token || ''} />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 gap-3 sm:gap-0"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
                >
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {hasUnsavedChanges && 'You have unsaved changes'}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors text-center"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || imageUploadStatus === 'uploading' || imageUploadStatus === 'processing'}
                            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                            <Save className="h-4 w-4" />
                            <span>{saving || imageUploadStatus === 'uploading' ? 'Saving...' : 'Save Changes'}</span>
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