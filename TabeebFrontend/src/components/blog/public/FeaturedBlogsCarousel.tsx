'use client';

import React, { useState } from 'react';
import { Blog } from '@/types/blog';
import { BlogCard } from './BlogCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedBlogsCarouselProps {
  blogs: Blog[];
}

export const FeaturedBlogsCarousel: React.FC<FeaturedBlogsCarouselProps> = ({ blogs }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const blogsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? Math.max(0, blogs.length - blogsPerView.desktop) : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev >= blogs.length - blogsPerView.desktop ? 0 : prev + 1
    );
  };

  if (!blogs || blogs.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Featured Health Articles
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous blogs"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= blogs.length - blogsPerView.desktop}
            className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next blogs"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out gap-6"
          style={{
            transform: `translateX(-${currentIndex * (100 / blogsPerView.desktop)}%)`,
          }}
        >
          {blogs.map((blog, index) => (
            <div
              key={blog.id}
              className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3"
            >
              <BlogCard blog={blog} priority={index < 3} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: Math.ceil(blogs.length / blogsPerView.desktop) }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index * blogsPerView.desktop)}
            className={`w-2 h-2 rounded-full transition-all ${
              Math.floor(currentIndex / blogsPerView.desktop) === index
                ? 'bg-teal-600 w-8'
                : 'bg-gray-300 dark:bg-slate-600'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
