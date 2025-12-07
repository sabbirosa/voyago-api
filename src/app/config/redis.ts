import Redis from "ioredis";
import { config } from "./env";

// Create Redis connection with error handling for serverless environments
export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  // Enable offline queue for serverless (don't fail if Redis is unavailable)
  enableOfflineQueue: true,
  lazyConnect: true,
});

redis.on("connect", () => {
  console.log("[Redis] Connected to Redis server");
});

redis.on("error", (err) => {
  // Log error but don't crash the application
  // In serverless, Redis might not be available immediately
  console.error("[Redis] Connection error:", err.message);
});

// Attempt to connect, but don't block if it fails (for serverless)
if (process.env.VERCEL !== "1") {
  // Only auto-connect in non-serverless environments
  redis.connect().catch((err) => {
    console.warn(
      "[Redis] Initial connection failed, will retry on first use:",
      err.message
    );
  });
}

export default redis;
