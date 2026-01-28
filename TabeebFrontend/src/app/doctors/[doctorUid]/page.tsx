'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchPublicDoctorProfile,
  fetchDoctorAvailabilitySummary
} from '@/lib/api/doctor-profile-api';
import { PublicDoctorProfile, DoctorAvailabilitySummary } from '@/types/doctor-profile';
import {
  ProfileHeader,
  StatsSection,
  AboutSection,
  ReviewsSection,
  BlogsSection,
  AvailabilityPreview
} from '@/components/doctor-profile';
import { FaSpinner, FaExclamationCircle, FaUserPlus } from 'react-icons/fa';

export default function PublicDoctorProfilePage({ params }: { params: Promise<{ doctorUid: string }> }) {
  const router = useRouter();
  const { doctorUid } = use(params);
  const [profile, setProfile] = useState<PublicDoctorProfile | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDoctorProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile and availability in parallel
        const [profileData, availabilityData] = await Promise.all([
          fetchPublicDoctorProfile(doctorUid),
          fetchDoctorAvailabilitySummary(doctorUid).catch(() => null) // Availability is optional
        ]);

        setProfile(profileData);
        setAvailability(availabilityData);
      } catch (err) {
        console.error('Error loading doctor profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load doctor profile');
      } finally {
        setLoading(false);
      }
    };

    if (doctorUid) {
      loadDoctorProfile();
    }
  }, [doctorUid]);

  const handleSignUpToBook = () => {
    // Redirect to auth page
    router.push('/auth');
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-teal-600 dark:text-teal-400 text-6xl mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <FaExclamationCircle className="text-red-500 text-6xl mb-4 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The doctor profile you are looking for could not be found.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Navigation Header */}
      <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-2xl font-bold text-teal-600 dark:text-teal-400"
          >
            TABEEB
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/auth')}
              className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 font-semibold transition-colors"
            >
              Login
            </button>
            <button
              onClick={handleSignUpToBook}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <FaUserPlus />
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header - No Book Button, different CTA */}
        <ProfileHeader
          profile={profile}
          onBookAppointment={handleSignUpToBook}
          showBookButton={false}
        />

        {/* Sign Up CTA Banner */}
        <div className="mb-8 bg-gradient-to-r from-teal-500 to-blue-500 dark:from-teal-600 dark:to-blue-600 rounded-2xl p-6 text-center shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-2">
            Want to book an appointment with Dr. {profile.firstName} {profile.lastName}?
          </h3>
          <p className="text-white/90 mb-4">
            Create a free account to book appointments, access your medical records, and more!
          </p>
          <button
            onClick={handleSignUpToBook}
            className="bg-white text-teal-700 hover:bg-gray-100 font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
          >
            <FaUserPlus />
            Sign Up to Book Appointment
          </button>
        </div>

        {/* Stats Section */}
        <StatsSection
          stats={profile.stats}
          experience={profile.experience}
        />

        {/* About & Credentials */}
        <AboutSection profile={profile} />

        {/* Availability Preview */}
        {availability && availability.availabilitySummary.length > 0 && (
          <AvailabilityPreview
            availability={availability.availabilitySummary}
          />
        )}

        {/* Reviews Section */}
        {profile.recentReviews && profile.recentReviews.length > 0 && (
          <ReviewsSection
            reviews={profile.recentReviews}
            stats={profile.stats}
          />
        )}

        {/* Published Blogs */}
        {profile.recentBlogs && profile.recentBlogs.length > 0 && (
          <BlogsSection
            blogs={profile.recentBlogs}
            totalBlogs={profile.totalPublishedBlogs}
            doctorUid={profile.uid}
          />
        )}

        {/* Final Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 rounded-2xl p-8 text-center shadow-2xl">
          <h3 className="text-3xl font-bold text-white mb-4">
            Join TABEEB Today
          </h3>
          <p className="text-teal-100 mb-6 max-w-2xl mx-auto">
            Connect with verified healthcare professionals like Dr. {profile.name}. 
            Get instant access to quality healthcare from the comfort of your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSignUpToBook}
              className="bg-white text-teal-700 hover:bg-teal-50 font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-2"
            >
              <FaUserPlus />
              Create Free Account
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 dark:bg-slate-950 text-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2026 TABEEB Healthcare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
