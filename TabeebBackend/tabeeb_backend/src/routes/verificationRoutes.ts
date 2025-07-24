import express from 'express';
import { submitVerification, getVerification, approveVerification } from '../controllers/verificationController';
import { verifyToken } from '../middleware/verifyToken';
import { authenticateAdminFromHeaders } from '../middleware/adminAuth';

const router = express.Router();

router.post('/', verifyToken, submitVerification);
router.get('/', verifyToken, getVerification);
router.patch('/approve/:uid', authenticateAdminFromHeaders, approveVerification);

export default router;
