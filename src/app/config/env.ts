import "dotenv/config";

interface AppConfig {
  env: string;
  port: number;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
  };
  frontendUrl: string;
  otp: {
    expiresIn: number; // in seconds
    length: number;
  };
  r2: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
  nodeEnv: "development" | "production";
}

const loadEnvVariables = (): AppConfig => {
  const nodeEnv = (process.env.NODE_ENV as "development" | "production") || "development";
  
  // Required environment variables for production
  const requiredEnvVariables: string[] = [
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
  ];

  // In production, validate all required variables
  if (nodeEnv === "production") {
    requiredEnvVariables.forEach((key) => {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    });
  }

  return {
    env: nodeEnv,
    port: Number(process.env.PORT) || 5000,
    databaseUrl:
      process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/voyago",
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET || "voyago-access-secret",
      refreshSecret: process.env.JWT_REFRESH_SECRET || "voyago-refresh-secret",
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY || "",
      fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    },
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    otp: {
      expiresIn: Number(process.env.OTP_EXPIRES_IN) || 600, // 10 minutes default
      length: 6,
    },
    r2: {
      endpoint: process.env.R2_ENDPOINT || "",
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      bucketName: process.env.R2_BUCKET_NAME || "",
      publicUrl: process.env.R2_PUBLIC_URL || "",
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || "",
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    },
    nodeEnv,
  };
};

export const config = loadEnvVariables();
