import express from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { uploadRecord, getRecords, deleteRecord } from '../controllers/medicalRecordController';

const router = express.Router();

// POST /api/records - Create record after client-side Cloudinary upload
// Body: { publicId, resourceType, fileName, fileType, tags?, notes? }
router.post('/', verifyToken, uploadRecord);

// GET /api/records - Get all records for the authenticated user
router.get('/', verifyToken, getRecords);

// DELETE /api/records/:id - Delete a specific record
router.delete('/:id', verifyToken, deleteRecord);

export default router;
