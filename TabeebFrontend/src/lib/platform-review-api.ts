const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface PlatformReview {
  id: string;
  authorRole: 'PATIENT' | 'DOCTOR';
  displayName: string;
  displaySubtitle: string | null;
  rating: number;
  comment: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string | null;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PlatformReviewsResponse {
  success: boolean;
  reviews: PlatformReview[];
}

export interface PlatformReviewPaginationResponse {
  reviews: PlatformReview[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Submit a new platform review
 */
export async function submitPlatformReview(
  token: string,
  data: { rating: number; comment: string }
): Promise<{ success: boolean; message: string; review?: PlatformReview; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/platform-reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit review');
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { success: false, message };
  }
}

/**
 * Get approved platform reviews for public display
 */
export async function getPublicPlatformReviews(limit: number = 10): Promise<PlatformReviewsResponse> {
  const response = await fetch(`${API_URL}/api/platform-reviews/public?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch platform reviews');
  }

  return response.json();
}

/**
 * Check if current user has recently submitted a review
 */
export async function checkMyPlatformReview(token: string): Promise<{ success: boolean; recentlySubmitted: boolean }> {
  const response = await fetch(`${API_URL}/api/platform-reviews/my-review`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check review status');
  }

  return response.json();
}

/**
 * Get all platform reviews for admin moderation
 */
export async function getAdminPlatformReviews(
  token: string,
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<PlatformReviewPaginationResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`${API_URL}/api/platform-reviews/admin?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch admin reviews');
  }

  return response.json();
}

/**
 * Update review status (admin)
 */
export async function updatePlatformReviewStatus(
  token: string,
  id: string,
  status: 'APPROVED' | 'REJECTED' | 'PENDING',
  adminNotes?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/platform-reviews/admin/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, adminNotes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update review status');
  }

  return response.json();
}

/**
 * Toggle featured status (admin)
 */
export async function toggleFeaturedPlatformReview(
  token: string,
  id: string,
  isFeatured: boolean
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/platform-reviews/admin/${id}/featured`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isFeatured }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update featured status');
  }

  return response.json();
}

/**
 * Delete platform review (admin)
 */
export async function deletePlatformReview(
  token: string,
  id: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/platform-reviews/admin/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete review');
  }

  return response.json();
}
