'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Loader2, Send, CheckCircle } from 'lucide-react';
import { submitPlatformReview, checkMyPlatformReview } from '@/lib/platform-review-api';
import { useAuth } from '@/lib/auth-context';

interface PlatformReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlatformReviewModal = ({ isOpen, onClose }: PlatformReviewModalProps) => {
  const { user, token } = useAuth();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setComment('');
      setError(null);
      setSuccess(false);
      setAlreadySubmitted(false);
      
      if (token) {
        checkStatus();
      } else {
        setIsChecking(false);
      }
    }
  }, [isOpen, token]);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const res = await checkMyPlatformReview(token!);
      if (res.recentlySubmitted) {
        setAlreadySubmitted(true);
      }
    } catch (err) {
      console.error('Failed to check review status', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.length < 20) {
      setError('Please write at least 20 characters about your experience');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await submitPlatformReview(token, { rating, comment });
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(result.message || 'Failed to submit review');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Share Your Experience</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            {isChecking ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Loading...</p>
              </div>
            ) : !user ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Please log in to share your experience with the TABEEB community.
                </p>
                <a
                  href={`/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`}
                  className="inline-flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Log In or Sign Up
                </a>
              </div>
            ) : alreadySubmitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Thank You!</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  You have already shared your experience recently. We appreciate your feedback!
                </p>
                <button
                  onClick={onClose}
                  className="mt-8 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : success ? (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle size={32} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Review Submitted!</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your feedback is being reviewed and will appear on the platform soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    How would you rate your overall experience?
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          size={36}
                          className={`${
                            (hoverRating || rating) >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tell us more about your experience
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like? How has TABEEB helped you?"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  ></textarea>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-slate-500">
                      Minimum 20 characters
                    </span>
                    <span className={`text-xs ${comment.length > 1000 ? 'text-red-500' : 'text-slate-500'}`}>
                      {comment.length}/1000
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || rating === 0 || comment.length < 20 || comment.length > 1000}
                    className="flex items-center px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PlatformReviewModal;
