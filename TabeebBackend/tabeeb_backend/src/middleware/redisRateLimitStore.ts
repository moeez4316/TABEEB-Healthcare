import type { Store, Options } from 'express-rate-limit';
import { getRedisClient, REDIS_KEY_PREFIX } from '../lib/redis';

export const createRedisRateLimitStore = (scope: string): Store | undefined => {
  const client = getRedisClient();
  if (!client) return undefined;

  let windowMs = 60 * 1000;
  const safeScope = String(scope || 'default').replace(/[^a-z0-9:_-]/gi, '');
  const prefix = `${REDIS_KEY_PREFIX}:rl:${safeScope}:`;

  const store: Store = {
    localKeys: false,
    prefix,
    init: (options: Options) => {
      windowMs = options.windowMs ?? windowMs;
    },
    increment: async (key: string) => {
      const redisKey = `${prefix}${key}`;
      const totalHits = await client.incr(redisKey);
      if (totalHits === 1) {
        await client.pExpire(redisKey, windowMs);
      }
      let ttl = await client.pTTL(redisKey);
      if (ttl < 0) {
        await client.pExpire(redisKey, windowMs);
        ttl = windowMs;
      }
      return {
        totalHits,
        resetTime: new Date(Date.now() + ttl),
      };
    },
    decrement: async (key: string) => {
      const redisKey = `${prefix}${key}`;
      await client.decr(redisKey);
    },
    resetKey: async (key: string) => {
      const redisKey = `${prefix}${key}`;
      await client.del(redisKey);
    },
  };

  return store;
};
