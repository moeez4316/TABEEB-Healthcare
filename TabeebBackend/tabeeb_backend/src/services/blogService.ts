import prisma from '../lib/prisma';
import { CreateBlogDTO, UpdateBlogDTO, BlogAuthorType } from '../types/blog';
import { BlogStatus } from '@prisma/client';

/**
 * Generate a URL-friendly slug from title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .substring(0, 200);        // Limit length
};

/**
 * Ensure slug is unique by appending number if necessary
 */
export const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.blog.findUnique({
      where: { slug },
      select: { id: true }
    });
    
    if (!existing || existing.id === excludeId) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * Calculate reading time based on content length
 * Average reading speed: 200 words per minute
 */
export const calculateReadTime = (contentHtml: string): number => {
  const textContent = contentHtml.replace(/<[^>]*>/g, ''); // Strip HTML tags
  const wordCount = textContent.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 200);
  return Math.max(1, minutes); // Minimum 1 minute
};

/**
 * Generate excerpt from content if not provided
 */
export const generateExcerpt = (contentHtml: string, maxLength: number = 200): string => {
  const textContent = contentHtml.replace(/<[^>]*>/g, ''); // Strip HTML tags
  if (textContent.length <= maxLength) {
    return textContent;
  }
  return textContent.substring(0, maxLength).trim() + '...';
};

/**
 * Validate author data consistency
 */
export const validateAuthorData = (data: CreateBlogDTO | UpdateBlogDTO): void => {
  const authorType = (data as CreateBlogDTO).authorType;
  
  // Only validate on creation (when authorType exists)
  if (!authorType) return;
  
  const createData = data as CreateBlogDTO;
  
  if (authorType === BlogAuthorType.DOCTOR) {
    if (!createData.doctorUid) {
      throw new Error('Doctor blogs require doctorUid');
    }
    if (data.externalAuthorName) {
      throw new Error('Doctor blogs cannot have external author name');
    }
  }
  
  if (authorType === BlogAuthorType.EXTERNAL || authorType === BlogAuthorType.ADMIN) {
    if (createData.doctorUid) {
      throw new Error('External/Admin blogs cannot have doctorUid');
    }
    if (!data.externalAuthorName) {
      throw new Error('External/Admin blogs require external author name');
    }
    if (!data.canonicalUrl && authorType === BlogAuthorType.EXTERNAL) {
      throw new Error('External blogs should have a canonical URL');
    }
  }
};

/**
 * Get or create blog tags
 */
export const getOrCreateTags = async (tagNames: string[]) => {
  const tags = await Promise.all(
    tagNames.map(async (name) => {
      const slug = generateSlug(name);
      
      // Try to find existing tag
      let tag = await prisma.blogTag.findUnique({
        where: { slug }
      });
      
      // Create if doesn't exist
      if (!tag) {
        tag = await prisma.blogTag.create({
          data: {
            name: name.trim(),
            slug
          }
        });
      }
      
      return { id: tag.id };
    })
  );
  
  return tags;
};

/**
 * Find similar blogs based on tags and author
 */
export const findSimilarBlogs = async (
  blogId: string,
  limit: number = 5
): Promise<any[]> => {
  // Get the current blog with its tags
  const currentBlog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: { tags: true }
  });
  
  if (!currentBlog) return [];
  
  const tagIds = currentBlog.tags.map(tag => tag.id);
  
  // Build where clause for similar blogs
  const whereConditions: any[] = [];
  
  // Add tag matching condition if blog has tags
  if (tagIds.length > 0) {
    whereConditions.push({
      tags: {
        some: {
          id: { in: tagIds }
        }
      }
    });
  }
  
  // Add same author condition if doctor blog
  if (currentBlog.doctorUid) {
    whereConditions.push({
      doctorUid: currentBlog.doctorUid
    });
  }
  
  // Find blogs with similar tags or same author
  let similarBlogs = await prisma.blog.findMany({
    where: {
      id: { not: blogId },
      status: BlogStatus.PUBLISHED,
      ...(whereConditions.length > 0 && { OR: whereConditions })
    },
    include: {
      tags: true,
      doctor: {
        select: {
          name: true,
          profileImageUrl: true,
          specialization: true
        }
      }
    },
    take: limit * 2 // Get more to allow for scoring
  });
  
  // If no similar blogs found with criteria, just get recent blogs
  if (similarBlogs.length === 0) {
    similarBlogs = await prisma.blog.findMany({
      where: {
        id: { not: blogId },
        status: BlogStatus.PUBLISHED
      },
      include: {
        tags: true,
        doctor: {
          select: {
            name: true,
            profileImageUrl: true,
            specialization: true
          }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: limit
    });
    
    return similarBlogs;
  }
  
  // Score and sort by relevance
  const scored = similarBlogs.map(blog => {
    let score = 0;
    
    // Count matching tags (weight: 3)
    const matchingTags = blog.tags.filter(tag => tagIds.includes(tag.id)).length;
    score += matchingTags * 3;
    
    // Same author (weight: 2)
    if (currentBlog.doctorUid && blog.doctorUid === currentBlog.doctorUid) {
      score += 2;
    }
    
    // Recent (weight: 1 for blogs published in last 30 days)
    if (blog.publishedAt) {
      const daysSincePublished = Math.floor(
        (Date.now() - blog.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSincePublished <= 30) {
        score += 1;
      }
    }
    
    // View count (weight: 0.5)
    score += (blog.viewCount / 100) * 0.5;
    
    return { ...blog, relevanceScore: score };
  });
  
  // Sort by score and return top N
  return scored
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
};

/**
 * Sanitize HTML content (basic security)
 * Note: In production, use a library like DOMPurify
 */
export const sanitizeHtml = (html: string): string => {
  // Basic sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
};

/**
 * Format blog response for API
 */
export const formatBlogResponse = (blog: any) => {
  const authorName = blog.authorType === 'DOCTOR' 
    ? blog.doctor?.name 
    : blog.externalAuthorName;
    
  const authorImage = blog.authorType === 'DOCTOR'
    ? blog.doctor?.profileImageUrl
    : blog.authorImageUrl;
  
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    coverImageUrl: blog.coverImageUrl,
    contentHtml: blog.contentHtml,
    readTime: blog.readTime,
    viewCount: blog.viewCount,
    authorType: blog.authorType,
    authorName,
    authorImage,
    externalSourceName: blog.externalSourceName,
    isFeatured: blog.isFeatured,
    status: blog.status,
    publishedAt: blog.publishedAt,
    createdAt: blog.createdAt,
    tags: blog.tags || []
  };
};
