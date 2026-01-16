// Blog Types
export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImageUrl: string;
  readTime: number;
  viewCount: number;
  authorType: 'DOCTOR' | 'EXTERNAL' | 'ADMIN';
  authorName: string;
  authorImage: string | null;
  externalSourceName: string | null;
  isFeatured: boolean;
  publishedAt: string;
  tags: BlogTag[];
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  _count?: {
    blogs: number;
  };
}

export interface BlogDetail extends Blog {
  seoTitle: string;
  seoDescription: string;
  externalAuthorBio: string | null;
  externalSourceUrl: string | null;
  canonicalUrl: string | null;
  createdAt: string;
  updatedAt: string;
  doctor?: {
    uid: string;
    name: string;
    profileImageUrl: string | null;
    specialization: string;
    qualification: string;
  } | null;
  similarBlogs?: Blog[];
}

export interface BlogListResponse {
  blogs: Blog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BlogFilters {
  page?: number;
  limit?: number;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  authorType?: 'DOCTOR' | 'EXTERNAL' | 'ADMIN';
  isFeatured?: boolean;
  search?: string;
  tag?: string;
  doctorUid?: string;
  sortBy?: 'publishedAt' | 'viewCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface BlogSearchParams {
  query: string;
  limit?: number;
}
