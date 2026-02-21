import { Request, Response } from 'express';
import { sendChatMessage, summarizeMedicalDocument, searchMedicineAlternatives, ChatMessage } from '../services/aiService';

/**
 * POST /api/ai/chat
 * Send a message to the AI medical chatbot.
 * Body: { message: string, conversationHistory?: ChatMessage[] }
 */
export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string.',
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long. Please keep it under 5000 characters.',
      });
    }

    // Validate conversation history if provided
    const history: ChatMessage[] = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (
          msg.role &&
          (msg.role === 'user' || msg.role === 'model') &&
          msg.content &&
          typeof msg.content === 'string'
        ) {
          history.push({
            role: msg.role,
            content: msg.content.substring(0, 5000), // Truncate long history messages
          });
        }
      }
      // Limit conversation history to last 20 messages to manage token usage
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
    }

    const response = await sendChatMessage(message.trim(), history);

    return res.status(200).json({
      success: true,
      data: {
        message: response,
        role: 'model',
      },
    });
  } catch (error: any) {
    console.error('[AI Chat Error]:', error);
    console.error('[AI Chat Error] Message:', error.message);
    console.error('[AI Chat Error] Stack:', error.stack);

    if (error.message?.includes('API key')) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not configured. Please contact the administrator.',
      });
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

    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        error: 'AI service is temporarily rate-limited. Please wait a moment and try again.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to get AI response. Please try again.',
    });
  }
};

/**
 * POST /api/ai/summarize
 * Summarize a medical document (text or image).
 * Body: { textContent?: string, imageData?: { mimeType: string, data: string } }
 */
export const summarizeDocument = async (req: Request, res: Response) => {
  try {
    const { textContent, imageData } = req.body;

    if (!textContent && !imageData) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either text content or an image of a medical document.',
      });
    }

    // Validate text content
    if (textContent && typeof textContent !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text content must be a string.',
      });
    }

    if (textContent && textContent.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Document text is too long. Please keep it under 50,000 characters.',
      });
    }

    // Validate image data
    if (imageData) {
      if (!imageData.mimeType || !imageData.data) {
        return res.status(400).json({
          success: false,
          error: 'Image data must include mimeType and base64-encoded data.',
        });
      }

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!allowedMimeTypes.includes(imageData.mimeType)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported image type. Allowed types: ${allowedMimeTypes.join(', ')}`,
        });
      }

      // Check base64 size (rough limit ~10MB)
      const base64SizeBytes = (imageData.data.length * 3) / 4;
      if (base64SizeBytes > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Image is too large. Please use an image under 10MB.',
        });
      }
    }

    const summary = await summarizeMedicalDocument(
      textContent?.trim(),
      imageData
    );

    return res.status(200).json({
      success: true,
      data: {
        summary,
      },
    });
  } catch (error: any) {
    console.error('[AI Summarize Error]:', error);
    console.error('[AI Summarize Error] Message:', error.message);
    console.error('[AI Summarize Error] Stack:', error.stack);

    if (error.message?.includes('API key')) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not configured. Please contact the administrator.',
      });
    }

    if (error.message?.includes('SAFETY')) {
      return res.status(200).json({
        success: true,
        data: {
          summary: 'The document could not be summarized due to content safety guidelines. Please ensure it is a medical document.',
        },
      });
    }

    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        error: 'AI service is temporarily rate-limited. Please wait a moment and try again.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to summarize document. Please try again.',
    });
  }
};

/**
 * POST /api/ai/medicine-search
 * Search for medicine alternatives and pricing in Pakistan.
 * Body: { medicineName: string }
 */
export const searchMedicine = async (req: Request, res: Response) => {
  try {
    const { medicineName } = req.body;

    if (!medicineName || typeof medicineName !== 'string' || medicineName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Medicine name is required and must be a non-empty string.',
      });
    }

    if (medicineName.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Medicine name is too long. Please keep it under 200 characters.',
      });
    }

    const result = await searchMedicineAlternatives(medicineName.trim());

    return res.status(200).json({
      success: true,
      data: {
        result,
      },
    });
  } catch (error: any) {
    console.error('[Medicine Search Error]:', error);
    console.error('[Medicine Search Error] Message:', error.message);

    if (error.message?.includes('API key')) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not configured. Please contact the administrator.',
      });
    }

    if (error.message?.includes('SAFETY')) {
      return res.status(200).json({
        success: true,
        data: {
          result: 'The search could not be completed due to content safety guidelines. Please try a different medicine name.',
        },
      });
    }

    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        error: 'AI service is temporarily rate-limited. Please wait a moment and try again.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to search for medicine alternatives. Please try again.',
    });
  }
};
