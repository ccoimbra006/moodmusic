import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../lib/env";
import * as schema from "@db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let poolInstance: any;

function getDbUrl(): string {
  return env.databaseUrl || process.env.DATABASE_URL || "";
}

function logDbUrlConfig(dbUrl: string) {
  try {
    // Safe logging - hide password
    const url = new URL(dbUrl);
    console.log("[DB] Host:", url.hostname);
    console.log("[DB] Port:", url.port);
    console.log("[DB] Database:", url.pathname);
    console.log("[DB] User:", url.username ? "SET" : "NOT SET");
    console.log("[DB] Password:", url.password ? "SET (" + url.password.length + " chars)" : "NOT SET");
    console.log("[DB] SSL enabled:", dbUrl.includes("railway.app") || dbUrl.includes("rlwy.net") ? "YES" : "NO");
  } catch (e) {
    console.error("[DB] Invalid DATABASE_URL format!");
  }
}

function createPool() {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  console.log("[DB] Creating PostgreSQL pool...");
  logDbUrlConfig(dbUrl);

  const useSsl = dbUrl.includes("railway.app") || dbUrl.includes("rlwy.net") || dbUrl.includes("amazonaws.com");

  const config: any = {
    connectionString: dbUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  if (useSsl) {
    config.ssl = { rejectUnauthorized: false };
    console.log("[DB] SSL configured for cloud provider");
  }

  const pool = new Pool(config);

  pool.on("error", (err) => {
    console.error("[DB] Pool error:", err.message);
  });

  pool.on("connect", () => {
    console.log("[DB] New client connected");
  });

  return pool;
}

export function getDb() {
  if (!instance) {
    const pool = createPool();
    poolInstance = pool;
    instance = drizzle(pool, { schema });
    console.log("[DB] Drizzle instance created");
  }
  return instance;
}

export function getPool() {
  if (!poolInstance) {
    poolInstance = createPool();
  }
  return poolInstance;
}

export async function testConnection(): Promise<boolean> {
  try {
    const dbUrl = getDbUrl();
    if (!dbUrl) {
      console.error("[DB Test] DATABASE_URL is empty!");
      return false;
    }

    console.log("[DB Test] Trying to connect...");
    const pool = getPool();
    const result = await pool.query("SELECT NOW() as now");
    console.log("[DB Test] OK! Server time:", result.rows[0].now);
    return true;
  } catch (err: any) {
    console.error("[DB Test] FAILED:", err.code || "", err.message);
    if (err.code === "ECONNREFUSED") {
      console.error("[DB Test] The PostgreSQL server refused the connection.");
      console.error("[DB Test] Check if DATABASE_URL is correct and the DB is running.");
    }
    if (err.code === "28P01") {
      console.error("[DB Test] Wrong password/username.");
    }
    if (err.code === "3D000") {
      console.error("[DB Test] Database does not exist.");
    }
    return false;
  }
}

export const isSQLite = false;
