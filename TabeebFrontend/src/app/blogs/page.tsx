'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFeaturedBlogs, useBlogs, useBlogTags } from '@/lib/hooks/useBlog';
import { FeaturedBlogsCarousel } from '@/components/blog/public/FeaturedBlogsCarousel';
import { BlogCard } from '@/components/blog/public/BlogCard';
import { BlogCardSkeleton } from '@/components/blog/public/BlogCardSkeleton';
import { CategoryFilter } from '@/components/blog/public/CategoryFilter';
import { BlogSearchBar } from '@/components/blog/public/BlogSearchBar';
import { BlogPagination } from '@/components/blog/public/BlogPagination';
import { BookOpen, TrendingUp, AlertCircle, ChevronRight, Home } from 'lucide-react';

function BlogsPageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams?.get('page') || '1');
  const search = searchParams?.get('search') || '';
  const tag = searchParams?.get('tag') || '';
  const sortBy = (searchParams?.get('sortBy') as 'publishedAt' | 'viewCount' | 'createdAt') || 'publishedAt';

  // Fetch data
  const { data: featuredBlogs, isLoading: featuredLoading } = useFeaturedBlogs(6);
  const { data: blogsData, isLoading: blogsLoading, error: blogsError } = useBlogs({
    page,
    limit: 20,
    search: search || undefined,
    tag: tag || undefined,
    sortBy,
    sortOrder: 'desc',
  });
  const { data: tags, isLoading: tagsLoading } = useBlogTags();

  const showFeatured = !search && !tag && page === 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-white font-medium">
              Health Blog
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-10 h-10 md:w-12 md:h-12" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Health Blog
              </h1>
            </div>
            <p className="text-lg md:text-xl text-teal-50 mb-8">
              Expert health advice from verified doctors and trusted medical sources
            </p>
            <BlogSearchBar />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Featured Blogs Carousel */}
        {showFeatured && (
          <section className="mb-12">
            {featuredLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-64 bg-gray-300 dark:bg-slate-700 rounded mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <BlogCardSkeleton count={3} />
                </div>
              </div>
            ) : featuredBlogs && featuredBlogs.length > 0 ? (
              <FeaturedBlogsCarousel blogs={featuredBlogs} />
            ) : null}
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Category Filter */}
              {tagsLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 animate-pulse">
                  <div className="h-6 w-32 bg-gray-300 dark:bg-slate-700 rounded mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 bg-gray-200 dark:bg-slate-700 rounded" />
                    ))}
                  </div>
                </div>
              ) : tags && tags.length > 0 ? (
                <CategoryFilter tags={tags} />
              ) : null}

              {/* Sort Options */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Sort By
                </h3>
                <div className="space-y-2">
                  {[
                    { value: 'publishedAt', label: 'Most Recent', icon: TrendingUp },
                    { value: 'viewCount', label: 'Most Viewed', icon: TrendingUp },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams?.toString());
                        params.set('sortBy', value);
                        params.delete('page');
                        window.location.href = `/blogs?${params.toString()}`;
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-colors ${
                        sortBy === value
                          ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content - Blog Grid */}
          <main className="lg:col-span-3">
            {/* Results Header */}
            {(search || tag) && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {search ? `Search results for "${search}"` : `Category: ${tag}`}
                </h2>
                {blogsData && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {blogsData.pagination.total} articles found
                  </p>
                )}
              </div>
            )}

            {/* Error State */}
            {blogsError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                  Failed to load blogs
                </h3>
                <p className="text-red-700 dark:text-red-400">
                  {blogsError.message}
                </p>
              </div>
            )}

            {/* Loading State */}
            {blogsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <BlogCardSkeleton count={6} />
              </div>
            )}

            {/* Empty State */}
            {!blogsLoading && blogsData && blogsData.blogs.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No articles found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {search || tag
                    ? 'Try adjusting your search or filter criteria'
                    : 'No blog articles available at the moment'}
                </p>
                {(search || tag) && (
                  <button
                    onClick={() => (window.location.href = '/blogs')}
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                  >
                    View All Blogs
                  </button>
                )}
              </div>
            )}

            {/* Blogs Grid */}
            {!blogsLoading && blogsData && blogsData.blogs.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {blogsData.blogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                  ))}
                </div>

                {/* Pagination */}
                <BlogPagination
                  currentPage={blogsData.pagination.page}
                  totalPages={blogsData.pagination.totalPages}
                  totalItems={blogsData.pagination.total}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function BlogsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading blogs...</p>
          </div>
        </div>
      }
    >
      <BlogsPageContent />
    </Suspense>
  );
}
