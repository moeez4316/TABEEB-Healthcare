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

// ─── Session Types ──────────────────────────────────────────────────────────

export interface AISession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

export interface AISessionMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export interface AISessionDetail {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AISessionMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

// ─── Helper: fetch with retry on 429 ────────────────────────────────────────

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries = 2
): Promise<Response> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status === 429 && attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
      continue;
    }
    return response;
  }
  // Shouldn't reach here, but just in case
  return fetch(url, options);
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

// ─── Legacy Stateless Endpoints (kept for summarize) ────────────────────────

/**
 * Send a chat message to the AI medical assistant (stateless, no session).
 */
export const sendAIChatMessage = async (
  token: string,
  message: string,
  conversationHistory: AIChatMessage[] = []
): Promise<AIChatResponse> => {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ message, conversationHistory }),
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

/**
 * Summarize a medical document (text or image).
 */
export const summarizeMedicalDocument = async (
  token: string,
  textContent?: string,
  imageData?: { mimeType: string; data: string }
): Promise<AISummarizeResponse> => {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/ai/summarize`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ textContent, imageData }),
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

/**
 * Convert a File object to base64 data for the API.
 */
export const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({ mimeType: file.type, data: base64Data });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ─── Session-Based Chat Endpoints ───────────────────────────────────────────

/**
 * Create a new AI chat session.
 */
export const createAISession = async (
  token: string,
  title?: string
): Promise<{ success: boolean; data?: AISession; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/ai/sessions`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ title }),
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Failed to create session.' };
  }
};

/**
 * List all AI chat sessions.
 */
export const listAISessions = async (
  token: string
): Promise<{ success: boolean; data?: AISession[]; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/ai/sessions`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Failed to load sessions.' };
  }
};

/**
 * Get a session with its messages.
 */
export const getAISession = async (
  token: string,
  sessionId: string,
  limit?: number,
  cursor?: string
): Promise<{ success: boolean; data?: AISessionDetail; error?: string }> => {
  try {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);
    const qs = params.toString();
    const response = await fetch(`${API_URL}/api/ai/sessions/${sessionId}${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Failed to load session.' };
  }
};

/**
 * Delete an AI chat session.
 */
export const deleteAISession = async (
  token: string,
  sessionId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/ai/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Failed to delete session.' };
  }
};

/**
 * Rename an AI chat session.
 */
export const renameAISession = async (
  token: string,
  sessionId: string,
  title: string
): Promise<{ success: boolean; data?: AISession; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/ai/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ title }),
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Failed to rename session.' };
  }
};

/**
 * Send a message within a session (persistent, with smart context).
 */
export const sendSessionChatMessage = async (
  token: string,
  sessionId: string,
  message: string
): Promise<AIChatResponse> => {
  try {
    const response = await fetchWithRetry(
      `${API_URL}/api/ai/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ message }),
      }
    );
    return await response.json();
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
};
