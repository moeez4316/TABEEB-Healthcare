import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/verifyToken';
import { uploadImage } from '../controllers/uploadController';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Upload single image
router.post('/', verifyToken, upload.single('image'), uploadImage);

export default router;
