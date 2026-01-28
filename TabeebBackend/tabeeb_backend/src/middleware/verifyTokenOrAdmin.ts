import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

/**
 * Middleware that accepts either Firebase token (for doctors) or Admin JWT token
 * Sets req.user.uid for doctors and req.admin for admins
 */
export const verifyTokenOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    // First, try to verify as Firebase token
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      console.log('✅ Firebase token verified for user:', decoded.uid);
      
      // Check if the user account is active
      const [doctor, patient] = await Promise.all([
        prisma.doctor.findUnique({
          where: { uid: decoded.uid },
          select: { isActive: true }
        }),
        prisma.patient.findUnique({
          where: { uid: decoded.uid },
          select: { isActive: true }
        })
      ]);

      const user = doctor || patient;
      
      if (user && !user.isActive) {
        return res.status(403).json({ 
          error: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      req.user = { uid: decoded.uid };
      return next();
    } catch (firebaseError) {
      // If Firebase verification fails, try admin JWT
      const secret = process.env.ADMIN_JWT_SECRET || 'tabeeb-admin-secret-key-2026';
      const decoded = jwt.verify(token, secret) as any;
      
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Invalid token role' });
      }
      
      console.log('✅ Admin JWT token verified for:', decoded.username);
      
      // Set admin info on request
      (req as any).admin = { 
        username: decoded.username,
        role: decoded.role,
        isAdmin: true
      };
      
      return next();
    }
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
