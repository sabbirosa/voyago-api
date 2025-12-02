import Redis from "ioredis";
import { config } from "./env";

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on("connect", () => {
  console.log("[Redis] Connected to Redis server");
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err);
});

export default redis;
