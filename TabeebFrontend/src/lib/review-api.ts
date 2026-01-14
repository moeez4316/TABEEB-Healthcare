const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Review {
  id: string;
  appointmentId: string;
  rating: number;
  comment: string | null;
  isComplaint: boolean;
  adminNotes: string | null;
  adminActionTaken: string | null;
  createdAt: string;
  updatedAt: string;
  appointment: {
    appointmentDate: string;
    patient: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasMore: boolean;
    limit: number;
  };
}

export interface DoctorRatingResponse {
  averageRating: number;
  totalReviews: number;
}

/**
 * Get doctor's own reviews
 */
export async function getDoctorReviews(
  token: string,
  page: number = 1,
  limit: number = 10,
  filterComplaints?: boolean
): Promise<ReviewsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filterComplaints !== undefined) {
    params.append('filterComplaints', filterComplaints.toString());
  }

  const response = await fetch(
    `${API_URL}/api/reviews/my-reviews?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch reviews');
    } else {
      throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
}

/**
 * Get doctor's rating statistics
 */
export async function getDoctorRating(token: string): Promise<DoctorRatingResponse> {
  const response = await fetch(`${API_URL}/api/reviews/my-rating`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch rating');
    } else {
      throw new Error(`Failed to fetch rating: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
}