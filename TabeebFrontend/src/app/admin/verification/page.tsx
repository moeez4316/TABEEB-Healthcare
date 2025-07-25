'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatDate } from '@/lib/verification/utils';

interface VerificationRecord {
  id: string;
  doctorUid: string;
  doctorName: string;
  doctorEmail: string;
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
      setVerifications(Array.isArray(data) ? data : []);
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const filteredVerifications = verifications.filter(verification => {
    if (filter === 'all') return true;
    return verification.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Verification Management</h1>
        <p className="text-gray-600">Review and manage doctor verification submissions</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex space-x-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              {filterOption !== 'all' && (
                <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {verifications.filter(v => v.status === filterOption).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PMDC Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVerifications.map((verification, index) => (
                <tr key={`${verification.id}-${verification.doctorUid}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {verification.doctorName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {verification.doctorEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {verification.pmdcNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(verification.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(verification.submittedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openReviewModal(verification)}
                      className="text-blue-600 hover:text-blue-900 mr-3 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => openImageModal(verification.cnic, `CNIC - ${verification.doctorName}`, verification.cnicFileType)}
                      className="text-green-600 hover:text-green-900 mr-3 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                    >
                      View CNIC
                    </button>
                    {verification.certificate && (
                      <button
                        onClick={() => openImageModal(verification.certificate!, `Certificate - ${verification.doctorName}`, verification.certificateFileType)}
                        className="text-purple-600 hover:text-purple-900 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                      >
                        View Certificate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVerifications.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No verifications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'pending' ? 'No pending verifications at the moment.' : `No ${filter} verifications found.`}
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={closeReviewModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '10px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
              Review Verification
            </h2>
            
            {selectedVerification && (
              <div style={{ marginBottom: '20px' }}>
                <p><strong>Doctor:</strong> {selectedVerification.doctorName}</p>
                <p><strong>Email:</strong> {selectedVerification.doctorEmail}</p>
                <p><strong>PMDC:</strong> {selectedVerification.pmdcNumber}</p>
              </div>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Decision:
              </label>
              <select 
                value={reviewData.action}
                onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value as 'approve' | 'reject' }))}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #ccc', 
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
              >
                <option value="">-- Select Decision --</option>
                <option value="approve">✅ Approve</option>
                <option value="reject">❌ Reject</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Comments:
              </label>
              <textarea 
                value={reviewData.comments}
                onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                rows={4}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #ccc', 
                  borderRadius: '5px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
                placeholder="Add your comments here..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleReview}
                disabled={!reviewData.action || submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: reviewData.action === 'approve' ? '#10B981' : reviewData.action === 'reject' ? '#EF4444' : '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: submitting || !reviewData.action ? 'not-allowed' : 'pointer',
                  opacity: submitting || !reviewData.action ? 0.5 : 1,
                  fontSize: '16px'
                }}
              >
                {submitting ? 'Processing...' : 'Submit'}
              </button>
              
              <button
                onClick={closeReviewModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image/Document Modal */}
      {imageModal && selectedImage && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
          style={{ zIndex: 9999 }}
          onClick={closeImageModal}
        >
          <div 
            className="relative w-full max-w-5xl h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 10000 }}
          >
            <button
              className="absolute top-4 right-4 bg-white text-gray-700 rounded-full p-2 shadow hover:bg-gray-100 focus:outline-none"
              onClick={closeImageModal}
              aria-label="Close preview"
              style={{ zIndex: 10001 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="w-full h-full flex items-center justify-center bg-white rounded-xl p-4 shadow-xl">
              <div className="relative w-full h-full flex flex-col">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                  {selectedImage.title}
                </h3>
                
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  {isImage(selectedImage.fileType) && (
                    <Image
                      src={selectedImage.url}
                      alt={selectedImage.title}
                      width={800}
                      height={600}
                      className="max-h-full max-w-full object-contain rounded-lg shadow"
                      priority={true}
                      onError={(e) => {
                        console.error('Image failed to load:', selectedImage.url);
                        // You can add fallback handling here
                      }}
                    />
                  )}
                  
                  {isPDF(selectedImage.fileType) && (
                    <iframe
                      src={selectedImage.url}
                      title={selectedImage.title}
                      className="w-full h-full rounded-lg border shadow"
                      style={{ minHeight: '70vh' }}
                    />
                  )}
                  
                  {!isImage(selectedImage.fileType) && !isPDF(selectedImage.fileType) && (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium mb-2">Unsupported file type</p>
                      <p className="text-sm">File type: {selectedImage.fileType || 'Unknown'}</p>
                      <a 
                        href={selectedImage.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
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
  );
}
