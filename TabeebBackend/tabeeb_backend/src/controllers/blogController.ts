import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { CreateBlogDTO, UpdateBlogDTO, BlogQueryParams } from '../types/blog';
import { BlogStatus } from '@prisma/client';
import {
  generateSlug,
  ensureUniqueSlug,
  calculateReadTime,
  generateExcerpt,
  validateAuthorData,
  getOrCreateTags,
  findSimilarBlogs,
  sanitizeHtml,
  formatBlogResponse
} from '../services/blogService';

/**
 * Create a new blog (Doctor or Admin)
 */
export const createBlog = async (req: Request, res: Response) => {
  try {
    const data: CreateBlogDTO = req.body;
    
    // Check if admin JWT token was used
    const isAdminRequest = (req as any).admin && (req as any).admin.isAdmin;
    const userUid = req.user?.uid;
    
    // Validate author data consistency
    try {
      validateAuthorData(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
    
    // For doctor blogs, ensure doctorUid matches authenticated user (unless admin)
    if (!isAdminRequest && data.authorType === 'DOCTOR' && data.doctorUid !== userUid) {
      return res.status(403).json({ error: 'Cannot create blog for another doctor' });
    }
    
    // Generate slug
    const baseSlug = generateSlug(data.title);
    const slug = await ensureUniqueSlug(baseSlug);
    
    // Calculate read time
    const readTime = calculateReadTime(data.contentHtml);
    
    // Generate excerpt if not provided
    const excerpt = data.excerpt || generateExcerpt(data.contentHtml);
    
    // Sanitize HTML content
    const contentHtml = sanitizeHtml(data.contentHtml);
    
    // Get or create tags
    const tags = data.tags && data.tags.length > 0
      ? await getOrCreateTags(data.tags)
      : [];
    
    // Set published date if status is PUBLISHED
    const publishedAt = data.status === BlogStatus.PUBLISHED ? new Date() : null;
    
    // Create blog
    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        slug,
        contentHtml,
        excerpt,
        coverImageUrl: data.coverImageUrl,
        coverImagePublicId: data.coverImagePublicId,
        seoTitle: data.seoTitle || data.title.substring(0, 70),
        seoDescription: data.seoDescription || excerpt?.substring(0, 160),
        readTime,
        authorType: data.authorType,
        doctorUid: data.doctorUid || null,
        externalAuthorName: data.externalAuthorName || null,
        externalAuthorBio: data.externalAuthorBio || null,
        authorImageUrl: data.authorImageUrl || null,
        authorImagePublicId: data.authorImagePublicId || null,
        externalSourceName: data.externalSourceName || null,
        externalSourceUrl: data.externalSourceUrl || null,
        canonicalUrl: data.canonicalUrl || null,
        status: data.status || BlogStatus.DRAFT,
        isFeatured: data.isFeatured || false,
        featuredOrder: data.featuredOrder || null,
        publishedAt,
        tags: {
          connect: tags
        }
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
      }
    });
    
    res.status(201).json({
      message: 'Blog created successfully',
      blog: formatBlogResponse(blog)
    });
  } catch (error: any) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: 'Failed to create blog', details: error.message });
  }
};

/**
 * Get all blogs with filters and pagination
 */
export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      authorType,
      isFeatured,
      search,
      tag,
      doctorUid,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    }: BlogQueryParams = req.query as any;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where: any = {};
    
    if (status) where.status = status;
    if (authorType) where.authorType = authorType;
    if (isFeatured !== undefined) {
      where.isFeatured = typeof isFeatured === 'string' ? isFeatured === 'true' : isFeatured;
    }
    if (doctorUid) where.doctorUid = doctorUid;
    
    // Search in title and content
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { contentHtml: { contains: search } },
        { externalAuthorName: { contains: search } }
      ];
    }
    
    // Filter by tag
    if (tag) {
      where.tags = {
        some: {
          slug: tag
        }
      };
    }
    
    // Get blogs
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          tags: true,
          doctor: {
            select: {
              name: true,
              profileImageUrl: true,
              specialization: true
            }
          }
        }
      }),
      prisma.blog.count({ where })
    ]);
    
    res.json({
      blogs: blogs.map(formatBlogResponse),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get all blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs', details: error.message });
  }
};

/**
 * Get a single blog by slug
 */
export const getBlogBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        tags: true,
        doctor: {
          select: {
            uid: true,
            name: true,
            profileImageUrl: true,
            specialization: true,
            qualification: true
          }
        }
      }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Increment view count atomically
    await prisma.blog.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } }
    });
    
    // Get similar blogs
    const similarBlogs = await findSimilarBlogs(blog.id, 5);
    
    res.json({
      blog: {
        ...formatBlogResponse(blog),
        contentHtml: blog.contentHtml,
        seoTitle: blog.seoTitle,
        seoDescription: blog.seoDescription,
        externalAuthorBio: blog.externalAuthorBio,
        externalSourceUrl: blog.externalSourceUrl,
        canonicalUrl: blog.canonicalUrl,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        doctor: blog.doctor
      },
      similarBlogs: similarBlogs.map(formatBlogResponse)
    });
  } catch (error: any) {
    console.error('Get blog by slug error:', error);
    res.status(500).json({ error: 'Failed to fetch blog', details: error.message });
  }
};

/**
 * Get featured blogs
 */
export const getFeaturedBlogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    
    const blogs = await prisma.blog.findMany({
      where: {
        status: BlogStatus.PUBLISHED,
        isFeatured: true
      },
      orderBy: [
        { featuredOrder: 'asc' },
        { publishedAt: 'desc' }
      ],
      take: limit,
      include: {
        tags: true,
        doctor: {
          select: {
            name: true,
            profileImageUrl: true
          }
        }
      }
    });
    
    res.json({ blogs: blogs.map(formatBlogResponse) });
  } catch (error: any) {
    console.error('Get featured blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch featured blogs', details: error.message });
  }
};

/**
 * Get recent blogs for carousel
 */
export const getRecentBlogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const blogs = await prisma.blog.findMany({
      where: {
        status: BlogStatus.PUBLISHED
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        tags: true,
        doctor: {
          select: {
            name: true,
            profileImageUrl: true
          }
        }
      }
    });
    
    res.json({ blogs: blogs.map(formatBlogResponse) });
  } catch (error: any) {
    console.error('Get recent blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch recent blogs', details: error.message });
  }
};

/**
 * Get blogs by current doctor
 */
export const getMyBlogs = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user!.uid;
    const { page = 1, limit = 20, status } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { doctorUid };
    
    if (status) where.status = status;
    
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          tags: true,
          doctor: {
            select: {
              name: true,
              profileImageUrl: true
            }
          }
        }
      }),
      prisma.blog.count({ where })
    ]);
    
    res.json({
      blogs: blogs.map(formatBlogResponse),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get my blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch your blogs', details: error.message });
  }
};

/**
 * Update a blog
 */
export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateBlogDTO = req.body;
    
    // Check if admin JWT token was used
    const isAdminRequest = (req as any).admin && (req as any).admin.isAdmin;
    const userUid = req.user?.uid;
    
    // Get existing blog
    const existingBlog = await prisma.blog.findUnique({
      where: { id },
      select: { doctorUid: true, authorType: true }
    });
    
    if (!existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Check permissions (doctor can only update own blogs, admin can update all)
    let isAdmin = isAdminRequest;
    
    if (!isAdminRequest && userUid) {
      const user = await prisma.user.findUnique({
        where: { uid: userUid },
        select: { role: true }
      });
      isAdmin = user?.role === 'admin';
    }
    
    const isOwner = existingBlog.doctorUid === userUid;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to update this blog' });
    }
    
    // Validate author data if provided
    if (data.externalAuthorName || data.canonicalUrl) {
      try {
        validateAuthorData(data);
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (data.title) {
      updateData.title = data.title;
      const baseSlug = generateSlug(data.title);
      updateData.slug = await ensureUniqueSlug(baseSlug, id);
    }
    
    if (data.contentHtml) {
      updateData.contentHtml = sanitizeHtml(data.contentHtml);
      updateData.readTime = calculateReadTime(data.contentHtml);
    }
    
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.coverImageUrl) updateData.coverImageUrl = data.coverImageUrl;
    if (data.coverImagePublicId !== undefined) updateData.coverImagePublicId = data.coverImagePublicId;
    if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
    if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;
    if (data.externalAuthorName !== undefined) updateData.externalAuthorName = data.externalAuthorName;
    if (data.externalAuthorBio !== undefined) updateData.externalAuthorBio = data.externalAuthorBio;
    if (data.authorImageUrl !== undefined) updateData.authorImageUrl = data.authorImageUrl;
    if (data.authorImagePublicId !== undefined) updateData.authorImagePublicId = data.authorImagePublicId;
    if (data.externalSourceName !== undefined) updateData.externalSourceName = data.externalSourceName;
    if (data.externalSourceUrl !== undefined) updateData.externalSourceUrl = data.externalSourceUrl;
    if (data.canonicalUrl !== undefined) updateData.canonicalUrl = data.canonicalUrl;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.featuredOrder !== undefined) updateData.featuredOrder = data.featuredOrder;
    
    // Handle status change to PUBLISHED
    if (data.status === BlogStatus.PUBLISHED && existingBlog) {
      const currentBlog = await prisma.blog.findUnique({
        where: { id },
        select: { status: true, publishedAt: true }
      });
      
      if (currentBlog?.status !== BlogStatus.PUBLISHED && !currentBlog?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    
    if (data.status !== undefined) updateData.status = data.status;
    
    // Handle tags update
    if (data.tags) {
      const tags = await getOrCreateTags(data.tags);
      updateData.tags = {
        set: tags
      };
    }
    
    // Update blog
    const blog = await prisma.blog.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
        doctor: {
          select: {
            name: true,
            profileImageUrl: true
          }
        }
      }
    });
    
    res.json({
      message: 'Blog updated successfully',
      blog: formatBlogResponse(blog)
    });
  } catch (error: any) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Failed to update blog', details: error.message });
  }
};

/**
 * Delete a blog
 */
export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if admin JWT token was used
    const isAdminRequest = (req as any).admin && (req as any).admin.isAdmin;
    const userUid = req.user?.uid;
    
    // Get existing blog
    const existingBlog = await prisma.blog.findUnique({
      where: { id },
      select: { doctorUid: true }
    });
    
    if (!existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Check permissions (doctor can only delete own blogs, admin can delete all)
    let isAdmin = isAdminRequest;
    
    if (!isAdminRequest && userUid) {
      const user = await prisma.user.findUnique({
        where: { uid: userUid },
        select: { role: true }
      });
      isAdmin = user?.role === 'admin';
    }
    
    const isOwner = existingBlog.doctorUid === userUid;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to delete this blog' });
    }
    
    // Delete blog
    await prisma.blog.delete({
      where: { id }
    });
    
    res.json({ message: 'Blog deleted successfully' });
  } catch (error: any) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Failed to delete blog', details: error.message });
  }
};

/**
 * Toggle featured status (Admin only)
 */
export const toggleFeatured = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isFeatured, featuredOrder } = req.body;
    
    const blog = await prisma.blog.update({
      where: { id },
      data: {
        isFeatured: isFeatured !== undefined ? isFeatured : undefined,
        featuredOrder: featuredOrder !== undefined ? featuredOrder : undefined
      },
      include: {
        tags: true,
        doctor: {
          select: {
            name: true,
            profileImageUrl: true
          }
        }
      }
    });
    
    res.json({
      message: 'Featured status updated successfully',
      blog: formatBlogResponse(blog)
    });
  } catch (error: any) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ error: 'Failed to update featured status', details: error.message });
  }
};

/**
 * Search blogs
 */
export const searchBlogs = async (req: Request, res: Response) => {
  try {
    const { query, limit = 20 } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const blogs = await prisma.blog.findMany({
      where: {
        status: BlogStatus.PUBLISHED,
        OR: [
          { title: { contains: query } },
          { contentHtml: { contains: query } },
          { excerpt: { contains: query } },
          { externalAuthorName: { contains: query } },
          { tags: { some: { name: { contains: query } } } }
        ]
      },
      take: Number(limit),
      orderBy: { publishedAt: 'desc' },
      include: {
        tags: true,
        doctor: {
          select: {
            name: true,
            profileImageUrl: true
          }
        }
      }
    });
    
    res.json({ blogs: blogs.map(formatBlogResponse) });
  } catch (error: any) {
    console.error('Search blogs error:', error);
    res.status(500).json({ error: 'Failed to search blogs', details: error.message });
  }
};

/**
 * Get all blog tags
 */
export const getAllTags = async (req: Request, res: Response) => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { blogs: true }
        }
      }
    });
    
    res.json({ tags });
  } catch (error: any) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags', details: error.message });
  }
};
