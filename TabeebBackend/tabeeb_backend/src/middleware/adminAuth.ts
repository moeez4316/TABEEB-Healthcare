import { NextFunction, Request, Response } from 'express';
import {
  authenticateAdminLogin,
  AdminPermissionCode,
  hasAdminPermission,
  validateAdminAccessToken,
} from '../services/adminAccessService';

const extractBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
};

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

const PASSWORD_CHANGE_ALLOWED_PATHS = new Set<string>([
  '/me',
  '/logout',
  '/password/change',
]);

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const result = await authenticateAdminLogin(username, password, getRequestMeta(req));
  if (result.kind !== 'success') {
    const statusCode = result.kind === 'failure' ? result.statusCode : 401;
    const message =
      result.kind === 'failure'
        ? result.message
        : 'Two-factor verification is required for this admin account';
    return res.status(statusCode).json({ error: message });
  }

  (req as any).admin = {
    id: result.admin.id,
    username: result.admin.username,
    name: result.admin.displayName,
    email: result.admin.email,
    role: result.admin.role,
    adminRole: result.admin.role,
    permissions: result.permissions,
    mustChangePassword: result.admin.mustChangePassword,
    isSuperAdmin: result.admin.role === 'SUPER_ADMIN',
    isAdmin: true,
  };

  next();
};

export const authenticateAdminFromHeaders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No valid admin token provided' });
  }

  const validation = await validateAdminAccessToken(token);
  if (!validation.ok) {
    return res.status(validation.statusCode).json({ error: validation.message });
  }

  if (
    validation.admin.mustChangePassword &&
    !PASSWORD_CHANGE_ALLOWED_PATHS.has(req.path)
  ) {
    return res.status(403).json({
      error: 'Password change required before accessing other admin resources',
      code: 'PASSWORD_CHANGE_REQUIRED',
    });
  }

  (req as any).admin = {
    id: validation.admin.id,
    username: validation.admin.username,
    name: validation.admin.displayName,
    email: validation.admin.email,
    role: validation.admin.role,
    adminRole: validation.admin.role,
    permissions: validation.admin.permissions,
    sessionId: validation.admin.sessionId,
    jwtId: validation.admin.jwtId,
    mustChangePassword: validation.admin.mustChangePassword,
    token,
    isSuperAdmin: validation.admin.isSuperAdmin,
    isAdmin: true,
  };

  next();
};

export const requireAdminPermission = (permission: AdminPermissionCode) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin as
      | { permissions?: AdminPermissionCode[]; username?: string }
      | undefined;

    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized admin request' });
    }

    const permissions = admin.permissions || [];
    if (!hasAdminPermission({ permissions }, permission)) {
      return res.status(403).json({
        error: `Forbidden: Missing permission ${permission}`,
      });
    }

    next();
  };
};

export const requireAnyAdminPermission = (permissions: AdminPermissionCode[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin as
      | { permissions?: AdminPermissionCode[]; username?: string }
      | undefined;

    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized admin request' });
    }

    const granted = admin.permissions || [];
    const isAllowed = permissions.some((permission) =>
      hasAdminPermission({ permissions: granted }, permission)
    );

    if (!isAllowed) {
      return res.status(403).json({
        error: `Forbidden: Missing one of required permissions (${permissions.join(', ')})`,
      });
    }

    next();
  };
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const admin = (req as any).admin as { isSuperAdmin?: boolean; role?: string } | undefined;

  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized admin request' });
  }

  if (!admin.isSuperAdmin && admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
  }

  next();
};
