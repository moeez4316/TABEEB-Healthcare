import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

export const REDIS_KEY_PREFIX = (process.env.REDIS_KEY_PREFIX || 'tabeeb').trim() || 'tabeeb';

let client: RedisClientType | null = null;
let warnedMissingUrl = false;

const hasAuthInUrl = (url: string) => /^redis(s)?:\/\/[^@]+@/.test(url);

export const getRedisClient = (): RedisClientType | null => {
  if (!REDIS_URL) {
    if (!warnedMissingUrl) {
      warnedMissingUrl = true;
      console.warn('Redis: REDIS_URL not set; Redis features disabled.');
    }
    return null;
  }

  if (client) return client;

  client = createClient({
    url: REDIS_URL,
    password: !hasAuthInUrl(REDIS_URL) ? REDIS_PASSWORD : undefined,
  });

  client.on('error', (err) => {
    console.error('Redis error:', err);
  });

  client.connect().catch((err) => {
    console.error('Redis: connection failed', err);
  });

  return client;
};
