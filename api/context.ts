import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { verifyToken } from "./local-auth-router";
import { verifyGoogleToken, GOOGLE_COOKIE } from "./google-auth-router";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try Google OAuth
  try {
    const cookies = parseCookies(opts.req.headers.get("cookie"));
    const googleToken = cookies[GOOGLE_COOKIE];
    if (googleToken) {
      const payload = await verifyGoogleToken(googleToken);
      if (payload?.sub) {
        const db = getDb();
        const users = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, Number(payload.sub)))
          .limit(1);
        if (users.length > 0) {
          ctx.user = users[0];
        }
      }
    }
  } catch {
    // Google auth failed
  }

  // If no Google user, try local JWT token
  if (!ctx.user) {
    try {
      const authHeader = opts.req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const payload = await verifyToken(token);
        if (payload?.sub) {
          const db = getDb();
          const users = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, Number(payload.sub)))
            .limit(1);
          if (users.length > 0) {
            ctx.user = users[0];
          }
        }
      }
    } catch {
      // Local auth failed too — user stays undefined
    }
  }

  return ctx;
}
