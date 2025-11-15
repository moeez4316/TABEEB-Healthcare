import express from 'express';
import { loginAdmin, verifyAdminCredentials, getDashboardStats, getAllUsers, suspendUser, activateUser } from '../controllers/adminController';
import { authenticateAdminFromHeaders } from '../middleware/adminAuth';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/verify', verifyAdminCredentials);
router.get('/dashboard/stats', authenticateAdminFromHeaders, getDashboardStats);

// User management routes
router.get('/users', authenticateAdminFromHeaders, getAllUsers);
router.post('/users/suspend', authenticateAdminFromHeaders, suspendUser);
router.post('/users/activate', authenticateAdminFromHeaders, activateUser);

router.get('/protected-route', authenticateAdminFromHeaders, (req, res) => {
  res.json({ message: 'Access granted to admin area' });
});

export default router;
