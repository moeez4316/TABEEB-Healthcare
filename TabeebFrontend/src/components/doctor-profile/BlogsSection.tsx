import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaClock, FaEye, FaArrowRight } from 'react-icons/fa';
import { DoctorBlogPreview } from '@/types/doctor-profile';
import { format } from 'date-fns';

interface BlogsSectionProps {
  blogs: DoctorBlogPreview[];
  totalBlogs: number;
  doctorUid: string;
}

export const BlogsSection: React.FC<BlogsSectionProps> = ({
  blogs,
  totalBlogs,
  doctorUid
}) => {
  if (blogs.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Published Articles ({totalBlogs})
        </h2>
        {totalBlogs > 6 && (
          <Link
            href={`/blogs?author=${doctorUid}`}
            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold flex items-center gap-2 transition-colors"
          >
            View All
            <FaArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/blogs/${blog.slug}`}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            {/* Cover Image */}
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {blog.coverImageUrl ? (
                <Image
                  src={blog.coverImageUrl}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-500">
                  <span className="text-white text-4xl font-bold">
                    {blog.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {blog.title}
              </h3>

              {blog.excerpt && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {blog.excerpt}
                </p>
              )}

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {blog.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {blog.tags.length > 2 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      +{blog.tags.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  <FaClock />
                  <span>{blog.readTime} min read</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaEye />
                  <span>{blog.viewCount} views</span>
                </div>
                {blog.publishedAt && (
                  <span>{format(new Date(blog.publishedAt), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
