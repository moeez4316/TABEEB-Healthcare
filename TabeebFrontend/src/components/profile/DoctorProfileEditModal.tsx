'use client';

import { useState } from 'react';
import { X, Save, User, Stethoscope, MapPin, Settings, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfile, saveDoctorProfile, uploadDoctorProfileImage, DoctorProfile, selectHasUnsavedChanges } from '@/store/slices/doctorSlice';
import ProfileImageUpload from '../shared/ProfileImageUpload';
import { formatPhoneNumber, pakistaniProvinces } from '@/lib/profile-utils';

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
}

export default function DoctorProfileEditModal({ isOpen, onClose }: DoctorProfileEditModalProps) {
    const dispatch = useAppDispatch();
    const { profile } = useAppSelector((state) => state.doctor);
    const hasUnsavedChanges = useAppSelector(selectHasUnsavedChanges);

    // Get token from auth context
    const { token } = useAuth();

    const handleUpdateProfile = (updates: Partial<DoctorProfile>) => {
        dispatch(updateProfile(updates));
    };

    const handleSaveProfile = async () => {
        if (profile && token) {
            // If there's a new profile image (base64), upload it first
            if (profile.profileImage && profile.profileImage.startsWith('data:')) {
                try {
                    // Convert base64 to File object
                    const response = await fetch(profile.profileImage);
                    const blob = await response.blob();
                    const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' });
                    
                    // Upload the image
                    const uploadResult = await dispatch(uploadDoctorProfileImage({ file, token }));
                    if (uploadResult.type.endsWith('/fulfilled')) {
                        // Image upload successful, the profileImage URL is now updated in the store
                    }
                } catch (error) {
                    console.error('Error uploading profile image:', error);
                }
            }
            
            // Save the profile
            await dispatch(saveDoctorProfile({ profileData: profile, token }));
        }
    };

    const [activeTab, setActiveTab] = useState('personal');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        console.log('Save button clicked');
        setSaving(true);
        
        try {
            await handleSaveProfile();
            onClose();
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setSaving(false);
        }
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full my-4 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-hidden flex flex-col">
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
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                                            value={profile.email}
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
                                            value={profile.phone}
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
                                            value={profile.cnic}
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
                                            value={profile.dateOfBirth}
                                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Gender
                                        </label>
                                        <select
                                            value={profile.gender}
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
                                            value={profile.specialization}
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
                                            value={profile.qualification}
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
                                            value={profile.pmdcNumber}
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
                                            value={profile.experience}
                                            onChange={(e) => handleInputChange('experience', e.target.value)}
                                            min="0"
                                            max="50"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
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
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 gap-3 sm:gap-0">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {hasUnsavedChanges && 'You have unsaved changes'}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors text-center"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                            <Save className="h-4 w-4" />
                            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}