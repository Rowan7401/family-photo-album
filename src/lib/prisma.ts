import { PrismaClient } from "@/generated/prisma/client";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

declare global {
  var prisma: PrismaClient | undefined;
  var __prismaAdapter: PrismaBetterSqlite3 | undefined;
  var __prismaDatabase: ReturnType<typeof Database> | undefined;
}

// Prisma 7 requires an adapter for SQLite
// We use lazy initialization to ensure DATABASE_URL is available when Prisma needs it

function getPrismaClient(): PrismaClient {
  // Reuse existing client if available (for hot reloading in dev)
  if (global.prisma) {
    return global.prisma;
  }

  // Ensure DATABASE_URL is set before Prisma tries to read it
  const defaultDatabaseUrl = "file:./dev.db";
  const databaseUrl = process.env.DATABASE_URL || defaultDatabaseUrl;
  
  // Set it in process.env so Prisma's adapter can read it
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
    console.warn("[prisma] DATABASE_URL not set, using default:", defaultDatabaseUrl);
    process.env.DATABASE_URL = defaultDatabaseUrl;
  }

  // Get the actual database path (remove "file:" prefix for better-sqlite3)
  const dbPath = databaseUrl.trim().replace(/^file:/, "").trim() || "./dev.db";
  
  console.log("[prisma] Initializing with DATABASE_URL:", process.env.DATABASE_URL);
  console.log("[prisma] Database path:", dbPath);

  // Create database connection
  const sqlite = global.__prismaDatabase ?? new Database(dbPath);
  if (!global.__prismaDatabase) {
    global.__prismaDatabase = sqlite;
  }

  // Create adapter
  // @ts-expect-error - PrismaBetterSqlite3 accepts Database instance, types may be slightly mismatched
  const adapter = global.__prismaAdapter ?? new PrismaBetterSqlite3(sqlite);
  if (!global.__prismaAdapter) {
    global.__prismaAdapter = adapter;
  }

  // Create Prisma client
  const client = new PrismaClient({
    adapter,
  });

  // Store in global for dev hot reloading
  if (process.env.NODE_ENV !== "production") {
    global.prisma = client;
  }

  return client;
}

// Export a getter function that initializes on first access
export const prisma = getPrismaClient();

