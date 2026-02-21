import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { MEDICAL_CHAT_SYSTEM_PROMPT, MEDICAL_SUMMARIZE_SYSTEM_PROMPT, MEDICINE_SEARCH_SYSTEM_PROMPT, MEDICINE_IDENTIFY_PROMPT } from './aiPrompts';
import { searchDvago, formatDvagoResults } from '../utils/dvagoScraper';
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
 * Check whether the configured model is a Gemma model (which doesn't support systemInstruction).
 */
const isGemmaModel = (): boolean => {
  const modelName = (process.env.GEMINI_MODEL || '').toLowerCase();
  return modelName.startsWith('gemma');
};

/**
 * Get a fresh model instance.
 * For Gemini models: bakes systemInstruction into the model config.
 * For Gemma models:  skips systemInstruction (it will be prepended to history instead).
 */
const getModel = (systemInstruction: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.');
  }
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
  const genAI = new GoogleGenerativeAI(apiKey);

  // Gemma models don't support systemInstruction — we handle it differently
  if (isGemmaModel()) {
    return genAI.getGenerativeModel({ model: modelName });
  }

  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });
};

/**
 * Build the conversation history, prepending the system prompt for Gemma models.
 */
const buildHistory = (systemPrompt: string, conversationHistory: ChatMessage[]): Content[] => {
  const history: Content[] = [];

  // For Gemma: inject system prompt as the opening exchange
  if (isGemmaModel()) {
    history.push(
      { role: 'user', parts: [{ text: `[System Instructions — follow these at all times]\n\n${systemPrompt}` }] },
      { role: 'model', parts: [{ text: 'Understood. I will follow these instructions for all my responses.' }] },
    );
  }

  // Append the actual conversation
  for (const msg of conversationHistory) {
    history.push({
      role: msg.role,
      parts: [{ text: msg.content }],
    });
  }

  return history;
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

  // Build the conversation history (handles Gemma vs Gemini automatically)
  const history = buildHistory(MEDICAL_CHAT_SYSTEM_PROMPT, conversationHistory);

  const chat = model.startChat({
    history,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 1024,
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

  // For Gemma, prepend the system prompt into the user message
  if (isGemmaModel()) {
    parts.push({
      text: `[System Instructions]\n${MEDICAL_SUMMARIZE_SYSTEM_PROMPT}\n\n---\n\n`,
    });
  }

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
 *
 * Hybrid approach:
 * 1. Phase 1 — Ask LLM to identify the generic name + alternative brand names
 * 2. Phase 2 — Scrape dvago.pk for each brand name (real live prices)
 * 3. Phase 3 — Feed scraped data to LLM for beautiful markdown formatting
 */
export const searchMedicineAlternatives = async (
  medicineName: string
): Promise<string> => {
  // ── Phase 1: Identify generic name and alternative brands ──
  console.log(`[Medicine Search] Phase 1: Identifying alternatives for "${medicineName}"`);

  let genericName = '';
  let alternativeNames: string[] = [];

  try {
    const identifyModel = getModel(MEDICINE_IDENTIFY_PROMPT);

    const identifyHistory: Content[] = [];
    if (isGemmaModel()) {
      identifyHistory.push(
        {
          role: 'user',
          parts: [{ text: `[System Instructions]\n\n${MEDICINE_IDENTIFY_PROMPT}` }],
        },
        {
          role: 'model',
          parts: [{ text: '{"generic":"","alternatives":[]}' }],
        },
      );
    }

    const identifyChat = identifyModel.startChat({
      history: identifyHistory,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    });

    const identifyResult = await identifyChat.sendMessage(
      `Identify the generic name and alternative brands in Pakistan for: ${medicineName}`
    );
    const identifyText = identifyResult.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the JSON response
    const jsonMatch = identifyText.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      genericName = parsed.generic || '';
      alternativeNames = Array.isArray(parsed.alternatives) ? parsed.alternatives : [];
      console.log(`[Medicine Search] Generic: ${genericName}, Alternatives: ${alternativeNames.join(', ')}`);
    }
  } catch (err: any) {
    console.warn('[Medicine Search] Phase 1 failed (will proceed with direct search):', err.message);
    // Fallback: just use the medicine name itself
    alternativeNames = [medicineName];
  }

  // Always include the original search term
  if (!alternativeNames.map(n => n.toLowerCase()).includes(medicineName.toLowerCase())) {
    alternativeNames.unshift(medicineName);
  }

  // ── Phase 2: Scrape dvago.pk ──
  console.log(`[Medicine Search] Phase 2: Scraping dvago.pk for ${alternativeNames.length} brand names`);
  let scrapedProducts;
  let scrapedDataText = '';

  try {
    scrapedProducts = await searchDvago(medicineName, alternativeNames);
    scrapedDataText = formatDvagoResults(scrapedProducts);
    console.log(`[Medicine Search] Scraped ${scrapedProducts.length} products from dvago.pk`);
  } catch (err: any) {
    console.warn('[Medicine Search] Phase 2 scraping failed:', err.message);
  }

  // ── Phase 3: Format with LLM ──
  console.log('[Medicine Search] Phase 3: Formatting results with LLM');

  const model = getModel(MEDICINE_SEARCH_SYSTEM_PROMPT);

  const history: Content[] = [];
  if (isGemmaModel()) {
    history.push(
      {
        role: 'user',
        parts: [{ text: `You are a Pakistani pharmacy expert. Follow these instructions for ALL responses:\n\n${MEDICINE_SEARCH_SYSTEM_PROMPT}` }],
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I will format the medicine data using the exact markdown template with real price data from dvago.pk.' }],
      },
    );
  }

  const chat = model.startChat({
    history,
    generationConfig: {
      temperature: 0.2,
      topP: 0.85,
      topK: 40,
      maxOutputTokens: 4096,
    },
  });

  // Build the final prompt with scraped data
  let userPrompt: string;

  if (scrapedDataText) {
    userPrompt = `Find alternatives for: **${medicineName}**${genericName ? ` (Generic: ${genericName})` : ''}

Here is REAL-TIME scraped data from dvago.pk — use these EXACT prices and product names:

${scrapedDataText}

Format this data into a beautiful markdown response following your template. Use the real prices and real product names from above. Include the [View](url) links. Identify the generic name and drug class yourself. Sort by price (cheapest first).`;
  } else {
    // Fallback: no scraped data — ask LLM to do its best
    userPrompt = `Find all alternative medicines and their estimated prices in Pakistan for: **${medicineName}**

⚠️ Note: Live price data from dvago.pk was unavailable. Use your knowledge to list alternatives with ESTIMATED prices. Clearly mark all prices as "Estimated".

Respond with:
1. The generic name, drug class, and common uses
2. A markdown table of alternatives with columns: Brand Name, Manufacturer, Strength & Form, Pack Size, Estimated Price in PKR
3. Key notes about availability
4. Disclaimer about verifying prices`;
  }

  const result = await chat.sendMessage(userPrompt);
  const response = result.response;

  if (response.promptFeedback?.blockReason) {
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
