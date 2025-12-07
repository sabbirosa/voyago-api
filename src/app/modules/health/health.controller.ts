import { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { redis } from "../../config/redis";
import { config } from "../../config/env";
import { catchAsync } from "../../utils/catchAsync";

const startTime = Date.now();

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  environment: string;
  version: string;
  services: {
    database: {
      status: "connected" | "disconnected" | "error";
      responseTime?: number;
      error?: string;
    };
    redis: {
      status: "connected" | "disconnected" | "error";
      responseTime?: number;
      error?: string;
    };
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
      unit: string;
    };
    nodeVersion: string;
    platform: string;
  };
}

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
};

const checkDatabase = async (): Promise<{
  status: "connected" | "disconnected" | "error";
  responseTime?: number;
  error?: string;
}> => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;

    return {
      status: "connected",
      responseTime,
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const checkRedis = async (): Promise<{
  status: "connected" | "disconnected" | "error";
  responseTime?: number;
  error?: string;
}> => {
  try {
    const start = Date.now();
    await redis.ping();
    const responseTime = Date.now() - start;

    return {
      status: "connected",
      responseTime,
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const getHealth = catchAsync(async (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();

  // Check all services in parallel
  const [databaseStatus, redisStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  // Determine overall health status
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (
    databaseStatus.status !== "connected" ||
    redisStatus.status !== "connected"
  ) {
    overallStatus = "unhealthy";
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds),
    },
    environment: config.nodeEnv,
    version: process.env.npm_package_version || "1.0.0",
    services: {
      database: databaseStatus,
      redis: redisStatus,
    },
    system: {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round(
          (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        ),
        unit: "MB",
      },
      nodeVersion: process.version,
      platform: process.platform,
    },
  };

  const statusCode =
    overallStatus === "healthy"
      ? httpStatus.OK
      : httpStatus.SERVICE_UNAVAILABLE;

  res.status(statusCode).json({
    success: overallStatus === "healthy",
    data: healthStatus,
  });
});

