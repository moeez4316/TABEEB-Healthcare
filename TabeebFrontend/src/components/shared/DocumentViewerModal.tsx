'use client';

import React, { useEffect } from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { detectFileType } from '@/lib/document-utils';

export interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  fileType?: string;
  fileName?: string;
  showDownload?: boolean;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
  fileType,
  fileName,
  showDownload = true,
}) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';
      document.body.style.overscrollBehavior = 'none';

      return () => {
        document.documentElement.style.overflow = 'unset';
        document.body.style.overflow = 'unset';
        document.documentElement.style.overscrollBehavior = 'unset';
        document.body.style.overscrollBehavior = 'unset';
        window.scrollTo(scrollX, scrollY);
      };
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !url) return null;

  const type = detectFileType(fileType, url);
  const displayTitle = title || fileName || 'Document Preview';
  const downloadName = fileName || displayTitle;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={displayTitle}
    >
      {/*
        Mobile:  slides up from bottom, full-width, rounded top corners only.
        Desktop: centered with padding, full rounded corners, max-w-7xl.
        h-[95dvh] uses dvh (dynamic viewport height) to account for browser chrome on mobile.
      */}
      <div
        className="relative w-full max-w-7xl h-[95dvh] sm:h-[95vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle pill — mobile only */}
        <div className="flex justify-center pt-2 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-3 py-2.5 sm:p-4 border-b border-slate-200 dark:border-slate-600 shrink-0">
          <h3 className="text-sm sm:text-lg font-semibold text-slate-800 dark:text-white truncate pr-2">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {showDownload && (
              <a
                href={url}
                download={downloadName}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 sm:p-2 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors touch-manipulation"
                title="Download file"
              >
                <Download className="w-5 h-5" />
              </a>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 sm:p-2 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors touch-manipulation"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2.5 sm:p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors touch-manipulation"
              aria-label="Close preview"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
          {type === 'pdf' ? (
            <>
              {/*
                iOS Safari cannot scroll inside iframes natively.
                Wrapping with overflow-auto + WebkitOverflowScrolling fixes this.
              */}
              <div
                className="flex-1 overflow-auto"
                style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
              >
                <iframe
                  src={url}
                  title={displayTitle}
                  className="w-full h-full min-h-[80vh] border-0 bg-white"
                />
              </div>
              {/* Mobile-only fallback hint for PDF */}
              <p className="sm:hidden text-center text-[11px] text-slate-400 dark:text-slate-500 px-4 py-2 shrink-0">
                PDF not displaying?{' '}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-500 underline"
                >
                  Open in browser tab
                </a>
              </p>
            </>
          ) : type === 'image' ? (
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={displayTitle}
                className="max-h-full max-w-full object-contain rounded-xl shadow-md"
              />
            </div>
          ) : (
            // Fallback for unsupported types
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-sm text-center">
                <FileText className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-4" />
                <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Preview Not Available
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  This file type cannot be previewed in the browser. You can download it to view it locally.
                </p>
                <a
                  href={url}
                  download={downloadName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
