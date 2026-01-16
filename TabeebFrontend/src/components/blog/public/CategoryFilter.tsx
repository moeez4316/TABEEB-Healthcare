'use client';

import React from 'react';
import { BlogTag } from '@/types/blog';
import { X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface CategoryFilterProps {
  tags: BlogTag[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ tags }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams?.get('tag');

  const handleTagClick = (tagSlug: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    
    if (selectedTag === tagSlug) {
      params.delete('tag');
    } else {
      params.set('tag', tagSlug);
      params.delete('page'); // Reset to first page
    }

    router.push(`/blogs${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleClearFilter = () => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('tag');
    router.push(`/blogs${params.toString() ? `?${params.toString()}` : ''}`);
  };

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Filter by Category
        </h3>
        {selectedTag && (
          <button
            onClick={handleClearFilter}
            className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTag === tag.slug;
          return (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {tag.name}
              {tag._count?.blogs && (
                <span className="ml-1 opacity-75">({tag._count.blogs})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
