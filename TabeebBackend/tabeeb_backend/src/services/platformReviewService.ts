import prisma from '../lib/prisma';
import { Prisma, PlatformReviewRole, PlatformReviewStatus } from '@prisma/client';

interface CreatePlatformReviewParams {
  authorUid: string;
  authorRole: PlatformReviewRole;
  rating: number;
  comment: string;
}

/**
 * Check if the user has submitted a review in the last 30 days
 */
export const hasSubmittedRecently = async (authorUid: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentReview = await prisma.platformReview.findFirst({
    where: {
      authorUid,
      createdAt: {
        gte: thirtyDaysAgo
      }
    }
  });

  return !!recentReview;
};

/**
 * Create a new platform review
 */
export const createPlatformReview = async (params: CreatePlatformReviewParams) => {
  const { authorUid, authorRole, rating, comment } = params;

  // Validate rating range
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Resolve display name and subtitle based on role
  let displayName = '';
  let displaySubtitle: string | null = null;

  if (authorRole === 'PATIENT') {
    const patient = await prisma.patient.findUnique({ where: { uid: authorUid } });
    if (!patient) throw new Error('Patient not found');
    
    displayName = `${patient.firstName} ${patient.lastName.charAt(0)}.`;
    displaySubtitle = patient.addressCity || 'Patient';
  } else if (authorRole === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({ where: { uid: authorUid } });
    if (!doctor) throw new Error('Doctor not found');
    
    displayName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
    displaySubtitle = doctor.specialization;
  } else {
    throw new Error('Invalid author role');
  }

  // Create the review
  const review = await prisma.platformReview.create({
    data: {
      authorUid,
      authorRole,
      displayName,
      displaySubtitle,
      rating,
      comment,
      status: PlatformReviewStatus.PENDING
    }
  });

  return review;
};

/**
 * Get approved platform reviews for public display
 */
export const getApprovedPlatformReviews = async (limit: number = 10) => {
  const reviews = await prisma.platformReview.findMany({
    where: {
      status: PlatformReviewStatus.APPROVED
    },
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'desc' }
    ],
    take: limit
  });

  return reviews;
};

/**
 * Get all platform reviews for admin moderation
 */
export const getAllPlatformReviews = async (
  page: number = 1,
  limit: number = 10,
  status?: PlatformReviewStatus
) => {
  const skip = (page - 1) * limit;

  const where: Prisma.PlatformReviewWhereInput = {};
  if (status) {
    where.status = status;
  }

  const [reviews, totalCount] = await Promise.all([
    prisma.platformReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.platformReview.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    reviews,
    pagination: {
      currentPage: page,
      totalPages,
      totalReviews: totalCount,
      hasMore: page < totalPages,
      limit
    }
  };
};

/**
 * Update platform review status (Approve/Reject)
 */
export const updatePlatformReviewStatus = async (
  id: string,
  status: PlatformReviewStatus,
  adminNotes?: string
) => {
  const review = await prisma.platformReview.findUnique({ where: { id } });
  
  if (!review) {
    throw new Error('Platform review not found');
  }

  const updatedReview = await prisma.platformReview.update({
    where: { id },
    data: {
      status,
      ...(adminNotes !== undefined && { adminNotes })
    }
  });

  return updatedReview;
};

/**
 * Toggle featured status
 */
export const toggleFeaturedStatus = async (id: string, isFeatured: boolean) => {
  const review = await prisma.platformReview.findUnique({ where: { id } });
  
  if (!review) {
    throw new Error('Platform review not found');
  }

  const updatedReview = await prisma.platformReview.update({
    where: { id },
    data: { isFeatured }
  });

  return updatedReview;
};

/**
 * Delete a platform review
 */
export const deletePlatformReview = async (id: string) => {
  const review = await prisma.platformReview.findUnique({ where: { id } });
  
  if (!review) {
    throw new Error('Platform review not found');
  }

  await prisma.platformReview.delete({
    where: { id }
  });

  return { message: 'Platform review deleted successfully', id };
};
