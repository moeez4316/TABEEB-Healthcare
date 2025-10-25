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

// JSON body parser middleware (only for non-file routes)
const jsonParser = express.json();

// Doctor routes (require auth token) - File uploads (no JSON parsing)
router.post('/', verifyToken, upload.fields([
  { name: 'cnicFront', maxCount: 1 },
  { name: 'cnicBack', maxCount: 1 },
  { name: 'verificationPhoto', maxCount: 1 },
  { name: 'degreeCertificate', maxCount: 1 },
  { name: 'pmdcCertificate', maxCount: 1 }
]), submitVerification);

router.get('/', verifyToken, getVerification);

// Admin routes (require admin auth) - JSON data (need JSON parsing)
router.get('/all', authenticateAdminFromHeaders, getAllVerifications);
router.patch('/approve/:uid', jsonParser, authenticateAdminFromHeaders, approveVerification);
router.patch('/reject/:uid', jsonParser, authenticateAdminFromHeaders, rejectVerification);

export default router;
