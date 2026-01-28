import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  getBlogs,
  getMyBlogs,
  getFeaturedBlogs,
  getRecentBlogs,
  getBlogBySlug,
  searchBlogs,
  getBlogTags,
  getAdminBlogs,
} from '@/lib/api/blog-api';
import { Blog, BlogDetail, BlogFilters, BlogListResponse, BlogSearchParams, BlogTag } from '@/types/blog';

// Query keys
export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: BlogFilters) => [...blogKeys.lists(), filters] as const,
  myBlogs: () => [...blogKeys.all, 'myBlogs'] as const,
  myBlogsList: (filters: BlogFilters) => [...blogKeys.myBlogs(), filters] as const,
  adminBlogs: () => [...blogKeys.all, 'adminBlogs'] as const,
  adminBlogsList: (filters: BlogFilters) => [...blogKeys.adminBlogs(), filters] as const,
  featured: () => [...blogKeys.all, 'featured'] as const,
  recent: (limit: number) => [...blogKeys.all, 'recent', limit] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (slug: string) => [...blogKeys.details(), slug] as const,
  search: (params: BlogSearchParams) => [...blogKeys.all, 'search', params] as const,
  tags: () => [...blogKeys.all, 'tags'] as const,
};

// Get paginated blogs with filters (PUBLIC - only published)
export const useBlogs = (
  filters: BlogFilters = {}
): UseQueryResult<BlogListResponse, Error> => {
  return useQuery({
    queryKey: blogKeys.list(filters),
    queryFn: () => getBlogs(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get doctor's own blogs (including drafts) - requires authentication
export const useMyBlogs = (
  filters: BlogFilters = {},
  token: string,
  enabled: boolean = true
): UseQueryResult<BlogListResponse, Error> => {
  return useQuery({
    queryKey: blogKeys.myBlogsList(filters),
    queryFn: () => getMyBlogs(filters, token),
    enabled: enabled && !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get featured blogs
export const useFeaturedBlogs = (
  limit: number = 6
): UseQueryResult<Blog[], Error> => {
  return useQuery({
    queryKey: blogKeys.featured(),
    queryFn: () => getFeaturedBlogs(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Get recent blogs
export const useRecentBlogs = (
  limit: number = 10
): UseQueryResult<Blog[], Error> => {
  return useQuery({
    queryKey: blogKeys.recent(limit),
    queryFn: () => getRecentBlogs(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get blog by slug
export const useBlogBySlug = (
  slug: string
): UseQueryResult<BlogDetail, Error> => {
  return useQuery({
    queryKey: blogKeys.detail(slug),
    queryFn: () => getBlogBySlug(slug),
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
};

// Search blogs
export const useSearchBlogs = (
  params: BlogSearchParams,
  enabled: boolean = true
): UseQueryResult<Blog[], Error> => {
  return useQuery({
    queryKey: blogKeys.search(params),
    queryFn: () => searchBlogs(params),
    enabled: enabled && !!params.query && params.query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get all tags
export const useBlogTags = (): UseQueryResult<BlogTag[], Error> => {
  return useQuery({
    queryKey: blogKeys.tags(),
    queryFn: () => getBlogTags(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

// ============================================
// ADMIN BLOG HOOKS
// ============================================

// Get all blogs including drafts (Admin only)
export const useAdminBlogs = (
  filters: BlogFilters = {},
  adminToken: string,
  enabled: boolean = true
): UseQueryResult<BlogListResponse, Error> => {
  return useQuery({
    queryKey: blogKeys.adminBlogsList(filters),
    queryFn: () => getAdminBlogs(filters, adminToken),
    enabled: enabled && !!adminToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
