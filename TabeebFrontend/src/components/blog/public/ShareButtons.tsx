'use client';

import React, { useState } from 'react';
import { Share2, Link as LinkIcon, Check, Facebook, Twitter } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ title, url }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Share Article
        </h3>
      </div>

      <div className="space-y-2">
        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-gray-300 font-medium"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-green-600" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-5 h-5" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        {/* WhatsApp */}
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white font-medium"
        >
          <FaWhatsapp className="w-5 h-5" />
          <span>WhatsApp</span>
        </a>

        {/* Facebook */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium"
        >
          <Facebook className="w-5 h-5" />
          <span>Facebook</span>
        </a>

        {/* Twitter */}
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-sky-500 hover:bg-sky-600 transition-colors text-white font-medium"
        >
          <Twitter className="w-5 h-5" />
          <span>Twitter</span>
        </a>
      </div>
    </div>
  );
};
