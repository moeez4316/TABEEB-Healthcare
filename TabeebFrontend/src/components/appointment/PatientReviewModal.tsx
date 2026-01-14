'use client';

import { useState } from 'react';
import { FaStar, FaTimes, FaCheck, FaFlag, FaExternalLinkAlt } from 'react-icons/fa';
import { Appointment } from '@/types/appointment';
import Link from 'next/link';

interface PatientReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  firebaseToken: string;
  onSuccess?: () => void;
}

export default function PatientReviewModal({ 
  isOpen, 
  onClose, 
  appointment, 
  firebaseToken,
  onSuccess 
}: PatientReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isComplaint, setIsComplaint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (isComplaint && !comment.trim()) {
      setError('Comment is required when filing a complaint');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/reviews/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
          rating,
          comment: comment.trim() || undefined,
          isComplaint
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-slate-700">
        {/* Decorative gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600" />
        
        {/* Header */}
        <div className="relative p-8 pb-6">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
          >
            <FaTimes className="w-5 h-5" />
          </button>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
              <FaStar className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Share Your Experience
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your feedback helps us maintain quality healthcare
              </p>
              <div className="mt-3 flex items-center space-x-2">
                <div className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 rounded-full">
                  <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
                    Dr. {appointment.doctor?.name}
                  </p>
                </div>
                {appointment.doctor?.specialization && (
                  <div className="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {appointment.doctor.specialization}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <form 
          onSubmit={handleSubmit} 
          className="px-8 pb-12 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)] pr-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#14b8a6 transparent'
          }}
        >
          <style jsx>{`
            form::-webkit-scrollbar {
              width: 8px;
            }
            form::-webkit-scrollbar-track {
              background: transparent;
              border-radius: 10px;
              margin: 8px 0 8px 0;
            }
            form::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #14b8a6, #0d9488);
              border-radius: 10px;
              border: 2px solid transparent;
              background-clip: padding-box;
              transition: all 0.3s ease;
              min-height: 40px;
            }
            form::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #0d9488, #0f766e);
              background-clip: padding-box;
            }
          `}</style>
          {/* Star Rating */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 rounded-xl p-6 border-2 border-amber-200/50 dark:border-amber-800/30">
            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-1">
              How would you rate your experience? *
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Click on the stars to rate
            </p>
            <div className="flex items-center justify-center space-x-3 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="group transition-all duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded-lg p-1"
                >
                  <FaStar
                    className={`w-12 h-12 transition-all duration-200 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg filter brightness-110'
                        : 'text-gray-300 dark:text-gray-600 group-hover:text-yellow-200 dark:group-hover:text-yellow-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div className="mt-3 text-center">
                <p className="inline-block px-4 py-2 bg-white dark:bg-slate-700 rounded-full shadow-sm">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{rating}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400"> / 5 stars</span>
                </p>
              </div>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Share your detailed feedback {isComplaint && <span className="text-red-600">*</span>}
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Tell us about your experience (optional, but helpful)
            </p>
            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white resize-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="What did you like about your consultation? Any suggestions for improvement?"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
                {comment.length} characters
              </div>
            </div>
          </div>

          {/* Complaint Checkbox */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <input
                type="checkbox"
                id="isComplaint"
                checked={isComplaint}
                onChange={(e) => setIsComplaint(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="isComplaint" className="flex-1">
                <div className="flex items-center space-x-2 text-sm font-medium text-red-700 dark:text-red-400">
                  <FaFlag className="w-4 h-4" />
                  <span>This is a complaint</span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Complaints will be reviewed by admin and won't affect the doctor's public rating. A comment is required for complaints.
                </p>
              </label>
            </div>
            
            {isComplaint && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-2">
                  Before filing a complaint, please read our policy:
                </p>
                <Link
                  href="/complaint-policy"
                  target="_blank"
                  className="inline-flex items-center space-x-2 text-sm text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 font-medium underline"
                >
                  <span>Read Complaint Policy</span>
                  <FaExternalLinkAlt className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-l-4 border-red-500 animate-shake">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-800/30 rounded-full flex items-center justify-center">
                <FaTimes className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 font-medium hover:border-gray-400 dark:hover:border-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 dark:from-teal-600 dark:via-teal-700 dark:to-teal-800 text-white rounded-xl hover:from-teal-600 hover:via-teal-700 hover:to-teal-800 dark:hover:from-teal-700 dark:hover:via-teal-800 dark:hover:to-teal-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-[1.02]"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FaCheck className="w-4 h-4" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
