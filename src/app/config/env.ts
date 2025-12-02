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
}

export const config: AppConfig = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/voyago",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "voyago-access-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "voyago-refresh-secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
};


