import express from 'express';
import { 
  submitVerification, 
  getVerification, 
  getAllVerifications,
  approveVerification,
  rejectVerification 
} from '../controllers/verificationController';
import { pmdcLookup, pmdcRefresh, pmdcClearExpiredCache } from '../controllers/pmdcController';
import { verifyToken } from '../middleware/verifyToken';
import { authenticateAdminFromHeaders } from '../middleware/adminAuth';
import { verificationLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Doctor routes (require auth token) - Now accepts JSON body with Cloudinary publicIds
// POST /api/verification
// Body: { pmdcNumber, cnicNumber, documents: { cnicFront, cnicBack?, verificationPhoto, degreeCertificate, pmdcCertificate } }
// Rate limited: 3 submissions per day
router.post('/', verifyToken, verificationLimiter, submitVerification);

router.get('/', verifyToken, getVerification);

// Admin routes (require admin auth)
router.get('/all', authenticateAdminFromHeaders, getAllVerifications);
router.patch('/approve/:uid', authenticateAdminFromHeaders, approveVerification);
router.patch('/reject/:uid', authenticateAdminFromHeaders, rejectVerification);

// PMDC lookup routes (admin only) - Fetch doctor info from PMDC website
router.get('/pmdc-lookup/:pmdcNumber', authenticateAdminFromHeaders, pmdcLookup);
router.post('/pmdc-refresh/:pmdcNumber', authenticateAdminFromHeaders, pmdcRefresh);
router.delete('/pmdc-cache/expired', authenticateAdminFromHeaders, pmdcClearExpiredCache);

export default router;
