import express from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { chatWithAI, summarizeDocument } from '../controllers/aiController';

const router = express.Router();

// Increase body size limit for AI routes (images can be large)
router.use(express.json({ limit: '15mb' }));

// All AI routes require authentication
router.use(verifyToken);

// POST /api/ai/chat - Chat with AI medical assistant
router.post('/chat', chatWithAI);

// POST /api/ai/summarize - Summarize a medical document
router.post('/summarize', summarizeDocument);

export default router;
