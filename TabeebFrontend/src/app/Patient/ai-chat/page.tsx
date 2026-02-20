'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { APP_CONFIG } from '@/lib/config/appConfig';
import {
  sendAIChatMessage,
  summarizeMedicalDocument,
  fileToBase64,
  AIChatMessage,
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
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type TabMode = 'chat' | 'summarize';

interface DisplayMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export default function PatientAIChat() {
  const { user } = useAuth();

  // Get a fresh Firebase ID token for each API call
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

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleTextareaResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }, []);

  // Get conversation history for API (exclude loading messages)
  const getConversationHistory = (): AIChatMessage[] => {
    return messages
      .filter((m) => !m.isLoading)
      .map((m) => ({ role: m.role, content: m.content }));
  };

  // Send chat message
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const token = await getToken();
    if (!token) {
      setError('Authentication expired. Please refresh the page or sign in again.');
      return;
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
    setChatInput('');
    setError(null);
    setIsChatLoading(true);

    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
    }

    try {
      const history = getConversationHistory();
      const response = await sendAIChatMessage(token, userMessage.content, history);

      if (response.success && response.data) {
        const aiMessage: DisplayMessage = {
          id: (Date.now() + 2).toString(),
          role: 'model',
          content: response.data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => prev.filter((m) => !m.isLoading).concat(aiMessage));
      } else {
        setMessages((prev) => prev.filter((m) => !m.isLoading));
        setError(response.error || 'Failed to get response. Please try again.');
      }
    } catch (err) {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  const handleClearSummarize = () => {
    setSummarizeText('');
    removeImage();
    setSummaryResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Image
            src={APP_CONFIG.ASSETS.LOGO}
            alt="Tabeeb Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-teal-500" />
              TABEEB AI Assistant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Medical information &amp; document summarization
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
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
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ==== CHAT TAB ==== */}
        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 flex flex-col" style={{ height: 'calc(100vh - 260px)', minHeight: '500px' }}>
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
                      Ask me anything about medical conditions, symptoms, procedures, or general health information. I&apos;m here to help!
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
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
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
            <div className="border-t border-gray-200 dark:border-slate-700 p-3 sm:p-4">
              <div className="flex items-end gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    title="Clear chat"
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 mb-1"
                  >
                    <Trash2 className="w-5 h-5" />
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
          <div className="space-y-6">
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
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:my-3">
                  <ReactMarkdown>{summaryResult}</ReactMarkdown>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                  This summary is AI-generated. Always verify with a healthcare professional.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}