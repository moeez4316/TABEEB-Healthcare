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

// Get all users (doctors and patients) for admin management
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const { role, status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let doctors = [];
    let patients = [];

    // Fetch doctors
    if (!role || role === 'doctor') {
      doctors = await prisma.doctor.findMany({
        where: status === 'active' ? { isActive: true } : status === 'suspended' ? { isActive: false } : {},
        select: {
          uid: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          specialization: true,
          isActive: true,
          createdAt: true,
        },
        skip: !role ? skip : 0,
        take: !role ? Number(limit) : undefined,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Fetch patients
    if (!role || role === 'patient') {
      patients = await prisma.patient.findMany({
        where: status === 'active' ? { isActive: true } : status === 'suspended' ? { isActive: false } : {},
        select: {
          uid: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
        skip: !role ? skip : 0,
        take: !role ? Number(limit) : undefined,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Get total counts
    const totalDoctors = await prisma.doctor.count({
      where: status === 'active' ? { isActive: true } : status === 'suspended' ? { isActive: false } : {}
    });
    const totalPatients = await prisma.patient.count({
      where: status === 'active' ? { isActive: true } : status === 'suspended' ? { isActive: false } : {}
    });

    // Combine and format results
    const users = [
      ...doctors.map((d: any) => ({ ...d, role: 'doctor' })),
      ...patients.map((p: any) => ({ ...p, role: 'patient' }))
    ];

    await prisma.$disconnect();

    res.json({
      users,
      pagination: {
        total: totalDoctors + totalPatients,
        totalDoctors,
        totalPatients,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((totalDoctors + totalPatients) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Suspend a user account (doctor or patient)
export const suspendUser = async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const { uid, role, reason } = req.body;

    if (!uid || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }

    if (role === 'doctor') {
      const doctor = await prisma.doctor.update({
        where: { uid },
        data: { isActive: false },
        select: {
          uid: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true
        }
      });
      
      await prisma.$disconnect();
      return res.json({ 
        message: 'Doctor account suspended successfully',
        user: { ...doctor, role: 'doctor' },
        reason
      });
    } else if (role === 'patient') {
      const patient = await prisma.patient.update({
        where: { uid },
        data: { isActive: false },
        select: {
          uid: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true
        }
      });
      
      await prisma.$disconnect();
      return res.json({ 
        message: 'Patient account suspended successfully',
        user: { ...patient, role: 'patient' },
        reason
      });
    }

    await prisma.$disconnect();
    return res.status(400).json({ error: 'Invalid role specified' });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ error: 'Failed to suspend user account' });
  }
};

// Activate a user account (doctor or patient)
export const activateUser = async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const { uid, role } = req.body;

    if (!uid || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }

    if (role === 'doctor') {
      const doctor = await prisma.doctor.update({
        where: { uid },
        data: { isActive: true },
        select: {
          uid: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true
        }
      });
      
      await prisma.$disconnect();
      return res.json({ 
        message: 'Doctor account activated successfully',
        user: { ...doctor, role: 'doctor' }
      });
    } else if (role === 'patient') {
      const patient = await prisma.patient.update({
        where: { uid },
        data: { isActive: true },
        select: {
          uid: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true
        }
      });
      
      await prisma.$disconnect();
      return res.json({ 
        message: 'Patient account activated successfully',
        user: { ...patient, role: 'patient' }
      });
    }

    await prisma.$disconnect();
    return res.status(400).json({ error: 'Invalid role specified' });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ error: 'Failed to activate user account' });
  }
};
