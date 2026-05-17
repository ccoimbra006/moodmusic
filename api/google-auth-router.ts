import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { env } from "./lib/env";

const JWT_SECRET = new TextEncoder().encode(env.appSecret || "moodtrack-google-secret-key");
const GOOGLE_COOKIE = "mt_google";

async function verifyGoogleToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload;
  } catch {
    return null;
  }
}

export { verifyGoogleToken, GOOGLE_COOKIE };

export const googleAuthRouter = createRouter({
  getUrl: publicQuery.query(() => {
    const clientId = env.googleClientId;
    if (!clientId) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Google Client ID not configured" });
    }
    const redirectUri = `${env.appUrl || "http://localhost:3000"}/api/google/callback`;
    const state = Buffer.from(redirectUri).toString("base64url");

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    return { url: url.toString() };
  }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req?.headers?.get("cookie");
    if (!authHeader) return null;

    const cookies = Object.fromEntries(
      authHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );

    const token = cookies[GOOGLE_COOKIE];
    if (!token) return null;

    const payload = await verifyGoogleToken(token);
    if (!payload?.sub) return null;

    const db = getDb();
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, Number(payload.sub)))
      .limit(1);

    if (users.length === 0) return null;

    const u = users[0];
    return {
      id: u.id,
      name: u.name ?? "Utilizador",
      email: u.email ?? "",
      avatar: u.avatar ?? undefined,
      role: u.role,
    };
  }),
});
