import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Article Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The blog article you're looking for doesn't exist or has been removed.
        </p>
        <a
          href="/blogs"
          className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
        >
          Browse All Articles
        </a>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Article Not Found | TABEEB Health Blog',
  description: 'The requested blog article could not be found.',
};
