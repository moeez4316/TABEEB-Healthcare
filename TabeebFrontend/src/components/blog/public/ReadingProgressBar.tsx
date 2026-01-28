'use client';

import React, { useEffect, useState } from 'react';

export const ReadingProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercentage = (scrollTop / scrollHeight) * 100;
      setProgress(scrollPercentage);
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-slate-700 z-50">
      <div
        className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
