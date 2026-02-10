import express from 'express';
import { sendOtp, verifyOtpCode, verifyMagicLink, resetPassword, sendPhoneResetOtp, resetPhonePassword } from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Magic link — no rate limiter (one-time use OTP)
router.get('/verify-link', verifyMagicLink);

// All other auth routes are rate-limited
router.use(authLimiter);

// Email OTP flow
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpCode);
router.post('/reset-password', resetPassword);

// Phone user password reset (sends OTP to their real email)
router.post('/phone/send-reset-otp', sendPhoneResetOtp);
router.post('/phone/reset-password', resetPhonePassword);

export default router;
