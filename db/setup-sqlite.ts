import Database from "better-sqlite3";
import { env } from "../api/lib/env";

const dbUrl = env.databaseUrl || "";
const dbPath = dbUrl.startsWith("file:") ? dbUrl.replace("file:", "") : "./moodtrack.db";

export function setupSQLite() {
  console.log("[Setup] Initializing SQLite database at:", dbPath);
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "unionId" TEXT UNIQUE,
      "googleId" TEXT UNIQUE,
      email TEXT UNIQUE,
      "passwordHash" TEXT,
      name TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      "createdAt" INTEGER NOT NULL DEFAULT (unixepoch()),
      "updatedAt" INTEGER NOT NULL DEFAULT (unixepoch()),
      "lastSignInAt" INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "spotifyId" TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT,
      image TEXT,
      "spotifyUrl" TEXT,
      description TEXT,
      "detectedMood" TEXT,
      date INTEGER NOT NULL DEFAULT (unixepoch()),
      "addedBy" INTEGER REFERENCES users(id),
      "likesCount" INTEGER DEFAULT 0,
      "commentsCount" INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "followerId" INTEGER NOT NULL REFERENCES users(id),
      "followingId" INTEGER NOT NULL REFERENCES users(id),
      "createdAt" INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "songId" INTEGER NOT NULL REFERENCES songs(id),
      "userId" INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL DEFAULT 'like',
      "createdAt" INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "songId" INTEGER NOT NULL REFERENCES songs(id),
      "userId" INTEGER NOT NULL REFERENCES users(id),
      "createdAt" INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "songId" INTEGER NOT NULL REFERENCES songs(id),
      "userId" INTEGER NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      "createdAt" INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS "commentReplies" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "commentId" INTEGER NOT NULL REFERENCES comments(id),
      "userId" INTEGER NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      "createdAt" INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS "moodSelections" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "userId" INTEGER NOT NULL REFERENCES users(id),
      "songId" INTEGER NOT NULL REFERENCES songs(id),
      mood TEXT NOT NULL,
      "createdAt" INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS "userActivity" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "userId" INTEGER NOT NULL REFERENCES users(id),
      "songId" INTEGER REFERENCES songs(id),
      action TEXT NOT NULL,
      metadata TEXT,
      "createdAt" INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  db.close();
  console.log("[Setup] SQLite tables created successfully!");
}
