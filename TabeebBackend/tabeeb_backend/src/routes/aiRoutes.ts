import express from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { chatWithAI, summarizeDocument } from '../controllers/aiController';
import {
  createSessionCtrl,
  listSessionsCtrl,
  getSessionCtrl,
  deleteSessionCtrl,
  renameSessionCtrl,
  sendSessionMessageCtrl,
} from '../controllers/aiSessionController';

const router = express.Router();

// Increase body size limit for AI routes (images can be large)
router.use(express.json({ limit: '15mb' }));

// All AI routes require authentication
router.use(verifyToken);

// Legacy stateless endpoints (still available)
router.post('/chat', chatWithAI);
router.post('/summarize', summarizeDocument);

// Session-based chat endpoints
router.post('/sessions', createSessionCtrl);
router.get('/sessions', listSessionsCtrl);
router.get('/sessions/:sessionId', getSessionCtrl);
router.delete('/sessions/:sessionId', deleteSessionCtrl);
router.patch('/sessions/:sessionId', renameSessionCtrl);
router.post('/sessions/:sessionId/messages', sendSessionMessageCtrl);

export default router;
