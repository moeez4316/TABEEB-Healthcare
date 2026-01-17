'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  ArrowLeft, Save, Eye, Upload, X, Tag, AlertCircle, 
  Loader2, CheckCircle, Image as ImageIcon 
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/config/appConfig';
import { RichTextEditor } from '@/components/blog/doctor/RichTextEditor';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

export default function WriteBlogPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    contentHtml: '',
    coverImageUrl: '',
    tags: [] as string[],
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });
  
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setErrorMessage('');

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    formDataUpload.append('folder', 'blog_covers');

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload image' }));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, coverImageUrl: data.url }));
    } catch (error: any) {
      console.error('Image upload error:', error);
      setErrorMessage(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setErrorMessage('Title is required');
      return false;
    }
    if (!formData.contentHtml.trim()) {
      setErrorMessage('Content is required');
      return false;
    }
    if (!formData.coverImageUrl) {
      setErrorMessage('Cover image is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Truncate excerpt to 500 characters max (database limit)
    const truncatedExcerpt = formData.excerpt.substring(0, 500);

    const blogData = {
      ...formData,
      excerpt: truncatedExcerpt,
      status,
      authorType: 'DOCTOR' as const,
      doctorUid: user?.uid, // Add doctor UID from authenticated user
    };

    console.log('Submitting blog data:', { ...blogData, contentHtml: blogData.contentHtml.substring(0, 100) + '...' });
    console.log('API URL:', `${API_URL}/api/blogs/create`);
    console.log('Auth token present:', !!token);

    try {
      const response = await fetch(`${API_URL}/api/blogs/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(blogData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const responseText = await response.text();
        console.error('Server error response text:', responseText);
        
        let error: any = {};
        try {
          error = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse error response as JSON');
          throw new Error(`Server error (${response.status}): ${responseText || 'Unknown error'}`);
        }
        
        throw new Error(error.error || error.message || `Failed to create blog (${response.status})`);
      }

      const result = await response.json();
      console.log('Success response:', result);
      const isDraft = status === 'DRAFT';
      setSuccessMessage(`Blog ${isDraft ? 'saved as draft' : 'published'} successfully!`);
      
      setTimeout(() => {
        router.push('/Doctor/blogs/my-blogs');
      }, 2000);
    } catch (error: any) {
      console.error('Blog creation error:', error);
      setErrorMessage(error.message || 'Failed to create blog. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/Doctor/blogs" className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="flex items-center space-x-2">
                <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={40} height={40} className="object-contain" />
                <div>
                  <h1 className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                    TABEEB
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                    Write Blog
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">{showPreview ? 'Edit' : 'Preview'}</span>
              </button>
              <button
                onClick={() => handleSubmit('DRAFT')}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Draft</span>
              </button>
              <button
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Publish</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 mx-4 mt-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-700 dark:text-green-400">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mx-4 mt-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showPreview ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blog Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter an engaging title for your blog..."
                  className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>

              {/* Excerpt */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Excerpt / Summary
                  </label>
                  <span className={`text-xs ${formData.excerpt.length > 500 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formData.excerpt.length}/500
                  </span>
                </div>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Brief summary of your blog (optional, will be auto-generated if left empty)..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none custom-scrollbar"
                />
                <style jsx>{`
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                  }
                  
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                  }
                  
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                  
                  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #475569;
                  }
                  
                  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #64748b;
                  }
                `}</style>
              </div>

              {/* Content Editor */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Blog Content *
                </label>
                <RichTextEditor
                  value={formData.contentHtml}
                  onChange={(html) => setFormData(prev => ({ ...prev, contentHtml: html }))}
                  placeholder="Start writing your blog content here..."
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Cover Image */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Cover Image *
                </label>
                {formData.coverImageUrl ? (
                  <div className="relative">
                    <img
                      src={formData.coverImageUrl}
                      alt="Cover"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, coverImageUrl: '' }))}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full flex flex-col items-center justify-center gap-3 px-4 py-8 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-teal-500 dark:hover:border-teal-500 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400" />
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Click to upload cover image
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-teal-900 dark:hover:text-teal-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Preview */
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-slate-700">
            {formData.coverImageUrl && (
              <img
                src={formData.coverImageUrl}
                alt="Cover"
                className="w-full h-96 object-cover rounded-xl mb-8"
              />
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {formData.title || 'Your Blog Title'}
            </h1>
            {formData.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 italic">
                {formData.excerpt}
              </p>
            )}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: formData.contentHtml || '<p>Your content will appear here...</p>' }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
