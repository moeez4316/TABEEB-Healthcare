'use client';

import React from 'react';

interface BlogContentProps {
  contentHtml: string;
}

export const BlogContent: React.FC<BlogContentProps> = ({ contentHtml }) => {
  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
        prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
        prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
        prose-a:text-teal-600 dark:prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
        prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
        prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:mb-2
        prose-blockquote:border-l-4 prose-blockquote:border-teal-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400
        prose-code:bg-gray-100 dark:prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-teal-600 dark:prose-code:text-teal-400
        prose-pre:bg-gray-900 dark:prose-pre:bg-slate-950 prose-pre:p-6 prose-pre:rounded-xl prose-pre:overflow-x-auto
        prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
        prose-hr:border-gray-200 dark:prose-hr:border-slate-700 prose-hr:my-12
        prose-table:w-full prose-table:border-collapse
        prose-th:bg-gray-100 dark:prose-th:bg-slate-800 prose-th:p-3 prose-th:text-left prose-th:font-semibold
        prose-td:border prose-td:border-gray-200 dark:prose-td:border-slate-700 prose-td:p-3"
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
};
