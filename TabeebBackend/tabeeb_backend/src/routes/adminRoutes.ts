import express from 'express';
import { loginAdmin, verifyAdminCredentials, getDashboardStats, getAllUsers, suspendUser, activateUser, getAllDoctors } from '../controllers/adminController';
import { authenticateAdminFromHeaders } from '../middleware/adminAuth';
import {
  getAllContactMessages,
  getContactMessage,
  updateMessageStatus,
  replyToMessage,
  deleteMessage,
  getUnreadCount,
} from '../controllers/contactMessageController';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/verify', verifyAdminCredentials);
router.get('/dashboard/stats', authenticateAdminFromHeaders, getDashboardStats);

// User management routes
router.get('/users', authenticateAdminFromHeaders, getAllUsers);
router.post('/users/suspend', authenticateAdminFromHeaders, suspendUser);
router.post('/users/activate', authenticateAdminFromHeaders, activateUser);

// Doctor management routes
router.get('/doctors', authenticateAdminFromHeaders, getAllDoctors);

// Contact messages / inbox routes
router.get('/messages', authenticateAdminFromHeaders, getAllContactMessages);
router.get('/messages/unread-count', authenticateAdminFromHeaders, getUnreadCount);
router.get('/messages/:id', authenticateAdminFromHeaders, getContactMessage);
router.patch('/messages/:id/status', authenticateAdminFromHeaders, updateMessageStatus);
router.post('/messages/:id/reply', authenticateAdminFromHeaders, replyToMessage);
router.delete('/messages/:id', authenticateAdminFromHeaders, deleteMessage);

router.get('/protected-route', authenticateAdminFromHeaders, (req, res) => {
  res.json({ message: 'Access granted to admin area' });
});

export default router;
