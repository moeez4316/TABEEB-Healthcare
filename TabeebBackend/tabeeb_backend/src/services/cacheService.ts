import { getRedisClient, REDIS_KEY_PREFIX } from '../lib/redis';

export const CACHE_TTL_SECONDS = {
  doctorProfile: 60,
  patientProfile: 60,
  verifiedDoctorList: 300,
  publicDoctorProfile: 300,
  publicAvailabilitySummary: 60,
  adminDashboardStats: 30,
  adminUsersList: 30,
  adminDoctorsList: 60,
  adminDirectory: 300,
} as const;

type CacheKeyPart = string | number | boolean;

export const buildCacheKey = (...parts: CacheKeyPart[]): string =>
  [REDIS_KEY_PREFIX, ...parts.map((part) => String(part))].join(':');

export const buildQuerySignature = (query: Record<string, unknown>): string => {
  const entries: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        entries.push([key, String(item)]);
      }
    } else {
      entries.push([key, String(value)]);
    }
  }

  if (entries.length === 0) return 'all';

  entries.sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1]);
    return a[0].localeCompare(b[0]);
  });

  return entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('Cache get failed:', error);
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds: number): Promise<boolean> => {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return true;
  } catch (error) {
    console.warn('Cache set failed:', error);
    return false;
  }
};

export const cacheDel = async (...keys: string[]): Promise<number> => {
  const client = getRedisClient();
  if (!client || keys.length === 0) return 0;

  try {
    return await client.del(keys);
  } catch (error) {
    console.warn('Cache delete failed:', error);
    return 0;
  }
};

export const cacheDelByPrefix = async (prefix: string): Promise<number> => {
  const client = getRedisClient();
  if (!client) return 0;

  const pattern = prefix.endsWith('*') ? prefix : `${prefix}*`;
  const batch: string[] = [];
  let deleted = 0;

  try {
    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 200 })) {
      batch.push(key);
      if (batch.length >= 200) {
        deleted += await client.del(batch);
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      deleted += await client.del(batch);
    }

    return deleted;
  } catch (error) {
    console.warn('Cache prefix delete failed:', error);
    return deleted;
  }
};

export const invalidateDoctorCaches = async (doctorUid: string): Promise<void> => {
  await cacheDel(
    buildCacheKey('doctor', 'profile', doctorUid),
    buildCacheKey('doctor', 'public', 'profile', doctorUid),
    buildCacheKey('doctor', 'public', 'availability', doctorUid),
    buildCacheKey('admin', 'dashboard', 'stats')
  );

  await cacheDelByPrefix(buildCacheKey('doctor', 'verified', 'list'));
  await cacheDelByPrefix(buildCacheKey('admin', 'doctors', 'list'));
  await cacheDelByPrefix(buildCacheKey('admin', 'users', 'list'));
};

export const invalidateDoctorAvailabilityCache = async (doctorUid: string): Promise<void> => {
  await cacheDel(buildCacheKey('doctor', 'public', 'availability', doctorUid));
};

export const invalidatePatientCaches = async (patientUid: string): Promise<void> => {
  await cacheDel(
    buildCacheKey('patient', 'profile', patientUid),
    buildCacheKey('admin', 'dashboard', 'stats')
  );

  await cacheDelByPrefix(buildCacheKey('admin', 'users', 'list'));
};

export const invalidateAdminCaches = async (): Promise<void> => {
  await cacheDel(buildCacheKey('admin', 'dashboard', 'stats'));
  await cacheDelByPrefix(buildCacheKey('admin', 'admins', 'list'));
  await cacheDelByPrefix(buildCacheKey('admin', 'users', 'list'));
  await cacheDelByPrefix(buildCacheKey('admin', 'doctors', 'list'));
};
