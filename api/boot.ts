import "dotenv/config";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { isSQLite, getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { GOOGLE_COOKIE } from "./google-auth-router";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";

// Note: SQLite setup moved to start() function below to avoid top-level await

const JWT_SECRET = new TextEncoder().encode(env.appSecret || "moodtrack-google-secret-key");

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Debug route to verify env vars
app.get("/api/debug/env", (c) => {
  return c.json({
    appSecret: env.appSecret ? "set" : "EMPTY",
    databaseUrl: env.databaseUrl ? "set" : "EMPTY",
    googleClientId: env.googleClientId ? "set" : "EMPTY",
  });
});

// Clear cookies route
app.get("/api/debug/clear-cookies", (c) => {
  c.header("set-cookie", `${GOOGLE_COOKIE}=; Max-Age=0; Path=/; HttpOnly`);
  return c.json({ success: true, message: "Cookies cleared" });
});

// Simple GET logout route (more reliable than tRPC mutation for cookie clearing)
app.get("/api/logout", async (c) => {
  try {
    const opts = getSessionCookieOptions(c.req.raw.headers);
    c.header("set-cookie", cookie.serialize(Session.cookieName, "", {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: 0,
    }));
  } catch { /* ignore */ }
  c.header("set-cookie", `${GOOGLE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return c.redirect("/login", 302);
});

// Setup admin user via secret key (for Railway deployment)
app.post("/api/setup-admin", async (c) => {
  const { email, password, secret, name } = await c.req.json();

  // Validate secret key
  const setupSecret = process.env.ADMIN_SETUP_SECRET;
  if (!setupSecret || secret !== setupSecret) {
    return c.json({ error: "Invalid secret key" }, 403);
  }

  try {
    const db = getDb();
    const bcrypt = await import("bcryptjs");

    // Check if user already exists
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing.length > 0) {
      // Promote existing user to admin
      await db
        .update(schema.users)
        .set({ role: "admin" })
        .where(eq(schema.users.id, existing[0].id));
      return c.json({ success: true, message: "User promoted to admin", userId: existing[0].id });
    }

    // Create new admin user
    const passwordHash = await bcrypt.default.hash(password, 10);
    const result = await db.insert(schema.users).values({
      email,
      name: name || email.split("@")[0],
      passwordHash,
      role: "admin",
      lastSignInAt: new Date(),
    });
    const userId = Number(result[0].insertId);

    return c.json({ success: true, message: "Admin user created", userId });
  } catch (err) {
    console.error("[Setup Admin] Error:", err);
    return c.json({ error: "Failed to setup admin" }, 500);
  }
});

// Google OAuth callback
app.get("/api/google/callback", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");
  const state = c.req.query("state");

  console.log("[Google OAuth] Callback received:", { code: code ? "yes" : "no", state: state ? "yes" : "no", error });
  console.log("[Google OAuth] Env check:", {
    clientId: env.googleClientId ? "set" : "EMPTY",
    clientSecret: env.googleClientSecret ? "set" : "EMPTY",
    appUrl: env.appUrl,
  });

  if (error) {
    console.error("[Google OAuth] Error from Google:", error);
    return c.redirect("/login?error=google_denied", 302);
  }

  if (!code || !state) {
    return c.json({ error: "Missing code or state" }, 400);
  }

  try {
    const redirectUri = `${env.appUrl || "http://localhost:3000"}/api/google/callback`;
    console.log("[Google OAuth] Using redirectUri:", redirectUri);

    // Exchange code for token
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: redirectUri,
    });
    console.log("[Google OAuth] Token request body:", tokenBody.toString().replace(env.googleClientSecret, "[SECRET]"));

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      console.error("[Google OAuth] Token exchange failed:", tokenResp.status, text);
      return c.redirect("/login?error=token_exchange", 302);
    }

    const tokens = await tokenResp.json() as { access_token: string; id_token?: string };
    console.log("[Google OAuth] Token exchange success");

    // Get user info
    const userResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResp.ok) {
      console.error("[Google OAuth] User info failed:", userResp.status);
      return c.redirect("/login?error=user_info", 302);
    }

    const googleUser = await userResp.json() as { id: string; email: string; name: string; picture?: string };
    console.log("[Google OAuth] User info:", googleUser.email, googleUser.name);

    // Upsert user
    const db = getDb();
    console.log("[Google OAuth] DB connection OK");

    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.googleId, googleUser.id))
      .limit(1);
    console.log("[Google OAuth] Existing user:", existing.length > 0 ? "yes (id=" + existing[0].id + ")" : "no");

    let userId: number;

    if (existing.length > 0) {
      userId = existing[0].id;
      await db
        .update(schema.users)
        .set({
          name: googleUser.name,
          email: googleUser.email,
          avatar: googleUser.picture ?? null,
          lastSignInAt: new Date(),
        })
        .where(eq(schema.users.id, userId));
      console.log("[Google OAuth] Updated user:", userId);
    } else {
      const result = await db.insert(schema.users).values({
        googleId: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.picture ?? null,
        lastSignInAt: new Date(),
      });
      userId = Number(result[0].insertId);
      console.log("[Google OAuth] Created new user:", userId);
    }

    // Create session token
    const sessionToken = await new SignJWT({ sub: String(userId), type: "google" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);
    console.log("[Google OAuth] Session token created");

    // Set cookie
    const cookieVal = `${GOOGLE_COOKIE}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
    c.header("set-cookie", cookieVal);
    console.log("[Google OAuth] Cookie set, redirecting to /");

    return c.redirect("/", 302);
  } catch (err) {
    console.error("[Google OAuth] UNEXPECTED ERROR:", err);
    return c.redirect("/login?error=callback", 302);
  }
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

// Serve static frontend assets (must be AFTER API routes)
app.use("/assets/*", serveStatic({ root: "./dist/public" }));

// SPA fallback: serve the Vite-built index.html for any non-API route
// This serves the React app for routes like /login, /perfil, /admin, etc.
app.use("/*", async (c, next) => {
  const path = c.req.path;
  // Only handle non-API, non-asset routes
  if (path.startsWith("/api/") || path.startsWith("/assets/")) {
    return next();
  }
  try {
    const fs = await import("node:fs");
    const html = fs.readFileSync("./dist/public/index.html", "utf-8");
    return c.html(html);
  } catch {
    return c.html(
      `<!DOCTYPE html>
<html lang="pt"><head><meta charset="UTF-8"><title>MoodTrack</title></head>
<body><div id="root"></div><p>Loading...</p></body></html>`
    );
  }
});

export default app;

// Start server in an async function to avoid top-level await
// (top-level await + require() causes "Cannot determine intended module format" error)
async function start() {
  // Auto-create SQLite tables on startup
  if (isSQLite) {
    const { setupSQLite } = await import("../db/setup-sqlite");
    setupSQLite();
  }

  const { serve } = await import("@hono/node-server");
  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`[Server] Running on port ${port}`);
  });
}

start();