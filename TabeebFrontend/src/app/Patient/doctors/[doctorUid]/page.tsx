'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
import { FaSpinner, FaExclamationCircle } from 'react-icons/fa';

export default function DoctorProfilePage({ params }: { params: Promise<{ doctorUid: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
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

  const handleBookAppointment = () => {
    if (!user) {
      // Redirect to auth page if not authenticated
      router.push('/auth');
    } else {
      // Navigate to booking page
      router.push(`/Patient/book-appointment?doctor=${doctorUid}`);
    }
  };

  const handleViewFullCalendar = () => {
    if (!user) {
      router.push('/auth');
    } else {
      router.push(`/Patient/book-appointment?doctor=${doctorUid}`);
    }
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
            onClick={() => router.back()}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          onBookAppointment={handleBookAppointment}
          showBookButton={true}
        />

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
            onViewFullCalendar={handleViewFullCalendar}
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

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 rounded-2xl p-8 text-center shadow-2xl">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Book an Appointment?
          </h3>
          <p className="text-teal-100 mb-6 max-w-2xl mx-auto">
            Schedule your consultation with Dr. {profile.name} and take the first step towards better health.
          </p>
          <button
            onClick={handleBookAppointment}
            className="bg-white text-teal-700 hover:bg-teal-50 font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Book Appointment Now
          </button>
        </div>
      </div>
    </div>
  );
}
