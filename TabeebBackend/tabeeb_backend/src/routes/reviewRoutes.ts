import express from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { authenticateAdminFromHeaders } from '../middleware/adminAuth';
import {
  validateCreateReview,
  validateUpdateComplaintAction,
  validateReviewId,
  checkDoctorRole,
  checkPatientRole,
  validatePaginationParams
} from '../middleware/reviewValidation';
import {
  createReviewController,
  getMyReviews,
  getMyRating,
  getAllComplaints,
  updateComplaintActionController,
  checkReviewEligibility,
  getMyWrittenReviews,
  getDoctorPublicReviews,
  getDoctorPublicRating,
  deleteReviewByPatient,
  deleteReviewByAdmin
} from '../controllers/reviewController';

const router = express.Router();

// Patient routes - Create review
router.post(
  '/create',
  verifyToken,
  checkPatientRole,
  validateCreateReview,
  createReviewController
);

// Patient routes - Check if can review
router.get(
  '/check-eligibility/:appointmentId',
  verifyToken,
  checkPatientRole,
  checkReviewEligibility
);

// Patient routes - Get own written reviews
router.get(
  '/my-written-reviews',
  verifyToken,
  checkPatientRole,
  validatePaginationParams,
  getMyWrittenReviews
);

// Patient routes - Delete own review
router.delete(
  '/:reviewId',
  verifyToken,
  checkPatientRole,
  validateReviewId,
  deleteReviewByPatient
);

// Public routes - Get doctor reviews (no auth required)
router.get(
  '/doctor/:doctorUid',
  validatePaginationParams,
  getDoctorPublicReviews
);

// Public routes - Get doctor rating (no auth required)
router.get(
  '/doctor/:doctorUid/rating',
  getDoctorPublicRating
);

// Doctor routes - Get own reviews
router.get(
  '/my-reviews',
  verifyToken,
  checkDoctorRole,
  validatePaginationParams,
  getMyReviews
);

// Doctor routes - Get own rating
router.get(
  '/my-rating',
  verifyToken,
  checkDoctorRole,
  getMyRating
);

// Admin routes - Get all complaints
router.get(
  '/admin/complaints',
  authenticateAdminFromHeaders,
  validatePaginationParams,
  getAllComplaints
);

// Admin routes - Update complaint action
router.patch(
  '/admin/:reviewId/action',
  authenticateAdminFromHeaders,
  validateReviewId,
  validateUpdateComplaintAction,
  updateComplaintActionController
);

// Admin routes - Delete any review
router.delete(
  '/admin/:reviewId',
  authenticateAdminFromHeaders,
  validateReviewId,
  deleteReviewByAdmin
);

export default router;
