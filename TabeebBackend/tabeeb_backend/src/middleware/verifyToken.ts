import admin from '../config/firebase';
import { Request, Response, NextFunction} from 'express';
import prisma from '../lib/prisma';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    
    // Simple token log for Firebase testing
    console.log('🔥 Firebase Token:', token);
    
    req.user = { uid: decoded.uid };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};