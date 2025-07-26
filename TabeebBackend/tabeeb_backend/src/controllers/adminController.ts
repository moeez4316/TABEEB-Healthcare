import { Request, Response } from 'express';

export const loginAdmin = (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
    }

    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // TEMPORARY: Hardcoded admin credentials for testing
    const hardcodedAdmins = [
      { username: "superadmin", password: "SuperAdmin123" },
      { username: "medadmin", password: "MedAdmin456" },
      { username: "verifyadmin", password: "VerifyAdmin789" }
    ];

    const hardcodedMatch = hardcodedAdmins.find(admin => 
      admin.username === username && admin.password === password
    );

    if (hardcodedMatch) {
      return res.status(200).json({ 
        message: 'Admin authenticated successfully',
        token: 'admin-token-' + Date.now(),
        admin: {
          username: hardcodedMatch.username,
          name: hardcodedMatch.username
        }
      });
    }

    // Support multiple admins from environment
    const ADMIN_CREDENTIALS = process.env.ADMIN_CREDENTIALS;
    
    if (ADMIN_CREDENTIALS) {
      try {
        const admins = JSON.parse(ADMIN_CREDENTIALS);
        
        const validAdmin = admins.find((admin: any) => 
          admin.username === username && admin.password === password
        );
        
        if (validAdmin) {
          return res.status(200).json({ 
            message: 'Admin authenticated successfully',
            token: 'admin-token-' + Date.now(),
            admin: {
              username: validAdmin.username,
              name: validAdmin.username
            }
          });
        }
      } catch (parseError) {
        console.error('Error parsing admin credentials:', parseError);
        // Continue to fallback single admin check
      }
    }

    // Fallback to single admin check
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return res.status(200).json({ 
        message: 'Admin authenticated successfully',
        token: 'admin-token-' + Date.now(),
        admin: {
          username: ADMIN_USERNAME,
          name: ADMIN_USERNAME
        }
      });
    }

    return res.status(401).json({ error: 'Invalid admin credentials' });
    
  } catch (error) {
    console.error('Unexpected error in loginAdmin:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const verifyAdminCredentials = (req: Request, res: Response) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Support multiple admins
  const ADMIN_CREDENTIALS = process.env.ADMIN_CREDENTIALS;
  
  if (ADMIN_CREDENTIALS) {
    try {
      const admins = JSON.parse(ADMIN_CREDENTIALS);
      const validAdmin = admins.find((admin: any) => 
        admin.username === username && admin.password === password
      );
      
      if (validAdmin) {
        return res.status(200).json({ 
          isAdmin: true,
          adminUsername: validAdmin.username
        });
      }
    } catch (error) {
      console.error('Error parsing admin credentials:', error);
    }
  }

  // Fallback to single admin check
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.status(200).json({ 
      isAdmin: true,
      adminUsername: ADMIN_USERNAME
    });
  }
  
  res.status(401).json({ isAdmin: false });
};

// Get dashboard statistics for admin
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Import prisma here to avoid circular dependencies
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Get verification statistics
    const totalVerifications = await prisma.verification.count();
    const pendingVerifications = await prisma.verification.count({
      where: { status: 'pending' }
    });
    const approvedVerifications = await prisma.verification.count({
      where: { status: 'approved' }
    });
    const rejectedVerifications = await prisma.verification.count({
      where: { status: 'rejected' }
    });

    // Get doctor and patient counts
    const totalDoctors = await prisma.doctor.count();
    const totalPatients = await prisma.patient.count();

    // Get recent activity (simplified - you can enhance this with real queries later)
    const recentActivity = [
      {
        id: 1,
        type: 'verification_submitted',
        message: `${pendingVerifications} new verification${pendingVerifications !== 1 ? 's' : ''} submitted`,
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        type: 'verification_approved',
        message: `${approvedVerifications} verification${approvedVerifications !== 1 ? 's' : ''} approved`,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: 3,
        type: 'doctor_registered',
        message: `${totalDoctors} doctor${totalDoctors !== 1 ? 's' : ''} registered in total`,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
      }
    ];

    const stats = {
      totalVerifications,
      pendingVerifications,
      approvedVerifications,
      rejectedVerifications,
      totalDoctors,
      totalPatients,
      recentActivity
    };

    await prisma.$disconnect();
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};
