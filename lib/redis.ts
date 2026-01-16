import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      console.warn("Upstash Redis not configured. Caching disabled.");
      return null;
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}

export async function getCachedValue<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    const value = await client.get(key);
    return value as T | null;
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
    await client.setex(key, expirationSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Redis set error:", error);
    return false;
  }
}
