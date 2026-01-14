'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FaStar, FaCalendar, FaUserMd, FaFlag, FaExclamationTriangle } from 'react-icons/fa';
import { formatDate } from '@/lib/dateUtils';
import Link from 'next/link';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isComplaint: boolean;
  createdAt: string;
  adminNotes: string | null;
  adminActionTaken: string | null;
  appointment: {
    appointmentDate: string;
    doctor: {
      name: string;
      specialization: string;
    };
  };
}

export default function PatientReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/api/reviews/my-written-reviews`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Reviews</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                All reviews you've written for doctors
              </p>
            </div>
            <Link
              href="/Patient/dashboard"
              className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium text-sm"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
            <FaStar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Reviews Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't written any reviews yet. Complete an appointment to leave a review.
            </p>
            <Link
              href="/Patient/appointments"
              className="inline-block px-6 py-3 bg-teal-600 dark:bg-teal-500 text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors"
            >
              View Appointments
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {reviews.length}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <FaStar className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border ${
                    review.isComplaint
                      ? 'border-red-200 dark:border-red-800'
                      : 'border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <FaUserMd className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Dr. {review.appointment.doctor.name}
                            </h3>
                          </div>
                          <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                            {review.appointment.doctor.specialization}
                          </p>
                        </div>
                        {review.isComplaint && (
                          <span className="flex items-center space-x-1 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                            <FaFlag className="w-3 h-3" />
                            <span>Complaint</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <div className="flex items-center space-x-1">
                          <FaCalendar className="w-4 h-4" />
                          <span>{formatDate(new Date(review.appointment.appointmentDate))}</span>
                        </div>
                        <span>•</span>
                        <span>Reviewed {formatDate(new Date(review.createdAt))}</span>
                      </div>

                      {/* Rating */}
                      <div className="mb-4">{renderStars(review.rating)}</div>

                      {/* Comment */}
                      {review.comment && (
                        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                        </div>
                      )}

                      {/* Admin Response */}
                      {(review.adminNotes || review.adminActionTaken) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-start space-x-2">
                            <FaExclamationTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
                                Admin Response
                              </p>
                              {review.adminNotes && (
                                <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                                  {review.adminNotes}
                                </p>
                              )}
                              {review.adminActionTaken && (
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                  Action: {review.adminActionTaken}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
