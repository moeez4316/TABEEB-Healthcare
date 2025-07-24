import { Request, Response, NextFunction } from 'express';

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized: Invalid admin credentials' });
};

// Alternative: Check admin credentials from headers (for protected routes)
export const authenticateAdminFromHeaders = (req: Request, res: Response, next: NextFunction) => {
  const username = req.headers['admin-username'] as string;
  const password = req.headers['admin-password'] as string;
  
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized: Invalid admin credentials' });
};
