import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Blog } from '@/types/blog';
import { Calendar, Clock, Eye, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BlogCardProps {
  blog: Blog;
  priority?: boolean;
}

export const BlogCard: React.FC<BlogCardProps> = ({ blog, priority = false }) => {
  const publishedDate = formatDistanceToNow(new Date(blog.publishedAt || blog.createdAt), { addSuffix: true });

  return (
    <Link href={`/blogs/${blog.slug}`} className="group">
      <article className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Cover Image */}
        <div className="relative h-48 w-full overflow-hidden bg-gray-200 dark:bg-slate-700">
          <Image
            src={blog.coverImageUrl}
            alt={blog.title}
            fill
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {blog.isFeatured && (
            <div className="absolute top-3 right-3 bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Featured
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {blog.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-md"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {blog.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
            {blog.excerpt}
          </p>

          {/* Author & Meta Info */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {blog.authorImage ? (
                <Image
                  src={blog.authorImage}
                  alt={blog.authorName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                  <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {blog.authorName}
                </p>
                {blog.authorType === 'DOCTOR' && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                    Verified Doctor
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{publishedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{blog.readTime} min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{blog.viewCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};
