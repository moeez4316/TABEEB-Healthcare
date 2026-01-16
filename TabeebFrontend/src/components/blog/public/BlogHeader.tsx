'use client';

import React from 'react';
import Image from 'next/image';
import { Blog } from '@/types/blog';
import { Calendar, Clock, User, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface BlogHeaderProps {
  blog: Blog;
}

export const BlogHeader: React.FC<BlogHeaderProps> = ({ blog }) => {
  const publishedDate = format(new Date(blog.publishedAt), 'MMMM dd, yyyy');
  const timeAgo = formatDistanceToNow(new Date(blog.publishedAt), { addSuffix: true });

  return (
    <header className="mb-8">
      {/* Cover Image */}
      <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
        <Image
          src={blog.coverImageUrl}
          alt={blog.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1200px"
        />
        {blog.isFeatured && (
          <div className="absolute top-6 right-6 bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
            Featured Article
          </div>
        )}
      </div>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {blog.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-sm font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-full"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
        {blog.title}
      </h1>

      {/* Author & Meta Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-slate-700">
        {/* Author */}
        <div className="flex items-center gap-4">
          {blog.authorImage ? (
            <Image
              src={blog.authorImage}
              alt={blog.authorName}
              width={56}
              height={56}
              className="rounded-full"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
              <User className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {blog.authorName}
              {blog.authorType === 'DOCTOR' && (
                <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              )}
            </p>
            {blog.authorType === 'DOCTOR' && (
              <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                Verified Doctor
              </p>
            )}
            {blog.externalSourceName && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Source: {blog.externalSourceName}
              </p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{publishedDate} ({timeAgo})</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{blog.readTime} min read • {blog.viewCount.toLocaleString()} views</span>
          </div>
        </div>
      </div>
    </header>
  );
};
