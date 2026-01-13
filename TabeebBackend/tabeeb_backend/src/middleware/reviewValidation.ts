import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

// Validation schema for creating a review
const createReviewSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().optional(),
  isComplaint: z.boolean().optional()
}).refine((data) => {
  // If isComplaint is true, comment is required
  if (data.isComplaint && !data.comment) {
    return false;
  }
  return true;
}, {
  message: 'Comment is required when submitting a complaint',
  path: ['comment']
});

// Validation schema for updating complaint action
const updateComplaintActionSchema = z.object({
  adminNotes: z.string().optional(),
  adminActionTaken: z.string().optional()
}).refine((data) => {
  // At least one field must be provided
  return data.adminNotes || data.adminActionTaken;
}, {
  message: 'At least one field (adminNotes or adminActionTaken) must be provided'
});

/**
 * Validate create review request
 */
export const validateCreateReview = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = createReviewSchema.safeParse(req.body);
    
    if (!result.success) {
      const errors = result.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid request data' });
  }
};

/**
 * Validate update complaint action request
 */
export const validateUpdateComplaintAction = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = updateComplaintActionSchema.safeParse(req.body);
    
    if (!result.success) {
      const errors = result.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid request data' });
  }
};

/**
 * Validate review ID format (CUID)
 */
export const validateReviewId = (paramName: string = 'reviewId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    if (!id || typeof id !== 'string' || id.length < 20) {
      return res.status(400).json({ 
        error: 'Invalid review ID format'
      });
    }
    
    next();
  };
};

/**
 * Check if the authenticated user is a doctor
 */
export const checkDoctorRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userUid = req.user!.uid;
    
    const doctor = await prisma.doctor.findUnique({
      where: { uid: userUid },
      select: { uid: true, isActive: true }
    });
    
    if (!doctor) {
      return res.status(403).json({ 
        error: 'Access denied. Doctor account required.'
      });
    }
    
    if (!doctor.isActive) {
      return res.status(403).json({ 
        error: 'Doctor account is not active'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking doctor role:', error);
    return res.status(500).json({ error: 'Failed to verify doctor role' });
  }
};

/**
 * Check if the authenticated user is a patient
 */
export const checkPatientRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userUid = req.user!.uid;
    
    const patient = await prisma.patient.findUnique({
      where: { uid: userUid },
      select: { uid: true, isActive: true }
    });
    
    if (!patient) {
      return res.status(403).json({ 
        error: 'Access denied. Patient account required.'
      });
    }
    
    if (!patient.isActive) {
      return res.status(403).json({ 
        error: 'Patient account is not active'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking patient role:', error);
    return res.status(500).json({ error: 'Failed to verify patient role' });
  }
};

/**
 * Validate pagination parameters
 */
export const validatePaginationParams = (req: Request, res: Response, next: NextFunction) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  
  if (isNaN(page) || page < 1) {
    return res.status(400).json({ error: 'Invalid page number' });
  }
  
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'Invalid limit. Must be between 1 and 100' });
  }
  
  next();
};
