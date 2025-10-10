import express from 'express';
import multer from 'multer';
import { 
  submitVerification, 
  getVerification, 
  getAllVerifications,
  approveVerification,
  rejectVerification 
} from '../controllers/verificationController';
import { verifyToken } from '../middleware/verifyToken';
import { authenticateAdminFromHeaders } from '../middleware/adminAuth';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

const router = express.Router();

// Doctor routes (require auth token)
router.post('/', verifyToken, upload.fields([
  { name: 'cnicFront', maxCount: 1 },
  { name: 'cnicBack', maxCount: 1 },
  { name: 'verificationPhoto', maxCount: 1 },
  { name: 'degreeCertificate', maxCount: 1 },
  { name: 'pmdcCertificate', maxCount: 1 }
]), submitVerification);

router.get('/', verifyToken, getVerification);

// Admin routes (require admin auth)
router.get('/all', authenticateAdminFromHeaders, getAllVerifications);
router.patch('/approve/:uid', authenticateAdminFromHeaders, approveVerification);
router.patch('/reject/:uid', authenticateAdminFromHeaders, rejectVerification);

// Debug route to check specific verification (temporary)
router.get('/debug/:uid', authenticateAdminFromHeaders, async (req, res) => {
  const { uid } = req.params;
  console.log('[DEBUG] Checking verification for UID:', uid);
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const verification = await prisma.verification.findUnique({
      where: { doctorUid: uid },
      include: { doctor: true }
    });
    
    console.log('[DEBUG] Database result:', verification);
    
    res.json({
      uid,
      found: !!verification,
      data: verification
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
