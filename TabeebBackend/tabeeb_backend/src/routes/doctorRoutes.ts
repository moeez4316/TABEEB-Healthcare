import express from 'express';
import multer from 'multer';
import {
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  restoreDoctor,
  getVerifiedDoctors,
  uploadDoctorProfileImage,
  deleteDoctorProfileImage,
} from '../controllers/doctorController';
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

router.post('/', verifyToken, upload.single('profileImage'), createDoctor);
router.get('/', verifyToken, getDoctor);
router.put('/', verifyToken, updateDoctor);
router.delete('/', verifyToken, deleteDoctor);
router.post('/restore', verifyToken, restoreDoctor);

// Profile image routes
router.post('/profile-image', verifyToken, upload.single('profileImage'), uploadDoctorProfileImage);
router.delete('/profile-image', verifyToken, deleteDoctorProfileImage);

// Public route to get verified doctors for patients
router.get('/verified', getVerifiedDoctors);

export default router;