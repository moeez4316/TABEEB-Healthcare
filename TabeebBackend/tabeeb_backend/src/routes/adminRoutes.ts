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
  requireAnyAdminPermission,
  requireAdminPermission,
  requireSuperAdmin,
} from '../middleware/adminAuth';
import {
  deleteMessage,
  getAllContactMessages,
  getContactMessage,
  getUnreadCount,
  replyToMessage,
  updateMessageStatus,
} from '../controllers/contactMessageController';

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

// Admin inbox routes
router.get(
  '/inbox/messages',
  authenticateAdminFromHeaders,
  requireAdminPermission('mailbox.read'),
  getAllContactMessages
);
router.get(
  '/inbox/messages/unread-count',
  authenticateAdminFromHeaders,
  requireAdminPermission('mailbox.read'),
  getUnreadCount
);
router.get(
  '/inbox/messages/:id',
  authenticateAdminFromHeaders,
  requireAdminPermission('mailbox.read'),
  getContactMessage
);
router.patch(
  '/inbox/messages/:id/status',
  authenticateAdminFromHeaders,
  requireAnyAdminPermission(['mailbox.reply', 'mailbox.manage']),
  updateMessageStatus
);
router.post(
  '/inbox/messages/:id/reply',
  authenticateAdminFromHeaders,
  requireAdminPermission('mailbox.reply'),
  replyToMessage
);
router.delete(
  '/inbox/messages/:id',
  authenticateAdminFromHeaders,
  requireAdminPermission('mailbox.manage'),
  deleteMessage
);

router.get('/protected-route', authenticateAdminFromHeaders, (req, res) => {
  res.json({ message: 'Access granted to admin area' });
});

export default router;
