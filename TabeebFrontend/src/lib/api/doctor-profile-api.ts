import { PublicDoctorProfile, DoctorAvailabilitySummary } from '@/types/doctor-profile';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
const DOCTOR_API_URL = `${API_BASE_URL}/api/doctor`;
const REVIEWS_API_URL = `${API_BASE_URL}/api/reviews`;

/**
 * Fetch public doctor profile with all related data
 * @param doctorUid - The UID of the doctor
 * @returns Complete public doctor profile
 */
export const fetchPublicDoctorProfile = async (doctorUid: string): Promise<PublicDoctorProfile> => {
  const response = await fetch(`${DOCTOR_API_URL}/profile/${doctorUid}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Always fetch fresh data
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Doctor profile not found');
    }
    throw new Error(`Failed to fetch doctor profile: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch doctor's availability summary for the next 7 days
 * @param doctorUid - The UID of the doctor
 * @returns Availability summary
 */
export const fetchDoctorAvailabilitySummary = async (doctorUid: string): Promise<DoctorAvailabilitySummary> => {
  const response = await fetch(`${DOCTOR_API_URL}/profile/${doctorUid}/availability-summary`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch availability summary: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch paginated public reviews for a doctor
 * @param doctorUid - The UID of the doctor
 * @param page - Page number (default: 1)
 * @param limit - Reviews per page (default: 10)
 * @returns Paginated reviews
 */
export const fetchDoctorPublicReviews = async (
  doctorUid: string,
  page: number = 1,
  limit: number = 10
) => {
  const response = await fetch(`${REVIEWS_API_URL}/doctor/${doctorUid}?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch doctor's public rating statistics
 * @param doctorUid - The UID of the doctor
 * @returns Rating statistics
 */
export const fetchDoctorPublicRating = async (doctorUid: string) => {
  const response = await fetch(`${REVIEWS_API_URL}/doctor/${doctorUid}/rating`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch rating: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch doctor's published blogs with pagination
 * @param doctorUid - The UID of the doctor
 * @param page - Page number (default: 1)
 * @param limit - Blogs per page (default: 10)
 * @returns Paginated blogs
 */
export const fetchDoctorBlogs = async (
  doctorUid: string,
  page: number = 1,
  limit: number = 10
) => {
  const response = await fetch(
    `${API_BASE_URL}/api/blogs/public?doctorUid=${doctorUid}&page=${page}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch doctor blogs: ${response.statusText}`);
  }

  return response.json();
};
