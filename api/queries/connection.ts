import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../lib/env";
import * as schema from "@db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: any;

export function getDb() {
  if (!instance) {
    const dbUrl = env.databaseUrl;
    console.log("[DB] Initializing connection, DATABASE_URL:", dbUrl ? "SET (length=" + dbUrl.length + ")" : "EMPTY");

    if (!dbUrl) {
      throw new Error("DATABASE_URL is not set. Add it in Railway Variables.");
    }

    try {
      const pool = new Pool({
        connectionString: dbUrl,
        // Railway PostgreSQL needs SSL in production
        ssl: dbUrl.includes("railway.app") ? { rejectUnauthorized: false } : undefined,
      });

      instance = drizzle(pool, { schema });
      console.log("[DB] PostgreSQL pool created successfully");
    } catch (err) {
      console.error("[DB] Failed to create pool:", err);
      throw err;
    }
  }
  return instance;
}

export async function testConnection() {
  const dbUrl = env.databaseUrl;
  if (!dbUrl) {
    console.error("[DB Test] DATABASE_URL is not set!");
    return false;
  }

  try {
    const testPool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes("railway.app") ? { rejectUnauthorized: false } : undefined,
    });
    const result = await testPool.query("SELECT NOW()");
    console.log("[DB Test] PostgreSQL connected, server time:", result.rows[0].now);
    await testPool.end();
    return true;
  } catch (err: any) {
    console.error("[DB Test] Connection failed:", err.message);
    return false;
  }
}

export const isSQLite = false;
