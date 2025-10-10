'use client';

import { useState } from 'react';
import { X, Save, User, Heart, Settings, Phone, MapPin, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfile, savePatientProfile, PatientProfile, selectHasUnsavedChanges } from '@/store/slices/patientSlice';
import ProfileImageUpload from '../shared/ProfileImageUpload';
import { formatCNIC, formatPhoneNumber, pakistaniProvinces, bloodGroups, pakistaniLanguages } from '@/lib/profile-utils';
import { validateProfile, ValidationErrors, getFieldError, hasErrors } from '@/lib/profile-validation';

interface PatientProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientProfileEditModal({ isOpen, onClose }: PatientProfileEditModalProps) {
  const dispatch = useAppDispatch();
  const { profile, isLoading } = useAppSelector((state) => state.patient);
  const hasUnsavedChanges = useAppSelector(selectHasUnsavedChanges);

  const handleUpdateProfile = (updates: Partial<PatientProfile>) => {
    dispatch(updateProfile(updates));
  };

  const handleSaveProfile = async () => {
    if (profile) {
      await dispatch(savePatientProfile(profile));
    }
  };
  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  if (!isOpen) return null;

  const handleSave = async () => {
    console.log('Save button clicked');
    setSaving(true);
    setErrors({});
    
    try {
      await handleSaveProfile();
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ general: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Profile</h2>
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Unsaved changes</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[70vh]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-slate-700 p-4 border-r border-gray-200 dark:border-slate-600">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'personal'
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Personal Info</span>
              </button>
              
              <button
                onClick={() => setActiveTab('medical')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'medical'
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">Medical Info</span>
              </button>

              <button
                onClick={() => setActiveTab('contact')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'contact'
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <Phone className="h-4 w-4" />
                <span className="text-sm font-medium">Contact</span>
              </button>

              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'preferences'
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Preferences</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
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
                    Email *
                  </label>
                  <input
                    type="email"
                    value={profile.email}
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
                      value={profile.cnic}
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={profile.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      placeholder="175"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={profile.weight}
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
                      value={profile.bloodType}
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
                    value={profile.allergies.join(', ')}
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
                    value={profile.medications.join(', ')}
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
                    value={profile.medicalConditions.join(', ')}
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
                        value={profile.emergencyContact.name}
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
                        value={profile.emergencyContact.relationship}
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
                        value={profile.emergencyContact.phone}
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
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
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
                    value={profile.address.street}
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
                      value={profile.address.city}
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
                      value={profile.address.province}
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
                      value={profile.address.postalCode}
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
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-slate-700">
          {errors.general && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {errors.general}
            </div>
          )}
          <div className="flex items-center space-x-4 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
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
              disabled={saving || isLoading}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving || isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}