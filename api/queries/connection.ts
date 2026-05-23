import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../lib/env";
import * as schema from "@db/schema";

const dbUrl = env.databaseUrl || "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: any;

export function getDb() {
  if (!instance) {
    if (!dbUrl) {
      throw new Error("DATABASE_URL is not set. Check your Railway environment variables.");
    }
    const pool = new Pool({ connectionString: dbUrl });
    instance = drizzle(pool, { schema });
  }
  return instance;
}

export const isSQLite = false;
