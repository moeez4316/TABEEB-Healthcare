'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Edit3, Heart, Activity, Phone, Settings, ChevronRight, Calendar, FileText, Stethoscope, MessageSquare, PenSquare, Pill, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadPatientProfile } from '@/store/slices/patientSlice';
import PatientProfileEditModal from '@/components/profile/PatientProfileEditModal';
import { calculateBMI, getBMIStatus } from '@/lib/profile-utils';
import { formatHeightDisplay } from '@/lib/height-utils';
import { calculateProfileCompletion } from '@/lib/profile-completion';
import { APP_CONFIG } from '@/lib/config/appConfig';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.patient || { profile: null });
  // Controls visibility of profile edit modal
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  // Tracks which tab to open inside the profile edit modal
  const [profileEditInitialTab, setProfileEditInitialTab] = useState<string>('personal');

  // Helper to open profile edit modal at a specific tab
  const openProfileEdit = (tab: string) => {
    setProfileEditInitialTab(tab);
    setShowProfileEdit(true);
  };

  // Load profile data on component mount
  useEffect(() => {
    if (token) {
      dispatch(loadPatientProfile(token));
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
                Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-xl shadow-lg p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {profile?.firstName || user?.displayName || 'Patient'}! 👋
                </h2>
                <p className="text-teal-50">
                  Your health journey at a glance
                </p>
              </div>
              <Link href="/Patient/book-appointment">
                <button className="bg-white text-teal-600 hover:bg-teal-50 px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Book Appointment</span>
                </button>
              </Link>
            </div>
          </div>

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
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => openProfileEdit('personal')}
                className="flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto flex-shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Profile Completion - Hidden when 100% complete */}
          {Math.round(calculateProfileCompletion(profile).percentage) < 100 && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg shadow-md p-6 mb-6 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Complete Your Profile</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get personalized healthcare recommendations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(calculateProfileCompletion(profile).percentage)}%
                  </p>
                  <button
                    onClick={() => openProfileEdit('personal')}
                    className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium mt-1"
                  >
                    Complete Now →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/Patient/appointments">
                <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 dark:bg-blue-600 p-2.5 rounded-lg group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-colors">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">My Appointments</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">View your schedule</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-400 dark:text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              </Link>

              <Link href="/Patient/doctors">
                <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-500 dark:bg-green-600 p-2.5 rounded-lg group-hover:bg-green-600 dark:group-hover:bg-green-500 transition-colors">
                        <Stethoscope className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">Find Doctors</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Browse specialists</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-green-400 dark:text-green-500 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              </Link>

              <Link href="/Patient/medical-records">
                <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-500 dark:bg-purple-600 p-2.5 rounded-lg group-hover:bg-purple-600 dark:group-hover:bg-purple-500 transition-colors">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">Medical Records</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Access your files</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-400 dark:text-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              </Link>

              <Link href="/Patient/prescriptions">
                <div className="bg-gradient-to-br from-pink-50 to-white dark:from-pink-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-pink-500 dark:bg-pink-600 p-2.5 rounded-lg group-hover:bg-pink-600 dark:group-hover:bg-pink-500 transition-colors">
                        <Pill className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">Prescriptions</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">View medications</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-pink-400 dark:text-pink-500 group-hover:text-pink-600 dark:group-hover:text-pink-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              </Link>

              <Link href="/Patient/ai-chat">
                <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-500 dark:bg-indigo-600 p-2.5 rounded-lg group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 transition-colors">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">AI Assistant</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Get health advice</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-indigo-400 dark:text-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              </Link>

              <Link href="/blogs">
                <div className="bg-gradient-to-br from-teal-50 to-white dark:from-teal-900/10 dark:to-slate-800 rounded-lg shadow-md p-5 border border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-teal-500 dark:bg-teal-600 p-2.5 rounded-lg group-hover:bg-teal-600 dark:group-hover:bg-teal-500 transition-colors">
                        <PenSquare className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">Health Blog</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Read articles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-teal-400 dark:text-teal-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Health Overview Cards */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Health Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => openProfileEdit('medical')}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700 text-left transition cursor-pointer hover:border-red-400 dark:hover:border-red-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <Heart className="w-7 h-7 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Blood Type</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {profile.bloodType || 'Not Set'}
                      </p>
                    </div>
                  </div>
                  {!profile.bloodType && (
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">Click to add</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => openProfileEdit('medical')}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700 text-left transition cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Activity className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Body Mass Index</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {profile.height && profile.weight 
                          ? calculateBMI(profile.height, profile.weight) || 'N/A'
                          : 'Not Set'
                        }
                      </p>
                      {profile.height && profile.weight && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                          {getBMIStatus(calculateBMI(profile.height, profile.weight))}
                        </p>
                      )}
                    </div>
                  </div>
                  {(!profile.height || !profile.weight) && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Click to add</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => openProfileEdit('medical')}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700 text-left transition cursor-pointer hover:border-green-400 dark:hover:border-green-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Phone className="w-7 h-7 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Emergency Contact</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
                        {profile.emergencyContact.name || 'Not Set'}
                      </p>
                      {profile.emergencyContact.relationship && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                          {profile.emergencyContact.relationship}
                        </p>
                      )}
                    </div>
                  </div>
                  {!profile.emergencyContact.name && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Click to add</span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Medical Information & Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {Array.isArray(profile.allergies) && profile.allergies.length > 0 
                      ? profile.allergies.join(', ') 
                      : 'None reported'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Current Medications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Array.isArray(profile.medications) && profile.medications.length > 0 
                      ? profile.medications.join(', ') 
                      : 'None reported'}
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
                    onClick={() => openProfileEdit('preferences')}
                    className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                
                <button 
                  onClick={() => openProfileEdit('preferences')}
                  className="flex items-center justify-between w-full text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 py-2 rounded-lg transition-colors group"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Language</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile.language}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
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
          </div>

          {/* Profile Edit Modal */}
          <PatientProfileEditModal 
            isOpen={showProfileEdit}
            onClose={() => setShowProfileEdit(false)}
            initialTab={profileEditInitialTab}
          />
        </div>
      </main>
    </div>
  );
}
