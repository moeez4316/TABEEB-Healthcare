import express from 'express';
import { loginAdmin, verifyAdminCredentials, getDashboardStats } from '../controllers/adminController';
import { authenticateAdminFromHeaders } from '../middleware/adminAuth';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/verify', verifyAdminCredentials);
router.get('/dashboard/stats', authenticateAdminFromHeaders, getDashboardStats);
router.get('/protected-route', authenticateAdminFromHeaders, (req, res) => {
  res.json({ message: 'Access granted to admin area' });
});

export default router;
