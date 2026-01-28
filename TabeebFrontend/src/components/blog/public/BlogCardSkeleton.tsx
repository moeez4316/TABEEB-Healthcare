import React from 'react';

interface BlogCardSkeletonProps {
  count?: number;
}

export const BlogCardSkeleton: React.FC<BlogCardSkeletonProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden h-full flex flex-col animate-pulse"
        >
          {/* Cover Image Skeleton */}
          <div className="h-48 w-full bg-gray-300 dark:bg-slate-700" />

          {/* Content Skeleton */}
          <div className="p-5 flex flex-col flex-grow">
            {/* Tags Skeleton */}
            <div className="flex gap-2 mb-3">
              <div className="h-5 w-16 bg-gray-200 dark:bg-slate-700 rounded-md" />
              <div className="h-5 w-20 bg-gray-200 dark:bg-slate-700 rounded-md" />
            </div>

            {/* Title Skeleton */}
            <div className="space-y-2 mb-3">
              <div className="h-5 bg-gray-300 dark:bg-slate-700 rounded w-full" />
              <div className="h-5 bg-gray-300 dark:bg-slate-700 rounded w-4/5" />
            </div>

            {/* Excerpt Skeleton */}
            <div className="space-y-2 mb-4 flex-grow">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
            </div>

            {/* Author Skeleton */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-700" />
              <div className="space-y-1">
                <div className="h-4 w-24 bg-gray-300 dark:bg-slate-700 rounded" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
              </div>
            </div>

            {/* Footer Meta Skeleton */}
            <div className="flex gap-4 mt-3">
              <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-12 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
