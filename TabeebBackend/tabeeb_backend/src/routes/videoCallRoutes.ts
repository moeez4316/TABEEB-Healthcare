import express from 'express';
import { verifyToken } from '../middleware/verifyToken';
import {
  initiateVideoCall,
  getVideoCallToken,
  updateVideoCallStatus,
  getVideoCallDetails,
  getUserVideoCalls,
} from '../controllers/videoCallController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * POST /api/video-calls/initiate
 * Initiate a video call for an appointment
 * Body: { appointmentId: string }
 */
router.post('/initiate', initiateVideoCall);

/**
 * GET /api/video-calls/token/:appointmentId
 * Get/regenerate video call token for an appointment
 */
router.get('/token/:appointmentId', getVideoCallToken);

/**
 * PATCH /api/video-calls/:appointmentId/status
 * Update video call status
 * Body: { action: 'join' | 'start' | 'end' | 'cancel' | 'failed' }
 */
router.patch('/:appointmentId/status', updateVideoCallStatus);

/**
 * GET /api/video-calls/:appointmentId
 * Get video call details for an appointment
 */
router.get('/:appointmentId', getVideoCallDetails);

/**
 * GET /api/video-calls
 * Get all video calls for the authenticated user
 * Query params: ?status=SCHEDULED|IN_PROGRESS|COMPLETED|CANCELLED|FAILED|NO_SHOW
 */
router.get('/', getUserVideoCalls);

export default router;
