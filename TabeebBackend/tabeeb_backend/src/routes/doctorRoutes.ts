import express from 'express';
import multer from 'multer';
import {
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  getVerifiedDoctors,
} from '../controllers/doctorController';
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

router.post('/', verifyToken, upload.single('profileImage'), createDoctor);
router.get('/', verifyToken, getDoctor);
router.put('/', jsonParser, verifyToken, updateDoctor);
router.delete('/', jsonParser, verifyToken, deleteDoctor);

// Public route to get verified doctors for patients
router.get('/verified', getVerifiedDoctors);

export default router;