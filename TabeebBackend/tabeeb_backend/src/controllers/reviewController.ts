import { Request, Response } from 'express';
import {
  createReview,
  getDoctorReviews,
  getDoctorRating,
  getComplaintReviews,
  updateComplaintAction,
  canReviewAppointment,
  getPatientReviews,
  getPublicDoctorReviews,
  getPublicDoctorRating,
  deleteReview
} from '../services/reviewService';
import prisma from '../lib/prisma';

/**
 * POST /api/reviews/create
 * Create a new review for a completed appointment
 * Auth: Patient only
 */
export const createReviewController = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const { appointmentId, rating, comment, isComplaint } = req.body;

    // Check if patient can review this appointment
    const canReview = await canReviewAppointment(appointmentId, patientUid);
    if (!canReview.canReview) {
      return res.status(400).json({ 
        error: canReview.reason || 'Cannot review this appointment'
      });
    }

    // Create the review
    const review = await createReview({
      appointmentId,
      rating,
      comment,
      isComplaint: isComplaint || false
    });

    return res.status(201).json({
      success: true,
      message: isComplaint 
        ? 'Complaint submitted successfully and sent to admin for review'
        : 'Review submitted successfully',
      review
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return res.status(400).json({ 
      error: error.message || 'Failed to create review'
    });
  }
};

/**
 * GET /api/reviews/my-reviews
 * Get all reviews for the logged-in doctor
 * Auth: Doctor only
 */
export const getMyReviews = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user!.uid;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filterComplaints = req.query.filterComplaints as string;

    // Parse filterComplaints: 'true' -> true, 'false' -> false, undefined -> undefined
    let complaintsFilter: boolean | undefined;
    if (filterComplaints === 'true') {
      complaintsFilter = true;
    } else if (filterComplaints === 'false') {
      complaintsFilter = false;
    }

    // Verify user is a doctor
    const doctor = await prisma.doctor.findUnique({
      where: { uid: doctorUid }
    });

    if (!doctor) {
      return res.status(403).json({ error: 'Access denied. Doctor account required.' });
    }

    const result = await getDoctorReviews(doctorUid, page, limit, complaintsFilter);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch reviews'
    });
  }
};

/**
 * GET /api/reviews/my-rating
 * Get rating statistics for the logged-in doctor
 * Auth: Doctor only
 */
export const getMyRating = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user!.uid;

    // Verify user is a doctor
    const doctor = await prisma.doctor.findUnique({
      where: { uid: doctorUid }
    });

    if (!doctor) {
      return res.status(403).json({ error: 'Access denied. Doctor account required.' });
    }

    const rating = await getDoctorRating(doctorUid);

    return res.status(200).json(rating);
  } catch (error: any) {
    console.error('Error fetching rating:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch rating'
    });
  }
};

/**
 * GET /api/admin/reviews/complaints
 * Get all complaint reviews
 * Auth: Admin only
 */
export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getComplaintReviews(page, limit);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch complaints'
    });
  }
};

/**
 * PATCH /api/admin/reviews/:reviewId/action
 * Update admin notes and action taken for a complaint
 * Auth: Admin only
 */
export const updateComplaintActionController = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { adminNotes, adminActionTaken } = req.body;

    if (!adminNotes && !adminActionTaken) {
      return res.status(400).json({ 
        error: 'At least one field (adminNotes or adminActionTaken) is required'
      });
    }

    const updatedReview = await updateComplaintAction(
      reviewId,
      adminNotes,
      adminActionTaken
    );

    return res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      review: updatedReview
    });
  } catch (error: any) {
    console.error('Error updating complaint:', error);
    return res.status(400).json({ 
      error: error.message || 'Failed to update complaint'
    });
  }
};

/**
 * GET /api/reviews/check-eligibility/:appointmentId
 * Check if patient can review an appointment
 * Auth: Patient only
 */
export const checkReviewEligibility = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const { appointmentId } = req.params;

    const result = await canReviewAppointment(appointmentId, patientUid);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error checking eligibility:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to check eligibility'
    });
  }
};

/**
 * GET /api/reviews/my-written-reviews
 * Get all reviews written by the logged-in patient
 * Auth: Patient only
 */
export const getMyWrittenReviews = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Verify user is a patient
    const patient = await prisma.patient.findUnique({
      where: { uid: patientUid }
    });

    if (!patient) {
      return res.status(403).json({ error: 'Access denied. Patient account required.' });
    }

    const result = await getPatientReviews(patientUid, page, limit);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching patient reviews:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch reviews'
    });
  }
};

/**
 * GET /api/reviews/doctor/:doctorUid
 * Get public reviews for a specific doctor (for browsing)
 * Auth: None required (public endpoint)
 */
export const getDoctorPublicReviews = async (req: Request, res: Response) => {
  try {
    const { doctorUid } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getPublicDoctorReviews(doctorUid, page, limit);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching doctor reviews:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch reviews'
    });
  }
};

/**
 * GET /api/reviews/doctor/:doctorUid/rating
 * Get public rating for a specific doctor (for browsing)
 * Auth: None required (public endpoint)
 */
export const getDoctorPublicRating = async (req: Request, res: Response) => {
  try {
    const { doctorUid } = req.params;

    const result = await getPublicDoctorRating(doctorUid);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching doctor rating:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch rating'
    });
  }
};

/**
 * DELETE /api/reviews/:reviewId
 * Delete a review (patient can delete their own)
 * Auth: Patient only
 */
export const deleteReviewByPatient = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const patientUid = req.user!.uid;

    // Verify user is a patient
    const patient = await prisma.patient.findUnique({
      where: { uid: patientUid }
    });

    if (!patient) {
      return res.status(403).json({ error: 'Access denied. Patient account required.' });
    }

    // Get the review and verify ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        appointment: {
          select: {
            patientUid: true
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if the patient owns this review
    if (review.appointment.patientUid !== patientUid) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    const result = await deleteReview(reviewId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to delete review'
    });
  }
};

/**
 * DELETE /api/reviews/admin/:reviewId
 * Delete any review (admin can delete any inappropriate review)
 * Auth: Admin only (JWT)
 */
export const deleteReviewByAdmin = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const admin = (req as any).admin;

    if (!admin) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    // Get the review to verify it exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const result = await deleteReview(reviewId);

    return res.status(200).json({
      ...result,
      deletedBy: 'admin',
      adminUsername: admin.username
    });
  } catch (error: any) {
    console.error('Error deleting review (admin):', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to delete review'
    });
  }
};
