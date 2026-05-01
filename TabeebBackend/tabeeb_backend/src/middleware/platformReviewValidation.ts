import { Request, Response, NextFunction } from 'express';
import { PlatformReviewStatus } from '@prisma/client';

export const validateCreatePlatformReview = (req: Request, res: Response, next: NextFunction) => {
  const { rating, comment } = req.body;

  if (rating === undefined || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
  }

  if (!comment || typeof comment !== 'string') {
    return res.status(400).json({ error: 'Comment is required and must be a string' });
  }

  if (comment.length < 20) {
    return res.status(400).json({ error: 'Comment must be at least 20 characters long' });
  }

  if (comment.length > 1000) {
    return res.status(400).json({ error: 'Comment must not exceed 1000 characters' });
  }

  // Basic sanitization
  req.body.comment = comment.replace(/<[^>]*>?/gm, '').trim();

  next();
};

export const validateUpdatePlatformReviewStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;

  if (!status || !Object.values(PlatformReviewStatus).includes(status)) {
    return res.status(400).json({ error: 'Valid status is required (PENDING, APPROVED, REJECTED)' });
  }

  next();
};
