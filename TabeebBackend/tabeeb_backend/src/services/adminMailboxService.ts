import { AdminRole, ContactMessageType, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { EMAIL_CONFIG } from '../config/resend';

type AliasOwner =
  | { type: 'username'; value: string }
  | { type: 'role'; value: AdminRole };

type AdminIdentity = {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  permissions?: string[];
};

type ContactMessageLike = {
  type: ContactMessageType;
  metadata?: unknown;
};

interface ParsedRoutingMetadata {
  recipientEmails: string[];
  recipientLocalParts: string[];
  routedAdminIds: string[];
  routedAdminUsernames: string[];
  routedAliases: string[];
}

interface InboundRoutingResult extends ParsedRoutingMetadata {
  messageType: ContactMessageType;
  primaryRecipientEmail: string | null;
  primaryRecipientLocalPart: string | null;
}

const DEFAULT_ALIAS_OWNERS: Record<string, string> = {
  support: 'role:SUPPORT_TEAM',
  contact: 'role:SUPPORT_TEAM',
  feedback: 'role:CONTENT_TEAM',
  'no-reply': 'role:SUPER_ADMIN',
  marketing: 'role:CONTENT_TEAM',
};

const KNOWN_ALIAS_CANONICAL: Record<string, string> = {
  suppor: 'support',
  noreply: 'no-reply',
  no_reply: 'no-reply',
  markting: 'marketing',
};

const toObjectRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

export const getMailboxDomain = (): string => {
  const configured = EMAIL_CONFIG.domain.trim().toLowerCase();
  return configured || 'tabeebemail.me';
};

export const normalizeMailboxAlias = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';
  return KNOWN_ALIAS_CANONICAL[normalized] || normalized;
};

export const extractEmailFromMailboxHeader = (raw: string): string => {
  const match = raw.match(/<([^>]+)>/);
  return normalizeEmailAddress(match ? match[1] : raw);
};

export const normalizeEmailAddress = (value: string): string => value.trim().toLowerCase();

export const extractLocalPart = (email: string): string => {
  const normalized = normalizeEmailAddress(email);
  const atIndex = normalized.indexOf('@');
  if (atIndex <= 0) return normalizeMailboxAlias(normalized);
  return normalizeMailboxAlias(normalized.slice(0, atIndex));
};

export const buildInternalMailboxAddress = (localPart: string): string =>
  `${normalizeMailboxAlias(localPart)}@${getMailboxDomain()}`;

export const normalizeAdminOfficialEmail = (email: string | undefined, username: string): string => {
  const fallback = buildInternalMailboxAddress(username);
  if (!email || typeof email !== 'string') return fallback;

  const normalized = normalizeEmailAddress(email);
  if (!normalized) return fallback;

  if (!normalized.includes('@')) {
    return buildInternalMailboxAddress(normalized);
  }

  const [, domain = ''] = normalized.split('@');
  if (domain === getMailboxDomain()) {
    return normalized;
  }

  const localPart = extractLocalPart(normalized);
  return buildInternalMailboxAddress(localPart || username);
};

const parseAdminRole = (value: string): AdminRole | null => {
  const normalized = value.toUpperCase().replace(/[\s-]+/g, '_');
  switch (normalized) {
    case 'SUPER_ADMIN':
      return 'SUPER_ADMIN';
    case 'VERIFICATION_TEAM':
      return 'VERIFICATION_TEAM';
    case 'SUPPORT_TEAM':
      return 'SUPPORT_TEAM';
    case 'OPERATIONS_TEAM':
      return 'OPERATIONS_TEAM';
    case 'CONTENT_TEAM':
      return 'CONTENT_TEAM';
    default:
      return null;
  }
};

const parseAliasOwner = (value: unknown): AliasOwner | null => {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (lower.startsWith('role:')) {
    const parsedRole = parseAdminRole(raw.slice(5));
    return parsedRole ? { type: 'role', value: parsedRole } : null;
  }

  const directRole = parseAdminRole(raw);
  if (directRole) return { type: 'role', value: directRole };

  return { type: 'username', value: raw.toLowerCase() };
};

const getAliasOwnerMap = (): Map<string, AliasOwner> => {
  const map = new Map<string, AliasOwner>();

  for (const [alias, owner] of Object.entries(DEFAULT_ALIAS_OWNERS)) {
    const parsed = parseAliasOwner(owner);
    if (!parsed) continue;
    map.set(normalizeMailboxAlias(alias), parsed);
  }

  const custom = process.env.ADMIN_MAILBOX_OWNERS;
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [alias, owner] of Object.entries(parsed as Record<string, unknown>)) {
          const parsedOwner = parseAliasOwner(owner);
          if (!parsedOwner) continue;
          map.set(normalizeMailboxAlias(alias), parsedOwner);
        }
      }
    } catch (error) {
      console.error('Failed to parse ADMIN_MAILBOX_OWNERS:', error);
    }
  }

  return map;
};

export const getConfiguredSystemMailboxAddresses = (): string[] => {
  const aliasOwners = getAliasOwnerMap();
  return Array.from(
    new Set(Array.from(aliasOwners.keys()).filter(Boolean).map((alias) => buildInternalMailboxAddress(alias)))
  );
};

export const resolveOwnedMailboxAliases = (admin: Pick<AdminIdentity, 'username' | 'role'>): string[] => {
  const aliasOwners = getAliasOwnerMap();
  const username = admin.username.trim().toLowerCase();
  const aliases: string[] = [];

  for (const [alias, owner] of aliasOwners.entries()) {
    if (owner.type === 'username' && owner.value === username) {
      aliases.push(alias);
      continue;
    }
    if (owner.type === 'role' && owner.value === admin.role) {
      aliases.push(alias);
    }
  }

  return Array.from(new Set(aliases));
};

export const resolveMailboxAddressesForAdmin = (
  admin: Pick<AdminIdentity, 'username' | 'email' | 'role'>
): string[] => {
  const addresses = [normalizeAdminOfficialEmail(admin.email, admin.username)];
  for (const alias of resolveOwnedMailboxAliases(admin)) {
    addresses.push(buildInternalMailboxAddress(alias));
  }
  return Array.from(new Set(addresses.map((address) => normalizeEmailAddress(address))));
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const output: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const normalized = entry.trim();
    if (!normalized) continue;
    output.push(normalized);
  }
  return output;
};

export const parseContactMessageRoutingMetadata = (metadata: unknown): ParsedRoutingMetadata => {
  const record = toObjectRecord(metadata);
  if (!record) {
    return {
      recipientEmails: [],
      recipientLocalParts: [],
      routedAdminIds: [],
      routedAdminUsernames: [],
      routedAliases: [],
    };
  }

  const recipientEmails = normalizeStringArray(record.recipientEmails).map((entry) =>
    normalizeEmailAddress(entry)
  );
  const recipientLocalParts = normalizeStringArray(record.recipientLocalParts).map((entry) =>
    normalizeMailboxAlias(entry)
  );
  const routedAdminIds = normalizeStringArray(record.routedAdminIds);
  const routedAdminUsernames = normalizeStringArray(record.routedAdminUsernames).map((entry) =>
    entry.toLowerCase()
  );
  const routedAliases = normalizeStringArray(record.routedAliases).map((entry) =>
    normalizeMailboxAlias(entry)
  );

  const primaryRecipientEmail = typeof record.primaryRecipientEmail === 'string'
    ? normalizeEmailAddress(record.primaryRecipientEmail)
    : null;
  const primaryRecipientLocalPart = typeof record.primaryRecipientLocalPart === 'string'
    ? normalizeMailboxAlias(record.primaryRecipientLocalPart)
    : null;

  if (primaryRecipientEmail) recipientEmails.push(primaryRecipientEmail);
  if (primaryRecipientLocalPart) recipientLocalParts.push(primaryRecipientLocalPart);

  return {
    recipientEmails: Array.from(new Set(recipientEmails.filter(Boolean))),
    recipientLocalParts: Array.from(new Set(recipientLocalParts.filter(Boolean))),
    routedAdminIds: Array.from(new Set(routedAdminIds.filter(Boolean))),
    routedAdminUsernames: Array.from(new Set(routedAdminUsernames.filter(Boolean))),
    routedAliases: Array.from(new Set(routedAliases.filter(Boolean))),
  };
};

const fallbackLocalPartsByType: Record<ContactMessageType, string[]> = {
  SUPPORT: ['support'],
  CONTACT: ['contact'],
  FEEDBACK: ['feedback'],
  INBOUND: [],
};

export const canAdminAccessMailboxMessage = (
  admin: Pick<AdminIdentity, 'id' | 'username' | 'email' | 'role' | 'permissions'>,
  message: ContactMessageLike
): boolean => {
  const permissions = admin.permissions || [];
  const supervisor = permissions.includes('mailbox.manage') || admin.role === 'SUPER_ADMIN';
  if (supervisor) return true;

  const routing = parseContactMessageRoutingMetadata(message.metadata);
  const ownedAddresses = resolveMailboxAddressesForAdmin(admin);
  const ownedLocalParts = new Set(ownedAddresses.map((address) => extractLocalPart(address)));
  for (const alias of resolveOwnedMailboxAliases(admin)) {
    ownedLocalParts.add(alias);
  }

  for (const localPart of routing.recipientLocalParts) {
    if (ownedLocalParts.has(localPart)) return true;
  }

  for (const recipientEmail of routing.recipientEmails) {
    if (ownedAddresses.includes(recipientEmail)) return true;
  }

  if (routing.routedAdminIds.includes(admin.id)) return true;
  if (routing.routedAdminUsernames.includes(admin.username.toLowerCase())) return true;

  for (const localPart of fallbackLocalPartsByType[message.type] || []) {
    if (ownedLocalParts.has(localPart)) return true;
  }

  return false;
};

const resolveOwnersForAlias = (
  alias: string,
  admins: Array<{ id: string; username: string; role: AdminRole }>
): Array<{ id: string; username: string }> => {
  const owner = getAliasOwnerMap().get(alias);
  if (!owner) return [];

  const fallbackSuperAdmins = (): Array<{ id: string; username: string }> =>
    admins
      .filter((entry) => entry.role === 'SUPER_ADMIN')
      .map((entry) => ({ id: entry.id, username: entry.username }));

  if (owner.type === 'username') {
    const matched = admins.find((entry) => entry.username.toLowerCase() === owner.value);
    return matched ? [{ id: matched.id, username: matched.username }] : fallbackSuperAdmins();
  }

  const roleMatches = admins
    .filter((entry) => entry.role === owner.value)
    .map((entry) => ({ id: entry.id, username: entry.username }));
  return roleMatches.length > 0 ? roleMatches : fallbackSuperAdmins();
};

export const resolveInboundMailboxRouting = async (recipients: string[]): Promise<InboundRoutingResult> => {
  const recipientEmails = Array.from(
    new Set(
      recipients
        .map((entry) => extractEmailFromMailboxHeader(entry))
        .filter(Boolean)
        .map((entry) => normalizeEmailAddress(entry))
    )
  );
  const recipientLocalParts = Array.from(
    new Set(recipientEmails.map((entry) => extractLocalPart(entry)).filter(Boolean))
  );

  const activeAdmins = await prisma.adminUser.findMany({
    where: {
      isActive: true,
      isBlocked: false,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  const routedAdminIds = new Set<string>();
  const routedAdminUsernames = new Set<string>();
  const routedAliases = new Set<string>();

  const adminLocalPartMap = new Map<string, Array<{ id: string; username: string }>>();
  for (const admin of activeAdmins) {
    const localPart = extractLocalPart(admin.email);
    if (!localPart) continue;
    const bucket = adminLocalPartMap.get(localPart) || [];
    bucket.push({ id: admin.id, username: admin.username });
    adminLocalPartMap.set(localPart, bucket);
  }

  for (const localPart of recipientLocalParts) {
    const directMatches = adminLocalPartMap.get(localPart) || [];
    for (const match of directMatches) {
      routedAdminIds.add(match.id);
      routedAdminUsernames.add(match.username.toLowerCase());
    }

    const aliasOwners = resolveOwnersForAlias(localPart, activeAdmins);
    if (aliasOwners.length > 0) {
      routedAliases.add(localPart);
      for (const owner of aliasOwners) {
        routedAdminIds.add(owner.id);
        routedAdminUsernames.add(owner.username.toLowerCase());
      }
    }
  }

  const primaryRecipientEmail = recipientEmails[0] || null;
  const primaryRecipientLocalPart = primaryRecipientEmail ? extractLocalPart(primaryRecipientEmail) : null;

  const messageType: ContactMessageType = recipientLocalParts.includes('support')
    ? 'SUPPORT'
    : recipientLocalParts.includes('feedback')
    ? 'FEEDBACK'
    : recipientLocalParts.includes('contact')
    ? 'CONTACT'
    : 'INBOUND';

  return {
    messageType,
    primaryRecipientEmail,
    primaryRecipientLocalPart,
    recipientEmails,
    recipientLocalParts,
    routedAdminIds: Array.from(routedAdminIds),
    routedAdminUsernames: Array.from(routedAdminUsernames),
    routedAliases: Array.from(routedAliases),
  };
};

export const buildInboundMailboxMetadata = (routing: InboundRoutingResult): Prisma.InputJsonValue => ({
  recipientEmails: routing.recipientEmails,
  recipientLocalParts: routing.recipientLocalParts,
  primaryRecipientEmail: routing.primaryRecipientEmail,
  primaryRecipientLocalPart: routing.primaryRecipientLocalPart,
  routedAdminIds: routing.routedAdminIds,
  routedAdminUsernames: routing.routedAdminUsernames,
  routedAliases: routing.routedAliases,
});

export const getPreferredReplyFromAddress = (
  admin: Pick<AdminIdentity, 'username' | 'email' | 'role'>,
  metadata: unknown
): string => {
  const ownedAddresses = resolveMailboxAddressesForAdmin(admin);
  const routing = parseContactMessageRoutingMetadata(metadata);

  for (const recipientEmail of routing.recipientEmails) {
    if (ownedAddresses.includes(recipientEmail)) return recipientEmail;
  }

  for (const alias of routing.recipientLocalParts) {
    const aliasAddress = buildInternalMailboxAddress(alias);
    if (ownedAddresses.includes(aliasAddress)) return aliasAddress;
  }

  return normalizeAdminOfficialEmail(admin.email, admin.username);
};
