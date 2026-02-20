import { APP_CONFIG } from './config/appConfig';

const API_URL = APP_CONFIG.API_URL;

export interface AIChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AIChatResponse {
  success: boolean;
  data?: {
    message: string;
    role: 'model';
  };
  error?: string;
}

export interface AISummarizeResponse {
  success: boolean;
  data?: {
    summary: string;
  };
  error?: string;
}

/**
 * Send a chat message to the AI medical assistant.
 */
export const sendAIChatMessage = async (
  token: string,
  message: string,
  conversationHistory: AIChatMessage[] = []
): Promise<AIChatResponse> => {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationHistory }),
    });

    if (response.status === 429 && attempt < maxRetries) {
      // Wait before retrying (3s, then 6s)
      await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
      continue;
    }

    const data = await response.json();
    return data;
  }
  return { success: false, error: 'AI service is busy. Please wait a moment and try again.' };
};

/**
 * Summarize a medical document (text or image).
 */
export const summarizeMedicalDocument = async (
  token: string,
  textContent?: string,
  imageData?: { mimeType: string; data: string }
): Promise<AISummarizeResponse> => {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`${API_URL}/api/ai/summarize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ textContent, imageData }),
    });

    if (response.status === 429 && attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
      continue;
    }

    const data = await response.json();
    return data;
  }
  return { success: false, error: 'AI service is busy. Please wait a moment and try again.' };
};

/**
 * Convert a File object to base64 data for the API.
 */
export const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = result.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
