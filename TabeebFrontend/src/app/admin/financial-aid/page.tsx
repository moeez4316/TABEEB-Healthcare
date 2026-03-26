'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useAdminApiQuery } from '@/lib/hooks/useAdminApiQuery';
import { apiFetchJson, ApiError } from '@/lib/api-client';
import AdminLoading from '@/components/admin/AdminLoading';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Toast } from '@/components/Toast';

interface FinancialAidDocument {
  id: string;
  docType: string | null;
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
  uploadedAt: string;
}

interface FinancialAidPatient {
  uid: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

interface FinancialAidRequest {
  id: string;
  patientUid: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedDiscountPercent: number;
  adminComments: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  patient: FinancialAidPatient;
  documents: FinancialAidDocument[];
}

interface FinancialAidListResponse {
  requests: FinancialAidRequest[];
  total: number;
  filterStatus: string;
}

type UiFilter = 'all' | 'pending' | 'approved' | 'rejected';
type ReviewAction = 'approve' | 'reject' | '';

export default function AdminFinancialAidPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<UiFilter>('pending');
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; title: string; isPdf: boolean } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<FinancialAidRequest | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<ReviewAction>('');
  const [adminComments, setAdminComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const deferredSearch = useDeferredValue(searchTerm);

  const {
    data: financialAidPayload,
    isLoading,
    error: fetchError,
    refetch,
  } = useAdminApiQuery<FinancialAidListResponse>({
    queryKey: ['admin', 'financial-aid-requests'],
    queryFn: () =>
      apiFetchJson<FinancialAidListResponse>(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/financial-aid/requests`, {
        token: adminToken,
      }),
    enabled: !!adminToken,
    staleTime: 30 * 1000,
  });

  const requests = useMemo(
    () => (Array.isArray(financialAidPayload?.requests) ? financialAidPayload.requests : []),
    [financialAidPayload]
  );

  useEffect(() => {
    if (!adminToken) {
      router.push('/admin/login');
    }
  }, [adminToken, router]);

  useEffect(() => {
    const status = (fetchError as ApiError | undefined)?.status;
    if (status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      router.push('/admin/login');
    }
  }, [fetchError, router]);

  useEffect(() => {
    if (!reviewModalOpen && !documentModalOpen) {
      document.body.style.overflow = 'unset';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [reviewModalOpen, documentModalOpen]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const getPatientName = (request: FinancialAidRequest) => {
    const firstName = request.patient?.firstName?.trim() || '';
    const lastName = request.patient?.lastName?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || `Patient ${request.patientUid.slice(0, 8)}...`;
  };

  const openDocument = (doc: FinancialAidDocument) => {
    const title = doc.fileName || doc.docType || 'Financial aid document';
    const type = (doc.fileType || '').toLowerCase();
    const isPdf = type.includes('pdf') || doc.fileUrl.includes('/raw/upload/');
    setSelectedDocument({
      url: doc.fileUrl,
      title,
      isPdf,
    });
    setDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setSelectedDocument(null);
  };

  const openReviewModal = (request: FinancialAidRequest, action: Exclude<ReviewAction, ''>) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setAdminComments('');
    setRejectionReason('');
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedRequest(null);
    setReviewAction('');
    setAdminComments('');
    setRejectionReason('');
  };

  const handleReviewSubmit = async () => {
    if (!selectedRequest || !reviewAction || !adminToken) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      showNotification('Rejection reason is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/financial-aid/requests/${selectedRequest.id}/${reviewAction}`;

      const body =
        reviewAction === 'approve'
          ? {
              adminComments: adminComments.trim() || 'Financial aid approved by admin',
            }
          : {
              rejectionReason: rejectionReason.trim(),
              adminComments: adminComments.trim() || null,
            };

      await apiFetchJson<{ message: string }>(endpoint, {
        method: 'PATCH',
        token: adminToken,
        body: JSON.stringify(body),
      });

      showNotification(
        reviewAction === 'approve'
          ? 'Financial aid request approved successfully'
          : 'Financial aid request rejected successfully',
        reviewAction === 'approve' ? 'success' : 'info'
      );

      closeReviewModal();
      await refetch();
    } catch (error) {
      showNotification(
        `Failed to ${reviewAction} request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const counts = useMemo(() => {
    return requests.reduce(
      (acc, request) => {
        acc.all += 1;
        if (request.status === 'PENDING') acc.pending += 1;
        if (request.status === 'APPROVED') acc.approved += 1;
        if (request.status === 'REJECTED') acc.rejected += 1;
        return acc;
      },
      { all: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const hasQuery = query.length > 0;

    return requests.filter((request) => {
      const statusMatches =
        filter === 'all' ||
        (filter === 'pending' && request.status === 'PENDING') ||
        (filter === 'approved' && request.status === 'APPROVED') ||
        (filter === 'rejected' && request.status === 'REJECTED');

      if (!statusMatches) return false;
      if (!hasQuery) return true;

      const patientName = getPatientName(request).toLowerCase();
      const patientEmail = request.patient?.email?.toLowerCase() || '';
      const patientPhone = request.patient?.phone?.toLowerCase() || '';
      const patientUid = request.patientUid.toLowerCase();

      return (
        patientName.includes(query) ||
        patientEmail.includes(query) ||
        patientPhone.includes(query) ||
        patientUid.includes(query)
      );
    });
  }, [requests, filter, deferredSearch]);

  const getStatusBadge = (status: FinancialAidRequest['status']) => {
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }

    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  };

  if (isLoading) {
    return <AdminLoading title="Loading Financial Aid" subtitle="Fetching patient aid requests..." />;
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Financial Aid Requests"
        subtitle="Review financially-needy patient requests and decide approval or rejection with comments."
        actions={
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
        meta={
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Total: {counts.all}</span>
            <span>Pending: {counts.pending}</span>
            <span>Approved: {counts.approved}</span>
            <span>Rejected: {counts.rejected}</span>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{counts.all}</p>
          </div>
          <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/40">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">{counts.pending}</p>
          </div>
          <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800/40">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Approved</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{counts.approved}</p>
          </div>
          <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-4 border border-red-200 dark:border-red-800/40">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">Rejected</p>
            <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">{counts.rejected}</p>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name, email, phone, or UID"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              {(['all', 'pending', 'approved', 'rejected'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold ${
                    filter === option
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Failed to load requests: {fetchError instanceof Error ? fetchError.message : 'Unknown error'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
              <FileText className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500" />
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No financial aid requests found for the selected filters.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{getPatientName(request)}</p>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <p className="inline-flex items-center gap-2">
                        <User className="w-4 h-4" />
                        UID: {request.patientUid}
                      </p>
                      <p>{request.patient.email || 'No email provided'}</p>
                      <p>{request.patient.phone || 'No phone provided'}</p>
                      <p>Submitted: {new Date(request.submittedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Requested Discount</p>
                    <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                      {request.requestedDiscountPercent}%
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Supporting Documents</p>
                  {request.documents.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {request.documents.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => openDocument(doc)}
                          className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {doc.fileName || doc.docType || 'Financial aid document'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                            {doc.fileType || 'Unknown type'}
                          </p>
                          <p className="mt-2 inline-flex items-center gap-1 text-xs text-teal-700 dark:text-teal-300 font-semibold">
                            <Eye className="w-3.5 h-3.5" />
                            View Document
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(request.status !== 'PENDING' || request.adminComments || request.rejectionReason || request.reviewedAt) && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 text-sm space-y-1 text-slate-600 dark:text-slate-300">
                    {request.reviewedAt && <p>Reviewed At: {new Date(request.reviewedAt).toLocaleString()}</p>}
                    {request.reviewedBy && <p>Reviewed By: {request.reviewedBy}</p>}
                    {request.adminComments && <p>Admin Comments: {request.adminComments}</p>}
                    {request.rejectionReason && <p className="text-red-700 dark:text-red-300">Rejection Reason: {request.rejectionReason}</p>}
                  </div>
                )}

                {request.status === 'PENDING' && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openReviewModal(request, 'approve')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                    >
                      Approve Request
                    </button>
                    <button
                      type="button"
                      onClick={() => openReviewModal(request, 'reject')}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
                    >
                      Reject Request
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {reviewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center" onClick={closeReviewModal}>
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {reviewAction === 'approve' ? 'Approve Financial Aid Request' : 'Reject Financial Aid Request'}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Patient: {getPatientName(selectedRequest)}</p>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {reviewAction === 'reject' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this request is rejected"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Admin Comments (Optional)</label>
                <textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  rows={3}
                  placeholder={reviewAction === 'approve' ? 'Any note to keep with approval decision' : 'Optional additional note'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleReviewSubmit()}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-white text-sm font-semibold ${
                    reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-60`}
                >
                  {submitting ? 'Submitting...' : reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {documentModalOpen && selectedDocument && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50" onClick={closeDocumentModal}>
          <div className="relative w-full max-w-6xl h-[90vh] flex items-center justify-center p-4" onClick={(event) => event.stopPropagation()}>
            <button
              className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white rounded-full p-3 hover:bg-white/20 focus:outline-none z-10 transition-all"
              onClick={closeDocumentModal}
              aria-label="Close preview"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full h-full flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/50">
              <div className="relative w-full h-full flex flex-col">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 p-4 border-b border-slate-200 dark:border-slate-600">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white text-center">
                    {selectedDocument.title}
                  </h3>
                </div>

                <div className="flex-1 flex items-center justify-center overflow-hidden p-4 bg-slate-100 dark:bg-slate-900">
                  {selectedDocument.isPdf ? (
                    <iframe
                      src={selectedDocument.url}
                      title={selectedDocument.title}
                      className="w-full h-full rounded-lg border-0 bg-white"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedDocument.url}
                      alt={selectedDocument.title}
                      className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} type={toastType} show={showToast} onClose={() => setShowToast(false)} />
    </AdminPageShell>
  );
}
