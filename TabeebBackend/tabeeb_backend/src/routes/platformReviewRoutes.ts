import express from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { authenticateAdminFromHeaders } from '../middleware/adminAuth';
import {
  validateCreatePlatformReview,
  validateUpdatePlatformReviewStatus
} from '../middleware/platformReviewValidation';
import {
  createPlatformReviewController,
  getPublicPlatformReviewsController,
  checkMyPlatformReviewController,
  getAllPlatformReviewsAdminController,
  updatePlatformReviewStatusController,
  toggleFeaturedStatusController,
  deletePlatformReviewController
} from '../controllers/platformReviewController';

const router = express.Router();

// Public routes
router.get('/public', getPublicPlatformReviewsController);

// Authenticated routes (Patient or Doctor)
router.post(
  '/',
  verifyToken,
  validateCreatePlatformReview,
  createPlatformReviewController
);

router.get(
  '/my-review',
  verifyToken,
  checkMyPlatformReviewController
);

// Admin routes
router.get(
  '/admin',
  authenticateAdminFromHeaders,
  getAllPlatformReviewsAdminController
);

router.patch(
  '/admin/:id/status',
  authenticateAdminFromHeaders,
  validateUpdatePlatformReviewStatus,
  updatePlatformReviewStatusController
);

router.patch(
  '/admin/:id/featured',
  authenticateAdminFromHeaders,
  toggleFeaturedStatusController
);

router.delete(
  '/admin/:id',
  authenticateAdminFromHeaders,
  deletePlatformReviewController
);

export default router;
