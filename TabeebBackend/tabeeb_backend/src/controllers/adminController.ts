import { Request, Response } from 'express';

export const loginAdmin = (req: Request, res: Response) => {
  console.log('loginAdmin called with body:', req.body);
  
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.status(200).json({ 
      message: 'Admin authenticated successfully',
      isAdmin: true 
    });
  }

  return res.status(401).json({ error: 'Invalid admin credentials' });
};

export const verifyAdminCredentials = (req: Request, res: Response) => {
  console.log('verifyAdminCredentials called with body:', req.body);
  
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.status(200).json({ isAdmin: true });
  }
  res.status(401).json({ isAdmin: false });
};
