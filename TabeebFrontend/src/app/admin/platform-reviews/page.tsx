'use client';

import React, { useState } from 'react';
import { useApiQuery } from '@/lib/hooks/useApiQuery';
import { getAdminPlatformReviews, updatePlatformReviewStatus, toggleFeaturedPlatformReview, deletePlatformReview, PlatformReview } from '@/lib/platform-review-api';
import { Star, CheckCircle, XCircle, Trash2, Loader2, AlertTriangle } from 'lucide-react';

export default function PlatformReviewsAdmin() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setAdminToken(localStorage.getItem('adminToken'));
    }
  }, []);

  const { data, isLoading, refetch } = useApiQuery({
    queryKey: ['admin', 'platform-reviews', page, statusFilter],
    queryFn: () => getAdminPlatformReviews(adminToken as string, page, 10, statusFilter),
    enabled: !!adminToken,
  });

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    try {
      await updatePlatformReviewStatus(adminToken as string, id, status);
      refetch();
    } catch (error) {
      console.error('Error updating status', error);
      alert('Failed to update review status');
    }
  };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await toggleFeaturedPlatformReview(adminToken as string, id, !isFeatured);
      refetch();
    } catch (error) {
      console.error('Error updating featured status', error);
      alert('Failed to update featured status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deletePlatformReview(adminToken as string, id);
      refetch();
    } catch (error) {
      console.error('Error deleting review', error);
      alert('Failed to delete review');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Reviews</h1>
          <p className="text-slate-600 dark:text-slate-400">Moderate testimonials displayed on the landing page</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading || !adminToken ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : !data || data.reviews.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-900 dark:text-white">No reviews found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">There are no platform reviews matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">Author</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">Rating</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">Review</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data?.reviews.map((review: PlatformReview) => (
                  <tr key={review.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{review.displayName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full ${review.authorRole === 'DOCTOR' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                          {review.authorRole}
                        </span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-amber-400">
                        {review.rating} <Star className="w-4 h-4 ml-1 fill-current" />
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                        &quot;{review.comment}&quot;
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        review.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        review.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {review.status}
                      </span>
                      {review.status === 'APPROVED' && (
                        <div className="mt-2 text-xs">
                          {review.isFeatured ? (
                            <span className="text-teal-600 font-medium flex items-center">
                              <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                            </span>
                          ) : (
                            <span className="text-slate-500">Not Featured</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {review.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(review.id, 'APPROVED')}
                              className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(review.id, 'REJECTED')}
                              className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {review.status === 'APPROVED' && (
                          <button
                            onClick={() => handleToggleFeatured(review.id, !!review.isFeatured)}
                            className={`p-2 rounded-lg transition-colors ${
                              review.isFeatured 
                                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                            title={review.isFeatured ? 'Unfeature' : 'Feature on Top'}
                          >
                            <Star className={`w-5 h-5 ${review.isFeatured ? 'fill-current' : ''}`} />
                          </button>
                        )}
                        {(review.status === 'APPROVED' || review.status === 'REJECTED') && (
                          <button
                            onClick={() => handleUpdateStatus(review.id, 'PENDING')}
                            className="p-2 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded-lg transition-colors"
                            title="Move to Pending"
                          >
                            <AlertTriangle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {data.pagination.currentPage} of {data.pagination.totalPages} ({data.pagination.totalReviews} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
