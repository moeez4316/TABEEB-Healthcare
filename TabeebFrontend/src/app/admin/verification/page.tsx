'use client';

import { useState, useEffect, useDeferredValue, useMemo } from 'react';
import { formatDate } from '@/lib/verification/utils';
import { Toast } from '@/components/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminApiQuery } from '@/lib/hooks/useAdminApiQuery';
import { apiFetchJson, ApiError } from '@/lib/api-client';
import AdminLoading from '@/components/admin/AdminLoading';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { 
  Search, 
  Eye, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter,
  Download,
  Calendar,
  Mail,
  User,
  Shield,
  X,
  Check,
  RefreshCw,
  Globe,
  AlertTriangle,
  Database,
  Loader2
} from 'lucide-react';

interface PmdcQualification {
  Speciality: string;
  Degree: string;
  University: string;
  PassingYear: string;
  IsActive: boolean | null;
}

interface PmdcLookupData {
  found: boolean;
  pmdcNumber: string;
  doctorName?: string;
  fatherName?: string;
  registrationType?: string;
  registrationDate?: string;
  validUpto?: string;
  registrationStatus?: string;
  qualification?: string;
  institution?: string;
  qualifications?: PmdcQualification[];
  rawData?: Record<string, unknown>;
  source: string;
  fetchedAt: string;
  errorMessage?: string;
  fromCache: boolean;
}

interface VerificationRecord {
  id: string;
  doctorUid: string;
  doctorName?: string; // provided by current API
  doctorEmail?: string; // provided by current API
  doctor?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    [key: string]: unknown;
  };
  pmdcNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminComments?: string;
  cnicNumber?: string;
  graduationYear?: string;
  degreeInstitution?: string;
  pmdcRegistrationDate?: string;
  // Document URLs
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  verificationPhotoUrl?: string;
  degreeCertificateUrl?: string;
  pmdcCertificateUrl?: string;
  // Legacy fields for backward compatibility
  cnic?: string; // Maps to cnicFrontUrl
  certificate?: string; // Maps to pmdcCertificateUrl
  cnicFileType?: string;
  certificateFileType?: string;
}

export default function AdminVerificationPage() {
  const [selectedVerification, setSelectedVerification] = useState<VerificationRecord | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    action: '' as 'approve' | 'reject' | '',
    comments: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toast notification states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  
  // Image popup states
  const [imageModal, setImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; isPdf: boolean } | null>(null);
  
  // PMDC lookup states
  const [pmdcLookupData, setPmdcLookupData] = useState<Record<string, PmdcLookupData>>({});
  const [pmdcLookupLoading, setPmdcLookupLoading] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const {
    data: verificationPayload,
    isLoading,
    error: verificationError,
    refetch,
  } = useAdminApiQuery<VerificationRecord[]>({
    queryKey: ['admin', 'verifications'],
    queryFn: () =>
      apiFetchJson<VerificationRecord[]>(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/all`, {
        token: adminToken,
      }),
    enabled: !!adminToken,
    staleTime: 30 * 1000,
  });

  // Format a date string to DD/MM/YYYY to match PMDC's format
  const formatDateDDMMYYYY = (dateString: string): string => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (!adminToken) {
      window.location.href = '/admin/login';
    }
  }, [adminToken]);

  useEffect(() => {
    const status = (verificationError as ApiError | undefined)?.status;
    if (status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
  }, [verificationError]);

  const verifications = useMemo(() => {
    const data = Array.isArray(verificationPayload) ? verificationPayload : [];
    return data.map((verification) => {
      const doctorName =
        verification.doctor?.name ||
        (verification.doctor?.firstName && verification.doctor?.lastName
          ? `${verification.doctor.firstName} ${verification.doctor.lastName}`
          : null) ||
        `Practitioner ${verification.doctorUid.substring(0, 8)}...`;

      const doctorEmail = verification.doctor?.email || 'Email not available';

      return {
        ...verification,
        doctorName,
        doctorEmail,
        cnic: verification.cnicFrontUrl || verification.cnic,
        certificate: verification.pmdcCertificateUrl || verification.certificate,
      };
    });
  }, [verificationPayload]);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const openReviewModal = (verification: VerificationRecord) => {
    setSelectedVerification(verification);
    setReviewModal(true);
    setReviewData({ action: '', comments: '' });
    document.body.style.overflow = 'hidden';
  };

  const closeReviewModal = () => {
    setReviewModal(false);
    setSelectedVerification(null);
    setReviewData({ action: '', comments: '' });
    document.body.style.overflow = 'unset';
  };

  const openImageModal = (url: string, title: string) => {
    const isPdf = url.includes('/raw/upload/');
    setSelectedImage({ url, title, isPdf });
    setImageModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setImageModal(false);
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // PMDC Lookup function
  const fetchPmdcData = async (pmdcNumber: string, forceRefresh = false) => {
    if (!pmdcNumber) return;
    
    setPmdcLookupLoading(prev => ({ ...prev, [pmdcNumber]: true }));
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        showNotification('Authentication error. Please login again.', 'error');
        return;
      }

      const endpoint = forceRefresh ? 'pmdc-refresh' : 'pmdc-lookup';
      const method = forceRefresh ? 'POST' : 'GET';
      
      const result = await apiFetchJson<{ success: boolean; data?: PmdcLookupData }>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/verification/${endpoint}/${encodeURIComponent(pmdcNumber)}`,
        {
          method,
          token: adminToken,
        }
      );

      if (result.success && result.data) {
        const lookup = result.data as PmdcLookupData;
        setPmdcLookupData(prev => ({ ...prev, [pmdcNumber]: lookup }));
        
        if (result.data.found) {
          showNotification('PMDC data fetched successfully!', 'success');
        } else {
          showNotification(
            result.data.errorMessage || 'No data found for this PMDC number on the PMDC website.',
            'info'
          );
        }
      } else {
        showNotification('Unexpected response from server. Try refreshing.', 'error');
      }
    } catch (error) {
      console.error('Error fetching PMDC data:', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_CONNECTION')) {
        showNotification('Cannot reach the backend server. Make sure it is running on port 5002.', 'error');
      } else {
        showNotification(`Failed to fetch PMDC data: ${msg || 'Unknown error'}. Try the Refresh button or verify manually on pmdc.pk.`, 'error');
      }
    } finally {
      setPmdcLookupLoading(prev => ({ ...prev, [pmdcNumber]: false }));
    }
  };

  // Compare submitted info with PMDC data
  const getComparisonClass = (submitted?: string, pmdc?: string): string => {
    if (!submitted || !pmdc) return '';
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalize(submitted) === normalize(pmdc)) {
      return 'text-emerald-600 dark:text-emerald-400'; // Match
    }
    // Partial match (one contains the other)
    if (normalize(submitted).includes(normalize(pmdc)) || normalize(pmdc).includes(normalize(submitted))) {
      return 'text-amber-600 dark:text-amber-400'; // Partial match
    }
    return 'text-red-600 dark:text-red-400'; // Mismatch
  };

  const getComparisonBadge = (submitted?: string, pmdc?: string) => {
    if (!submitted || !pmdc) return null;
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalize(submitted) === normalize(pmdc)) {
      return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium"><CheckCircle className="w-2.5 h-2.5" />Match</span>;
    }
    if (normalize(submitted).includes(normalize(pmdc)) || normalize(pmdc).includes(normalize(submitted))) {
      return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium"><AlertTriangle className="w-2.5 h-2.5" />Partial</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium"><XCircle className="w-2.5 h-2.5" />Mismatch</span>;
  };

  const handleReview = async () => {
    if (!selectedVerification || !reviewData.action) return;

    setSubmitting(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        showNotification('Authentication error. Please login again.', 'error');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
        return;
      }

      await apiFetchJson(
        `${process.env.NEXT_PUBLIC_API_URL}/api/verification/${reviewData.action}/${selectedVerification.doctorUid}`,
        {
          method: 'PATCH',
          token: adminToken,
          body: JSON.stringify({
            adminComments:
              reviewData.comments.trim() ||
              (reviewData.action === 'approve' ? 'Approved by admin' : 'Rejected by admin'),
          }),
        }
      );

      showNotification(
        `Verification ${reviewData.action === 'approve' ? 'approved' : 'rejected'} successfully!`,
        reviewData.action === 'approve' ? 'success' : 'error'
      );
      closeReviewModal();
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
    } catch (error) {
      console.error('Error updating verification:', error);
      showNotification(
        `Failed to ${reviewData.action} verification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const counts = useMemo(() => {
    return verifications.reduce(
      (acc, verification) => {
        acc.all += 1;
        if (verification.status === 'pending') acc.pending += 1;
        if (verification.status === 'approved') acc.approved += 1;
        if (verification.status === 'rejected') acc.rejected += 1;
        return acc;
      },
      { all: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [verifications]);

  const filteredVerifications = useMemo(() => {
    const searchLower = deferredSearchTerm.trim().toLowerCase();
    const hasSearch = searchLower.length > 0;

    return verifications.filter((verification) => {
      const matchesFilter = filter === 'all' || verification.status === filter;
      if (!matchesFilter) return false;

      if (!hasSearch) return true;

      // Future-proof search functionality:
      // - Currently works on registration number and practitioner UID
      // - Will automatically work on practitioner name and email when API provides them
      // - No code changes needed when backend is updated
      return (
        (verification.doctorName &&
          verification.doctorName.toLowerCase().includes(searchLower)) ||
        (verification.doctorEmail &&
          verification.doctorEmail.toLowerCase().includes(searchLower)) ||
        (verification.pmdcNumber &&
          verification.pmdcNumber.toLowerCase().includes(searchLower)) ||
        (verification.doctorUid &&
          verification.doctorUid.toLowerCase().includes(searchLower))
      );
    });
  }, [verifications, filter, deferredSearchTerm]);

  if (isLoading) {
    return (
      <AdminLoading title="Loading Verifications" subtitle="Fetching the latest verification queue..." />
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Doctor Verification"
        subtitle="Review pending applications and verify clinical credentials."
        meta={
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Pending: {counts.pending}</span>
            <span>Approved: {counts.approved}</span>
            <span>Rejected: {counts.rejected}</span>
          </div>
        }
      />
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/20 dark:border-slate-700/50 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Total</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">{counts.all}</p>
          </div>
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-amber-200/50 dark:border-amber-800/30 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400">Pending</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300">{counts.pending}</p>
          </div>
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-emerald-200/50 dark:border-emerald-800/30 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400">Approved</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-300">{counts.approved}</p>
          </div>
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-red-200/50 dark:border-red-800/30 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-400">Rejected</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-red-700 dark:text-red-300">{counts.rejected}</p>
          </div>
        </div>

        {/* Search and Filters Combined */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 dark:border-slate-700/50 shadow-lg mb-6 lg:mb-8">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by registration number, practitioner name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="text-slate-500 dark:text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    filter === filterOption
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/70'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  <span className={`ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                    filter === filterOption
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                  }`}>
                    {counts[filterOption]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Verifications List */}
        <div className="space-y-4 sm:space-y-6">
          {filteredVerifications.map((verification, index) => (
            <div 
              key={`${verification.id}-${verification.doctorUid}-${index}`} 
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Card Header with Status Bar */}
              <div className={`h-1.5 ${
                verification.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                verification.status === 'approved' ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
                'bg-gradient-to-r from-red-400 to-rose-400'
              }`} />

              <div className="p-5 sm:p-6 lg:p-8">
                {/* Top Section: Practitioner Info + Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-center justify-center">
                      <User className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-1 truncate">
                        {verification.doctorName || 'Practitioner Name Not Available'}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1.5">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="text-sm truncate">{verification.doctorEmail || 'Email Not Available'}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Shield className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-mono">Reg: {verification.pmdcNumber || 'N/A'}</span>
                        </div>
                        {verification.cnicNumber && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="text-sm font-mono">CNIC: {verification.cnicNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1.5 shrink-0">
                    {getStatusBadge(verification.status)}
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(verification.submittedAt)}
                    </div>
                  </div>
                </div>

                {/* Additional Details Row */}
                {(verification.graduationYear || verification.degreeInstitution || verification.pmdcRegistrationDate) && (
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 sm:p-4 mb-6 border border-slate-100 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {verification.graduationYear && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">Graduation:</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{verification.graduationYear}</span>
                        </div>
                      )}
                      {verification.degreeInstitution && (
                        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">Institution:</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{verification.degreeInstitution}</span>
                        </div>
                      )}
                      {verification.pmdcRegistrationDate && (
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">Reg. Date:</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(verification.pmdcRegistrationDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PMDC Verification Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      PMDC Website Verification (Optional)
                    </h4>
                    <div className="flex items-center gap-2">
                      {pmdcLookupData[verification.pmdcNumber] && (
                        <button
                          onClick={() => fetchPmdcData(verification.pmdcNumber, true)}
                          disabled={pmdcLookupLoading[verification.pmdcNumber]}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
                          title="Force refresh from PMDC website"
                        >
                          <RefreshCw className={`w-3 h-3 ${pmdcLookupLoading[verification.pmdcNumber] ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                      )}
                      <button
                        onClick={() => fetchPmdcData(verification.pmdcNumber)}
                        disabled={pmdcLookupLoading[verification.pmdcNumber]}
                        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${
                          pmdcLookupData[verification.pmdcNumber]?.found
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md'
                        }`}
                      >
                        {pmdcLookupLoading[verification.pmdcNumber] ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Fetching...</>
                        ) : pmdcLookupData[verification.pmdcNumber] ? (
                          <><Database className="w-3 h-3" /> PMDC Data Loaded</>
                        ) : (
                          <><Globe className="w-3 h-3" /> Fetch PMDC Data</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* PMDC Data Display */}
                  {pmdcLookupData[verification.pmdcNumber] && (
                    <div className={`rounded-xl border-2 p-4 sm:p-5 transition-all ${
                      pmdcLookupData[verification.pmdcNumber].found
                        ? 'border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10'
                        : 'border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/10'
                    }`}>
                      {pmdcLookupData[verification.pmdcNumber].found ? (
                        <>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                              PMDC Official Record (If Applicable)
                            </span>
                            {pmdcLookupData[verification.pmdcNumber].fromCache && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400">
                                Cached
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
                              Fetched: {new Date(pmdcLookupData[verification.pmdcNumber].fetchedAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Side-by-side comparison */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                  <th className="text-left py-2 pr-3 font-semibold">Field</th>
                                  <th className="text-left py-2 px-3 font-semibold">Submitted</th>
                                  <th className="text-left py-2 px-3 font-semibold">PMDC Record</th>
                                  <th className="text-left py-2 pl-3 font-semibold">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/40">
                                {/* Name comparison */}
                                <tr>
                                  <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Name</td>
                                  <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">{verification.doctorName || '—'}</td>
                                  <td className={`py-2.5 px-3 font-medium ${getComparisonClass(verification.doctorName, pmdcLookupData[verification.pmdcNumber].doctorName)}`}>
                                    {pmdcLookupData[verification.pmdcNumber].doctorName || '—'}
                                  </td>
                                  <td className="py-2.5 pl-3">{getComparisonBadge(verification.doctorName, pmdcLookupData[verification.pmdcNumber].doctorName)}</td>
                                </tr>
                                {/* Father's Name */}
                                {pmdcLookupData[verification.pmdcNumber].fatherName && (
                                  <tr>
                                    <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Father&apos;s Name</td>
                                    <td className="py-2.5 px-3 text-slate-400 italic">Not collected</td>
                                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">{pmdcLookupData[verification.pmdcNumber].fatherName}</td>
                                    <td className="py-2.5 pl-3">—</td>
                                  </tr>
                                )}
                                {/* Registration Type */}
                                {pmdcLookupData[verification.pmdcNumber].registrationType && (
                                  <tr>
                                    <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Reg. Type</td>
                                    <td className="py-2.5 px-3 text-slate-400 italic">—</td>
                                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">{pmdcLookupData[verification.pmdcNumber].registrationType}</td>
                                    <td className="py-2.5 pl-3">—</td>
                                  </tr>
                                )}
                                {/* Registration Date */}
                                {pmdcLookupData[verification.pmdcNumber].registrationDate && (
                                  <tr>
                                    <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Reg. Date</td>
                                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">{verification.pmdcRegistrationDate ? formatDateDDMMYYYY(verification.pmdcRegistrationDate) : '—'}</td>
                                    <td className={`py-2.5 px-3 font-medium ${verification.pmdcRegistrationDate ? getComparisonClass(formatDateDDMMYYYY(verification.pmdcRegistrationDate), pmdcLookupData[verification.pmdcNumber].registrationDate) : 'text-slate-800 dark:text-slate-200'}`}>
                                      {pmdcLookupData[verification.pmdcNumber].registrationDate}
                                    </td>
                                    <td className="py-2.5 pl-3">{verification.pmdcRegistrationDate ? getComparisonBadge(formatDateDDMMYYYY(verification.pmdcRegistrationDate), pmdcLookupData[verification.pmdcNumber].registrationDate) : '—'}</td>
                                  </tr>
                                )}
                                {/* License Valid Until */}
                                {pmdcLookupData[verification.pmdcNumber].validUpto && (
                                  <tr>
                                    <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">License Valid Until</td>
                                    <td className="py-2.5 px-3 text-slate-400 italic">—</td>
                                    <td className="py-2.5 px-3">
                                      <span className="text-slate-800 dark:text-slate-200 font-medium">{pmdcLookupData[verification.pmdcNumber].validUpto}</span>
                                    </td>
                                    <td className="py-2.5 pl-3">—</td>
                                  </tr>
                                )}
                                {/* Registration Status */}
                                {pmdcLookupData[verification.pmdcNumber].registrationStatus && (
                                  <tr>
                                    <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Registration Status</td>
                                    <td className="py-2.5 px-3 text-slate-400 italic">—</td>
                                    <td className="py-2.5 px-3">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        pmdcLookupData[verification.pmdcNumber].registrationStatus?.toUpperCase() === 'ACTIVE'
                                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                          : pmdcLookupData[verification.pmdcNumber].registrationStatus?.toUpperCase() === 'EXPIRED' ||
                                            pmdcLookupData[verification.pmdcNumber].registrationStatus?.toUpperCase() === 'SUSPENDED' ||
                                            pmdcLookupData[verification.pmdcNumber].registrationStatus?.toUpperCase() === 'CANCELLED'
                                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                      }`}>
                                        {pmdcLookupData[verification.pmdcNumber].registrationStatus}
                                      </span>
                                    </td>
                                    <td className="py-2.5 pl-3">—</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Qualifications Table */}
                          {pmdcLookupData[verification.pmdcNumber].qualifications && pmdcLookupData[verification.pmdcNumber].qualifications!.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                                <FileText className="w-3 h-3" />
                                Registered Qualifications ({pmdcLookupData[verification.pmdcNumber].qualifications!.length})
                              </h5>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm border border-blue-200/50 dark:border-blue-800/30 rounded-lg overflow-hidden">
                                  <thead>
                                    <tr className="bg-blue-50/50 dark:bg-blue-900/20 text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                      <th className="text-left py-2 px-3 font-semibold">Degree</th>
                                      <th className="text-left py-2 px-3 font-semibold">Speciality</th>
                                      <th className="text-left py-2 px-3 font-semibold">University</th>
                                      <th className="text-left py-2 px-3 font-semibold">Year</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-blue-100/50 dark:divide-blue-800/20">
                                    {pmdcLookupData[verification.pmdcNumber].qualifications!.map((qual, idx) => (
                                      <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10">
                                        <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">{qual.Degree}</td>
                                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{qual.Speciality || '—'}</td>
                                        <td className={`py-2 px-3 font-medium ${getComparisonClass(verification.degreeInstitution, qual.University)}`}>
                                          {qual.University}
                                          {verification.degreeInstitution && (
                                            <span className="ml-2">{getComparisonBadge(verification.degreeInstitution, qual.University)}</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{qual.PassingYear}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                              No PMDC record found
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">
                              {pmdcLookupData[verification.pmdcNumber].errorMessage || 
                                'No matching PMDC record found for this registration number.'}
                            </p>
                            <a
                              href="https://pmdc.pk/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <Globe className="w-3 h-3" />
                              Verify manually on pmdc.pk
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Documents Grid */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Submitted Documents</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {(verification.cnicFrontUrl || verification.cnic) ? (
                      <button
                        onClick={() => openImageModal(
                          verification.cnicFrontUrl || verification.cnic!,
                          `CNIC Front - ${verification.doctorName || 'Practitioner'}`
                        )}
                        className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">CNIC Front</span>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-dashed border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-900/5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 dark:text-red-500" />
                        </div>
                        <span className="text-xs font-medium text-red-400 dark:text-red-500">CNIC Front</span>
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      </div>
                    )}

                    {verification.cnicBackUrl ? (
                      <button
                        onClick={() => openImageModal(verification.cnicBackUrl!, `CNIC Back - ${verification.doctorName || 'Practitioner'}`)}
                        className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">CNIC Back</span>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">CNIC Back</span>
                        <span className="text-[10px] text-slate-400">Optional</span>
                      </div>
                    )}

                    {verification.verificationPhotoUrl ? (
                      <button
                        onClick={() => openImageModal(verification.verificationPhotoUrl!, `Verification Photo - ${verification.doctorName || 'Practitioner'}`)}
                        className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Photo</span>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-dashed border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-900/5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 dark:text-red-500" />
                        </div>
                        <span className="text-xs font-medium text-red-400 dark:text-red-500">Photo</span>
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      </div>
                    )}

                    {verification.degreeCertificateUrl ? (
                      <button
                        onClick={() => openImageModal(verification.degreeCertificateUrl!, `Qualification/Degree Certificate - ${verification.doctorName || 'Practitioner'}`)}
                        className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Qualification</span>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-dashed border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-900/5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 dark:text-red-500" />
                        </div>
                        <span className="text-xs font-medium text-red-400 dark:text-red-500">Qualification</span>
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      </div>
                    )}

                    {(verification.pmdcCertificateUrl || verification.certificate) ? (
                      <button
                        onClick={() => openImageModal(
                          verification.pmdcCertificateUrl || verification.certificate!,
                          `Registration/Council Certificate - ${verification.doctorName || 'Practitioner'}`
                        )}
                        className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Registration</span>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-dashed border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-900/5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 dark:text-red-500" />
                        </div>
                        <span className="text-xs font-medium text-red-400 dark:text-red-500">Registration</span>
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-5 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    onClick={() => openReviewModal(verification)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Review Application
                  </button>
                  {verification.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedVerification(verification);
                          setReviewData({ action: 'approve', comments: '' });
                          setReviewModal(true);
                          document.body.style.overflow = 'hidden';
                        }}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Quick Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVerification(verification);
                          setReviewData({ action: 'reject', comments: '' });
                          setReviewModal(true);
                          document.body.style.overflow = 'hidden';
                        }}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg font-medium"
                      >
                        <X className="w-4 h-4" />
                        Quick Reject
                      </button>
                    </>
                  )}
                  {verification.adminComments && (
                    <div className="sm:ml-auto flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[200px]">{verification.adminComments}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVerifications.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-white/20 dark:border-slate-700/50 shadow-lg max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-2">No verifications found</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {filter === 'pending' 
                  ? 'No pending verifications at the moment.' 
                  : searchTerm 
                    ? `No ${filter !== 'all' ? filter : ''} verifications match your search.`
                    : `No ${filter} verifications found.`
                }
              </p>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-white/20 dark:border-slate-700/50">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl text-white">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Review Verification</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedVerification?.doctorName || 'Practitioner'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeReviewModal}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {selectedVerification && (
                  <>
                    {/* Practitioner Information Section */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Practitioner Information</h3>
                      <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400">Full Name</label>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white mt-0.5">{selectedVerification.doctorName || 'Not Available'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400">Email Address</label>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white mt-0.5 break-all">{selectedVerification.doctorEmail || 'Not Available'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400">Registration / License Number</label>
                            <p className="text-sm font-mono font-semibold text-slate-800 dark:text-white mt-0.5">{selectedVerification.pmdcNumber || 'Not Available'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400">CNIC Number</label>
                            <p className="text-sm font-mono font-semibold text-slate-800 dark:text-white mt-0.5">{selectedVerification.cnicNumber || 'Not Available'}</p>
                          </div>
                          {selectedVerification.graduationYear && (
                            <div>
                              <label className="text-xs text-slate-500 dark:text-slate-400">Graduation Year</label>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white mt-0.5">{selectedVerification.graduationYear}</p>
                            </div>
                          )}
                          {selectedVerification.degreeInstitution && (
                            <div>
                              <label className="text-xs text-slate-500 dark:text-slate-400">Degree Institution</label>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white mt-0.5">{selectedVerification.degreeInstitution}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Document Status Section */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Document Checklist</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {[
                          { label: 'CNIC Front', available: !!(selectedVerification.cnicFrontUrl || selectedVerification.cnic), required: true },
                          { label: 'CNIC Back', available: !!selectedVerification.cnicBackUrl, required: false },
                          { label: 'Verification Photo', available: !!selectedVerification.verificationPhotoUrl, required: true },
                          { label: 'Qualification/Degree Certificate', available: !!selectedVerification.degreeCertificateUrl, required: true },
                          { label: 'Registration/Council Certificate', available: !!(selectedVerification.pmdcCertificateUrl || selectedVerification.certificate), required: true },
                        ].map((doc) => (
                          <div key={doc.label} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                            doc.available
                              ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/40'
                              : doc.required
                              ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
                              : 'bg-slate-50 dark:bg-slate-700/20 border-slate-200 dark:border-slate-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              {doc.available ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.label}</span>
                            </div>
                            {!doc.required && !doc.available && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400">Optional</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PMDC Verification Section (in modal) */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          PMDC Website Verification (Optional)
                        </h3>
                        <button
                          onClick={() => fetchPmdcData(selectedVerification.pmdcNumber, !pmdcLookupData[selectedVerification.pmdcNumber])}
                          disabled={pmdcLookupLoading[selectedVerification.pmdcNumber]}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-sm"
                        >
                          {pmdcLookupLoading[selectedVerification.pmdcNumber] ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Fetching...</>
                          ) : pmdcLookupData[selectedVerification.pmdcNumber] ? (
                            <><RefreshCw className="w-3 h-3" /> Refresh</>
                          ) : (
                            <><Globe className="w-3 h-3" /> Fetch PMDC Data</>
                          )}
                        </button>
                      </div>

                      {pmdcLookupData[selectedVerification.pmdcNumber] ? (
                        pmdcLookupData[selectedVerification.pmdcNumber].found ? (
                          <div className="bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                            <div className="space-y-2.5">
                              {[
                                { label: 'Name', submitted: selectedVerification.doctorName, pmdc: pmdcLookupData[selectedVerification.pmdcNumber].doctorName },
                                { label: 'Father\'s Name', submitted: undefined, pmdc: pmdcLookupData[selectedVerification.pmdcNumber].fatherName },
                                { label: 'Registration Type', submitted: undefined, pmdc: pmdcLookupData[selectedVerification.pmdcNumber].registrationType },
                                { label: 'Registration Date', submitted: selectedVerification.pmdcRegistrationDate ? formatDateDDMMYYYY(selectedVerification.pmdcRegistrationDate) : undefined, pmdc: pmdcLookupData[selectedVerification.pmdcNumber].registrationDate },
                                { label: 'License Valid Until', submitted: undefined, pmdc: pmdcLookupData[selectedVerification.pmdcNumber].validUpto },
                                { label: 'Registration Status', submitted: undefined, pmdc: pmdcLookupData[selectedVerification.pmdcNumber].registrationStatus },
                              ].filter(row => row.pmdc).map((row) => (
                                <div key={row.label} className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">{row.label}</span>
                                    <p className={`text-sm font-medium ${
                                      row.label === 'Registration Status'
                                        ? (row.pmdc?.toUpperCase() === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' :
                                           row.pmdc?.toUpperCase() === 'EXPIRED' || row.pmdc?.toUpperCase() === 'SUSPENDED' || row.pmdc?.toUpperCase() === 'CANCELLED'
                                             ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200')
                                        : 'text-slate-800 dark:text-slate-200'
                                    }`}>
                                      {row.pmdc}
                                    </p>
                                  </div>
                                  <div className="shrink-0">
                                    {row.submitted ? getComparisonBadge(row.submitted, row.pmdc) : null}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Qualifications in modal */}
                            {pmdcLookupData[selectedVerification.pmdcNumber].qualifications && pmdcLookupData[selectedVerification.pmdcNumber].qualifications!.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-800/30">
                                <span className="text-[10px] text-blue-500 dark:text-blue-400 uppercase tracking-wider font-semibold">
                                  Qualifications ({pmdcLookupData[selectedVerification.pmdcNumber].qualifications!.length})
                                </span>
                                <div className="mt-1.5 space-y-1.5">
                                  {pmdcLookupData[selectedVerification.pmdcNumber].qualifications!.map((qual, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">{qual.Degree}</span>
                                      {qual.Speciality && <span className="text-slate-500 dark:text-slate-400">({qual.Speciality})</span>}
                                      <span className="text-slate-400 dark:text-slate-500">—</span>
                                      <span className="text-slate-600 dark:text-slate-300">{qual.University}</span>
                                      {qual.PassingYear && <span className="text-slate-400 dark:text-slate-500">({qual.PassingYear})</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
                            <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              {pmdcLookupData[selectedVerification.pmdcNumber].errorMessage || 'No PMDC record found. Verify manually.'}
                            </p>
                            <a
                              href="https://pmdc.pk/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <Globe className="w-3 h-3" />
                              Verify manually on pmdc.pk
                            </a>
                          </div>
                        )
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-700/20 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
                          <p className="text-xs text-slate-400 dark:text-slate-500">Use &quot;Fetch PMDC Data&quot; for PMDC-registered practitioners. For others, verify using the submitted documents.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Decision Section */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Your Decision</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setReviewData(prev => ({ ...prev, action: 'approve' }))}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        reviewData.action === 'approve'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-md'
                          : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Check className="w-6 h-6" />
                      <span className="text-sm font-bold">Approve</span>
                      <span className="text-[10px] opacity-70">Practitioner is verified</span>
                    </button>
                    <button
                      onClick={() => setReviewData(prev => ({ ...prev, action: 'reject' }))}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        reviewData.action === 'reject'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 shadow-md'
                          : 'border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <X className="w-6 h-6" />
                      <span className="text-sm font-bold">Reject</span>
                      <span className="text-[10px] opacity-70">Needs resubmission</span>
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Admin Comments
                  </label>
                  <textarea
                    value={reviewData.comments}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                    rows={4}
                    className="w-full p-3 sm:p-4 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-sm"
                    placeholder="Add your comments for the practitioner (visible to them)..."
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleReview}
                    disabled={!reviewData.action || submitting}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                      reviewData.action === 'approve'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg'
                        : reviewData.action === 'reject'
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-lg'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? 'Processing...' : reviewData.action === 'approve' ? 'Confirm Approval' : reviewData.action === 'reject' ? 'Confirm Rejection' : 'Select a Decision'}
                  </button>
                  
                  <button
                    onClick={closeReviewModal}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold transition-all text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Modal */}
        {imageModal && selectedImage && (
          <div 
            className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50"
            onClick={closeImageModal}
          >
            <div 
              className="relative w-full max-w-6xl h-[90vh] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white rounded-full p-3 hover:bg-white/20 focus:outline-none z-10 transition-all"
                onClick={closeImageModal}
                aria-label="Close preview"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="w-full h-full flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/50">
                <div className="relative w-full h-full flex flex-col">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 p-4 border-b border-slate-200 dark:border-slate-600">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white text-center">
                      {selectedImage.title}
                    </h3>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center overflow-hidden p-4 bg-slate-100 dark:bg-slate-900">
                    {selectedImage.isPdf ? (
                      <iframe
                        src={selectedImage.url}
                        title={selectedImage.title}
                        className="w-full h-full rounded-lg border-0 bg-white"
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedImage.url}
                        alt={selectedImage.title}
                        className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </AdminPageShell>
  );
}
