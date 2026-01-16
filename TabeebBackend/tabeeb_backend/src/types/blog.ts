import { BlogAuthorType, BlogStatus } from '@prisma/client';

// Re-export Prisma types for convenience
export { BlogAuthorType, BlogStatus };

export interface CreateBlogDTO {
  title: string;
  contentHtml: string;
  excerpt?: string;
  coverImageUrl: string;
  coverImagePublicId?: string;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  
  // Author Info
  authorType: BlogAuthorType;
  doctorUid?: string;
  externalAuthorName?: string;
  externalAuthorBio?: string;
  authorImageUrl?: string;
  authorImagePublicId?: string;
  
  // External Source
  externalSourceName?: string;
  externalSourceUrl?: string;
  canonicalUrl?: string;
  
  // Tags
  tags?: string[]; // Array of tag names
  
  // Status
  status?: BlogStatus;
  isFeatured?: boolean;
  featuredOrder?: number;
}

export interface UpdateBlogDTO {
  title?: string;
  contentHtml?: string;
  excerpt?: string;
  coverImageUrl?: string;
  coverImagePublicId?: string;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  
  // Author Info (only for external/admin blogs)
  externalAuthorName?: string;
  externalAuthorBio?: string;
  authorImageUrl?: string;
  authorImagePublicId?: string;
  
  // External Source
  externalSourceName?: string;
  externalSourceUrl?: string;
  canonicalUrl?: string;
  
  // Tags
  tags?: string[];
  
  // Status
  status?: BlogStatus;
  isFeatured?: boolean;
  featuredOrder?: number;
}

export interface BlogQueryParams {
  page?: number;
  limit?: number;
  status?: BlogStatus;
  authorType?: BlogAuthorType;
  isFeatured?: boolean;
  search?: string;
  tag?: string;
  doctorUid?: string;
  sortBy?: 'publishedAt' | 'viewCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface BlogResponse {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string;
  readTime: number;
  viewCount: number;
  authorType: BlogAuthorType;
  authorName: string;
  authorImage: string | null;
  externalSourceName: string | null;
  isFeatured: boolean;
  publishedAt: Date | null;
  tags: { id: string; name: string; slug: string }[];
}

export interface BlogDetailResponse extends BlogResponse {
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  externalAuthorBio: string | null;
  externalSourceUrl: string | null;
  canonicalUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
