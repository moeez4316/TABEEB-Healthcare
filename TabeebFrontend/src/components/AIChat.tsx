'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { APP_CONFIG } from '@/lib/config/appConfig';
import {
  summarizeMedicalDocument,
  fileToBase64,
  createAISession,
  listAISessions,
  getAISession,
  deleteAISession,
  renameAISession,
  sendSessionChatMessage,
  searchMedicineAlternatives,
  AISession,
  AISessionMessage,
} from '@/lib/ai-api';
import {
  Bot,
  Send,
  FileText,
  X,
  Loader2,
  MessageSquare,
  Sparkles,
  Upload,
  Trash2,
  AlertCircle,
  Plus,
  History,
  Pencil,
  Check,
  ChevronLeft,
  Menu,
  Search,
  Pill,
} from 'lucide-react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ── Styled markdown components so tables, lists, headings render nicely ── */
const mdComponents: Components = {
  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
  p: ({ children }) => <p className="my-1.5 leading-relaxed text-sm">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1 text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1 text-sm">{children}</ol>,
  li: ({ children }) => <li className="ml-2 leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-teal-400 pl-3 my-2 italic text-gray-600 dark:text-gray-400">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-gray-200 dark:bg-slate-600 text-teal-700 dark:text-teal-300 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
    ) : (
      <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg my-2 overflow-x-auto text-xs font-mono whitespace-pre">{children}</code>
    );
  },
  pre: ({ children }) => <pre className="my-2">{children}</pre>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-gray-200 dark:border-slate-600">
      <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-100 dark:bg-slate-700">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-200 dark:divide-slate-600">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{children}</td>
  ),
  hr: () => <hr className="my-3 border-gray-300 dark:border-slate-600" />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 underline hover:text-teal-500">
      {children}
    </a>
  ),
};

type TabMode = 'chat' | 'summarize' | 'medicine';

interface DisplayMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export default function AIChat() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const getToken = async (): Promise<string | null> => {
    try {
      if (user) return await user.getIdToken(true);
      const currentUser = auth.currentUser;
      if (currentUser) return await currentUser.getIdToken(true);
      return null;
    } catch {
      return null;
    }
  };

  // Tab state
  const [activeTab, setActiveTab] = useState<TabMode>('chat');

  // Session state
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Chat state
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Summarize state
  const [summarizeText, setSummarizeText] = useState('');
  const [summarizeImage, setSummarizeImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Medicine search state
  const [medicineQuery, setMedicineQuery] = useState('');
  const [medicineResult, setMedicineResult] = useState<string | null>(null);
  const [isMedicineSearching, setIsMedicineSearching] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Measure header height dynamically so the mobile sidebar never overlaps
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHeaderHeight(entry.contentRect.height + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Auto-Summarize from Medical Records (URL params) ─────────────────────

  const autoSummarizeTriggered = useRef(false);

  useEffect(() => {
    if (autoSummarizeTriggered.current) return;
    const summarizeUrl = searchParams.get('summarizeUrl');
    const fileType = searchParams.get('fileType') || 'image/jpeg';
    const fileName = searchParams.get('fileName') || 'Medical Record';
    if (!summarizeUrl || !user) return;

    autoSummarizeTriggered.current = true;
    setActiveTab('summarize');
    setSummarizeText(`Medical record: ${fileName}`);
    setIsSummarizing(true);
    setError(null);
    setSummaryResult(null);

    // Clean URL params without reloading
    window.history.replaceState({}, '', window.location.pathname);

    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setError('Authentication expired. Please refresh the page.');
          setIsSummarizing(false);
          return;
        }

        // Fetch the file and convert to base64
        const resp = await fetch(summarizeUrl);
        const blob = await resp.blob();
        const mimeType = fileType || blob.type || 'image/jpeg';

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip data URL prefix to get raw base64
            const base64Data = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Set image preview
        setImagePreview(`data:${mimeType};base64,${base64}`);

        const response = await summarizeMedicalDocument(
          token,
          `Please summarize this medical record: ${fileName}`,
          { mimeType, data: base64 }
        );

        if (response.success && response.data) {
          setSummaryResult(response.data.summary);
        } else {
          setError(response.error || 'Failed to summarize the document.');
        }
      } catch {
        setError('Failed to fetch and summarize the medical record.');
      } finally {
        setIsSummarizing(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]);

  // ─── Load Sessions on Mount ────────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setIsLoadingSessions(true);
    try {
      const res = await listAISessions(token);
      if (res.success && res.data) {
        setSessions(res.data);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingSessions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) loadSessions();
  }, [user, loadSessions]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleTextareaResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }, []);

  // ─── Session Actions ───────────────────────────────────────────────────────

  const handleNewChat = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await createAISession(token);
      if (res.success && res.data) {
        setSessions((prev) => [res.data!, ...prev]);
        setActiveSessionId(res.data.id);
        setMessages([]);
        setError(null);
        setSidebarOpen(false);
      }
    } catch {
      setError('Failed to create new chat.');
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) {
      setSidebarOpen(false);
      return;
    }

    const token = await getToken();
    if (!token) return;

    setActiveSessionId(sessionId);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);

    try {
      const res = await getAISession(token, sessionId, 100);
      if (res.success && res.data) {
        const displayMessages: DisplayMessage[] = res.data.messages.map((m: AISessionMessage) => ({
          id: m.id,
          role: m.role as 'user' | 'model',
          content: m.content,
          timestamp: new Date(m.createdAt),
        }));
        setMessages(displayMessages);
      }
    } catch {
      setError('Failed to load conversation.');
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const token = await getToken();
    if (!token) return;

    try {
      const res = await deleteAISession(token, sessionId);
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch {
      setError('Failed to delete session.');
    }
  };

  const handleStartRename = (e: React.MouseEvent, sessionId: string, currentTitle: string) => {
    e.stopPropagation();
    setRenamingId(sessionId);
    setRenameValue(currentTitle);
  };

  const handleConfirmRename = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }

    const token = await getToken();
    if (!token) return;

    try {
      const res = await renameAISession(token, sessionId, renameValue.trim());
      if (res.success) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: renameValue.trim() } : s))
        );
      }
    } catch {
      // silent
    } finally {
      setRenamingId(null);
    }
  };

  // ─── Send Message (Session-Based) ─────────────────────────────────────────

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const token = await getToken();
    if (!token) {
      setError('Authentication expired. Please refresh the page or sign in again.');
      return;
    }

    // Auto-create session if none is active
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const res = await createAISession(token);
        if (res.success && res.data) {
          sessionId = res.data.id;
          setSessions((prev) => [res.data!, ...prev]);
          setActiveSessionId(sessionId);
        } else {
          setError('Failed to start a new chat session.');
          return;
        }
      } catch {
        setError('Failed to start a new chat session.');
        return;
      }
    }

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    const loadingMessage: DisplayMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    const messageText = chatInput.trim();
    setChatInput('');
    setError(null);
    setIsChatLoading(true);

    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
    }

    try {
      const response = await sendSessionChatMessage(token, sessionId, messageText);

      if (response.success && response.data) {
        const aiMessage: DisplayMessage = {
          id: response.data.message ? (Date.now() + 2).toString() : (Date.now() + 2).toString(),
          role: 'model',
          content: response.data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => prev.filter((m) => !m.isLoading).concat(aiMessage));

        // Refresh sessions to get updated title (auto-generated after first message)
        setTimeout(() => loadSessions(), 3000);
      } else {
        setMessages((prev) => prev.filter((m) => !m.isLoading));
        setError(response.error || 'Failed to get response. Please try again.');
      }
    } catch {
      setMessages((prev) => prev.filter((m) => !m.isLoading));
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // ─── Summarize Handlers ───────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }

    setSummarizeImage(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSummarizeImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSummarize = async () => {
    if ((!summarizeText.trim() && !summarizeImage) || isSummarizing) return;

    const token = await getToken();
    if (!token) {
      setError('Authentication expired. Please refresh the page or sign in again.');
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSummaryResult(null);

    try {
      let imageData: { mimeType: string; data: string } | undefined;
      if (summarizeImage) {
        imageData = await fileToBase64(summarizeImage);
      }

      const response = await summarizeMedicalDocument(
        token,
        summarizeText.trim() || undefined,
        imageData
      );

      if (response.success && response.data) {
        setSummaryResult(response.data.summary);
      } else {
        setError(response.error || 'Failed to summarize document. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleClearChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
  };

  const handleClearSummarize = () => {
    setSummarizeText('');
    removeImage();
    setSummaryResult(null);
    setError(null);
  };

  // ─── Medicine Search Handlers ──────────────────────────────────────────────

  const handleMedicineSearch = async () => {
    if (!medicineQuery.trim() || isMedicineSearching) return;

    const token = await getToken();
    if (!token) {
      setError('Authentication expired. Please refresh the page or sign in again.');
      return;
    }

    setIsMedicineSearching(true);
    setError(null);
    setMedicineResult(null);

    try {
      const response = await searchMedicineAlternatives(token, medicineQuery.trim());

      if (response.success && response.data) {
        setMedicineResult(response.data.result);
      } else {
        setError(response.error || 'Failed to search for medicine alternatives.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsMedicineSearching(false);
    }
  };

  const handleClearMedicine = () => {
    setMedicineQuery('');
    setMedicineResult(null);
    setError(null);
  };

  // ─── Ask AI About Summarized Report ────────────────────────────────────────

  const [isStartingReportChat, setIsStartingReportChat] = useState(false);

  const handleAskAboutReport = async () => {
    if (!summaryResult || isStartingReportChat) return;

    const token = await getToken();
    if (!token) {
      setError('Authentication expired. Please refresh the page or sign in again.');
      return;
    }

    setIsStartingReportChat(true);
    setError(null);

    try {
      // 1. Create a new session
      const sessionRes = await createAISession(token);
      if (!sessionRes.success || !sessionRes.data) {
        setError('Failed to create chat session.');
        return;
      }

      const newSession = sessionRes.data;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);

      // 2. Send the report summary as context
      const contextMessage = `I just had a medical report summarized. Here is the summary:\n\n${summaryResult}\n\nI have some questions about this report.`;

      const userMsg: DisplayMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: contextMessage,
        timestamp: new Date(),
      };

      const loadingMsg: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages([userMsg, loadingMsg]);
      setActiveTab('chat');

      const response = await sendSessionChatMessage(token, newSession.id, contextMessage);

      if (response.success && response.data) {
        const aiMsg: DisplayMessage = {
          id: (Date.now() + 2).toString(),
          role: 'model',
          content: response.data.message,
          timestamp: new Date(),
        };
        setMessages([userMsg, aiMsg]);
        setTimeout(() => loadSessions(), 3000);
      } else {
        setMessages([userMsg]);
        setError(response.error || 'Failed to get AI response.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsStartingReportChat(false);
    }
  };

  // Format date for sidebar
  const formatSessionDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header ref={headerRef} className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 flex-shrink-0 z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Image
            src={APP_CONFIG.ASSETS.LOGO}
            alt="Tabeeb Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-teal-500" />
              TABEEB AI Assistant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Medical information, document summarization &amp; medicine search
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ─── Session Sidebar ──────────────────────────────────────────────── */}
        {activeTab === 'chat' && (
          <>
            {/* Overlay for mobile */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                style={{ top: headerHeight }}
                onClick={() => setSidebarOpen(false)}
              />
            )}

            <aside
              className={`fixed lg:static bottom-0 left-0 z-30 w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col transition-transform duration-200 lg:!top-auto ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
              }`}
              style={{ top: headerHeight }}
            >
              <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
                <button
                  onClick={handleNewChat}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-lg font-medium text-sm hover:bg-teal-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No conversations yet
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        activeSessionId === session.id
                          ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {renamingId === session.id ? (
                          <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConfirmRename(e as unknown as React.MouseEvent, session.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            className="w-full text-sm bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-800 dark:text-gray-200"
                            autoFocus
                          />
                        ) : (
                          <>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                              {session.title}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {formatSessionDate(session.updatedAt)}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {renamingId === session.id ? (
                          <button
                            onClick={(e) => handleConfirmRename(e, session.id)}
                            className="p-1 text-teal-500 hover:text-teal-600 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleStartRename(e, session.id, session.title)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </>
        )}

        {/* ─── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col overflow-hidden">
            {/* Tab Switcher */}
            <div className="flex gap-2 mb-4 flex-shrink-0">
              <button
                onClick={() => { setActiveTab('chat'); setError(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'chat'
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Medical Chat
              </button>
              <button
                onClick={() => { setActiveTab('summarize'); setError(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'summarize'
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Summarize Report
              </button>
              <button
                onClick={() => { setActiveTab('medicine'); setError(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'medicine'
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Pill className="w-4 h-4" />
                Medicine Search
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm flex-shrink-0">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ==== CHAT TAB ==== */}
            {activeTab === 'chat' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                      <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-teal-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          Welcome to TABEEB AI
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mt-1">
                          Ask me anything about medical conditions, symptoms, procedures, or general health information. Your conversations are saved automatically.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-w-lg w-full">
                        {[
                          'What are the common symptoms of diabetes?',
                          'Explain how blood pressure is measured',
                          'What does a CBC blood test show?',
                          'What is the difference between MRI and CT scan?',
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              setChatInput(suggestion);
                              chatInputRef.current?.focus();
                            }}
                            className="text-left text-sm p-3 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-teal-500 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                        }`}
                      >
                        {msg.isLoading ? (
                          <div className="flex items-center gap-2 py-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        ) : msg.role === 'model' ? (
                          <div className="max-w-none text-gray-800 dark:text-gray-200">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <p
                          className={`text-xs mt-1 ${
                            msg.role === 'user'
                              ? 'text-teal-100'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="border-t border-gray-200 dark:border-slate-700 p-3 sm:p-4 flex-shrink-0">
                  <div className="flex items-end gap-2">
                    {messages.length > 0 && (
                      <button
                        onClick={handleClearChat}
                        title="New chat"
                        className="p-2 text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors flex-shrink-0 mb-1"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                    <textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        handleTextareaResize(e.target);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a medical question..."
                      rows={1}
                      className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                      disabled={isChatLoading}
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="p-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 mb-0"
                    >
                      {isChatLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                    TABEEB AI provides general medical information only. Always consult a healthcare professional for medical advice.
                  </p>
                </div>
              </div>
            )}

            {/* ==== SUMMARIZE TAB ==== */}
            {activeTab === 'summarize' && (
              <div className="space-y-6 overflow-y-auto flex-1">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-teal-500" />
                    Upload Medical Document
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Paste the text of a medical report or upload an image of a medical document for AI-powered summarization.
                  </p>

                  <textarea
                    value={summarizeText}
                    onChange={(e) => setSummarizeText(e.target.value)}
                    placeholder="Paste your medical report text here..."
                    rows={8}
                    className="w-full resize-none rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 mb-4"
                    disabled={isSummarizing}
                  />

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Or upload an image of a medical report:
                    </p>
                    {!imagePreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Click to upload (JPEG, PNG, WebP — max 10MB)
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isSummarizing}
                        />
                      </label>
                    ) : (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Medical document preview"
                          className="max-w-xs max-h-48 rounded-lg border border-gray-200 dark:border-slate-600 object-contain"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                          disabled={isSummarizing}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSummarize}
                      disabled={(!summarizeText.trim() && !summarizeImage) || isSummarizing}
                      className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white rounded-lg font-medium text-sm hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSummarizing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Summarize
                        </>
                      )}
                    </button>
                    {(summarizeText || summarizeImage || summaryResult) && (
                      <button
                        onClick={handleClearSummarize}
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        disabled={isSummarizing}
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {summaryResult && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-teal-500" />
                      Document Summary
                    </h2>
                    <div className="max-w-none text-gray-800 dark:text-gray-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{summaryResult}</ReactMarkdown>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                      This summary is AI-generated. Always verify with a healthcare professional.
                    </p>
                    <button
                      onClick={handleAskAboutReport}
                      disabled={isStartingReportChat}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-lg font-medium text-sm hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isStartingReportChat ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting chat...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Ask questions about this report
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ==== MEDICINE SEARCH TAB ==== */}
            {activeTab === 'medicine' && (
              <div className="space-y-6 overflow-y-auto flex-1">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2">
                    <Pill className="w-5 h-5 text-teal-500" />
                    Medicine Alternative Search
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Enter a medicine name to find alternative brands and their latest estimated prices in Pakistan.
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={medicineQuery}
                        onChange={(e) => setMedicineQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleMedicineSearch(); }}
                        placeholder="e.g., Panadol, Augmentin, Amlodipine..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                        disabled={isMedicineSearching}
                      />
                    </div>
                    <button
                      onClick={handleMedicineSearch}
                      disabled={!medicineQuery.trim() || isMedicineSearching}
                      className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-lg font-medium text-sm hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                      {isMedicineSearching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Search
                        </>
                      )}
                    </button>
                  </div>

                  {!medicineResult && !isMedicineSearching && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Popular searches:</p>
                      <div className="flex flex-wrap gap-2">
                        {['Panadol', 'Augmentin', 'Amlodipine', 'Omeprazole', 'Metformin', 'Amoxicillin'].map((name) => (
                          <button
                            key={name}
                            onClick={() => setMedicineQuery(name)}
                            className="px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-teal-50 hover:border-teal-300 dark:hover:bg-teal-900/20 dark:hover:border-teal-700 transition-colors"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(medicineResult || medicineQuery) && !isMedicineSearching && (
                    <button
                      onClick={handleClearMedicine}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors mt-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>

                {isMedicineSearching && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Searching for alternatives and prices...</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">This may take a moment as we search across Pakistani pharmacies</p>
                    </div>
                  </div>
                )}

                {medicineResult && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-teal-500" />
                      Search Results
                    </h2>
                    <div className="max-w-none text-gray-800 dark:text-gray-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{medicineResult}</ReactMarkdown>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                      Prices are approximate and sourced from the web. Always verify with your local pharmacy before purchasing.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
