import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  authenticateAdminLogin,
  createAdminAccount,
  changeAdminPassword,
  parseAdminRoleInput,
  listActiveAdmins,
  revokeAdminSessionByToken,
  verifyAdminTwoFactorChallenge,
  verifyAdminTotpForSensitiveAction,
  revokeAllSessionsForAdmin,
  updateAdminBlockState,
  getAdminById,
  deleteAdminAccount,
} from '../services/adminAccessService';
import { sendAdminCredentialsEmail } from '../services/emailService';

const getRequestMeta = (req: Request): { ipAddress: string | null; userAgent: string | null } => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const ipAddress =
    (Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor?.split(',')[0]) ||
    req.ip ||
    req.socket.remoteAddress ||
    null;
  return {
    ipAddress: ipAddress ? String(ipAddress).trim() : null,
    userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : null,
  };
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
    }

    const identifier = req.body.username || req.body.email || req.body.identifier;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const result = await authenticateAdminLogin(
      String(identifier).trim(),
      String(password),
      getRequestMeta(req)
    );

    if (result.kind === 'failure') {
      return res.status(result.statusCode).json({ error: result.message });
    }

    if (result.kind === 'two_factor_required') {
      return res.status(202).json({
        message: 'Two-factor verification required',
        requiresTwoFactor: true,
        challengeToken: result.challengeToken,
        method: result.method,
        setupRequired: result.setupRequired,
        setup: result.setup || null,
        expiresInMinutes: result.expiresInMinutes,
      });
    }

    return res.status(200).json({
      message: 'Admin authenticated successfully',
      token: result.token,
      admin: {
        id: result.admin.id,
        username: result.admin.username,
        name: result.admin.displayName,
        role: result.admin.role,
        email: result.admin.email,
        mustChangePassword: result.admin.mustChangePassword,
      },
      permissions: result.permissions,
      requiresTwoFactor: false,
      mustChangePassword: result.admin.mustChangePassword,
    });
  } catch (error) {
    console.error('Unexpected error in loginAdmin:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const verifyAdminCredentials = async (req: Request, res: Response) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  try {
    const identifier = req.body.username || req.body.email || req.body.identifier;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const result = await authenticateAdminLogin(
      String(identifier).trim(),
      String(password),
      getRequestMeta(req)
    );

    if (result.kind === 'failure') {
      return res.status(401).json({ isAdmin: false });
    }

    return res.status(200).json({
      isAdmin: true,
      requiresTwoFactor: result.kind === 'two_factor_required',
      adminUsername:
        result.kind === 'success'
          ? result.admin.username
          : String(identifier).trim(),
    });
  } catch (error) {
    console.error('Error verifying admin credentials:', error);
    return res.status(500).json({ error: 'Failed to verify admin credentials' });
  }
};

export const verifyAdminTwoFactor = async (req: Request, res: Response) => {
  try {
    const { challengeToken, code } = req.body || {};

    if (!challengeToken || !code) {
      return res.status(400).json({ error: 'challengeToken and code are required' });
    }

    const result = await verifyAdminTwoFactorChallenge(
      String(challengeToken),
      String(code),
      getRequestMeta(req)
    );

    if (result.kind === 'failure') {
      return res.status(result.statusCode).json({ error: result.message });
    }

    if (result.kind === 'two_factor_required') {
      return res.status(401).json({ error: 'Two-factor verification is still pending' });
    }

    return res.status(200).json({
      message: 'Admin authenticated successfully',
      token: result.token,
      admin: {
        id: result.admin.id,
        username: result.admin.username,
        name: result.admin.displayName,
        role: result.admin.role,
        email: result.admin.email,
        mustChangePassword: result.admin.mustChangePassword,
      },
      permissions: result.permissions,
      requiresTwoFactor: false,
      mustChangePassword: result.admin.mustChangePassword,
    });
  } catch (error) {
    console.error('Error verifying admin 2FA:', error);
    return res.status(500).json({ error: 'Failed to verify admin 2FA' });
  }
};

export const logoutAdmin = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ error: 'No admin session token provided' });
    }

    const token = authHeader.slice(7).trim();
    const result = await revokeAdminSessionByToken(token, 'admin_logout');

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out admin:', error);
    return res.status(500).json({ error: 'Failed to logout admin session' });
  }
};

export const getCurrentAdminProfile = async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized admin request' });
  }

  return res.status(200).json({
    admin: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
      mustChangePassword: Boolean(admin.mustChangePassword),
    },
  });
};

export const getAdminDirectory = async (_req: Request, res: Response) => {
  try {
    const admins = await listActiveAdmins();
    return res.status(200).json({ admins });
  } catch (error) {
    console.error('Error fetching admin directory:', error);
    return res.status(500).json({ error: 'Failed to fetch admin directory' });
  }
};

export const createAdminAccountBySuperAdmin = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).admin as
      | { id: string; isSuperAdmin?: boolean; role?: string }
      | undefined;

    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized admin request' });
    }

    if (!requester.isSuperAdmin && requester.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only Super Admin can create admin accounts' });
    }

    const { username, displayName, email, password, role, totpCode } = req.body || {};

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'username is required' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email is required' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'password is required' });
    }

    if (!role || typeof role !== 'string' || !parseAdminRoleInput(role)) {
      return res.status(400).json({ error: 'Valid admin role is required' });
    }

    if (!totpCode || typeof totpCode !== 'string') {
      return res.status(400).json({ error: 'totpCode is required' });
    }

    const totpValidation = await verifyAdminTotpForSensitiveAction(requester.id, totpCode);
    if (!totpValidation.ok) {
      return res.status(401).json({ error: totpValidation.message || 'Invalid authenticator code' });
    }

    const created = await createAdminAccount({
      actorAdminId: requester.id,
      username,
      displayName,
      email,
      password,
      role,
    });

    const requesterLabel =
      (requester as { name?: string; username?: string }).name ||
      (requester as { username?: string }).username ||
      'Super Admin';
    const delivery = await sendAdminCredentialsEmail({
      email: created.email,
      displayName: created.displayName,
      username: created.username,
      temporaryPassword: password,
      role: created.role,
      createdByName: requesterLabel,
    });

    return res.status(201).json({
      message: 'Admin account created successfully',
      admin: created,
      emailDelivery: delivery.success ? 'sent' : 'failed',
      emailWarning: delivery.success ? null : 'Admin created, but credential email failed to send.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create admin account';
    const lowered = message.toLowerCase();

    if (lowered.includes('already exists') || lowered.includes('required') || lowered.includes('invalid')) {
      return res.status(400).json({ error: message });
    }

    console.error('Error creating admin account:', error);
    return res.status(500).json({ error: 'Failed to create admin account' });
  }
};

export const changeCurrentAdminPassword = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).admin as
      | { id: string; sessionId?: string | null }
      | undefined;

    if (!requester?.id) {
      return res.status(401).json({ error: 'Unauthorized admin request' });
    }

    const { currentPassword, newPassword, confirmNewPassword } = req.body || {};

    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'Current password is required' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (
      typeof confirmNewPassword === 'string' &&
      confirmNewPassword &&
      confirmNewPassword !== newPassword
    ) {
      return res.status(400).json({ error: 'New password and confirmation do not match' });
    }

    const result = await changeAdminPassword({
      adminId: requester.id,
      currentPassword,
      newPassword,
      keepSessionId: requester.sessionId || null,
    });

    return res.status(200).json({
      message: 'Password changed successfully',
      admin: {
        id: result.id,
        username: result.username,
        email: result.email,
        mustChangePassword: result.mustChangePassword,
      },
      revokedSessions: result.revokedSessionCount,
      changedAt: result.changedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to change admin password';
    const lowered = message.toLowerCase();

    if (lowered.includes('not found')) {
      return res.status(404).json({ error: message });
    }

    if (
      lowered.includes('required') ||
      lowered.includes('invalid') ||
      lowered.includes('incorrect') ||
      lowered.includes('must') ||
      lowered.includes('active')
    ) {
      return res.status(400).json({ error: message });
    }

    console.error('Error changing admin password:', error);
    return res.status(500).json({ error: 'Failed to change admin password' });
  }
};

export const deleteAdminAccountBySuperAdmin = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).admin as
      | { id: string; isSuperAdmin?: boolean; role?: string }
      | undefined;

    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized admin request' });
    }

    if (!requester.isSuperAdmin && requester.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only Super Admin can delete admin accounts' });
    }

    const { adminId } = req.params;
    const { totpCode } = req.body || {};

    if (!adminId) {
      return res.status(400).json({ error: 'adminId route param is required' });
    }

    if (!totpCode || typeof totpCode !== 'string') {
      return res.status(400).json({ error: 'totpCode is required' });
    }

    const totpValidation = await verifyAdminTotpForSensitiveAction(requester.id, totpCode);
    if (!totpValidation.ok) {
      return res.status(401).json({ error: totpValidation.message || 'Invalid authenticator code' });
    }

    const deleted = await deleteAdminAccount({
      actorAdminId: requester.id,
      targetAdminId: adminId,
    });

    return res.status(200).json({
      message: 'Admin account deleted successfully',
      admin: deleted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete admin account';
    const lowered = message.toLowerCase();

    if (lowered.includes('not found')) {
      return res.status(404).json({ error: message });
    }

    if (
      lowered.includes('cannot') ||
      lowered.includes('required') ||
      lowered.includes('invalid') ||
      lowered.includes('your own')
    ) {
      return res.status(400).json({ error: message });
    }

    console.error('Error deleting admin account:', error);
    return res.status(500).json({ error: 'Failed to delete admin account' });
  }
};

export const updateAdminBlockStatus = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).admin;
    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized admin request' });
    }

    const { adminId } = req.params;
    const { blocked, reason } = req.body || {};

    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ error: 'blocked boolean flag is required' });
    }

    if (!adminId) {
      return res.status(400).json({ error: 'adminId route param is required' });
    }

    if (requester.id === adminId && blocked) {
      return res.status(400).json({ error: 'You cannot block your own account' });
    }

    const targetAdmin = await getAdminById(adminId);
    if (!targetAdmin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    const updated = await updateAdminBlockState({
      targetAdminId: adminId,
      blocked,
      blockedReason: blocked ? String(reason || 'Blocked by Super Admin') : null,
    });

    if (blocked) {
      await revokeAllSessionsForAdmin(adminId, 'admin_blocked');
    }

    return res.status(200).json({
      message: blocked ? 'Admin blocked successfully' : 'Admin unblocked successfully',
      admin: {
        id: updated.id,
        username: updated.username,
        displayName: updated.displayName,
        role: updated.role,
        isBlocked: updated.isBlocked,
        blockedAt: updated.blockedAt,
        blockedReason: updated.blockedReason,
      },
    });
  } catch (error) {
    console.error('Error updating admin block status:', error);
    return res.status(500).json({ error: 'Failed to update admin block status' });
  }
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

// Get all doctors for admin
export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Fetch all doctors with their profile information
    const doctors = await prisma.doctor.findMany({
      select: {
        uid: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        specialization: true,
        experience: true,
        addressCity: true,
        addressProvince: true,
        qualification: true,
        profileImageUrl: true,
        isActive: true,
        createdAt: true,
        verification: {
          select: {
            isVerified: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map the fields to match frontend expectations
    const mappedDoctors = doctors.map((doctor: any) => ({
      uid: doctor.uid,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      experience: doctor.experience,
      city: doctor.addressCity,
      province: doctor.addressProvince,
      pmdc: doctor.qualification,
      profileImage: doctor.profileImageUrl,
      isVerified: doctor.verification?.isVerified || false,
      isActive: doctor.isActive,
      createdAt: doctor.createdAt,
    }));

    await prisma.$disconnect();

    res.json({
      doctors: mappedDoctors,
      total: mappedDoctors.length
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};
