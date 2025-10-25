import express from 'express';
import multer from 'multer';
import {
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  uploadPatientProfileImage,
  deletePatientProfileImage,
} from '../controllers/patientController';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

// JSON body parser middleware (only for non-file routes)
const jsonParser = express.json();

// Configure multer for profile image uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Patient profile routes
router.post('/', verifyToken, upload.single('profileImage'), createPatient);
router.get('/', verifyToken, getPatient);
router.put('/', jsonParser, verifyToken, updatePatient);
router.delete('/', jsonParser, verifyToken, deletePatient);

// Profile image routes
router.post('/profile-image', verifyToken, upload.single('profileImage'), uploadPatientProfileImage);
router.delete('/profile-image', jsonParser, verifyToken, deletePatientProfileImage);

export default router;
