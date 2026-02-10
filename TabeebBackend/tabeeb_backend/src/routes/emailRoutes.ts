import { Router } from 'express';
import { sendTestEmail, handleContactForm } from '../controllers/emailController';
import { handleResendWebhook } from '../controllers/webhookController';

const router = Router();

// ========================================
// WEBHOOK ENDPOINT (Resend sends events here)
// This is the public endpoint - no auth required
// Resend verifies via svix signature
// ========================================
router.post('/webhook', handleResendWebhook);

// ========================================
// EMAIL ENDPOINTS
// ========================================

// Send test email (for testing only - protect in production)
router.post('/send-test', sendTestEmail);

// Contact form - public endpoint
router.post('/contact', handleContactForm);

export default router;
