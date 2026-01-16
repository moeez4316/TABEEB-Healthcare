'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export const BlogSearchBar: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/blogs?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    router.push('/blogs');
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search health articles, topics, or doctors..."
          className="w-full px-5 py-3 pl-12 pr-12 rounded-full border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
      >
        Search
      </button>
    </form>
  );
};
