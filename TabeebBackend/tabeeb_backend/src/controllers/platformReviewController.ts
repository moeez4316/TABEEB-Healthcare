import { Request, Response } from 'express';
import { PlatformReviewRole, PlatformReviewStatus } from '@prisma/client';
import {
  createPlatformReview,
  hasSubmittedRecently,
  getApprovedPlatformReviews,
  getAllPlatformReviews,
  updatePlatformReviewStatus,
  deletePlatformReview,
  toggleFeaturedStatus
} from '../services/platformReviewService';
import prisma from '../lib/prisma';

/**
 * POST /api/platform-reviews
 * Submit a new platform review
 * Auth: Patient or Doctor
 */
export const createPlatformReviewController = async (req: Request, res: Response) => {
  try {
    const authorUid = req.user!.uid;
    
    // Determine the user's role by checking the database
    const doctor = await prisma.doctor.findUnique({ where: { uid: authorUid } });
    const patient = await prisma.patient.findUnique({ where: { uid: authorUid } });
    
    if (!doctor && !patient) {
      return res.status(403).json({ error: 'User not found in system' });
    }
    
    const authorRole = (doctor ? 'DOCTOR' : 'PATIENT') as PlatformReviewRole;
    
    const { rating, comment } = req.body;

    // Check rate limit (1 per 30 days)
    const recentlySubmitted = await hasSubmittedRecently(authorUid);
    if (recentlySubmitted) {
      return res.status(429).json({ 
        error: 'You have already submitted a review recently. Please try again later.' 
      });
    }

    const review = await createPlatformReview({
      authorUid,
      authorRole,
      rating,
      comment
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will appear publicly after approval.',
      review
    });
  } catch (error: any) {
    console.error('Error creating platform review:', error);
    return res.status(400).json({ 
      error: error.message || 'Failed to submit review'
    });
  }
};

/**
 * GET /api/platform-reviews/public
 * Get approved platform reviews for the landing page
 * Auth: None (public)
 */
export const getPublicPlatformReviewsController = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const reviews = await getApprovedPlatformReviews(limit);
    
    return res.status(200).json({
      success: true,
      reviews
    });
  } catch (error: any) {
    console.error('Error fetching public platform reviews:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch reviews'
    });
  }
};

/**
 * GET /api/platform-reviews/my-review
 * Check if the current user has recently submitted a review
 * Auth: Patient or Doctor
 */
export const checkMyPlatformReviewController = async (req: Request, res: Response) => {
  try {
    const authorUid = req.user!.uid;
    const recentlySubmitted = await hasSubmittedRecently(authorUid);
    
    return res.status(200).json({
      success: true,
      recentlySubmitted
    });
  } catch (error: any) {
    console.error('Error checking my platform review:', error);
    return res.status(500).json({ 
      error: 'Failed to check review status'
    });
  }
};

/**
 * GET /api/platform-reviews/admin
 * Get all platform reviews with pagination and filters
 * Auth: Admin only
 */
export const getAllPlatformReviewsAdminController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as PlatformReviewStatus | undefined;

    const result = await getAllPlatformReviews(page, limit, status);
    
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching platform reviews for admin:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch reviews'
    });
  }
};

/**
 * PATCH /api/platform-reviews/admin/:id/status
 * Update review status (approve/reject)
 * Auth: Admin only
 */
export const updatePlatformReviewStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!Object.values(PlatformReviewStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedReview = await updatePlatformReviewStatus(id, status, adminNotes);
    
    return res.status(200).json({
      success: true,
      message: `Review status updated to ${status}`,
      review: updatedReview
    });
  } catch (error: any) {
    console.error('Error updating platform review status:', error);
    return res.status(400).json({ 
      error: error.message || 'Failed to update review status'
    });
  }
};

/**
 * PATCH /api/platform-reviews/admin/:id/featured
 * Toggle featured status
 * Auth: Admin only
 */
export const toggleFeaturedStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    const updatedReview = await toggleFeaturedStatus(id, isFeatured);
    
    return res.status(200).json({
      success: true,
      message: `Review featured status updated`,
      review: updatedReview
    });
  } catch (error: any) {
    console.error('Error updating platform review featured status:', error);
    return res.status(400).json({ 
      error: error.message || 'Failed to update featured status'
    });
  }
};

/**
 * DELETE /api/platform-reviews/admin/:id
 * Delete a platform review
 * Auth: Admin only
 */
export const deletePlatformReviewController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await deletePlatformReview(id);
    
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Error deleting platform review:', error);
    return res.status(400).json({ 
      error: error.message || 'Failed to delete review'
    });
  }
};
