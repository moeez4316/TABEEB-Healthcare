"use client";

import { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaFilter, FaExclamationTriangle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '@/lib/auth-context';
import { getDoctorReviews, getDoctorRating, Review } from '@/lib/review-api';

type FilterType = 'all' | 'regular' | 'complaints';

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function DoctorReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // Fetch rating statistics
  useEffect(() => {
    if (!token) return;

    const fetchRating = async () => {
      try {
        const data = await getDoctorRating(token);
        setAverageRating(data.averageRating);
        setRatingCount(data.totalReviews);
      } catch (err: any) {
        console.error('Failed to fetch rating:', err);
      }
    };

    fetchRating();
  }, [token]);

  // Fetch reviews
  useEffect(() => {
    if (!token) return;

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        const filterComplaints =
          filter === 'regular' ? false : filter === 'complaints' ? true : undefined;

        const data = await getDoctorReviews(token, currentPage, 10, filterComplaints);
        setReviews(data.reviews);
        setTotalPages(data.pagination.totalPages);
        setTotalReviews(data.pagination.totalReviews);
      } catch (err: any) {
        setError(err.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token, filter, currentPage]);

  const isClosedByPatient = (review: Review) => {
    return review.isComplaint && review.adminActionTaken && 
      (review.adminActionTaken.includes('[Complaint closed by patient]') || 
       review.adminActionTaken.includes('[Complaint closed by admin]'));
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= rating ? (
              <FaStar className="text-yellow-400 text-lg" />
            ) : (
              <FaRegStar className="text-gray-300 dark:text-gray-600 text-lg" />
            )}
          </span>
        ))}
      </div>
    );
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Please log in to view reviews</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Reviews</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage patient reviews and feedback
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Rating Summary Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-teal-600 dark:text-teal-400">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex gap-1 mt-2">{renderStars(Math.round(averageRating))}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {ratingCount} {ratingCount === 1 ? 'Review' : 'Reviews'}
              </p>
            </div>

            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reviews.filter((r) => !r.isComplaint).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Regular Reviews</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reviews.filter((r) => r.isComplaint).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Complaints</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReviews}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <FaFilter className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                All Reviews
              </button>
              <button
                onClick={() => {
                  setFilter('regular');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'regular'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                Regular Reviews
              </button>
              <button
                onClick={() => {
                  setFilter('complaints');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'complaints'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                Complaints
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Reviews List */}
        {!loading && !error && reviews.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
            <FaStar className="mx-auto text-gray-300 dark:text-gray-600 text-5xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' && "You haven't received any reviews yet."}
              {filter === 'regular' && "You haven't received any regular reviews yet."}
              {filter === 'complaints' && "You haven't received any complaints."}
            </p>
          </div>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border ${
                  isClosedByPatient(review)
                    ? 'border-blue-400 dark:border-blue-500'
                    : review.isComplaint
                    ? 'border-red-200 dark:border-red-800'
                    : 'border-gray-200 dark:border-slate-700'
                } p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {review.appointment.patient.firstName} {review.appointment.patient.lastName}
                      </h3>
                      {review.isComplaint && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          isClosedByPatient(review)
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          <FaExclamationTriangle className="text-xs" />
                          {isClosedByPatient(review) ? 'Resolved' : 'Complaint'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Appointment: {formatDate(review.appointment.appointmentDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating)}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>

                {review.comment && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                )}

                {review.isComplaint && (review.adminNotes || review.adminActionTaken) && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Admin Response:
                    </p>
                    {review.adminNotes && (
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                        <span className="font-medium">Notes:</span> {review.adminNotes}
                      </p>
                    )}
                    {review.adminActionTaken && (
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-medium">Action Taken:</span> {review.adminActionTaken}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FaChevronLeft />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
