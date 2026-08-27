import { Request, Response } from 'express';
import {
  createSession,
  listSessions,
  getSessionWithMessages,
  deleteSession,
  renameSession,
  sendSessionMessage,
  sendSessionMessageStream,
} from '../services/aiSessionService';

/**
 * POST /api/ai/sessions
 * Create a new chat session.
 * Body: { title?: string }
 */
export const createSessionCtrl = async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { title } = req.body;
    const session = await createSession(userUid, title);

    return res.status(201).json({ success: true, data: session });
  } catch (error: any) {
    console.error('[AI Session Create Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to create session.' });
  }
};

/**
 * GET /api/ai/sessions
 * List all sessions for the current user.
 */
export const listSessionsCtrl = async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const sessions = await listSessions(userUid);
    return res.status(200).json({ success: true, data: sessions });
  } catch (error: any) {
    console.error('[AI Session List Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to list sessions.' });
  }
};

/**
 * GET /api/ai/sessions/:sessionId
 * Get a session with its messages.
 * Query: ?limit=50&cursor=<messageId>
 */
export const getSessionCtrl = async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { sessionId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const cursor = req.query.cursor as string | undefined;

    const session = await getSessionWithMessages(sessionId, userUid, limit, cursor);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    return res.status(200).json({ success: true, data: session });
  } catch (error: any) {
    console.error('[AI Session Get Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to get session.' });
  }
};

/**
 * DELETE /api/ai/sessions/:sessionId
 * Delete a session and all its messages.
 */
export const deleteSessionCtrl = async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { sessionId } = req.params;
    const deleted = await deleteSession(sessionId, userUid);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    return res.status(200).json({ success: true, message: 'Session deleted.' });
  } catch (error: any) {
    console.error('[AI Session Delete Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to delete session.' });
  }
};

/**
 * PATCH /api/ai/sessions/:sessionId
 * Rename a session.
 * Body: { title: string }
 */
export const renameSessionCtrl = async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { sessionId } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Title is required.' });
    }

    const session = await renameSession(sessionId, userUid, title.trim().substring(0, 200));
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    return res.status(200).json({ success: true, data: session });
  } catch (error: any) {
    console.error('[AI Session Rename Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to rename session.' });
  }
};

/**
 * POST /api/ai/sessions/:sessionId/messages
 * Send a message within a session.
 * Body: { message: string }
 */
export const sendSessionMessageCtrl = async (req: Request, res: Response) => {
  if (req.query.stream === 'true') {
    return sendSessionMessageStreamCtrl(req, res);
  }

  try {
    const userUid = req.user?.uid;
    if (!userUid) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ success: false, error: 'Message is too long. Max 5000 characters.' });
    }

    const result = await sendSessionMessage(sessionId, userUid, message.trim());

    return res.status(200).json({
      success: true,
      data: {
        message: result.message,
        messageId: result.messageId,
        role: 'model',
      },
    });
  } catch (error: any) {
    console.error('[AI Session Message Error]:', error.message);

    if (error.message === 'Session not found') {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    if (error.message?.includes('SAFETY')) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'I cannot respond to that query due to safety guidelines. Please rephrase your question about a medical or health topic.',
          role: 'model',
        },
      });
    }

    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        error: 'AI service is temporarily rate-limited. Please wait a moment and try again.',
      });
    }

    return res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
};

/**
 * POST /api/ai/sessions/:sessionId/messages/stream or /api/ai/sessions/:sessionId/messages?stream=true
 * Stream a message response within a session using SSE.
 */
export const sendSessionMessageStreamCtrl = async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ success: false, error: 'Message is too long. Max 5000 characters.' });
    }

    // Set SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const result = await sendSessionMessageStream(
      sessionId,
      userUid,
      message.trim(),
      (chunkText) => {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    );

    res.write(`data: ${JSON.stringify({ done: true, messageId: result.messageId, fullText: result.message, role: 'model' })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('[AI Session Stream Error]:', error.message);
    if (!res.headersSent) {
      if (error.message === 'Session not found') {
        return res.status(404).json({ success: false, error: 'Session not found.' });
      }
      return res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
    res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
};
