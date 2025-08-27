'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatDate } from '@/lib/verification/utils';
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
  cnic: string;
  cnicFileType?: string;
  certificate?: string;
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
  
  // Image popup states
  const [imageModal, setImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; fileType?: string } | null>(null);

  // File type detection functions
  const isImage = (fileType?: string) => fileType?.startsWith("image/") || false;
  const isPDF = (fileType?: string) => fileType === "application/pdf" || false;
  
  // Function to detect file type from URL if not provided
  const detectFileType = (url: string): string => {
    // Handle Cloudinary URLs which might have format indicators
    if (url.includes('cloudinary.com')) {
      // Check for common image formats in Cloudinary URLs
      if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('f_jpg') || url.includes('format:jpg')) {
        return 'image/jpeg';
      }
      if (url.includes('.png') || url.includes('f_png') || url.includes('format:png')) {
        return 'image/png';
      }
      if (url.includes('.pdf') || url.includes('f_pdf') || url.includes('format:pdf')) {
        return 'application/pdf';
      }
      if (url.includes('.webp') || url.includes('f_webp')) {
        return 'image/webp';
      }
      // Default to image for Cloudinary if no specific format detected
      return 'image/jpeg';
    }
    
    // For other URLs, check file extension
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0]; // Remove query parameters
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'image/jpeg'; // Default assumption for images
    }
  };

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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/all`, {
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
      
      // Backend returns array directly, not wrapped in object
      // Set doctorName and doctorEmail to null for current API since they're not provided
      const processedData = Array.isArray(data) ? data.map(verification => ({
        ...verification,
        doctorName: null, // Currently not provided by API
        doctorEmail: null // Currently not provided by API
      })) : [];
      
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

  const openImageModal = (url: string, title: string, fileType?: string) => {
    const detectedFileType = fileType || detectFileType(url);
    setSelectedImage({ url, title, fileType: detectedFileType });
    setImageModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setImageModal(false);
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const handleReview = async () => {
    if (!selectedVerification || !reviewData.action) return;

    setSubmitting(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        alert('Authentication error. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/${reviewData.action}/${selectedVerification.doctorUid}`, {
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
          alert('Session expired. Please login again.');
          localStorage.removeItem('adminToken');
          window.location.href = '/admin/login';
          return;
        }
        
        throw new Error(errorData.error || `Failed to ${reviewData.action} verification`);
      }

      alert(`Verification ${reviewData.action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      closeReviewModal();
      await fetchVerifications();
    } catch (error) {
      console.error('Error updating verification:', error);
      alert(`Failed to ${reviewData.action} verification: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl text-white">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Doctor Verification Management
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 ml-12">Review and manage doctor verification submissions</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
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
          </div>

          {/* Filter Tabs */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="text-slate-500 dark:text-slate-400 w-5 h-5 mr-2" />
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filter === filterOption
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/70'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
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

        {/* Verifications Grid */}
        <div className="grid gap-6">
          {filteredVerifications.map((verification, index) => (
            <div 
              key={`${verification.id}-${verification.doctorUid}-${index}`} 
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-xl border border-teal-200 dark:border-teal-800">
                      <User className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                        {verification.doctorName || 'Doctor Name Not Available'}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{verification.doctorEmail || 'Email Not Available'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-mono">PMDC: {verification.pmdcNumber || 'Not Available'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(verification.status)}
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <Calendar className="w-3 h-3" />
                      {formatDate(verification.submittedAt)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => openReviewModal(verification)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                  
                  <button
                    onClick={() => openImageModal(verification.cnic, `CNIC - ${verification.doctorName || 'Doctor'}`, verification.cnicFileType)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <FileText className="w-4 h-4" />
                    View CNIC
                  </button>
                  
                  {verification.certificate && (
                    <button
                      onClick={() => openImageModal(verification.certificate!, `Certificate - ${verification.doctorName || 'Doctor'}`, verification.certificateFileType)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <Download className="w-4 h-4" />
                      View Certificate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVerifications.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-12 border border-white/20 dark:border-slate-700/50 shadow-lg max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No verifications found</h3>
              <p className="text-slate-600 dark:text-slate-400">
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto border border-white/20 dark:border-slate-700/50">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl text-white">
                      <Eye className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Review Verification</h2>
                  </div>
                  <button
                    onClick={closeReviewModal}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {selectedVerification && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Doctor:</span>
                      <span className="text-slate-800 dark:text-white">{selectedVerification.doctorName || 'Name Not Available'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Email:</span>
                      <span className="text-slate-800 dark:text-white">{selectedVerification.doctorEmail || 'Email Not Available'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">PMDC:</span>
                      <span className="text-slate-800 dark:text-white font-mono">{selectedVerification.pmdcNumber || 'Not Available'}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Decision
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setReviewData(prev => ({ ...prev, action: 'approve' }))}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        reviewData.action === 'approve'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Check className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm font-semibold">Approve</span>
                    </button>
                    <button
                      onClick={() => setReviewData(prev => ({ ...prev, action: 'reject' }))}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        reviewData.action === 'reject'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <X className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm font-semibold">Reject</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Comments
                  </label>
                  <textarea
                    value={reviewData.comments}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                    rows={4}
                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                    placeholder="Add your comments here..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleReview}
                    disabled={!reviewData.action || submitting}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                      reviewData.action === 'approve'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg'
                        : reviewData.action === 'reject'
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-lg'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? 'Processing...' : 'Submit Decision'}
                  </button>
                  
                  <button
                    onClick={closeReviewModal}
                    className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image/Document Modal */}
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
                  
                  <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
                    {isImage(selectedImage.fileType) && (
                      <Image
                        src={selectedImage.url}
                        alt={selectedImage.title}
                        width={800}
                        height={600}
                        className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                        priority={true}
                        onError={() => {
                          console.error('Image failed to load:', selectedImage.url);
                        }}
                      />
                    )}
                    
                    {isPDF(selectedImage.fileType) && (
                      <iframe
                        src={selectedImage.url}
                        title={selectedImage.title}
                        className="w-full h-full rounded-xl border-0"
                        style={{ minHeight: '70vh' }}
                      />
                    )}
                    
                    {!isImage(selectedImage.fileType) && !isPDF(selectedImage.fileType) && (
                      <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                        <div className="w-20 h-20 mb-6 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                          <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-xl font-semibold mb-2 dark:text-slate-300">Unsupported file type</p>
                        <p className="text-sm mb-6">File type: {selectedImage.fileType || 'Unknown'}</p>
                        <a 
                          href={selectedImage.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:from-teal-600 hover:to-emerald-700 transition-all shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          Open in new tab
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
