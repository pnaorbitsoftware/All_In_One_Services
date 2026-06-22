import dns from "node:dns";
import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/";
const mongoDbName = process.env.MONGO_DB_NAME || "all_in_one_services";
const mongoDirectHosts = (process.env.MONGO_DIRECT_HOSTS || "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);
const mongoDnsServers = (process.env.MONGO_DNS_SERVERS || "")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

const buildDirectMongoUri = () => {
  const parsed = new URL(mongoUri);
  const auth = parsed.username
    ? `${encodeURIComponent(decodeURIComponent(parsed.username))}:${encodeURIComponent(decodeURIComponent(parsed.password))}@`
    : "";
  const searchParams = new URLSearchParams(parsed.search);

  searchParams.set("tls", "true");
  searchParams.set("authSource", searchParams.get("authSource") || "admin");

  if (process.env.MONGO_REPLICA_SET) {
    searchParams.set("replicaSet", process.env.MONGO_REPLICA_SET);
  }

  return `mongodb://${auth}${mongoDirectHosts.join(",")}/${parsed.pathname.replace(/^\//, "")}?${searchParams.toString()}`;
};

const buildEffectiveMongoUri = () => {
  if (!mongoUri.startsWith("mongodb+srv://") || !mongoDirectHosts.length) {
    return mongoUri;
  }

  return buildDirectMongoUri();
};

const effectiveMongoUri = buildEffectiveMongoUri();

if (effectiveMongoUri.startsWith("mongodb+srv://") && mongoDnsServers.length) {
  dns.setServers(mongoDnsServers);
}

const mongoOptions = {
  dbName: mongoDbName,
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 2),
  maxIdleTimeMS: Number(process.env.MONGO_MAX_IDLE_TIME_MS || 30000),
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000),
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
  waitQueueTimeoutMS: Number(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS || 5000),
  heartbeatFrequencyMS: Number(process.env.MONGO_HEARTBEAT_FREQUENCY_MS || 10000),
  retryWrites: true,
  autoIndex: process.env.NODE_ENV !== "production",
};

let connectionPromise;

export const getSafeMongoUri = () => {
  try {
    const parsed = new URL(effectiveMongoUri);
    if (parsed.username || parsed.password) {
      parsed.username = "***";
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return effectiveMongoUri.replace(/\/\/([^:@/]+):([^@/]+)@/, "//***:***@");
  }
};

export const getDatabaseStatus = () => ({
  databaseName: mongoDbName,
  readyState: mongoose.connection.readyState,
  connected: mongoose.connection.readyState === 1,
});

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(effectiveMongoUri, mongoOptions).catch(async (error) => {
      const canRetryDirect =
        mongoUri.startsWith("mongodb+srv://") &&
        mongoDirectHosts.length &&
        effectiveMongoUri === mongoUri &&
        ["ECONNREFUSED", "ETIMEOUT", "ENOTFOUND", "ESERVFAIL"].includes(error.code);

      if (canRetryDirect) {
        console.warn(`MongoDB SRV lookup failed (${error.code}). Retrying with MONGO_DIRECT_HOSTS.`);
        return mongoose.connect(buildDirectMongoUri(), mongoOptions);
      }

      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
  return mongoose.connection;
};

export { effectiveMongoUri, mongoDbName, mongoUri };
