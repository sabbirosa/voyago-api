/* eslint-disable no-console */
import http from "http";
import app from "./app";
import { config } from "./app/config/env";
import { prisma } from "./app/config/prisma";

let server: http.Server;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("Connected to database");

    server = http.createServer(app);

    const PORT = config.port;

    server.listen(PORT, () => {
      console.log(`Voyago API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

(async () => {
  await startServer();
})();

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received... Server shutting down...");

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log("Database connection closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received... Server shutting down...");

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log("Database connection closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on("unhandledRejection", async (err) => {
  console.error("Unhandled Rejection detected... Server shutting down...", err);

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(1);
    });
  } else {
    await prisma.$disconnect();
    process.exit(1);
  }
});

process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception detected... Server shutting down...", err);

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(1);
    });
  } else {
    await prisma.$disconnect();
    process.exit(1);
  }
});
