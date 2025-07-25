import { Request, Response, NextFunction } from 'express';

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
  
  // Validate admin token format (simple validation for admin-token-timestamp)
  if (!token.startsWith('admin-token-')) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin token format' });
  }
  
  // Extract timestamp and validate it's not too old (optional: add expiry logic)
  const timestamp = token.substring(12); // Remove 'admin-token-' prefix
  const tokenTime = parseInt(timestamp);
  
  if (isNaN(tokenTime)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin token' });
  }
  
  // Optional: Check if token is not older than 24 hours (86400000 ms)
  const now = Date.now();
  const tokenAge = now - tokenTime;
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  if (tokenAge > maxAge) {
    return res.status(401).json({ error: 'Unauthorized: Admin token expired' });
  }
  
  // Token is valid, add admin info to request
  (req as any).admin = { 
    username: 'admin', // Generic admin user
    token: token,
    loginTime: new Date(tokenTime)
  };
  
  next();
};
