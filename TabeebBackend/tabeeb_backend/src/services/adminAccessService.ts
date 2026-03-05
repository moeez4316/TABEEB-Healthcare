import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {
  AdminRole,
  AdminSession,
  AdminUser,
  Prisma,
} from '@prisma/client';
import prisma from '../lib/prisma';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'tabeeb-admin-secret-key-2026';
const ACCESS_TOKEN_HOURS = Number(process.env.ADMIN_ACCESS_TOKEN_HOURS ?? 24);
const TWO_FACTOR_CHALLENGE_MINUTES = Number(process.env.ADMIN_2FA_CHALLENGE_MINUTES ?? 10);
const ADMIN_PASSWORD_SALT = process.env.ADMIN_PASSWORD_SALT || 'tabeeb-admin-password-salt';
const ADMIN_TOTP_ISSUER = process.env.ADMIN_TOTP_ISSUER || 'Tabeeb Admin';
const TOTP_STEP_SECONDS = Math.max(15, Math.floor(Number(process.env.ADMIN_TOTP_STEP_SECONDS ?? 30) || 30));
const TOTP_WINDOW = Math.max(0, Math.floor(Number(process.env.ADMIN_TOTP_WINDOW ?? 1) || 1));
const TOTP_DIGITS = 6;
const TOTP_SECRET_BYTES = 20;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ADMIN_PASSWORD_MIN_LENGTH = Math.max(
  10,
  Math.floor(Number(process.env.ADMIN_PASSWORD_MIN_LENGTH ?? 10) || 10)
);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeTotpSecret = (secret: string): string =>
  secret.toUpperCase().replace(/[^A-Z2-7]/g, '');

const base32Encode = (input: Buffer): string => {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

const base32Decode = (secret: string): Buffer => {
  const normalized = normalizeTotpSecret(secret);
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) {
      throw new Error('Invalid TOTP secret format');
    }
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

const createTotpSecret = (): string => base32Encode(crypto.randomBytes(TOTP_SECRET_BYTES));

const counterToBuffer = (counter: number): Buffer => {
  const safeCounter = Math.max(0, Math.floor(counter));
  const buffer = Buffer.alloc(8);
  const upper = Math.floor(safeCounter / 0x100000000);
  const lower = safeCounter >>> 0;
  buffer.writeUInt32BE(upper, 0);
  buffer.writeUInt32BE(lower, 4);
  return buffer;
};

const createTotpCodeAtCounter = (secret: string, counter: number): string => {
  const key = base32Decode(secret);
  const hmac = crypto
    .createHmac('sha1', key)
    .update(counterToBuffer(counter))
    .digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % 10 ** TOTP_DIGITS;
  return String(otp).padStart(TOTP_DIGITS, '0');
};

const verifyTotpCode = (secret: string, code: string): boolean => {
  const nowCounter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);
  const provided = String(code || '').trim();
  if (!/^\d{6}$/.test(provided)) return false;

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    const expected = createTotpCodeAtCounter(secret, nowCounter + offset);
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);
    if (
      expectedBuffer.length === providedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return true;
    }
  }

  return false;
};

const buildTotpKeyUri = (accountName: string, secret: string): string => {
  const issuer = encodeURIComponent(ADMIN_TOTP_ISSUER);
  const account = encodeURIComponent(accountName);
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
};

export type AdminPermissionCode =
  | 'message.read'
  | 'message.send_direct'
  | 'message.send_group'
  | 'support.create_ticket'
  | 'support.view_assigned'
  | 'support.view_all'
  | 'support.update_status'
  | 'broadcast.create'
  | 'broadcast.send_all'
  | 'broadcast.send_role'
  | 'broadcast.acknowledge'
  | 'mailbox.read'
  | 'mailbox.reply'
  | 'mailbox.manage'
  | 'admin.block'
  | 'audit.read';

const ALL_ADMIN_PERMISSIONS: AdminPermissionCode[] = [
  'message.read',
  'message.send_direct',
  'message.send_group',
  'support.create_ticket',
  'support.view_assigned',
  'support.view_all',
  'support.update_status',
  'broadcast.create',
  'broadcast.send_all',
  'broadcast.send_role',
  'broadcast.acknowledge',
  'mailbox.read',
  'mailbox.reply',
  'mailbox.manage',
  'admin.block',
  'audit.read',
];

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissionCode[]> = {
  SUPER_ADMIN: ALL_ADMIN_PERMISSIONS,
  VERIFICATION_TEAM: [
    'message.read',
    'message.send_direct',
    'message.send_group',
    'support.create_ticket',
    'support.view_assigned',
    'broadcast.acknowledge',
    'mailbox.read',
  ],
  SUPPORT_TEAM: [
    'message.read',
    'message.send_direct',
    'message.send_group',
    'support.create_ticket',
    'support.view_assigned',
    'support.update_status',
    'broadcast.acknowledge',
    'mailbox.read',
    'mailbox.reply',
  ],
  OPERATIONS_TEAM: [
    'message.read',
    'message.send_direct',
    'message.send_group',
    'support.create_ticket',
    'support.view_assigned',
    'broadcast.acknowledge',
    'mailbox.read',
  ],
  CONTENT_TEAM: [
    'message.read',
    'message.send_direct',
    'support.create_ticket',
    'broadcast.acknowledge',
  ],
};

interface RequestMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface AdminAccessJwtPayload extends JwtPayload {
  role: 'admin';
  adminId: string;
  username: string;
  adminRole: AdminRole;
  sid: string;
  jti: string;
  loginTime: number;
}

interface TwoFactorChallengeJwtPayload extends JwtPayload {
  type: 'admin-2fa';
  adminId: string;
  sid: string;
  jti: string;
}

interface AdminPublicProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: AdminRole;
  isBlocked: boolean;
  mustChangePassword: boolean;
}

export interface AuthenticatedAdminContext {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermissionCode[];
  sessionId: string;
  jwtId: string;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
}

interface LoginSuccessResult {
  kind: 'success';
  token: string;
  admin: AdminPublicProfile;
  permissions: AdminPermissionCode[];
}

interface TotpSetupPayload {
  issuer: string;
  accountName: string;
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

interface LoginTwoFactorResult {
  kind: 'two_factor_required';
  challengeToken: string;
  method: 'totp';
  setupRequired: boolean;
  setup?: TotpSetupPayload;
  expiresInMinutes: number;
}

interface LoginFailureResult {
  kind: 'failure';
  statusCode: number;
  message: string;
}

type LoginResult = LoginSuccessResult | LoginTwoFactorResult | LoginFailureResult;

interface TokenValidationResult {
  ok: true;
  admin: AuthenticatedAdminContext;
}

interface TokenValidationFailure {
  ok: false;
  statusCode: number;
  message: string;
}

type TokenValidation = TokenValidationResult | TokenValidationFailure;

interface VerifySensitiveActionTotpResult {
  ok: boolean;
  message?: string;
}

interface CreateAdminAccountInput {
  actorAdminId: string;
  username: string;
  displayName?: string;
  email: string;
  password: string;
  role: string;
}

interface CreatedAdminSummary {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: AdminRole;
  isApproved: boolean;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: Date;
}

interface DeleteAdminAccountInput {
  actorAdminId: string;
  targetAdminId: string;
}

interface DeletedAdminSummary {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: AdminRole;
  deletedAt: Date;
}

interface ChangeAdminPasswordInput {
  adminId: string;
  currentPassword: string;
  newPassword: string;
  keepSessionId?: string | null;
}

interface ChangeAdminPasswordResult {
  id: string;
  username: string;
  email: string;
  mustChangePassword: boolean;
  changedAt: Date;
  revokedSessionCount: number;
}

const hashPassword = (password: string): string =>
  crypto.createHash('sha256').update(`${ADMIN_PASSWORD_SALT}:${password}`).digest('hex');

const normalizeEmailAddress = (email: string): string => String(email || '').trim().toLowerCase();

const normalizeBootstrapEmail = (emailInput: string): string => {
  const normalized = normalizeEmailAddress(emailInput);
  if (EMAIL_REGEX.test(normalized)) {
    return normalized;
  }

  console.warn(
    `[Admin Bootstrap] Invalid BOOTSTRAP_SUPERADMIN_EMAIL "${emailInput}". Falling back to ${DEFAULT_BOOTSTRAP_SUPERADMIN_EMAIL}.`
  );
  return DEFAULT_BOOTSTRAP_SUPERADMIN_EMAIL;
};

const normalizeRequiredEmail = (emailInput: string): string => {
  const normalized = normalizeEmailAddress(emailInput);
  if (!EMAIL_REGEX.test(normalized)) {
    throw new Error('Valid email is required');
  }
  return normalized;
};

const validateAdminPasswordStrength = (password: string): string | null => {
  if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    return `password must be at least ${ADMIN_PASSWORD_MIN_LENGTH} characters`;
  }
  if (!/[a-z]/.test(password)) {
    return 'password must include at least one lowercase letter';
  }
  if (!/[A-Z]/.test(password)) {
    return 'password must include at least one uppercase letter';
  }
  if (!/\d/.test(password)) {
    return 'password must include at least one number';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'password must include at least one special character';
  }
  if (/\s/.test(password)) {
    return 'password cannot contain spaces';
  }
  return null;
};

const DEFAULT_BOOTSTRAP_SUPERADMIN_USERNAME = 'Hammad.Hafeez';
const DEFAULT_BOOTSTRAP_SUPERADMIN_DISPLAY_NAME = 'Hammad Hafeez';
const DEFAULT_BOOTSTRAP_SUPERADMIN_EMAIL = 'hammad.hafeez@tabeebemail.me';

const normalizeRole = (input?: string | null): AdminRole | null => {
  if (!input) return null;
  const normalized = input.toUpperCase().replace(/[\s-]+/g, '_');
  switch (normalized) {
    case 'SUPER_ADMIN':
    case 'SUPERADMIN':
      return 'SUPER_ADMIN';
    case 'VERIFICATION_TEAM':
    case 'VERIFICATION':
      return 'VERIFICATION_TEAM';
    case 'SUPPORT_TEAM':
    case 'SUPPORT':
      return 'SUPPORT_TEAM';
    case 'OPERATIONS_TEAM':
    case 'OPERATIONS':
    case 'OPS_TEAM':
      return 'OPERATIONS_TEAM';
    case 'CONTENT_TEAM':
    case 'CONTENT':
      return 'CONTENT_TEAM';
    default:
      return null;
  }
};

export const parseAdminRoleInput = (input?: string | null): AdminRole | null =>
  normalizeRole(input);

const toDisplayName = (username: string): string =>
  username
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getBootstrapSuperAdminConfig = (): {
  username: string;
  displayName: string;
  email: string;
  password: string;
} => {
  const username =
    (process.env.BOOTSTRAP_SUPERADMIN_USERNAME || DEFAULT_BOOTSTRAP_SUPERADMIN_USERNAME).trim() ||
    DEFAULT_BOOTSTRAP_SUPERADMIN_USERNAME;
  const displayName =
    (process.env.BOOTSTRAP_SUPERADMIN_DISPLAY_NAME || DEFAULT_BOOTSTRAP_SUPERADMIN_DISPLAY_NAME).trim() ||
    toDisplayName(username);
  const emailInput =
    (process.env.BOOTSTRAP_SUPERADMIN_EMAIL || DEFAULT_BOOTSTRAP_SUPERADMIN_EMAIL).trim() ||
    DEFAULT_BOOTSTRAP_SUPERADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_SUPERADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';

  return {
    username,
    displayName,
    email: normalizeBootstrapEmail(emailInput),
    password,
  };
};

const normalizePermission = (value: unknown): AdminPermissionCode | null => {
  if (typeof value !== 'string') return null;
  if (ALL_ADMIN_PERMISSIONS.includes(value as AdminPermissionCode)) {
    return value as AdminPermissionCode;
  }
  return null;
};

const getCustomPermissions = (value: Prisma.JsonValue | null): AdminPermissionCode[] => {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((entry) => normalizePermission(entry))
    .filter((entry): entry is AdminPermissionCode => Boolean(entry));

  return Array.from(new Set(normalized));
};

const resolvePermissions = (admin: Pick<AdminUser, 'role' | 'customPermissions'>): AdminPermissionCode[] => {
  const rolePermissions = ROLE_PERMISSIONS[admin.role] ?? [];
  const customPermissions = getCustomPermissions(admin.customPermissions);
  return Array.from(new Set([...rolePermissions, ...customPermissions]));
};

const ensureBootstrapSuperAdmin = async (): Promise<AdminUser | null> => {
  const config = getBootstrapSuperAdminConfig();
  if (!config.password) {
    console.warn(
      '[Admin Bootstrap] Missing BOOTSTRAP_SUPERADMIN_PASSWORD (or ADMIN_PASSWORD). Skipping bootstrap admin creation.'
    );
    return null;
  }

  const existingByUsername = await prisma.adminUser.findUnique({
    where: { username: config.username },
  });

  if (existingByUsername) {
    if (
      existingByUsername.role === 'SUPER_ADMIN' &&
      existingByUsername.isApproved &&
      existingByUsername.isActive &&
      !existingByUsername.isBlocked &&
      !existingByUsername.mustChangePassword
    ) {
      return existingByUsername;
    }

    return prisma.adminUser.update({
      where: { id: existingByUsername.id },
      data: {
        displayName: config.displayName,
        role: 'SUPER_ADMIN',
        isApproved: true,
        approvedAt: existingByUsername.approvedAt ?? new Date(),
        isActive: true,
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
        twoFactorEnabled: true,
        twoFactorEnforced: true,
        mustChangePassword: false,
      },
    });
  }

  const existingByEmail = await prisma.adminUser.findUnique({
    where: { email: config.email },
  });

  if (existingByEmail) {
    return prisma.adminUser.update({
      where: { id: existingByEmail.id },
      data: {
        username: config.username,
        displayName: config.displayName,
        role: 'SUPER_ADMIN',
        isApproved: true,
        approvedAt: existingByEmail.approvedAt ?? new Date(),
        isActive: true,
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
        twoFactorEnabled: true,
        twoFactorEnforced: true,
        mustChangePassword: false,
      },
    });
  }

  const seedOrFirstAdmin =
    (await prisma.adminUser.findFirst({
      where: { isSeedAdmin: true },
      orderBy: { createdAt: 'asc' },
    })) ||
    (await prisma.adminUser.findFirst({
      orderBy: { createdAt: 'asc' },
    }));

  return prisma.adminUser.create({
    data: {
      username: config.username,
      displayName: config.displayName,
      email: config.email,
      passwordHash: hashPassword(config.password),
      role: 'SUPER_ADMIN',
      isSeedAdmin: !seedOrFirstAdmin,
      isApproved: true,
      approvedAt: new Date(),
      approvedById: seedOrFirstAdmin ? seedOrFirstAdmin.id : null,
      isActive: true,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
      twoFactorEnabled: true,
      twoFactorEnforced: true,
      mustChangePassword: false,
      customPermissions: Prisma.DbNull,
    },
  });
};

let bootstrapPromise: Promise<void> | null = null;

export const ensureAdminUsersBootstrapped = async (): Promise<void> => {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const bootstrapAdmin = await ensureBootstrapSuperAdmin();
      let seedAdmin: AdminUser | null = null;

      if (bootstrapAdmin) {
        await prisma.adminUser.updateMany({
          where: {
            isSeedAdmin: true,
            id: { not: bootstrapAdmin.id },
          },
          data: {
            isSeedAdmin: false,
          },
        });

        seedAdmin = await prisma.adminUser.update({
          where: { id: bootstrapAdmin.id },
          data: {
            isSeedAdmin: true,
            isApproved: true,
            approvedAt: bootstrapAdmin.approvedAt ?? new Date(),
            approvedById: null,
            mustChangePassword: false,
          },
        });
      } else {
        seedAdmin =
          (await prisma.adminUser.findFirst({
            where: { isSeedAdmin: true },
            orderBy: { createdAt: 'asc' },
          })) ||
          (await prisma.adminUser.findFirst({
            orderBy: { createdAt: 'asc' },
          }));
      }

      if (!seedAdmin) {
        console.warn('[Admin Bootstrap] No admin users available and bootstrap account could not be created.');
        return;
      }

      if (!seedAdmin.isSeedAdmin || !seedAdmin.isApproved || seedAdmin.mustChangePassword) {
        await prisma.adminUser.update({
          where: { id: seedAdmin.id },
          data: {
            isSeedAdmin: true,
            isApproved: true,
            approvedAt: seedAdmin.approvedAt ?? new Date(),
            approvedById: seedAdmin.approvedById ?? null,
            mustChangePassword: false,
          },
        });
      }

      await prisma.adminUser.updateMany({
        where: {
          isApproved: false,
          id: { not: seedAdmin.id },
        },
        data: {
          isApproved: true,
          approvedAt: new Date(),
          approvedById: seedAdmin.id,
        },
      });
    })();
  }

  await bootstrapPromise;
};

const toPublicAdminProfile = (admin: AdminUser): AdminPublicProfile => ({
  id: admin.id,
  username: admin.username,
  displayName: admin.displayName,
  email: admin.email,
  role: admin.role,
  isBlocked: admin.isBlocked,
  mustChangePassword: admin.mustChangePassword,
});

const issueAccessToken = (admin: AdminUser, session: Pick<AdminSession, 'id' | 'jwtId'>): string => {
  const payload: AdminAccessJwtPayload = {
    role: 'admin',
    adminId: admin.id,
    username: admin.username,
    adminRole: admin.role,
    sid: session.id,
    jti: session.jwtId,
    loginTime: Date.now(),
  };

  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: `${ACCESS_TOKEN_HOURS}h` });
};

const createTwoFactorChallengeToken = (
  admin: AdminUser,
  session: Pick<AdminSession, 'id' | 'jwtId'>
): string => {
  const payload: TwoFactorChallengeJwtPayload = {
    type: 'admin-2fa',
    adminId: admin.id,
    sid: session.id,
    jti: session.jwtId,
  };

  return jwt.sign(payload, ADMIN_JWT_SECRET, {
    expiresIn: `${TWO_FACTOR_CHALLENGE_MINUTES}m`,
  });
};

const createSession = async (
  admin: AdminUser,
  meta: RequestMeta,
  options: { requiresTwoFactor: boolean; twoFactorVerified: boolean }
): Promise<AdminSession> => {
  return prisma.adminSession.create({
    data: {
      adminUserId: admin.id,
      jwtId: crypto.randomUUID(),
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
      requiresTwoFactor: options.requiresTwoFactor,
      twoFactorVerifiedAt: options.twoFactorVerified ? new Date() : null,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_HOURS * 60 * 60 * 1000),
    },
  });
};

const buildTotpSetupPayload = (
  admin: AdminUser,
  secret: string
): TotpSetupPayload => {
  const accountName = admin.email.toLowerCase();
  const otpauthUrl = buildTotpKeyUri(accountName, secret);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    otpauthUrl
  )}`;

  return {
    issuer: ADMIN_TOTP_ISSUER,
    accountName,
    secret,
    otpauthUrl,
    qrCodeUrl,
  };
};

const ensureAdminTotpSecret = async (admin: AdminUser): Promise<{
  admin: AdminUser;
  secret: string;
  setupRequired: boolean;
}> => {
  if (admin.totpSecret) {
    return { admin, secret: admin.totpSecret, setupRequired: false };
  }

  const secret = createTotpSecret();
  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      totpSecret: secret,
    },
  });

  return { admin: updated, secret, setupRequired: true };
};

const buildAuthenticatedContext = (
  admin: AdminUser,
  session: Pick<AdminSession, 'id' | 'jwtId'>
): AuthenticatedAdminContext => ({
  id: admin.id,
  username: admin.username,
  displayName: admin.displayName,
  email: admin.email,
  role: admin.role,
  permissions: resolvePermissions(admin),
  sessionId: session.id,
  jwtId: session.jwtId,
  isSuperAdmin: admin.role === 'SUPER_ADMIN',
  mustChangePassword: admin.mustChangePassword,
});

const comparePassword = (password: string, passwordHash: string): boolean =>
  hashPassword(password) === passwordHash;

const findAdminForLogin = async (identifier: string): Promise<AdminUser | null> => {
  await ensureAdminUsersBootstrapped();
  const normalized = identifier.trim();
  const lowered = normalized.toLowerCase();

  return prisma.adminUser.findFirst({
    where: {
      OR: [{ username: normalized }, { email: lowered }],
    },
  });
};

export const hasAdminPermission = (
  context: Pick<AuthenticatedAdminContext, 'permissions'>,
  permission: AdminPermissionCode
): boolean => context.permissions.includes(permission);

export const authenticateAdminLogin = async (
  identifier: string,
  password: string,
  meta: RequestMeta
): Promise<LoginResult> => {
  const admin = await findAdminForLogin(identifier);

  if (!admin || !comparePassword(password, admin.passwordHash)) {
    return { kind: 'failure', statusCode: 401, message: 'Invalid admin credentials' };
  }

  if (!admin.isActive) {
    return { kind: 'failure', statusCode: 403, message: 'Admin account is inactive' };
  }

  if (admin.isBlocked) {
    return { kind: 'failure', statusCode: 403, message: 'Admin account is blocked' };
  }

  if (!admin.isApproved) {
    return {
      kind: 'failure',
      statusCode: 403,
      message: 'Admin account is pending Super Admin approval',
    };
  }

  // Allow skipping 2FA for local development (set ADMIN_SKIP_2FA=true in .env)
  if (process.env.ADMIN_SKIP_2FA === 'true') {
    const session = await createSession(admin, meta, {
      requiresTwoFactor: false,
      twoFactorVerified: true,
    });

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      kind: 'success',
      token: issueAccessToken(admin, session),
      admin: toPublicAdminProfile(admin),
      permissions: resolvePermissions(admin),
    };
  }

  const session = await createSession(admin, meta, {
    requiresTwoFactor: true,
    twoFactorVerified: false,
  });

  const { secret, setupRequired } = await ensureAdminTotpSecret(admin);
  const setup = setupRequired ? buildTotpSetupPayload(admin, secret) : undefined;

  return {
    kind: 'two_factor_required',
    challengeToken: createTwoFactorChallengeToken(admin, session),
    method: 'totp',
    setupRequired,
    setup,
    expiresInMinutes: TWO_FACTOR_CHALLENGE_MINUTES,
  };
};

const parseChallengeToken = (challengeToken: string): TwoFactorChallengeJwtPayload | null => {
  try {
    const decoded = jwt.verify(challengeToken, ADMIN_JWT_SECRET) as TwoFactorChallengeJwtPayload;
    if (decoded.type !== 'admin-2fa') return null;
    if (!decoded.adminId || !decoded.sid || !decoded.jti) return null;
    return decoded;
  } catch {
    return null;
  }
};

export const verifyAdminTwoFactorChallenge = async (
  challengeToken: string,
  otpCode: string,
  meta: RequestMeta
): Promise<LoginResult> => {
  const challenge = parseChallengeToken(challengeToken);
  if (!challenge) {
    return { kind: 'failure', statusCode: 401, message: 'Invalid or expired 2FA challenge' };
  }

  const session = await prisma.adminSession.findUnique({
    where: { id: challenge.sid },
    include: { adminUser: true },
  });

  if (!session || session.jwtId !== challenge.jti || session.adminUserId !== challenge.adminId) {
    return { kind: 'failure', statusCode: 401, message: 'Invalid or expired 2FA challenge' };
  }

  if (session.isRevoked || session.expiresAt < new Date()) {
    return { kind: 'failure', statusCode: 401, message: 'Session is no longer valid' };
  }

  if (session.adminUser.isBlocked || !session.adminUser.isActive) {
    await prisma.adminSession.update({
      where: { id: session.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'admin_blocked_or_inactive',
      },
    });
    return { kind: 'failure', statusCode: 403, message: 'Admin account cannot sign in' };
  }

  if (!session.adminUser.isApproved) {
    await prisma.adminSession.update({
      where: { id: session.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'admin_not_approved',
      },
    });
    return {
      kind: 'failure',
      statusCode: 403,
      message: 'Admin account is pending Super Admin approval',
    };
  }

  const providedCode = String(otpCode || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(providedCode)) {
    return { kind: 'failure', statusCode: 400, message: 'Authenticator code must be 6 digits' };
  }

  const totpSecret = session.adminUser.totpSecret;
  if (!totpSecret) {
    await prisma.adminSession.update({
      where: { id: session.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'totp_secret_missing',
      },
    });
    return {
      kind: 'failure',
      statusCode: 409,
      message: 'Authenticator setup is incomplete. Sign in again to continue setup.',
    };
  }

  const isValid = verifyTotpCode(totpSecret, providedCode);
  if (!isValid) {
    return { kind: 'failure', statusCode: 400, message: 'Invalid authenticator code' };
  }

  await prisma.adminSession.update({
    where: { id: session.id },
    data: {
      twoFactorVerifiedAt: new Date(),
      lastSeenAt: new Date(),
      ipAddress: meta.ipAddress ?? session.ipAddress,
      userAgent: meta.userAgent ?? session.userAgent,
    },
  });

  const updatedAdmin = await prisma.adminUser.update({
    where: { id: session.adminUser.id },
    data: {
      lastLoginAt: new Date(),
      totpConfiguredAt: session.adminUser.totpConfiguredAt ?? new Date(),
      twoFactorEnabled: true,
      twoFactorEnforced: true,
    },
  });

  return {
    kind: 'success',
    token: issueAccessToken(updatedAdmin, session),
    admin: toPublicAdminProfile(updatedAdmin),
    permissions: resolvePermissions(updatedAdmin),
  };
};

const parseAccessToken = (token: string): AdminAccessJwtPayload | null => {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminAccessJwtPayload;
    if (decoded.role !== 'admin') return null;
    if (!decoded.sid || !decoded.jti || !decoded.adminId) return null;
    return decoded;
  } catch {
    return null;
  }
};

export const validateAdminAccessToken = async (token: string): Promise<TokenValidation> => {
  const payload = parseAccessToken(token);
  if (!payload) {
    return { ok: false, statusCode: 401, message: 'Invalid admin token' };
  }

  const session = await prisma.adminSession.findUnique({
    where: { id: payload.sid },
    include: { adminUser: true },
  });

  if (!session || session.jwtId !== payload.jti || session.adminUserId !== payload.adminId) {
    return { ok: false, statusCode: 401, message: 'Invalid admin session' };
  }

  if (session.isRevoked) {
    return { ok: false, statusCode: 401, message: 'Session has been revoked' };
  }

  if (session.expiresAt < new Date()) {
    return { ok: false, statusCode: 401, message: 'Session has expired' };
  }

  if (session.requiresTwoFactor && !session.twoFactorVerifiedAt) {
    return { ok: false, statusCode: 401, message: 'Two-factor authentication is required' };
  }

  if (session.adminUser.isBlocked) {
    return { ok: false, statusCode: 403, message: 'Admin account is blocked' };
  }

  if (!session.adminUser.isActive) {
    return { ok: false, statusCode: 403, message: 'Admin account is inactive' };
  }

  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return {
    ok: true,
    admin: buildAuthenticatedContext(session.adminUser, session),
  };
};

export const revokeAdminSessionByToken = async (
  token: string,
  reason: string
): Promise<{ revoked: boolean }> => {
  const payload = parseAccessToken(token);
  if (!payload) return { revoked: false };

  const result = await prisma.adminSession.updateMany({
    where: {
      id: payload.sid,
      jwtId: payload.jti,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  return { revoked: result.count > 0 };
};

export const revokeAllSessionsForAdmin = async (
  adminId: string,
  reason: string
): Promise<number> => {
  const result = await prisma.adminSession.updateMany({
    where: {
      adminUserId: adminId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  return result.count;
};

export const getSuperAdminIds = async (): Promise<string[]> => {
  const admins = await prisma.adminUser.findMany({
    where: {
      role: 'SUPER_ADMIN',
      isBlocked: false,
      isActive: true,
    },
    select: { id: true },
  });

  return admins.map((admin) => admin.id);
};

export const listActiveAdmins = async (): Promise<
  Array<{
    id: string;
    username: string;
    displayName: string;
    role: AdminRole;
    email: string;
    isBlocked: boolean;
  }>
> => {
  await ensureAdminUsersBootstrapped();
  return prisma.adminUser.findMany({
    orderBy: [{ role: 'asc' }, { displayName: 'asc' }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      email: true,
      isBlocked: true,
    },
  });
};

export const getAdminById = async (adminId: string): Promise<AdminUser | null> =>
  prisma.adminUser.findUnique({ where: { id: adminId } });

export const updateAdminBlockState = async (params: {
  targetAdminId: string;
  blocked: boolean;
  blockedReason?: string | null;
}): Promise<AdminUser> => {
  return prisma.adminUser.update({
    where: { id: params.targetAdminId },
    data: {
      isBlocked: params.blocked,
      blockedAt: params.blocked ? new Date() : null,
      blockedReason: params.blocked ? params.blockedReason ?? 'Blocked by Super Admin' : null,
    },
  });
};

export const deleteAdminAccount = async (
  input: DeleteAdminAccountInput
): Promise<DeletedAdminSummary> => {
  const targetAdminId = String(input.targetAdminId || '').trim();
  if (!targetAdminId) {
    throw new Error('targetAdminId is required');
  }

  if (input.actorAdminId === targetAdminId) {
    throw new Error('You cannot delete your own account');
  }

  return prisma.$transaction(async (tx) => {
    const target = await tx.adminUser.findUnique({
      where: { id: targetAdminId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        isSeedAdmin: true,
      },
    });

    if (!target) {
      throw new Error('Admin user not found');
    }

    if (target.isSeedAdmin) {
      throw new Error('Seed Super Admin account cannot be deleted');
    }

    if (target.role === 'SUPER_ADMIN') {
      const remainingActiveSuperAdmins = await tx.adminUser.count({
        where: {
          role: 'SUPER_ADMIN',
          id: { not: target.id },
          isApproved: true,
          isActive: true,
          isBlocked: false,
        },
      });

      if (remainingActiveSuperAdmins <= 0) {
        throw new Error('Cannot delete the last active Super Admin account');
      }
    }

    await tx.adminUser.delete({
      where: { id: target.id },
    });

    return {
      id: target.id,
      username: target.username,
      displayName: target.displayName,
      email: target.email,
      role: target.role,
      deletedAt: new Date(),
    };
  });
};

export const verifyAdminTotpForSensitiveAction = async (
  adminId: string,
  totpCode: string
): Promise<VerifySensitiveActionTotpResult> => {
  const code = String(totpCode || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, message: 'Authenticator code must be 6 digits' };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      isActive: true,
      isBlocked: true,
      totpSecret: true,
    },
  });

  if (!admin) {
    return { ok: false, message: 'Admin account not found' };
  }

  if (!admin.isActive || admin.isBlocked) {
    return { ok: false, message: 'Admin account is not active' };
  }

  if (!admin.totpSecret) {
    return { ok: false, message: 'Authenticator setup is incomplete' };
  }

  const isValid = verifyTotpCode(admin.totpSecret, code);
  if (!isValid) {
    return { ok: false, message: 'Invalid authenticator code' };
  }

  return { ok: true };
};

export const createAdminAccount = async (
  input: CreateAdminAccountInput
): Promise<CreatedAdminSummary> => {
  const username = String(input.username || '').trim();
  const displayName = String(input.displayName || '').trim();
  const password = String(input.password || '');
  const role = normalizeRole(input.role);

  if (!username) {
    throw new Error('username is required');
  }

  const passwordValidationError = validateAdminPasswordStrength(password);
  if (passwordValidationError) {
    throw new Error(passwordValidationError);
  }

  if (!role) {
    throw new Error('Invalid admin role');
  }

  const normalizedEmail = normalizeRequiredEmail(input.email);

  const duplicateByUsername = await prisma.adminUser.findFirst({
    where: { username },
    select: { id: true },
  });
  if (duplicateByUsername) {
    throw new Error('username already exists');
  }

  const duplicateByEmail = await prisma.adminUser.findFirst({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (duplicateByEmail) {
    throw new Error('email already exists');
  }

  const created = await prisma.adminUser.create({
    data: {
      username,
      displayName: displayName || toDisplayName(username),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role,
      isSeedAdmin: false,
      isApproved: true,
      approvedById: input.actorAdminId,
      approvedAt: new Date(),
      isActive: true,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
      twoFactorEnabled: true,
      twoFactorEnforced: true,
      mustChangePassword: true,
      customPermissions: Prisma.DbNull,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
      isApproved: true,
      isActive: true,
      isBlocked: true,
      createdAt: true,
    },
  });

  return created;
};

export const changeAdminPassword = async (
  input: ChangeAdminPasswordInput
): Promise<ChangeAdminPasswordResult> => {
  const adminId = String(input.adminId || '').trim();
  const currentPassword = String(input.currentPassword || '');
  const newPassword = String(input.newPassword || '');
  const keepSessionId = input.keepSessionId ? String(input.keepSessionId).trim() : null;

  if (!adminId) {
    throw new Error('adminId is required');
  }

  if (!currentPassword) {
    throw new Error('Current password is required');
  }

  if (!newPassword) {
    throw new Error('New password is required');
  }

  if (currentPassword === newPassword) {
    throw new Error('New password must be different from current password');
  }

  const passwordValidationError = validateAdminPasswordStrength(newPassword);
  if (passwordValidationError) {
    throw new Error(passwordValidationError);
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      username: true,
      email: true,
      passwordHash: true,
      isActive: true,
      isBlocked: true,
    },
  });

  if (!admin) {
    throw new Error('Admin account not found');
  }

  if (!admin.isActive || admin.isBlocked) {
    throw new Error('Admin account is not active');
  }

  if (!comparePassword(currentPassword, admin.passwordHash)) {
    throw new Error('Current password is incorrect');
  }

  const changedAt = new Date();

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash: hashPassword(newPassword),
      mustChangePassword: false,
    },
  });

  const revokeWhere: Prisma.AdminSessionWhereInput = {
    adminUserId: admin.id,
    isRevoked: false,
  };
  if (keepSessionId) {
    revokeWhere.id = { not: keepSessionId };
  }

  const revokeResult = await prisma.adminSession.updateMany({
    where: revokeWhere,
    data: {
      isRevoked: true,
      revokedAt: changedAt,
      revokedReason: 'password_changed',
    },
  });

  return {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    mustChangePassword: false,
    changedAt,
    revokedSessionCount: revokeResult.count,
  };
};
