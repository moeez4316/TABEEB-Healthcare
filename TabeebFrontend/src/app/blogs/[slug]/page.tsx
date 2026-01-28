'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useBlogBySlug } from '@/lib/hooks/useBlog';
import { BlogHeader } from '@/components/blog/public/BlogHeader';
import { BlogContent } from '@/components/blog/public/BlogContent';
import { ShareButtons } from '@/components/blog/public/ShareButtons';
import { BlogCard } from '@/components/blog/public/BlogCard';
import { ReadingProgressBar } from '@/components/blog/public/ReadingProgressBar';
import { ChevronRight, Home, AlertCircle, Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = use(params);
  const { data: blog, isLoading, error } = useBlogBySlug(slug);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading article...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    if (error.message === 'Blog not found') {
      notFound();
    }
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 dark:text-red-300 mb-2">
            Failed to Load Article
          </h2>
          <p className="text-red-700 dark:text-red-400 mb-6">
            {error.message}
          </p>
          <Link
            href="/blogs"
            className="inline-block px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      {/* Reading Progress Bar */}
      <ReadingProgressBar />

      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Breadcrumb */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/blogs" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Health Blog
              </Link>
              {blog.tags && blog.tags[0] && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <Link
                    href={`/blogs?tag=${blog.tags[0].slug}`}
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    {blog.tags[0].name}
                  </Link>
                </>
              )}
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 dark:text-white font-medium line-clamp-1">
                {blog.title}
              </span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Article */}
            <article className="lg:col-span-8 xl:col-span-9">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-10">
                <BlogHeader blog={blog} />
                <BlogContent contentHtml={blog.contentHtml} />

                {/* External Source Info */}
                {blog.externalSourceUrl && (
                  <div className="mt-12 p-6 bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-600 rounded-r-xl">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Original Source:</strong>
                    </p>
                    <a
                      href={blog.externalSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                    >
                      {blog.externalSourceName || blog.externalSourceUrl}
                    </a>
                  </div>
                )}
              </div>

              {/* Similar/Related Blogs */}
              {blog.similarBlogs && blog.similarBlogs.length > 0 ? (
                <div className="mt-12">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                    You Might Also Like
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {blog.similarBlogs.slice(0, 3).map((similarBlog) => (
                      <BlogCard key={similarBlog.id} blog={similarBlog} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-12 bg-gray-100 dark:bg-slate-800 rounded-xl p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No related articles available at this time.
                  </p>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="sticky top-4 space-y-6">
                {/* Share Buttons */}
                <ShareButtons title={blog.title} url={currentUrl} />

                {/* Author Info (if doctor) */}
                {blog.doctor && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      About the Author
                    </h3>
                    <div className="text-center">
                      {blog.doctor.profileImageUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={blog.doctor.profileImageUrl}
                          alt={blog.doctor.name}
                          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                        />
                      )}
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        {blog.doctor.name}
                      </p>
                      <p className="text-sm text-teal-600 dark:text-teal-400 font-medium mb-2">
                        {blog.doctor.specialization}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {blog.doctor.qualification}
                      </p>
                    </div>
                  </div>
                )}

                {/* External Author Bio */}
                {blog.externalAuthorBio && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      About the Author
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {blog.externalAuthorBio}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Related Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/blogs?tag=${tag.slug}`}
                          className="text-sm font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                        >
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
