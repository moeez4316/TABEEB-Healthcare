import rateLimit from 'express-rate-limit';

/**
 * Rate limiters for TABEEB Healthcare App
 * Generous limits that won't affect normal usage, but prevent abuse
 */

// General API rate limiter - 200 requests per 15 minutes per IP (balanced)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    error: 'Too many requests. Please wait a moment and try again.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter - stricter for login/register to prevent brute force
// 10 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload signature rate limiter - prevent abuse of upload system
// 20 signature requests per hour per user (balanced)
export const uploadSignatureLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: 'Upload limit reached. You can upload up to 50 files per hour.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.uid || 'anonymous';
  },
  skip: (req) => !(req as any).user?.uid,
});

// Verification submission rate limiter - prevent spam submissions
// 3 per day (reasonable for resubmissions)
export const verificationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  message: {
    error: 'Verification submission limit reached. Please try again tomorrow.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '24 hours'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.uid || 'anonymous';
  },
  skip: (req) => !(req as any).user?.uid,
});

// Appointment booking rate limiter - prevent booking spam
// 10 bookings per hour
export const appointmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Booking limit reached. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.uid || 'anonymous';
  },
  skip: (req) => !(req as any).user?.uid,
});
