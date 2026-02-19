'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Mail, RefreshCw, Send } from 'lucide-react';

type ContactMessageStatus = 'NEW' | 'READ' | 'IN_PROGRESS' | 'REPLIED' | 'CLOSED';
type ContactMessageType = 'CONTACT' | 'SUPPORT' | 'FEEDBACK' | 'INBOUND';

interface ContactMessage {
  id: string;
  type: ContactMessageType;
  status: ContactMessageStatus;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  message: string;
  adminNotes: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  repliedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationPayload {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  hasMore: boolean;
  limit: number;
}

const statusOptions: Array<{ label: string; value: string }> = [
  { label: 'All Statuses', value: 'all' },
  { label: 'New', value: 'NEW' },
  { label: 'Read', value: 'READ' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Replied', value: 'REPLIED' },
  { label: 'Closed', value: 'CLOSED' },
];

const typeOptions: Array<{ label: string; value: string }> = [
  { label: 'All Types', value: 'all' },
  { label: 'Contact', value: 'CONTACT' },
  { label: 'Support', value: 'SUPPORT' },
  { label: 'Feedback', value: 'FEEDBACK' },
  { label: 'Inbound', value: 'INBOUND' },
];

const INBOX_AUTO_REFRESH_MS = 10000;

export default function AdminInboxPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [pagination, setPagination] = useState<PaginationPayload>({
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    hasMore: false,
    limit: 20,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const apiOrigins = useMemo(() => {
    const origins: string[] = [];
    const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    const hasConfigured = configured && configured.toLowerCase() !== 'undefined';

    const isLocalBrowser =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalBrowser) {
      origins.push('http://localhost:5002');
    }

    if (hasConfigured) {
      origins.push(configured);
    }

    if (typeof window !== 'undefined') {
      const browserOrigin = window.location.origin.replace(/\/+$/, '');
      if (!origins.includes(browserOrigin)) {
        origins.push(browserOrigin);
      }
    }

    if (origins.length === 0) {
      origins.push('http://localhost:5002');
    }

    return Array.from(new Set(origins));
  }, []);

  const parseResponse = async (response: Response): Promise<Record<string, unknown>> => {
    const rawBody = await response.text();
    try {
      return JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return {
        _rawBody: rawBody,
      };
    }
  };

  const toErrorMessage = (
    payload: Record<string, unknown>,
    status: number,
    fallback = 'Request failed'
  ): string => {
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload._rawBody === 'string' && payload._rawBody.trim()) {
      const compact = payload._rawBody.replace(/\s+/g, ' ').trim().slice(0, 160);
      if (compact) {
        return `${fallback} (${status}): ${compact}`;
      }
    }
    return `${fallback} (${status})`;
  };

  const apiRequest = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        throw new Error('Authentication required');
      }

      let lastError: Error | null = null;

      for (let index = 0; index < apiOrigins.length; index += 1) {
        const origin = apiOrigins[index];
        const isLastOrigin = index === apiOrigins.length - 1;
        const url = `${origin}${path}`;

        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              ...(options.headers || {}),
            },
          });

          if (response.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            router.push('/admin/login');
            throw new Error('Session expired');
          }

          const payload = await parseResponse(response);
          if (!response.ok) {
            const message = toErrorMessage(payload, response.status);
            const canRetryOnNextOrigin =
              !isLastOrigin && [404, 502, 503, 504].includes(response.status);

            if (canRetryOnNextOrigin) {
              continue;
            }

            throw new Error(message);
          }

          return payload;
        } catch (error) {
          const isNetworkError = error instanceof TypeError;
          if (!isLastOrigin && isNetworkError) {
            continue;
          }

          lastError =
            error instanceof Error
              ? error
              : new Error('Request failed');
          break;
        }
      }

      throw lastError || new Error('Request failed');
    },
    [apiOrigins, router]
  );

  const loadMessages = useCallback(
    async (page = 1, keepSelected = false) => {
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', '20');
      if (statusFilter !== 'all') query.set('status', statusFilter);
      if (typeFilter !== 'all') query.set('type', typeFilter);

      const payload = await apiRequest(`/api/admin/inbox/messages?${query.toString()}`);
      const list = Array.isArray(payload.messages)
        ? (payload.messages as ContactMessage[])
        : [];
      const pageData = (payload.pagination || {}) as Partial<PaginationPayload>;

      setMessages(list);
      setPagination({
        currentPage: pageData.currentPage || page,
        totalPages: pageData.totalPages || 1,
        totalMessages: pageData.totalMessages || 0,
        hasMore: Boolean(pageData.hasMore),
        limit: pageData.limit || 20,
      });

      setSelectedMessage((previous) => {
        if (!keepSelected || !previous) {
          return list[0] || null;
        }

        const updated = list.find((entry) => entry.id === previous.id);
        return updated || list[0] || null;
      });
    },
    [apiRequest, statusFilter, typeFilter]
  );

  const openMessage = useCallback(
    async (messageId: string) => {
      const payload = await apiRequest(`/api/admin/inbox/messages/${messageId}`);
      const message = payload.message as ContactMessage | undefined;
      if (!message) return;
      setSelectedMessage(message);
      setMessages((prev) =>
        prev.map((item) => (item.id === message.id ? message : item))
      );
    },
    [apiRequest]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setBanner(null);
    try {
      await loadMessages(pagination.currentPage || 1, true);
    } catch (error) {
      setBanner({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to refresh inbox',
      });
    } finally {
      setRefreshing(false);
    }
  }, [loadMessages, pagination.currentPage]);

  const updateStatus = useCallback(
    async (status: ContactMessageStatus) => {
      if (!selectedMessage) return;

      setBanner(null);
      try {
        const payload = await apiRequest(`/api/admin/inbox/messages/${selectedMessage.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        const message = payload.message as ContactMessage | undefined;
        if (message) {
          setSelectedMessage(message);
          setMessages((prev) =>
            prev.map((item) => (item.id === message.id ? message : item))
          );
        }
        setBanner({ type: 'success', message: `Status updated to ${status}.` });
      } catch (error) {
        setBanner({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to update message status',
        });
      }
    },
    [apiRequest, selectedMessage]
  );

  const sendReply = useCallback(async () => {
    if (!selectedMessage) return;
    const trimmedReply = replyText.trim();
    if (!trimmedReply) {
      setBanner({ type: 'error', message: 'Reply message is required.' });
      return;
    }

    let adminUsername = 'admin';
    try {
      const rawUser = localStorage.getItem('adminUser');
      if (rawUser) {
        const parsed = JSON.parse(rawUser) as { username?: string };
        if (parsed?.username) adminUsername = parsed.username;
      }
    } catch {
      adminUsername = 'admin';
    }

    setSavingReply(true);
    setBanner(null);
    try {
      const payload = await apiRequest(`/api/admin/inbox/messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: trimmedReply, adminUsername }),
      });
      const message = payload.message as ContactMessage | undefined;
      if (message) {
        setSelectedMessage(message);
        setMessages((prev) =>
          prev.map((item) => (item.id === message.id ? message : item))
        );
      }
      setReplyText('');
      setBanner({ type: 'success', message: 'Reply sent successfully.' });
    } catch (error) {
      setBanner({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send reply',
      });
    } finally {
      setSavingReply(false);
    }
  }, [apiRequest, replyText, selectedMessage]);

  useEffect(() => {
    setLoading(true);
    setBanner(null);
    loadMessages(1)
      .catch((error) => {
        setBanner({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to load inbox',
        });
      })
      .finally(() => setLoading(false));
  }, [loadMessages]);

  useEffect(() => {
    if (loading) return;

    const runAutoRefresh = () => {
      if (document.hidden || savingReply || refreshing) return;
      void loadMessages(pagination.currentPage || 1, true).catch(() => {
        // Keep polling silent to avoid noisy transient banners.
      });
    };

    const intervalId = window.setInterval(runAutoRefresh, INBOX_AUTO_REFRESH_MS);

    const handleFocus = () => {
      runAutoRefresh();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        runAutoRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadMessages, loading, pagination.currentPage, refreshing, savingReply]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Inbox</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Support and contact messages sent to TABEEB admin mailboxes.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {banner && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{banner.message}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-700 dark:text-gray-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-700 dark:text-gray-100"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pagination.totalMessages} message(s) found
            </p>
          </div>

          <div className="max-h-[68vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-gray-600 dark:text-gray-300">Loading inbox...</div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 dark:text-gray-400">No messages found.</div>
            ) : (
              messages.map((message) => {
                const active = selectedMessage?.id === message.id;
                return (
                  <button
                    key={message.id}
                    onClick={() => openMessage(message.id)}
                    className={`w-full text-left p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition ${
                      active ? 'bg-teal-50 dark:bg-teal-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {message.fromName || message.fromEmail}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                        {message.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 truncate mt-1">{message.subject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between text-sm">
            <button
              onClick={() => loadMessages(Math.max(1, pagination.currentPage - 1), true)}
              disabled={pagination.currentPage <= 1 || loading}
              className="px-3 py-1.5 rounded border border-gray-200 dark:border-slate-600 disabled:opacity-50 text-gray-700 dark:text-gray-200"
            >
              Prev
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => loadMessages(Math.min(pagination.totalPages, pagination.currentPage + 1), true)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="px-3 py-1.5 rounded border border-gray-200 dark:border-slate-600 disabled:opacity-50 text-gray-700 dark:text-gray-200"
            >
              Next
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
          {!selectedMessage ? (
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
              <Mail className="w-10 h-10 mb-3" />
              <p>Select a message to view details.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMessage.subject}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    From: {selectedMessage.fromName || 'Unknown'} ({selectedMessage.fromEmail})
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Received: {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMessage.status}
                    onChange={(event) => updateStatus(event.target.value as ContactMessageStatus)}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-700 dark:text-gray-100"
                  >
                    {statusOptions
                      .filter((entry) => entry.value !== 'all')
                      .map((entry) => (
                        <option key={entry.value} value={entry.value}>
                          {entry.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                {selectedMessage.message}
              </div>

              {selectedMessage.adminReply && (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/10 p-4">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                    Previous Reply ({selectedMessage.repliedBy || 'admin'} -{' '}
                    {selectedMessage.repliedAt
                      ? new Date(selectedMessage.repliedAt).toLocaleString()
                      : 'N/A'}
                    )
                  </p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap">
                    {selectedMessage.adminReply}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Send reply
                </label>
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  rows={6}
                  placeholder="Write your reply here..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
                />
                <div className="flex justify-end">
                  <button
                    onClick={sendReply}
                    disabled={savingReply}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm font-medium"
                  >
                    <Send className="w-4 h-4" />
                    {savingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
