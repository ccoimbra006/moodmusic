import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../lib/env";
import * as schema from "@db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let poolInstance: any;

function createPool() {
  const dbUrl = env.databaseUrl;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  console.log("[DB] Creating PostgreSQL pool...");

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("railway.app") || dbUrl.includes("rlwy.net")
      ? { rejectUnauthorized: false }
      : undefined,
    max: 10, // max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Log pool errors
  pool.on("error", (err) => {
    console.error("[DB] Pool error:", err.message);
  });

  pool.on("connect", () => {
    console.log("[DB] New client connected to pool");
  });

  return pool;
}

export function getDb() {
  if (!instance) {
    const pool = createPool();
    poolInstance = pool;
    instance = drizzle(pool, { schema });
    console.log("[DB] Drizzle instance created with PostgreSQL");
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
    const pool = getPool();
    const result = await pool.query("SELECT NOW() as now");
    console.log("[DB Test] PostgreSQL OK, server time:", result.rows[0].now);
    return true;
  } catch (err: any) {
    console.error("[DB Test] FAILED:", err.message);
    return false;
  }
}

export const isSQLite = false;
