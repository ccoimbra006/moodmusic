import { drizzle as drizzleMySQL } from "drizzle-orm/mysql2";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { env } from "../lib/env";
import * as schema from "@db/schema";

const dbUrl = env.databaseUrl || "";
export const isSQLite = dbUrl.startsWith("file:") || dbUrl.includes(".db") || !dbUrl.includes("mysql:");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: any;

export function getDb() {
  if (!instance) {
    if (isSQLite) {
      const dbPath = dbUrl.startsWith("file:") ? dbUrl.replace("file:", "") : "./moodtrack.db";
      const sqlite = new Database(dbPath);
      sqlite.pragma("journal_mode = WAL");
      instance = drizzleSQLite(sqlite, { schema });
    } else {
      if (!env.databaseUrl) {
        throw new Error("DATABASE_URL is not set. Check your .env file.");
      }
      instance = drizzleMySQL(env.databaseUrl, {
        mode: "planetscale",
        schema,
      });
    }
  }
  return instance;
}
