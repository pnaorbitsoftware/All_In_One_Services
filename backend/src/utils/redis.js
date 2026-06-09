import { createClient } from "redis";

const memoryCache = new Map();

let redisClient;
let redisPubClient;
let redisSubClient;
let redisDisabledUntil = 0;
let redisWarningLogged = false;

const REDIS_RETRY_COOLDOWN_MS = Number(process.env.REDIS_RETRY_COOLDOWN_MS || 60_000);

const describeRedisError = (error) =>
  error?.message || error?.code || error?.name || "connection failed";

const markRedisUnavailable = (error) => {
  redisDisabledUntil = Date.now() + REDIS_RETRY_COOLDOWN_MS;
  if (!redisWarningLogged) {
    console.warn(`Redis unavailable. Using in-memory cache fallback. ${describeRedisError(error)}`);
    redisWarningLogged = true;
  }
};

const setMemoryJson = (key, value, ttlSeconds) => {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

const getMemoryJson = (key) => {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (item.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return item.value;
};

const connectClient = async () => {
  const redisUrl = process.env.REDIS_URL || "";
  if (!redisUrl) return null;
  if (Date.now() < redisDisabledUntil) return null;
  if (redisClient?.isOpen) return redisClient;

  if (redisClient) {
    redisClient.removeAllListeners();
    redisClient = undefined;
  }

  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: false,
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 1500),
    },
  });
  redisClient.on("error", markRedisUnavailable);

  try {
    await redisClient.connect();
    redisWarningLogged = false;
  } catch (error) {
    markRedisUnavailable(error);
    return null;
  }
  return redisClient;
};

export const initializeRedis = async () => {
  const redisUrl = process.env.REDIS_URL || "";
  if (!redisUrl) {
    console.warn("REDIS_URL is not configured. Tracking cache is using in-memory fallback.");
    return null;
  }

  try {
    const client = await connectClient();
    if (!client) return null;
    redisPubClient = client.duplicate();
    redisSubClient = client.duplicate();
    redisPubClient.on("error", markRedisUnavailable);
    redisSubClient.on("error", markRedisUnavailable);
    await Promise.all([redisPubClient.connect(), redisSubClient.connect()]);
    return { client, pubClient: redisPubClient, subClient: redisSubClient };
  } catch (error) {
    markRedisUnavailable(error);
    return null;
  }
};

export const setJsonWithTtl = async (key, value, ttlSeconds = 30) => {
  try {
    const client = await connectClient();
    if (!client) {
      setMemoryJson(key, value, ttlSeconds);
      return;
    }

    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    setMemoryJson(key, value, ttlSeconds);
  }
};

export const getJson = async (key) => {
  try {
    const client = await connectClient();
    if (!client) return getMemoryJson(key);

    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return getMemoryJson(key);
  }
};
