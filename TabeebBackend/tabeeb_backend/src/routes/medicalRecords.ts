import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/verifyToken';
import { uploadRecord, getRecords, deleteRecord } from '../controllers/medicalRecordController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


router.post('/', verifyToken, upload.single('file'), uploadRecord);
router.get('/', verifyToken, getRecords);
router.delete('/:id', verifyToken, deleteRecord);

export default router;
