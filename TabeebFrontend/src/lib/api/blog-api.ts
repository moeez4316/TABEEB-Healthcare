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
  return data.blog;
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
