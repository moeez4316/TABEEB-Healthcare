"use client";
import { useState, useRef, useEffect } from "react";
import { FaRobot, FaUserCircle, FaPaperPlane, FaDownload } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

interface ChatItem {
  prompt: string;
  response: string;
  timestamp: number;
}

function formatTime(ts: number) {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AIChat() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, streaming, streamedResponse]);

  // Download chat as .txt
  const handleDownload = () => {
    const content = history.map(item =>
      `You [${formatTime(item.timestamp)}]:\n${item.prompt}\n\nMedLLaMA [${formatTime(item.timestamp)}]:\n${item.response}\n\n`
    ).join("");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medllama_chat_${new Date().toISOString().slice(0,19).replace(/[:T]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  // Simulate streaming (for demo). Replace with real streaming if backend supports it.
  const streamResponse = async (full: string, prompt: string, timestamp: number) => {
    setStreaming(true);
    setStreamedResponse("");
    for (let i = 1; i <= full.length; i++) {
      setStreamedResponse(full.slice(0, i));
      await new Promise(res => setTimeout(res, 12)); // Fast typing
    }
    setHistory(prev => [...prev, { prompt, response: full, timestamp }]);
    setStreaming(false);
    setStreamedResponse("");
  };

  const handleSend = async () => {
    if (!prompt.trim() || loading || streaming) return;
    setLoading(true);
    setError("");
    const now = Date.now();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ML_API_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.response) {
        await streamResponse(data.response, prompt, now);
      } else {
        setError(data.error || "No response from backend");
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError("Failed to connect to backend");
    }
    setLoading(false);
    setPrompt("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[100dvh] min-h-[500px] flex flex-col justify-center items-center w-full bg-transparent px-2 sm:px-4 lg:px-6">
      <div className="flex flex-col w-full max-w-2xl lg:max-w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl lg:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#101827]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <FaRobot className="text-xl sm:text-2xl text-[#0f766e] dark:text-[#38bdf8] flex-shrink-0" />
            <h2 className="text-base sm:text-xl font-bold tracking-wide text-[#1e293b] dark:text-[#ededed] truncate">AI Chat with MedLLaMA</h2>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md bg-[#0f766e] hover:bg-[#115e59] dark:bg-[#38bdf8] dark:hover:bg-[#0ea5e9] text-white text-xs sm:text-sm font-medium shadow transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
            disabled={history.length === 0}
            title="Download chat as .txt"
          >
            <FaDownload className="text-sm sm:text-base" />
            <span className="hidden sm:inline">Download Chat</span>
            <span className="sm:hidden">Download</span>
          </button>
        </div>
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 bg-slate-50 dark:bg-slate-900 flex flex-col gap-2">
          {history.length === 0 && !loading && !streaming && (
            <div className="text-center text-gray-400 mt-20">No messages yet. Start the conversation!</div>
          )}
          {history.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1 group">
              {/* User bubble */}
              <div className="flex items-end gap-2 self-start max-w-full">
                <FaUserCircle className="text-2xl text-[#0f766e] dark:text-[#38bdf8] flex-shrink-0" />
                <div className="bg-gradient-to-r from-[#e0f2fe] to-[#f1f5f9] dark:from-[#0f766e]/30 dark:to-[#334155]/60 text-[#1e293b] dark:text-[#ededed] rounded-2xl px-4 py-2 max-w-[80vw] sm:max-w-[70%] shadow break-words">
                  {item.prompt}
                </div>
              </div>
              <span className="ml-10 text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">{formatTime(item.timestamp)}</span>
              {/* AI bubble */}
              <div className="flex items-end gap-2 self-end max-w-full justify-end">
                <div className="bg-gradient-to-r from-[#bbf7d0] to-[#e8f5e9] dark:from-[#38bdf8]/20 dark:to-[#0f766e]/40 text-[#1b5e20] dark:text-[#ededed] rounded-2xl px-4 py-2 max-w-[80vw] sm:max-w-[70%] shadow break-words markdown-body text-left">
                  <ReactMarkdown
                    components={{
                      strong: ({children, ...props}) => <strong className="font-semibold" {...props}>{children}</strong>,
                      em: ({children, ...props}) => <em className="italic" {...props}>{children}</em>,
                      code: ({children, ...props}) => <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded text-sm" {...props}>{children}</code>,
                      a: ({children, ...props}) => <a className="text-blue-600 underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                    }}
                  >
                    {item.response}
                  </ReactMarkdown>
                </div>
                <FaRobot className="text-2xl text-[#1b5e20] dark:text-[#38bdf8] flex-shrink-0" />
              </div>
              <span className="mr-10 text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-right self-end">{formatTime(item.timestamp)}</span>
            </div>
          ))}
          {/* Streaming AI response */}
          {streaming && (
            <div className="flex flex-col gap-1 group">
              <div className="flex items-end gap-2 self-start max-w-full">
                <FaUserCircle className="text-2xl text-[#0f766e] dark:text-[#38bdf8] flex-shrink-0" />
                <div className="bg-gradient-to-r from-[#e0f2fe] to-[#f1f5f9] dark:from-[#0f766e]/30 dark:to-[#334155]/60 text-[#1e293b] dark:text-[#ededed] rounded-2xl px-4 py-2 max-w-[80vw] sm:max-w-[70%] shadow break-words">
                  {prompt}
                </div>
              </div>
              <div className="flex items-end gap-2 self-end max-w-full justify-end">
                <div className="bg-gradient-to-r from-[#bbf7d0] to-[#e8f5e9] dark:from-[#38bdf8]/20 dark:to-[#0f766e]/40 text-[#1b5e20] dark:text-[#ededed] rounded-2xl px-4 py-2 max-w-[80vw] sm:max-w-[70%] shadow break-words markdown-body text-left">
                  <ReactMarkdown
                    components={{
                      strong: ({children, ...props}) => <strong className="font-semibold" {...props}>{children}</strong>,
                      em: ({children, ...props}) => <em className="italic" {...props}>{children}</em>,
                      code: ({children, ...props}) => <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded text-sm" {...props}>{children}</code>,
                      a: ({children, ...props}) => <a className="text-blue-600 underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                    }}
                  >
                    {streamedResponse || "..."}
                  </ReactMarkdown>
                  {(!streamedResponse) && (
                    <span className="inline-block w-6 ml-1 align-middle">
                      <span className="animate-bounce inline-block">.</span>
                      <span className="animate-bounce inline-block" style={{ animationDelay: '0.2s' }}>.</span>
                      <span className="animate-bounce inline-block" style={{ animationDelay: '0.4s' }}>.</span>
                    </span>
                  )}
                </div>
                <FaRobot className="text-2xl text-[#1b5e20] dark:text-[#38bdf8] flex-shrink-0" />
              </div>
            </div>
          )}
          {loading && !streaming && (
            <div className="flex items-center gap-2 text-gray-400 animate-pulse mt-4">
              <FaRobot className="text-xl" />
              <span>MedLLaMA is thinking...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {/* Input fixed at bottom */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-3 px-2 sm:px-6 py-3 bg-white dark:bg-[#101827] border-t border-gray-100 dark:border-gray-800 sticky bottom-0 z-10"
        >
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-base text-[#1e293b] dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-[#0f766e] dark:focus:ring-[#38bdf8] transition"
            disabled={loading || streaming}
            autoFocus
            tabIndex={0}
            aria-label="Type your question"
          />
          <button
            type="submit"
            disabled={loading || streaming || !prompt.trim()}
            className="flex items-center gap-2 bg-[#0f766e] hover:bg-[#115e59] dark:bg-[#38bdf8] dark:hover:bg-[#0ea5e9] text-white font-semibold px-6 py-3 rounded-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <FaPaperPlane className="text-lg" />
            {loading || streaming ? "..." : "Send"}
          </button>
        </form>
        {error && <div className="px-8 pb-4 text-[#d32f2f] dark:text-red-400 text-sm">{error}</div>}
      </div>
    </div>
  );
}