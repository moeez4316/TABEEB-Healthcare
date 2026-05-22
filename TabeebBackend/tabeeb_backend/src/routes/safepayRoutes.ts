import express from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { createPaymentSession, verifyPayment } from '../controllers/safepayController';
import { handleSafepayWebhook, handleSafepayRedirect } from '../controllers/webhookController';

const router = express.Router();

// Webhook and Redirect routes (NO verifyToken, SafePay server hits these directly)
// We use express.json() in the main app to parse body, so it will be available here
router.post('/webhook', handleSafepayWebhook);
router.get('/redirect', handleSafepayRedirect);
router.post('/redirect', handleSafepayRedirect);

// Protected routes (requires user authentication)
router.use(verifyToken);
router.post('/create-session', createPaymentSession);
router.get('/verify-payment/:appointmentId', verifyPayment);

export default router;
