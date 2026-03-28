'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Eye, RefreshCw, Search, XCircle } from 'lucide-react';
import AdminLoading from '@/components/admin/AdminLoading';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { Toast } from '@/components/Toast';
import { apiFetchJson, ApiError } from '@/lib/api-client';
import { useAdminApiQuery } from '@/lib/hooks/useAdminApiQuery';

type PaymentStatus = 'UNPAID' | 'IN_REVIEW' | 'PAID' | 'PAID_TO_DOCTOR' | 'DISPUTED';
type PaymentFilter = 'all' | PaymentStatus | 'OVERDUE_UNPAID';

interface PaymentRow {
  appointmentId: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  proofUrl: string | null;
  proofUploadedAt: string | null;
  patientReference: string | null;
  reviewNotes: string | null;
  payoutReference: string | null;
  appointment: {
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
    consultationFees: number | string | null;
    patient: {
      uid: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
    };
    doctor: {
      uid: string;
      firstName: string | null;
      lastName: string | null;
      name: string | null;
      email: string | null;
    };
  };
}

interface PayoutMethodsResponse {
  methods: Array<{
    id: string;
    methodCode: string;
    methodLabel?: string | null;
    accountTitle?: string | null;
    accountIdentifier: string;
    bankName?: string | null;
    iban?: string | null;
    instructions?: string | null;
    isPrimary?: boolean;
  }>;
}

interface PaymentListResponse {
  payments: PaymentRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    unpaid: number;
    inReview: number;
    paid: number;
    paidToDoctor: number;
    disputed: number;
    overdueUnpaid: number;
  };
}

interface RevenueSummaryResponse {
  totalRevenue: number;
  counts: {
    unpaid: number;
    inReview: number;
    paid: number;
    paidToDoctor: number;
    disputed: number;
  };
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>('IN_REVIEW');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [reviewingAppointmentId, setReviewingAppointmentId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [payoutReference, setPayoutReference] = useState('');
  const [doctorPayoutMethods, setDoctorPayoutMethods] = useState<PayoutMethodsResponse['methods']>([]);
  const [loadingPayoutMethods, setLoadingPayoutMethods] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [submitting, setSubmitting] = useState(false);

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const deferredSearch = useDeferredValue(search);

  const paymentsQueryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter === 'OVERDUE_UNPAID') {
      params.set('overdueUnpaid', 'true');
    } else if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    if (deferredSearch.trim()) params.set('search', deferredSearch.trim());
    params.set('page', String(page));
    params.set('limit', String(limit));
    return `${process.env.NEXT_PUBLIC_API_URL}/api/admin/appointments/payments?${params.toString()}`;
  }, [statusFilter, deferredSearch, page, limit]);

  const {
    data: paymentPayload,
    isLoading,
    error,
    refetch,
  } = useAdminApiQuery<PaymentListResponse>({
    queryKey: ['admin', 'payments', paymentsQueryUrl],
    queryFn: () => apiFetchJson<PaymentListResponse>(paymentsQueryUrl, { token: adminToken }),
    enabled: !!adminToken,
    staleTime: 30 * 1000,
  });

  const { data: revenuePayload, refetch: refetchRevenue } = useAdminApiQuery<RevenueSummaryResponse>({
    queryKey: ['admin', 'payments', 'revenue'],
    queryFn: () =>
      apiFetchJson<RevenueSummaryResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/appointments/payments/revenue-summary`,
        { token: adminToken }
      ),
    enabled: !!adminToken,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!adminToken) {
      router.push('/admin/login');
    }
  }, [adminToken, router]);

  useEffect(() => {
    const status = (error as ApiError | undefined)?.status;
    if (status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      router.push('/admin/login');
    }
  }, [error, router]);

  const payments = paymentPayload?.payments || [];
  const pagination = paymentPayload?.pagination || { page: 1, totalPages: 1, total: 0, limit };
  const counts = paymentPayload?.counts || {
    unpaid: 0,
    inReview: 0,
    paid: 0,
    paidToDoctor: 0,
    disputed: 0,
    overdueUnpaid: 0,
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const getDoctorName = (payment: PaymentRow) => {
    const doctor = payment.appointment.doctor;
    const fullName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
    return fullName || doctor.name || 'Doctor';
  };

  const getPatientName = (payment: PaymentRow) => {
    const patient = payment.appointment.patient;
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';
  };

  const getStatusBadgeClass = (status: PaymentStatus) => {
    if (status === 'PAID') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'PAID_TO_DOCTOR') return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
    if (status === 'IN_REVIEW') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    if (status === 'DISPUTED') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
  };

  const openReview = async (payment: PaymentRow) => {
    setReviewingAppointmentId(payment.appointmentId);
    setSelectedPayment(payment);
    setReviewNotes(payment.reviewNotes || '');
    setPayoutReference(payment.payoutReference || '');

    if (!adminToken || !payment.appointment.doctor.uid) {
      setDoctorPayoutMethods([]);
      return;
    }

    setLoadingPayoutMethods(true);
    try {
      const data = await apiFetchJson<PayoutMethodsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/doctors/${payment.appointment.doctor.uid}/payout-methods`,
        { token: adminToken }
      );
      setDoctorPayoutMethods(data.methods || []);
    } catch {
      setDoctorPayoutMethods([]);
    } finally {
      setLoadingPayoutMethods(false);
    }
  };

  const closeReview = () => {
    setReviewingAppointmentId(null);
    setSelectedPayment(null);
    setReviewNotes('');
    setPayoutReference('');
    setDoctorPayoutMethods([]);
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter, deferredSearch]);

  const submitReview = async (nextStatus: 'PAID' | 'DISPUTED' | 'PAID_TO_DOCTOR') => {
    if (!reviewingAppointmentId || !adminToken) return;
    setSubmitting(true);

    try {
      if (nextStatus === 'PAID_TO_DOCTOR') {
        await apiFetchJson(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/appointments/${reviewingAppointmentId}/payments/mark-paid-to-doctor`, {
          method: 'POST',
          token: adminToken,
          body: JSON.stringify({
            payoutReference: payoutReference.trim() || null,
          }),
        });
        showNotification('Marked as paid to doctor', 'success');
      } else {
        await apiFetchJson(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/appointments/${reviewingAppointmentId}/payments/review`, {
          method: 'POST',
          token: adminToken,
          body: JSON.stringify({
            status: nextStatus,
            reviewNotes: reviewNotes.trim() || null,
          }),
        });
        showNotification(`Payment marked as ${nextStatus}`, 'success');
      }

      closeReview();
      await Promise.all([refetch(), refetchRevenue()]);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to update payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <AdminLoading title="Loading Payments" subtitle="Fetching appointment payment records..." />;
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Appointment Payments"
        subtitle="Review payment proofs, verify transfers, and mark payouts to doctors."
        actions={
          <button
            onClick={() => {
              void Promise.all([refetch(), refetchRevenue()]);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 mb-6">
        <StatCard title="In Review" value={counts.inReview} />
        <StatCard title="Overdue 24h+" value={counts.overdueUnpaid} />
        <StatCard title="Unpaid" value={counts.unpaid} />
        <StatCard title="Paid" value={counts.paid} />
        <StatCard title="Paid to Doctor" value={counts.paidToDoctor} />
        <StatCard title="Revenue" value={`PKR ${(revenuePayload?.totalRevenue || 0).toLocaleString('en-PK')}`} />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, doctor or appointment"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'OVERDUE_UNPAID', 'UNPAID', 'IN_REVIEW', 'PAID', 'PAID_TO_DOCTOR', 'DISPUTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  statusFilter === status
                    ? status === 'OVERDUE_UNPAID'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                }`}
              >
                {status === 'all' ? 'All' : status === 'OVERDUE_UNPAID' ? 'Overdue 24h+ Unpaid' : status.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3">Appointment</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Proof</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    {statusFilter === 'OVERDUE_UNPAID' ? 'No overdue unpaid records found (24h+).' : 'No payment records found.'}
                  </td>
                </tr>
              )}

              {payments.map((payment) => (
                <tr key={payment.appointmentId} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{payment.appointment.id}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(payment.appointment.appointmentDate).toLocaleDateString('en-PK')}
                    </div>
                  </td>
                  <td className="px-4 py-3">{getPatientName(payment)}</td>
                  <td className="px-4 py-3">Dr. {getDoctorName(payment)}</td>
                  <td className="px-4 py-3">PKR {Number(payment.appointment.consultationFees || 0).toLocaleString('en-PK')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(payment.paymentStatus)}`}>
                      {payment.paymentStatus.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {payment.proofUploadedAt ? new Date(payment.proofUploadedAt).toLocaleString('en-PK') : 'No upload time'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {payment.proofUrl ? (
                      <button onClick={() => setPreviewProofUrl(payment.proofUrl)} className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    ) : (
                      <span className="text-slate-400">Not uploaded</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void openReview(payment)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => {
              const next = parseInt(e.target.value, 10);
              setLimit(next);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {reviewingAppointmentId && (
        <div className="fixed inset-0 z-50 bg-black/45 p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Manage Payment</h3>

            {selectedPayment && (
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Patient Verification</p>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">{getPatientName(selectedPayment)}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Email: {selectedPayment.appointment.patient.email || 'N/A'}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Phone (profile): {selectedPayment.appointment.patient.phone || 'N/A'}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Proof Uploaded: {selectedPayment.proofUploadedAt ? new Date(selectedPayment.proofUploadedAt).toLocaleString('en-PK') : 'Not uploaded'}</p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Appointment Context</p>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">{selectedPayment.appointment.id}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Date: {new Date(selectedPayment.appointment.appointmentDate).toLocaleDateString('en-PK')}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Time: {selectedPayment.appointment.startTime} - {selectedPayment.appointment.endTime}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Appointment Status: {selectedPayment.appointment.status}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">Amount: PKR {Number(selectedPayment.appointment.consultationFees || 0).toLocaleString('en-PK')}</p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Doctor Payout Cross Reference</p>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">Dr. {getDoctorName(selectedPayment)}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Email: {selectedPayment.appointment.doctor.email || 'N/A'}</p>
                  {loadingPayoutMethods ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Loading payout methods...</p>
                  ) : doctorPayoutMethods.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">No active payout methods found.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {doctorPayoutMethods.map((method) => (
                        <div key={method.id} className="rounded border border-slate-200 dark:border-slate-700 p-2">
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">
                            {method.methodLabel || method.methodCode}{method.isPrimary ? ' (Primary)' : ''}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">Account: {method.accountIdentifier}</p>
                          {method.accountTitle && <p className="text-xs text-slate-600 dark:text-slate-300">Title: {method.accountTitle}</p>}
                          {method.bankName && <p className="text-xs text-slate-600 dark:text-slate-300">Bank: {method.bankName}</p>}
                          {method.iban && <p className="text-xs text-slate-600 dark:text-slate-300">IBAN: {method.iban}</p>}
                          {method.instructions && <p className="text-xs text-slate-600 dark:text-slate-300">Instructions: {method.instructions}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Admin notes (optional)"
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm mb-3"
            />

            <input
              value={payoutReference}
              onChange={(e) => setPayoutReference(e.target.value)}
              placeholder="Payout reference (optional)"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm mb-4"
            />

            <div className="flex flex-wrap gap-2">
              <button
                disabled={submitting}
                onClick={() => void submitReview('PAID')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> Mark Paid
              </button>
              <button
                disabled={submitting}
                onClick={() => void submitReview('PAID_TO_DOCTOR')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 text-white px-3 py-2 text-sm hover:bg-teal-700 disabled:opacity-50"
              >
                <Clock className="w-4 h-4" /> Mark Paid To Doctor
              </button>
              <button
                disabled={submitting}
                onClick={() => void submitReview('DISPUTED')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 text-white px-3 py-2 text-sm hover:bg-rose-700 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Mark Disputed
              </button>
              <button
                disabled={submitting}
                onClick={closeReview}
                className="ml-auto rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" onClick={() => setPreviewProofUrl(null)}>
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Payment Proof Preview</h4>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm"
              >
                Close
              </button>
            </div>
            <div className="w-full h-[75vh] bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
              <img src={previewProofUrl} alt="Payment proof" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} type={toastType} show={showToast} onClose={() => setShowToast(false)} />
    </AdminPageShell>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
