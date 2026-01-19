import { Blog, BlogDetail, BlogFilters, BlogListResponse, BlogSearchParams, BlogTag } from '@/types/blog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
const BLOG_API_URL = `${API_BASE_URL}/api/blogs`;

// Helper function to build query string
const buildQueryString = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
};

// Get all published blogs with filters
export const getBlogs = async (filters: BlogFilters = {}): Promise<BlogListResponse> => {
  const queryString = buildQueryString(filters);
  const url = `${BLOG_API_URL}/public${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Always fetch fresh data
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch blogs: ${response.statusText}`);
  }

  return response.json();
};

// Get doctor's own blogs (including drafts) - requires authentication
export const getMyBlogs = async (filters: BlogFilters = {}, token: string): Promise<BlogListResponse> => {
  const queryString = buildQueryString(filters);
  const url = `${BLOG_API_URL}/my-blogs${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    cache: 'no-store', // Always fetch fresh data
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch your blogs: ${response.statusText}`);
  }

  return response.json();
};

// Get featured blogs
export const getFeaturedBlogs = async (limit: number = 6): Promise<Blog[]> => {
  const response = await fetch(`${BLOG_API_URL}/public/featured?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 600 }, // Cache for 10 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch featured blogs: ${response.statusText}`);
  }

  const data = await response.json();
  return data.blogs;
};

// Get recent blogs
export const getRecentBlogs = async (limit: number = 10): Promise<Blog[]> => {
  const response = await fetch(`${BLOG_API_URL}/public/recent?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recent blogs: ${response.statusText}`);
  }

  const data = await response.json();
  return data.blogs;
};

// Get blog by slug
export const getBlogBySlug = async (slug: string): Promise<BlogDetail> => {
  const response = await fetch(`${BLOG_API_URL}/public/slug/${slug}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Always fetch fresh to track views
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Blog not found');
    }
    throw new Error(`Failed to fetch blog: ${response.statusText}`);
  }

  const data = await response.json();
  // Merge similarBlogs from response into blog object
  return {
    ...data.blog,
    similarBlogs: data.similarBlogs || []
  };
};

// Search blogs
export const searchBlogs = async (params: BlogSearchParams): Promise<Blog[]> => {
  const response = await fetch(`${BLOG_API_URL}/public/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to search blogs: ${response.statusText}`);
  }

  const data = await response.json();
  return data.blogs;
};

// Get all tags
export const getBlogTags = async (): Promise<BlogTag[]> => {
  const response = await fetch(`${BLOG_API_URL}/public/tags`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 1800 }, // Cache for 30 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`);
  }

  const data = await response.json();
  return data.tags;
};

// ============================================
// ADMIN BLOG API FUNCTIONS
// ============================================

// Get all blogs (including drafts) - Admin only
export const getAdminBlogs = async (filters: BlogFilters = {}, adminToken: string): Promise<BlogListResponse> => {
  const queryString = buildQueryString(filters);
  const url = `${BLOG_API_URL}/admin/all${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch blogs: ${response.statusText}`);
  }

  return response.json();
};

// Toggle featured status - Admin only
export const toggleBlogFeatured = async (blogId: string, currentFeaturedStatus: boolean, adminToken: string): Promise<{ message: string; blog: Blog }> => {
  const response = await fetch(`${BLOG_API_URL}/admin/${blogId}/feature`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      isFeatured: !currentFeaturedStatus,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to toggle featured status: ${response.statusText}`);
  }

  return response.json();
};

// Admin can access any blog for editing (uses existing endpoint with admin token)
export const getAdminBlogById = async (blogId: string, adminToken: string): Promise<BlogDetail> => {
  const response = await fetch(`${BLOG_API_URL}/${blogId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Blog not found');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch blog: ${response.statusText}`);
  }

  const data = await response.json();
  return data.blog;
};

// Admin can delete any blog
export const adminDeleteBlog = async (blogId: string, adminToken: string): Promise<{ message: string }> => {
  const response = await fetch(`${BLOG_API_URL}/${blogId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete blog: ${response.statusText}`);
  }

  return response.json();
};

// Admin create blog (can create as ADMIN, EXTERNAL, or impersonate DOCTOR)
export const adminCreateBlog = async (blogData: any, adminToken: string): Promise<{ message: string; blog: any }> => {
  const response = await fetch(`${BLOG_API_URL}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(blogData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create blog: ${response.statusText}`);
  }

  return response.json();
};

// Admin update blog (can update any blog)
export const adminUpdateBlog = async (blogId: string, blogData: any, adminToken: string): Promise<{ message: string; blog: any }> => {
  const response = await fetch(`${BLOG_API_URL}/${blogId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(blogData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update blog: ${response.statusText}`);
  }

  return response.json();
};
