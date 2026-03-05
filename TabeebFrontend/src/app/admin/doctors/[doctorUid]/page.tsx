'use client';

import { use, useEffect, useMemo } from 'react';
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
  AvailabilityPreview,
  ComplaintsSection
} from '@/components/doctor-profile';
import { FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';
import { useAdminApiQuery } from '@/lib/hooks/useAdminApiQuery';
import { apiFetchJson, ApiError } from '@/lib/api-client';
import AdminLoading from '@/components/admin/AdminLoading';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

interface Complaint {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  patientName: string;
  adminNotes?: string | null;
  adminActionTaken?: string | null;
}

interface ComplaintReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  adminNotes?: string | null;
  adminActionTaken?: string | null;
  appointment: {
    doctor: { uid: string };
    patient: { firstName: string; lastName: string };
  };
}

export default function AdminDoctorProfilePage({ params }: { params: Promise<{ doctorUid: string }> }) {
  const router = useRouter();
  const { doctorUid } = use(params);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useAdminApiQuery<PublicDoctorProfile>({
    queryKey: ['doctor', 'profile', doctorUid],
    queryFn: () => fetchPublicDoctorProfile(doctorUid),
    enabled: !!doctorUid,
    staleTime: 2 * 60 * 1000,
  });

  const { data: availability } = useAdminApiQuery<DoctorAvailabilitySummary | null>({
    queryKey: ['doctor', 'availability-summary', doctorUid],
    queryFn: () => fetchDoctorAvailabilitySummary(doctorUid).catch(() => null),
    enabled: !!doctorUid,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: complaintsPayload,
    error: complaintsError,
  } = useAdminApiQuery<{ reviews: ComplaintReview[] }>({
    queryKey: ['admin', 'complaints', doctorUid],
    queryFn: () =>
      apiFetchJson<{ reviews: ComplaintReview[] }>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/admin/complaints?limit=100`,
        {
          token: adminToken,
        }
      ),
    enabled: !!adminToken && !!doctorUid,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!adminToken) {
      router.push('/admin/login');
    }
  }, [adminToken, router]);

  useEffect(() => {
    const status = (complaintsError as ApiError | undefined)?.status;
    if (status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      router.push('/admin/login');
    }
  }, [complaintsError, router]);

  const complaints: Complaint[] = useMemo(() => {
    const reviews = complaintsPayload?.reviews || [];
    return reviews
      .filter((review) => review.appointment.doctor.uid === doctorUid)
      .map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        patientName: `${review.appointment.patient.firstName} ${review.appointment.patient.lastName.charAt(0)}.`,
        adminNotes: review.adminNotes,
        adminActionTaken: review.adminActionTaken,
      }));
  }, [complaintsPayload, doctorUid]);

  // Loading State
  if (profileLoading) {
    return (
      <AdminLoading title="Loading Doctor Profile" subtitle="Fetching profile details..." />
    );
  }

  // Error State
  if (profileError || !profile) {
    const message = profileError instanceof Error ? profileError.message : 'The doctor profile you are looking for could not be found.';
    return (
      <AdminPageShell>
        <AdminPageHeader title="Doctor Profile" subtitle="Profile not found or unavailable." />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <FaExclamationCircle className="text-red-500 text-5xl mb-4 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{message}</p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold"
          >
            Go Back
          </button>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Doctor Profile"
        subtitle="Full profile snapshot, availability, and feedback."
        actions={
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <FaArrowLeft />
            Back to Admin Panel
          </button>
        }
      />

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
    </AdminPageShell>
  );
}
