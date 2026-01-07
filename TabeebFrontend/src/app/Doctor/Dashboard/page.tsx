"use client";

import { useState, useEffect } from 'react';
import { Mail, Calendar, Stethoscope, Clock, AlertTriangle, CheckCircle, Edit3, Phone, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadDoctorProfile } from '@/store/slices/doctorSlice';
import { calculateDoctorProfileCompletion } from '@/lib/doctor-profile-completion';
import DoctorProfileEditModal from '@/components/profile/DoctorProfileEditModal';
import Link from 'next/link';
import { APP_CONFIG } from '@/lib/config/appConfig';

export default function DoctorDashboard() {
  const { user, token, verificationStatus } = useAuth();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.doctor || { profile: null });
  const [showProfileEdit, setShowProfileEdit] = useState<string | boolean>(false);

  // Load profile data on component mount
  useEffect(() => {
    if (token) {
      dispatch(loadDoctorProfile(token));
    }
  }, [dispatch, token]);

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={40} height={40} className="object-contain" />
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
                Doctor Dashboard
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
                      <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 truncate">
                    {profile.firstName && profile.lastName 
                      ? `Dr. ${profile.firstName} ${profile.lastName}`
                      : user.displayName ? `Dr. ${user.displayName}` : 'Welcome to TABEEB'
                    }
                  </h2>
                  <div className="space-y-1">
                    {profile.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{profile.email}</span>
                      </p>
                    )}
                    {profile.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        {profile.phone}
                      </p>
                    )}
                    {profile.specialization && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Stethoscope className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{profile.specialization}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowProfileEdit('personal')}
                className="bg-teal-600 dark:bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors duration-200 flex items-center justify-center space-x-2 w-full sm:w-auto flex-shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Profile Completion - Hidden when 100% complete */}
          {Math.round(calculateDoctorProfileCompletion(profile).percentage) < 100 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 mb-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Profile Completion</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Complete your profile to get better healthcare recommendations</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {Math.round(calculateDoctorProfileCompletion(profile).percentage)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Complete</p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Status */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${
                  verificationStatus === 'approved' 
                    ? 'bg-green-100 dark:bg-green-800' 
                    : verificationStatus === 'pending'
                    ? 'bg-yellow-100 dark:bg-yellow-800'
                    : 'bg-red-100 dark:bg-red-800'
                }`}>
                  {verificationStatus === 'approved' ? (
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : verificationStatus === 'pending' ? (
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Verification Status
                  </h3>
                  <p className={`text-sm font-medium ${
                    verificationStatus === 'approved' 
                      ? 'text-green-600 dark:text-green-400' 
                      : verificationStatus === 'pending'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {verificationStatus === 'approved' && 'Verified Doctor'}
                    {verificationStatus === 'pending' && 'Under Review'}
                    {verificationStatus === 'rejected' && 'Verification Required'}
                    {verificationStatus === 'not-submitted' && 'Documents Required'}
                  </p>
                </div>
              </div>
              
              {verificationStatus === 'approved' && (
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You can now accept patients
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700 opacity-90 cursor-default">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Experience</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.experience ? `${profile.experience}y` : 'Not Set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Link href="/Doctor/Appointments">
              <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-slate-800 rounded-lg shadow-md p-6 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500 dark:bg-blue-600 p-2.5 rounded-lg group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-colors">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        Manage Appointments
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View and manage patient appointments
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-400 dark:text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </div>
            </Link>

            <Link href="/Doctor/Calendar">
              <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-slate-800 rounded-lg shadow-md p-6 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500 dark:bg-green-600 p-2.5 rounded-lg group-hover:bg-green-600 dark:group-hover:bg-green-500 transition-colors">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        Calendar View
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Check your schedule and availability
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-green-400 dark:text-green-500 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </div>
            </Link>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Professional Details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Specialization</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile.specialization || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Qualification</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile.qualification || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">PMDC Number</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile.pmdcNumber || 'Not provided'}
                  </p>
                </div>
                

              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Address Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile.address?.city || 'Not specified'}
                    {profile.address?.province && `, ${profile.address.province}`}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Street Address</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile.address?.street || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Postal Code</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile.address?.postalCode || 'Not specified'}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              <button 
                onClick={() => setShowProfileEdit('personal')}
                className="flex items-center justify-between w-full text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 -mx-3 rounded-lg transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Personal & Contact</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name, phone, gender, avatar</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
              </button>
              <button 
                onClick={() => setShowProfileEdit('medical')}
                className="flex items-center justify-between w-full text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 -mx-3 rounded-lg transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Medical Credentials</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Specialization, qualification, experience</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
              </button>
              <button 
                onClick={() => setShowProfileEdit('billing')}
                className="flex items-center justify-between w-full text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 -mx-3 rounded-lg transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Consultation Fees</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Set or update hourly rate</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
              </button>
              <button 
                onClick={() => setShowProfileEdit('preferences')}
                className="flex items-center justify-between w-full text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 -mx-3 rounded-lg transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Notification Preferences</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email, SMS & push settings</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
              </button>
              <button 
                onClick={() => setShowProfileEdit('address')}
                className="flex items-center justify-between w-full text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 -mx-3 rounded-lg transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Address Details</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Practice location & postal code</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
              </button>
              
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

          {/* Profile Edit Modal */}
          <DoctorProfileEditModal 
            isOpen={Boolean(showProfileEdit)}
            onClose={() => setShowProfileEdit(false)}
            initialTab={typeof showProfileEdit === 'string' ? showProfileEdit : undefined}
          />
        </div>
      </main>
    </div>
  );
}
