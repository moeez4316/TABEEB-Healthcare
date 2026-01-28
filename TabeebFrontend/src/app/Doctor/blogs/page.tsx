'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PenSquare, BookOpen, FileText, ChevronRight } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config/appConfig';
import { useAuth } from '@/lib/auth-context';
import { useMyBlogs } from '@/lib/hooks/useBlog';

export default function DoctorBlogsPage() {
  const { token } = useAuth();

  // Fetch doctor's blogs for stats
  const { data: blogsData } = useMyBlogs(
    {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 100,
    },
    token!,
    !!token
  );

  const blogs = blogsData?.blogs || [];

  // Calculate stats
  const stats = {
    published: blogs.filter(b => b.status === 'PUBLISHED').length,
    totalViews: blogs.reduce((sum, b) => sum + b.viewCount, 0),
    drafts: blogs.filter(b => b.status === 'DRAFT').length,
  };

  const blogOptions = [
    {
      id: 'write',
      title: 'Write Blog',
      description: 'Create and publish new health articles to share your medical expertise',
      icon: PenSquare,
      href: '/Doctor/blogs/write',
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      borderColor: 'border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600',
      iconBg: 'bg-teal-100 dark:bg-teal-900/30',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      id: 'browse',
      title: 'Browse Blogs',
      description: 'Explore published articles from the medical community and stay updated',
      icon: BookOpen,
      href: '/blogs',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'my-blogs',
      title: 'My Blogs',
      description: 'View, edit, and manage all your published and draft articles',
      icon: FileText,
      href: '/Doctor/blogs/my-blogs',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={40} height={40} className="object-contain" />
                <div>
                  <h1 className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                    TABEEB
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                    Healthcare Platform
                  </p>
                </div>
              </div>
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Blogs
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">TABEEB Blogs</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Share your medical expertise, explore insights from fellow healthcare professionals, and manage your content all in one place.
          </p>
        </div>

        {/* Blog Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {blogOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.id}
                href={option.href}
                className={`group relative ${option.bgColor} rounded-2xl shadow-lg border-2 ${option.borderColor} p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 overflow-hidden`}
              >
                {/* Background Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${option.iconBg} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${option.iconColor}`} />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {option.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {option.description}
                  </p>

                  {/* Arrow Icon */}
                  <div className="flex items-center justify-end">
                    <ChevronRight className={`w-6 h-6 ${option.iconColor} group-hover:translate-x-2 transition-transform duration-300`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats Section (Optional - can show doctor's blog stats) */}
        <div className="mt-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 max-w-4xl mx-auto border border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Your Blog Impact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">
                {stats.published}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Published Articles
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stats.totalViews}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Views
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {stats.drafts}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Draft Articles
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
