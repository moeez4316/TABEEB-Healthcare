import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  
  // Support multiple admins
  const ADMIN_CREDENTIALS = process.env.ADMIN_CREDENTIALS;
  
  if (ADMIN_CREDENTIALS) {
    try {
      const admins = JSON.parse(ADMIN_CREDENTIALS);
      const validAdmin = admins.find((admin: any) => 
        admin.username === username && admin.password === password
      );
      
      if (validAdmin) {
        (req as any).admin = { username: validAdmin.username };
        return next();
      }
    } catch (error) {
      console.error('Error parsing admin credentials:', error);
    }
  }
  
  // Fallback to single admin check
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    (req as any).admin = { username: ADMIN_USERNAME };
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized: Invalid admin credentials' });
};

// Alternative: Check admin credentials from Bearer token (for protected routes)
export const authenticateAdminFromHeaders = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'] as string;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No valid admin token provided' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Verify JWT token
    const secret = process.env.ADMIN_JWT_SECRET || 'tabeeb-admin-secret-key-2026';
    const decoded = jwt.verify(token, secret) as any;
    
    // Check if token has admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Invalid admin role' });
    }
    
    // Token is valid, add admin info to request
    (req as any).admin = { 
      username: decoded.username,
      role: decoded.role,
      token: token,
      loginTime: decoded.loginTime ? new Date(decoded.loginTime) : null
    };
    
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Admin token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid admin token' });
    } else {
      return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }
  }
};
