'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaFlag, FaUser, FaUserMd, FaCalendar, FaStar, FaCheck, FaTimes, FaChevronLeft, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { formatDate, formatTime } from '@/lib/dateUtils';
import { Toast } from '@/components/Toast';

interface Complaint {
  id: string;
  rating: number;
  comment: string;
  adminNotes: string | null;
  adminActionTaken: string | null;
  createdAt: string;
  appointment: {
    appointmentDate: string;
    startTime: string;
    endTime: string;
    doctor: {
      uid: string;
      name: string;
      specialization: string;
    };
    patient: {
      uid: string;
      firstName: string;
      lastName: string;
    };
  };
}

interface ComplaintsResponse {
  reviews: Complaint[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasMore: boolean;
    limit: number;
  };
}

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    hasMore: false,
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [adminAction, setAdminAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const fetchComplaints = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/admin/complaints?page=${page}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch complaints');
      }

      const data: ComplaintsResponse = await response.json();
      setComplaints(data.reviews);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleComplaintClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAdminNotes(complaint.adminNotes || '');
    setAdminAction(complaint.adminActionTaken || '');
    setShowModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedComplaint) return;

    setSubmitting(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/admin/${selectedComplaint.id}/action`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminNotes: adminNotes.trim() || undefined,
            adminActionTaken: adminAction.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update complaint');
      }

      // Refresh complaints list
      await fetchComplaints(pagination.currentPage);
      setShowModal(false);
      setSelectedComplaint(null);
      
      // Show success toast
      setToastMessage('Complaint updated successfully');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      setToastMessage(error.message || 'Failed to update complaint');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseComplaint = async () => {
    if (!selectedComplaint) return;

    setClosing(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/admin/${selectedComplaint.id}/action`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminActionTaken: selectedComplaint.adminActionTaken 
              ? `${selectedComplaint.adminActionTaken}\n\n[Complaint closed by admin]`
              : '[Complaint closed by admin]'
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to close complaint');
      }

      // Refresh complaints list
      await fetchComplaints(pagination.currentPage);
      setShowModal(false);
      setSelectedComplaint(null);
      
      // Show success toast
      setToastMessage('Complaint closed successfully');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      console.error('Error closing complaint:', error);
      setToastMessage(error.message || 'Failed to close complaint');
      setToastType('error');
      setShowToast(true);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <FaFlag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Complaint Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review and respond to patient complaints
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Complaints</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{pagination.totalReviews}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <FaExclamationTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {complaints.filter(c => !c.adminActionTaken).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                <FaFlag className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Resolved</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {complaints.filter(c => c.adminActionTaken).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <FaCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading complaints...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center">
              <FaCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">All Clear!</p>
              <p className="text-gray-600 dark:text-gray-400">No complaints to review at the moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {complaints.map((complaint) => {
                // Check if complaint is closed by patient or admin
                const isClosedComplaint = complaint.adminActionTaken ? 
                  (complaint.adminActionTaken.includes('[Complaint closed by patient]') || 
                   complaint.adminActionTaken.includes('[Complaint closed by admin]')) : false;
                
                return (
                  <div
                    key={complaint.id}
                    onClick={() => handleComplaintClick(complaint)}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                      isClosedComplaint ? 'border-l-4 border-blue-400 dark:border-blue-500' : ''
                    }`}
                  >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isClosedComplaint
                          ? 'bg-blue-100 dark:bg-blue-900/20'
                          : complaint.adminActionTaken
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        <FaFlag className={`w-5 h-5 ${
                          isClosedComplaint
                            ? 'text-blue-600 dark:text-blue-400'
                            : complaint.adminActionTaken
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-4 h-4 ${
                                i < complaint.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(new Date(complaint.createdAt))}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Complaint ID: {complaint.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isClosedComplaint
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : complaint.adminActionTaken
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {isClosedComplaint ? 'Resolved' : complaint.adminActionTaken ? 'Resolved' : 'Pending'}
                      </span>
                      {complaint.adminActionTaken && complaint.adminActionTaken.includes('[Complaint closed by patient]') && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                          Closed by Patient
                        </span>
                      )}
                      {complaint.adminActionTaken && complaint.adminActionTaken.includes('[Complaint closed by admin]') && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                          Closed by Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <FaUserMd className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Dr. {complaint.appointment.doctor.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {complaint.appointment.doctor.specialization}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FaUser className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {complaint.appointment.patient.firstName} {complaint.appointment.patient.lastName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Patient</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <FaCalendar className="w-4 h-4" />
                    <span>
                      {formatDate(new Date(complaint.appointment.appointmentDate))} • {formatTime(complaint.appointment.startTime)}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">Complaint Details:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{complaint.comment}</p>
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
                onClick={() => fetchComplaints(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => fetchComplaints(pagination.currentPage + 1)}
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

      {/* Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Complaint</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div 
              className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#14b8a6 transparent'
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: transparent;
                  border-radius: 10px;
                  margin: 8px 0;
                }
                div::-webkit-scrollbar-thumb {
                  background: linear-gradient(to bottom, #14b8a6, #0d9488);
                  border-radius: 10px;
                  border: 2px solid transparent;
                  background-clip: padding-box;
                  transition: all 0.3s ease;
                  min-height: 40px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(to bottom, #0d9488, #0f766e);
                  background-clip: padding-box;
                }
              `}</style>
              {/* Appointment Info */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appointment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <FaUserMd className="w-6 h-6 text-teal-600 dark:text-teal-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Doctor</p>
                      <p className="font-semibold text-gray-900 dark:text-white">Dr. {selectedComplaint.appointment.doctor.name}</p>
                      <p className="text-sm text-teal-600 dark:text-teal-400">{selectedComplaint.appointment.doctor.specialization}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FaUser className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Patient</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedComplaint.appointment.patient.firstName} {selectedComplaint.appointment.patient.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FaCalendar className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(new Date(selectedComplaint.appointment.appointmentDate))}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(selectedComplaint.appointment.startTime)} - {formatTime(selectedComplaint.appointment.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FaStar className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`w-4 h-4 ${
                              i < selectedComplaint.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedComplaint.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Complaint */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Patient's Complaint
                </label>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{selectedComplaint.comment}</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Submitted on {formatDate(new Date(selectedComplaint.createdAt))}
                </p>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white resize-none transition-all"
                  placeholder="Add internal notes about this complaint (visible to admins only)..."
                />
              </div>

              {/* Action Taken */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Action Taken
                </label>
                <textarea
                  value={adminAction}
                  onChange={(e) => setAdminAction(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white resize-none transition-all"
                  placeholder="Describe the action taken to resolve this complaint (visible to patient)..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <button
                onClick={handleCloseComplaint}
                disabled={closing || submitting || (selectedComplaint.adminActionTaken?.includes('[Complaint closed by') || false)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg shadow-purple-500/30"
              >
                {closing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent" />
                    <span>Closing...</span>
                  </>
                ) : (
                  <>
                    <FaTimes className="w-4 h-4" />
                    <span>Close Complaint</span>
                  </>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={submitting || closing}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submitting || closing}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-600 hover:via-teal-700 hover:to-teal-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg shadow-teal-500/30"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck className="w-4 h-4" />
                      <span>Update Complaint</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
