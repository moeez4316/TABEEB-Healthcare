import admin from '../config/firebase';
import { Request, Response, NextFunction} from 'express';
import prisma from '../lib/prisma';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    // Log the Firebase token
    console.log('🔑 Firebase Token:', token);
    
    const decoded = await admin.auth().verifyIdToken(token);
    
    // Log decoded user info
    console.log('✅ Token verified for user:', decoded.uid);
    
    // Check if the user account is active (check both doctor and patient tables)
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
    
    // If user exists in database but is deactivated, reject the request
    if (user && !user.isActive) {
      return res.status(403).json({ 
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = { uid: decoded.uid };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};