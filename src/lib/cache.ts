import Redis from "ioredis";

// Create Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");


// Log connection status
redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

// ---- CACHE HELPERS ----

// Save a value with TTL
export async function cacheSet(key: string, value: any, ttlSeconds = 30) {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

// Read a cached value
export async function cacheGet(key: string) {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}

export default redis;
