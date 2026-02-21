import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { MEDICAL_CHAT_SYSTEM_PROMPT, MEDICAL_SUMMARIZE_SYSTEM_PROMPT, MEDICINE_SEARCH_SYSTEM_PROMPT } from './aiPrompts';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Represents a single message in the conversation history.
 */
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  imageData?: {
    mimeType: string;
    data: string; // base64 encoded
  };
}

/**
 * Get a fresh model instance with system instruction baked in.
 */
const getModel = (systemInstruction: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.');
  }
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });
};

/**
 * Send a medical chat message with conversation history.
 * Multi-turn chat with full context maintained.
 */
export const sendChatMessage = async (
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> => {
  const model = getModel(MEDICAL_CHAT_SYSTEM_PROMPT);

  // Build the conversation history in Gemini's format
  const history: Content[] = conversationHistory.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048,
    },
  });

  const result = await chat.sendMessage(message);
  const response = result.response;

  // Check for safety blocking
  if (response.promptFeedback?.blockReason) {
    console.warn('[AI Chat] Response blocked:', response.promptFeedback.blockReason);
    return 'I apologize, but I cannot respond to that query. Please rephrase your question about a medical or health topic.';
  }

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    console.warn('[AI Chat] No candidates in response');
    return 'I was unable to generate a response. Please try rephrasing your question.';
  }

  const text = candidates[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.warn('[AI Chat] Empty text in candidate:', JSON.stringify(candidates[0]?.finishReason));
    return 'I was unable to generate a response. Please try again.';
  }

  return text;
};

/**
 * Summarize a medical document (text or image).
 * Supports text input and base64-encoded images.
 */
export const summarizeMedicalDocument = async (
  textContent?: string,
  imageData?: { mimeType: string; data: string }
): Promise<string> => {
  if (!textContent && !imageData) {
    throw new Error('Please provide either text content or an image of a medical document to summarize.');
  }

  const model = getModel(MEDICAL_SUMMARIZE_SYSTEM_PROMPT);

  const parts: Part[] = [];

  // Add the user request
  parts.push({
    text: 'Please summarize the following medical document:\n\n',
  });

  // Add text content if provided
  if (textContent) {
    parts.push({ text: textContent });
  }

  // Add image if provided (for medical report images)
  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: imageData.mimeType,
        data: imageData.data,
      },
    });
    if (!textContent) {
      parts.push({ text: '\n\nPlease extract and summarize all medical information from this image.' });
    }
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.3, // Lower temperature for factual summarization
      topP: 0.8,
      topK: 30,
      maxOutputTokens: 4096,
    },
  });

  const response = result.response;

  // Check for safety blocking
  if (response.promptFeedback?.blockReason) {
    console.warn('[AI Summarize] Response blocked:', response.promptFeedback.blockReason);
    return 'The document could not be summarized due to content policy. Please ensure it is a medical document.';
  }

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    console.warn('[AI Summarize] No candidates in response');
    return 'Unable to summarize the document. Please try again.';
  }

  const text = candidates[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.warn('[AI Summarize] Empty text in candidate:', JSON.stringify(candidates[0]?.finishReason));
    return 'Unable to generate a summary. Please try again.';
  }

  return text;
};

/**
 * Search for medicine alternatives and pricing in Pakistan.
 * Uses the same Gemini model with a specialised medicine-search prompt.
 */
export const searchMedicineAlternatives = async (
  medicineName: string
): Promise<string> => {
  const model = getModel(MEDICINE_SEARCH_SYSTEM_PROMPT);

  const prompt = `Find alternative medicines and estimated prices in Pakistan for: "${medicineName}"

Please provide:
1. The generic/active ingredient name
2. All available alternative brands in Pakistan with the same composition
3. Estimated prices in PKR (Pakistani Rupees)
4. Manufacturer / pharmaceutical company for each
5. Available strengths and dosage forms

Format the results in the structured table format as specified in your instructions.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      topK: 30,
      maxOutputTokens: 4096,
    },
  });

  const response = result.response;

  if (response.promptFeedback?.blockReason) {
    console.warn('[Medicine Search] Response blocked:', response.promptFeedback.blockReason);
    return 'The search could not be completed due to content policy. Please try a different medicine name.';
  }

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    console.warn('[Medicine Search] No candidates in response');
    return 'Unable to find results. Please try again with a different medicine name.';
  }

  const resultText = candidates[0]?.content?.parts?.[0]?.text;
  if (!resultText) {
    console.warn('[Medicine Search] Empty text in candidate:', JSON.stringify(candidates[0]?.finishReason));
    return 'Unable to generate results. Please try again.';
  }

  return resultText;
};
