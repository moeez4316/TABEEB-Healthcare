'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/verification/utils';
import { Toast } from '@/components/Toast';
import { fetchWithRateLimit } from '@/lib/api-utils';
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
  Check
} from 'lucide-react';

interface VerificationRecord {
  id: string;
  doctorUid: string;
  doctorName?: string; // provided by current API
  doctorEmail?: string; // provided by current API
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
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetchWithRateLimit(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/all`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to fetch verifications');
      }

      const data = await response.json();
      
      // Debug: Log the raw response to see what we're getting
      console.log('Raw verification data:', data);
      
      // Backend returns array directly, not wrapped in object
      // Process data to handle both new and legacy document formats
      const processedData = Array.isArray(data) ? data.map(verification => {
        console.log('Processing verification:', verification.doctorUid, 'Doctor data:', verification.doctor);
        
        // Enhanced fallback logic for doctor information
        const doctorName = verification.doctor?.name || 
                          (verification.doctor?.firstName && verification.doctor?.lastName 
                            ? `${verification.doctor.firstName} ${verification.doctor.lastName}`
                            : null) ||
                          `Doctor ${verification.doctorUid.substring(0, 8)}...`;
        
        const doctorEmail = verification.doctor?.email || 'Email not available';
        
        return {
          ...verification,
          doctorName,
          doctorEmail,
          // Map legacy fields for backward compatibility
          cnic: verification.cnicFrontUrl || verification.cnic,
          certificate: verification.pmdcCertificateUrl || verification.certificate
        };
      }) : [];
      
      console.log('Processed verification data:', processedData);
      setVerifications(processedData);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

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

      const response = await fetchWithRateLimit(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/${reviewData.action}/${selectedVerification.doctorUid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          adminComments: reviewData.comments.trim() || (reviewData.action === 'approve' ? 'Approved by admin' : 'Rejected by admin'),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (response.status === 401) {
          showNotification('Session expired. Please login again.', 'error');
          setTimeout(() => {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login';
          }, 2000);
          return;
        }
        
        throw new Error(errorData.error || `Failed to ${reviewData.action} verification`);
      }

      showNotification(
        `Verification ${reviewData.action === 'approve' ? 'approved' : 'rejected'} successfully!`,
        reviewData.action === 'approve' ? 'success' : 'error'
      );
      closeReviewModal();
      await fetchVerifications();
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

  const getFilterCounts = () => {
    return {
      all: verifications.length,
      pending: verifications.filter(v => v.status === 'pending').length,
      approved: verifications.filter(v => v.status === 'approved').length,
      rejected: verifications.filter(v => v.status === 'rejected').length,
    };
  };

  const filteredVerifications = verifications.filter(verification => {
    const matchesFilter = filter === 'all' || verification.status === filter;
    
    // Future-proof search functionality:
    // - Currently works on PMDC number and doctor UID 
    // - Will automatically work on doctor name and email when API provides them
    // - No code changes needed when backend is updated
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      // Search by doctor name (when available in future)
      (verification.doctorName && verification.doctorName.toLowerCase().includes(searchLower)) ||
      // Search by doctor email (when available in future)
      (verification.doctorEmail && verification.doctorEmail.toLowerCase().includes(searchLower)) ||
      // Search by PMDC number (currently working)
      (verification.pmdcNumber && verification.pmdcNumber.toLowerCase().includes(searchLower)) ||
      // Search by doctor UID as fallback
      (verification.doctorUid && verification.doctorUid.toLowerCase().includes(searchLower));
    
    return matchesFilter && matchesSearch;
  });

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-teal-200 dark:border-teal-800 opacity-20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Loading Verifications</h3>
          <p className="text-slate-600 dark:text-slate-300">Please wait while we fetch the data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl text-white w-fit">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Doctor Verification Management
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Review and manage doctor verification submissions</p>
              </div>
            </div>
          </div>
        </div>

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
                placeholder="Search by PMDC number, doctor name, or email..."
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
                {/* Top Section: Doctor Info + Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-center justify-center">
                      <User className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-1 truncate">
                        {verification.doctorName || 'Doctor Name Not Available'}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1.5">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="text-sm truncate">{verification.doctorEmail || 'Email Not Available'}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Shield className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-mono">PMDC: {verification.pmdcNumber || 'N/A'}</span>
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
                          <span className="text-xs text-slate-500 dark:text-slate-400">PMDC Reg:</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(verification.pmdcRegistrationDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents Grid */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Submitted Documents</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {(verification.cnicFrontUrl || verification.cnic) ? (
                      <button
                        onClick={() => openImageModal(
                          verification.cnicFrontUrl || verification.cnic!,
                          `CNIC Front - ${verification.doctorName || 'Doctor'}`
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
                        onClick={() => openImageModal(verification.cnicBackUrl!, `CNIC Back - ${verification.doctorName || 'Doctor'}`)}
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
                        onClick={() => openImageModal(verification.verificationPhotoUrl!, `Verification Photo - ${verification.doctorName || 'Doctor'}`)}
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
                        onClick={() => openImageModal(verification.degreeCertificateUrl!, `Degree Certificate - ${verification.doctorName || 'Doctor'}`)}
                        className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Degree</span>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-dashed border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-900/5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 dark:text-red-500" />
                        </div>
                        <span className="text-xs font-medium text-red-400 dark:text-red-500">Degree</span>
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      </div>
                    )}

                    {(verification.pmdcCertificateUrl || verification.certificate) ? (
                      <button
                        onClick={() => openImageModal(
                          verification.pmdcCertificateUrl || verification.certificate!,
                          `PMDC Certificate - ${verification.doctorName || 'Doctor'}`
                        )}
                        className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-400">PMDC</span>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-dashed border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-900/5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 dark:text-red-500" />
                        </div>
                        <span className="text-xs font-medium text-red-400 dark:text-red-500">PMDC</span>
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
                        {selectedVerification?.doctorName || 'Doctor'}
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
                    {/* Doctor Information Section */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Doctor Information</h3>
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
                            <label className="text-xs text-slate-500 dark:text-slate-400">PMDC Number</label>
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
                          { label: 'Degree Certificate', available: !!selectedVerification.degreeCertificateUrl, required: true },
                          { label: 'PMDC Certificate', available: !!(selectedVerification.pmdcCertificateUrl || selectedVerification.certificate), required: true },
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
                      <span className="text-[10px] opacity-70">Doctor is verified</span>
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
                    placeholder="Add your comments for the doctor (visible to them)..."
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
    </div>
  );
}
