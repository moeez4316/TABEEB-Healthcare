import { Request, Response, NextFunction } from 'express';
import { BlogAuthorType, BlogStatus } from '@prisma/client';

/**
 * Validate blog creation data
 */
export const validateCreateBlog = (req: Request, res: Response, next: NextFunction) => {
  const { 
    title, 
    contentHtml, 
    coverImageUrl, 
    authorType,
    doctorUid,
    externalAuthorName 
  } = req.body;
  
  // Required fields
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }
  
  if (title.length > 500) {
    return res.status(400).json({ error: 'Title must be 500 characters or less' });
  }
  
  if (!contentHtml || typeof contentHtml !== 'string' || contentHtml.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  if (contentHtml.length < 100) {
    return res.status(400).json({ error: 'Content must be at least 100 characters' });
  }
  
  if (!coverImageUrl || typeof coverImageUrl !== 'string') {
    return res.status(400).json({ error: 'Cover image URL is required' });
  }
  
  if (!authorType || !Object.values(BlogAuthorType).includes(authorType)) {
    return res.status(400).json({ 
      error: 'Valid author type is required (DOCTOR, EXTERNAL, or ADMIN)' 
    });
  }
  
  // Author type specific validation
  if (authorType === BlogAuthorType.DOCTOR) {
    if (!doctorUid) {
      return res.status(400).json({ error: 'Doctor UID is required for doctor blogs' });
    }
  } else {
    if (!externalAuthorName || externalAuthorName.trim().length === 0) {
      return res.status(400).json({ error: 'External author name is required for external/admin blogs' });
    }
  }
  
  next();
};

/**
 * Validate blog update data
 */
export const validateUpdateBlog = (req: Request, res: Response, next: NextFunction) => {
  const { title, contentHtml, status } = req.body;
  
  // Optional validation - only validate if fields are provided
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    if (title.length > 500) {
      return res.status(400).json({ error: 'Title must be 500 characters or less' });
    }
  }
  
  if (contentHtml !== undefined) {
    if (typeof contentHtml !== 'string' || contentHtml.trim().length === 0) {
      return res.status(400).json({ error: 'Content must be a non-empty string' });
    }
    if (contentHtml.length < 100) {
      return res.status(400).json({ error: 'Content must be at least 100 characters' });
    }
  }
  
  if (status !== undefined && !Object.values(BlogStatus).includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED' 
    });
  }
  
  next();
};

/**
 * Validate blog query parameters
 */
export const validateBlogQuery = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, status, authorType, sortBy, sortOrder } = req.query;
  
  if (page !== undefined) {
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Page must be a positive number' });
    }
  }
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }
  }
  
  if (status !== undefined && !Object.values(BlogStatus).includes(status as BlogStatus)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED' 
    });
  }
  
  if (authorType !== undefined && !Object.values(BlogAuthorType).includes(authorType as BlogAuthorType)) {
    return res.status(400).json({ 
      error: 'Invalid author type. Must be DOCTOR, EXTERNAL, or ADMIN' 
    });
  }
  
  if (sortBy !== undefined && !['publishedAt', 'viewCount', 'createdAt'].includes(sortBy as string)) {
    return res.status(400).json({ 
      error: 'Invalid sortBy. Must be publishedAt, viewCount, or createdAt' 
    });
  }
  
  if (sortOrder !== undefined && !['asc', 'desc'].includes(sortOrder as string)) {
    return res.status(400).json({ error: 'Invalid sortOrder. Must be asc or desc' });
  }
  
  next();
};

/**
 * Validate CUID format
 */
export const validateCUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    // CUID format validation (basic check)
    if (!id || !/^c[a-z0-9]{24}$/i.test(id)) {
      return res.status(400).json({ error: `Invalid ${paramName} format` });
    }
    
    next();
  };
};

/**
 * Validate slug format
 */
export const validateSlug = (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;
  
  if (!slug || slug.trim().length === 0) {
    return res.status(400).json({ error: 'Slug is required' });
  }
  
  // Slug format validation
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ 
      error: 'Invalid slug format. Must contain only lowercase letters, numbers, and hyphens' 
    });
  }
  
  next();
};

/**
 * Verify user is a doctor
 */
export const isDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = require('../lib/prisma').default;
    const doctor = await prisma.doctor.findUnique({
      where: { uid: req.user!.uid },
      select: { uid: true }
    });
    
    if (!doctor) {
      return res.status(403).json({ error: 'Access denied. Doctor role required.' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verifying doctor role' });
  }
};

/**
 * Verify user is an admin
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = require('../lib/prisma').default;
    const user = await prisma.user.findUnique({
      where: { uid: req.user!.uid },
      select: { role: true }
    });
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verifying admin role' });
  }
};

/**
 * Verify user is either a doctor or admin
 * Works with both Firebase tokens (doctors) and Admin JWT tokens
 */
export const isDoctorOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if admin JWT token was used
    if ((req as any).admin && (req as any).admin.isAdmin) {
      return next();
    }
    
    // Check if Firebase token was used for doctor or admin user
    if (req.user && req.user.uid) {
      const prisma = require('../lib/prisma').default;
      const [user, doctor] = await Promise.all([
        prisma.user.findUnique({
          where: { uid: req.user.uid },
          select: { role: true }
        }),
        prisma.doctor.findUnique({
          where: { uid: req.user.uid },
          select: { uid: true }
        })
      ]);
      
      if (user?.role === 'admin' || doctor) {
        return next();
      }
    }
    
    return res.status(403).json({ error: 'Access denied. Doctor or Admin role required.' });
  } catch (error) {
    res.status(500).json({ error: 'Error verifying role' });
  }
};
