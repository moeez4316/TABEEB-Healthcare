import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/verifyToken';
import { uploadRecord, getRecords, deleteRecord } from '../controllers/medicalRecordController';

const router = express.Router();

// Configure multer with file size limit for medical records
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for medical records (PDFs, images)
  },
  fileFilter: (req, file, cb) => {
    // Allow common medical document formats
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPG, PNG, GIF) and PDF files are allowed'));
    }
  }
});


router.post('/', verifyToken, upload.single('file'), uploadRecord);
router.get('/', verifyToken, getRecords);
router.delete('/:id', verifyToken, deleteRecord);

export default router;
