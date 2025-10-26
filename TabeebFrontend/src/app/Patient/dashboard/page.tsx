'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Edit3, Heart, Activity, Phone, MapPin, Settings, ChevronRight, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadPatientProfile, selectHasUnsavedChanges } from '@/store/slices/patientSlice';
import PatientProfileEditModal from '@/components/profile/PatientProfileEditModal';
import { calculateBMI, getBMIStatus } from '@/lib/profile-utils';
import { formatHeightDisplay } from '@/lib/height-utils';
import { calculateProfileCompletion } from '@/lib/profile-completion';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.patient);
  const hasUnsavedChanges = useAppSelector(selectHasUnsavedChanges);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // Load profile data on component mount
  useEffect(() => {
    if (token) {
      dispatch(loadPatientProfile(token));
    }
  }, [dispatch, token]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Image src="/tabeeb_logo.png" alt="TABEEB Logo" width={40} height={40} className="object-contain" />
                <div>
                  <h1 className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                    TABEEB
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                    Healthcare Platform
                  </p>
                </div>
              </div>
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Profile Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
              <div className="flex items-center space-x-4 sm:space-x-6 w-full sm:w-auto">
                <div className="flex-shrink-0">
                  {profile.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="rounded-full object-cover shadow-xl w-20 h-20 sm:w-24 sm:h-24"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-xl">
                      <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 truncate">
                    {profile.firstName && profile.lastName 
                      ? `${profile.firstName} ${profile.lastName}`
                      : user.displayName || 'Welcome to TABEEB'
                    }
                  </h2>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{profile.email || user.email}</span>
                    </p>
                    {profile.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        {profile.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowProfileEdit(true)}
                className="flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto flex-shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
            
            {hasUnsavedChanges && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">You have unsaved profile changes</span>
                </div>
              </div>
            )}
          </div>

          {/* Profile Completion - Hidden when 100% complete */}
          {Math.round(calculateProfileCompletion(profile).percentage) < 100 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 mb-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Profile Completion</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Complete your profile to get better healthcare recommendations</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {Math.round(calculateProfileCompletion(profile).percentage)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Complete</p>
                </div>
              </div>
            </div>
          )}

          {/* Health Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Blood Type</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.bloodType || 'Not Set'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">BMI</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.height && profile.weight 
                      ? calculateBMI(profile.height, profile.weight) || 'N/A'
                      : 'Not Set'
                    }
                  </p>
                  {profile.height && profile.weight && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getBMIStatus(calculateBMI(profile.height, profile.weight))}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Emergency Contact</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {profile.emergencyContact.name || 'Not Set'}
                  </p>
                  {profile.emergencyContact.relationship && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {profile.emergencyContact.relationship}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {profile.address.city || 'Not Set'}
                  </p>
                  {profile.address.province && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {profile.address.province}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Medical Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Height & Weight</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatHeightDisplay(profile.height)} • {profile.weight ? `${profile.weight} kg` : 'Not set'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Allergies</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None reported'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Current Medications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile.medications.length > 0 ? profile.medications.join(', ') : 'None reported'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Settings</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile.notifications.email ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowProfileEdit(true)}
                    className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Language</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile.language}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Account Created</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.metadata.creationTime ? 
                        new Date(user.metadata.creationTime).toLocaleDateString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Edit Modal */}
          <PatientProfileEditModal 
            isOpen={showProfileEdit}
            onClose={() => setShowProfileEdit(false)}
          />
        </div>
      </main>
    </div>
  );
}
