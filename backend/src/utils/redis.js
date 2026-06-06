import { createClient } from "redis";

const memoryCache = new Map();

let redisClient;
let redisPubClient;
let redisSubClient;

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
  if (redisClient?.isOpen) return redisClient;

  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: false,
    },
  });
  redisClient.on("error", (error) => {
    console.warn(`Redis cache error: ${error.message}`);
  });

  await redisClient.connect();
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
    redisPubClient = client.duplicate();
    redisSubClient = client.duplicate();
    redisPubClient.on("error", (error) => console.warn(`Redis pub error: ${error.message}`));
    redisSubClient.on("error", (error) => console.warn(`Redis sub error: ${error.message}`));
    await Promise.all([redisPubClient.connect(), redisSubClient.connect()]);
    return { client, pubClient: redisPubClient, subClient: redisSubClient };
  } catch (error) {
    console.warn(`Redis unavailable. Tracking cache is using in-memory fallback. ${error.message}`);
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
