import express from 'express';
import {
  loginAdmin,
  verifyAdminCredentials,
  verifyAdminTwoFactor,
  logoutAdmin,
  getCurrentAdminProfile,
  changeCurrentAdminPassword,
  getAdminDirectory,
  createAdminAccountBySuperAdmin,
  deleteAdminAccountBySuperAdmin,
  updateAdminBlockStatus,
  getDashboardStats,
  getAllUsers,
  suspendUser,
  activateUser,
  getAllDoctors,
} from '../controllers/adminController';
import {
  authenticateAdminFromHeaders,
  requireAdminPermission,
  requireSuperAdmin,
} from '../middleware/adminAuth';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/login/verify-2fa', verifyAdminTwoFactor);
router.post('/verify', verifyAdminCredentials);
router.post('/logout', authenticateAdminFromHeaders, logoutAdmin);
router.get('/me', authenticateAdminFromHeaders, getCurrentAdminProfile);
router.post('/password/change', authenticateAdminFromHeaders, changeCurrentAdminPassword);
router.get('/dashboard/stats', authenticateAdminFromHeaders, getDashboardStats);

// User management routes
router.get('/users', authenticateAdminFromHeaders, getAllUsers);
router.post('/users/suspend', authenticateAdminFromHeaders, suspendUser);
router.post('/users/activate', authenticateAdminFromHeaders, activateUser);

// Admin management routes
router.get('/admins', authenticateAdminFromHeaders, getAdminDirectory);
router.post('/admins', authenticateAdminFromHeaders, requireSuperAdmin, createAdminAccountBySuperAdmin);
router.delete('/admins/:adminId', authenticateAdminFromHeaders, requireSuperAdmin, deleteAdminAccountBySuperAdmin);
router.patch(
  '/admins/:adminId/block',
  authenticateAdminFromHeaders,
  requireAdminPermission('admin.block'),
  updateAdminBlockStatus
);

// Doctor management routes
router.get('/doctors', authenticateAdminFromHeaders, getAllDoctors);

router.get('/protected-route', authenticateAdminFromHeaders, (req, res) => {
  res.json({ message: 'Access granted to admin area' });
});

export default router;
