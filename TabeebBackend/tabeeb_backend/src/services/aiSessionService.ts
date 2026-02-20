import prisma from '../lib/prisma';
import { sendChatMessage, ChatMessage } from './aiService';

const MAX_RECENT_MESSAGES = 40; // Messages sent to Gemini in full
const SUMMARIZE_THRESHOLD = 60; // When to trigger rolling summarization
const SUMMARIZE_BATCH = 30; // How many old messages to compress per summarization

/**
 * Create a new AI chat session for a user.
 */
export const createSession = async (userUid: string, title?: string) => {
  return prisma.aIChatSession.create({
    data: {
      userUid,
      title: title || 'New Chat',
    },
  });
};

/**
 * List all sessions for a user, most recently active first.
 */
export const listSessions = async (userUid: string) => {
  return prisma.aIChatSession.findMany({
    where: { userUid },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
};

/**
 * Get a session with its messages (paginated, most recent first then reversed).
 */
export const getSessionWithMessages = async (
  sessionId: string,
  userUid: string,
  limit = 50,
  cursor?: string
) => {
  // Verify ownership
  const session = await prisma.aIChatSession.findFirst({
    where: { id: sessionId, userUid },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  if (!session) return null;

  const messages = await prisma.aIChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, role: true, content: true, createdAt: true },
  });

  // Return messages in chronological order
  return {
    ...session,
    messages: messages.reverse(),
    hasMore: messages.length === limit,
    nextCursor: messages.length === limit ? messages[0]?.id : undefined,
  };
};

/**
 * Delete a session and all its messages (cascade).
 */
export const deleteSession = async (sessionId: string, userUid: string) => {
  const session = await prisma.aIChatSession.findFirst({
    where: { id: sessionId, userUid },
  });
  if (!session) return false;

  await prisma.aIChatSession.delete({ where: { id: sessionId } });
  return true;
};

/**
 * Rename a session.
 */
export const renameSession = async (sessionId: string, userUid: string, title: string) => {
  const session = await prisma.aIChatSession.findFirst({
    where: { id: sessionId, userUid },
  });
  if (!session) return null;

  return prisma.aIChatSession.update({
    where: { id: sessionId },
    data: { title },
  });
};

/**
 * Auto-generate a title from the first user message using Gemini.
 */
const generateSessionTitle = async (firstMessage: string): Promise<string> => {
  try {
    const titlePrompt =
      'Generate a short, concise title (max 6 words) for a medical chat that started with this message. Return ONLY the title, nothing else:\n\n' +
      firstMessage.substring(0, 300);
    const title = await sendChatMessage(titlePrompt, []);
    // Clean up: remove quotes, limit length
    const cleaned = title.replace(/^["']|["']$/g, '').trim().substring(0, 100);
    return cleaned || 'Medical Chat';
  } catch {
    return 'Medical Chat';
  }
};

/**
 * Build the optimized conversation history for Gemini:
 * [rolling summary] + [last N messages]
 */
const buildSmartHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const session = await prisma.aIChatSession.findUnique({
    where: { id: sessionId },
    select: { contextSummary: true, summarizedUpTo: true },
  });

  // Get all unsummarized messages
  const allMessages = await prisma.aIChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true },
  });

  const history: ChatMessage[] = [];

  // Prepend the rolling summary as context if it exists
  if (session?.contextSummary) {
    history.push({
      role: 'user',
      content: `[Previous conversation context summary]: ${session.contextSummary}`,
    });
    history.push({
      role: 'model',
      content: 'I understand the previous conversation context. I\'ll continue helping based on this background.',
    });
  }

  // Take only the last MAX_RECENT_MESSAGES
  const recentMessages = allMessages.slice(-MAX_RECENT_MESSAGES);
  for (const msg of recentMessages) {
    history.push({
      role: msg.role as 'user' | 'model',
      content: msg.content,
    });
  }

  return history;
};

/**
 * Trigger rolling summarization if the session has grown large.
 * Summarizes the oldest unsummarized messages into the contextSummary.
 */
const maybeRollingSummarize = async (sessionId: string) => {
  const session = await prisma.aIChatSession.findUnique({
    where: { id: sessionId },
    select: { contextSummary: true, summarizedUpTo: true },
  });
  if (!session) return;

  const totalMessages = await prisma.aIChatMessage.count({ where: { sessionId } });

  // Only summarize if we've accumulated enough messages beyond what's already summarized
  const unsummarized = totalMessages - session.summarizedUpTo;
  if (unsummarized < SUMMARIZE_THRESHOLD) return;

  // Fetch the oldest unsummarized messages to compress
  const messagesToSummarize = await prisma.aIChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    skip: session.summarizedUpTo,
    take: SUMMARIZE_BATCH,
    select: { role: true, content: true },
  });

  if (messagesToSummarize.length === 0) return;

  // Build text to summarize
  const conversationText = messagesToSummarize
    .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Patient/Doctor' : 'AI Assistant'}: ${m.content}`)
    .join('\n\n');

  const existingSummary = session.contextSummary || '';

  try {
    const summaryPrompt = existingSummary
      ? `You have an existing summary of an earlier part of this medical conversation:\n\n"${existingSummary}"\n\nNow here are additional messages that followed. Create an updated, comprehensive summary that combines the existing summary with these new messages. Focus on key medical topics discussed, symptoms mentioned, conditions explored, and important information exchanged. Keep it concise (under 500 words):\n\n${conversationText}`
      : `Summarize this medical conversation concisely (under 500 words). Focus on key medical topics discussed, symptoms mentioned, conditions explored, and important information exchanged:\n\n${conversationText}`;

    const newSummary = await sendChatMessage(summaryPrompt, []);

    await prisma.aIChatSession.update({
      where: { id: sessionId },
      data: {
        contextSummary: newSummary.substring(0, 10000),
        summarizedUpTo: session.summarizedUpTo + messagesToSummarize.length,
      },
    });
  } catch (err) {
    console.error('[AI Session] Rolling summarization failed:', err);
    // Non-critical — don't break the chat flow
  }
};

/**
 * Send a message within a session:
 * 1. Save user message to DB
 * 2. Build smart history (summary + recent)
 * 3. Call Gemini
 * 4. Save AI response to DB
 * 5. Trigger rolling summarization if needed
 * 6. Auto-title on first message
 */
export const sendSessionMessage = async (
  sessionId: string,
  userUid: string,
  message: string
) => {
  // Verify ownership
  const session = await prisma.aIChatSession.findFirst({
    where: { id: sessionId, userUid },
  });
  if (!session) throw new Error('Session not found');

  // Save user message
  await prisma.aIChatMessage.create({
    data: {
      sessionId,
      role: 'user',
      content: message,
    },
  });

  // Build smart history
  const history = await buildSmartHistory(sessionId);

  // Call Gemini (pass history WITHOUT the current message — it's the "new" message)
  const aiResponse = await sendChatMessage(message, history);

  // Save AI response
  const savedResponse = await prisma.aIChatMessage.create({
    data: {
      sessionId,
      role: 'model',
      content: aiResponse,
    },
  });

  // Update session timestamp
  await prisma.aIChatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  // Auto-title the session after the first exchange
  const messageCount = await prisma.aIChatMessage.count({ where: { sessionId } });
  if (messageCount === 2 && session.title === 'New Chat') {
    // Fire and forget — don't block the response
    generateSessionTitle(message).then((title) => {
      prisma.aIChatSession.update({
        where: { id: sessionId },
        data: { title },
      }).catch(() => {});
    });
  }

  // Trigger rolling summarization in background if needed
  maybeRollingSummarize(sessionId).catch(() => {});

  return {
    message: aiResponse,
    messageId: savedResponse.id,
  };
};
