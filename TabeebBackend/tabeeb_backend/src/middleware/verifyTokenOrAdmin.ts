import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';
import prisma from '../lib/prisma';
import { validateAdminAccessToken } from '../services/adminAccessService';

/**
 * Middleware that accepts either Firebase token (doctor/patient) or admin JWT token.
 * Sets req.user for Firebase-authenticated users and req.admin for admin sessions.
 */
export const verifyTokenOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    // Try Firebase token first.
    try {
      const decoded = await admin.auth().verifyIdToken(token);

      const [doctor, patient] = await Promise.all([
        prisma.doctor.findUnique({
          where: { uid: decoded.uid },
          select: { isActive: true },
        }),
        prisma.patient.findUnique({
          where: { uid: decoded.uid },
          select: { isActive: true },
        }),
      ]);

      const user = doctor || patient;
      if (user && !user.isActive) {
        return res.status(403).json({
          error: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED',
        });
      }

      req.user = { uid: decoded.uid };
      return next();
    } catch {
      // Fall back to admin token validation.
      const validation = await validateAdminAccessToken(token);
      if (!validation.ok) {
        return res.status(validation.statusCode).json({ error: validation.message });
      }

      (req as any).admin = {
        id: validation.admin.id,
        username: validation.admin.username,
        name: validation.admin.displayName,
        email: validation.admin.email,
        role: validation.admin.role,
        adminRole: validation.admin.role,
        permissions: validation.admin.permissions,
        sessionId: validation.admin.sessionId,
        jwtId: validation.admin.jwtId,
        isSuperAdmin: validation.admin.isSuperAdmin,
        isAdmin: true,
      };

      return next();
    }
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
