import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    const redisUrl =
      process.env.NODE_ENV === "production"
        ? process.env.REDIS_URL
        : process.env.PUBLIC_REDIS_URL;

    if (!redisUrl) {
      console.warn("Redis not configured. Caching disabled.");
      return null;
    }

    redis = new Redis(redisUrl);
  }

  return redis;
}

export async function getCachedValue<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    if (!client) return null;

    const value = await client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setCachedValue<T>(
  key: string,
  value: T,
  expirationSeconds = 3600,
): Promise<boolean> {
  try {
    const client = getRedis();
    if (!client) return false;

    await client.set(key, JSON.stringify(value), "EX", expirationSeconds);
    return true;
  } catch (error) {
    console.error("Redis set error:", error);
    return false;
  }
}
