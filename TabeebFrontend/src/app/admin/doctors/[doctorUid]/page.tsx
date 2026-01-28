'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchPublicDoctorProfile,
  fetchDoctorAvailabilitySummary,
  fetchDoctorPublicReviews
} from '@/lib/api/doctor-profile-api';
import { PublicDoctorProfile, DoctorAvailabilitySummary } from '@/types/doctor-profile';
import {
  ProfileHeader,
  StatsSection,
  AboutSection,
  ReviewsSection,
  BlogsSection,
  AvailabilityPreview,
  ComplaintsSection
} from '@/components/doctor-profile';
import { FaSpinner, FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';

interface Complaint {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  patientName: string;
  adminNotes?: string | null;
  adminActionTaken?: string | null;
}

export default function AdminDoctorProfilePage({ params }: { params: Promise<{ doctorUid: string }> }) {
  const router = useRouter();
  const { doctorUid } = use(params);
  const [profile, setProfile] = useState<PublicDoctorProfile | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailabilitySummary | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDoctorData = async () => {
      try {
        setLoading(true);
        setError(null);

        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
          router.push('/admin/login');
          return;
        }

        // Fetch profile and availability
        const [profileData, availabilityData] = await Promise.all([
          fetchPublicDoctorProfile(doctorUid),
          fetchDoctorAvailabilitySummary(doctorUid).catch(() => null)
        ]);

        setProfile(profileData);
        setAvailability(availabilityData);

        // Fetch all complaints for admin using correct endpoint
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
        
        const complaintsResponse = await fetch(`${API_URL}/api/reviews/admin/complaints?limit=100`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
        });

        if (complaintsResponse.ok) {
          const complaintsData = await complaintsResponse.json();
          // Filter complaints for this specific doctor
          const doctorComplaints = complaintsData.reviews
            .filter((review: any) => review.appointment.doctor.uid === doctorUid)
            .map((review: any) => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              createdAt: review.createdAt,
              patientName: `${review.appointment.patient.firstName} ${review.appointment.patient.lastName.charAt(0)}.`,
              adminNotes: review.adminNotes,
              adminActionTaken: review.adminActionTaken
            }));
          setComplaints(doctorComplaints);
        } else {
          console.error('Failed to fetch complaints:', complaintsResponse.status, await complaintsResponse.text());
        }
      } catch (err: any) {
        console.error('Error loading doctor data:', err);
        setError(err.message || 'Failed to load doctor data');
      } finally {
        setLoading(false);
      }
    };

    if (doctorUid) {
      loadDoctorData();
    }
  }, [doctorUid, router]);

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
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 mb-6 transition-colors"
        >
          <FaArrowLeft />
          Back to Admin Panel
        </button>

        {/* Admin Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg font-semibold">
            <FaExclamationCircle />
            Admin View - Full Access
          </span>
        </div>

        {/* Profile Header - No Book Button */}
        <ProfileHeader
          profile={profile}
          showBookButton={false}
        />

        {/* Stats Section */}
        <StatsSection
          stats={profile.stats}
          experience={profile.experience}
        />

        {/* Complaints Section - Admin Only */}
        <ComplaintsSection
          complaints={complaints}
          doctorUid={profile.uid}
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
      </div>
    </div>
  );
}
