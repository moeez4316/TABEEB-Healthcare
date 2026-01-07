import express from 'express';
import multer from 'multer';
import {
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  restorePatient,
  uploadPatientProfileImage,
  deletePatientProfileImage,
} from '../controllers/patientController';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

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
router.put('/', verifyToken, updatePatient);
router.delete('/', verifyToken, deletePatient);
router.post('/restore', verifyToken, restorePatient);

// Profile image routes
router.post('/profile-image', verifyToken, upload.single('profileImage'), uploadPatientProfileImage);
router.delete('/profile-image', verifyToken, deletePatientProfileImage);

export default router;
