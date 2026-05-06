import express from 'express';
import { sendOtp, verifyOtpCode, validateOtpCode, verifyMagicLink, resetPassword } from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Magic link — no rate limiter (one-time use OTP)
router.get('/verify-link', verifyMagicLink);

// All other auth routes are rate-limited
router.use(authLimiter);

// Email OTP flow
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpCode);
router.post('/validate-otp', validateOtpCode);
router.post('/reset-password', resetPassword);

export default router;
