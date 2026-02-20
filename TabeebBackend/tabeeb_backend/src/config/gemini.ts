import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[Gemini] WARNING: GEMINI_API_KEY is not set. AI features will not work.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Get a Gemini generative model instance.
 * Uses Gemini 2.0 Flash for fast, cost-effective responses.
 */
export const getGeminiModel = () => {
  if (!genAI) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.');
  }
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

export default genAI;
