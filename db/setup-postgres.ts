import { Pool } from "pg";

function getPool() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  return new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("railway.app") ? { rejectUnauthorized: false } : undefined,
  });
}

export async function setupPostgres() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[Setup] DATABASE_URL not set!");
    return false;
  }

  console.log("[Setup] Connecting to PostgreSQL...");
  const pool = getPool();

  try {
    // Test connection
    const result = await pool.query("SELECT NOW()");
    console.log("[Setup] PostgreSQL connection OK, server time:", result.rows[0].now);

    // Create tables
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          "unionId" VARCHAR(255) UNIQUE,
          "googleId" VARCHAR(255) UNIQUE,
          email VARCHAR(320) UNIQUE,
          "passwordHash" VARCHAR(255),
          name VARCHAR(255),
          avatar TEXT,
          role VARCHAR(20) DEFAULT 'user' NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          "lastSignInAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS songs (
          id SERIAL PRIMARY KEY,
          "spotifyId" VARCHAR(255) NOT NULL UNIQUE,
          title VARCHAR(255) NOT NULL,
          artist VARCHAR(255) NOT NULL,
          album VARCHAR(255),
          image TEXT,
          "spotifyUrl" TEXT,
          description TEXT,
          "detectedMood" VARCHAR(50),
          date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          "addedBy" INTEGER REFERENCES users(id),
          "likesCount" INTEGER DEFAULT 0,
          "commentsCount" INTEGER DEFAULT 0
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS likes (
          id SERIAL PRIMARY KEY,
          "songId" INTEGER NOT NULL REFERENCES songs(id),
          "userId" INTEGER NOT NULL REFERENCES users(id),
          type VARCHAR(20) DEFAULT 'like' NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS favorites (
          id SERIAL PRIMARY KEY,
          "songId" INTEGER NOT NULL REFERENCES songs(id),
          "userId" INTEGER NOT NULL REFERENCES users(id),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          "songId" INTEGER NOT NULL REFERENCES songs(id),
          "userId" INTEGER NOT NULL REFERENCES users(id),
          text TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "commentReplies" (
          id SERIAL PRIMARY KEY,
          "commentId" INTEGER NOT NULL REFERENCES comments(id),
          "userId" INTEGER NOT NULL REFERENCES users(id),
          text TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "moodSelections" (
          id SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL REFERENCES users(id),
          "songId" INTEGER NOT NULL REFERENCES songs(id),
          mood VARCHAR(50) NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS follows (
          id SERIAL PRIMARY KEY,
          "followerId" INTEGER NOT NULL REFERENCES users(id),
          "followingId" INTEGER NOT NULL REFERENCES users(id),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "userActivity" (
          id SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL REFERENCES users(id),
          "songId" INTEGER REFERENCES songs(id),
          action VARCHAR(30) NOT NULL,
          metadata TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      console.log("[Setup] All PostgreSQL tables created successfully!");
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[Setup] PostgreSQL setup failed:", err.message);
    return false;
  } finally {
    await pool.end();
  }
}
