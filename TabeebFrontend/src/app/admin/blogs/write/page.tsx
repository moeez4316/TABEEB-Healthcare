'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Eye, Upload, X, Tag, AlertCircle, 
  Loader2, CheckCircle, User
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/config/appConfig';
import { RichTextEditor } from '@/components/blog/doctor/RichTextEditor';
import { adminCreateBlog } from '@/lib/api/blog-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

type AuthorType = 'ADMIN' | 'EXTERNAL' | 'DOCTOR';

interface UploadSignatureResponse {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
}

interface BlogData {
  title: string;
  contentHtml: string;
  excerpt?: string;
  coverImageUrl: string;
  coverImagePublicId?: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED';
  authorType: AuthorType;
  isFeatured: boolean;
  featuredOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  externalAuthorName?: string;
  externalAuthorBio?: string;
  authorImageUrl?: string;
  authorImagePublicId?: string;
  externalSourceName?: string;
  externalSourceUrl?: string;
  doctorUid?: string;
}

export default function AdminWriteBlogPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAuthorImage, setUploadingAuthorImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    contentHtml: '',
    coverImageUrl: '',
    coverImagePublicId: '',
    tags: [] as string[],
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    authorType: 'ADMIN' as AuthorType,
    
    // For EXTERNAL author
    externalAuthorName: '',
    externalAuthorBio: '',
    authorImageUrl: '',
    authorImagePublicId: '',
    externalSourceName: '',
    externalSourceUrl: '',
    
    // For DOCTOR author (admin impersonation)
    doctorUid: '',
    
    // SEO
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    
    // Featured
    isFeatured: false,
    featuredOrder: 0,
  });
  
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authorImageInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isAuthorImage = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size should be less than 5MB');
      return;
    }

    if (isAuthorImage) {
      setUploadingAuthorImage(true);
    } else {
      setUploadingImage(true);
    }
    setErrorMessage('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) throw new Error('Admin authentication required');

      // 1) Obtain signature from backend
      const sigResp = await fetch(`${API_URL}/api/upload/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ type: 'blog-image', mimeType: file.type })
      });

      if (!sigResp.ok) throw new Error('Failed to obtain upload signature');
      const sigData: UploadSignatureResponse = await sigResp.json();
      const { uploadUrl, apiKey, timestamp, signature, publicId } = sigData;

      // 2) Upload to Cloudinary
      const cloudForm = new FormData();
      cloudForm.append('file', file);
      cloudForm.append('api_key', apiKey);
      cloudForm.append('timestamp', String(timestamp));
      cloudForm.append('signature', signature);
      cloudForm.append('public_id', publicId);

      const uploadResp = await fetch(uploadUrl, { method: 'POST', body: cloudForm });
      if (!uploadResp.ok) {
        const txt = await uploadResp.text().catch(() => 'Upload failed');
        throw new Error(txt || 'Cloud upload failed');
      }

      const uploadResult = await uploadResp.json();
      if (isAuthorImage) {
        setFormData(prev => ({ ...prev, authorImageUrl: uploadResult.secure_url, authorImagePublicId: uploadResult.public_id }));
      } else {
        setFormData(prev => ({ ...prev, coverImageUrl: uploadResult.secure_url, coverImagePublicId: uploadResult.public_id }));
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      if (isAuthorImage) {
        setUploadingAuthorImage(false);
      } else {
        setUploadingImage(false);
      }
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
    
    // Validate based on author type
    if (formData.authorType === 'EXTERNAL') {
      if (!formData.externalAuthorName.trim()) {
        setErrorMessage('External author name is required');
        return false;
      }
    } else if (formData.authorType === 'DOCTOR') {
      if (!formData.doctorUid.trim()) {
        setErrorMessage('Doctor UID is required for doctor impersonation');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    const truncatedExcerpt = formData.excerpt.substring(0, 500);

    // Build blog data based on author type
    const blogData: BlogData = {
      title: formData.title,
      contentHtml: formData.contentHtml,
      excerpt: truncatedExcerpt || undefined,
      coverImageUrl: formData.coverImageUrl,
      coverImagePublicId: formData.coverImagePublicId || undefined,
      tags: formData.tags,
      status,
      authorType: formData.authorType,
      isFeatured: formData.isFeatured,
      featuredOrder: formData.isFeatured ? formData.featuredOrder : undefined,
      seoTitle: formData.seoTitle || undefined,
      seoDescription: formData.seoDescription || undefined,
      canonicalUrl: formData.canonicalUrl || undefined,
    };

    // Add author-specific fields
    if (formData.authorType === 'EXTERNAL') {
      blogData.externalAuthorName = formData.externalAuthorName;
      blogData.externalAuthorBio = formData.externalAuthorBio || undefined;
      blogData.authorImageUrl = formData.authorImageUrl || undefined;
      blogData.authorImagePublicId = formData.authorImagePublicId || undefined;
      blogData.externalSourceName = formData.externalSourceName || undefined;
      blogData.externalSourceUrl = formData.externalSourceUrl || undefined;
    } else if (formData.authorType === 'DOCTOR') {
      blogData.doctorUid = formData.doctorUid;
    }
    // ADMIN type doesn't need additional fields

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }

      await adminCreateBlog(blogData, adminToken);
      
      const isDraft = status === 'DRAFT';
      setSuccessMessage(`Blog ${isDraft ? 'saved as draft' : 'published'} successfully!`);
      
      setTimeout(() => {
        router.push('/admin/blogs');
      }, 2000);
    } catch (error) {
      console.error('Blog creation error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create blog. Please try again.');
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
              <Link href="/admin/blogs" className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="flex items-center space-x-2">
                <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={40} height={40} className="object-contain" />
                <div>
                  <h1 className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                    TABEEB ADMIN
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                    Create Blog
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
                  placeholder="Brief summary of your blog..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
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

              {/* SEO Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      name="seoTitle"
                      value={formData.seoTitle}
                      onChange={handleInputChange}
                      placeholder="Custom SEO title (optional)"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Description
                    </label>
                    <textarea
                      name="seoDescription"
                      value={formData.seoDescription}
                      onChange={handleInputChange}
                      placeholder="Meta description for search engines..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      name="canonicalUrl"
                      value={formData.canonicalUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/original-article"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Author Type */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Author Type *
                </label>
                <select
                  name="authorType"
                  value={formData.authorType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="ADMIN">Admin (System)</option>
                  <option value="EXTERNAL">External Author</option>
                  <option value="DOCTOR">Doctor (Impersonate)</option>
                </select>

                {/* Conditional Author Fields */}
                {formData.authorType === 'EXTERNAL' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Author Name *
                      </label>
                      <input
                        type="text"
                        name="externalAuthorName"
                        value={formData.externalAuthorName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Author Bio
                      </label>
                      <textarea
                        name="externalAuthorBio"
                        value={formData.externalAuthorBio}
                        onChange={handleInputChange}
                        placeholder="Brief bio..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Author Image
                      </label>
                      {formData.authorImageUrl ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.authorImageUrl}
                            alt="Author"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, authorImageUrl: '' }))}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            ref={authorImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, true)}
                            className="hidden"
                          />
                          <button
                            onClick={() => authorImageInputRef.current?.click()}
                            disabled={uploadingAuthorImage}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-teal-500 transition-colors disabled:opacity-50"
                          >
                            {uploadingAuthorImage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                            Upload Image
                          </button>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Source Name
                      </label>
                      <input
                        type="text"
                        name="externalSourceName"
                        value={formData.externalSourceName}
                        onChange={handleInputChange}
                        placeholder="Medium, Dev.to, etc."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Source URL
                      </label>
                      <input
                        type="url"
                        name="externalSourceUrl"
                        value={formData.externalSourceUrl}
                        onChange={handleInputChange}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {formData.authorType === 'DOCTOR' && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Doctor Firebase UID *
                    </label>
                    <input
                      type="text"
                      name="doctorUid"
                      value={formData.doctorUid}
                      onChange={handleInputChange}
                      placeholder="Firebase UID"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Blog will be attributed to this doctor
                    </p>
                  </div>
                )}
              </div>

              {/* Cover Image */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Cover Image *
                </label>
                {formData.coverImageUrl ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                      onChange={(e) => handleImageUpload(e, false)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full flex flex-col items-center justify-center gap-3 px-4 py-8 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-teal-500 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400" />
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Click to upload
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
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
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
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

              {/* Featured Settings */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Featured Settings
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Feature this blog
                    </span>
                  </label>
                  {formData.isFeatured && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Featured Order
                      </label>
                      <input
                        type="number"
                        name="featuredOrder"
                        value={formData.featuredOrder}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Lower numbers appear first
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Preview */
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-slate-700">
            {formData.coverImageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
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
