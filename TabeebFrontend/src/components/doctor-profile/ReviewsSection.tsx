import React, { useState } from 'react';
import { FaStar, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { DoctorReview, DoctorStats } from '@/types/doctor-profile';
import { formatDistanceToNow } from 'date-fns';

interface ReviewsSectionProps {
  reviews: DoctorReview[];
  stats: DoctorStats;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  stats,
  onLoadMore,
  hasMore = false,
  loading = false
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayedReviews = showAll ? reviews : reviews.slice(0, 5);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <FaStar
        key={index}
        className={index < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
        size={16}
      />
    ));
  };

  const getRatingPercentage = (stars: number) => {
    const total = stats.totalReviews;
    if (total === 0) return 0;
    return ((stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution] / total) * 100).toFixed(0);
  };

  if (reviews.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Patient Reviews
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Patient Reviews ({stats.totalReviews})
      </h2>

      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Rating */}
          <div className="flex flex-col items-center justify-center border-r-0 md:border-r border-gray-200 dark:border-gray-700">
            <div className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mb-2">
              {renderStars(Math.round(stats.averageRating))}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Based on {stats.totalReviews} reviews
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                  {stars} ★
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getRatingPercentage(stars)}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                  {getRatingPercentage(stars)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold">
                    {review.patientName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {review.patientName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {renderStars(review.rating)}
              </div>
            </div>
            {review.comment && (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {reviews.length > 5 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-300"
          >
            {showAll ? (
              <>
                <FaChevronUp />
                Show Less Reviews
              </>
            ) : (
              <>
                <FaChevronDown />
                Show All {reviews.length} Reviews
              </>
            )}
          </button>
        </div>
      )}

      {/* Load More (for pagination) */}
      {hasMore && onLoadMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold rounded-lg transition-colors duration-300 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}
    </div>
  );
};
