import express from 'express';
import { verifyTokenOrAdmin } from '../middleware/verifyTokenOrAdmin';
import { uploadSignatureLimiter } from '../middleware/rateLimiter';
import { 
  getUploadSignature, 
  verifyUpload,
  getBatchSignatures 
} from '../controllers/uploadController';

const router = express.Router();

// Get signed upload parameters for a single file
// POST /api/upload/signature
// Body: { type: 'profile-image' | 'medical-record' | 'verification-doc' | 'chat-media', docType?: string }
// Rate limited: 20 requests per hour per user
router.post('/signature', verifyTokenOrAdmin, uploadSignatureLimiter, getUploadSignature);

// Get multiple signed upload parameters at once (for multi-file uploads like verification)
// POST /api/upload/signatures/batch
// Body: { uploads: [{ type, docType? }, ...] }
// Rate limited: 20 requests per hour per user
router.post('/signatures/batch', verifyTokenOrAdmin, uploadSignatureLimiter, getBatchSignatures);

// Verify that an upload was completed and belongs to the user
// POST /api/upload/verify
// Body: { publicId: string, type: string, resourceType?: string }
router.post('/verify', verifyTokenOrAdmin, verifyUpload);

export default router;
