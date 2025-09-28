"use client";

import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Stethoscope, Clock, Users, Activity, AlertTriangle, CheckCircle, Edit3, Award, Building, Phone, MapPin, Settings, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadDoctorProfile, selectHasUnsavedChanges } from '@/store/slices/doctorSlice';
import { calculateDoctorProfileCompletion, getCompletionStatusColor } from '@/lib/doctor-profile-completion';
import DoctorProfileEditModal from '@/components/profile/DoctorProfileEditModal';
import Link from 'next/link';

export default function DoctorDashboard() {
  const { user, token, verificationStatus } = useAuth();
  const dispatch = useAppDispatch();
  const { profile, isLoading, error } = useAppSelector((state) => state.doctor);
  const hasUnsavedChanges = useAppSelector(selectHasUnsavedChanges);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // Load profile data on component mount
  useEffect(() => {
    if (token) {
      dispatch(loadDoctorProfile(token));
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {profile.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="rounded-full object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-xl">
                      <Stethoscope className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {profile.firstName && profile.lastName 
                      ? `Dr. ${profile.firstName} ${profile.lastName}`
                      : user.displayName ? `Dr. ${user.displayName}` : 'Welcome to TABEEB'
                    }
                  </h2>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {profile.email || user.email}
                    </p>
                    {profile.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {profile.phone}
                      </p>
                    )}
                    {profile.specialization && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Stethoscope className="w-4 h-4 mr-2 text-gray-400" />
                        {profile.specialization}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowProfileEdit(true)}
                className="bg-teal-600 dark:bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors duration-200 flex items-center space-x-2"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Appointments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.stats.totalAppointments > 0 ? '8' : '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.stats.totalPatients}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rating</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.stats.rating > 0 ? profile.stats.rating.toFixed(1) : 'N/A'}
                  </p>
                  {profile.stats.reviewCount > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {profile.stats.reviewCount} reviews
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
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
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Manage Appointments
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View, schedule, and manage patient appointments
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/Doctor/Calendar">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Calendar View
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Check your schedule and availability
                    </p>
                  </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Settings</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your profile information and preferences</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Notification Settings</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure appointment and message notifications</p>
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

          {/* Profile Edit Modal */}
          <DoctorProfileEditModal 
            isOpen={showProfileEdit}
            onClose={() => setShowProfileEdit(false)}
          />
        </div>
      </main>
    </div>
  );
}
