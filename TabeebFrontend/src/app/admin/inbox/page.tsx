'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaInbox,
  FaEnvelope,
  FaEnvelopeOpen,
  FaReply,
  FaTrash,
  FaTimes,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaHeadset,
  FaCommentDots,
  FaWpforms,
  FaPaperPlane,
  FaFilter,
} from 'react-icons/fa';
import { Toast } from '@/components/Toast';

interface ContactMessage {
  id: string;
  type: 'CONTACT' | 'SUPPORT' | 'FEEDBACK' | 'INBOUND';
  status: 'NEW' | 'READ' | 'IN_PROGRESS' | 'REPLIED' | 'CLOSED';
  fromEmail: string;
  fromName: string | null;
  subject: string;
  message: string;
  htmlContent: string | null;
  adminNotes: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  repliedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MessagesResponse {
  messages: ContactMessage[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalMessages: number;
    hasMore: boolean;
    limit: number;
  };
}

const typeConfig: Record<string, { label: string; icon: typeof FaInbox; color: string; bg: string }> = {
  CONTACT: { label: 'Contact Form', icon: FaWpforms, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  SUPPORT: { label: 'Support', icon: FaHeadset, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/20' },
  FEEDBACK: { label: 'Feedback', icon: FaCommentDots, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20' },
  INBOUND: { label: 'Inbound', icon: FaEnvelope, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/20' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'New', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' },
  READ: { label: 'Read', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
  REPLIED: { label: 'Replied', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' },
  CLOSED: { label: 'Closed', color: 'text-gray-700 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/20' },
};

export default function AdminInboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    hasMore: false,
  });
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const fetchMessages = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) { router.push('/admin/login'); return; }

      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterType !== 'all') params.set('type', filterType);
      if (filterStatus !== 'all') params.set('status', filterStatus);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/messages?${params}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch messages');
      }

      const data: MessagesResponse = await response.json();
      setMessages(data.messages);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [router, filterType, filterStatus]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleMessageClick = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplyText('');
    setAdminNotes(msg.adminNotes || '');
    setShowModal(true);

    // Mark as read
    if (msg.status === 'NEW') {
      try {
        const adminToken = localStorage.getItem('adminToken');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/messages/${msg.id}/status`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'READ' }),
        });
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'READ' } : m));
        setSelectedMessage(prev => prev ? { ...prev, status: 'READ' } : prev);
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setSubmitting(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/messages/${selectedMessage.id}/reply`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reply: replyText.trim(), adminUsername: adminUser.username || 'admin' }),
        }
      );

      if (!response.ok) throw new Error('Failed to send reply');

      setToastMessage('Reply sent successfully');
      setToastType('success');
      setShowToast(true);
      setShowModal(false);
      await fetchMessages(pagination.currentPage);
    } catch (error) {
      console.error('Error sending reply:', error);
      setToastMessage('Failed to send reply');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedMessage) return;
    setSubmitting(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/messages/${selectedMessage.id}/status`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminNotes: adminNotes.trim() }),
        }
      );
      setToastMessage('Notes updated successfully');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating notes:', error);
      setToastMessage('Failed to update notes');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!selectedMessage) return;
    setSubmitting(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/messages/${selectedMessage.id}/status`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CLOSED' }),
        }
      );
      setShowModal(false);
      setToastMessage('Message closed');
      setToastType('success');
      setShowToast(true);
      await fetchMessages(pagination.currentPage);
    } catch (error) {
      console.error('Error closing message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const adminToken = localStorage.getItem('adminToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setToastMessage('Message deleted');
      setToastType('success');
      setShowToast(true);
      await fetchMessages(pagination.currentPage);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const newCount = messages.filter(m => m.status === 'NEW').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                <FaInbox className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Inbox
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Contact messages, support requests & feedback
                </p>
              </div>
            </div>
            {newCount > 0 && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {newCount} new
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {(['NEW', 'READ', 'IN_PROGRESS', 'REPLIED', 'CLOSED'] as const).map((s) => {
            const cfg = statusConfig[s];
            const count = messages.filter(m => m.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-4 text-center transition-all ${
                  filterStatus === s
                    ? 'border-teal-500 ring-2 ring-teal-500/20'
                    : 'border-gray-200 dark:border-slate-700 hover:border-teal-300'
                }`}
              >
                <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-4">
          <FaFilter className="text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="CONTACT">Contact Form</option>
            <option value="SUPPORT">Support</option>
            <option value="FEEDBACK">Feedback</option>
            <option value="INBOUND">Inbound</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REPLIED">Replied</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Messages List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center">
              <FaInbox className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Messages</p>
              <p className="text-gray-600 dark:text-gray-400">Your inbox is empty.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {messages.map((msg) => {
                const typeCfg = typeConfig[msg.type] || typeConfig.INBOUND;
                const sCfg = statusConfig[msg.status] || statusConfig.NEW;
                const TypeIcon = typeCfg.icon;

                return (
                  <div
                    key={msg.id}
                    onClick={() => handleMessageClick(msg)}
                    className={`p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                      msg.status === 'NEW' ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeCfg.bg}`}>
                          <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-sm font-semibold text-gray-900 dark:text-white truncate ${
                              msg.status === 'NEW' ? 'font-bold' : ''
                            }`}>
                              {msg.fromName || msg.fromEmail}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sCfg.bg} ${sCfg.color}`}>
                              {sCfg.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeCfg.bg} ${typeCfg.color}`}>
                              {typeCfg.label}
                            </span>
                          </div>
                          <p className={`text-sm text-gray-900 dark:text-white truncate ${
                            msg.status === 'NEW' ? 'font-semibold' : ''
                          }`}>
                            {msg.subject}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {msg.message.substring(0, 120)}{msg.message.length > 120 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(msg.createdAt)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <button
                onClick={() => fetchMessages(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalMessages} total)
              </span>
              <button
                onClick={() => fetchMessages(pagination.currentPage + 1)}
                disabled={!pagination.hasMore}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col">
            {/* Modal Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeConfig[selectedMessage.type]?.bg}`}>
                  {(() => { const Icon = typeConfig[selectedMessage.type]?.icon || FaEnvelope; return <Icon className={`w-5 h-5 ${typeConfig[selectedMessage.type]?.color}`} />; })()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedMessage.subject}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    From: {selectedMessage.fromName ? `${selectedMessage.fromName} <${selectedMessage.fromEmail}>` : selectedMessage.fromEmail}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#14b8a6 transparent' }}>
              {/* Meta info */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[selectedMessage.status]?.bg} ${statusConfig[selectedMessage.status]?.color}`}>
                  {statusConfig[selectedMessage.status]?.label}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeConfig[selectedMessage.type]?.bg} ${typeConfig[selectedMessage.type]?.color}`}>
                  {typeConfig[selectedMessage.type]?.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <FaClock className="w-3 h-3" />
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Message</label>
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Previous Admin Reply */}
              {selectedMessage.adminReply && (
                <div>
                  <label className="block text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                    Admin Reply (sent {selectedMessage.repliedAt ? new Date(selectedMessage.repliedAt).toLocaleString() : ''})
                  </label>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{selectedMessage.adminReply}</p>
                    {selectedMessage.repliedBy && (
                      <p className="text-xs text-gray-500 mt-2">— {selectedMessage.repliedBy}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Admin Notes (internal)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white resize-none transition-all text-sm"
                  placeholder="Internal notes (not visible to sender)..."
                />
                <button
                  onClick={handleUpdateNotes}
                  disabled={submitting}
                  className="mt-2 px-4 py-2 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                >
                  Save Notes
                </button>
              </div>

              {/* Reply Section */}
              {selectedMessage.status !== 'CLOSED' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    <FaReply className="inline w-4 h-4 mr-1" />
                    Reply to {selectedMessage.fromName || selectedMessage.fromEmail}
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white resize-none transition-all text-sm"
                    placeholder="Type your reply here... (will be emailed to the sender)"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <button
                onClick={handleClose}
                disabled={submitting || selectedMessage.status === 'CLOSED'}
                className="px-5 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50 text-sm font-medium"
              >
                Close Message
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all text-sm"
                >
                  Cancel
                </button>
                {selectedMessage.status !== 'CLOSED' && (
                  <button
                    onClick={handleReply}
                    disabled={submitting || !replyText.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all disabled:opacity-50 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-teal-500/30"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="w-3 h-3" />
                        Send Reply
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} type={toastType} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
